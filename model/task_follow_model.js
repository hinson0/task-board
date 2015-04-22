var Sequelize = require('sequelize');
var base = require('./base');

var TaskFollowModel = base.define('task_follow', {
  task_id: {
    type: Sequelize.INTEGER,
  },
  prev_task_id: {
    type: Sequelize.INTEGER,
  },
  create_time: {
    type: Sequelize.INTEGER,
  }
}, {
  classMethods: {
    
  }
});

module.exports = TaskFollowModel;