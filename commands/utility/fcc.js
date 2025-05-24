const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('fcc')
        .setDescription('Post FCC filing')
        .addStringOption(option =>
            option.setName('organisation')
                .setDescription('ITU or whatever')
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
            option.setName('optional-notes')
                .setDescription('Extra notes')
                .setRequired(false)
        ),
    async execute(interaction) {
        const organisation = interaction.options.getString('organisation');
        const type = interaction.options.getString('type');
        const mainBody = interaction.options.getString('main-body');
        const optionalNotes = interaction.options.getString('optional-notes');

        const formattedMessage = `**FCC Filing Submitted**
        
**Organisation**: ${organisation}
**Type**: ${type}
**Main Body**:
${mainBody}

${optionalNotes ? `**Notes**:\n${optionalNotes}` : ''}`;

        await interaction.reply({ content: formattedMessage, ephemeral: false });
    },
};
