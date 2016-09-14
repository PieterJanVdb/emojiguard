require('dotenv').load();

const app = require('./server');
const EmojiHandler = require('./server/events/EmojiHandler');

const port = process.env.PORT || 8000;

global.rootPath = __dirname;

// Init jobqueue listener
EmojiHandler.init();

// Start server
app.listen(port, () => console.log(`Listening on port ${port}`));
