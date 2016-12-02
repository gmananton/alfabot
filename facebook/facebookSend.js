/**
 * Created by U_M0PQL on 02.12.2016.
 */

const request    = require('request');
const config    = require('config');

const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

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
            metadata: "DEVELOPER_DEFINED_METADATA" //удалить
        }
    };

    facebookSend.callSendAPI(messageData);
}

//endregion

/** TODO STUB Информация по счетам */
facebookSend.sendAccountsInfoMessage = function (recipientId) {
    facebookSend.sendTextMessage(recipientId, "Чуть позже здесь появится информация о счетах !!");
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

//endregion

module.exports = facebookSend;