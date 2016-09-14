const Queue = require('bull');
const download = require('download');
const fs = require('fs-promise');

const emojiQueue = Queue('process_emoji_event', 6379, '127.0.0.1');

const EmojiHandler = {};

EmojiHandler.init = () => {
  emojiQueue.process(job => {
    if (job.data.type === 'add') return EmojiHandler.processAdded(job.data);
    else if (job.data.type === 'remove') return EmojiHandler.processRemoved(job.data);
    else Promise.resolve();
  });

  emojiQueue.on('error', err => console.error('EmojiHandler: ', err));
}

EmojiHandler.processAdded = emoji => {
  return new Promise((resolve, reject) => {
    if (!emoji.value || !emoji.name || !emoji.team) reject();

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

};

module.exports = EmojiHandler;
