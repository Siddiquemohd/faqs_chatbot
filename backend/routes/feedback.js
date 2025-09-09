const express = require('express');
const { handleFeedback } = require('../controllers/feedbackController');
const router = express.Router();

router.post('/', handleFeedback);

module.exports = router;