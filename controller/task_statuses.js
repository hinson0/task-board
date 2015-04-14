var express = require('express');
var router = express.Router();

var TaskStatusModel = require('../model/task_status');

router.post('/', checkName);
router.post('/', function(req, res) {
    var taskStatus = new TaskStatusModel( req.body.name, req.body.sort);
    taskStatus.save(function(taskStatusId) {
        res.json({id: taskStatusId});
    });
});

router.get('/', function(req, res) {
    var pagination = {
        offset: req.query.offset || 0,
        size: req.query.size || 10
    };
    var includeTotal = req.param('_include_total', 0);
    TaskStatusModel.getAll(pagination, includeTotal, function(list) {
        res.json(list);
    });
});

router.put('/:id', checkId);
router.put('/:id', checkNameWhenChanged);
router.put('/:id', function(req, res) {
    var props = {};
    req.body.name && (props.name = req.body.name);
    req.body.sort && (props.sort = req.body.sort);
    TaskStatusModel.modiById(req.params.id, props, function() {
        res.json({id: req.params.id});
    });
});

function checkId(req, res, next) {
    id = parseInt(req.params.id, 10);
    TaskStatusModel.getById(id, function(taskStatusInfo) {
        if (!taskStatusInfo.id) {
            res.status(404);
            res.json({msg: '任务状态记录不存在'});
        } else {
            req.taskStatusInfo = taskStatusInfo;
            next();
        }
    });
}
function checkName(req, res, next) { // 检查状态名字是否唯一
    TaskStatusModel.getOneByName(req.body.name, function(taskStatusInfo) {
        if (taskStatusInfo.id) {
            res.status(404);
            res.json({msg: '该名称已经存在'});
        } else {
            next();
        }
    });
}
function checkNameWhenChanged(req, res, next) {
    if (req.body.name !== req.taskStatusInfo.name) {
        return checkName(req, res, next);
    } else {
        next();
    }
}

module.exports = router;