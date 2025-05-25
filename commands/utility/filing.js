const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { api_key } = require('../config.json');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('filing')
        .setDescription('Save a filing')
        .addStringOption(option =>
            option.setName('organisation')
                .setDescription('Organisation')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('OET, Notice, comment etc')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('main-body')
                .setDescription('The main contents of the filing')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('docket')
                .setDescription('Docket number')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('attachment')
                .setDescription('Upload a related file (PDF, image, etc.)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('optional-notes')
                .setDescription('Keywords, hashtags etc')
                .setRequired(false)),

    async execute(interaction) {
        const organisation = interaction.options.getString('organisation');
        const type = interaction.options.getString('type');
        const mainBody = interaction.options.getString('main-body');
        const docket = interaction.options.getString('docket');
        const attachment = interaction.options.getAttachment('attachment');
        const optionalNotes = interaction.options.getString('optional-notes');

        const embed = new EmbedBuilder()
            .setTitle('📡 Filing Submitted')
            .setColor(0x1E90FF)
            .addFields(
                { name: 'Organisation', value: organisation, inline: true },
                { name: 'Type', value: type, inline: true },
                ...(docket ? [{ name: 'Docket Number', value: docket }] : []),
                { name: 'Main Body', value: mainBody },
                ...(optionalNotes ? [{ name: '📌 Notes', value: optionalNotes }] : [])
            );

        if (attachment) {
            embed.addFields({ name: 'Attachment', value: `[View File](${attachment.url})` });
            if (attachment.contentType?.startsWith('image/')) {
                embed.setImage(attachment.url);
            }
        }

        await interaction.reply({ embeds: [embed] });
        const response = await interaction.fetchReply();

        const dirPath = path.join(__dirname, '../resources');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }

        const filingData = {
            docket,
            organisation,
            type,
            messageUrl: `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${response.id}`,
            timestamp: new Date().toISOString(),
            notes: optionalNotes || '',
            preview: mainBody.split(" ").slice(0, 5).join(" ") + (mainBody.split(" ").length > 5 ? '...' : '')
        };

        try {
            const apiResponse = await fetch('https://justin.cv/api/docket-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': api_key
                },
                body: JSON.stringify(filingData)
            });

            if (!apiResponse.ok) {
                throw new Error(`API request failed with status ${apiResponse.status}`);
            }

            const result = await apiResponse.json();
            console.log('Docket data created successfully:', result);
        } catch (error) {
            console.error('Error sending filing to API:', error);
            await interaction.followUp({ 
                content: '⚠️ The filing was posted but there was an error saving it to the database. Please contact an administrator.',
                ephemeral: true 
            });
        }
    },
};