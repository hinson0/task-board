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
  create_time: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: moment().unix()
  },
  version_id: {
    type: Sequelize.INTEGER,
  },
});

// 关系
var UserModel = require('./user2');
StoryModel.belongsTo(UserModel, {foreignKey: 'leader'});

module.exports = StoryModel;