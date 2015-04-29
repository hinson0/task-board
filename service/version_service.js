var async = require('async');
var moment = require('moment');

var VersionModel = require('../model/version_model');
var ProjectModel = require('../model/project_model');

var VersionService = {
  upload: function (info, callback) {
    var props = info.split(',');
    
    console.log('----');
    console.log('版本 - 开始导入，信息为：');
    console.log(props);
    
    async.waterfall([
      function (callback) { // 检查版本
        ProjectModel
          .find({
            where: {name: props[2]}
          })
          .then(function (project) {
            if (project === null) {
              callback('版本 - 项目[' + props[2] + ']不存在，忽略');
            } else {
              callback(null, project);
            }
          });
      },
      function (project, callback) { // 检查版本是否存在
        var time = props[1].split('-');
      
        VersionModel
          .findOrCreate({
            where: {project_id: project.id, name: props[0]},
            defaults: {
              start_time: moment(time[0], 'YYYYMMDD').format('X'),
              end_time: moment(time[1], 'YYYYMMDD').format('X'),
              create_time: moment().unix()
            }
          })
          .spread(function (version, created) {
            if (created) {
              console.log('版本 - [' + version.name + ']导入成功，ID=' + version.id);
            } else {
              console.log('版本 - [' + version.name + ']已存在，ID=' + version.id +'，忽略');
            }
            callback(null);
          });
      }
    ], function (err, result) {
      if (err) {
        console.log(err);
      }
      callback(err, result);
    });
  }
};

module.exports = VersionService;