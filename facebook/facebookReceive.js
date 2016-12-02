/**
 * Created by U_M0PQL on 02.12.2016.
 */

const facebookSend = require('./facebookSend');
const utils = require('./../utils');
const chatLogic = require('./../chat/ChatLogic');

var facebookReceive = new Object();


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

    //Пришел какой-то аттачмент
    if (messageAttachments) {
        facebookSend.sendTextMessage(senderID, "Ух ты какой интересный файл =) Надо будет ознакомиться");
        return;
    }


    //Пришел какой-то текст
    if (messageText) {
        // Пока наш бот ничего не умеет, так что одинаково реагируем на текстовые сообщения
        // и предлагаем воспользоваться кнопками меню

        //сразу все это в chatLogic вогнать, даже приветственный текст
        
            if(messageText == 'start') 
            {
                facebookSend.sendStartOptionsMessage(senderID);
                return;
            }
                
             
        
            //обработать входящее сообщение
            var userMessage = { senderId: senderID, messageText:messageText, date: utils.getFormattedDate(new Date()) }
            
            chatLogic.processUserMessage(userMessage,
                function(chatAnswer)
                {
                    console.log("chatLogic.processUserMessage CALLBACK!");
                    console.log(JSON.stringify(chatAnswer));

                    for(var i=0; i<chatAnswer.chatMessages.length; i++)
                    {
                        console.log("i=" + i);
                        console.log("chatAnswer.chatMessages[i]=" + JSON.stringify(chatAnswer.chatMessages[i]));
                        var msg =chatAnswer.chatMessages[i];

                        facebookSend.sendTextMessage(senderID, msg.messageText);
                    }


                });

        
    }

}

module.exports = facebookReceive;