const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');
const insults = require('../../assets/insults');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('insult')
        .setDescription('Insult someone')
		.addUserOption(option =>
            option.setName('user')
                .setDescription('Pick a user')
                .setRequired(true)
        ),
    async execute(interaction) {
		const user = interaction.options.getUser('user');
		const insult = insults[Math.floor(Math.random() * 20)]
		const withName = insult.replaceAll('{name}', user)
        await interaction.reply('>>> ' + withName);
    },
};