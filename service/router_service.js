var RouterService = {
  json: function (err, res) {
    res.status(400);
    res.json({msg: err.errors[0].message});
  }
}

module.exports = RouterService;