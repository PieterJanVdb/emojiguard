const Queue = require('bull');
const _ = require('lodash');

const emojiQueue = Queue('process_emoji_action', process.env.REDIS_PORT, '127.0.0.1');

const ActionController = {};

ActionController.handleAction = (req, res) => {
  const payload = req.body;
  const type = payload.callback_id || '';

  if (type === 'emoji_action') {
    emojiQueue.add({
      type: payload.actions[0].name,
      value: payload.actions[0].value,
      team: req.team,
      channel: payload.channel.id,
      message_ts: payload.message_ts,
      message: payload.original_message
    });

    return res.json(payload.original_message); 
  } else {
    return res.sendStatus(200);
  }
};

module.exports = ActionController;
