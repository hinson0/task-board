var express = require('express');
var router = express.Router();

var VersionModel2 = require('../model/version_model');
var UserModel2 = require('../model/user_model');
var StoryModel2 = require('../model/story_model');

router.post('/', checkVersion);
router.post('/', checkLeader);
router.post('/', checkTitle);
router.post('/', function(req, res) {
  StoryModel2
    .build(req.body)
    .save()
    .then(function(story) {
      res.json({id: story.id});
    })
    .catch(function(err) {
      res.status(500);
      res.json(err.errors);
    });
});

router.get('/', checkVersion);
router.get('/', function(req, res) {
  StoryModel2
    .findAll({
      where: {version_id: req.query.version_id},
      include: [UserModel2],
      order: 'id DESC',
    })
    .then(function(stories) {
      res.json(stories);
    });
});

function checkVersion(req, res, next) {
  VersionModel2
    .find(req.param('version_id'))
    .then(function(version) {
      if (version === null) {
        res.status(404);
        res.json({msg: '版本不存在'});
      } else {
        req.version = version;
        next();
      }
    });
}
function checkLeader(req, res, next) { // 校验故事负责人是否存在
  UserModel2
    .find(req.body.leader)
    .then(function(user) {
      if (user === null) {
        res.status(404);
        res.json({msg: '用户不存在'});
      } else {
        req.user = user;
        next();
      }
    });
}
function checkTitle(req, res, next) { // title是否已经存在
  StoryModel2
    .find({
      where: {version_id: req.body.version_id, title: req.body.title}
    })
    .then(function(story) {
      if (story) {
        res.status(404);
        res.json({msg: '故事title存在'});
      } else {
        next();
      }
    });
}

module.exports = router;