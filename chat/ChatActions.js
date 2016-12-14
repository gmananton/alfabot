/**
 * Created by U_M0UW8 on 15.11.2016.
 */

const config     = require('config');
const ChatAnswer = require('./ChatAnswer');
const EnumThreadNames = require('./EnumThreadNames');
const EnumMessageCodes = require('./EnumMessageCodes');
const dataRetreiver = config.get('javaServiceUrl') ? require('../dataJava') : require('../dataStub');
const utils     = require('../utils');

var chatActions = new Object();

//Разделы, которые у нас есть

chatActions.main = new Object();
chatActions.common = new Object();
chatActions.customerRequestedCardInfo = new Object();
chatActions.balance = new Object();
chatActions.payDocStatus = new Object();

var standartMenuCaption =  "Пожалуйста, нажмите "
    + EnumDialogCommands.ab2510cmdCardListStart + " для Списка карт, "
    + EnumDialogCommands.ab2510cmdBalanceStart + " для Баланса, "
    + EnumDialogCommands.ab2510cmdPayDocStatusStart + " для Статуса платежного документа ";

//region start

/**
 * Запрос меню
 *
 * @param clientDialogState
 * @param callback
 */
chatActions.main.getMenu = function(clientDialogState, callback)
{

    clientDialogState.data = new Object(); //обнулить контекстные данные предыдущего треда

    clientDialogState.currentThread = EnumThreadNames.isNoSubject;
    clientDialogState.waitChooseMenu=true;

    var chatAnswer = new ChatAnswer();
    chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.main_showMenu, null, "Выберите операцию. " + standartMenuCaption);
    callback(chatAnswer);
}

/**
 * Первичное приветствие.
 *
 * @param clientDialogState
 * @param callback
 */
chatActions.main.greeting = function(clientDialogState, callback)
{
    clientDialogState.waitChooseMenu = true;

    clientDialogState.data = new Object(); //обнулить контекстные данные предыдущего треда

    //первое приветствие
    var greeting = clientDialogState.numOfMessagesDuringLastSession == 1 ? "Добрый день. "+ standartMenuCaption +" (в любой момент времени введите \"ab2510cmdMainMenu\" для выхода из текущего диалога)" :
        "Чем я еще могу вам помочь? "+standartMenuCaption+" (в любой момент времени введите \"ab2510cmdMainMenu\" для выхода из текущего диалога)";

    var chatAnswer = new ChatAnswer();
    chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.main_whatCanIHelp,  clientDialogState, greeting);
    callback(chatAnswer);
}

//endregion

//region customerRequestedCardInfo

//стартуем тред получения списка карт
chatActions.customerRequestedCardInfo.startThread = function(clientDialogState, callback)
{

    var chatAnswer = new ChatAnswer();

    clientDialogState.data = new Object(); //обнулить контекстные данные предыдущего треда

    clientDialogState.waitChooseMenu = false;
    clientDialogState.currentThread = EnumThreadNames.getCustomerRequestedCardInfo;
    chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.cardList_ProvideInn, null, "[Получение списка карт]: Введите ИНН юр. лица");
    callback(chatAnswer);
}

//получаем список карт по ИНН
chatActions.customerRequestedCardInfo.getRequestedCardInfo = function(clientDialogState, callback, messageText)
{

    var chatAnswer = new ChatAnswer();

    //проверка валидности ИНН
    if(!chatActions.common.checkIsCrf(messageText)) {
        chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.cardList_IncorrectInn, null, "ИНН введен некорректно. Попробуйте еще раз (\"ab2510cmdMainMenu\" для выхода из диалога)");
        callback(chatAnswer);
        return;
    }

    //получаем данные
    chatActions.customerRequestedCardInfo.getCustomerRequestedCardInfo(messageText,
        function(res){

            var answer = res;

            clientDialogState.currentThread = EnumThreadNames.isNoSubject;
            clientDialogState.waitChooseMenu=true;

            chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.cardList_Result, res, "[Получение списка карт]: " + JSON.stringify(answer));
            //chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.main_whatCanIHelp, null, "Чем я еще могу помочь? " + standartMenuCaption);
            callback(chatAnswer);
            return;
        });
}


//endregion

//region getBalance

chatActions.balance.startThread = function(clientDialogState, clientsIdHash, callback)
{

    var chatAnswer = new ChatAnswer();

    clientDialogState.data = new Object(); //обнулить контекстные данные предыдущего треда

    clientDialogState.waitChooseMenu = false;
    clientDialogState.currentThread = EnumThreadNames.getBalance;

    clientDialogState.waitInputCrf = true;

    if(!chatActions.common.checkUserIsAuthenticated(clientDialogState))
    {
        chatActions.balance.promptForAuthentication(clientDialogState, clientsIdHash, callback);
        return;
    }
    else
    {
        chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.balance_ProvideInn, null, "[Получение баланса]: Введите ИНН юр. лица");
        callback(chatAnswer);
    }



}

//для получения баланса - шаг 1. Вводим и проверяем ИНН
chatActions.balance.сheckCrf = function(clientDialogState, callback, messageText)
{

    var chatAnswer = new ChatAnswer();

    //проверка валидности ИНН
    if(!chatActions.common.checkIsCrf(messageText)) {
        chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.balance_IncorrectInn, null, "[Получение баланса]: ИНН введен некорректно. Попробуйте еще раз (\"ab2510cmdMainMenu\" для выхода из диалога)");
        callback(chatAnswer);
        return;
    }

    //Сходить - проверить ИНН и в случае успеха - сохранить введенный ИНН и продолжить

    var crf = messageText;
    var cus = clientDialogState.authenticatedCus;


    //Сходить - получить данные
    //получаем данные
    dataRetreiver.getBalance(crf, cus,
        function(result)
        {
            var answer = result;


            clientDialogState.currentThread = EnumThreadNames.isNoSubject;
            clientDialogState.waitChooseMenu=true;
            clientDialogState.waitInputCrf = false;

            chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.balance_Result, result, "[Получение баланса]: " + JSON.stringify(answer));
            callback(chatAnswer);
            return;

        });



}

