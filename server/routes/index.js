const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const ActionController = require('../controllers/ActionController');
const AuthController = require('../controllers/AuthController');
const EventController = require('../controllers/EventController');

router.get('/ping', (req, res) => res.send('pong'));
router.get('/action', ActionController.handleAction);
router.get('/auth-team', AuthController.authTeam);
router.post('/event', middleware.verifySlack, middleware.fetchTeamFromId, EventController.handleEvent);

module.exports = router;
