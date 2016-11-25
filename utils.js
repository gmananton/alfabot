/**
 * Created by U_M0UW8 on 15.11.2016.
 */

const dateFormat = require('date-format');

const utils = new Object();

utils.getFormattedDate = function(date)
{
    return dateFormat("dd.mm.yyyy hh:MM:ss", date);
}

module.exports = utils;
