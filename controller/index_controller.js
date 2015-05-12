var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var fs = require('fs');
var _ = require('underscore');

var Sequelize = require('sequelize');
var PostModel = require('../model/post_model');
var IterationModel = require('../model/iteration_model');
var VersionModel = require('../model/version_model');
var ProjectModel = require('../model/project_model');
var StoryModel = require('../model/story_model');
var TaskModel = require('../model/task_model');

var Logger = require('../library/logger');

/* GET home page. */
router.get('/', function (req, res) {
  
  if (0) {
    ProjectModel
      .find(54)
      .then(function (project) {
        project
          .getVersions()
          .then(function (versions) {
            res.json(versions);
          });
      });
  }
  
  if (0) {
    ProjectModel
      .findAll({
        include: [
          {
            model: VersionModel,
            where: {status: {$ne: 99}},
          }
        ],
        offset: 0,
        limit: 10
      })
      .then(function (versions) {
        res.json(versions);
      });
  }
  
  if (0) {
//    moment().get('year');
//    moment().get('month');
    var year = moment().get('year');
    var month = moment().get('month') + 1;
    var date = moment().get('date');
    console.log(year, month, date);
    console.log(moment(year + '-' + month + '-' + date, 'YYYY-MM-DD').unix());
    var time = moment('20150508', 'YYYYMMDD').add(1, 'days').unix();
    console.log(time);
  }
  
  if (0) {
    var arr = [ 44, 53, 53, 53 ];
    var arr1 = [];
    arr.forEach(function (item) {
      console.log(item in arr1);
      if (_.indexOf(arr1, item) !== -1) {
        return;
      }
      arr1.push(item);
    });
    res.json(arr1);
  }
  
  if (0) {
    fs.stat('/data/cephfs/log/board/csv-80.log', function (err, info) {
      res.json(info);
    });
    
  }
  
  if (0) {
    var relaxed = '20150102,20150103';
    var startDate = moment(1420070400, 'X');
    var endDate = moment(1422921600, 'X');
    var dates = [];
    while (endDate.isAfter(startDate)) {
      var format = startDate.format('YYYYMMDD');
      if (relaxed.indexOf(format) === -1) {
        dates.push(format);
      }
      startDate.add(1, 'days');
    }
    dates.push(endDate.format('YYYYMMDD'));
    console.log(dates);
  }
  
  /**
   * 
   */
  if (0) {
    var newDates = {};
    
    
//    console.log(newDates.date === undefined); // true
//    console.log(newDates.date === 'undefined'); // false
    dates = [20150101, 20150102, 20150103, 20150101];
    dates.forEach(function (date) {
//      if (newDates.date === undefined) {
//        newDates[date] = 0;
//      } else {
//        newDates[date] += 1;
//      }

      if (date in newDates) {
        console.log(1);
        newDates[date] += 1;
      } else {
        newDates[date] = 0;
      }

    });
    console.log(newDates);
  }
  
  /**
   * 时间
   */
  if (0) {
    var startDate = moment(1426905668, 'X').format('YYYYMMDD');
    var endDate = moment(1435632068, 'X').format('YYYYMMDD');
    
    startDate = 20150101;
    endDate = 20150130;
    var relaxed = '20150103,20150128';
    
    var dates =  [];
    for (var i = startDate; i <= endDate; i++) {
      if (relaxed.indexOf(i) === -1) {
        dates.push(i);
      }
    }
    console.log(dates);
  }
  
  /**
   * async map
   */
  if (0) {
    async.map([1, 2, 3], function (item, cb) {
      item = item + 1;
      if (item === 2) {
        cb(111);
        return;
      }
      cb(null, item);
    }, function (err, result) {
      res.json(err);
      res.json(result);
    });
  }
  
  /**
   * story数据转移
   */
  if (0) {
    async.waterfall([
      function (callback) { // 读取表story，填充version_id
        StoryModel
          .findAll()
          .then(function (stories) {
            stories.forEach(function (story) {
              if (story === null) {
                callback(null);
              }
              if (story.version_id !== 0) {
                callback(null);
              }
              IterationModel
                .find(story.iteration_id)
                .then(function (iteration) {
                  if (iteration === null) {
                    return;
                  }
                  story
                    .updateAttributes({
                      version_id: iteration.version_id
                    })
                    .then(function (story) {
                      callback(null);
                    });
                });
            });
          });
      },
    ], function (err, result) {
      res.json(result);
    });
  }


  /**
   * story数据转移
   */
  if (0) {
    // 读取表story，填充version_id
    Sequelize
      .transaction()
      .then(function (t) {
        return PostModel.create({
          title: 'hello',
          content: 'ddddd'
        }, {transaction: t}).then(function (post) {
          return PostModel
            .create({
              ti1tle: 'xxx',
              content: 'dddd'
            }, {transaction: t});
        });
      })
      .then(function () {
        console.log('commit');
        t.commit();
      })
      .catch(function () {
        console.log('rollback');
        t.rollback();
      });
      res.json({id: 1});
  }

  /**
   * testing
   */
  if (0) {
    res.json({id: PostModel.statusOffline});
  }

  /**
   * nested eager loading
   */
  if (0) {
    IterationModel
      .find({
        where: {
          id: 21
        },
        include: [
          {model: VersionModel, include: [ProjectModel]},
        ]
      })
      .then(function (iteration) {
        res.json(iteration);
      });
  }
});

/**
 * 导入end_time
 */
router.get('/endtime', function (req, res) {
  TaskModel
    .findAll()
    .then(function (tasks) {
      async.each(tasks, function (task) {
        if (task.isCompleted()) {
          return;
        }
        if (task.end_time === 0 && task.start_time !== 0) {
          task
            .update({
              end_time: task.start_time
            });
        }
      }, function (err) {
        console.log(err);
      });
    });
    res.json({msg: 'ok'});
});

/**
 * 将未完成的任务end_time重置0
 */
router.get('/repair_endtime', function (req, res) {
  TaskModel
    .findAll({
      where: {status_id: {$ne: 50}, end_time: {$ne: 0}}
    })
    .then(function (tasks) {
      async.each(tasks, function (task) {
        task.update({end_time: 0});
      }, function (err) {
        console.log(err);
      });
    });
  res.json({msg: '重置完成'});
});

/**
 * 将待开发的start_time重置0
 */
router.get('/repair_starttime', function (req, res) {
  TaskModel
    .findAll({
      where: {status_id: 10, start_time:{$ne: 0}}
    })
    .then(function (tasks) {
      async.each(tasks, function (task) {
        task.update({start_time: 0});
      }, function (err) {
        console.log(err);
      });
    });
  res.json({msg: '重置完成'});
});

/**
 * 将start_time=0的记录值为4.30
 */
router.get('/starttime', function (req, res) {
  TaskModel
    .findAll({
      where: {start_time: 0, status_id: 50}
    })
    .then(function (tasks) {
      async.each(tasks, function (task) {
        var props = {
          start_time: moment('2015-04-30', 'YYYY-MM-DD').unix()
        };
        if (task.end_time === 0) {
          props.end_time = moment('2015-04-30', 'YYYY-MM-DD').unix()
        }
        task.update(props);
      }, function (err) {
        res.json(err);
      });
    });
  res.json({msg: 'ok'});
});

module.exports = router;
