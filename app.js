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
    https      = require('https'),
    request    = require('request');

//const fs=require('fs');

const facebookSend = require('./facebook/facebookSend');
const facebookReceive = require('./facebook/facebookReceive');

const utils = require('./utils');

//const setup=require('setup');
var browserify = require('browserify');
var React = require('react');
var jsx = require('node-jsx');





var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({verify: verifyRequestSignature}));
app.use(express.static(__dirname +  '/public')); //папка со статическим содержимым

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



if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
    console.error("Missing config values");
    process.exit(1);
}


app.get('/webhook_debug', function (req, res) {

    console.log("--webhook_debug call--")

    var data = req.query.data;
    console.log("qs: " + JSON.stringify(req.query));
    console.log("qs JSON: " + JSON.stringify(JSON.parse(req.query.data)));



    processWebhook(data, res);

});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function (req, res) {
    var accountLinkingToken = req.query.account_linking_token;
    var redirectURI = req.query.redirect_uri;

    // Authorization Code should be generated per user by the developer. This will
    // be passed to the Account Linking callback.
    var authCode = "1234567890";

    // Redirect users to this URI on successful login
    var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

    res.render('authorize', {
        accountLinkingToken: accountLinkingToken,
        redirectURI: redirectURI,
        redirectURISuccess: redirectURISuccess
    });
});

jsx.install();
var Books = require('./views/index.jsx');

//This way the first load has a fully rendered static view and the user doesn't have to wait for the client to render it
app.use('/aa', function(req, res) {
    var books = [{
        title: 'Professional Node.js',
        read: false
    }, {
        title: 'Node.js Patterns',
        read: false
    }];

    res.setHeader('Content-Type', 'text/html');
    res.end(React.renderToStaticMarkup(
        React.DOM.body(
            null,
            React.DOM.div({
                id: 'app',
                dangerouslySetInnerHTML: {
                    __html: React.renderToString(React.createElement(TodoBox, {
                        data: data
                    }))
                }
            }),
            React.DOM.script({
                'id': 'initial-data',
                'type': 'text/plain',
                'data-json': JSON.stringify(data)
            }),
            React.DOM.script({
                src: '/bundle.js'
            })
        )
    ));
});
app.use('/bundle.js', function(req, res) {
    res.setHeader('content-type', 'application/javascript');
    browserify('./app.js', {
        debug: true
    })
        .transform('reactify')
        .bundle()
        .pipe(res);
});

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



// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function () {

    //Первичные насторйки - логгер, бд, WS_Client, еще что-нибудь
    setup();

    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;
//
function setup()
{



}

////////////////ТЕСТ



app.get('/test', function (req, res) {

    console.log("testlog1");
    res.status(200).send("test ok!!");

});







//////////////

var debugRouter = require('./debugRouter');
var facebookRouter = require('./facebookRouter');

app.use('/debug', debugRouter);
app.use('/', facebookRouter);







