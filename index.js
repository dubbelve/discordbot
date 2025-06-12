const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { token } = require('./config.json');
const arr = require('./assets/creepysad')
const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on('ready', async () => {
	client.user.setStatus('online'); // Ensures the bot is set to online
	console.log('Bot is online!');

	const upcomingAAAGames = [
		"The Elder Scrolls VI",
		"Grand Theft Auto VI",
		"Fable 4",
		"Metroid Prime 4",
		"Final Fantasy XVI"
	];

/*	setInterval(() => {
		const random = parseInt(Math.random() * 5)
		client.user.setPresence({ 
			activities: [{ 
				name: upcomingAAAGames[random], 
				type: ActivityType.Playing, 
			}], 
		});
	}, 5000);*/

	client.user.setPresence({ 
		activities: [{ 
			name: 'Destiny nombah one', 
			type: ActivityType.Custom, 
		}], 
	});
  });

client.on(Events.InteractionCreate, async interaction => {
	// Handle select menu for Destiny 2 user pick
	if (interaction.isStringSelectMenu() && interaction.customId === 'd2-user-pick') {
		try {
			await interaction.deferUpdate();
			const apiKey = process.env.BUNGIE_API_KEY;
			if (!apiKey) {
				return interaction.editReply({ content: 'Bungie API key is not set.', components: [] });
			}
			// Get the selected value (format: membershipType:membershipId)
			const [membershipType, membershipId] = interaction.values[0].split(':');

			// Get character IDs
			const profileUrl = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=200`;
			const profileResponse = await fetch(profileUrl, {
				headers: { 'X-API-Key': apiKey }
			});
			const profileData = await profileResponse.json();
			const characters = profileData.Response.characters.data;
			const characterIds = Object.keys(characters);
			if (characterIds.length === 0) {
				return interaction.editReply({ content: 'No characters found for this user.', components: [] });
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
				return interaction.editReply({ content: 'No recent activities found for this character.', components: [] });
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
				return interaction.editReply({ content: 'Could not find stats for the latest activity.', components: [] });
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

			// Format as a table in a code block
			const table =
`| Stat           | Value |
|----------------|-------|
| Kills          | ${kills} |
| Deaths         | ${deaths} |
| Assists        | ${assists} |
| K/D            | ${kd} |
| Orbs Created   | ${orbs} |
| PrecisionKills | ${precisionKills} |
| Score          | ${score} |`;

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle('Latest Activity Stats')
				.setDescription(`**Activity Instance:** ${latestActivity.activityDetails.instanceId}\n\n\`\`\`markdown\n${table}\n\`\`\``)
				.setTimestamp(new Date(latestActivity.period));

			await interaction.editReply({ content: '', embeds: [embed], components: [] });
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: 'An error occurred while fetching stats.', components: [] });
		}
		return;
	}

	// Existing slash command handler
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.login(token);