/**
 * Alfa-Bank 2016
 */

/* jshint node: true, devel: true */
'use strict';

const
    bodyParser = require('body-parser'),
    config     = require('config'),
    crypto     = require('crypto'),
    express    = require('express'),
    https      = require('https'),
    request    = require('request');

const fs=require('fs');
const chatLogic = require('./chat/ChatLogic');
const utils = require('./utils');

//const setup=require('setup');
var browserify = require('browserify');
var React = require('react');
var jsx = require('node-jsx');





var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({verify: verifyRequestSignature}));
app.use(express.static(__dirname +  '/public')); //папка со статическим содержимым

/** Настройка приложения из файла конфигурации в /config */

/**
 App Secret можно получить в Дашборде приложения. Используется для верификации каждого запроса:
 на стороне Facebook App генерируется хеш SHA1, пересылается с запросом и сверяется со сгенеренным
 значением здесь, на стороне сервера
 */
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
    process.env.MESSENGER_APP_SECRET :
    config.get('appSecret');

/**
 Validation Token генерируется в дашборде приложения при подписке данного приложения на события указанной страницы.
 Используется для верификации: приложение должно сделать GET-запрос серверу на адрес /webhook, а сервер при
 совпадении этого кода  должен вернуть hub.challenge, который был в запросе, обратно
 */
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
    (process.env.MESSENGER_VALIDATION_TOKEN) :
    config.get('validationToken');

/**
 Page Access Token генерируется в дашборде приложения (Facebook App). Он привязывает данное приложение
 к событиям конкретной страницы и используется для валидации вызовов webhook-ов,
 ответственных за обработку событий данной страницы
 */
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

/** URL-адрес нашего сервера. Должен быть доступен извне, обязательно по https и быть виден для facebook */
const SERVER_URL = (process.env.SERVER_URL) ?
    (process.env.SERVER_URL) :
    config.get('serverURL');


/** Конфигурация ассетов - картинок, видео и т.п. */
const CREDIT_CARDS_ICON_PATH       = config.get('creditCards-icon-path');
const CREDIT_CARD_SINGLE_ICON_PATH = config.get('creditCardSingle-icon-path');
const LOCATION_ICON_PATH           = config.get('location-icon-path');
const PIGGI_ICON_PATH              = config.get('piggi-icon-path');
const PERSON_ICON_PATH             = config.get('person-icon-path');
const ARROW_ICON_PATH              = config.get('arrow-icon-path');
const TUTORIAL_ANIMATION_PATH      = config.get('tutorial-animation-path');
const TUTORIAL_VIDEO_PATH          = config.get('tutorial-video-path');

var logger;

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
    console.error("Missing config values");
    process.exit(1);
}

/**
 * Не забывать, что токен, указанный в настройках Webhooks в дашборде приложения
 * Должен совпадать с токеном в конфигурации. По-умолчанию срок действия токена не ограничен
 *
 */
