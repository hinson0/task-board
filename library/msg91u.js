var http = require('http');
var querystring = require('querystring');

function Msg91U(workerId, config) {
  this.workerId = Number(workerId);
  this.config = this.initConfig(config);
};

Msg91U.prototype.send = function(msg) {
  //var payload = JSON.stringify({
  //  sender: {
  //    appid: this.config.appid,
  //    permcode: this.config.permcode,
  //  },
  //  msg: {
  //    type: this.config.type,
  //    msgtype: this.config.msgtype,
  //    msgbody: msg,
  //  },
  //  receivers: [this.workerId]
  //});
  //var options = {
  //  host: this.config.host,
  //  port: this.config.port,
  //  method: 'POST',
  //  path: '/appmsg',
  //};
  //var client = http.request(options);
  //client.write(payload);
  //client.end();

  var payload = JSON.stringify({
    "data": {
      "service": "service_ndim",
      "method": "send",
      "params": [
        msg, [this.workerId]
      ]
    },
    "pack_type": "raw"
  });
  var buf = new Buffer(payload);
  var options = {
    // hostname: 'yzb.service.192.168.94.26.xip.io',
    hostname: ' simulateserviceapi.xxjia.cn',
    method: 'POST',
    path: '/service/call',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'Content-Length': buf.length
    }
  };
  var client = http.request(options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (data) {
      console.log(data);
    });
  });
  client.write(buf);
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
    msgtype: 0
  };
  return config;
};

module.exports = Msg91U;