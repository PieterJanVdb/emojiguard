require('dotenv').load();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DB_URL
  },

  production: {
    client: 'pg',
    connection: process.env.DB_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};
