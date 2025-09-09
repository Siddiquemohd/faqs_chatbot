// Store unanswered questions for improvement
const handleFeedback = (req, res) => {
    try {
        const { question, helpful, answer } = req.body;

        // In a real application, you would save this to a database
        console.log(`Feedback: Question="${question}", Helpful=${helpful}, Answer="${answer}"`);

        res.json({
            status: 'success',
            message: 'Feedback received. Thank you!'
        });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: 'Failed to process feedback' });
    }
};

module.exports = {
    handleFeedback
};