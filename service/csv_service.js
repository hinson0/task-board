var crypto = require('crypto');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var iconv = require('iconv-lite');
var async = require('async');

var CsvModel = require('../model/csv_model');
var ProjectService = require('../service/project_service');

var CsvService = {
  root: '/data/cephfs/board',
  upload: function (csv, callback) {
    var self = this;
    this.insertDb(csv, function (err, csvModel) {
      fs.readFile(csv.path, function (err, data) {
        if (err) {
          throw err;
        }
        self.generateTasks(data);
        self.mvFile(csv, data);
      });
      callback(null, csvModel);
    });
  },
  getDir: function (name) {
    var key = name.split('.')[0];
    var part1 = key.substr(0, 2);
    var part2 = key.substr(2, 2);
    return this.root + '/' + part1 + '/' + part2;
  },
  mkdir: function (dir, mode, callback) { // 创建多级目录
    var self = this;
    path.exists(dir, function (exists) {
      if (exists) {
        callback(dir);
      } else {
        self.mkdir(path.dirname(dir), mode, function () {
          fs.mkdir(dir, mode, callback);
        });
      }
    });
  },
  insertDb: function (csv, callback) {
    // 新建记录
    var md5 = crypto.createHash('md5');
    md5.update(csv.path);
    CsvModel
      .build({
        md5: md5.digest('hex'),
        size: csv.size,
        mime: csv.mimetype,
        name: csv.name,
        originalname: csv.originalname,
        create_time: moment().unix()
      })
      .save()
      .then(function (csv) {
        callback(null, csv);
      })
      .catch(function (err) {
        console.log(err.errors[0].message);
        throw err;
      });
  },
  mvFile: function (csv, data) {
    var dir = this.getDir(csv.name);
    this.mkdir(dir, 0777, function (err) {
      if (err) {
        console.log(err);
        throw err;
      }
      var filename = dir + '/' + csv.name;
      fs.writeFile(filename, data);
    });
  },
  generateTasks: function (data) {
    var parsedContent = this.parseContent(data);
    var self = this;
    async.series([ // 并行触发
      function (callback) { // 项目
        self.generateProject(parsedContent.project, function (err, project) {
          callback(err, project);
        });
      },
      function (callback) { // 版本
        self.generateVersion(parsedContent.version, function (err, project) {
          callback(err);
        });
      }
    ], function (err, result) {
      if (err) {
        console.log(122222);
        console.log(err);
        return;
      }
      console.log(result);
    });
  },
  generateProject: function (parsedProject, callback) { // 生成项目
    // 没有项目信息
    if (parsedProject.length === 0) {
      console.log('项目 - 没有项目信息');
      callback(null);
      return;
    }
    
    // 项目信息
    var self = this;
    var slicedProjects = parsedProject.slice(2);
    
    // 过滤项目
    var projects = [];
    async.filter(slicedProjects, function (project, cb) {
      if (self.isEmptyContent(project)) {
        cb(false);
      } else {
        cb(true);
      }
    }, function (result) {
      projects = result;
    });
    
    // 导入项目
    async.eachSeries(projects, function (project, cb) {
      ProjectService.upload(project, function (err, project) {
        if (err) {
          console.log(err);
        }
        cb(null);
      });
    }, function (err) {
      if (err) {
        console.log(err);
      }
      callback(null);
    });
  },
  generateVersion: function (parsedVersion, callback) {
    
  },
  generateTask: function (taskContents) {
    
  },
  parseContent: function (data) { // 有没有更好的parse方式?感觉现在的方式好low
    var decoded = iconv.decode(data, 'gbk');
    var contents = decoded.split('\r\n');
    var self = this;
    var Parsedcontent = {
      project: [],
      version: [],
      iteration: [],
      story: [],
      task: []
    };
    var isProject = false;
    var isVersion = false;
    var isIteration = false;
    var isStory = false;
    var isTask = false;
    
    contents.forEach(function (content) {
      if (self.isProjectExisted(content)) {
        Parsedcontent.project.push(content);
        isProject = true;
        isVersion = false;
        isIteration = false;
        isStory = false;
        isTask = false;
      } else if (self.isVersionExisted(content)) {
        isProject = false;
        isVersion = true;
        isIteration = false;
        isStory = false;
        isTask = false;
        Parsedcontent.version.push(content);
      } else if (self.isIterationExisted(content)) {
        isProject = false;
        isVersion = false;
        isIteration = true;
        isStory = false;
        isTask = false;
        Parsedcontent.iteration.push(content);
      } else if (self.isStoryExisted(content)) {
        isProject = false;
        isVersion = false;
        isIteration = false;
        isStory = true;
        isTask = false;
        Parsedcontent.story.push(content);
      } else if (self.isTaskExisted(content)) {
        isProject = false;
        isVersion = false;
        isIteration = false;
        isStory = false;
        isTask = true;
        Parsedcontent.task.push(content);
      } else { // 内容
        if (isProject) {
          Parsedcontent.project.push(content);
        } else if (isVersion) {
          Parsedcontent.version.push(content);
        } else if (isIteration) {
          Parsedcontent.iteration.push(content);
        } else if (isStory) {
          Parsedcontent.story.push(content);
        } else if (isTask) {
          Parsedcontent.task.push(content);
        } else {
          // do nothing
        }
      }
    });
    return Parsedcontent;
  },
  isProjectExisted: function (content) {
    return content.indexOf('[项目]') !== -1;
  },
  isVersionExisted: function (content) {
    return content.indexOf('[版本]') !== -1;
  },
  isIterationExisted: function (content) {
    return content.indexOf('[迭代]') !== -1;
  },
  isStoryExisted: function (content) {
    return content.indexOf('[故事]') !== -1;
  },
  isTaskExisted: function (content) {
    return content.indexOf('[任务]') !== -1;
  },
  isEmptyContent: function (content) {
    var parts = content.split(',');
    for (var key in parts) {
      if (parts[key] !== '') {
        return false;
      }
    }
    return true;
  }
};

module.exports = CsvService;