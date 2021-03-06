/**
 * Alfa-Bank 2016
 */

/* jshint node: true, devel: true */
'use strict';

const
    bodyParser = require('body-parser'),
    config     = require('config'),
    crypto     = require('crypto'),
    express    = require('express'),
    fs         = require('fs'),
    http         = require('http'),
    https         = require('https'),
    request    = require('request');



const facebookSend = require('./facebook/facebookSend');
const facebookReceive = require('./facebook/facebookReceive');


var miscRouter = require('./miscRouter');
var debugRouter = require('./debugRouter');
var facebookRouter = require('./facebookRouter');




var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({verify: verifyRequestSignature}));
app.use(express.static(__dirname +  '/public')); //папка со статическим содержимым

//region Config Check

/** Настройка приложения из файла конфигурации в /config */

/**
 App Secret можно получить в Дашборде приложения. Используется для верификации каждого запроса:
 на стороне Facebook App генерируется хеш SHA1, пересылается с запросом и сверяется со сгенеренным
 значением здесь, на стороне сервера
 */
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
    process.env.MESSENGER_APP_SECRET :
    config.get('appSecret');

/**
 Validation Token генерируется в дашборде приложения при подписке данного приложения на события указанной страницы.
 Используется для верификации: приложение должно сделать GET-запрос серверу на адрес /webhook, а сервер при
 совпадении этого кода  должен вернуть hub.challenge, который был в запросе, обратно
 */
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
    (process.env.MESSENGER_VALIDATION_TOKEN) :
    config.get('validationToken');

/**
 Page Access Token генерируется в дашборде приложения (Facebook App). Он привязывает данное приложение
 к событиям конкретной страницы и используется для валидации вызовов webhook-ов,
 ответственных за обработку событий данной страницы
 */
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

/** URL-адрес нашего сервера. Должен быть доступен извне, обязательно по https и быть виден для facebook */
const SERVER_URL = (process.env.SERVER_URL) ?
    (process.env.SERVER_URL) :
    config.get('serverURL');

const PORT_HTTPS = (process.env.PORT_HTTPS) ?
    (process.env.PORT_HTTPS) :
    config.get('port_https');



if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
    console.error("Missing config values");
    process.exit(1);
}


//endregion


/**
 * Проверка подписи запроса, чтобы убедиться, что он пришел от Facebook
 * На стороне приложения в дашборде генерируется App Secret, - он же хранится в конфиге на стороне сервера
 * На стороне приложения из AppSecret делается SHA1-хеш и присылается в хедере x-hub-signature
 * Затем здась, на стороне сервера делается также генерация хеша и происходит верификация
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];


    if (!signature) {
        // Логирование ошибки для тестирования. На production надо кидать ошибку
        console.error("Couldn't validate the signature.");
    } else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];

        var expectedHash = crypto.createHmac('sha1', APP_SECRET)
            .update(buf)
            .digest('hex');

        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}

//ssl certificate
var privateKey = fs.readFileSync('./ssl_cert/test.bot.ru.key').toString();
var certificate = fs.readFileSync('./ssl_cert/test.bot.ru.cert').toString();

//можно открыть Http и https вместе
http.createServer(app).listen(app.get('port'), function () {
         console.log('Node app is running on port', app.get('port'));
     });

if(PORT_HTTPS) {
    https.createServer({
        key: privateKey,
        cert: certificate
    }, app).listen(PORT_HTTPS, function () {
        console.log('Node app is running on HTTPS port', PORT_HTTPS);
    });
}
else
    console.log("PORT_HTTPS is undefined")

//вариант для деплоя на heroku
 // app.listen(app.get('port'), function () {
 //     console.log('Node app is running on port', app.get('port'));
 // });



app.use('/misc', miscRouter);
app.use('/debug', debugRouter);
app.use('/', facebookRouter);








