/**
 * Created by U_M0PQL on 02.12.2016.
 */

//задача facebookView = конвертить полученный из chatLogic message в сообщение facebookApi с форматированием, картинками и т.п.

const request    = require('request');
const config    = require('config');

const EnumMessageCodes = require('./../chat/EnumMessageCodes');

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

var facebookView = new Object();

facebookView.Convert = function(chatMessage)
{
    var fbJson;
    var recipientId = chatMessage.recepientId;

    switch (chatMessage.messageCode)
    {
        case EnumMessageCodes.main_whatCanIHelp:
            var clientDialogState = chatMessage.messageData; //сюда передается clientDialogState
            var txt = clientDialogState.numOfMessagesDuringLastSession==1 ?
                "Здравствуйте! Я чат-бот Альфа банка. Я могу выполнить для Вас некоторые операции. Воспользуйтесь меню, " +
                "находящееся слева от поля ввода" :
                "Чем я могу еще помочь? Выберите пункт меню";

            fbJson = facebookView.getSimpleTextMessage(recipientId, txt);
            break;
        
        case EnumMessageCodes.main_showMenu:
            fbJson = facebookView.getMainMenu(recipientId);
            break;
        
        case EnumMessageCodes.main_iCantUnderstand:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Извините, я Вас не понимаю. Воспользуйтесь меню");
            break;

        //region Списое карт
        case EnumMessageCodes.cardList_ProvideInn:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введите ИНН");
            break;
        case EnumMessageCodes.cardList_IncorrectInn:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введен некорректный ИНН");
            break;
        case EnumMessageCodes.cardList_Result:

            console.log("Список карт: " + JSON.stringify(chatMessage.messageData))

            var str="";
            chatMessage.messageData.data.cards.forEach(function(item, i, arr) {
                str+=item.name + " - " + item.status + "\n";
            });

            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Результат: \n" + str );
            break;

        //endregion

        //region Баланс

        case EnumMessageCodes.balance_ProvideInn:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введите ИНН");
            break;

        case EnumMessageCodes.balance_IncorrectInn:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введен некорректный ИНН");
            break;

        case EnumMessageCodes.balance_ProvideLast4Digits:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введите последине 4 цифры вашего телефона");
            break;

        case EnumMessageCodes.balance_IncorrectLast4Digits:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введен некорректные 4 цифры");
            break;

        case EnumMessageCodes.balance_ProvideSmsCode:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введите SMS код");
            break;

        case EnumMessageCodes.balance_IncorrectSmsCode:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введен некорректный SMS код");
            break;

        case EnumMessageCodes.balance_Result:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Результат: " + JSON.stringify(chatMessage.messageData));
            break;

        //endregion

        default:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Нет фразы для заданного кода сообщения. Example:" + chatMessage.messageExample);
            break;
    }

    return fbJson;

}

facebookView.getSimpleTextMessage = function(recipientId, messageText)
{
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,

        }
    };

    return messageData;
}


/** Главное меню с выбором действий (generic template) */
facebookView.getMainMenu = function (recipientId) {
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
                            title: "Заказанные карты",
                            subtitle: "Узнать статус готовности заказанных карт",
                            image_url: SERVER_URL + CREDIT_CARDS_ICON_PATH,
                            buttons: [{
                                type: "postback",
                                title: "Узнать статус",
                                payload: "ab2510cmdCardListStart"
                            }]
                        },
                        {
                            title: "Счета",
                            subtitle: "Посмотреть текущее состояние счетов",
                            image_url: SERVER_URL + PIGGI_ICON_PATH,
                            buttons: [{
                                type: "postback",
                                title: "Посмотреть состояние счетов",
                                payload: "ab2510cmdBalanceStart"
                            }]
                        },
                        // {
                        //     title: "Ближайший банкомат",
                        //     subtitle: "Посмотреть адрес ближайшего банкомата",
                        //     image_url: SERVER_URL + LOCATION_ICON_PATH,
                        //     buttons: [{
                        //         type: "postback",
                        //         title: "Посмотреть ближайший банкомат",
                        //         payload: "atmPayload"
                        //     }]
                        // },
                        //
                        // {
                        //     title: "Сотрудник",
                        //     subtitle: "Связаться с поддержкой банка",
                        //     image_url: SERVER_URL + PERSON_ICON_PATH,
                        //     buttons: [{
                        //         type: "phone_number",
                        //         title: "Связаться с поддержкой",
                        //         payload: "+74957888878"
                        //     }]
                        // }
                    ]
                }
            }
        }
    };

    return messageData;
}


module.exports = facebookView;