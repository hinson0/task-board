var express = require('express');
var router = express.Router();
var moment = require('moment');

var ProjectModel2 = require('../model/project_model');
var UserModel2 = require('../model/user_model');
var RouterService = require('../service/router_service');

// 列表
router.get('/', function (req, res) {
  ProjectModel2
    .findAndCountAll({
      where: {
        status: ProjectModel2.statusOnline
      },
      offset: req.query.offset || 0,
      limit: req.query.size || 10
    })
    .then(function (projects) {
      res.json(projects);
    });
});

// 新建
router.post('/', checkLeader);
router.post('/', checkName);
router.post('/', function (req, res) {
  ProjectModel2
    .create(req.body)
    .then(function (project) {
      res.json({id: project.id});
    })
    .catch(function (err) {
      RouterService.json(err, res);
    });
});

router.use('/:id', function (req, res, next) {
  ProjectModel2
    .find(req.params.id)
    .then(function (project) {
      if (project === null) {
        res.status(404);
        res.json({msg: '项目不存在'});
      } else {
        req.project = project;
        next();
      }
    });
});

// 编辑
router.put('/:id', checkLeader);
router.put('/:id', function (req, res, next) {
  if (req.body.name !== req.project.name) {
    checkName(req, res, next);
  } else {
    next();
  }
});
router.put('/:id', function (req, res) {
  ProjectModel2
    .update(req.body)
    .then(function (project) {
      res.json({id: project.id});
    })
    .catch(function (err) {
      RouterService.json(err, res);
    });
});

// 删除
router.delete('/:id', function (req, res) {
  req.project
    .update({
      status: ProjectModel2.statusDeleted
    })
    .then(function () {
      res.json({msg: '删除成功'});
    })
    .catch(function (err) {
      RouterService.json(err, res);
    });
});

function checkName(req, res, next) { // 校验项目名称是否存在
  ProjectModel2
    .find({
      where: {name: req.body.name}
    })
    .then(function (project) {
      if (project === null) {
        next();
      } else {
        res.status(400);
        res.json({msg: '抱歉，该项目名称已经存在'});
      }
    });
}
function checkLeader(req, res, next) { // 校验负责人
  UserModel2
    .find(req.body.leader)
    .then(function (user) {
      if (user === null) {
        res.status(400);
        res.json({msg: '负责人不存在'});
      } else {
        req.user = user;
        next();
      }
    });
}

module.exports = router;
