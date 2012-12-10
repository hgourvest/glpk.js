/***********************************************************************
 *  This code is part of GLPK (GNU Linear Programming Kit).
 *
 *  Copyright (C) 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
 *  2009, 2010, 2011 Andrew Makhorin, Department for Applied Informatics,
 *  Moscow Aviation Institute, Moscow, Russia. All rights reserved.
 *  E-mail: <mao@gnu.org>.
 *
 *  GLPK is free software: you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  GLPK is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 *  or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
 *  License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with GLPK. If not, see <http://www.gnu.org/licenses/>.
 ***********************************************************************/

const
    GLP_DEBUG = true,
    DBL_MAX = Number.MAX_VALUE,
    INT_MAX = 0x7FFFFFFF,
    DBL_EPSILON = 0.22204460492503131E-15,
    CHAR_BIT = 1;

const
/* CAUTION: DO NOT CHANGE THE LIMITS BELOW */
    M_MAX = 100000000, /* = 100*10^6 */
/* maximal number of rows in the problem object */

    N_MAX = 100000000, /* = 100*10^6 */
/* maximal number of columns in the problem object */

    NNZ_MAX = 500000000; /* = 500*10^6 */
/* maximal number of constraint coefficients in the problem object */

const XEOF = -1;

function xerror(message){
    throw new Error(message);
}

function xassert(test){
    if (!test){
        throw new Error('assert');
    }
}

var xprintf = function(data){
    console.log(data);
};

exports.__defineGetter__("glp_print_func", function(){return xprintf});
exports.__defineSetter__("glp_print_func", function(value){xprintf = value});

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

var glp_version = exports.glp_version = function(){
    return GLP_MAJOR_VERSION + "." + GLP_MINOR_VERSION;
}

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

/* glpapi.h */

var
    GLP_PROB_MAGIC = 0xD7D9D6C2;