app.get('/webhook', function (req, res) {
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
app.post('/webhook', function (req, res) {
    var data = req.body;

    console.log("--web hook call--")
    console.log("body: " + JSON.stringify(data));

    processWebhook(data, res);

    //пробуем вытащить

    // if (data.object == 'page') {
    //     // Необходимо пройтись по всем записям в запросе, т.к. их может быть несколько в случае пакетного запроса
    //     data.entry.forEach(function (pageEntry) {
    //         var pageID = pageEntry.id;
    //         var timeOfEvent = pageEntry.time;
    //
    //         // Пройтись по всем возможным типам сообщений в событии
    //         pageEntry.messaging.forEach(function (messagingEvent) {
    //             if (messagingEvent.optin) {
    //                 receivedAuthentication(messagingEvent);
    //             } else if (messagingEvent.message) {
    //                 receivedMessage(messagingEvent);
    //             } else if (messagingEvent.delivery) {
    //                 receivedDeliveryConfirmation(messagingEvent);
    //             } else if (messagingEvent.postback) {
    //                 receivedPostback(messagingEvent);
    //             } else if (messagingEvent.read) {
    //                 receivedMessageRead(messagingEvent);
    //             } else if (messagingEvent.account_linking) {
    //                 receivedAccountLink(messagingEvent);
    //             } else {
    //                 console.log("Webhook received unknown messagingEvent: ", messagingEvent);
    //             }
    //         });
    //     });
    //
    //     // Обязательная отправка статуса 200 в случае удачи в течение 20 секунд. Иначе наступит тайм-аут запроса
    //     // При непрерывном накоплении таймаутов приложение может подумать, что сервер не отвечает и даже отписаться
    //     // от событий страницы
    //     res.sendStatus(200);
    // }
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
                    receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    receivedMessage(messagingEvent);
                } else if (messagingEvent.delivery) {
                    receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    receivedPostback(messagingEvent);
                } else if (messagingEvent.read) {
                    receivedMessageRead(messagingEvent);
                } else if (messagingEvent.account_linking) {
                    receivedAccountLink(messagingEvent);
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

app.get('/webhook_debug', function (req, res) {

    console.log("--webhook_debug call--")

    var data = req.query.data;
    console.log("qs: " + JSON.stringify(req.query));
    console.log("qs JSON: " + JSON.stringify(JSON.parse(req.query.data)));

    //webhook_debug?data={"id":122, "time"=10}

    processWebhook(data, res);

});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function (req, res) {
    var accountLinkingToken = req.query.account_linking_token;
    var redirectURI = req.query.redirect_uri;

    // Authorization Code should be generated per user by the developer. This will
    // be passed to the Account Linking callback.
    var authCode = "1234567890";

    // Redirect users to this URI on successful login
    var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

    res.render('authorize', {
        accountLinkingToken: accountLinkingToken,
        redirectURI: redirectURI,
        redirectURISuccess: redirectURISuccess
    });
});

jsx.install();
var Books = require('./views/index.jsx');

//This way the first load has a fully rendered static view and the user doesn't have to wait for the client to render it
app.use('/aa', function(req, res) {
    var books = [{
        title: 'Professional Node.js',
        read: false
    }, {
        title: 'Node.js Patterns',
        read: false
    }];

    res.setHeader('Content-Type', 'text/html');
    res.end(React.renderToStaticMarkup(
        React.DOM.body(
            null,
            React.DOM.div({
                id: 'app',
                dangerouslySetInnerHTML: {
                    __html: React.renderToString(React.createElement(TodoBox, {
                        data: data
                    }))
                }
            }),
            React.DOM.script({
                'id': 'initial-data',
                'type': 'text/plain',
                'data-json': JSON.stringify(data)
            }),
            React.DOM.script({
                src: '/bundle.js'
            })
        )
    ));
});
app.use('/bundle.js', function(req, res) {
    res.setHeader('content-type', 'application/javascript');
    browserify('./app.js', {
        debug: true
    })
        .transform('reactify')
        .bundle()
        .pipe(res);
});

/**
 * Проверка подписи запроса, чтобы убедиться, что он пришел от Facebook
 * На стороне приложения в дашборде генерируется App Secret, - он же хранится в конфиге на стороне сервера
 * На стороне приложения из AppSecret делается SHA1-хеш и присылается в хедере x-hub-signature
 * Затем здась, на стороне сервера делается также генерация хеша и происходит верификация
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];


    if (!signature) {
        // Логирование ошибки для тестирования. На production надо кидать ошибку
        console.error("Couldn't validate the signature.");
    } else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];

        var expectedHash = crypto.createHmac('sha1', APP_SECRET)
            .update(buf)
            .digest('hex');

        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}



/**
 * ============================================================================================
 *                                     Обработка событий
 * ============================================================================================
 */

/**
 * Authorization Event
 * Событие авторизации. В дашборде указано как 'optin.ref'. Для плагина "Send to Messenger" это поле 'data-ref'
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfAuth = event.timestamp;

    // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
    // The developer can set this to an arbitrary value to associate the
    // authentication callback with the 'Send to Messenger' click event. This is
    // a way to do account linking when the user clicks the 'Send to Messenger'
    // plugin.
    var passThroughParam = event.optin.ref;

    console.log("Received authentication for user %d and page %d with pass " +
        "through param '%s' at %d", senderID, recipientID, passThroughParam,
        timeOfAuth);

    sendTextMessage(senderID, "Authentication successful");
}

/**
 * Message Event
 * Событие "Сообщение". Вызывается, когда сообщение посылвается вашей странице.
 * Формат объекта 'message' и его поля варьируются в зависимости от типа сообщения
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 */
function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    var replyMessage = "";
    getUserInfo(senderID);

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    

    console.log("message v1:" + JSON.stringify(message));
    console.log("message v2:" + message);

    var isEcho = message.is_echo;
    var messageId = message.mid;
    var appId = message.app_id;
    var metadata = message.metadata;

    // text и attachment - взаимоисключающие
    var messageText = message.text;
    var messageAttachments = message.attachments;
    var quickReply = message.quick_reply;

    if (isEcho) {
        console.log("Received echo for message %s and app %d with metadata %s",
            messageId, appId, metadata);
        return;
    } else if (quickReply) {
        var quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s",
            messageId, quickReplyPayload);
        if (quickReplyPayload ==='quickReplyTutorialYes') {
            sendTextMessage(senderID, "Загрузка обучения...");
            sendVideoMessage(senderID, TUTORIAL_VIDEO_PATH);
            return;
        } else if (quickReplyPayload ==='quickReplyTutorialNo') {
            sendStartOptionsMessage(senderID);
            return;
        }
    }

    if (messageText) {
        // Пока наш бот ничего не умеет, так что одинаково реагируем на текстовые сообщения
        // и предлагаем воспользоваться кнопками меню
        switch (messageText) {
            case 'start':
                sendStartOptionsMessage(senderID);
                break;
            default:

                
                var userMessage = { senderId: senderID, messageText:messageText, date: utils.getFormattedDate(new Date()) }
                //sendTextMessage(senderID, JSON.stringify(userMessage));
                chatLogic.processUserMessage(userMessage,
                    function(chatAnswer)
                    {
                        console.log("chatLogic.processUserMessage CALLBACK!");
                        console.log(JSON.stringify(chatAnswer));
                        // var utf8 = require('utf8');
                        // console.log("chatAnswer1=" + chatAnswer);
                        // console.log("chatAnswer2=" + JSON.stringify(chatAnswer));

                        for(var i=0; i<chatAnswer.chatMessages.length; i++)
                        {
                            console.log("i=" + i);
                            console.log("chatAnswer.chatMessages[i]=" + JSON.stringify(chatAnswer.chatMessages[i]));
                            var msg =chatAnswer.chatMessages[i];

                            // console.log("messageText1=" + messageText);
                            // console.log("messageText1 enc=" + utf8.encode(messageText));


                            sendTextMessage(senderID, msg.messageText);

                        }

                        //sendTextMessage(senderID, chatAnswer);
                    })

                // if (messageText.endsWith('?')) {
                //     replyMessage += "Я вижу, вы что-то хотите спросить, но к сожалению, я еще не достаточно умен... ";
                // } else {
                //     replyMessage += "Я, к сожалению, пока не знаю, как реагировать на вашу просьбу... ";
                // }
                // replyMessage += "Воспользуйтесь меню с кнопками в левом нижнем углу";
                // sendTextMessage(senderID, replyMessage);
        }
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Ух ты какой интересный файл =) Надо будет ознакомиться");
    }
}


