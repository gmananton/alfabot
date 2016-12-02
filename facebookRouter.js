/**
 * Created by U_M0PQL on 02.11.2016.
 *
 * обработчик get-запросов для удобного тестирования связки nodeJs - java-middle
 */
const express    = require('express');
const router = express.Router();
const facebookReceive = require('./facebook/facebookReceive');




//Главная страница для удобного тестирования (все запросы сведены в html-странице)
router.get('/dd', function(req, res) {
    res.render('debugMainPage', { });
});

/**
 * Не забывать, что токен, указанный в настройках Webhooks в дашборде приложения
 * Должен совпадать с токеном в конфигурации. По-умолчанию срок действия токена не ограничен
 *
 */
router.get('/webhook', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});


/**
 * Все callback-функции, отрабатывающие при получении приложением того или иного события от страницы
 * Все присылаются на один адрес webhook-а для одной страницы POST-методом
 * Подписка приложения на события страницы:
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
router.post('/webhook', function (req, res) {
    var data = req.body;

    console.log("--web hook call--")
    console.log("body: " + JSON.stringify(data));

    processWebhook(data, res);


});

function processWebhook(data, res) {
    if (data.object == 'page') {

        console.log('processWebhook start');

        // Необходимо пройтись по всем записям в запросе, т.к. их может быть несколько в случае пакетного запроса
        data.entry.forEach(function (pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;

            // Пройтись по всем возможным типам сообщений в событии
            pageEntry.messaging.forEach(function (messagingEvent) {
                if (messagingEvent.optin) {
                    facebookReceive.receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    facebookReceive.receivedMessage(messagingEvent);
                } else if (messagingEvent.delivery) {
                    facebookReceive.receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    facebookReceive.receivedPostback(messagingEvent);
                } else if (messagingEvent.read) {
                    facebookReceive.receivedMessageRead(messagingEvent);
                } else if (messagingEvent.account_linking) {
                    facebookReceive.receivedAccountLink(messagingEvent);
                } else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });

        // Обязательная отправка статуса 200 в случае удачи в течение 20 секунд. Иначе наступит тайм-аут запроса
        // При непрерывном накоплении таймаутов приложение может подумать, что сервер не отвечает и даже отписаться
        // от событий страницы
        res.sendStatus(200);
        console.log('processWebhook finish');
    }
    else
    {
        console.log('processWebhook hasn\'t worked!');
        res.sendStatus(200);
    }
}



//Попробовать все же как-то получить имя пользователя - позднее, если понадобится

function getUserInfo(userID) {
    console.log("Getting user info - skip. Not works right now");
    // console.log("Getting user info");
    // request({
    //     uri: 'https://graph.facebook.com/v2.6/' + userID + '/fields=first_name,last_name,profile_pic,locale,timezone,gender',
    //     qs: {access_token: PAGE_ACCESS_TOKEN},
    //     method: 'GET'
    //
    // }, function (error, response, body) {
    //     if (!error && response.statusCode == 200) {
    //         console.log("Successfully called Graph API for user info");
    //     } else {
    //         console.error("Failed calling GraphAPI", response.statusCode, response.statusMessage, body.error);
    //     }
    // });
}


module.exports = router;