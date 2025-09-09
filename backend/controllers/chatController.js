const { OpenAI } = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Sample FAQ data
const faqData = [
    {
        question: "What are your business hours?",
        answer: "We're open Monday to Friday from 9 AM to 5 PM EST."
    },
    {
        question: "How can I contact support?",
        answer: "You can reach our support team at support@company.com or call us at (555) 123-4567."
    },
    {
        question: "Do you offer refunds?",
        answer: "Yes, we offer a 30-day money-back guarantee on all our products."
    },
    {
        question: "Where is your company located?",
        answer: "Our headquarters is located at 123 Main Street, New York, NY 10001."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, PayPal, and bank transfers."
    }
];

// Simple keyword matching function
function findAnswerByKeywords(userQuery) {
    const query = userQuery.toLowerCase();

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

// Handle chat messages
const handleChatMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // First try keyword matching
        const keywordAnswer = findAnswerByKeywords(message);
        if (keywordAnswer) {
            return res.json(keywordAnswer);
        }

        // If no keyword match, use OpenAI
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful customer support assistant. Answer based on the following FAQs: " +
                            JSON.stringify(faqData) +
                            "If you don't know the answer, say 'I don't have information about that yet. Our team will get back to you soon.'"
                    },
                    { role: "user", content: message }
                ],
                max_tokens: 150,
                temperature: 0.7
            });

            const answer = completion.choices[0].message.content;
            res.json({ answer, source: 'openai' });
        } catch (error) {
            console.error('OpenAI API error:', error);
            res.json({
                answer: "I'm having trouble connecting to our knowledge base. Please try again later.",
                source: 'error'
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    handleChatMessage
};