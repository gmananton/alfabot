/**
 * Created by U_M0PQL on 02.11.2016.
 *
 * Заглушка для доступа к java-middle
 */
var express = require('express');
var clone = require('clone');

var dataRetreiver = new Object();

dataRetreiver.getBalance = function(crf, cus, callback)
{
    var res={data:
    {accountsList:
        [
            {accountNumber:"40702840702410000002",amount:0,enCurrency:"USD"}
        ]
        ,message:null,success:false},itemsCount:0,success:true,errorMsg:null,errorCode:0}
    callback(res);
}

dataRetreiver.getCustomerRequestedCardInfo = function(crf, callback)
{



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


dataRetreiver.getPayDocStatus = function(crf, docId, callback)
{

    var res={data:{payDocInfo:
        {
            docid:"Z562D00000000326 (STUB)",crf:7654545455,enPayDocStatus:"InProgress (STUB)"
        },
        message:null,success:false},itemsCount:0,success:true,errorMsg:null,errorCode:0}

    console.log("Stub onResult: " + JSON.stringify(res));
    callback(res);
}

module.exports = dataRetreiver;
