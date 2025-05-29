const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('filing')
        .setDescription('Save a filing')
        .addStringOption(option =>
            option.setName('organisation')
                .setDescription('Organisation (FCC, ITU, ECFS, etc)')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('link')
                .setDescription('Add a link to the related filing (PDF, image)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('docket')
                .setDescription('Docket number')
                .setRequired(true)),

    async execute(interaction) {
        const organisation = interaction.options.getString('organisation');
        const attachment = interaction.options.getAttachment('link');
        const docket = interaction.options.getString('docket');

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
        };

        try {
            const apiResponse = await fetch('https://justin.cv/api/docket-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.API_KEY
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