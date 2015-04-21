var express = require('express');
var router = express.Router();

var VersionModel2 = require('../model/version2');
var ProjectModel2 = require('../model/project2');

// 检查id
router.use('/:id', function (req, res, next) {
  VersionModel2
    .find(req.params.id)
    .then(function (version) {
      if (version === null) {
        res.status(404);
        res.json({msg: '版本不存在'});
      } else {
        req.version = version;
        next();
      }
    });
});

// 新建
router.post('/', checkProject);
router.post('/', checkPN);
router.post('/', function (req, res) {
  VersionModel2
    .build(req.body)
    .save()
    .then(function (version) {
      res.json({id: version.id});
    })
    .catch(function (err) {
      res.status(500);
      res.json(err.errors);
    });
});

// 列表
router.get('/', function (req, res) {
  VersionModel2
    .findAndCount({
      where: {
        status: req.query.status.split(',')
      },
      include: [
        {model: ProjectModel2}
      ],
      order: 'id DESC',
      offset: req.query.offset || 0,
      limit: req.query.size || 10
    })
    .then(function (result) {
      res.json(result);
    });
});

// 编辑
router.put('/:id', checkProject);
router.put('/:id', function (req, res, next) {
  if (req.body.name !== req.version.name) {
    checkPN(req, res, next);
  } else {
    next();
  }
});
router.put('/:id', function (req, res) {
  req.version
    .updateAttributes(req.body)
    .then(function (version) {
      res.json({id: version.id});
    })
    .catch(function (err) {
      res.status(500);
      res.json(err.errors);
    });
});

// 关闭
router.put('/:id/toggle', function (req, res) {
  req.version
    .toggle(req.query.status)
    .then(function (version) {
      res.json({msg: '操作成功'});
    })
    .catch(function (err) {
      res.status(500);
      res.json(err.errors);
    });
});

// 删除
router.delete('/:id', function (req, res) {
  req.version
    .updateAttributes({
      status: VersionModel2.statusDeleted
    })
    .then(function () {
      res.json({msg: '删除成功'});
    });
});

function checkPN(req, res, next) {
  VersionModel2
    .find({
      where: {
        project_id: req.body.project_id,
        name: req.body.name
      }
    })
    .then(function (version) {
      if (version === null) {
        next();
      } else {
        res.status(404);
        res.json({msg: '版本号存在!'});
      }
    });
}
function checkProject(req, res, next) {
  ProjectModel2
    .find(req.body.project_id)
    .then(function (project) {
      if (project === null) {
        res.status(404);
        res.json({msg: '项目不存在!'});
      } else {
        req.project = project;
        next();
      }
    });
}

module.exports = router;