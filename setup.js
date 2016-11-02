const fs=require('fs');
const util = require('util');


var logger;

function setup()
{
    setupLogger();

}

/*Делаем логгер, который будет писать в текстовые файлы на основе console.log() */
function setupLogger() {
    const output = fs.createWriteStream('./stdout.log');
    const errorOutput = fs.createWriteStream('./stderr.log');

    const Console = console.Console;

    logger = new Console(output, errorOutput);
    logger.log = function(d) { 
        output.write(getDateTimeString() + " " + util.format(d) + '\r\n');
    }
}


/*как жаль, что нет нормальной всторенной функциональности dateTime.ToString("dd.MM.yyyy")*/
function getDateTimeString() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var millisec  = date.getMilliseconds();
    millisec = (millisec < 10 ? "0" : "") + millisec;
    millisec = (millisec < 100 ? "0" : "") + millisec;



    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + " " + hour + ":" + min + ":" + sec + ":" + millisec;

}



module.exports.setup = setup;

exports.getLogger = function() {
    return logger;
}