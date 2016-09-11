const db = require('./db');

const TeamDao = {};

TeamDao.findById = id => {
  return db.select()
    .from('teams')
    .where('ID', id);
}

TeamDao.create = team => {
  return db.insert(team).into('teams');
}

TeamDao.update = (id, team) => {
  return db('teams')
    .where('ID', id)
    .update(team);
}

module.exports = TeamDao;
