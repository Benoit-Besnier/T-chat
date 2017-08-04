/**
 * Created by Benoit on 04/08/2017.
 */

var express = require('express');
var router = express.Router();

/* GET template */
router.get('/:name', function(req, res, next) {
    var name = req.params.name;
    res.render('template/' + name);
});

module.exports = router;
