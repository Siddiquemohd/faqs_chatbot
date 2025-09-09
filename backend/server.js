const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Sample FAQ data for common questions
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
        answer: "Our headquarters is at 123 Main Street, Anytown, USA."
    },
    {
        question: "What products do you offer?",
        answer: "We offer software solutions, consulting services, and digital products."
    }
];

// Enhanced keyword matching function
function findAnswerByKeywords(userQuery) {
    const query = userQuery.toLowerCase().trim();

    // Check for greetings
    if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
        return "Hello! How can I help you today?";
    }

    // Check for thanks
    if (query.includes('thank') || query.includes('thanks')) {
        return "You're welcome! Is there anything else I can help with?";
    }

    // Check for specific FAQ questions
    for (const faq of faqData) {
        const keywords = faq.question.toLowerCase().split(' ');
        const hasMatch = keywords.some(keyword =>
            query.includes(keyword) && keyword.length > 3
        );

        if (hasMatch) {
            return faq.answer;
        }
    }

    return null;
}

// Route to handle chat messages
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // First try keyword matching for common questions
        const keywordAnswer = findAnswerByKeywords(message);
        if (keywordAnswer) {
            return res.json({ answer: keywordAnswer, source: 'keyword' });
        }

        // If no keyword match, use OpenAI for general conversation
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful, friendly customer support assistant for a company called "Company Name". 
                        Be conversational and helpful. If you need information about the company, use these FAQs as reference:
                        ${JSON.stringify(faqData)}
                        
                        For general questions, be helpful and informative. If you don't know something, 
                        be honest and suggest contacting support at support@company.com.
                        
                        Keep responses concise and friendly (1-2 paragraphs maximum).`
                    },
                    { role: "user", content: message }
                ],
                max_tokens: 200,
                temperature: 0.7
            });

            const answer = completion.choices[0].message.content;
            res.json({ answer, source: 'openai' });
        } catch (error) {
            console.error('OpenAI API error:', error);
            // Provide a friendly fallback response instead of error message
            res.json({
                answer: "I'd be happy to help with that! For detailed assistance, please contact our support team at support@company.com or call (555) 123-4567.",
                source: 'fallback'
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            answer: "I'm here to help! Please try again or contact our support team for assistance.",
            source: 'error'
        });
    }
});

// Store unanswered questions for improvement
app.post('/api/feedback', (req, res) => {
    const { question, helpful, answer } = req.body;
    console.log(`Feedback: Question="${question}", Helpful=${helpful}, Answer="${answer}"`);
    res.json({ status: 'success', message: 'Thank you for your feedback!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});