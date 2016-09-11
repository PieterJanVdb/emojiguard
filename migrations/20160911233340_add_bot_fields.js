exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('teams', function (table) {
      table.string('bot_id');
      table.string('bot_token');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('teams', function (table) {
      table.dropColumn('bot_id');
      table.dropColumn('bot_token');
    })
  ]);
};
