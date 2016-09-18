const Queue = require('bull');
const _ = require('lodash');

const emojiQueue = Queue('process_emoji_event', process.env.REDIS_PORT, '127.0.0.1');

const EventController = {};

EventController.handleEvent = (req, res) => {
  const type = req.body.type || '';

  if (type === 'url_verification') {
    return res.status(200).json({
      challenge: req.body.challenge,
    });
  } else if (type === 'event_callback') {
    const eventType = req.body.event.type;

    if (eventType === 'emoji_changed') {
      const subType = req.body.event.subtype;

      if (subType === 'add') {
        emojiQueue.add({
          type: 'add',
          name: req.body.event.name,
          value: req.body.event.value,
          team: req.team
        });
      } else if (subType === 'remove') {
        emojiQueue.add({
          type: 'remove',
          name: req.body.event.names[0],
          team: req.team
        });
      }

      return res.sendStatus(200);
    }
  } else {
    res.setHeader('X-Slack-No-Retry', 1);
    return res.sendStatus(400);
  }
};

module.exports = EventController;
