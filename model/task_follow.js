var db = require('./db');
var moment = require('moment');

function TaskFollow(props) {
    this.taskId = props.task_id;
    this.prevTaskId = props.prev_task_id;
}

TaskFollow.prototype.save = function(callback) {
    var props = {
        task_id: this.taskId,
        prev_task_id: this.prevTaskId,
        create_time: moment().unix()
    };
    var query = db.query('INSERT INTO ?? SET ?', [TaskFollow.tablename, props], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback(results.insertId);
        }
    });
    console.log('sql - TaskFollow.prototype.save - ', query.sql);
}

TaskFollow.tablename = 'task_follow';
TaskFollow.getByUnixTP = function(taskId, prevTaskId, callback) {
    var query = db.query('SELECT * FROM  ?? WHERE task_id = ? AND prev_task_id = ?', [TaskFollow.tablename, taskId, prevTaskId], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - TaskFollow.getByUnixTP - ', query.sql);
}
TaskFollow.getListByTaskId = function(taskId, callback) {
    var query =db.query('SELECT * FROM ?? WHERE task_id = ?', [TaskFollow.tablename, taskId], function(err, list) {
        if (err) {
            console.log(err);
            return;
        }
        return callback(list);
    });
    console.log('sql - TaskFollow.getListByTaskId - ', query.sql);
}

TaskFollow.deleteByTaskId = function(taskId, callback) {
    var query = db.query('DELETE FROM ?? WHERE task_id = ?', [TaskFollow.tablename, taskId], function(err, result) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            callback(result);
        }
    });
    console.log('sql - TaskFollow.deleteByTaskId - ', query.sql);
}

module.exports = TaskFollow;