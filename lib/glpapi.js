var
    /** @const */GLP_DEBUG = false,
    /** @const */DBL_MAX = Number.MAX_VALUE,
    /** @const */DBL_MIN = Number.MIN_VALUE,
    /** @const */DBL_DIG = 16,
    /** @const */INT_MAX = 0x7FFFFFFF,
    /** @const */DBL_EPSILON = 0.22204460492503131E-15,
    /** @const */CHAR_BIT = 1;

var
/** CAUTION: DO NOT CHANGE THE LIMITS BELOW */
/** @const */  M_MAX = 100000000, /* = 100*10^6 */
/* maximal number of rows in the problem object */

/** @const */    N_MAX = 100000000, /* = 100*10^6 */
/* maximal number of columns in the problem object */

/** @const */    NNZ_MAX = 500000000; /* = 500*10^6 */
/* maximal number of constraint coefficients in the problem object */

/** @const */
var XEOF = -1;

function xerror(message){
    throw new Error(message);
}

var xprintf = function(data){

};

exports["glp_get_print_func"] = function(){return xprintf};
exports["glp_set_print_func"] = function(value){xprintf = value};

function xcopyObj(dest, src){
    for (var prop in src){dest[prop] = src[prop];}
}

function xcopyArr(dest, destFrom, src, srcFrom, count){
    for (; count > 0; destFrom++, srcFrom++, count--){dest[destFrom] = src[srcFrom];}
}

function xfillArr(dest, destFrom, value, count){
    for (; count > 0; destFrom++, count--){dest[destFrom] = value;}
}

function xfillObjArr(dest, destFrom, count){
    for (; count > 0; destFrom++, count--){dest[destFrom] = {}}
}

function xtime(){
    var d = new Date();
    return d.getTime();
}

function xdifftime(to, from){
    return (to - from) / 1000;
}

function xqsort(base, idx, num, compar){
    var tmp = new Array(num);
    xcopyArr(tmp, 0, base, idx, num);
    tmp.sort(compar);
    xcopyArr(base, idx, tmp, 0, num);
}

var
    global_env = {};

function get_env_ptr(){
    return global_env;
}

var glp_version = exports["glp_version"] = function(){
    return GLP_MAJOR_VERSION + "." + GLP_MINOR_VERSION;
};

function isspace(c){
    return (" \t\n\v\f\r".indexOf(c) >= 0)
}

function iscntrl(c){
    var code = (typeof c == 'string')?c.charCodeAt(0):-1;
    return ((code >= 0x00 && code <= 0x1f) || code == 0x7f)
}

function isalpha(c){
    var code = (typeof c == 'string')?c.charCodeAt(0):-1;
    return (code >= 0x41 && code <= 0x5A)|| (code >= 0x61 && code <= 0x7A)
}

function isalnum(c){
    var code = (typeof c == 'string')?c.charCodeAt(0):-1;
    return (code >= 0x41 && code <= 0x5A)|| (code >= 0x61 && code <= 0x7A) || (code >= 0x30 && code <= 0x39)
}

function isdigit(c){
    var code = (typeof c == 'string')?c.charCodeAt(0):-1;
    return (code >= 0x30 && code <= 0x39)
}

function strchr(str, c){
    return str.indexOf(c)
}

function tolower(c){
    return c.toLowerCase();
}


