var async = require('async');
var logger = require('../library/logger');

var ProjectModel = require('../model/project_model');
var UserModel = require('../model/user_model');

var Project = {
  upload: function (csvId, content, callback) {
    var props = content.split(',');
    var username = props[1];
    
    logger.log('csv', '----', csvId);
    logger.log('csv', '项目 - 开始导入，信息为：', csvId);
    logger.log('csv', props.toString(), csvId);
    
    async.waterfall([
      function (cb) {  // 检查用户是否存在
        UserModel
          .find({
            where: {
              name: username
            }
          })
          .then(function (user) {
            if (user === null) {
              cb('项目 - 用户[' + username + ']不存在，忽略');
            } else {
              cb(null, user);
            }
          });
      },
      function (user, cb) { // 插入项目
        ProjectModel
          .findOrCreate({
            where: {name: props[0]},
            defaults: {leader: user.id}
          })
          .spread(function (project, created) {
            if (created) {
              logger.log('csv', '项目 - [' + project.name + ']导入成功，ID=' + project.id + '。', csvId);
            } else {
              logger.log('csv', '项目 - [' + project.name + ']已存在，忽略。', csvId);
            }
            cb(null);
          });
      }
    ], function (err) {
      if (err) {
        logger.log('csv', err, csvId);
      }
      callback(null);
    });
  }
};

module.exports = Project;

