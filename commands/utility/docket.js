const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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
        const docketId = interaction.options.getString('docket');
        await interaction.deferReply();

        let index = [];
        try {
            const response = await fetch('https://justin.cv/api/docket-data');
            const result = await response.json();
            index = result.data;
        } catch (error) {
            return await interaction.editReply('Error fetching docket data.');
        }

        const searchResults = index.filter(entry => entry.docket?.toLowerCase() === docketId.toLowerCase());

        if (searchResults.length) {
            const formattedStr = searchResults.map(entry =>
                `**${entry.organisation}: ${entry.type}** "${entry.preview}" [Go](${entry.messageUrl})`
            ).join('\n');

            await interaction.editReply(`Found ${searchResults.length} result(s) for docket **${docketId}**:\n\n${formattedStr}`);
        } else {
            await interaction.editReply(`No filings found for **${docketId}**.`);
        }
    },
};
