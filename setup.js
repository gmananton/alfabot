const fs=require('fs');
const util = require('util');



var logger;

function setup()
{
    setupLogger();

    var foo = {bar: 'foobar'};
    console.log('Hello %s, this is my object: %j', 'World', foo);

    console.log(__dirname);

}

/*Делаем логгер, который будет писать в текстовые файлы на основе console.log() */
function setupLogger() {
    const output = fs.createWriteStream('./stdout.log');
    const errorOutput = fs.createWriteStream('./stderr.log');

    const Console = console.Console;

    var dateFormat = require('date-format'); //или все же выносить модули отдельно

   
    
    logger = new Console(output, errorOutput);
    logger.log = function(d) { 
        output.write(dateFormat(new Date(), "dd.mm.yyyy hh:MM:ss:SSS") + " " + util.format(d) + '\r\n');
    }
}


//module.exports.setup = setup;
exports.setup = setup;

exports.getLogger = function() {
    return logger;
}