/**
 * Delivery Confirmation Event
 * Событие подтвержлдения доставки сообщения пользователю
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var delivery = event.delivery;
    var messageIDs = delivery.mids;
    var watermark = delivery.watermark;
    var sequenceNumber = delivery.seq;

    if (messageIDs) {
        messageIDs.forEach(function (messageID) {
            console.log("Received delivery confirmation for message ID: %s",
                messageID);
        });
    }

    console.log("All message before %d were delivered.", watermark);
}


/**
 * Postback Event
 *
 * Вызывается при нажатии на какую-либо postback-кнопку generic-сообщения
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    var payload = event.postback.payload;

    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

    console.log(JSON.stringify(event.sender));

    if (payload) {
        switch (payload) {
            case 'startConversationPayload':
                sendQuickReplyTutorialChoice(senderID);
                break;
            case 'mainMenuPayload':
                sendStartOptionsMessage(senderID);
                break;
            case 'tutorialPayload':
                sendQuickReplyTutorialChoice(senderID);
                break;
            case 'cardStatusPayload':
                sendCardStatusMessage(senderID);
                break;
            case 'atmPayload':
                sendATMLocationMessage(senderID);
                break;
            case 'accountsPayload':
                sendAccountsInfoMessage(senderID);
                break;
            case 'cardLocationPayload':
                sendCardLocationMessage(senderID);
                break;
            default:


                sendTextMessage(senderID, "Прошу прощения, я Вас не совсем понял...");
                break;
        }
    }
}



/**
 * Message Read Event
 *
 * Вызывается когда предыдущее отправленное сообщение было прочитано пользоователем
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    // Были прочитаны все сообщения до временной метки watermark или последовательности sequence
    var watermark = event.read.watermark;
    var sequenceNumber = event.read.seq;

    console.log("Received message read event for watermark %d and sequence " +
        "number %d", watermark, sequenceNumber);
}

/**
 * Account Link Event
 *
 * Событие вызыавется когда наживается "Привязать аккаунт" или "отвязать аккаунт"
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    var status = event.account_linking.status;
    var authCode = event.account_linking.authorization_code;

    console.log("Received account link event with for user %d with status %s " +
        "and auth code %s ", senderID, status, authCode);
}


/**
 * ============================================================================================
 *                      Отправка сообщений пользователю с использованием Send API
 * ============================================================================================
 */

