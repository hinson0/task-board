// 依赖
var db = require('./db');
var moment = require('moment');

// 导出
module.exports = User;

// 类
function User(user) {
    this.xxjiaUserId = user.xxjia_user_id || 0;
    this.workerNum = user.worker_num || 0;
    this.name = user.name || '';
    this.email = user.email || '';
    this.mobile = user.mobile || '';
};

// 实例方法
User.prototype.save = function (callback) { // 保存
    var props = {
        xxjia_user_id: this.xxjiaUserId,
        worker_num: this.workerNum,
        name: this.name,
        email: this.email,
        mobile: this.mobile,
        create_time: moment().unix()
    };
    var sql = 'INSERT INTO ?? SET ?';
    var query = db.query(sql, [User.tablename, props], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback(results.insertId);
        }
    });
    console.log('sql - User.prototype.save - ', query.sql);
};

// 类属性
User.tablename = 'user';

// 类方法
User.getAll = function(callback) {
    var query = db.query('SELECT * FROM ??', [User.tablename], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        callback(results);
    });
    console.log('sql - User.getAll - ', query.sql);
}
User.getList = function(condition, pagination, includeTotal, callback) { // 获取列表
    if (condition === null) {
        var sql = 'SELECT * FROM ??';
        var props = [User.tablename];
    } else {
        var sql = 'SELECT * FROM ?? WHERE ?';
        var props = [User.tablename, condition];
    }
    sql += ' LIMIT ?, ?';
    props.push(parseInt(pagination.offset, 10));
    props.push(parseInt(pagination.size, 10));
    var query = db.query(sql, props, function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (User._isIncludeTotal(includeTotal)) {
            if (condition === null) {
                var sql = 'SELECT COUNT(*) AS total FROM ??';
                var props = [User.tablename];
            } else {
                var sql = 'SELECT COUNT(*) AS total FROM ?? WHERE ?';
                var props = [User.tablename, condition];
            }
            db.query(sql, props, function(errOnTotal, resultsOnTotal) {
                return callback({total: resultsOnTotal[0].total, list: results});
            });
        } else {
            return callback(results);
        }
    });
    console.log('sql - User.getList - ', query.sql);
};
User.getByXxjiaUserId = function(xxjiaUserId, callback) { // 根据xxjia_user_id查找用户
    var query = db.query('SELECT id FROM ?? WHERE xxjia_user_id = ?', [User.tablename, xxjiaUserId], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - User.getByXxjiaUserId - ', query.sql);
};
User.getById = function(id, callback) { // 按照ID查找
    id = parseInt(id, 10);
    var query = db.query('SELECT * FROM ?? WHERE id = ?', [User.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - User.getById - ', query.sql);
};
User.deleteById = function(id, callback) { // 删除用户
    var query = db.query('DELETE FROM ?? WHERE id = ?', [User.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return callback();
    });
    console.log('sql - User.deleteById - ', query.sql);
};
User.modiById = function(id, props, callback) {
    id = parseInt(id, 10);
    var query = db.query('UPDATE ?? SET ? WHERE id = ?', [User.tablename, props, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback();
        }
    });
    console.log('sql - User.modiById - ', query.sql);
}

User._isIncludeTotal = function(isIncludeTotal) {
    isIncludeTotal = parseInt(isIncludeTotal, 10);
    return isIncludeTotal === 0 ? false : true;
}
