/**
 * Created by U_M0UW8 on 15.11.2016.
 */

/**
 * Created by U_M0PQL on 02.11.2016.
 *
 * Доступ к java-middle
 */

const config     = require('config');
var clone = require('clone');
var hashes = require('hashes');
var utils = require('./../utils');

const EnumDialogCommands = require('./EnumDialogCommands');
const EnumMessageCodes = require('./EnumMessageCodes');

var СhatAnswer = require('./ChatAnswer');

var chatActions = require('./ChatActions')

//В зависимости от того, установлен ли у нас источник данных, будем использовать либо источник либо заглушку (для Heroku)
const dataRetreiver = config.get('javaServiceUrl') ? require('./../dataJava') : require('./../dataStub');



var clients = new hashes.HashTable();
var clientsIdHash = new hashes.HashTable(); //сопоставление временно выданного хэша, основанного на userId для аутентификации в Албо

var chatLogic = new Object();

var standartMenuCaption =  "Пожалуйста, нажмите "
    + EnumDialogCommands.ab2510cmdCardListStart + " для Списка карт, "
    + EnumDialogCommands.ab2510cmdBalanceStart + " для Баланса, "
    + EnumDialogCommands.ab2510cmdPayDocStatusStart + " для Статуса платежного документа ";


chatLogic.getClientsIdHash = function(){ return clientsIdHash; }

//вызывается НЕ из чата, поэтому сохраняем состояние диалога отдельно.
chatLogic.SetUserAuthenticated = function (userId, cus)
{
    //забрать инфо по состоянию диалога
    var clientDialogState = clients.contains(userId) ? clients.get(userId).value : createNewUserDialogState(userId);

    clientDialogState.authenticatedCus = cus;
    clientDialogState.authenticatedDate = Date.now();

    //сохранить состояние
    //Запомнить состояние диалога
    clients.add(userId, clientDialogState, true);
}

chatLogic.processUserMessage = function(userMessage, callback)
{
    var senderId = userMessage.senderId;
    var messageText = userMessage.messageText;
    var resetCurrentDialog = userMessage.resetCurrentDialog;


    //забрать инфо по состоянию диалога
    var clientDialogState = clients.contains(senderId) ? clients.get(senderId).value : createNewUserDialogState(senderId);

    if(resetCurrentDialog)
        clientDialogState.resetDialog();

    clientDialogState.numOfMessagesDuringLastSession++;

    //сохранить состояние диалога и выдать ответ
    this.getAnswer(clientDialogState, messageText,
        function(chatAnswer)    {

            //Запомнить состояние диалога
            clients.add(senderId, clientDialogState, true);

            console.log("clientDialogState = " + JSON.stringify(clientDialogState));

            callback(chatAnswer);
        }
    );

}

/**
 * Получить ответ на сообщение пользователя messageText с учетом состояния диалога clientDialogState
 *
 * @param clientDialogState
 * @param messageText
 * @param callback
 */