/** Простое текстовое сообщение */
function sendTextMessage(recipientId, messageText) {

    // var encoder = new TextEncoder();
    // var t = encoder.encode(messageText);
    // console.log("unencoded: " + messageText);
    // console.log("encoded: " + t);

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    callSendAPI(messageData);
}


/** Сообщение с картинкой */
function sendImageMessage(recipientId, imageURL) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: SERVER_URL + imageURL
                }
            }
        }
    }
    callSendAPI(messageData);
}

/** Сообщение с видео */
function sendVideoMessage(recipientId, videoURL) {
    console.log("sendVideoMessage started");
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "video",
                payload: {
                    url: SERVER_URL + videoURL
                }
            }
        }
    };
    callSendAPI(messageData);
}


/** Главное меню с выбором действий (generic template) */
function sendStartOptionsMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [
                        {
                            title: "Банковские карты",
                            subtitle: "Узнать статус готовности заказанной карты",
                            image_url: SERVER_URL + CREDIT_CARDS_ICON_PATH,
                            buttons: [{
                                type: "postback",
                                title: "Узнать статус",
                                payload: "cardStatusPayload"
                            }]
                        },
                        {
                            title: "Ближайший банкомат",
                            subtitle: "Посмотреть адрес ближайшего банкомата",
                            image_url: SERVER_URL + LOCATION_ICON_PATH,
                            buttons: [{
                                type: "postback",
                                title: "Посмотреть ближайший банкомат",
                                payload: "atmPayload"
                            }]
                        },
                        {
                            title: "Счета",
                            subtitle: "Посмотреть текущее состояние счетов",
                            image_url: SERVER_URL + PIGGI_ICON_PATH,
                            buttons: [{
                                type: "postback",
                                title: "Посмотреть состояние счетов",
                                payload: "accountsPayload"
                            }]
                        },
                        {
                            title: "Сотрудник",
                            subtitle: "Связаться с поддержкой банка",
                            image_url: SERVER_URL + PERSON_ICON_PATH,
                            buttons: [{
                                type: "phone_number",
                                title: "Связаться с поддержкой",
                                payload: "+74957888878"
                            }]
                        }
                    ]
                }
            }
        }
    };

    callSendAPI(messageData);
}



