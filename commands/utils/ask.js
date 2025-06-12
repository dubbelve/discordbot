const { SlashCommandBuilder } = require('@discordjs/builders');
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the command data
module.exports = {
  data: new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Send a prompt to ChatGPT and get a response.')
  .addStringOption(option =>
    option.setName('prompt')
      .setDescription('The prompt to send to ChatGPT')
      .setRequired(true)
  ),

  // Execute function that handles the command interaction
  async execute(interaction) {
    if (interaction.commandName === 'ask') {
      const prompt = interaction.options.getString('prompt');

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });

        const reply = response.choices[0].message.content.trim();
        await interaction.reply(`**Response from ChatGPT**: ${reply}`);
      } catch (error) {
        console.error('Error communicating with OpenAI:', error);
        await interaction.reply('An error occurred while processing your request.');
      }
    }
  },
};