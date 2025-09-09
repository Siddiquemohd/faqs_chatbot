const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Load FAQ data
let faqData = [];
try {
    const faqPath = path.join(__dirname, '../data/faqData.json');
    const rawData = fs.readFileSync(faqPath, 'utf-8');
    faqData = JSON.parse(rawData);
    console.log(`Loaded ${faqData.length} FAQ entries.`);
} catch (error) {
    console.error('Error loading FAQ data:', error);
}

// Simple keyword matching
function findAnswerByKeywords(userQuery) {
    const query = userQuery.toLowerCase().trim();

    // Greetings
    if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
        return { answer: "Hello! How can I help you today?", source: 'keyword' };
    }

    // Thanks
    if (query.includes('thank')) {
        return { answer: "You're welcome! Do you have any other questions?", source: 'keyword' };
    }

    // Match FAQ questions
    for (const faq of faqData) {
        const keywords = faq.question.toLowerCase().split(' ');
        const hasMatch = keywords.some(kw => query.includes(kw) && kw.length > 3);
        if (hasMatch) {
            return { answer: faq.answer, source: 'keyword' };
        }
    }

    return null;
}

// Chat endpoint
router.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Try keyword matching first
    const keywordAnswer = findAnswerByKeywords(message);
    if (keywordAnswer) {
        return res.json(keywordAnswer);
    }

    // Fallback to OpenAI
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful customer support assistant. 
          Answer based on the following FAQs: ${JSON.stringify(faqData)}.
          If you don't know an answer, reply politely and suggest contacting support at support@company.com.`
                },
                { role: 'user', content: message }
            ],
            max_tokens: 200,
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
});

// Feedback endpoint
router.post('/feedback', (req, res) => {
    const { question, helpful, answer } = req.body;
    console.log(`Feedback: Question="${question}", Helpful=${helpful}, Answer="${answer}"`);
    res.json({ status: 'success', message: 'Thank you for your feedback!' });
});

module.exports = router;
