var express = require("express");
var router = express.Router();
var path = require("path");

const apps = [
  { path: "football-quiz", folder: "footballquizWeb" },
  { path: "goal-alert", folder: "goalAlertWeb" },
  { path: "video-central", folder: "videoCentralWeb" },
  { path: "instant-game", folder: "instantGameWeb" },
  { path: "admin", folder: "footballadmin" },
  { path: 'npfl-quiz', folder: 'npflQuiz' }
];

apps.forEach((appConfig) => {
  const appPath = `/${appConfig.path}`;
  const appFolder = appConfig.folder;

  router.use(express.static(path.join(__dirname, "../campaigns", appFolder)));

  router.get(`${appPath}*`, (req, res) => {
    res.sendFile("index.html", {
      root: path.join(__dirname, "../campaigns", appFolder),
    });
  });
});

module.exports = router;
