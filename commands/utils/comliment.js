const { SlashCommandBuilder } = require('@discordjs/builders');
const comliments = require('../../assets/compliments');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('compliment')
        .setDescription('Compliment someone')
		.addUserOption(option =>
            option.setName('user')
                .setDescription('Pick a user')
                .setRequired(true)
        ),
    async execute(interaction) {
		const userToTag = interaction.options.getUser('user');
		const comliment = comliments[Math.floor(Math.random() * 20)]
		const withName = comliment.replaceAll('{name}', userToTag)
        await interaction.reply('>>> ' + withName);
    },
};