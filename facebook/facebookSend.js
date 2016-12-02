/**
 * Created by U_M0PQL on 02.12.2016.
 */

const request    = require('request');
const config    = require('config');

const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

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

var facebookSend = new Object();



//region Базовые методы


/**
 * Вызов Send API с передачей тела сообщения
 */
facebookSend.callSendAPI = function (messageData) {
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

/** Простое текстовое сообщение */
facebookSend.sendTextMessage = function (recipientId, messageText) {

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            //metadata: "DEVELOPER_DEFINED_METADATA" //удалить
        }
    };

    facebookSend.callSendAPI(messageData);
}

//endregion

//region Set Typing On-Off



/** Индикатор "бот набирает сообщение" */
 facebookSend.sendTypingOn = function(recipientId) {
    console.log("Turning typing indicator on");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

     facebookSend.callSendAPI(messageData);
}

/** Выключить индикатор "бот набирает сообщение" */
facebookSend.sendTypingOff = function (recipientId) {
    console.log("Turning typing indicator off");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_off"
    };

    facebookSend.callSendAPI(messageData);
}

//endregion

/** Главное меню с выбором действий (generic template) */
facebookSend.sendStartOptionsMessage = function (recipientId) {
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

    facebookSend.callSendAPI(messageData);
}


/** TODO STUB Информация по счетам */
facebookSend.sendAccountsInfoMessage = function (recipientId) {
    facebookSend.sendTextMessage(recipientId, "Чуть позже здесь появится информация о счетах !!");
}



/** Статус готовности карты (generic template) */
facebookSend.sendCardStatusMessage = function (recipientId) {
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

    facebookSend.callSendAPI(messageData);
}


/**
 * Выбор ответа "Провести ли обучение? Да/Нет"
 * Тип сообщения - кнопки Quick Reply
 */
facebookSend.sendQuickReplyTutorialChoice = function (recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "Привет! Хочешь, я немного расскажу о себе??",
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
    facebookSend.callSendAPI(messageData);
}




/** Геолокация с местнахождением карты (generic template) */
facebookSend.sendCardLocationMessage = function (recipientId) {
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
                            title: "Вы сможете забрать Вашу карту в данном отделении!",
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

    facebookSend.callSendAPI(messageData);
}


//region На будущее - просто примеры

/** Геолокация с местнахождением ближайшего банкомата (generic template) */
facebookSend.sendATMLocationMessage =function (recipientId) {
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
                            title: "ул. Каланчевская, 27",
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

    facebookSend.callSendAPI(messageData);
}


/** Сообщение с картинкой */
 facebookSend.sendImageMessage = function(recipientId, imageURL) {
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
     facebookSend.callSendAPI(messageData);
}

/** Сообщение с видео */
  facebookSend.sendVideoMessage = function(recipientId, videoURL) {
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
      facebookSend.callSendAPI(messageData);
}


//endregion

module.exports = facebookSend;