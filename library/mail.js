var nodemailer = require('nodemailer');
var config = require('../config/global').get('email');

var transpoter = nodemailer.createTransport({
  service: config.service,
  auth: {
    user: config.username,
    pass: config.password
  }
});

function Mail(toEmail) {
  this.toEmail = toEmail;
}

Mail.prototype.send = function (msg) {
  var mailOptions = {
    from: config.username,
    to: this.toEmail,
    subject: msg,
    text: msg,
    html: '<b>' + msg + '</b>'
  };
  transpoter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('message sent: ' + info.response);
  });
}

module.exports = exports = Mail;