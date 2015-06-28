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
      if (this.password === '') {
        this.password = password = 123456;
      }

      if (!this.isSaltEmpty()) { // 老数据的密码是没有salt的
        var md5 = crypto.createHash('md5');
        md5.update(this.salt + password);
        return md5.digest('hex') === this.password;
      }

      // 对比结果
      var valid = this.password === password;

      if (valid) {
        // 将salt值填充
        var salt = UserModel.generateSalt();
        var password = UserModel.generatePassword(salt, this.password);
        this.update({
          salt: salt,
          password: password
        });
      }

      return valid;
    },
    isSaltEmpty: function() {
      return this.salt === '';
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