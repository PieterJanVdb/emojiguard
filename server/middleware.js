const _ = require('lodash');
const TeamDao = require('./dao/TeamDao');

const middleware = {};

middleware.fetchTeamFromId = (req, res, next) => {
  if (!_.isNil(req.body.type) && req.body.type === 'url_verification') return next();
  if (_.isNil(req.body.team_id)) return _badRequest(res);

  TeamDao.findById(req.body.team_id)
    .then(teams => {
      if (_.isEmpty(teams)) return _badRequest(res);
      if (_.isNil(teams[0].access_token)) return _badRequest(res);

      req.team = {
        ID: req.body.team_id,
        access_token: teams[0].access_token
      };

      return next();
    })
    .catch(err => {
      console.error('middleware|fetchTeamFromId: ', err);
      return _badRequest(res);
    })
};

middleware.verifySlack = (req, res, next) => {
  const verificationToken = process.env.SLACK_VERIFICATION_TOKEN;

  if (_.isNil(req.body.token)) return _badRequest(res);
  if (verificationToken !== req.body.token) return _badRequest(res);

  return next();
};

const _badRequest = res => {
  res.setHeader('X-Slack-No-Retry', 1);
  return res.sendStatus(400);
}

module.exports = middleware;
