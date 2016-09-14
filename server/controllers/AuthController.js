const request = require('request-promise');
const TeamDao = require('../dao/TeamDao');

const AuthController = {};

AuthController.authTeam = (req, res) => {
  const authCode = req.query.code;

  if (!authCode) {
    console.error('authTeam: no authCode');
    return res.redirect('/');
  } else {
    return AuthController.performAuth(authCode, res);
  }
};

AuthController.performAuth = (authCode, res) => {
  let authURL = 'https://slack.com/api/oauth.access?';
  authURL += 'client_id=' + process.env.SLACK_CLIENT_ID;
  authURL += '&client_secret=' + process.env.SLACK_CLIENT_SECRET;
  authURL += '&code=' + authCode;
  authURL += '&redirect_uri=' + process.env.REDIRECT_URL;

  request.get(authURL).then(body => {
    const _body = JSON.parse(body);

    const team = {
      access_token: _body.access_token,
      name: _body.team_name,
      ID: _body.team_id,
    };

    return AuthController.registerTeam(team, res);
  }).catch(err => {
    console.error('performAuth: ', err);
    return res.sendStatus(500);
  })
};

AuthController.registerTeam = (team, res) => {
  return TeamDao.findById(team.ID).then(teams => {
    if (teams.length <= 0 && !teams[0]) {
      TeamDao.create(team)
        .then(() => res.redirect('/'))
        .catch(err => {
          console.error('registerTeam|save: ', err);
          return res.sendStatus(500);
        });
    } else {
      TeamDao.update(team.ID, {
        name: teams[0].name,
        access_token: teams[0].access_token,
      })
        .then(() => res.redirect('/'))
        .catch(err => {
          console.error('registerTeam|update: ', err);
          return res.sendStatus(500);
        });
    }
  }).catch(err => {
    console.error('registerTeam: ', err);
    return res.sendStatus(500);
  })
}

module.exports = AuthController;
