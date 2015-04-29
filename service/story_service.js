var async = require('async');
var moment = require('moment');

var UserModel = require('../model/user_model');
var ProjectModel = require('../model/project_model');
var VersionModel = require('../model/version_model');
var StoryModel = require('../model/story_model');

var StoryService = {
  upload: function (info, callback) {
    /**
     * info数据格式
     * 名称,负责人,时间,所属项目,所属版本
     * 业务逻辑层-信息统计服务,王文生,20150416-20150516,导购app,v0.1
     */
    
    var props = info.split(',');
    
    console.log('----');
    console.log('故事 - 开始导入，信息为：');
    console.log(props);
    
    async.waterfall([
      // 判断用户是否存在
      function (callback) {
        UserModel
          .find({
            where: {name: props[1]}
          })
          .then(function (user) {
            if (user === null) {
              callback('故事 - 负责人[' + props[1] + ']不存在，忽略');
            } else {
              callback(null, user);
            }
          });
      },
      // 判断项目是否存在
      function (user, callback) {
        ProjectModel
          .find({
            where: {name: props[2]}
          })
          .then(function (project) {
            if (project === null) {
              callback('故事 - 项目[' + props[2] + ']不存在，忽略');
            } else {
              callback(null, user, project);
            }
          });
      },
      // 判断项目下的版本是否存在
      function (user, project, callback) {
        VersionModel
          .find({
            where: {project_id: project.id, name: props[3]}
          })
          .then(function (version) {
            if (version === null) {
              callback('故事 - 项目[' + props[2] + ']，版本[' + props[3] + ']不存在，忽略');
            } else {
              callback(null, user, project, version);
            }
          });
      },
      // 执行导入
      function (user, project, version, callback) {
        var time = props[2].split('-');
        
        StoryModel
          .findOrCreate({
            where: {version_id: version.id, title: props[0]},
            defaults: {
              leader: user.id,
              priority: 3,
            }
          })
          .spread(function (story, created) {
            if (created) {
              console.log('故事 - [' + story.title + ']导入成功，ID=' + story.id);
            } else {
              console.log('故事 - [' + story.title + ']已存在，ID=' + story.id +'，忽略');
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

module.exports = StoryService;