// 依赖
var http = require('http');
var xxjia = require('../config/xxjia');
var UserModel = require('../model/user');

// UserService
var User = module.exports = {
    loginFromXxjia: function(loginInfo, callback) {
        var contents = JSON.stringify({
            client_key: loginInfo.client_key,
            platform_id: loginInfo.platform_id,
            account: loginInfo.account,
            password: loginInfo.password,
            device_id: loginInfo.device_id
        });
        var options = {
            host: xxjia.url,
            path: '/user/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': contents.length
            }
        };
        var req = http.request(options, function(res) {
            var chunks = [];
            var size = 0;

            res.on('data', function(data) {
                chunks.push(data);
                size += data.length;
            });
            res.on('end', function() {
                var buf = Buffer.concat(chunks, size);
                callback('', JSON.parse(buf.toString()));
            });
        });
        req.write(contents);
        req.end();
    },
    saveWhenLoginFromXxjia: function(loginInfo, mobile, callback) {
        UserModel.getByXxjiaUserId(loginInfo.uid, function(user) {
            if (user.id) {
                callback(user);
                return;
            }
            var props = {
                xxjia_user_id: loginInfo.uid,
                mobile: mobile
            };
            var user = new UserModel(props);
            user.save(function(id) {
                callback({id: id});
            });
        });
    }
};