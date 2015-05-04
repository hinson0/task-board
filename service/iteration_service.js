var async = require('async');
var moment = require('moment');
var logger = require('../library/logger');

var VersionModel = require('../model/version_model');
var ProjectModel = require('../model/project_model');
var IterationModel = require('../model/iteration_model');

var IterationService = {
  upload: function (csvId, info, callback) {
    /**
     * info数据格式 
     * 名称,时间,所属项目,所属版本,
     * 第一迭代,20150416-20150516,导购app,v0.1,
     */
    
    var props = info.split(',');
    
    logger.log('csv', '----', csvId);
    logger.log('csv', '版本 - 开始导入，信息为：', csvId);
    logger.log('csv', props.toString(), csvId);
    
    async.waterfall([
      // 检查项目存在否
      function (callback) {
        ProjectModel
          .find({
            where: {name: props[2]}
          })
          .then(function (project) {
            if (project === null) {
              callback('迭代 - 项目[' + props[2] + ']不存在，忽略');
            } else {
              callback(null, project);
            }
          });
      },
      // 检查版本存在否
      function (project, callback) {
        VersionModel
          .find({
            where: {project_id: project.id, name: props[3]}
          })
          .then(function (version) {
            if (version === null) {
              callback('迭代 - 项目[' + props[2] + ']，版本[' + props[3] + ']不存在，忽略');
            } else {
              callback(null, project, version);
            }
          });
      },
      // 执行导入
      function (project, version, callback) {
        var time = props[1].split('-');
        
        IterationModel
          .findOrCreate({
            where: {version_id: version.id, name: props[0]},
            defaults: {
              start_time: moment(time[0], 'YYYYMMDD').format('X'),
              end_time: moment(time[1], 'YYYYMMDD').format('X'),
            }
          })
          .spread(function (iteration, created) {
            if (created) {
              logger.log('csv', '迭代 - 项目[' + project.name + ']，版本[' + version.name + ']，迭代[' + iteration.name + ']导入成功，ID=' + iteration.id, csvId);
            } else {
              logger.log('csv', '迭代 - 项目[' + project.name + ']，版本[' + version.name + ']，已存在迭代[' + iteration.name + ']，ID=' + iteration.id + '，忽略', csvId);
            }
            callback(null);
          });
      }
    ], function (err, result) {
      // 成功
      if (err) {
        logger.log('csv', err, csvId);
      }
      callback(err, result);
    });
  }
};

module.exports = IterationService;