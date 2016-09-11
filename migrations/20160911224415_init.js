exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('teams', function (table) {
      table.string('ID').primary();
      table.string('name').notNullable();
      table.string('access_token');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('teams')
  ]);
};
