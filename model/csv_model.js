var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

var CsvModel = base.define('csv', {
  md5: {
    type: Sequelize.STRING,
    validate: {
      len: [32, 32]
    }
  },
  size: {
    type: Sequelize.STRING
  },
  mime: {
    type: Sequelize.STRING,
    validate: {
      len: [0, 140]
    }
  },
  name: {
    type: Sequelize.STRING,
    validate: {
      len: [0, 140]
    }
  },
  originalname: {
    type: Sequelize.STRING,
    validate: {
      len: [0, 140]
    }
  },
  create_time: {
    type: Sequelize.STRING
  }
});

module.exports = CsvModel;