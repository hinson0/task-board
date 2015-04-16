var http = require('http');
var querystring = require('querystring');

function Msg91U(workerId, config) {
  this.workerId = Number(workerId);
  this.config = this.initConfig(config);
};

Msg91U.prototype.send = function(msg) {
  var payload = JSON.stringify({
    sender: {
      appid: this.config.appid,
      permcode: this.config.permcode,
    },
    msg: {
      type: this.config.type,
      msgtype: this.config.msgtype,
      msgbody: msg,
    },
    receivers: [this.workerId]
  });
  var options = {
    host: this.config.host,
    port: this.config.port,
    method: 'POST',
    path: '/appmsg',
  };
  var client = http.request(options);
  client.write(payload);
  client.end();
};

Msg91U.prototype.initConfig = function(config) {
  var config = {
    host: '10.1.191.177',
    port: 1220,
    appid: 9209,
    permcode: '101',
    ApiKey: 'cf32cc19-cdff-4a4f-a847-cc96791120c9',
    receivers: [123, 124, 125],
    type: 0,
    msgtype: 0,
  };
  return config;
};

module.exports = Msg91U;