/**
 * Created by U_M0UW8 on 15.11.2016.
 */

const utils = require('../utils');

var method = ChatMessage.prototype;

function ChatMessage(senderId, messageCode, messageData, messageExample, messageDate) {
    this.senderId = senderId;
    
    this.messageCode = messageCode; //код сообщения (чтобы разные боты и debugChat на основе их форматировали вывод данных)
    this.messageData = messageData; //данные
    this.messageExample = messageExample; //Просто строка для примера, условно, как оно выглядит, чтобы кодировать было более наглядно
                                            //Она используется только в debugChat - то есть полезная, не удалять
    
    this.date = utils.getFormattedDate( messageDate==null ? new Date() : messageDate );
}

method.getSenderId = function() {
    return this.senderId;
};


module.exports = ChatMessage;
