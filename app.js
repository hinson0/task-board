var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
//var MongoStore = require('connect-mongo')(session);
var validator = require('express-validator');

var app = express();

// 设置环境
app.set('env', 'development');

// view engine setup
app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// 数据校验
app.use(validator({
  customValidators: {
    isArray: function(value) { // 判断是否为数组
      return Array.isArray(value);
    }
  },
  errorFormatter: function (param, msg, value) { // 格式化错误输出结果
    return {
      param: param,
      msg: msg,
      value: value
    };
  }
}));

// cookie & session
app.use(cookieParser());
app.use(session({
  secret: 'flzt',
  resave: false, // 如果为true，则每次都会强制将session数据保存起来；在一个客户端并发多次请求时，如果第一次请求将session发生变化，后续的请求将会无效了
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天

  },
  //store: new MongoStore(require('./config/global').get('mongo'))
  store: new RedisStore({
    client: require('./library/redis').create()
  })
}));

// 文件上传
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({
  dest: '/tmp/board'
}));

// 跨域
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

// 路由
var SiteController = require('./controller/index_controller');
var UserController = require('./controller/user_controller');
var ProjectController = require('./controller/project_controller');
var VersionController = require('./controller/version_controller');
var IterationController = require('./controller/iteration_controller');
var StoryController = require('./controller/story_controller');
var TaskController = require('./controller/task_controller');
var TaskStatusController = require('./controller/task_status_controller');
var StatisticController = require('./controller/statistics_controller');
var MsgController = require('./controller/msg_controller');
var TestController = require('./controller/test_controller');

app.use('/', SiteController);
app.use('/user', UserController);
app.use('/projects', ProjectController);
app.use('/versions', VersionController);
app.use('/iterations', IterationController);
app.use('/stories', StoryController);
app.use('/tasks', TaskController);
app.use('/task_statuses', TaskStatusController);
app.use('/statisticses', StatisticController);
app.use('/msgs', MsgController);
app.use('/test', TestController);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
