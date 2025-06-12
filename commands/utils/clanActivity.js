const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fetch = require('node-fetch');

const CLAN_GROUP_ID = '1988440';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clanactivity')
        .setDescription('Get the latest activity of a Swedish Dead Zone clan member by partial username')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Partial Bungie username (case-insensitive, e.g., Player)')
                .setRequired(true)),
    async execute(interaction) {
        const partial = interaction.options.getString('username').toLowerCase();
        await interaction.deferReply();
        const apiKey = process.env.BUNGIE_API_KEY;
        if (!apiKey) {
            return interaction.editReply('Bungie API key is not set.');
        }

        // 1. Fetch all clan members
        const membersUrl = `https://www.bungie.net/Platform/GroupV2/${CLAN_GROUP_ID}/Members/`;
        const membersResponse = await fetch(membersUrl, {
            headers: { 'X-API-Key': apiKey }
        });
        const membersData = await membersResponse.json();
        if (!membersData.Response || !membersData.Response.results) {
            return interaction.editReply('Could not fetch clan members.');
        }
        const members = membersData.Response.results;

        // 2. Filter by partial username (case-insensitive)
        const matches = members.filter(m =>
            m.destinyUserInfo &&
            m.destinyUserInfo.displayName &&
            m.destinyUserInfo.displayName.toLowerCase().includes(partial)
        );
        if (matches.length === 0) {
            return interaction.editReply('No clan members found matching that username.');
        }
        if (matches.length > 1) {
            // 3. Present a select menu
            const options = matches.slice(0, 25).map(m => ({
                label: m.destinyUserInfo.displayName,
                description: `Membership ID: ${m.destinyUserInfo.membershipId}`,
                value: `${m.destinyUserInfo.membershipType}:${m.destinyUserInfo.membershipId}`
            }));
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('clan-user-pick')
                .setPlaceholder('Select the correct clan member')
                .addOptions(options);
            const row = new ActionRowBuilder().addComponents(selectMenu);
            return interaction.editReply({ content: 'Multiple clan members found. Please select:', components: [row] });
        }

        // 4. Only one match, fetch and display stats
        const user = matches[0].destinyUserInfo;
        await fetchAndReplyStats(interaction, user.membershipType, user.membershipId, user.displayName, apiKey);
    },
};

// Helper function to fetch and reply with stats
async function fetchAndReplyStats(interaction, membershipType, membershipId, displayName, apiKey) {
    // Get character IDs
    const profileUrl = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=200`;
    const profileResponse = await fetch(profileUrl, {
        headers: { 'X-API-Key': apiKey }
    });
    const profileData = await profileResponse.json();
    const characters = profileData.Response.characters.data;
    const characterIds = Object.keys(characters);
    if (characterIds.length === 0) {
        return interaction.editReply('No characters found for this user.');
    }
    // Use the most recently played character
    let mostRecentCharId = characterIds[0];
    let mostRecentDate = new Date(characters[mostRecentCharId].dateLastPlayed);
    for (const charId of characterIds) {
        const lastPlayed = new Date(characters[charId].dateLastPlayed);
        if (lastPlayed > mostRecentDate) {
            mostRecentCharId = charId;
            mostRecentDate = lastPlayed;
        }
    }

    // Get recent activities for the character
    const activitiesUrl = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Account/${membershipId}/Character/${mostRecentCharId}/Stats/Activities/?count=1`;
    const activitiesResponse = await fetch(activitiesUrl, {
        headers: { 'X-API-Key': apiKey }
    });
    const activitiesData = await activitiesResponse.json();
    const activities = activitiesData.Response.activities;
    if (!activities || activities.length === 0) {
        return interaction.editReply('No recent activities found for this character.');
    }
    const latestActivity = activities[0];

    // Get Post Game Carnage Report for the latest activity
    const pgcrUrl = `https://www.bungie.net/Platform/Destiny2/Stats/PostGameCarnageReport/${latestActivity.activityDetails.instanceId}/`;
    const pgcrResponse = await fetch(pgcrUrl, {
        headers: { 'X-API-Key': apiKey }
    });
    const pgcrData = await pgcrResponse.json();
    const entry = pgcrData.Response.entries.find(e => e.characterId === mostRecentCharId);
    if (!entry) {
        return interaction.editReply('Could not find stats for the latest activity.');
    }

    // Extract stats
    const stats = entry.values;
    const kills = stats.kills.basic.value;
    const deaths = stats.deaths.basic.value;
    const assists = stats.assists.basic.value;
    const kd = stats.killsDeathsRatio.basic.value;
    const orbs = stats.orbsDropped ? stats.orbsDropped.basic.value : 0;
    const precisionKills = stats.precisionKills ? stats.precisionKills.basic.value : 0;
    const score = stats.score ? stats.score.basic.value : 0;

    // Format as a markdown list
    const statLines = [
        `**Kills:** ${kills}`,
        `**Deaths:** ${deaths}`,
        `**Assists:** ${assists}`,
        `**K/D:** ${kd}`,
        `**Orbs Created:** ${orbs}`,
        `**Precision Kills:** ${precisionKills}`,
        `**Score:** ${score}`
    ];
    const statText = statLines.join('\n');

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Latest Activity Stats for ${displayName}`)
        .setDescription(`**Activity Instance:** ${latestActivity.activityDetails.instanceId}\n\n${statText}`)
        .setTimestamp(new Date(latestActivity.period));

    await interaction.editReply({ content: '', embeds: [embed], components: [] });
} 