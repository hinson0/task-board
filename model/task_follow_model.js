var Sequelize = require('sequelize');
var base = require('./base');

var TaskFollowModel = module.exports = base.define('task_follow', {
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

TaskFollowModel.idWaiting = 10;
TaskFollowModel.idIng = 20;
TaskFollowModel.idCompleted = 50;