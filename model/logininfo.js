// 依赖
var db = require('./db');
var moment = require('moment');

// 导出
module.exports = LoginInfo;

// 类
function LoginInfo(info) {
    this.info = info;
}

// 保存
LoginInfo.prototype.save = function(callback) {
    var props = {
        info: JSON.stringify(this.info),
        create_time: moment().unix()
    };
    db.query('INSERT INTO logininfo SET ?', props, function(err, results) {
        if (err) {
            console.log('logininfo save', err.message);
            return callback(err, null);
        }
        return callback(err, results);
    });
};
