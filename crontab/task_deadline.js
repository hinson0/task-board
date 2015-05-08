var http = require('http');

var options = {
  host: 'dev.hbapi.hair.192.168.94.26.xip.io',
  port: 80,
  path: '/tasks/deadline',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};
var req = http.request(options);
req.end();

/**
 * crontab -e
 * 19 16 * * * /home/yangzb/bin/node /home/yangzb/1_projects/hb_dev/crontab/task_deadline.js
 */