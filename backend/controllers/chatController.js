const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Load FAQ data from external JSON file
const faqPath = path.join(__dirname, 'faqData.json');
let faqData = [];

try {
    const rawData = fs.readFileSync(faqPath, 'utf-8');
    faqData = JSON.parse(rawData);
    console.log(`Loaded ${faqData.length} FAQ entries.`);
} catch (error) {
    console.error('Error loading FAQ data:', error);
    faqData = [];
}

// Enhanced keyword matching function
function findAnswerByKeywords(userQuery) {
    const query = userQuery.toLowerCase();

    // Check for greetings
    if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
        return { answer: "Hello! How can I assist you today?", source: 'keyword' };
    }

    // Check for gratitude
    if (query.includes('thank') || query.includes('thanks')) {
        return { answer: "You're welcome! Let me know if you have any more questions.", source: 'keyword' };
    }

    // Match FAQ entries by keywords
    for (const faq of faqData) {
        const keywords = faq.question.toLowerCase().split(' ');
        const hasMatch = keywords.some(keyword =>
            query.includes(keyword) && keyword.length > 3
        );

        if (hasMatch) {
            return { answer: faq.answer, source: 'keyword' };
        }
    }

    return null;
}

// Handle incoming chat messages
const handleChatMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Attempt keyword-based matching first
        const keywordAnswer = findAnswerByKeywords(message);
        if (keywordAnswer) {
            return res.json(keywordAnswer);
        }

        // If no match, query OpenAI
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful customer support assistant for "Company Name". Use the following FAQs to answer user queries when applicable:\n${JSON.stringify(faqData, null, 2)}\nIf you don't know the answer, say "I don't have information about that yet. Our team will get back to you soon." Keep responses friendly, concise, and helpful.`
                    },
                    { role: "user", content: message }
                ],
                max_tokens: 200,
                temperature: 0.7
            });

            const answer = completion.choices[0].message.content.trim();
            return res.json({ answer, source: 'openai' });
        } catch (error) {
            console.error('OpenAI API error:', error);
            return res.json({
                answer: "I'm currently experiencing technical issues. Please try again later or contact support at support@company.com.",
                source: 'error'
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: "Something went wrong. Please try again later."
        });
    }
};

module.exports = {
    handleChatMessage
};
