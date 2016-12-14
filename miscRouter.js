/**
 * Created by U_M0PQL on 02.11.2016.
 *
 * обработчик get-запросов для удобного тестирования связки nodeJs - java-middle
 */
const express = require('express');
const clone = require('clone');
var utils = require('./utils');
const router = express.Router();
const config     = require('config');
const session = require('express-session');


//В зависимости от того, установлен ли у нас источник данных, будем использовать либо источник либо заглушку (для Heroku)
const dataRetreiver = config.get('javaServiceUrl') ? require('./dataJava') : require('./dataStub');
const chatLogic = require('./chat/ChatLogic');
const facebookSend = require('./facebook/facebookSend');


router.get('/loginToAlbo', function(req, res) {

    //вынести в app
    console.log("loginToAlbo!")
    // console.log(req.query.login);
    // console.log(req.query.password);
    // console.log(req.query.dialogUserId);

    var cus="XABJVZ"

    if(req.query.password=="1111") //успешный логин
    {
        chatLogic.SetUserAuthenticated(req.query.dialogUserId, cus, req.query.login);

        //послать весточку в FB
        facebookSend.sendTextMessage(req.query.dialogUserId, "Вы успешно аутентифицировались под логином " + req.query.login)
    }

    

});



module.exports = router;