const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('latestactivity')
        .setDescription('Get the latest activity of a user')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Destiny 2 username (e.g., PlayerName#1234)')
                .setRequired(true)),
    async execute(interaction) {
        const username = interaction.options.getString('username');
        await interaction.deferReply();

        const apiKey = process.env.BUNGIE_API_KEY;
        if (!apiKey) {
            return interaction.editReply('Bungie API key is not set.');
        }

        // Search for Destiny 2 users matching the username
        const searchUrl = `https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/-1/${encodeURIComponent(username)}/`;
        const searchResponse = await fetch(searchUrl, {
            headers: { 'X-API-Key': apiKey }
        });
        const searchData = await searchResponse.json();

        if (!searchData.Response || searchData.Response.length === 0) {
            return interaction.editReply('No Destiny 2 user found with that username.');
        }

        if (searchData.Response.length > 1) {
            // Multiple users found, present a select menu
            const options = searchData.Response.map(user => ({
                label: `${user.displayName} (${user.membershipType})`,
                description: `Membership ID: ${user.membershipId}`,
                value: `${user.membershipType}:${user.membershipId}`
            }));
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('d2-user-pick')
                .setPlaceholder('Select the correct Destiny 2 user')
                .addOptions(options);
            const row = new ActionRowBuilder().addComponents(selectMenu);
            return interaction.editReply({ content: 'Multiple users found. Please select the correct one:', components: [row] });
        }

        // Use the first user found (only one user)
        const user = searchData.Response[0];
        const membershipType = user.membershipType;
        const membershipId = user.membershipId;

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
            .setTitle('Latest Activity Stats')
            .setDescription(`**Activity Instance:** ${latestActivity.activityDetails.instanceId}\n\n${statText}`)
            .setTimestamp(new Date(latestActivity.period));

        await interaction.editReply({ embeds: [embed] });
    },
};