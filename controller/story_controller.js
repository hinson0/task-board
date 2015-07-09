var express = require('express');
var router = express.Router();

var VersionModel2 = require('../model/version_model');
var UserModel2 = require('../model/user_model');
var StoryModel2 = require('../model/story_model');
var RouterService = require('../service/router_service');

router.post('/', checkVersionId);
router.post('/', checkLeader);
router.post('/', checkVt);
router.post('/', function(req, res) {
  StoryModel2
    .build(req.body)
    .save()
    .then(function(story) {
      res.json({id: story.id});
    })
    .catch(function(err) {
      RouterService.json(err, res);
    });
});

router.get('/', checkVersionId);
router.get('/', function(req, res) {
  StoryModel2
    .findAll({
      where: {
        version_id: req.query.version_id,
        status: StoryModel2.statusOnline
      },
      include: [UserModel2],
      order: 'id DESC'
    })
    .then(function(stories) {
      res.json(stories);
    });
});

router.use('/:id', function (req, res, next) {
  StoryModel2
    .findById(req.params.id)
    .then(function (story) {
      if (story === null) {
        res.status(400);
        res.json({msg: '故事不存在'});
      } else {
        req.story = story;
        next();
      }
    });
});

router.put('/:id', function (req, res, next) {
  if (isVtChanged(req, req.story)) {
    checkVt(req, res, next);
  } else {
    next();
  }
});
router.put('/:id', function (req, res) {
  req.story
    .updateAttributes(req.body)
    .then(function () {
      res.json({msg: '编辑成功'});
    })
    .catch(function (err) {
      RouterService.json(err, res);
    });
});

router.delete('/:id', function (req, res) {
  req.story
    .updateAttributes({
      status: StoryModel2.statusDeleted
    })
    .then(function () {
      res.json({msg: '删除成功'});
    });
});

function checkVersionId(req, res, next) {
  VersionModel2
    .findById(req.param('version_id'))
    .then(function(version) {
      if (version === null) {
        res.status(400);
        res.json({msg: '版本不存在'});
      } else {
        req.version = version;
        next();
      }
    });
}
function checkLeader(req, res, next) { // 校验故事负责人是否存在
  UserModel2
    .findById(req.body.leader)
    .then(function(user) {
      if (user === null) {
        res.status(400);
        res.json({msg: '用户不存在'});
      } else {
        req.user = user;
        next();
      }
    });
}
function checkVt(req, res, next) { // title是否已经存在
  StoryModel2
    .findByVt(req.body.version_id, req.body.title)
    .then(function (story) {
      if (story) {
        res.status(400);
        res.json({msg: '故事title存在'});
      } else {
        next();
      }  
    });
}
function isVtChanged(req, story) {
  return req.body.title !== story.title || parseInt(req.body.version_id) !== parseInt(story.version_id);
}

module.exports = router;