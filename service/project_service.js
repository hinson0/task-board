var ProjectModel = require('../model/project_model');
var UserModel = require('../model/user_model');
var async = require('async');

var Project = {
  upload: function (content, callback) {
    var props = content.split(',');
    var username = props[1];
    async.waterfall([
      function (cb) {  // 检查用户是否存在
        UserModel
          .find({
            where: {
              name: username
            }
          })
          .then(function (user) {
            cb(null, user);
          });
      },
      function (user, cb) { // 插入项目
        ProjectModel
          .findOrCreate({
            where: {leader: user.id, name: props[0]}
          })
          .spread(function (project, created) {
            cb(null, project);
          });
      }
    ], function (err, project) {
      if (err) {
        callback(err);
      } else {
        callback(null, project);
      }
    });
  }
};

module.exports = Project;

