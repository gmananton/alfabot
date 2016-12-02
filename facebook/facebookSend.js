/**
 * Created by U_M0PQL on 02.12.2016.
 */


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

module.exports = facebookSend;