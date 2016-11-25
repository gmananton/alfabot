/**
 * Created by U_M0UW8 on 15.11.2016.
 */

const utils = require('../utils');

var method = ChatMessage.prototype;

function ChatMessage(senderId, messageText, messageDate) {
    this.senderId = senderId;
    this.messageText = messageText;
    this.date = utils.getFormattedDate( messageDate==null ? new Date() : messageDate );
}

method.getSenderId = function() {
    return this.senderId;
};


module.exports = ChatMessage;
