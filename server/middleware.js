const _ = require('lodash');
const TeamDao = require('./dao/TeamDao');

const middleware = {};

middleware.parseAction = (req, res, next) => {
  let payload;

  try {
    payload = JSON.parse(_.get(req, 'body.payload'));
  } catch (exc) {
    return badRequest(res);
  }

  req.body = payload;
  return next();
};

middleware.fetchTeamFromEvent = (req, res, next) => {
  if (!_.isNil(_.get(req, 'body.type')) && req.body.type === 'url_verification') return next();
  if (_.isNil(_.get(req, 'body.team_id'))) return badRequest(res);

  return fetchTeam(req.body.team_id, req, res, next);
};

middleware.fetchTeamFromAction = (req, res, next) => {
  if (_.isNil(_.get(req, 'body.team.id'))) return badRequest(res);

  return fetchTeam(req.body.team.id, req, res, next);
}

middleware.verifySlack = (req, res, next) => {
  const verificationToken = process.env.SLACK_VERIFICATION_TOKEN;

  if (_.isNil(_.get(req, 'body.token'))) return badRequest(res);
  if (verificationToken !== req.body.token) return badRequest(res);

  return next();
};

function fetchTeam(id, req, res, next) {
  return TeamDao.findById(id)
    .then(teams => {
      if (_.isEmpty(teams)) return badRequest(res);
      if (_.isNil(teams[0].access_token)) return badRequest(res);

      req.team = {
        ID: id,
        access_token: teams[0].access_token
      };

      return next();
    })
    .catch(err => {
      console.error('middleware|fetchTeam: ', err);
      return badRequest(res);
    })
}

function badRequest(res) {
  res.setHeader('X-Slack-No-Retry', 1);
  return res.sendStatus(400);
}

module.exports = middleware;
