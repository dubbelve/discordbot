const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pst')
    .setDescription('Converts a time input to PST and returns it with an AM/PM suffix.')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('The time in HH:mm format (e.g., 19:00)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const inputTime = interaction.options.getString('time');

    // Validate that the input is in the correct time format (HH:mm)
    if (!/^([01][0-9]|2[0-3]):([0-5][0-9])$/.test(inputTime)) {
      return interaction.reply('Invalid time format. Please enter a time in HH:mm format (e.g., 19:00).');
    }

    // Parse the input time as a dayjs object and convert to PST
    const today = dayjs().format('YYYY-MM-DD')
    const parsedTime = dayjs(today + ' ' + inputTime, 'HH:mm').tz('America/Los_Angeles');
    const formattedTime = parsedTime.format('hh:mm A'); // Formats as "7:00 PM"

    return interaction.reply(`The time in PST is: ${formattedTime}`);
  },
};