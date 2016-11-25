/**
 * Created by U_M0PQL on 02.11.2016.
 *
 * Доступ к java-middle
 */

var config = require('config');
var express = require('express');
var clone = require('clone');
var rest = require('./getJSON');

const JAVA_SERVICE_BASE_REQUEST = {
    host: config.get('javaServiceUrl'),
    port: config.get('javaServicePort') ,
    path: '/open/api/eq/',
    method: 'GET'
};

var dataRetreiver = new Object();

dataRetreiver.getBalance = function(representativeToken, callback)
{
    var options = clone(JAVA_SERVICE_BASE_REQUEST);
    options.path+="getBalance?representativeToken=" + representativeToken;
    
    rest.getJSON(options,
        function(statusCode, result)
        {
            // I could work with the result html/json here.  I could also just return it
            console.log("Java onResult: (" + statusCode + ")" + JSON.stringify(result));
            //res.statusCode = statusCode;
            
            callback(result);
        });
}

/**
 * Получение списка заказанных карт (готовы/не готовы)
 *
 * @param sCrr - ИНН юр лица
 * @return
 */
dataRetreiver.getCustomerRequestedCardInfo = function(crf, callback)
{
    var options = clone(JAVA_SERVICE_BASE_REQUEST);
    options.path+="getCustomerRequestedCardInfo?crf=" + crf;

    //Стандартную callback функцию вытащить отдельдно

    // rest.getJSON(options,
    //     function(statusCode, result)
    //     {
    //         console.log("Java onResult: (" + statusCode + ")" + JSON.stringify(result));
    //         callback(result);
    //     });

    getJSONFromJavaMiddle(options,
        function(statusCode, result)
        {
            console.log("Java onResult: (" + statusCode + ")" + JSON.stringify(result));
            callback(result);
        });
}


getJSONFromJavaMiddle = function(options, callback)
{
    //каждый раз в headers добавляем наш токен
    options.headers = { Authorization: config.get("javaServiceToken") }
;

    rest.getJSON(options, callback);
}

module.exports = dataRetreiver;



