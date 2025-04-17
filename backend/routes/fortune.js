const express = require('express');
const router = express.Router();
const fortuneController = require('../controllers/fortuneController');

// POST /api/fortune
router.post('/', fortuneController.getFortune);

module.exports = router;
