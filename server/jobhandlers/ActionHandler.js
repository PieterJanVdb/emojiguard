const Queue = require('bull');
const fs = require('fs-promise');
const glob = require('glob-promise');
const request = require('request-promise');
const moment = require('moment');
const bluebird = require('bluebird');
const PythonShell = require('python-shell');

const runPythonScript = bluebird.promisify(PythonShell.run);

const emojiQueue = Queue('process_emoji_action', process.env.REDIS_PORT, '127.0.0.1');

const ActionHandler = {};

/**
 * @description Starts processing jobs from the 'process_emoji_action' queue
 * and handles completion or failure of jobs.
 */
ActionHandler.init = () => {
  emojiQueue.process(job => {
    if (job.data.type === 'yes') return addEmoji(job.data);
    else if (job.data.type === 'no') return removeEmoji(job.data);
    else Promise.resolve();
  });

  emojiQueue.on('error', err => console.error('ActionHandler: ', err));
  emojiQueue.on('completed', job => job.remove());
  emojiQueue.on('failed', (job, err) => {
    console.error('ActionHandler|emojiQueue failed: ', err);
    job.remove();
  });
};

function addEmoji(action) {
  return new Promise((resolve, reject) => {
    if (!action.value || !action.channel || !action.team || !action.message || !action.message_ts) reject('action object incomplete');

    request('https://slack.com/api/emoji.list', {
      json: true,
      qs: { token: action.team.access_token }
    }).then(response => {
      let emojis;

      try {
        emojis = Object.keys(reponse.emoji);
      } catch (exc) {
        emojis = [];
      }

      if (emojis.find(emoji => emoji === action.value.split('-')[0])) {
        const message = createMessage(action.message, 'The emoji already exists.', 'danger');
        const options = createOptions(action.team, action.channel, message, action.message_ts);

        request(options)
          .then(() => resolve())
          .catch(err => reject(err));
      } else {
        const path = `${global.rootPath}/emojis/${action.team.ID}/${action.value}.*`;
        const name = action.value.split('-')[0];

        glob(path)
          .then(contents => {
            if (!contents.length) {
              const message = createMessage(action.message, 'The emoji could not be found on the server.', 'danger');
              return createOptions(action.team, action.channel, message, action.message_ts);
            }

            const pythonOptions = {
              scriptPath: `${global.rootPath}/scripts/slack-emojinator`,
              args: [contents[0], name]
            }

            return runPythonScript('upload.py', pythonOptions)
              .then(() => {
                return fs.remove(contents[0])
                  .then(() => {
                    const message = createMessage(action.message, 'Successfully added emoji to Slack.', 'good');
                    return createOptions(action.team, action.channel, message, action.message_ts);
                  });
              })
              .catch(err => {
                const message = createMessage(action.message, 'Failed adding emoji to Slack.', 'danger');
                return createOptions(action.team, action.channel, message, action.message_ts);
              });
          })
          .then(request)
          .then(() => resolve())
          .catch(err => reject(err));
      }
    });
  });
}

function removeEmoji(action) {
  return new Promise((resolve, reject) => {
    if (!action.value || !action.channel || !action.team || !action.message || !action.message_ts) reject('action object incomplete');

    const path = `${global.rootPath}/emojis/${action.team.ID}/${action.value}.*`;

    glob(path)
      .then(contents => {
        if (!contents.length) {
          const message = createMessage(action.message, 'The emoji could not be found on the server.', 'danger');
          return createOptions(action.team, action.channel, message, action.message_ts);
        }

        return fs.remove(contents[0])
          .then(() => {
            const message = createMessage(action.message, 'Removed emoji from the server.', 'good');
            return createOptions(action.team, action.channel, message, action.message_ts);
          })
          .catch(err => {
            const message = createMessage(action.message, 'Failed removing emoji from the server.', 'danger');
            return createOptions(action.team, action.channel, message, action.message_ts);
          });
      })
      .then(request)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

/**
 * @description Create request POST options
 * @param {Object} team
 * @param {Object} message
 * @param {String} timestamp
 * @returns {Object} options
 */
function createOptions(team, channel, message, timestamp) {
  const payload = {
    "token": team.access_token,
    "channel": channel,
    "ts": timestamp,
    "text": message.text,
    "attachments": JSON.stringify(message.attachments) 
  };

  const options = {
    method: 'POST',
    uri: 'https://slack.com/api/chat.update',
    formData: payload 
  };

  return options;
}

/**
 * @description Create interactive message
 * @param {Object} message original message
 * @param {String} text attachment text
 * @param {String} status attachment color
 * @returns {Object} message
 */
function createMessage(message, text, status) {
  const attachments = [
    {
      "text": text,
      "fallback": "You are unable to choose an action",
      "callback_id": "emoji_action",
      "color": status,
    }
  ];

  message["attachments"] = attachments;

  return message;
}

module.exports = ActionHandler;