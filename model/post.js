// 依赖
var Sequelize = require('sequelize');
var base = require('./base');

module.exports = PostModel;

PostModel.statusOnline = 0;
PostModel.statusOffline = 99;

// 类
//var PostModel = base.define('post', {
//  title: {
//    type: Sequelize.STRING,
//    allowNull: false,
//    defaultValue: ''
//  },
//  content: {
//    type: Sequelize.STRING,
//    allowNull: false,
//    defaultValue: ''
//  },
//  create_time: {
//    type: Sequelize.INTEGER,
//    allowNull: false,
//    defaultValue: 0
//  },
//}, {
//  paranoid: true,
//  comment: '评论表',
//  classMethods: {
//    say: function() {
//      return 'say';
//    }
//  },
//  instanceMethods: {
//    world: function() {
//      return 'world';
//    }
//  }
//});

function PostModel() {
  
}
