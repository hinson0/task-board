// 依赖
var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

// 类
var VersionModel = base.define('version', {
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
  },
  status: {
    type: Sequelize.INTEGER,
    validate: {
      isIn: [[0, 1, 99]]
    }
  },
  create_time: {
    type: Sequelize.INTEGER,
  },
}, {
  instanceMethods: {
    toggle: function(status) {
      status = parseInt(status);
      if (status === 1) {
        this.status = 1;
        return this.save();
      } else {
        this.status = 0;
        return this.save();
      }
    }
  }
});

// 状态
VersionModel.statusOnline = 0;
VersionModel.statusClosed = 1;
VersionModel.statusDeleted = 99;

// 关系
var ProjectModel = require('./project_model');
VersionModel.belongsTo(ProjectModel, { foreignKey: 'project_id' });

module.exports = VersionModel;