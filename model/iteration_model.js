// 依赖
var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

// 类
var IterationModel = base.define('iteration', {
  version_id: {
    type: Sequelize.INTEGER,
  },
  name: {
    type: Sequelize.STRING,
  },
  start_time: {
    type: Sequelize.INTEGER,
  },
  end_time: {
    type: Sequelize.INTEGER,
    validate: {
      ltStartTime: function() {
        if (this.start_time >= this.end_time) {
          throw new Error('结束时间应大于起始时间');
        }
      }
    }
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: {
        msg: '状态值为整形数值'
      },
      isIn: {
          args: [[0, 1, 99]],
          msg: '值为非法值',
      },
    }
  },
  create_time: {
    type: Sequelize.INTEGER,
    defaultValue: moment().unix(),
  },
}, {
  validate: {
    
  },
  classMethods: {
    
  },
  instanceMethods: {
    isClosed: function() {
      return this.status === IterationModel.statusClosed;
    },
    toggle: function () { // 关闭/打开迭代
      if (this.status === 0) {
        this.status = 1;
        return this.save();
      } else {
        this.status = 0;
        return this.save();
      }
    },
    getDates: function () {
      var startDate = moment(this.start_time, 'X').format('YYYYMMDD');
      var endDate = moment(this.end_time, 'X').format('YYYYMMDD');
      var dates = [];
      for (var i = startDate; i <= endDate; i++) {
        dates.push(i);
      }
      return dates;
    }
  }
});

// 状态
IterationModel.statusOnline = 0; // 打开
IterationModel.statusClosed = 1; // 关闭
IterationModel.statusDeleted = 99; // 删除

// 关系
var VersionModel = require('./version_model');

IterationModel.belongsTo(VersionModel, { foreignKey: 'version_id' });

// 导出
module.exports = IterationModel;