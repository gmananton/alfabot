/**
 * Created by U_M0UW8 on 15.11.2016.
 */

//все возможные виды сообщений ботов перечислены здесь (для удобства в соответствии с ветками диалогов)
EnumMessageCodes = {

    isNoSubject: 0,

    main_whatCanIHelp : "main_whatCanIHelp",
    main_iCantUnderstand : "main_iCantUnderstand",

    
   
    cardList_ProvideInn : "cardList_ProvideInn",
    cardList_IncorrectInn : "cardList_IncorrectInn",
    cardList_Result : "cardList_Result",
    
    balance_ProvideInn : 5,
    balance_IncorrectInn: 6,
    balance_ProvideLast4Digits: 7,
    balance_IncorrectLast4Digits: 8,
    balance_ProvideSmsCode: 9,
    balance_IncorrectSmsCode: 10,
    balance_Result: 11
    
    
    
}

module.exports =  EnumMessageCodes;



