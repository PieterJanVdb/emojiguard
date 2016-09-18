const Express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = new Express();

//Configuration & Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Hook up routes
app.use(routes);

//Static files
app.use(Express.static('public'));

//Error handling
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.setHeader('X-Slack-No-Retry', 1);
  res.status(500).send('Something broke!');
});

module.exports = app;
