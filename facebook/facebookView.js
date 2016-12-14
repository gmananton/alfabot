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

    switch (chatMessage.messageCode) {
        case EnumMessageCodes.main_whatCanIHelp:
            var clientDialogState = chatMessage.messageData; //сюда передается clientDialogState
            var txt = clientDialogState.numOfMessagesDuringLastSession == 1 ?
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
            console.log("length: " + chatMessage.messageData.data.customerRequestedCardInfos.length);

            var str = "";
            for (var i = 0; i < chatMessage.messageData.data.customerRequestedCardInfos.length; i++) {
                var item = chatMessage.messageData.data.customerRequestedCardInfos[i];
                var strStatus = item.enCardStatus == "Ready" ? "готово" : "не готово";
                var strOfficeAddress = item.officeAddress ? "\n\n(" + item.officeAddress + ")" : "";

                str += item.firstName + " " + item.middleName + ":   " + strStatus + strOfficeAddress + "\n\n";

            }


            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Результат: \n" + str);
            break;

        //endregion

        //region Баланс

        case EnumMessageCodes.balance_ProvideInn:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введите ИНН");
            break;

        case EnumMessageCodes.balance_IncorrectInn:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введен некорректный ИНН");
            break;


        case EnumMessageCodes.balance_PromptForAuthentication:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Для получения защищенных данных, пожалуйста, войдите в систему http://albo.ru/loginPage.html?chatUserHash=" + chatMessage.messageData.chatUserHash);
            break;

        case EnumMessageCodes.balance_AuthenticationSuccess:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Вы вошли под учетной записью:" + JSON.stringify(chatMessage.messageData));
            break;


        case EnumMessageCodes.balance_Result:

            console.log("Статус платежки: " + JSON.stringify(chatMessage.messageData))

            var str = "";

            if (chatMessage.messageData.data.message) //данные по балансу не найдены или  не получены по какой-либо бизнес-причине
                str = chatMessage.messageData.data.message;
            else {

                var accountsList = chatMessage.messageData.data.accountsList;

                for (var i = 0; i < accountsList.length; i++) {
                    var item = accountsList[i]; //показываем последние 4 цифры номера счета
                    str += "****" + item.accountNumber.substr(item.accountNumber.length - 4)
                        + " - " + item.amount + " " + item.enCurrency + "\n\n";
                }

            }


            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Результат: \n" + str);

            //fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Результат: " + JSON.stringify(chatMessage.messageData));
            break;

        //endregion


        //region Платежки

        case EnumMessageCodes.payDocStatus_ProvideInn:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введите ИНН");
            break;

        case EnumMessageCodes.payDocStatus_IncorrectInn:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введен некорректный ИНН");
            break;

        case EnumMessageCodes.payDocStatus_ProvidePayDocNumber:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введите номер платежного поручения");
            break;

        case EnumMessageCodes.payDocStatus_IncorrectPayDocNumber:
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Введен некорректный номер платежного поручения");
            break;

        case EnumMessageCodes.payDocStatus_Result:

            console.log("Статус платежки: " + JSON.stringify(chatMessage.messageData))

            var str = "";

            if (chatMessage.messageData.data.message) //данные по платежке не найдены или  не получены по какой-либо бизнес-причине
                str = chatMessage.messageData.data.message;
            else {

                var payDocInfo = chatMessage.messageData.data.payDocInfo;
                var strStatus = "";

                switch (payDocInfo.enPayDocStatus) {
                    case "InProgress":
                        strStatus = "в процессе";
                        break;
                    case "Done":
                        strStatus = "выполнен";
                        break;
                    case "Cancelled":
                        strStatus = "отменен";
                        break;
                    case "Refused":
                        strStatus = "отклонен";
                        break;
                    default:
                        strStatus = "статус не распознан";
                        break;
                }

                str = "Статус платежного документа " + payDocInfo.docid + ": " + strStatus;


            }


            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Результат: \n" + str);

            break;

        //endregion

        case EnumMessageCodes.security_AuthenticationSuccess:

            var login = chatMessage.data.login;
            fbJson = facebookView.getSimpleTextMessage(recipientId, "(fb): Вы успешно аутентифиуировались под пользователем: \n" + login);
            break;
       

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
                        {
                            title: "Платежные документы",
                            subtitle: "Узнать статус выполнения платежного документа",
                            image_url: SERVER_URL + LOCATION_ICON_PATH,
                            buttons: [{
                                type: "postback",
                                title: "Посмотреть состояние счетов",
                                payload: "ab2510cmdPayDocStatusStart"
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