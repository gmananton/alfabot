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
const JAVA_SERVICE_BASE_REQUEST = {
    host: 'localhost',
    port:8080 ,
    path: '/open/api/eq/',
    method: 'GET'
};

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});

// define the home page route
router.get('/', function(req, res) {
    res.send('Hello from Debug Router!');
});


router.get('/getCustomerRequestedCardInfo', function(req, res) {
    res.send('About birds' + JAVA_SERVICE_URL);
});



router.get('/getBalance', function(req, res) {

    //{"data":[{"accountLastDigits":"test","amount":200050,"enCurrency":"EUR"}],"itemsCount":0,"success":true,"errorMsg":null,"errorCode":0}

   // const http = require('http');
    res.send('About birds2' + dataRetreiver.getBalance());

    if(!JAVA_SERVICE_URL) {
        res.send('About birds2' + dataRetreiver.getBalance());
        return;
    }




    var options = clone(JAVA_SERVICE_BASE_REQUEST);
    options.path+="getBalance?representativeToken=aa";



    var rest = require('./getJSON');
    rest.getJSON(options,
        function(statusCode, result)
        {
            // I could work with the result html/json here.  I could also just return it
            console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
            res.statusCode = statusCode;
            res.send(result);
        });

    //res.send('About birds2' + JAVA_SERVICE_URL);
});

module.exports = router;