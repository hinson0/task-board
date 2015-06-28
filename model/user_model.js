var Sequelize = require('sequelize');
var base = require('./base');
var crypto = require('crypto');
var moment = require('moment');

var UserModel = module.exports = base.define('user', {
  mobile: {
    type: Sequelize.STRING,
  },
  worker_num: {
    type: Sequelize.INTEGER,
  },
  password: {
    type: Sequelize.STRING,
  },
  salt: {
    type: Sequelize.STRING,
  },
  name: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
  },
  create_time: {
    type: Sequelize.INTEGER,
  },
}, {
  instanceMethods: {
    isPasswordValid: function(password) {
      var md5 = crypto.createHash('md5');
      md5.update(this.salt + password);
      return md5.digest('hex') === this.password;
    }
  },
  classMethods: {
    generateSalt: function () {
      var md5 = crypto.createHash('md5');
      md5.update('flzt' + moment().format('x'));
      return md5.digest('hex');
    },
    generatePassword: function (salt, password) {
      var md5 = crypto.createHash('md5');
      md5.update(salt + password);
      return md5.digest('hex');
    }
  }
});