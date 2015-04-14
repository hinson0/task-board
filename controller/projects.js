var express = require('express');
var router = express.Router();
var moment = require('moment');

var ProjectModel = require('../model/project');
var UserModel = require('../model/user');

// 列表
router.get('/', function(req, res) {
    var pagination = {
        offset: req.query.offset || 0,
        size: req.query.size || 10
    };
    ProjectModel.getList(null, pagination, req.param('_include_total', true), function(results) {
        res.json(results);
        res.end();
    });
});

// 新建
router.post('/', function(req, res) {
    // 过滤
    var props = {
        leader: req.body.leader,
        name: req.body.name
    };

    // 判断用户
    UserModel.getById(props.leader, function(user) {
        if (!user.id) {
            res.status(404);
            res.json({'msg': '用户不存在'});
            return;
        }

        // 判断项目名称
        ProjectModel.getByName(props.name, function(projectInfo) {
            if (!projectInfo.id) { // 新建
                var project = new ProjectModel();
                props.create_time = moment().unix();
                project.save(props, function(projectId) {
                    res.json({id: projectId});
                });
            } else { // 修改
                var project = new ProjectModel(false);
                project.save({leader: props.leader, id: projectInfo.id}, function(projectId) {
                    res.json({id: projectInfo.id});
                });
            }
        });
    });
});

router.use('/:id', function(req, res, next) {
    ProjectModel.getById(req.params.id, function(projectInfo) {
        if (!projectInfo.id) {
            res.status(404);
            res.json({'msg': '项目不存在'});
        } else {
            req.projectInfo = projectInfo;
            next();
        }
    });
});

// 编辑
router.put('/:id', function(req, res) {
    // 过滤
    var props = {
        name: req.body.name,
        leader: req.body.leader
    };

    // 校验name
    var checkName = function() {
        // 判断项目名称是否存在
        ProjectModel.getByName(props.name, function(projectInfo) {
            if (projectInfo.id) { // 存在则提示错误
                res.status(404);
                res.json({'msg': '项目名字已经存在'});
            } else {
                checkLeader();
            }
        });
    };

    // 校验leader
    var checkLeader = function() {
        UserModel.getById(props.leader, function(userInfo) {
            if (!userInfo.id) {
                res.status(404);
                res.json({'msg': '项目负责人不存在'});
            } else {
                doIt();
            }
        });
    };

    // 校验
    if (props.name !== req.projectInfo.name) {
        checkName();
    } else {
        checkLeader();
    }

    // 执行
    var doIt = function() {
        var project = new ProjectModel(false);
        project.save({id: req.projectInfo.id, name: props.name, leader: props.leader}, function(projectId) {
            res.json({id: projectId});
        });
    }
});

// 删除
router.delete('/:id', function(req,  res) {
    ProjectModel.deleteById(req.params.id, function() {
        res.json({'msg': '删除成功'});
    });
});

module.exports = router;
