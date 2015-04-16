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
  },
  version_id: {
    type: Sequelize.INTEGER,
  },
});

module.exports = StoryModel;