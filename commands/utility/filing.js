const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('filing')
        .setDescription('Post a filing')
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

        const newFiling = {
            docket,
            organisation,
            type,
            messageUrl: `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${response.id}`,
            timestamp: new Date().toISOString(),
            notes: optionalNotes || '',
            preview: mainBody.split(" ").slice(0, 5).join(" ") + (mainBody.split(" ").length > 5 ? '...' : '')
        };

        const filePath = path.join(dirPath, 'dockets.json');

        let index = [];
        try {
            index = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
            index = [];
        }

        index.push(newFiling);
        fs.writeFileSync(filePath, JSON.stringify(index, null, 4));
    },
};