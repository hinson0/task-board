var express = require('express');
var router = express.Router();

var UserService = require('../service/user_service');

/* GET home page. */
router.get('/', function (req, res) {
  res.end('welcome!');
});

router.get('/redis', UserService.checkSession);
router.get('/redis', function (req, res) {
	res.json(req.session);
});

module.exports = router;
