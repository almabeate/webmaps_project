var express = require('express');
var router = express.Router();
const path = require('path')


// define the map page route
router.get('/', function(req, res) 
{
  mapPug = "map.pug" 
  //res.sendFile(mapPug, {root: "./views"})
  res.render(mapPug)
})

module.exports = router;