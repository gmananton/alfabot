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


const ALLOW_DEBUG_QUERIES=config.get('allowDebugQueries');

//region Middleware

// middleware ответственный за флаг ALLOW_DEBUG_QUERIES
router.use(function timeLog(req, res, next) {

    if(!ALLOW_DEBUG_QUERIES)
    {
        res.send("Debug queries are not allowed. Look at 'allowDebugQueries' settings");
        return;
    }

    //console.log('Time: ', Date.now());
    next();
});

//middleware ответственный за работу с сессией
router.use(session({secret: 'someSecretForCookie',
    resave: true,
    saveUninitialized: true}));

//endregion




//Главная страница для удобного тестирования (все запросы сведены в html-странице)
router.get('/', function(req, res) {
    res.render('debugMainPage', { });
});



//Чат-страница
router.get('/chat', function(req, res) {
    res.sendFile('public/chat.html', {root: __dirname })
});


//сообщение из Чат-страницы
router.get('/sendChatMessage', function(req, res) {

    var senderId = req.query.senderId;
    var messageText = req.query.messageText.trim();

    //current User Message
    var userMessage = { senderId: senderId, messageText:messageText, date: utils.getFormattedDate(new Date()) };

    //saveToDb (log) - логировать надо из chatLogic

    chatLogic.processUserMessage(userMessage,


        function(chatAnswer)
        {
            //insert userMessage at the beginning
            chatAnswer.chatMessages.splice(0, 0,  { senderId: senderId, messageExample:messageText, date: utils.getFormattedDate(new Date()) });

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(chatAnswer.chatMessages));
        })

});



//region тестовые прямые вызовы java-middle

router.get('/getCustomerRequestedCardInfo', function(req, res) {
    dataRetreiver.getCustomerRequestedCardInfo(req.query.crf,
        function(result)
        {
            res.send(result);
        });
});



router.get('/getBalance', function(req, res) {

    dataRetreiver.getBalance(req.query.crf, req.query.cus,
        function(result)
        {
            res.send(result);
        });

});


router.get('/getPayDocStatus', function(req, res) {
    dataRetreiver.getPayDocStatus(req.query.crf, req.query.docid,
        function(result)
        {
            res.send(result);
        });
});

// router.get('/loginToAlbo', function(req, res) {
//
//     //вынести в app
//    
//    
//    
//     // console.log(req.query.login);
//     // console.log(req.query.password);
//     // console.log(req.query.dialogUserId);
//
//     var cus="XABJVZ"
//
//     if(req.query.password=="1111") //успешный логин
//     {
//         chatLogic.SetUserAuthenticated(req.query.dialogUserId, cus, req.query.login);
//         facebookSend.sendTextMessage(req.query.dialogUserId, "Вы успешно аутентифицировались под логином " + req.query.login)
//     }
//
//     //послать весточку в FB
//
// });


//endregion

module.exports = router;