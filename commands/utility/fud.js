const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fud')
        .setDescription('Classic TMF'),

    async execute(interaction) {
        const quotes = [
            "It will never unfold!",
            "At this point the more likely takeaway from AST's silence is it didn't work",
            "AT&T isn't investing",
            "The #cluelesscult continue to be clueless: Starlink has fewer interference concerns",
            "The regulator doesn't even propose to approve your planned spectrum",
            "AST has made no progress in 7 months",
            "They haven't even been able to show the link closes yet, let alone what the speed might be"
        ];

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        await interaction.reply(randomQuote);
    },
};
