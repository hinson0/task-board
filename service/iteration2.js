// 依赖
var IterationModel2 = require('../model/iteration2');
var VersionModel = require('../model/version2');
var ProjectModel = require('../model/project2');
var async = require('async');

// 定义
var IterationService = {
  formatList: function(query, callback) {
    // 获取列表
    var where = {
      status: IterationModel2.statusOnline,
    };
    if (query.version_id) {
      where.version_id = query.version_id;
    }
    IterationModel2
      .findAndCount({
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