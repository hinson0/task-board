var db = require('./db');
var moment = require('moment');

function Story(props) {
    this.title = props.title;
    this.leader = props.leader;
    this.iterationId = props.iteration_id;
}

Story.prototype.save = function(callback) {
    var props = {
        title: this.title,
        leader: this.leader,
        iteration_id: this.iterationId,
        create_time: moment().unix()
    };
    var query = db.query('INSERT INTO ?? SET ?', [Story.tablename, props], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback(results.insertId);
        }
    });
    console.log('sql - Story.prototype.save - ', query.sql);
}

Story.tablename = 'story';

Story.getById = function(id, callback) {
    var query = db.query('SELECT * FROM ?? WHERE id = ?', [Story.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - getById - ', query.sql);
}
Story.getByUnixIt = function(iterationId, title, callback) {
    var query = db.query('SELECT * FROM ?? WHERE iteration_id = ? AND title = ?', [Story.tablename, iterationId, title], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - getByUnixIt - ', query.sql);
}
Story.getListByIterationId = function(iterationId, callback) {
    var query = db.query('SELECT * FROM ?? WHERE iteration_id = ?', [Story.tablename, iterationId], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return callback(results);
    });
    console.log('sql - Story.getListByIterationId - ', query.sql);
}

module.exports = Story;