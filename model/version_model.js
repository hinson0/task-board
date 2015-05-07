// 依赖
var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

// 类
var VersionModel = module.exports = base.define('version', {
  project_id: {
    type: Sequelize.INTEGER,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: '',
    validate: {
      min: 0,
      max: 10,
    }
  },
  start_time: {
    type: Sequelize.INTEGER,
    validate: {
      isLtStartTime: function () {
        if (this.start_time > this.end_time) {
          throw new Error('结束时间应大于起始时间');
        }
      }
    }
  },
  end_time: {
    type: Sequelize.INTEGER,
    validate: {
      isGtStartTime: function () {
        if (this.start_time > this.end_time) {
          throw new Error('结束时间应大于起始时间');
        }
      }
    }
  },
  relaxed: {
    type: Sequelize.STRING,
    defaultValue: '',
  },
  status: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isIn: [[0, 1, 99]]
    }
  },
  create_time: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
}, {
  instanceMethods: {
    toggle: function() {
      if (this.status === 0) {
        this.status = 1;
        return this.save();
      } else {
        this.status = 0;
        return this.save();
      }
    },
    getDates: function () { // 获取版本对应的时间，去除休息段的时间
      var startDate = moment(this.start_time, 'X');
      var endDate = moment(this.end_time, 'X');
      var dates = [];
      while (endDate.isAfter(startDate)) {
        var format = startDate.format('YYYYMMDD');
        if (this.relaxed.indexOf(format) === -1) {
          dates.push(format);
        }
        startDate.add(1, 'days');
      }
      dates.push(endDate.format('YYYYMMDD'));
      return dates;
    }
  }
});

// 状态
VersionModel.statusOnline = 0;
VersionModel.statusClosed = 1;
VersionModel.statusDeleted = 99;

// 关系
var ProjectModel = require('./project_model');
var IterationModel = require('./iteration_model');
VersionModel.belongsTo(ProjectModel, { foreignKey: 'project_id' });
VersionModel.hasMany(IterationModel, { foreignKey: 'version_id' });