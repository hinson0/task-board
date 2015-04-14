var db = require('./db');
var moment = require('moment');
var async = require('async');

var Helper = require('../library/helper');
var TaskStatusModel = require('./task_status');
var UserModel = require('./user');
var IterationModel = require('./iteration');
var StoryModel = require('./story');
var TaskFollowModel = require('./task_follow');

function Task(props) {
    this.userId = props.user_id;
    this.estimatedTime = props.estimated_time;
    this.storyId = props.story_id;
    this.desc = props.desc;
    this.isNew = props.is_new;
    this.isChallenging = props.is_challenging;
    this.priority = props.priority;
    this.statusId = props.task_status_id;
    this.projectId = props.project_id;
    this.versionId = props.version_id;
    this.iterationId = props.iteration_id;
}

Task.prototype.save = function(callback) {
    var props = {
        user_id: this.userId,
        estimated_time: this.estimatedTime,
        story_id: this.storyId,
        desc: this.desc,
        is_new: this.isNew,
        is_challenging: this.isChallenging,
        priority: this.priority,
        status_id: this.statusId,
        project_id: this.projectId,
        version_id: this.versionId,
        iteration_id: this.iterationId,
        create_time: moment().unix()
    };
    var query = db.query('INSERT INTO ?? SET ?', [Task.tablename, props], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback(results.insertId);
        }
    });
    console.log('sql - Task.prototype.save - ', query.sql);
}

Task.tablename = 'task';

