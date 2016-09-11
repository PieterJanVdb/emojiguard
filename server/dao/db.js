const dbConfig = {
  client: 'pg',
  connection: process.env.DB_URL
};

module.exports = require('knex')(dbConfig);