function sprintf () {
    // http://kevin.vanzonneveld.net
    // +   original by: Ash Searle (http://hexmen.com/blog/)
    // + namespaced by: Michael White (http://getsprink.com)
    // +    tweaked by: Jack
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Paulo Freitas
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Dj
    // +   improved by: Allidylls
    // *     example 1: sprintf("%01.2f", 123.1);
    // *     returns 1: 123.10
    // *     example 2: sprintf("[%10s]", 'monkey');
    // *     returns 2: '[    monkey]'
    // *     example 3: sprintf("[%'#10s]", 'monkey');
    // *     returns 3: '[####monkey]'
    // *     example 4: sprintf("%d", 123456789012345);
    // *     returns 4: '123456789012345'
    var regex = /%%|%(\d+\$)?([-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;
    var a = arguments,
        i = 0,
        format = a[i++];

    // pad()
    var pad = function (str, len, chr, leftJustify) {
        if (!chr) {
            chr = ' ';
        }
        var padding = (str.length >= len) ? '' : Array(1 + len - str.length >>> 0).join(chr);
        return leftJustify ? str + padding : padding + str;
    };

    // justify()
    var justify = function (value, prefix, leftJustify, minWidth, zeroPad, customPadChar) {
        var diff = minWidth - value.length;
        if (diff > 0) {
            if (leftJustify || !zeroPad) {
                value = pad(value, minWidth, customPadChar, leftJustify);
            } else {
                value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
            }
        }
        return value;
    };

    // formatBaseX()
    var formatBaseX = function (value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
        // Note: casts negative numbers to positive ones
        var number = value >>> 0;
        prefix = prefix && number && {
            '2': '0b',
            '8': '0',
            '16': '0x'
        }[base] || '';
        value = prefix + pad(number.toString(base), precision || 0, '0', false);
        return justify(value, prefix, leftJustify, minWidth, zeroPad);
    };

    // formatString()
    var formatString = function (value, leftJustify, minWidth, precision, zeroPad, customPadChar) {
        if (precision != null) {
            value = value.slice(0, precision);
        }
        return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar);
    };

    // doFormat()
    var doFormat = function (substring, valueIndex, flags, minWidth, _, precision, type) {
        var number;
        var prefix;
        var method;
        var textTransform;
        var value;

        if (substring == '%%') {
            return '%';
        }

        // parse flags
        var leftJustify = false,
            positivePrefix = '',
            zeroPad = false,
            prefixBaseX = false,
            customPadChar = ' ';
        var flagsl = flags.length;
        for (var j = 0; flags && j < flagsl; j++) {
            switch (flags.charAt(j)) {
                case ' ':
                    positivePrefix = ' ';
                    break;
                case '+':
                    positivePrefix = '+';
                    break;
                case '-':
                    leftJustify = true;
                    break;
                case "'":
                    customPadChar = flags.charAt(j + 1);
                    break;
                case '0':
                    zeroPad = true;
                    break;
                case '#':
                    prefixBaseX = true;
                    break;
            }
        }

        // parameters may be null, undefined, empty-string or real valued
        // we want to ignore null, undefined and empty-string values
        if (!minWidth) {
            minWidth = 0;
        } else if (minWidth == '*') {
            minWidth = +a[i++];
        } else if (minWidth.charAt(0) == '*') {
            minWidth = +a[minWidth.slice(1, -1)];
        } else {
            minWidth = +minWidth;
        }

        // Note: undocumented perl feature:
        if (minWidth < 0) {
            minWidth = -minWidth;
            leftJustify = true;
        }

        if (!isFinite(minWidth)) {
            throw new Error('sprintf: (minimum-)width must be finite');
        }

        if (!precision) {
            precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type == 'd') ? 0 : undefined;
        } else if (precision == '*') {
            precision = +a[i++];
        } else if (precision.charAt(0) == '*') {
            precision = +a[precision.slice(1, -1)];
        } else {
            precision = +precision;
        }

        // grab value using valueIndex if required?
        value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];

        switch (type) {
            case 's':
                return formatString(String(value), leftJustify, minWidth, precision, zeroPad, customPadChar);
            case 'c':
                return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
            case 'b':
                return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'o':
                return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'x':
                return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'X':
                return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad).toUpperCase();
            case 'u':
                return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'i':
            case 'd':
                number = +value || 0;
                number = Math.round(number - number % 1); // Plain Math.round doesn't just truncate
                prefix = number < 0 ? '-' : positivePrefix;
                value = prefix + pad(String(Math.abs(number)), precision, '0', false);
                return justify(value, prefix, leftJustify, minWidth, zeroPad);
            case 'e':
            case 'E':
            case 'f': // Should handle locales (as per setlocale)
            case 'F':
            case 'g':
            case 'G':
                number = +value;
                prefix = number < 0 ? '-' : positivePrefix;
                method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
                textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];
                value = prefix + Math.abs(number)[method](precision);
                return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
            default:
                return substring;
        }
    };

    return format.replace(regex, doFormat);
}


/* glpapi.h */

var
    /** @const */ GLP_PROB_MAGIC = 0xD7D9D6C2;

