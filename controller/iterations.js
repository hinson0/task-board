var express = require('express');
var router = express.Router();
var moment = require('moment');

var IterationModel = require('../model/iteration');
var VersionModel = require('../model/version');
var IterationService = require('../service/iteration');

router.use('/:id', function(req, res, next) {
    IterationModel.getById(req.params.id, function(interationInfo) {
        if (!interationInfo.id) {
            res.status(404);
            res.json({'msg': '迭代不存在'});
        } else {
            req.interationInfo = interationInfo;
            next();
        }
    });
});

// 列表
router.get('/', function(req, res, next) {
    var pagination = {
        offset: req.query.offset || 0,
        size: req.query.size || 10
    };
    var condition = {
        versionId: req.query.version_id
    };
    IterationService.getListWithProject(condition, pagination, req.param('_include_total', true), function(results) {
        res.json(results);
    })
});

// 新增
router.post('/', checkVersionId, checkUniqVN);
router.post('/', function(req, res) {
    var interation = new IterationModel();
    var props = req.body;
    props.create_time = moment().unix();
    interation.save(props, function(interationId) {
        res.json({id: interationId});
    });
});

// 编辑
router.put('/:id', checkVersionId);
router.put('/:id', function(req, res, next) {
    if ((req.interationInfo.name !== req.body.name) || (req.interationInfo.version_id !== req.body.version_id)) {
        checkUniqVN(req, res, next);
    } else {
        next();
    }
});
router.put('/:id', function(req, res) {
    var interation = new IterationModel(false);
    var props = req.body;
    props.id = req.params.id;
    interation.save(props, function(interationId) {
        res.json({id: interationId});
    });
});

// 删除
router.delete('/:id', function(req, res) {
    IterationModel.deleteById(req.params.id, function() {
        res.json({'msg': '删除成功'});
    });
});

function checkVersionId(req, res, next) { // 检查版本ID是否存在
    VersionModel.getById(req.body.version_id, function(versionInfo) {
        if (!versionInfo.id) {
            res.status(404);
            res.json({'msg': '版本号不存在'});
        } else {
            next();
        }
    });
}
function checkUniqVN(req, res, next) { // 校验迭代名称是否存在
    IterationModel.getByUniqVN(req.body.version_id, req.body.name, function(interationInfo) {
        if (interationInfo.id) {
            res.status(404);
            res.json({'msg': '迭代名称存在'});
        } else {
            next();
        }
    });
}

module.exports = router;