/**
 * Created by U_M0PQL on 02.12.2016.
 */

const facebookSend = require('./facebookSend');
const facebookView = require('./facebookView');

const utils = require('./../utils');
const chatLogic = require('./../chat/ChatLogic');

const EnumDialogCommands = require('./../chat/EnumDialogCommands');

var facebookReceive = new Object();


//region Основные методы  - получение текстовых сообщений и кнопочных postBack-ов

/**
 * Message Event
 * Событие "Сообщение". Вызывается, когда сообщение посылвается вашей странице.
 * Формат объекта 'message' и его поля варьируются в зависимости от типа сообщения
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 */
facebookReceive.receivedMessage = function(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    var replyMessage = "";



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

    //что за эхо - выпилить
    if (isEcho) {
        console.log("Received echo for message %s and app %d with metadata %s",
            messageId, appId, metadata);
        return;
    }

    //пришло нажатие на кнопку quickReply
    if (quickReply) {
        var quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s",   messageId, quickReplyPayload);

        if (quickReplyPayload ==='quickReplyTutorialYes') {
            facebookSend.sendTextMessage(senderID, "Загрузка обучения...");
            facebookSend.sendVideoMessage(senderID, TUTORIAL_VIDEO_PATH);
        }

        if (quickReplyPayload ==='quickReplyTutorialNo') {
            facebookSend.sendStartOptionsMessage(senderID);
        }

        return;
    }

    //Пришел какой-то аттачмент (либо аттачмент либо текст)
    if (messageAttachments) {
        facebookSend.sendTextMessage(senderID, "Ух ты какой интересный файл =) Надо будет ознакомиться");
        return;
    }


    //Пришел какой-то текст
    if (messageText) {
        
            //обработать входящее сообщение. Оно идет в рамках текущей ветки диалога
            var userMessage = { senderId: senderID, messageText:messageText, resetCurrentDialog:false, date: utils.getFormattedDate(new Date()) }
            
            chatLogic.processUserMessage(userMessage, facebookSend.sendAnswer);
        
    }

}


/**
 * Postback Event
 *
 * Вызывается при нажатии на какую-либо postback-кнопку generic-сообщения
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
facebookReceive.receivedPostback = function (event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    var payload = event.postback.payload;

    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

    console.log(JSON.stringify(event.sender));

    if (payload) {
        
        //payload приравниваем к текстовому сообщению (поскольку все payload-ы условно уникальны и не набираются пользователем)

        //обработать входящее сообщение. Поскольку это команда из Меню, то сбрасываем текущую ветку диалога 
        // (кнопки quickReply - особые, обрабатываются в facebookReceive.receivedMessage)
        var userMessage = { senderId: senderID, messageText:payload, resetCurrentDialog:true, date: utils.getFormattedDate(new Date()) }

        chatLogic.processUserMessage(userMessage, facebookSend.sendAnswer);
        
        
        // switch (payload) {
        //     case 'startConversationPayload':
        //         facebookSend.sendQuickReplyTutorialChoice(senderID);
        //         break;
        //     //case 'mainMenuPayload':
        //     case EnumDialogCommands.ab2510cmdMainMenu:
        //         facebookSend.sendStartOptionsMessage(senderID);
        //         break;
        //     case 'tutorialPayload':
        //         facebookSend.sendQuickReplyTutorialChoice(senderID);
        //         break;
        //     //case 'cardStatusPayload':
        //     case EnumDialogCommands.ab2510cmdCardListStart:
        //         facebookSend.sendCardStatusMessage(senderID);
        //         break;
        //     case 'atmPayload':
        //         facebookSend.sendATMLocationMessage(senderID);
        //         break;
        //     case 'accountsPayload':
        //         facebookSend.sendAccountsInfoMessage(senderID);
        //         break;
        //     case 'cardLocationPayload':
        //         facebookSend.sendCardLocationMessage(senderID);
        //         break;
        //     default:
        //
        //
        //         facebookSend.sendTextMessage(senderID, "Прошу прощения, я Вас не совсем понял...");
        //         break;
        // }
    }
}

//endregion

//region Менее важные возможности (по факту - заглушки, чтобы просто знали, что возможность есть)


/**
 * Message Read Event
 *
 * Вызывается когда предыдущее отправленное сообщение было прочитано пользоователем
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
 facebookReceive.receivedMessageRead = function(event) {
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
  facebookReceive.receivedAccountLink = function(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    var status = event.account_linking.status;
    var authCode = event.account_linking.authorization_code;

    console.log("Received account link event with for user %d with status %s " +
        "and auth code %s ", senderID, status, authCode);
}


/**
 * Delivery Confirmation Event
 * Событие подтвержлдения доставки сообщения пользователю
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
 facebookReceive.receivedDeliveryConfirmation = function(event) {
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
 * Authorization Event
 * Событие авторизации. В дашборде указано как 'optin.ref'. Для плагина "Send to Messenger" это поле 'data-ref'
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
facebookReceive.receivedAuthentication = function(event) {
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

    facebookSend.sendTextMessage(senderID, "Authentication successful");
}


//endregion

module.exports = facebookReceive;