Task.getById = function(id, callback) {
    var query = db.query('SELECT * FROM ?? WHERE id = ?', [Task.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - Task.getById - ', query.sql);
}
Task.getListByStoryIdGroupByStatusId = function(storyId, callback) {
    var sql = 'SELECT t.*, s.name AS task_status_name, s.id AS task_status_id, u.name AS name FROM ?? AS t ' +
        'RIGHT JOIN ?? AS s ON s.id = t.status_id ' +
        'LEFT JOIN ?? AS u ON u.id = t.user_id ' +
        'WHERE story_id = ? ORDER BY s.sort ASC';
    var query = db.query(sql, [Task.tablename, TaskStatusModel.tablename, UserModel.tablename, storyId], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return callback(results);
    });
    console.log('sql - Task.getListByStoryIdGroupByStatusId - ', query.sql);
}
Task.getListByStoryIds = function(storyIds, callback) { // 根据故事IDS，获取任务列表
    var getStoryList = function(callback) {
        var sql = 'SELECT t.*, s.name AS task_status_name, s.id AS task_status_id, u.name AS name FROM ?? AS t ' +
            'RIGHT JOIN ?? AS s ON s.id = t.status_id ' +
            'LEFT JOIN ?? AS u ON u.id = t.user_id ' +
            'WHERE story_id IN (?) ORDER BY s.sort ASC';
        var query = db.query(sql, [Task.tablename, TaskStatusModel.tablename, UserModel.tablename, storyIds], function(err, tasks) {
            callback(null, tasks);
        });
        console.log('sql - Task.getById - ', query.sql);
    };
    var bindTaskFollows = function(tasks, callback) {
        var iterator = function(task, callback) {
            TaskFollowModel.getListByTaskId(task.id, function (taskFollows) {
                task.task_follows = taskFollows;
                callback(null, task);
            });
        };
        async.map(tasks, iterator, function(err, tasks) {
            callback(err, tasks);
        });
    };
    async.waterfall([getStoryList, bindTaskFollows], function(err, tasks) {
        callback(tasks);
    });
}
Task.getListByIterationId = function(iterationId, callback) {
    async.waterfall([
        function(callback) {
            StoryModel.getListByIterationId(iterationId, function(stories) {
                callback(null, stories);
            });
        }, function(stories, callback) {
            async.map(stories, function(story, callback) {
                Task.getListByStoryId(story.id, function(tasks) {
                    story.tasks = tasks;
                    callback(null, story);
                });
            }, function(err, results) {
                callback(err, results);
            });
        }
    ], function(err, result) {
        callback(result);
    });
}
Task.getListByStoryId = function(storyId, callback) {
    db.query('SELECT * FROM ?? WHERE story_id = ?', [Task.tablename, storyId], function(err, list) {
        if (err) {
            console.log(err);
            return;
        }
        return callback(list);
    });
}

Task.ngetListByVersionId = function(versionId, callback) {
    var query = db.query('SELECT * FROM ?? WHERE version_id = ?', [Task.tablename, versionId], function(err, tasks) {
        if (err) {
            console.log(err);
            return;
        }
        callback(tasks);
    });
    console.log('sql - Task.ngetListByVersionId - ', query.sql);
}
Task.ngetListByIterationId = function(iterationId, callback) {
    var query = db.query('SELECT * FROM ?? WHERE iteration_id = ?', [Task.tablename, iterationId], function(err, tasks) {
        if (err) {
            console.log(err);
            return;
        }
        callback(tasks);
    });
    console.log('sql - Task.ngetListByIterationId - ', query.sql);
}

Task.modiById = function(id, props, callback) {
    var setters = {
        user_id: props.user_id,
        estimated_time: props.estimated_time,
        story_id: props.story_id,
        desc: props.desc,
        is_new: props.is_new,
        is_challenging: props.is_challenging,
        priority: props.priority,
        status_id: props.task_status_id
    };
    var query = db.query('UPDATE ?? SET ? WHERE id = ?', [Task.tablename, setters, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback();
        }
    });
    console.log('sql - Task.modiById - ', query.sql);
}
Task.deleteById = function(id, callback) {
    var query = db.query('DELETE FROM ?? WHERE id = ?', [Task.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback();
        }
    });
    console.log('sql - Task.deleteById - ', query.sql);
}
Task.changeStatusById = function(id, task_status_id, callback) {
    var props = {
        status_id: task_status_id,
        start_time: moment().unix()
    };
    var query = db.query('UPDATE ?? SET ? WHERE id = ?', [Task.tablename, props, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback();
        }
    });
    console.log('sql - Task.modiById - ', query.sql);
}
Task.getHoursByVersionId = function(versionId, callback) {
    async.waterfall([
        function(callback) { // 获取版本对应的迭代记录
            IterationModel.getListByVersioId(versionId, function(iterations) {
                if (Helper.isEmptyArray(iterations)) {
                    callback('empty iterations');
                } else {
                    callback(null, iterations);
                }
            })
        },
        function(iterations, callback) { // 获取迭代对应的故事
            var iterationIds = [];
            iterations.forEach(function(iteration) {
                iterationIds.push(iteration.id);
            });
            db.query('SELECT id FROM ?? WHERE iteration_id IN (?)', [StoryModel.tablename, iterationIds], function(err, stories) {
                if (err) {
                    console.log(err);
                    return;
                }
                callback(null, stories);
            });
        },
        function(stories, callback) { // 获取故事对应的任务列表
            var storyIds = [];
            stories.forEach(function(story) {
                storyIds.push(story.id);
            });
            var sql = 'SELECT t.id, t.iteration_id, t.estimated_time, t.status_id, t.user_id, u.name FROM ?? AS t ' +
                'INNER JOIN ?? AS u ON u.id = t.user_id ' + // 用户
                'WHERE t.story_id IN (?) ORDER BY t.user_id ASC';
            var query = db.query(sql, [Task.tablename, UserModel.tablename, storyIds], function(err, tasks) {
                if (err) {
                    console.log(err);
                    return;
                }
                callback(null, tasks);
            });
            console.log('sql - Task.getHoursByVersionId - ', query.sql);
        },
    ], function(err, result) {
        if (err) {
            console.log(err);
            callback([]);
        }
        callback(result);
    });
}

module.exports = Task;