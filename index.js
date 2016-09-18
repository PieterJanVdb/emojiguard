require('dotenv').load();

const app = require('./server');
const EventHandler = require('./server/jobhandlers/EventHandler');
const ActionHandler = require('./server/jobhandlers/ActionHandler');

const port = process.env.PORT || 8000;

global.rootPath = __dirname;

// Init jobqueue listeners
EventHandler.init();
ActionHandler.init();

// Start server
app.listen(port, () => console.log(`Listening on port ${port}`));
