/**
 * Created by U_M0PQL on 02.11.2016.
 *
 * Заглушка для доступа к java-middle
 */
var express = require('express');
var clone = require('clone');

var dataRetreiver = new Object();

dataRetreiver.getBalance = function(representativeToken, callback)
{
    var res={"data":[{"accountLastDigits":"test" + representativeToken,"amount":200050,"enCurrency":"EUR"}]}
    callback(res);
}

dataRetreiver.getCustomerRequestedCardInfo = function(crf, callback)
{


    //var res={"data":[{"cards": 145}]}
    // var res={"data":{"cards": [
    //     {name: "Александр Бут", status: "ready"},
    //     {name: "Андрей Вас", status: "ready"},
    //     {name: "Вячеслва Олв", status: "not ready"}]}}

    var res={data:{customerRequestedCardInfos:
        [
            {firstName:"Сергей",middleName:"Михайлович",enCardStatus:"Ready",officeAddress:"123022,Москва, ул. Пресненский Вал,д.3, стр.1"},
            {firstName:"Паулина",middleName:"Никитьевна",enCardStatus:"Ready",officeAddress:"123022,Москва, ул. Пресненский Вал,д.3, стр.1"},
            {firstName:"Екатерина",middleName:"Миладовна",enCardStatus:"Ready",officeAddress:"123022,Москва, ул. Пресненский Вал,д.3, стр.1"}
        ],message:null,success:false},
        itemsCount:0,success:true,errorMsg:null,errorCode:0};

    console.log("Stub onResult: " + JSON.stringify(res));
    callback(res);
}

module.exports = dataRetreiver;