/** Геолокация с местнахождением карты (generic template) */
function sendCardLocationMessage(recipientId) {
    var lattitude = 55.98267;
    var longtitude = 37.1735586;
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: {
                        element: {
                            title: "Вы сможете забрать Вашу карту в данном отделении",
                            subtitle: "ДО Зеленоградский Адрес: Зеленоград, микрорайон 18, Корпус 1824, +7(495)788-88-78, Понедельник-пятница 9:00-21:00",
                            buttons: [
                                {
                                    type: "phone_number",
                                    title: "Позвонить",
                                    payload: "+74957888878"
                                }
                            ],
                            "image_url": "https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&center="
                            + lattitude + "," + longtitude +
                            "&zoom=25&markers=" + lattitude + "," + longtitude,
                            "item_url": "http:\/\/maps.apple.com\/maps?q=" + lattitude + "," + longtitude + "&z=16"
                        }
                    }
                }
            }
        }
    };

    callSendAPI(messageData);
}

/** Статус готовности карты (generic template) */
function sendCardStatusMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: {
                        element: {
                            title: "Ваша карта готова!",
                            image_url: SERVER_URL + CREDIT_CARD_SINGLE_ICON_PATH,
                            buttons: [{
                                type: "postback",
                                title: "Где забрать?",
                                payload: "cardLocationPayload",
                            }]
                        }
                    }
                }
            }
        }
    };

    callSendAPI(messageData);
}


/** Геолокация с местнахождением ближайшего банкомата (generic template) */
function sendATMLocationMessage(recipientId) {
    var lattitude = 55.774822;
    var longtitude = 37.649813;
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: {
                        element: {
                            title: "ул. Каланчевская, 27 (test)",
                            subtitle: "Открыто с 9:00 до 21:00",
                            "image_url": "https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&center="
                            + lattitude + "," + longtitude + "&zoom=25&markers=" + lattitude + "," + longtitude,
                            "item_url": "http:\/\/maps.apple.com\/maps?q=" + lattitude + "," + longtitude + "&z=16"
                        }
                    }
                }
            }
        }
    };

    callSendAPI(messageData);
}

/** TODO STUB Информация по счетам */
function sendAccountsInfoMessage(recipientId) {
    sendTextMessage(recipientId, "Чуть позже здесь появится информация о счетах");
}



/**
 * Выбор ответа "Провести ли обучение? Да/Нет"
 * Тип сообщения - кнопки Quick Reply
 */
function sendQuickReplyTutorialChoice(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "Привет! Хочешь, я немного расскажу о себе?",
            metadata: "quickReplyTutorialChoice-meta",
            quick_replies: [
                {
                    "content_type": "text",
                    "title": "Да",
                    "payload": "quickReplyTutorialYes"
                },
                {
                    "content_type": "text",
                    "title": "Нет",
                    "payload": "quickReplyTutorialNo"
                }
            ]
        }
    };
    callSendAPI(messageData);
}



/** Индикатор "бот набирает сообщение" */
function sendTypingOn(recipientId) {
    console.log("Turning typing indicator on");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

    callSendAPI(messageData);
}

/** Выключить индикатор "бот набирает сообщение" */
function sendTypingOff(recipientId) {
    console.log("Turning typing indicator off");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_off"
    };

    callSendAPI(messageData);
}



/**
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Welcome. Link your account.",
                    buttons: [{
                        type: "account_link",
                        url: SERVER_URL + "/authorize"
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

/**
 * Вызов Send API с передачей тела сообщения
 */
function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            if (messageId) {
                console.log("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
            } else {
                console.log("Successfully called Send API for recipient %s",
                    recipientId);
            }
        } else {
            console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
    });
}

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

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function () {

    //Первичные насторйки - логгер, бд, WS_Client, еще что-нибудь
    setup();

    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;
//
function setup()
{



}

////////////////ТЕСТ



app.get('/test', function (req, res) {

    console.log("testlog1");
    res.status(200).send("test ok!!");

});







//////////////

var debugRouter = require('./debugRouter');
var facebookRouter = require('./facebookRouter');

app.use('/debug', debugRouter);
app.use('/', facebookRouter);







