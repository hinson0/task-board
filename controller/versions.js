var express = require('express');
var router = express.Router();
var moment = require('moment');

var VersionModel = require('../model/version');
var VersionService = require('../service/version');

// 新建
router.post('/', function(req, res) {
    // 校验
    var checkUniqPN = function(projectId, name) {
        VersionModel.getByUniqPN(projectId, name, function(versionInfo) {
            if (versionInfo.id) {
                res.status(404);
                res.json({'msg': '版本号存在!'});
            } else {
                doIt();
            }
        });
    };
    checkUniqPN(req.body.project_id, req.body.name);

    // 执行
    var doIt = function() {
        var version = new VersionModel();
        var props = req.body;
        props.create_time = moment().unix();
        version.save(props, function(versionId) {
            res.json({id: versionId});
        });
    };
});

// 列表
router.get('/', function(req, res) {
    var pagination = {
        offset: req.query.offset || 0,
        size: req.query.size || 10
    };
    VersionService.getListWithProject(pagination, req.param('_include_total', 1), function(results) {
        res.json(results);
    });
});

router.use('/:id', function(req, res, next) {
    VersionModel.getById(req.params.id, function(versionInfo) {
        if (!versionInfo.id) {
            res.status(404);
            res.json({'msg': '项目不存在'});
        } else {
            req.versionInfo = versionInfo;
            next();
        }
    });
});

// 编辑
router.put('/:id', function(req, res) {
    // 校验
    var checkUniqPN = function(projectId, name) {
        VersionModel.getByUniqPN(projectId, name, function(versionInfo) {
            if (versionInfo.id) {
                res.status(404);
                res.json({'msg': '版本号存在!'});
            } else {
                doIt();
            }
        });
    };

    // 执行
    var doIt = function() {
        var version = new VersionModel(false);
        var props = req.body;
        props.id = req.params.id;
        version.save(props, function(versionId) {
            res.json({id: versionId});
        });
    };

    // 校验
    if (req.body.name !== req.versionInfo.name) {
        checkUniqPN(req.versionInfo.project_id, req.body.name);
    } else {
        doIt();
    }
});

// 删除
router.delete('/:id', function(req, res) {
    VersionModel.deleteById(req.params.id, function() {
        res.json({'msg': '删除成功'});
    });
});

module.exports = router;