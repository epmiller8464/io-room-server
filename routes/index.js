const faker = require('faker')
var express = require('express');
var router = express.Router();
const uuid = require('node-uuid')
/* GET home page. */
router.get('/', function (req, res, next) {

    res.render('index', {title: 'HI', channel: uuid.v4(), username: faker.internet.email()});
    //res.send('r.hbs')
});


module.exports = router;
