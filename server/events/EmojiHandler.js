const Queue = require('bull');
const download = require('download');
const fs = require('fs-promise');
const request = require('request-promise');

const emojiQueue = Queue('process_emoji_event', 6379, '127.0.0.1');

const EmojiHandler = {};

EmojiHandler.init = () => {
  emojiQueue.process(job => {
    if (job.data.type === 'add') return EmojiHandler.processAdded(job.data);
    else if (job.data.type === 'remove') return EmojiHandler.processRemoved(job.data);
    else Promise.resolve();
  });

  emojiQueue.on('error', err => console.error('EmojiHandler: ', err));
  emojiQueue.on('completed', job => job.remove());
  emojiQueue.on('failed', (job, err) => {
    console.error('emojiQueue failed: ', err);
    job.remove();
  });
}

EmojiHandler.processAdded = emoji => {
  return new Promise((resolve, reject) => {
    if (!emoji.value || !emoji.name || !emoji.team) reject('emoji object incomplete');

    const splitted = emoji.value.split('.');
    const extension = splitted[splitted.length - 1];
    const path = global.rootPath + '/emojis/' + emoji.team.ID + '/' + emoji.name + '.' + extension;

    download(emoji.value)
      .then(data => fs.outputFile(path, data))
      .then(() => resolve())
      .catch(err => reject(err));
  });
};

EmojiHandler.processRemoved = emoji => {
  return new Promise((resolve, reject) => {
    if (!emoji.name || !emoji.team) reject('emoji object incomplete');

    const message = {
      "text": "*The following emoji has been removed:* _" + emoji.name + "_",
      "attachments": [
        {
          "text": "Would you like me to add the emoji back?",
          "fallback": "You are unable to choose an action",
          "callback_id": "emoji_action",
          "color": "warning",
          "actions": [
            {
              "name": "yes",
              "text": "Yes",
              "type": "button",
              "style": "primary",
              "value": emoji.name
            },
            {
              "name": "no",
              "text": "No",
              "type": "button",
              "value": emoji.name
            }
          ]
        }
      ]
    };

    const payload = {
      "token": emoji.team.access_token,
      "channel": process.env.CHANNEL,
      "text": message.text,
      "attachments": JSON.stringify(message.attachments)
    };

    const options = {
      method: 'POST',
      uri: 'https://slack.com/api/chat.postMessage',
      formData: payload
    };

    request(options)
      .then(parsedBody => resolve())
      .catch(err => reject(err));
  });
};

module.exports = EmojiHandler;
