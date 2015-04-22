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
  create_time: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: moment().unix()
  },
});

// 关系
var UserModel = require('./user2');
StoryModel.belongsTo(UserModel, {foreignKey: 'leader'});

module.exports = StoryModel;