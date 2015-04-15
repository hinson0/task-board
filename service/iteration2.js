// 依赖
var IterationModel2 = require('../model/iteration2');
var VersionModel = require('../model/version2');
var ProjectModel = require('../model/project2');
var async = require('async');

// 定义
var IterationService = {
  formatList: function(query, callback) {
    // 获取列表
    var where = {};
    if (query.version_id) {
      where.versionId = query.version_id;
    }
    IterationModel2
      .findAndCountAll({
        where: where,
        offset: query.offset || 0,
        limit: query.limit || 10,
        order: 'id DESC',
        include: [
          {model: VersionModel, include: [{model: ProjectModel}]}
        ],
      })
      .then(function(result) {
        callback(null, result);
      });
  }
};

// 导出
module.exports = IterationService;