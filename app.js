// /**
//  * Alfa-Bank 2016
//  */
//
// /* jshint node: true, devel: true */
// 'use strict';
//
// const
//     bodyParser = require('body-parser'),
//     config     = require('config'),
//     crypto     = require('crypto'),
//     express    = require('express'),
//     https      = require('https'),
//     request    = require('request');
//
// var app = express();
// app.set('port', process.env.PORT || 5000);
// app.set('view engine', 'ejs');
// app.use(bodyParser.json({verify: verifyRequestSignature}));
// app.use(express.static('public'));
//
// /** Настройка приложения из файла конфигурации в /config */
//
// /**
//  App Secret можно получить в Дашборде приложения. Используется для верификации каждого запроса:
//  на стороне Facebook App генерируется хеш SHA1, пересылается с запросом и сверяется со сгенеренным
//  значением здесь, на стороне сервера
//  */
// const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
//     process.env.MESSENGER_APP_SECRET :
//     config.get('appSecret');
//
// /**
//  Validation Token генерируется в дашборде приложения при подписке данного приложения на события указанной страницы.
//  Используется для верификации: приложение должно сделать GET-запрос серверу на адрес /webhook, а сервер при
//  совпадении этого кода  должен вернуть hub.challenge, который был в запросе, обратно
//  */
// const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
//     (process.env.MESSENGER_VALIDATION_TOKEN) :
//     config.get('validationToken');
//
// /**
//  Page Access Token генерируется в дашборде приложения (Facebook App). Он привязывает данное приложение
//  к событиям конкретной страницы и используется для валидации вызовов webhook-ов,
//  ответственных за обработку событий данной страницы
//  */
// const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
//     (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
//     config.get('pageAccessToken');
//
// /** URL-адрес нашего сервера. Должен быть доступен извне, обязательно по https и быть виден для facebook */
// const SERVER_URL = (process.env.SERVER_URL) ?
//     (process.env.SERVER_URL) :
//     config.get('serverURL');
//
//
// /** Конфигурация ассетов - картинок, видео и т.п. */
// const CREDIT_CARDS_ICON_PATH       = config.get('creditCards-icon-path');
// const CREDIT_CARD_SINGLE_ICON_PATH = config.get('creditCardSingle-icon-path');
// const LOCATION_ICON_PATH           = config.get('location-icon-path');
// const PIGGI_ICON_PATH              = config.get('piggi-icon-path');
// const PERSON_ICON_PATH             = config.get('person-icon-path');
// const ARROW_ICON_PATH              = config.get('arrow-icon-path');
// const TUTORIAL_ANIMATION_PATH      = config.get('tutorial-animation-path');
// const TUTORIAL_VIDEO_PATH          = config.get('tutorial-video-path');
//
//
// if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
//     console.error("Missing config values");
//     process.exit(1);
// }
//
// /**
//  * Не забывать, что токен, указанный в настройках Webhooks в дашборде приложения
//  * Должен совпадать с токеном в конфигурации. По-умолчанию срок действия токена не ограничен
//  *
//  */
// app.get('/webhook', function (req, res) {
//     if (req.query['hub.mode'] === 'subscribe' &&
//         req.query['hub.verify_token'] === VALIDATION_TOKEN) {
//         console.log("Validating webhook");
//         res.status(200).send(req.query['hub.challenge']);
//     } else {
//         console.error("Failed validation. Make sure the validation tokens match.");
//         res.sendStatus(403);
//     }
// });
//
//
// /**
//  * Все callback-функции, отрабатывающие при получении приложением того или иного события от страницы
//  * Все присылаются на один адрес webhook-а для одной страницы POST-методом
//  * Подписка приложения на события страницы:
//  * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
//  *
//  */
// app.post('/webhook', function (req, res) {
//     var data = req.body;
//
//     //test tyapkin
//     //console.log("tyapkin!")
//     //console.log(JSON.stringify(req));
//
//     if (data.object == 'page') {
//         // Необходимо пройтись по всем записям в запросе, т.к. их может быть несколько в случае пакетного запроса
//         data.entry.forEach(function (pageEntry) {
//             var pageID = pageEntry.id;
//             var timeOfEvent = pageEntry.time;
//
//             // Пройтись по всем возможным типам сообщений в событии
//             pageEntry.messaging.forEach(function (messagingEvent) {
//                 if (messagingEvent.optin) {
//                     receivedAuthentication(messagingEvent);
//                 } else if (messagingEvent.message) {
//                     receivedMessage(messagingEvent);
//                 } else if (messagingEvent.delivery) {
//                     receivedDeliveryConfirmation(messagingEvent);
//                 } else if (messagingEvent.postback) {
//                     receivedPostback(messagingEvent);
//                 } else if (messagingEvent.read) {
//                     receivedMessageRead(messagingEvent);
//                 } else if (messagingEvent.account_linking) {
//                     receivedAccountLink(messagingEvent);
//                 } else {
//                     console.log("Webhook received unknown messagingEvent: ", messagingEvent);
//                 }
//             });
//         });
//
//         // Обязательная отправка статуса 200 в случае удачи в течение 20 секунд. Иначе наступит тайм-аут запроса
//         // При непрерывном накоплении таймаутов приложение может подумать, что сервер не отвечает и даже отписаться
//         // от событий страницы
//         res.sendStatus(200);
//     }
// });
//
// /*
//  * This path is used for account linking. The account linking call-to-action
//  * (sendAccountLinking) is pointed to this URL.
//  *
//  */
// app.get('/authorize', function (req, res) {
//     var accountLinkingToken = req.query.account_linking_token;
//     var redirectURI = req.query.redirect_uri;
//
//     // Authorization Code should be generated per user by the developer. This will
//     // be passed to the Account Linking callback.
//     var authCode = "1234567890";
//
//     // Redirect users to this URI on successful login
//     var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;
//
//     res.render('authorize', {
//         accountLinkingToken: accountLinkingToken,
//         redirectURI: redirectURI,
//         redirectURISuccess: redirectURISuccess
//     });
// });
//
// /**
//  * Проверка подписи запроса, чтобы убедиться, что он пришел от Facebook
//  * На стороне приложения в дашборде генерируется App Secret, - он же хранится в конфиге на стороне сервера
//  * На стороне приложения из AppSecret делается SHA1-хеш и присылается в хедере x-hub-signature
//  * Затем здась, на стороне сервера делается также генерация хеша и происходит верификация
//  * https://developers.facebook.com/docs/graph-api/webhooks#setup
//  *
//  */
// function verifyRequestSignature(req, res, buf) {
//     var signature = req.headers["x-hub-signature"];
//     console.log("tyapkin1")
//     console.log(JSON.stringify(req.body));
//     console.log("tyapkin2")
//
//     //consloe.log("tyapkin: APP_SECRET=%s", APP_SECRET)
//
//     if (!signature) {
//         // Логирование ошибки для тестирования. На production надо кидать ошибку
//         console.error("Couldn't validate the signature.");
//     } else {
//         var elements = signature.split('=');
//         var method = elements[0];
//         var signatureHash = elements[1];
//
//         var expectedHash = crypto.createHmac('sha1', APP_SECRET)
//             .update(buf)
//             .digest('hex');
//
//         //////consloe.log("tyapkin: hashIncome=%s  hashShouldBe=%s", signatureHash, expectedHash)
//
//         if (signatureHash != expectedHash) {
//             throw new Error("Couldn't validate the request signature.");
//         }
//     }
// }
//
//
//
// /**
//  * ============================================================================================
//  *                                     Обработка событий
//  * ============================================================================================
//  */
//
// /**
//  * Authorization Event
//  * Событие авторизации. В дашборде указано как 'optin.ref'. Для плагина "Send to Messenger" это поле 'data-ref'
//  * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
//  *
//  */
// function receivedAuthentication(event) {
//     var senderID = event.sender.id;
//     var recipientID = event.recipient.id;
//     var timeOfAuth = event.timestamp;
//
//     // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
//     // The developer can set this to an arbitrary value to associate the
//     // authentication callback with the 'Send to Messenger' click event. This is
//     // a way to do account linking when the user clicks the 'Send to Messenger'
//     // plugin.
//     var passThroughParam = event.optin.ref;
//
//     console.log("Received authentication for user %d and page %d with pass " +
//         "through param '%s' at %d", senderID, recipientID, passThroughParam,
//         timeOfAuth);
//
//     sendTextMessage(senderID, "Authentication successful");
// }
//
// /**
//  * Message Event
//  * Событие "Сообщение". Вызывается, когда сообщение посылвается вашей странице.
//  * Формат объекта 'message' и его поля варьируются в зависимости от типа сообщения
//  * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
//  *
//  */
// function receivedMessage(event) {
//     var senderID = event.sender.id;
//     var recipientID = event.recipient.id;
//     var timeOfMessage = event.timestamp;
//     var message = event.message;
//     var replyMessage = "";
//     getUserInfo(senderID);
//
//     console.log("Received message for user %d and page %d at %d with message:",
//         senderID, recipientID, timeOfMessage);
//     console.log(JSON.stringify(message));
//
//     var isEcho = message.is_echo;
//     var messageId = message.mid;
//     var appId = message.app_id;
//     var metadata = message.metadata;
//
//     // text и attachment - взаимоисключающие
//     var messageText = message.text;
//     var messageAttachments = message.attachments;
//     var quickReply = message.quick_reply;
//
//     if (isEcho) {
//         console.log("Received echo for message %s and app %d with metadata %s",
//             messageId, appId, metadata);
//         return;
//     } else if (quickReply) {
//         var quickReplyPayload = quickReply.payload;
//         console.log("Quick reply for message %s with payload %s",
//             messageId, quickReplyPayload);
//         if (quickReplyPayload ==='quickReplyTutorialYes') {
//             sendTextMessage(senderID, "Загрузка обучения...");
//             sendVideoMessage(senderID, TUTORIAL_VIDEO_PATH);
//             return;
//         } else if (quickReplyPayload ==='quickReplyTutorialNo') {
//             sendStartOptionsMessage(senderID);
//             return;
//         }
//     }
//
//     if (messageText) {
//         // Пока наш бот ничего не умеет, так что одинаково реагируем на текстовые сообщения
//         // и предлагаем воспользоваться кнопками меню
//         switch (messageText) {
//             case 'start':
//                 sendStartOptionsMessage(senderID);
//                 break;
//             default:
//                 if (messageText.endsWith('?')) {
//                     replyMessage += "Я вижу, вы что-то хотите спросить, но к сожалению, я еще не достаточно умен... ";
//                 } else {
//                     replyMessage += "Я, к сожалению, пока не знаю, как реагировать на вашу просьбу... ";
//                 }
//                 replyMessage += "Воспользуйтесь меню с кнопками в левом нижнем углу";
//                 sendTextMessage(senderID, replyMessage);
//         }
//     } else if (messageAttachments) {
//         sendTextMessage(senderID, "Ух ты какой интересный файл =) Надо будет ознакомиться");
//     }
// }
//
//
// /**
//  * Delivery Confirmation Event
//  * Событие подтвержлдения доставки сообщения пользователю
//  * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
//  *
//  */
// function receivedDeliveryConfirmation(event) {
//     var senderID = event.sender.id;
//     var recipientID = event.recipient.id;
//     var delivery = event.delivery;
//     var messageIDs = delivery.mids;
//     var watermark = delivery.watermark;
//     var sequenceNumber = delivery.seq;
//
//     if (messageIDs) {
//         messageIDs.forEach(function (messageID) {
//             console.log("Received delivery confirmation for message ID: %s",
//                 messageID);
//         });
//     }
//
//     console.log("All message before %d were delivered.", watermark);
// }
//
//
// /**
//  * Postback Event
//  *
//  * Вызывается при нажатии на какую-либо postback-кнопку generic-сообщения
//  * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
//  *
//  */
// function receivedPostback(event) {
//     var senderID = event.sender.id;
//     var recipientID = event.recipient.id;
//     var timeOfPostback = event.timestamp;
//
//     var payload = event.postback.payload;
//
//     console.log("Received postback for user %d and page %d with payload '%s' " +
//         "at %d", senderID, recipientID, payload, timeOfPostback);
//
//     console.log(JSON.stringify(event.sender));
//
//     if (payload) {
//         switch (payload) {
//             case 'startConversationPayload':
//                 sendQuickReplyTutorialChoice(senderID);
//                 break;
//             case 'mainMenuPayload':
//                 sendStartOptionsMessage(senderID);
//                 break;
//             case 'tutorialPayload':
//                 sendQuickReplyTutorialChoice(senderID);
//                 break;
//             case 'cardStatusPayload':
//                 sendCardStatusMessage(senderID);
//                 break;
//             case 'atmPayload':
//                 sendATMLocationMessage(senderID);
//                 break;
//             case 'accountsPayload':
//                 sendAccountsInfoMessage(senderID);
//                 break;
//             case 'cardLocationPayload':
//                 sendCardLocationMessage(senderID);
//                 break;
//             default:
//                 sendTextMessage(senderID, "Прошу прощения, я Вас не совсем понял...");
//                 break;
//         }
//     }
// }
//
//
//
// /**
//  * Message Read Event
//  *
//  * Вызывается когда предыдущее отправленное сообщение было прочитано пользоователем
//  * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
//  *
//  */
// function receivedMessageRead(event) {
//     var senderID = event.sender.id;
//     var recipientID = event.recipient.id;
//
//     // Были прочитаны все сообщения до временной метки watermark или последовательности sequence
//     var watermark = event.read.watermark;
//     var sequenceNumber = event.read.seq;
//
//     console.log("Received message read event for watermark %d and sequence " +
//         "number %d", watermark, sequenceNumber);
// }
//
// /**
//  * Account Link Event
//  *
//  * Событие вызыавется когда наживается "Привязать аккаунт" или "отвязать аккаунт"
//  * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
//  *
//  */
// function receivedAccountLink(event) {
//     var senderID = event.sender.id;
//     var recipientID = event.recipient.id;
//
//     var status = event.account_linking.status;
//     var authCode = event.account_linking.authorization_code;
//
//     console.log("Received account link event with for user %d with status %s " +
//         "and auth code %s ", senderID, status, authCode);
// }
//
//
// /**
//  * ============================================================================================
//  *                      Отправка сообщений пользователю с использованием Send API
//  * ============================================================================================
//  */
//
// /** Простое текстовое сообщение */
// function sendTextMessage(recipientId, messageText) {
//
//     console.log("tyapkin sendTextMessage recipientId: " + recipientId)
//
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         message: {
//             text: messageText,
//             metadata: "DEVELOPER_DEFINED_METADATA"
//         }
//     };
//
//     callSendAPI(messageData);
// }
//
//
// /** Сообщение с картинкой */
// function sendImageMessage(recipientId, imageURL) {
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         message: {
//             attachment: {
//                 type: "image",
//                 payload: {
//                     url: SERVER_URL + imageURL
//                 }
//             }
//         }
//     }
//     callSendAPI(messageData);
// }
//
// /** Сообщение с видео */
// function sendVideoMessage(recipientId, videoURL) {
//     console.log("sendVideoMessage started");
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         message: {
//             attachment: {
//                 type: "video",
//                 payload: {
//                     url: SERVER_URL + videoURL
//                 }
//             }
//         }
//     };
//     callSendAPI(messageData);
// }
//
//
// /** Главное меню с выбором действий (generic template) */
// function sendStartOptionsMessage(recipientId) {
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         message: {
//             attachment: {
//                 type: "template",
//                 payload: {
//                     template_type: "generic",
//                     elements: [
//                         {
//                             title: "Банковские карты",
//                             subtitle: "Узнать статус готовности заказанной карты",
//                             image_url: SERVER_URL + CREDIT_CARDS_ICON_PATH,
//                             buttons: [{
//                                 type: "postback",
//                                 title: "Узнать статус",
//                                 payload: "cardStatusPayload"
//                             }]
//                         },
//                         {
//                             title: "Ближайший банкомат",
//                             subtitle: "Посмотреть адрес ближайшего банкомата",
//                             image_url: SERVER_URL + LOCATION_ICON_PATH,
//                             buttons: [{
//                                 type: "postback",
//                                 title: "Посмотреть ближайший банкомат",
//                                 payload: "atmPayload"
//                             }]
//                         },
//                         {
//                             title: "Счета",
//                             subtitle: "Посмотреть текущее состояние счетов",
//                             image_url: SERVER_URL + PIGGI_ICON_PATH,
//                             buttons: [{
//                                 type: "postback",
//                                 title: "Посмотреть состояние счетов",
//                                 payload: "accountsPayload"
//                             }]
//                         },
//                         {
//                             title: "Сотрудник",
//                             subtitle: "Связаться с поддержкой банка",
//                             image_url: SERVER_URL + PERSON_ICON_PATH,
//                             buttons: [{
//                                 type: "phone_number",
//                                 title: "Связаться с поддержкой",
//                                 payload: "+74957888878"
//                             }]
//                         }
//                     ]
//                 }
//             }
//         }
//     };
//
//     callSendAPI(messageData);
// }
//
//
//
// /** Геолокация с местнахождением карты (generic template) */
// function sendCardLocationMessage(recipientId) {
//     var lattitude = 55.98267;
//     var longtitude = 37.1735586;
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         message: {
//             attachment: {
//                 type: "template",
//                 payload: {
//                     template_type: "generic",
//                     elements: {
//                         element: {
//                             title: "Вы сможете забрать Вашу карту в данном отделении",
//                             subtitle: "ДО Зеленоградский Адрес: Зеленоград, микрорайон 18, Корпус 1824, +7(495)788-88-78, Понедельник-пятница 9:00-21:00",
//                             buttons: [
//                                 {
//                                     type: "phone_number",
//                                     title: "Позвонить",
//                                     payload: "+74957888878"
//                                 }
//                             ],
//                             "image_url": "https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&center="
//                             + lattitude + "," + longtitude +
//                             "&zoom=25&markers=" + lattitude + "," + longtitude,
//                             "item_url": "http:\/\/maps.apple.com\/maps?q=" + lattitude + "," + longtitude + "&z=16"
//                         }
//                     }
//                 }
//             }
//         }
//     };
//
//     callSendAPI(messageData);
// }
//
// /** Статус готовности карты (generic template) */
// function sendCardStatusMessage(recipientId) {
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         message: {
//             attachment: {
//                 type: "template",
//                 payload: {
//                     template_type: "generic",
//                     elements: {
//                         element: {
//                             title: "Ваша карта готова!",
//                             image_url: SERVER_URL + CREDIT_CARD_SINGLE_ICON_PATH,
//                             buttons: [{
//                                 type: "postback",
//                                 title: "Где забрать?",
//                                 payload: "cardLocationPayload",
//                             }]
//                         }
//                     }
//                 }
//             }
//         }
//     };
//
//     callSendAPI(messageData);
// }
//
//
// /** Геолокация с местнахождением ближайшего банкомата (generic template) */
// function sendATMLocationMessage(recipientId) {
//     var lattitude = 55.774822;
//     var longtitude = 37.649813;
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         message: {
//             attachment: {
//                 type: "template",
//                 payload: {
//                     template_type: "generic",
//                     elements: {
//                         element: {
//                             title: "ул. Каланчевская, 27 (test)",
//                             subtitle: "Открыто с 9:00 до 21:00",
//                             "image_url": "https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&center="
//                             + lattitude + "," + longtitude + "&zoom=25&markers=" + lattitude + "," + longtitude,
//                             "item_url": "http:\/\/maps.apple.com\/maps?q=" + lattitude + "," + longtitude + "&z=16"
//                         }
//                     }
//                 }
//             }
//         }
//     };
//
//     callSendAPI(messageData);
// }
//
// /** TODO STUB Информация по счетам */
// function sendAccountsInfoMessage(recipientId) {
//     sendTextMessage(recipientId, "Чуть позже здесь появится информация о счетах");
// }
//
//
//
// /**
//  * Выбор ответа "Провести ли обучение? Да/Нет"
//  * Тип сообщения - кнопки Quick Reply
//  */
// function sendQuickReplyTutorialChoice(recipientId) {
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         message: {
//             text: "Привет! Хочешь, я немного расскажу о себе?",
//             metadata: "quickReplyTutorialChoice-meta",
//             quick_replies: [
//                 {
//                     "content_type": "text",
//                     "title": "Да",
//                     "payload": "quickReplyTutorialYes"
//                 },
//                 {
//                     "content_type": "text",
//                     "title": "Нет",
//                     "payload": "quickReplyTutorialNo"
//                 }
//             ]
//         }
//     };
//     callSendAPI(messageData);
// }
//
//
//
// /** Индикатор "бот набирает сообщение" */
// function sendTypingOn(recipientId) {
//     console.log("Turning typing indicator on");
//
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         sender_action: "typing_on"
//     };
//
//     callSendAPI(messageData);
// }
//
// /** Выключить индикатор "бот набирает сообщение" */
// function sendTypingOff(recipientId) {
//     console.log("Turning typing indicator off");
//
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         sender_action: "typing_off"
//     };
//
//     callSendAPI(messageData);
// }
//
//
//
// /**
//  * Send a message with the account linking call-to-action
//  *
//  */
// function sendAccountLinking(recipientId) {
//     var messageData = {
//         recipient: {
//             id: recipientId
//         },
//         message: {
//             attachment: {
//                 type: "template",
//                 payload: {
//                     template_type: "button",
//                     text: "Welcome. Link your account.",
//                     buttons: [{
//                         type: "account_link",
//                         url: SERVER_URL + "/authorize"
//                     }]
//                 }
//             }
//         }
//     };
//
//     callSendAPI(messageData);
// }
//
// /**
//  * Вызов Send API с передачей тела сообщения
//  */
// function callSendAPI(messageData) {
//     request({
//         uri: 'https://graph.facebook.com/v2.6/me/messages',
//         qs: {access_token: PAGE_ACCESS_TOKEN},
//         method: 'POST',
//         json: messageData
//
//     }, function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//             var recipientId = body.recipient_id;
//             var messageId = body.message_id;
//             if (messageId) {
//                 console.log("Successfully sent message with id %s to recipient %s",
//                     messageId, recipientId);
//             } else {
//                 console.log("Successfully called Send API for recipient %s",
//                     recipientId);
//             }
//         } else {
//             console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
//         }
//     });
// }
//
// function getUserInfo(userID) {
//     console.log("Getting user info");
//     request({
//         uri: 'https://graph.facebook.com/v2.6/' + userID + '/fields=first_name,last_name,profile_pic,locale,timezone,gender',
//         qs: {access_token: PAGE_ACCESS_TOKEN},
//         method: 'GET'
//
//     }, function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//             console.log("Successfully called Graph API for user info");
//         } else {
//             console.error("Failed calling GraphAPI", response.statusCode, response.statusMessage, body.error);
//         }
//     });
// }
//
// // Start server
// // Webhooks must be available via SSL with a certificate signed by a valid
// // certificate authority.
// app.listen(app.get('port'), function () {
//     console.log('Node app is running on port', app.get('port'));
// });
//
// module.exports = app;
// //
//
//
// ////////////////ТЕСТ
// app.get('/test', function (req, res) {
//
//         res.status(200).send("test ok!!");
//
//
//     var messageData = {
//         recipient: {
//             id: 1139718956116260 //tyapkin
//         },
//         message: {
//             text: "message tyapkin test",
//             metadata: "DEVELOPER_DEFINED_METADATA"
//         }
//     };
//
//     callSendAPI_test(messageData);
//
// });
//
// /**
//  * Вызов Send API с передачей тела сообщения
//  */
// function callSendAPI_test(messageData) {
//     request({
//         uri: 'https://graph.facebook.com/v2.6/me/messages',
//        // qs: {access_token: PAGE_ACCESS_TOKEN},
//
//         //bo2510
//        // qs: {access_token: "EAAQsBloQSawBAPYjfCCWYi2G2XqcdCZAi30xPP6GowrREl8sfHSJZBwD8ILI10r0Bq4PIHZCZA6ewZCjqV8ZAB3LKH2OaUD2y53uTutVUmlKMeYhNwF8sdZA5AgEe0uS4LUCfMnk9JY7X2EWOFnS7FVTJyMgtAyP7E0h0YvudwJJgZDZD"},
//
//         //work
//         //qs: {access_token: "EAAEajzOnTK8BAPtuAKWJ767fZBPj1hclknhxCpaZApkKSi5cO7H5JZCciiVXv3BvobknwPRBIbKvRxveOU2A4m8Xqtc4ZAZA89d2U7Gn88NOoMqXjXrWzZByLplIaDyoCIGrXyhdBKMQS4r7aYo5klQnOP4yeWiFZB3rZCZAZBw6DUuAZDZD"},
//
//         //bo2511
//         qs: {access_token: "EAAN7C6QkMpoBAPF7LiyGSDGvDW6vgaEga1Sa0upSpvpy5X7LQVWjONMzhfnd5P188E6eWfJZBEphGX9EXcLRxwa8WAhBvtdtdLKpEAtjIYo5YoW4OVhnwDra3C7QnipEiNJcJli0Kf28XXpmw4ZBCDn4wLZBgWy12KWsYBd7AZDZD"},
//
//
//         method: 'POST',
//         json: messageData
//
//     }, function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//             var recipientId = body.recipient_id;
//             var messageId = body.message_id;
//             if (messageId) {
//                 console.log("tyapkin: Successfully sent message with id %s to recipient %s",
//                     messageId, recipientId);
//             } else {
//                 console.log("tyapkin: Successfully called Send API for recipient %s",
//                     recipientId);
//             }
//         } else {
//             console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
//         }
//     });
// }
// //////////////


////////-----------------------------------------------

/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */
'use strict';

const
    bodyParser = require('body-parser'),
    config = require('config'),
    crypto = require('crypto'),
    express = require('express'),
    https = require('https'),
    request = require('request');

var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));

/*
 * Be sure to setup your config values before running this code. You can
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
    process.env.MESSENGER_APP_SECRET :
    config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
    (process.env.MESSENGER_VALIDATION_TOKEN) :
    config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
    (process.env.SERVER_URL) :
    config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
    console.error("Missing config values");
    process.exit(1);
}

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
    var data = req.body;

    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function(messagingEvent) {
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

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
    }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function(req, res) {
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

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
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

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
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

    // When an authentication is received, we'll send a message back to the sender
    // to let them know it was successful.
    sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var isEcho = message.is_echo;
    var messageId = message.mid;
    var appId = message.app_id;
    var metadata = message.metadata;

    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;
    var quickReply = message.quick_reply;

    if (isEcho) {
        // Just logging message echoes to console
        console.log("Received echo for message %s and app %d with metadata %s",
            messageId, appId, metadata);
        return;
    } else if (quickReply) {
        var quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s",
            messageId, quickReplyPayload);

        sendTextMessage(senderID, "Quick reply tapped");
        return;
    }

    if (messageText) {

        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        switch (messageText) {
            case 'image':
                sendImageMessage(senderID);
                break;

            case 'gif':
                sendGifMessage(senderID);
                break;

            case 'audio':
                sendAudioMessage(senderID);
                break;

            case 'video':
                sendVideoMessage(senderID);
                break;

            case 'file':
                sendFileMessage(senderID);
                break;

            case 'button':
                sendButtonMessage(senderID);
                break;

            case 'generic':
                sendGenericMessage(senderID);
                break;

            case 'receipt':
                sendReceiptMessage(senderID);
                break;

            case 'quick reply':
                sendQuickReply(senderID);
                break;

            case 'read receipt':
                sendReadReceipt(senderID);
                break;

            case 'typing on':
                sendTypingOn(senderID);
                break;

            case 'typing off':
                sendTypingOff(senderID);
                break;

            case 'account linking':
                sendAccountLinking(senderID);
                break;

            default:
                sendTextMessage(senderID, messageText);
        }
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
}


/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
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
        messageIDs.forEach(function(messageID) {
            console.log("Received delivery confirmation for message ID: %s",
                messageID);
        });
    }

    console.log("All message before %d were delivered.", watermark);
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful
    sendTextMessage(senderID, "Postback called");
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    // All messages before watermark (a timestamp) or sequence have been seen.
    var watermark = event.read.watermark;
    var sequenceNumber = event.read.seq;

    console.log("Received message read event for watermark %d and sequence " +
        "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
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

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: SERVER_URL + "/assets/rift.png"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: SERVER_URL + "/assets/instagram_logo.gif"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "audio",
                payload: {
                    url: SERVER_URL + "/assets/sample.mp3"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "video",
                payload: {
                    url: SERVER_URL + "/assets/allofus480.mov"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a file using the Send API.
 *
 */
function sendFileMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "file",
                payload: {
                    url: SERVER_URL + "/assets/test.txt"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
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

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "This is test text",
                    buttons:[{
                        type: "web_url",
                        url: "https://www.oculus.com/en-us/rift/",
                        title: "Open Web URL"
                    }, {
                        type: "postback",
                        title: "Trigger Postback",
                        payload: "DEVELOPER_DEFINED_PAYLOAD"
                    }, {
                        type: "phone_number",
                        title: "Call Phone Number",
                        payload: "+16505551234"
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: "rift",
                        subtitle: "Next-generation virtual reality",
                        item_url: "https://www.oculus.com/en-us/rift/",
                        image_url: SERVER_URL + "/assets/rift.png",
                        buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/rift/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for first bubble",
                        }],
                    }, {
                        title: "touch",
                        subtitle: "Your Hands, Now in VR",
                        item_url: "https://www.oculus.com/en-us/touch/",
                        image_url: SERVER_URL + "/assets/touch.png",
                        buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/touch/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for second bubble",
                        }]
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
    // Generate a random receipt ID as the API requires a unique ID
    var receiptId = "order" + Math.floor(Math.random()*1000);

    var messageData = {
        recipient: {
            id: recipientId
        },
        message:{
            attachment: {
                type: "template",
                payload: {
                    template_type: "receipt",
                    recipient_name: "Peter Chang",
                    order_number: receiptId,
                    currency: "USD",
                    payment_method: "Visa 1234",
                    timestamp: "1428444852",
                    elements: [{
                        title: "Oculus Rift",
                        subtitle: "Includes: headset, sensor, remote",
                        quantity: 1,
                        price: 599.00,
                        currency: "USD",
                        image_url: SERVER_URL + "/assets/riftsq.png"
                    }, {
                        title: "Samsung Gear VR",
                        subtitle: "Frost White",
                        quantity: 1,
                        price: 99.99,
                        currency: "USD",
                        image_url: SERVER_URL + "/assets/gearvrsq.png"
                    }],
                    address: {
                        street_1: "1 Hacker Way",
                        street_2: "",
                        city: "Menlo Park",
                        postal_code: "94025",
                        state: "CA",
                        country: "US"
                    },
                    summary: {
                        subtotal: 698.99,
                        shipping_cost: 20.00,
                        total_tax: 57.67,
                        total_cost: 626.66
                    },
                    adjustments: [{
                        name: "New Customer Discount",
                        amount: -50
                    }, {
                        name: "$100 Off Coupon",
                        amount: -100
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "What's your favorite movie genre?",
            quick_replies: [
                {
                    "content_type":"text",
                    "title":"Action",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
                },
                {
                    "content_type":"text",
                    "title":"Comedy",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
                },
                {
                    "content_type":"text",
                    "title":"Drama",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
                }
            ]
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
    console.log("Sending a read receipt to mark message as seen");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "mark_seen"
    };

    callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
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

/*
 * Turn typing indicator off
 *
 */
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

/*
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
                    buttons:[{
                        type: "account_link",
                        url: SERVER_URL + "/authorize"
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
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

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;


