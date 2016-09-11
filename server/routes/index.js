const express = require('express');
const router = express.Router();
const EmojiController = require('../controllers/EmojiController');
const AuthController = require('../controllers/AuthController');

router.get('/ping', (req, res) => res.send('pong'));
router.get('/action-endpoint', EmojiController.handleAction);
router.get('/auth-team', AuthController.authTeam);

module.exports = router;
