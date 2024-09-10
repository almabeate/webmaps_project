var express = require('express');
var router = express.Router();
const path = require('path')

// define the map page route
router.get('/', function (req, res) {
  impPug = "impressum.pug"
  //res.sendFile(impPug, { root: "./views" })
  res.render(impPug)
})

module.exports = router;