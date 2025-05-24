const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('docket')
        .setDescription('Search for filings by docket number')
        .addStringOption(option =>
            option.setName('docket')
                .setDescription('The docket number to search for')
                .setRequired(true)),

    async execute(interaction) {
        const searchDocket = interaction.options.getString('docket');
        await interaction.deferReply();

        const filePath = path.join(__dirname, '../resources/dockets.json');
        let index = [];

        try {
            index = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
            return await interaction.editReply('No indexed filings available.');
        }

        const searchResults = index.filter(entry => entry.docket?.toLowerCase() === searchDocket.toLowerCase());

        if (searchResults.length) {
            const formatted = searchResults.map(entry =>
                `**${entry.organisation}: ${entry.type}** "${entry.preview}" [Go](${entry.messageUrl})`
            ).join('\n');

            await interaction.editReply(`Found ${searchResults.length} result(s) for docket **${searchDocket}**:\n\n${formatted}`);
        } else {
            await interaction.editReply(`No filings found for **${searchDocket}**.`);
        }
    },
};
