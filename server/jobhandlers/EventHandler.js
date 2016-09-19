const Queue = require('bull');
const download = require('download');
const fs = require('fs-promise');
const request = require('request-promise');
const glob = require('glob-promise');
const moment = require('moment');

const emojiQueue = Queue('process_emoji_event', process.env.REDIS_PORT, '127.0.0.1');

const EventHandler = {};

/**
 * @description Starts processing jobs from the 'process_emoji_event' queue
 * and handles completion or failure of jobs.
 */
EventHandler.init = () => {
  emojiQueue.process(job => {
    if (job.data.type === 'add') return processAdded(job.data);
    else if (job.data.type === 'remove') return processRemoved(job.data);
    else Promise.resolve();
  });

  emojiQueue.on('error', err => console.error('EventHandler: ', err));
  emojiQueue.on('completed', job => job.remove());
  emojiQueue.on('failed', (job, err) => {
    console.error('ActionHandler|emojiQueue failed: ', err);
    job.remove();
  });
};

/**
 * @description Processes jobs for newly added emojis. It'll download
 * the file and save it into a folder named after the team_id.
 * @param {Object} emoji
 * @return {Promise}
 */
function processAdded(emoji) {
  return new Promise((resolve, reject) => {
    if (!emoji.value || !emoji.name || !emoji.team) reject('emoji object incomplete');

    const splitted = emoji.value.split('.');
    const extension = splitted[splitted.length - 1];

    const path = `${global.rootPath}/emojis/${emoji.team.ID}/${emoji.name}-${+Date.now()}.${extension}`;

    download(emoji.value)
      .then(data => fs.outputFile(path, data))
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

/**
 * @description Processes jobs for removed emojis. It'll post an interactive
 * message to a channel, giving users the option of either adding the emoji
 * again, or removing it. However if the emoji couldn't be found on the server,
 * it won't give the user any interactive options.
 * @param {Object} emoji
 * @return {Promise}
 */
function processRemoved(emoji) {
  return new Promise((resolve, reject) => {
    if (!emoji.name || !emoji.team) reject('emoji object incomplete');

    const globPath = `${global.rootPath}/emojis/${emoji.team.ID}/${emoji.name}-*.*`;

    glob(globPath)
      .then(contents => {
        if (!contents.length) return createOptions(emoji.team, null, emoji.name, true);

        const timestamp = contents.reduce((prev, curr) => {
          const nameWExtension = curr.split('-').pop();
          const ts = nameWExtension.split('.')[0];

          if (!moment.unix(ts).isValid()) return 0;

          return ts > prev ? ts : prev;
        }, 0);

        if (timestamp === 0) return createOptions(emoji.team, null, emoji.name, true);

        return createOptions(
          emoji.team, 
          createMessage(emoji.name, `${emoji.name}-${timestamp}`), 
          emoji.name, 
          false
        );
      })
      .then(request)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

/**
 * @description Create request POST options
 * @param {Object} team
 * @param {Object} ?message
 * @param {String} name
 * @param {Boolean} notFound
 * @returns {Object} options
 */
function createOptions(team, message, name, notFound) {
  const basePayload = {
    "token": team.access_token,
    "channel": process.env.CHANNEL
  };

  const baseOptions = {
    method: 'POST',
    uri: 'https://slack.com/api/chat.postMessage',
  }; 

  let options;

  if (!notFound) {
    const payload = Object.assign({
      "text": message.text, 
      "attachments": JSON.stringify(message.attachments) 
    }, basePayload);

    options = Object.assign({ formData: payload }, baseOptions);
  } else {
    const payload = Object.assign({
      "text": `The emoji *${name}* has been deleted. Sadly it was not found on the server.`
    }, basePayload);

    options = Object.assign({ formData: payload }, baseOptions);
  }

  return options;
}

/**
 * @description Create interactive message
 * @param {String} name
 * @param {String} value name with timestamp
 * @returns {Object} message
 */
function createMessage(name, value) {
  return {
    "text": "*The following emoji has been removed:* _" + name + "_",
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
            "value": value
          },
          {
            "name": "no",
            "text": "No",
            "type": "button",
            "value": value
          }
        ]
      }
    ]
  };
}

module.exports = EventHandler;
