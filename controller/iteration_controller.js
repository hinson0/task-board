var express = require('express');
var router = express.Router();
var moment = require('moment');

var VersionModel = require('../model/version_model');
var IterationModel = require('../model/iteration_model');
var ProjectModel = require('../model/project_model');
var RouterService = require('../service/router_service');

// 列表
router.get('/', function(req, res) {
  var where = {};
  if (req.query.status) {
    where.status = req.query.status.split(',');
  } else {
    where.status = IterationModel.statusOnline;
  }
  if (req.query.version_id) {
    where.version_id = req.query.version_id;
  }
  IterationModel
    .findAndCount({
      where: where,
      offset: req.query.offset || 0,
      limit: req.query.limit || 10,
      order: 'id DESC',
      include: [
        {model: VersionModel, include: [{model: ProjectModel}]}
      ]
    })
    .then(function(result) {
      res.json(result);
    });
});

// 新增
router.post('/', checkVersionId, checkUniqVN);
router.post('/', function(req, res) {
  IterationModel
    .build(req.body)
    .save()
    .then(function(iteration) {
      res.json({id: iteration.id});
    })
    .catch(function(err) {
      RouterService.json(err, res);
    });
});

router.use('/:id', function(req, res, next) {
  IterationModel
    .find(req.params.id)
    .then(function(iteration) {
      if (iteration === null) {
        res.status(400);
        res.json({msg: '迭代不存在'});
      } else {
        req.iteration = iteration;
        next();
      }
    });
});

// 编辑
router.put('/:id', checkVersionId);
router.put('/:id', function(req, res, next) {
  if ((req.iteration.name !== req.body.name) || (req.iteration.version_id !== req.body.version_id)) {
    checkUniqVN(req, res, next);
  } else {
    next();
  }
});
router.put('/:id', function(req, res) {
  var iteration = req.iteration;
  iteration
    .updateAttributes(req.body)
    .then(function() {
      res.json({id: iteration.id});
    })
    .catch(function(err) {
      RouterService.json(err, res);
    });
});

// 关闭
router.put('/:id/toggle', function (req, res) {
  req.iteration
    .toggle()
    .then(function () {
      res.json({msg: '操作成功'});
    })
    .catch(function (err) {
      RouterService.json(err, res);
    });
});

// 删除
router.delete('/:id', function(req, res) {
  var iteration = req.iteration;
  iteration.status = IterationModel.statusDeleted;
  iteration
    .save()
    .then(function() {
      res.json({msg: '删除成功'});
    });
});

function checkVersionId(req, res, next) { // 检查版本ID是否存在
  VersionModel
    .find(req.body.version_id)
    .then(function(version) {
      if (version) {
        next();
      } else {
        res.status(400);
        res.json({msg: '版本号不存在'});
      }
    });
}
function checkUniqVN(req, res, next) { // 校验迭代名称是否存在
  IterationModel
    .find({
      where: {
        version_id: req.body.version_id,
        name: req.body.name,
      }
    })
    .then(function(iteration) {
      if (iteration) {
        res.status(400);
        res.json({msg: '迭代名称存在'});
      } else {
        next();
      }
    });
}

module.exports = router;