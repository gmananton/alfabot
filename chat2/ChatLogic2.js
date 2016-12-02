/**
 * Created by U_M0UW8 on 15.11.2016.
 */

/**
 * Created by U_M0PQL on 02.11.2016.
 *
 * Доступ к java-middle
 */
//
// const config     = require('config');
// var clone = require('clone');
// var hashes = require('hashes');
// var utils = require('./../utils');
// var ChatMessage = require('./ChatMessage');
// var СhatAnswer = require('./ChatAnswer');
//
// var chatActions = require('./ChatActions')
//
// //В зависимости от того, установлен ли у нас источник данных, будем использовать либо источник либо заглушку (для Heroku)
// const dataRetreiver = config.get('javaServiceUrl') ? require('./../dataJava') : require('./../dataStub');
//
//
//
// var clients = new hashes.HashTable();

var chatLogic2 = new Object();



chatLogic2.processUserMessage = function(userMessage, callback)
{
    console.log("chatLogic2.processUserMessage()!!");
    // var senderId = userMessage.senderId;
    // var messageText = userMessage.messageText;
    //
    //
    // //забрать инфо по состоянию диалога
    // var clientDialogState = clients.contains(senderId) ? clients.get(senderId).value : createNewUserDialogState(senderId);
    //
    // clientDialogState.numOfMessagesDuringLastSession++;
    //
    // //сохранить состояние диалога и выдать ответ
    // this.getAnswer(clientDialogState, messageText,
    //     function(chatAnswer)    {
    //
    //         //Запомнить состояние диалога
    //         clients.add(senderId, clientDialogState, true);
    //         callback(chatAnswer);
    //     }
    // );

}

/**
 * Получить ответ на сообщение пользователя messageText с учетом состояния диалога clientDialogState
 *
 * @param clientDialogState
 * @param messageText
 * @param callback
 */



//region ---------------------------------------------------Private methods-----------------------



module.exports = chatLogic2;



