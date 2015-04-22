var express = require('express');
var router = express.Router();
var moment = require('moment');

var VersionModel2 = require('../model/version_model');
var IterationModel2 = require('../model/iteration_model');
var IterationService2 = require('../service/iteration_service');
var RouterService = require('../service/router_service');

router.use('/:id', function(req, res, next) {
  IterationModel2
    .find(req.params.id)
    .then(function(iteration) {
      if (iteration === null) {
        res.status(404);
        res.json({msg: '迭代不存在'});
      } else {
        req.iteration = iteration;
        next();
      }
    });
});

// 列表
router.get('/', function(req, res, next) {
  IterationService2.formatList(req.query, function(error, result) {
    res.json(result);
  });
});

// 新增
router.post('/', checkVersionId, checkUniqVN);
router.post('/', function(req, res) {
  IterationModel2
    .build(req.body)
    .save()
    .then(function(iteration) {
      res.json({id: iteration.id});
    })
    .catch(function(err) {
      RouterService.json(err, res);
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
  iteration.status = IterationModel2.statusOffline;
  iteration
    .save()
    .then(function() {
      res.json({msg: '删除成功'});
    });
});

function checkVersionId(req, res, next) { // 检查版本ID是否存在
  VersionModel2
    .find(req.body.version_id)
    .then(function(version) {
      if (version) {
        next();
      } else {
        res.status(404);
        res.json({msg: '版本号不存在'});
      }
    });
}
function checkUniqVN(req, res, next) { // 校验迭代名称是否存在
  IterationModel2
    .find({
      where: {
        version_id: req.body.version_id,
        name: req.body.name,
      }
    })
    .then(function(iteration) {
      if (iteration) {
        res.status(404);
        res.json({msg: '迭代名称存在'});
      } else {
        next();
      }
    });
}

module.exports = router;