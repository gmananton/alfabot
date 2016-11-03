/**
 * Created by U_M0PQL on 02.11.2016.
 */
const express = require('express');
const clone = require('clone');
const router = express.Router();
const config     = require('config');

//В зависимости от того, установлен ли у нас источник данных, будем использовать либо источник либо заглушку (для Heroku)
const dataRetreiver = config.get('javaServiceUrl') ? require('./dataJava') : require('./dataStub');

const JAVA_SERVICE_URL = config.get('javaServiceUrl');
const ALLOW_DEBUG_QUERIES=config.get('allowDebugQueries');


// middleware that is specific to this router
router.use(function timeLog(req, res, next) {

    if(!ALLOW_DEBUG_QUERIES)
    {
        res.send("Debug queries are not allowed. Look at 'allowDebugQueries' settings");
        return;
    }

    console.log('Time: ', Date.now());
    next();
});

// define the home page route
router.get('/', function(req, res) {
    res.send('Hello from Debug Router! Generate Test Queries Html Here!');
});


router.get('/getCustomerRequestedCardInfo', function(req, res) {
    res.send('About birds' + JAVA_SERVICE_URL);
});



router.get('/getBalance', function(req, res) {

    dataRetreiver.getBalance("req.querystring",
        function(result)
        {
            res.send(result);
        });

});

module.exports = router;