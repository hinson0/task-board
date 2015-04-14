// 依赖
var async = require('async');
var moment = require('moment');

var Helper = require('../library/helper');
var IterationModel = require('../model/iteration');
var StoryModel = require('../model/story');
var TaskModel = require('../model/task');

var Statistics = {
    storyByIterationId: function(iterationId, callback) { // 获取故事进度统计，按照迭代ID
        async.waterfall([
            // 获取迭代
            function(callback) {
                IterationModel.getById(iterationId, function(iteration) {
                    callback(null, iteration);
                });
            },

            // 获取迭代对应的任务列表
            function(iteration, callback) {
                TaskModel.getListByIterationId(iteration.id, function(tasks) {
                    iteration.tasks = tasks;
                    callback(null, iteration);
                });
            },
        ], function(err, iteration) {
            callback([iteration]);
        });
    },
    storyByVersionId: function(versionId, callback) { // 获取故事进度统计，按照版本ID
        async.waterfall([
            // 获取版本对应的迭代
            function(callback) {
                IterationModel.getListByVersioId(versionId, function(iterations) {
                    callback(null, iterations);
                });
            },
            // 获取迭代对应的故事
            function(iterations, callback) {
                var iterator = function(iteration, iterationCb) {
                    StoryModel.getListByIterationId(iteration.id, function(stories) {
                        async.map(stories, function(story, storyCb) {
                            TaskModel.getListByStoryId(story.id, function(tasks) {
                                story.tasks = tasks;
                                storyCb(null, story);
                            });
                        }, function(err, stories) {
                            iteration.stories = stories;
                            iterationCb(null, iteration);
                        });
                    });
                };
                // 获取故事对应的故事
                async.map(iterations, iterator, function(err, iterations) {
                    callback(null, iterations);
                });
            },
        ], function(err, tasks) {
            callback(tasks);
        });
    },
    storyRecentlyIteration: function(versionId, callback) { // 故事统计，统计最近迭代的
        async.waterfall([
            // 获取迭代记录
            function(callback) {
                IterationModel.getRecentOneByVersionId(versionId, function(iteration) {
                    callback(null, iteration);
                });
            },

            // 获取迭代对应的任务列表
            function(iteration, callback) {
                TaskModel.getListByIterationId(iteration.id, function(tasks) {
                    iteration.tasks = tasks;
                    callback(null, iteration);
                });
            }
        ], function(err, iteration) {
            callback([iteration]);
        });
    },

    dbcByVersionId: function(versionId, callback) {
        async.waterfall([
            // 获取版本对应的任务
            function(callback) {
                TaskModel.ngetListByVersionId(versionId, function(tasks) {
                    callback(null, tasks);
                });
            },
            // 格式化数据
            function(tasks, callback) {
                var foramtted = Statistics.formatTasks(tasks);
                callback(null, foramtted);
            },
        ], function(err, result) {
            if (err) {
                console.log(err);
                callback([]);
            }
            callback(result);
        });
    },
    dbcByIterationId: function(iterationId, callback) {
        async.waterfall([
            // 获取迭代对应的任务
            function(callback) {
                TaskModel.ngetListByIterationId(iterationId, function(tasks) {
                    if (Helper.isEmptyArray(tasks)) {
                        callback('empty tasks');
                    }
                    callback(null, tasks);
                });
            },
            // 格式化数据
            function(tasks, callback) {
                var foramtted = Statistics.formatTasks(tasks);
                callback(null, foramtted);
            },
        ], function(err, result) {
            if (err) {
                console.log(err);
                callback([]);
            }
            callback(result);
        });
    },
    formatTasks: function(tasks) {
        var days = {};
        tasks.forEach(function(task) {
            var day = moment(task.start_time, 'X').format('GGGGMMDD');
            if (!days[day]) {
                days[day] = [];
                days[day].push(task);
            } else {
                days[day].push(task);
            }
        });
        return days;
    }
};

module.exports = Statistics;
