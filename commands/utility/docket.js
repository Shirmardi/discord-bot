const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch').default;

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('search-fcc')
        .setDescription('Search for FCC filings')
        .addStringOption(option =>
            option.setName('docket_id')
                .setDescription('The docket number to search for')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('keyword')
                .setDescription('Search for keyword in AI analysis')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Search in description content')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('date_from')
                .setDescription('Start date (YYYY-MM-DD)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('date_to')
                .setDescription('End date (YYYY-MM-DD)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('id')
                .setDescription('Search for specific filing ID')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        // Build query parameters
        const params = new URLSearchParams();
        const options = interaction.options;
        
        if (options.getString('docket_id')) params.append('docket_id', options.getString('docket_id'));
        if (options.getString('keyword')) params.append('keyword', options.getString('keyword'));
        if (options.getString('description')) params.append('description', options.getString('description'));
        if (options.getString('date_from')) params.append('date_from', options.getString('date_from'));
        if (options.getString('date_to')) params.append('date_to', options.getString('date_to'));
        if (options.getString('id')) params.append('id', options.getString('id'));

        try {
            const response = await fetch(`https://justin.cv/api/fcc-filings?${params.toString()}`);
            const result = await response.json();

            console.log('API Response:', JSON.stringify(result, null, 2));

            if (!result || typeof result !== 'object') {
                return await interaction.editReply('Invalid response from the server.');
            }

            if (!Array.isArray(result.data.successful_filings)) {
                console.error('Expected array in result.data, got:', typeof result.data.successful_filings);
                return await interaction.editReply('Error: Unexpected response format from the server.');
            }

            if (result.data.successful_filings.length === 0) {
                return await interaction.editReply('No filings found matching your search criteria.');
            }

            const formattedResults = result.data.successful_filings.map(filing => {
                if (!filing || typeof filing !== 'object') {
                    console.error('Invalid filing object:', filing);
                    return 'Invalid filing data';
                }

                const date = filing.created_at ? new Date(filing.created_at).toLocaleDateString() : 'Unknown date';
                const description = filing.description 
                    ? (filing.description.length > 80 ? filing.description.substring(0, 77) + '...' : filing.description)
                    : 'No description available';
                const pdfUrl = filing.original_pdf_url || '#';

                return `[🔗 ${date} - ${description}](${pdfUrl})`;
            }).join('\n');

            const summary = `Found ${result.successful || result.data.successful_filings.length} filing(s):\n\n${formattedResults}`;
            
            // Discord has a 2000 character limit for messages
            if (summary.length > 2000) {
                const truncated = summary.substring(0, 1997) + '...';
                await interaction.editReply(truncated);
            } else {
                await interaction.editReply(summary);
            }
        } catch (error) {
            console.error('Error fetching filings:', error);
            await interaction.editReply('Error fetching filing data. Please try again later.');
        }
    },
};
