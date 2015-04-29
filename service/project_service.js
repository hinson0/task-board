var ProjectModel = require('../model/project_model');
var UserModel = require('../model/user_model');
var async = require('async');

var Project = {
  upload: function (content, callback) {
    var props = content.split(',');
    var username = props[1];
    
    console.log('----');
    console.log('项目 - 开始导入，信息为：');
    console.log(props);
    
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
              console.log('项目 - [' + project.name + ']导入成功，ID=' + project.id + '。');
            } else {
              console.log('项目 - [' + project.name + ']已存在，忽略。');
            }
            cb(null);
          });
      }
    ], function (err) {
      if (err) {
        console.log(err);
      }
      callback(null);
    });
  }
};

module.exports = Project;

