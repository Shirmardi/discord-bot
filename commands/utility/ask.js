const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiting configuration
const RATE_LIMIT = {
    maxRequests: 10,
    timeWindow: 10 * 60 * 1000, // 10 minutes in milliseconds
};

// Store user request timestamps
const userRequests = new Map();

// Clean up old requests periodically
setInterval(() => {
    const now = Date.now();
    for (const [userId, timestamps] of userRequests.entries()) {
        const validTimestamps = timestamps.filter(time => now - time < RATE_LIMIT.timeWindow);
        if (validTimestamps.length === 0) {
            userRequests.delete(userId);
        } else {
            userRequests.set(userId, validTimestamps);
        }
    }
}, 60000); // Clean up every minute

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask a question and get an AI-powered response')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('What would you like to know?')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const now = Date.now();

        // Get user's request timestamps
        const userTimestamps = userRequests.get(userId) || [];
        
        // Remove timestamps older than the time window
        const validTimestamps = userTimestamps.filter(time => now - time < RATE_LIMIT.timeWindow);
        
        // Check if user has exceeded rate limit
        if (validTimestamps.length >= RATE_LIMIT.maxRequests) {
            const oldestRequest = validTimestamps[0];
            const timeLeft = Math.ceil((RATE_LIMIT.timeWindow - (now - oldestRequest)) / 1000 / 60);
            return await interaction.editReply(`Rate limit exceeded. You can use this command ${RATE_LIMIT.maxRequests} times every ${RATE_LIMIT.timeWindow / 1000 / 60} minutes. Please try again in ${timeLeft} minutes.`);
        }

        // Add current request timestamp
        validTimestamps.push(now);
        userRequests.set(userId, validTimestamps);

        const question = interaction.options.getString('question');

        try {
            // Get the Gemini Pro model
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

            // Generate content
            const result = await model.generateContent(question);
            const response = await result.response;
            const text = response.text();

            // Truncate to 2000 characters if needed
            const truncatedText = text.length > 2000 
                ? text.substring(0, 1997) + '...' 
                : text;

            await interaction.editReply(truncatedText);
        } catch (error) {
            console.error('Error querying Gemini:', error);
            await interaction.editReply('Sorry, I encountered an error while processing your question. Please try again later.');
        }
    },
}; 