/**
 * Created by U_M0UW8 on 15.11.2016.
 */

const dateFormat = require('date-format');

const utils = new Object();

utils.getFormattedDate = function(date)
{
    return dateFormat("dd.mm.yyyy hh:MM:ss", date);
}

utils.getHashCode = function(val) {
    var hash = 0, i, chr, len;
    if (val.length === 0) return hash;
    for (i = 0, len = val.length; i < len; i++) {
        chr   = val.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }

    if(hash<0)
        hash*=-1;
    
    return hash.toString();
};


module.exports = utils;
