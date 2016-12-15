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
const facebookView = require('./facebook/facebookView');


router.get('/loginToAlbo', function(req, res) {

    //вынести в app
    console.log("loginToAlbo!")
    // console.log(req.query.login);
    // console.log(req.query.password);
    // console.log(req.query.dialogUserId);

    var chatUserHash = req.query.chatUserHash;
    var userId = null;//chatUserHash;//getUserIdFromUserHash(chatUserHash);

    var clientsIdHash = chatLogic.getClientsIdHash();
    if(clientsIdHash.contains(chatUserHash))
        userId = clientsIdHash.get(chatUserHash).value;


    if(userId==null)
    {
        res.send(JSON.stringify({res: "chatUserHash not found"}));
       // return; //нет такого хэша = пользователь не собирался аутентифицироваться для важных операций
    }

    var cus="XABJVZ"

    if(req.query.password=="1111") //успешный логин
    {
        chatLogic.SetUserAuthenticated(userId, cus);

        res.send(JSON.stringify({res: "Login success"}));

        //послать весточку в FB
        var data = {login: req.query.login}
        var chatAnswer = new Object();
        chatAnswer.chatMessages = new Array();
        chatAnswer.chatMessages.push({recepientId: userId, messageCode: EnumMessageCodes.security_AuthenticationSuccess, data: data, messageExample: "Вы успешно атунтифицировались под логином " + data.login  });
        chatAnswer.chatMessages.push({ recepientId: userId, messageCode: EnumMessageCodes.balance_ProvideInn,   messageExample: "[Получение баланса] Введите ИНН"  });

        facebookSend.sendAnswer(chatAnswer);

        return;


    }

    res.send(JSON.stringify({res: "Login failure"}));

    

});



module.exports = router;