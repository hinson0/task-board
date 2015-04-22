var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

var StoryModel = base.define('story', {
  title: {
    type: Sequelize.STRING,
  },
  leader: {
    type: Sequelize.INTEGER,
  },
  iteration_id: {
    type: Sequelize.INTEGER
  },
  version_id: {
    type: Sequelize.INTEGER,
  },
  priority: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
      max: {
        args: 5,
        msg: '优先级最大值为5',
      },
    }
  },
  status: {
    type: Sequelize.INTEGER
  },
  create_time: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: moment().unix()
  }
}, {
  classMethods: {
    findByVt: function (versionId, title) { // 根据版本号，标题
      return StoryModel
        .find({
          where: {
            version_id: versionId,
            title: title
          }
        });
    }
  }
});

// 状态
StoryModel.statusOnline = 0;
StoryModel.statusDeleted = 99;

// 关系
var UserModel = require('./user_model');
StoryModel.belongsTo(UserModel, {foreignKey: 'leader'});

module.exports = StoryModel;