/**
 * Created by U_M0UW8 on 15.11.2016.
 */

//Это набор ChatMessages

const ChatMessage = require('./ChatMessage')

var method = ChatAnswer.prototype;

function ChatAnswer(chatMessages) {

    this.chatMessages = chatMessages==null ? new Array() : chatMessages;
    this.senderId = "bot2512";

}

method.addMessage = function(messageCode, messageData, messageExample) {

    if(!this.senderId)
        throw "Не задан senderId";

    var chatMessage = new ChatMessage(this.senderId, messageCode, messageData, messageExample);
    this.chatMessages.push(chatMessage);
};

module.exports = ChatAnswer;
