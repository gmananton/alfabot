/**
 * Created by U_M0UW8 on 15.11.2016.
 */

const config     = require('config');
const ChatAnswer = require('./ChatAnswer');
const EnumThreadNames = require('./EnumThreadNames');
const dataRetreiver = config.get('javaServiceUrl') ? require('../dataJava') : require('../dataStub');

var chatActions = new Object();

//Разделы, которые у нас есть

chatActions.main = new Object();
chatActions.common = new Object();
chatActions.customerRequestedCardInfo = new Object();
chatActions.balance = new Object();


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
    chatAnswer.addMessage("Выберите операцию (Нажмите 1 для Списка карт и 2 для Баланса)");
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
    var greeting = clientDialogState.numOfMessagesDuringLastSession == 1 ? "Добрый день. Нажмите 1 для Списка карт и 2 для Баланса (в любой момент времени введите \"меню\" для выхода из текущего диалога)" :
        "Чем я еще могу вам помочь? (Нажмите 1 для Списка карт и 2 для Баланса) (в любой момент времени введите \"меню\" для выхода из текущего диалога)";

    var chatAnswer = new ChatAnswer();
    chatAnswer.addMessage(greeting);
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
    chatAnswer.addMessage("[Получение списка карт]: Введите ИНН юр. лица");
    callback(chatAnswer);
}

//получаем список карт по ИНН
chatActions.customerRequestedCardInfo.getRequestedCardInfo = function(clientDialogState, callback, messageText)
{

    var chatAnswer = new ChatAnswer();

    //проверка валидности ИНН
    if(!chatActions.common.checkIsCrf(messageText)) {
        chatAnswer.addMessage("ИНН введен некорректно. Попробуйте еще раз (\"меню\" для выхода из диалога)");
        callback(chatAnswer);
        return;
    }

    //получаем данные
    chatActions.customerRequestedCardInfo.getCustomerRequestedCardInfo(messageText,
        function(res){

            var answer = format_getCustomerRequestedCardInfo(res);

            clientDialogState.currentThread = EnumThreadNames.isNoSubject;
            clientDialogState.waitChooseMenu=true;

            chatAnswer.addMessage("[Получение списка карт]: " + answer);
            chatAnswer.addMessage("Чем я еще могу помочь? (Нажмите 1 для Списка карт и 2 для Баланса)");
            callback(chatAnswer);
            return;
        });
}


//endregion

//region getBalance

chatActions.balance.startThread = function(clientDialogState, callback)
{

    var chatAnswer = new ChatAnswer();

    clientDialogState.data = new Object(); //обнулить контекстные данные предыдущего треда

    clientDialogState.waitChooseMenu = false;
    clientDialogState.currentThread = EnumThreadNames.getBalance;

    clientDialogState.waitInputCrf = true;
    clientDialogState.waitInputLast4PhoneDigits = false;
    clientDialogState.waitSmsAnswer = false;

    chatAnswer.addMessage("[Получение баланса]: Введите ИНН юр. лица");
    callback(chatAnswer);
}

//для получения баланса - шаг 1. Вводим и проверяем ИНН
chatActions.balance.сheckCrf = function(clientDialogState, callback, messageText)
{

    var chatAnswer = new ChatAnswer();

    //проверка валидности ИНН
    if(!chatActions.common.checkIsCrf(messageText)) {
        chatAnswer.addMessage("[Получение баланса]: ИНН введен некорректно. Попробуйте еще раз (\"меню\" для выхода из диалога)");
        callback(chatAnswer);
        return;
    }

    //Сходить - проверить ИНН и в случае успеха - сохранить введенный ИНН и продолжить

    clientDialogState.data.crf = messageText;

    clientDialogState.waitInputCrf = false;
    clientDialogState.waitInputLast4PhoneDigits = true;

    chatAnswer.addMessage("[Получение баланса]: Введите последние 4 цифры номера телефона");
    callback(chatAnswer);
}

//для получения баланса - шаг 2. Вводим и проверяем посление 4 цифры
chatActions.balance.checkLast4PhoneDigits = function(clientDialogState, callback, messageText)
    {

        var chatAnswer = new ChatAnswer();

        //проверка валидности ввода
        if(!chatActions.common.checkIsLast4Digits(messageText)) {
            chatAnswer.addMessage("[Получение баланса]: 4 цифры введены некорректно. Попробуйте еще раз (\"меню\" для выхода из диалога)");
            callback(chatAnswer);
            return;
        }

        //Сходить - проверить телефонный номер (ИНН уже известен) и в случае успеха - сохранить введенный номер,
        // выслать SMS и продолжить. + нужно сохранить id пользователя, которому выслали SMS

        clientDialogState.data.last4PhoneDigits = messageText;

        clientDialogState.waitInputLast4PhoneDigits = false;
        clientDialogState.waitSmsAnswer = true;

        chatAnswer.addMessage("[Получение баланса]: Введите последние код, направленный вам по SMS");
        callback(chatAnswer);
    }


//для получения баланса - шаг 3. Вводим и проверяем SMS код. При успехе - выдаем баланс
chatActions.balance.checkSmsAnswer = function(clientDialogState, callback, messageText)
    {

        var chatAnswer = new ChatAnswer();

        //проверка Sms-кода
        if(messageText!="1111") {
            chatAnswer.addMessage("[Получение баланса]: Введен неверный SMS код. Попробуйте еще раз (\"меню\" для выхода из диалога)");
            callback(chatAnswer);
            return;
        }

        //Сходить - получить данные
        var answer = "Счет 3435 - сумма 200 000 RUR";

        clientDialogState.currentThread = EnumThreadNames.isNoSubject;
        clientDialogState.waitChooseMenu=true;
        clientDialogState.waitSmsAnswer = false;

        chatAnswer.addMessage("[Получение баланса]: " + answer);
        chatAnswer.addMessage("Чем я еще могу помочь? (Нажмите 1 для Списка карт и 2 для Баланса)");


        callback(chatAnswer);
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


/**
 * Проверка, что введенная строка - 4 цифры
 * @param messageText
 * @returns {boolean}
 */
chatActions.common.checkIsLast4Digits = function(messageText){

    if((messageText.length == 4) && (Number(messageText,10)>=0))
        return true;

    return false;
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