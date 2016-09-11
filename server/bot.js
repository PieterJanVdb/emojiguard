const SlackBot = require('slackbots');
const util = require('util');
const extend = require('extend');

const EmojiGuardBot = function Constructor(settings) {
  this.settings = settings;
}

util.inherits(EmojiGuardBot, SlackBot);

PupperBot.prototype.run = function () {
  PupperBot.super_.call(this, this.settings);

  this.on('message', this._onMessage);
};

PupperBot.prototype._onMessage = function (data) {
  if (data.type === 'emoji_changed') {
    if (data.subtype === 'remove') {
      if (data.names.length === 1) {
        this.postMessageToChannel('deleted_emojis', ':loudspeaker: :police_car: :no_entry_sign: ​*The following emoji has been removed:*​ ​_' + data.names[0] + '_​ :no_entry_sign: :police_car: :loudspeaker:');
      } else {
        this.postMessageToChannel('deleted_emojis', ':loudspeaker: :police_car: :no_entry_sign: ​*The following emoji has been removed:*​ ​_' + data.names.join(', ') + '_​ :no_entry_sign: :police_car: :loudspeaker:');
      }
    }
  }
}

PupperBot.prototype.postMessage = function(id, text, params) {
  this.getUser(this.name).then(user => {
    params = extend({
        text: text,
        channel: id,
        username: this.name,
        icon_url: user.profile.image_48,
    }, params || {});

    return this._api('chat.postMessage', params);
  });
};

const bot = new PupperBot({
    token: process.env.SLACK_TOKEN,
    name: 'simple_poll',
});

bot.run();

module.exports = bot;