chatLogic.getAnswer = function(clientDialogState, messageText, callback)
{

    //Для каждого возможного состояния мы заводим отдельный элемент (например, clientDialogState.waitChooseMenu).
    //т.к. хотя большинство кейсов могли бы обойтись всего одним единственным элементом,
    // принимающим значение в зависимости от состояния (ввод ИНН -> ввод телефона -> ввод СМС-кода -> конец (получение данных)
    // но с расширением проекта возможно ситуация, когда ввод СМС-кода понадобится для 10 различных операций
    // и иметь варианты "SmsForTask1", "SmsForTask2" - будет неудобно

    //в данной системе понятие "Thread" означает некую линию разговора (диалога), состоящего из нескольких этапах, на каждом из
    //которых собирается и верифицируется информация, чтобы в итоге привести к финальному ответу.

    
    //0.0. Вызов спец команд не нарушает ветку диалога
    if(messageText.startsWith("#abc")) //abc = alfa-bot-command
    {
        chatActions.main.processCommand(clientDialogState, callback, messageText);
        return;
    }

    //0. Вызов "меню" из любого места сбрасывает текущие Тред
    if (messageText == EnumDialogCommands.ab2510cmdMainMenu) {

        chatActions.main.getMenu(clientDialogState, callback);
        return;

    }

    //region   ------------------------------ Тред работы с меню

    //1. Начало переговоров или сразу после окончания треда
    if(clientDialogState.currentThread == EnumThreadNames.isNoSubject ) {

        //Ничего не ожидаем. На любую фразу - выдадим приветствие
        if(!clientDialogState.waitChooseMenu)
        {
            chatActions.main.greeting(clientDialogState, callback);
            return;
        }

        //Ожидаем выбор пункта меню (только для дебага)
        if (clientDialogState.waitChooseMenu) {
            if (messageText == EnumDialogCommands.ab2510cmdCardListStart) {

                chatActions.customerRequestedCardInfo.startThread(clientDialogState, callback);
                return;
            }

            if (messageText == EnumDialogCommands.ab2510cmdBalanceStart) {

                chatActions.balance.startThread(clientDialogState, clientsIdHash, callback);
                return;
            }

            if (messageText == EnumDialogCommands.ab2510cmdPayDocStatusStart) {

                chatActions.payDocStatus.startThread(clientDialogState, callback);
                return;
            }

            //Не распознали выбор
            var chatAnswer = new СhatAnswer();
            chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.main_iCantUnderstand, null, "Извинте, я вас не понимаю, воспользуйтесь меню");
            chatAnswer.addMessage(clientDialogState.userId, EnumMessageCodes.main_showMenu, null, standartMenuCaption);
            callback(chatAnswer);
            return;
        }

    }

    //endregion Тред работы с меню

    //region -------------------------------Тред получения списка карт


    if(clientDialogState.currentThread == EnumThreadNames.getCustomerRequestedCardInfo) {

            //при ожидании ввода ИНН - единственный шаг треда
            chatActions.customerRequestedCardInfo.getRequestedCardInfo(clientDialogState, callback, messageText);
            return;

    }

    //endregion

    //region -------------------------------Тред получения статуса платежки


    if(clientDialogState.currentThread == EnumThreadNames.getPayDocStatus) {

        //шаг 1. при ожидании ввода ИНН
        if(clientDialogState.waitInputCrf)
        {
            chatActions.payDocStatus.checkCrf(clientDialogState, callback, messageText);
            return;
        }

        //шаг 2. при ожидании ввода Номера платежки
        if(clientDialogState.waitInputPayDocNumber)
        {
            chatActions.payDocStatus.checkPayDocNumber(clientDialogState, callback, messageText);
            return;
        }
    }

    //endregion

    //region -------------------------------Тред получения баланса


    if(clientDialogState.currentThread == EnumThreadNames.getBalance) {

        if(!chatActions.common.checkUserIsAuthenticated(clientDialogState))
        {
            chatActions.balance.promptForAuthentication(clientDialogState, clientsIdHash, callback);
            return;
        }

        //шаг 1. при ожидании ввода ИНН
        if(clientDialogState.waitInputCrf)
        {
            chatActions.balance.сheckCrf(clientDialogState, callback, messageText);
            return;
        }





    }

    //endregion



}





//region ---------------------------------------------------Private methods-----------------------


/**
 * Шаблон состояния нового пользователя
 */
 createNewUserDialogState = function(userId)
{
    var o = new Object();
    o.userId = userId;
    o.lastSpeakDate = new Date(); //после длительного перерыва (10 мин) сбросится состояние авторизации
    o.numOfMessagesDuringLastSession=0;




    //текущий тред диалога
    o.currentThread = EnumThreadNames.isNoSubject;

    //текущее состояние пользователя в рамках Треда
    o.waitChooseMenu = false; //Ожидается выбор меню действий
    o.waitInputCrf = false;   //Ожидается ввод ИНН
    o.waitInputPayDocNumber = false;   //Ожидается ввод номера платежки

    //аутентификация
    o.authenticatedCus = null;  //cus пользователя, когда аутентифицировался
    o.authenticatedDate = null; //дата аутентификации (считаем, что пользователь активен 20 мин, дальше будет сброс)


    //текущие данные, сохраняемые в рамках треда. При смене треда, данные обнуляются
    o.data = new Object();

    //сбрасываем состояние диалога и переходим в ожидание выбора меню (обычно вызывается при явном вызове меню посередине любой ветки диалога)
    o.resetDialog = function () {
        o.currentThread = EnumThreadNames.isNoSubject;

        o.data = new Object();

        //текущее состояние пользователя в рамках Треда
        o.waitChooseMenu = true; //Ожидается выбор меню действий
        o.waitInputCrf = false;   //Ожидается ввод ИНН
        o.waitInputPayDocNumber = false;

    }

    return o;
}




//endregion




module.exports = chatLogic;



