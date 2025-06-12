const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { token } = require('./config.json');
const arr = require('./assets/creepysad')

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