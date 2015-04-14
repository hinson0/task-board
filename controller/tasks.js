var express = require('express');
var router = express.Router();
var moment = require('moment');
var async = require('async');

var Helper = require('../library/helper');
var UserModel = require('../model/user');
var StoryModel = require('../model/story');
var TaskModel = require('../model/task');
var TaskStatusModel = require('../model/task_status');
var TaskFollow = require('../model/task_follow');
var IterationModel = require('../model/iteration');
var VersionModel = require('../model/version');
var Msg91U = require('../library/msg91u');

router.get('/test', function(req, res) {
    //async.waterfall([
    //    function(callback) {
    //        TaskModel.getById(42, function(task) {
    //            callback(null, task);
    //        });
    //    },
    //    function(task, callback) {
    //        TaskStatusModel.getById(task.status_id, function(taskStatus) {
    //            task.task_status = taskStatus;
    //            callback(null, task);
    //        });
    //    }
    //], function(err, results) {
    //    res.json(results);
    //});

    //TaskModel.getListByIterationId(4, function(result) {
    //    res.json(result);
    //});

    UserModel.getAll(function(users) {
        async.each(users, function(user, callback) {
            var msg91u = new Msg91U(user.worker_num);
            msg91u.send('淡定淡定...');
            res.json({msg: 'xxxx'});
        }, function(err) {
            res.status(404);
            res.json(err);
        });
    });
});

router.get('/', checkIterationId);
router.get('/', function(req, res, next) {
    StoryModel.getListByIterationId(req.query.iteration_id, function(stories) {
        if (Helper.isEmptyArray(stories)) {
            res.json([]);
        } else {
            var storyIds = [];
            stories.forEach(function(story) {
                storyIds.push(story.id);
            });
            TaskModel.getListByStoryIds(storyIds, function(list) {
                //res.json(list);
                req.list = list;
                next();
            });
        }
    });
}, function(req, res) {
    req.list.forEach(function(task) {

    });
    res.json(req.list);
});

router.post('/', checkUserId);
router.post('/', checkStoryId);
router.post('/', checkPrevTaskIds);
router.post('/', checkTaskStausId);
router.post('/', function(req, res, next) {
    async.waterfall([
        // 获取迭代记录
        function(callback) {
            IterationModel.getById(req.storyInfo.iteration_id, function(iteration) {
                if (Helper.isEmptyObj(iteration)) {
                    res.status(404);
                    res.json({msg: '迭代记录不存在'});
                } else {
                    callback(null, iteration);
                }
            });
        },

        // 获取版本记录
        function(iteration, callback) {
            VersionModel.getById(iteration.version_id, function(version) {
                iteration.version = version;
                callback(null, iteration);
            });
        }
    ], function(err, iteration) {
        req.body.iteration_id = iteration.id;
        req.body.project_id = iteration.version.project_id;
        req.body.version_id = iteration.version.id;
        next();
    });
});
router.post('/', function(req, res, next) { // 添加任务
    var task = new TaskModel(req.body);
    task.save(function(id) {
        req.taskId = id;
        next();
    });
}, function(req, res) { // 前置任务添加
    req.prevTaskIds.forEach(function(prevTaskId) {
        var taskFollow = new TaskFollow({task_id: req.taskId, prev_task_id: prevTaskId});
        taskFollow.save();
    });
    res.json({id: req.taskId});
});

router.put('/:id', checkTaskId);
router.put('/:id', checkUserId);
router.put('/:id', checkStoryId);
router.put('/:id', checkPrevTaskIds);
router.put('/:id', checkTaskStausId);
router.put('/:id', function(req, res, next) {
    TaskModel.modiById(req.params.id, req.body);
    next();
}, function(req, res) {
    async.series([
        // 清除老的
        function(callback) {
            TaskFollow.deleteByTaskId(req.params.id);
            callback(null);
        },
        // 新增
        function() {
            req.prevTaskIds.forEach(function(prevTaskId) {
                var taskFollow = new TaskFollow({task_id: req.params.id, prev_task_id: prevTaskId});
                taskFollow.save();
            });
        }
    ]);
    res.json({id: req.params.id});
});

router.delete('/:id', checkTaskId);
router.delete('/:id', function(req, res, next) {
    TaskModel.deleteById(req.params.id, function() {
        res.json({msg: '删除成功'});
        next();
    });
});

router.put('/:id/status', checkTaskId);
router.put('/:id/status', checkTaskStausId);
router.put('/:id/status', function(req, res) {
    TaskModel.changeStatusById(req.params.id, req.body.task_status_id);
    res.json({id: req.params.id});
});

function checkUserId(req, res, next) {
    UserModel.getById(req.body.user_id, function(userInfo) {
        if (Helper.isEmptyObj(userInfo)) {
            res.status(404);
            res.json({msg: '用户不存在'});
        } else {
            res.userInfo = userInfo;
            next();
        }
    });
}
function checkStoryId(req, res, next) {
    StoryModel.getById(req.param('story_id'), function(storyInfo) {
        if (Helper.isEmptyObj(storyInfo)) {
            res.status(404);
            res.json({msg: '故事不存在'});
        } else {
            req.storyInfo = storyInfo;
            next();
        }
    });
}
function checkPrevTaskIds(req, res, next) {
    if (req.body.prev_task_ids === undefined) {
        req.prevTaskIds = [];
    } else {
        var prevTaskIds = req.body.prev_task_ids.toString();
        var prevTaskIdsSplit = prevTaskIds.split(',');
        if (Helper.isEmptyArray(prevTaskIdsSplit)) {
            req.prevTaskIds = [];
        } else {
            req.prevTaskIds = prevTaskIdsSplit;
        }
    }
    next();
}
function checkTaskStausId(req, res, next) {
    TaskStatusModel.getById(req.body.task_status_id, function(taskStatusInfo) {
        if (Helper.isEmptyObj(taskStatusInfo)) {
            res.status(404);
            res.json({msg: '请提供正确的状态'});
        } else {
            next();
        }
    });
}
function checkTaskId(req, res, next) {
    TaskModel.getById(req.params.id, function(taskInfo) {
        if (Helper.isEmptyObj(taskInfo)) {
            res.status(404);
            res.json({msg: '任务不存在'});
        } else {
            next();
        }
    });
}
function checkIterationId(req, res, next) {
    IterationModel.getById(req.param('iteration_id', 0), function(iterationInfo) {
        if (Helper.isEmptyObj(iterationInfo)) {
            res.status(404);
            res.json({msg: '迭代计划不存在'});
        } else {
            next();
        }
    });
}

module.exports = router;