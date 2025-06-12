const { SlashCommandBuilder } = require('@discordjs/builders');
const comliments = require('../../assets/compliments');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leviosah')
        .setDescription('Accio buuuuum'),
    async execute(interaction) {
        await interaction.reply(`https://media.discordapp.net/attachments/1062862401545965580/1308783094387445840/1A8148921ED866CCD3DB276625418C71AB5500EE.png?ex=67486d3d&is=67471bbd&hm=81bcda25e88fdf0cb5b4c1b4e00ed70aeb6790adb67171797f147d76e7ee9f01&=&format=webp&quality=lossless`);
    },
};