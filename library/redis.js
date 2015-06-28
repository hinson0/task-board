var redis = require('redis');
var crypto = require('crypto');

var Redis = {
  clients: [],
  create: function (config) {
    console.log('获取redis client实例');

    config = config || require('../config/redis');

    console.log('redis的配置信息为' + JSON.stringify(config));

    var key = this.key(config);

    console.log('缓存key值为' + key);

    if (!this.clients[key]) {
      console.log('缓存中没有，开始创建redis client实例');
      this.clients[key] = redis.createClient(config.port, config.host);
    } else {
      console.log('读取缓存中的redis client实例');
    }

    return this.clients[key];
  },
  key: function (config) {
    var md5 = crypto.createHash('md5');
    md5.update(JSON.stringify(config));
    return md5.digest('hex').substr(0, 4);
  }
};

module.exports = Redis;