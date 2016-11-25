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
    //var options = clone(JAVA_SERVICE_BASE_REQUEST);
    //options.path+="getCustomerRequestedCardInfo?crf=" + crf;

    //Стандартную callback функцию вытащить отдельдно

    // rest.getJSON(options,
    //     function(statusCode, result)
    //     {
    //         console.log("Java onResult: (" + statusCode + ")" + JSON.stringify(result));
    //         callback(result);
    //     });

    var res={"data":[{"cards": 145}]}
    console.log("Stub onResult: " + JSON.stringify(res));
    callback(res);
}

module.exports = dataRetreiver;