//для неаутентифицированного пользователя - попровить аутентифицироваться
chatActions.balance.promptForAuthentication = function(clientDialogState, clientsIdHash, callback)
    {

        var chatAnswer = new ChatAnswer();
        
        //Сгенерить и запомнить chatUserHash-сопоставление
        var chatUserHash = utils.getHashCode(Date.now().toString() + clientDialogState.userId.toString()) // clientDialogState.userId;

        //ведем хэш-таблицу сопоставления замаскированного userId и оригинальноо userId
        clientsIdHash.add(chatUserHash, clientDialogState.userId, true); //вообще, это можно в БД сохранить и после 3 мин удалять
        

        chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.balance_PromptForAuthentication, {chatUserHash: clientDialogState.userId},"[Получение баланса]: Войдите в ALBO по ссылке http://localhost:5000/loginPage.html?chatUserHash=" + chatUserHash);
       // chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.balance_AuthenticationSuccess, {login: "alboUser166"},"[Получение баланса]: Вы вошли в систему под учетной записью alboUser166");

        callback(chatAnswer);
    }





//endregion

//region payDocStatus

//стартуем тред получения списка карт
chatActions.payDocStatus.startThread = function(clientDialogState, callback)
{

    var chatAnswer = new ChatAnswer();

    clientDialogState.data = new Object(); //обнулить контекстные данные предыдущего треда

    clientDialogState.waitChooseMenu = false;
    clientDialogState.currentThread = EnumThreadNames.getPayDocStatus;


    clientDialogState.waitInputCrf = true;
    clientDialogState.waitInputPayDocNumber = false;

    chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.payDocStatus_ProvideInn, null, "[Получение статуса платежки]: Введите ИНН юр. лица");
    callback(chatAnswer);
}



//получаем ИНН организации
chatActions.payDocStatus.checkCrf = function(clientDialogState, callback, messageText)
{


    var chatAnswer = new ChatAnswer();

    //проверка валидности ИНН
    if(!chatActions.common.checkIsCrf(messageText)) {
        chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.payDocStatus_ProvideInn, null, "[Получение статуса платежки]: ИНН введен некорректно. Попробуйте еще раз (\"ab2510cmdMainMenu\" для выхода из диалога)");
        callback(chatAnswer);
        return;
    }

    //Сходить - проверить ИНН и в случае успеха - сохранить введенный ИНН и продолжить

    clientDialogState.data.crf = messageText;

    clientDialogState.waitInputCrf = false;
    clientDialogState.waitInputPayDocNumber = true;

    chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.payDocStatus_ProvidePayDocNumber, null,"[Получение статуса платежки]: Введите номер платежного документа");
    callback(chatAnswer);
}



//для получения инфо по платежки - шаг 2. Вводим номер платежки - показываем результат
chatActions.payDocStatus.checkPayDocNumber = function(clientDialogState, callback, messageText)
{

    var chatAnswer = new ChatAnswer();

    //проверка номера платежки (если есть какие-то правила, то можно проверить тут. Пока - просто на заполненность)
    if(messageText=="") {
        chatAnswer.addMessage(clientDialogState.userId,EnumMessageCodes.payDocStatus_IncorrectPayDocNumber, null, "[Получение статуса платежки]: Введен неверный номер платежки. Попробуйте еще раз (\"ab2510cmdMainMenu\" для выхода из диалога)");
        callback(chatAnswer);
        return;
    }

    var crf = clientDialogState.data.crf;
    var docId = messageText;

    //получаем данные
    dataRetreiver.getPayDocStatus(crf, docId,
        function(result)
        {
            var answer = result;


            clientDialogState.currentThread = EnumThreadNames.isNoSubject;
            clientDialogState.waitChooseMenu=true;
            clientDialogState.waitInputPayDocNumber = false;

            chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.payDocStatus_Result, result, "[Получение статуса платежки]: " + JSON.stringify(answer));
            //chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.main_whatCanIHelp, null, "Чем я еще могу помочь? " + standartMenuCaption);
            callback(chatAnswer);
            return;

            callback(result);
        });




}

//endregion


//region private methods

/**
 * Проверка, что введенная строка - ИНН
 * @param messageText
 * @returns {boolean}
 */
chatActions.common.checkIsCrf = function(messageText){

    if((messageText.length == 12 || messageText.length==10) && parseInt(messageText,10)>0)
        return true;

    return false;
}



chatActions.common.checkUserIsAuthenticated = function(clientDialogState){

    if(clientDialogState.authenticatedDate)
    {
        var loginDate = new Date(clientDialogState.authenticatedDate);
        var currentDate = new Date();
        var timeSpanSeconds = (currentDate - loginDate)/1000;

        if(timeSpanSeconds > 3*60) {

            clientDialogState.authenticatedDate = null;
            clientDialogState.authenticatedCus = null;
        }
    }

    return clientDialogState.authenticatedCus!=null;
}



/**
 * Получить список карт
 * @param crf
 * @returns {{user: string, cards: string}}
 */
chatActions.customerRequestedCardInfo.getCustomerRequestedCardInfo =function(crf, callback)
{
    dataRetreiver.getCustomerRequestedCardInfo(crf,
        function(result)
        {
            callback(result);
        });


}

//endregion





module.exports = chatActions;
