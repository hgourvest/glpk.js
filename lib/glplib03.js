function gcd(x, y){
    var r;
    xassert(x > 0 && y > 0);
    while (y > 0){
        r = x % y;
        x = y;
        y = r;
    }
    return x;
}

function gcdn(n, x){
    var d = 0, j;
    xassert(n > 0);
    for (j = 1; j <= n; j++)
    {  xassert(x[j] > 0);
        if (j == 1)
            d = x[1];
        else
            d = gcd(d, x[j]);
        if (d == 1) break;
    }
    return d;
}

function round2n(x){
    xassert(x > 0.0);
    var e = Math.floor(Math.log(x) / Math.log(2)) + 1;
    var f = x / Math.pow(2, e);
    return Math.pow(2, f <= 0.75 ? e-1 : e);
}

/*  0 - no error;
 *  1 - value out of range;
 *  2 - character string is syntactically incorrect.
 */
function str2num(str, callback){
    var ret = Number(str);
    if (Number.isNaN(ret)) return 2;
    switch (ret){
        case Number.POSITIVE_INFINITY:
        case Number.NEGATIVE_INFINITY:
            return 1;
        default:
            callback(ret);
            return 0;
    }
}

function str2int(str, callback){
    var ret = Number(str);
    if (Number.isNaN(ret)) return 2;
    switch (ret){
        case Number.POSITIVE_INFINITY:
        case Number.NEGATIVE_INFINITY:
            return 1;
        default:
            if (ret % 1 == 0){
                callback(ret);
                return 0;
            } else {
                return 2
            }
    }
}

function jday(d, m, y){
    var c, ya, j, dd;
    if (!(1 <= d && d <= 31 && 1 <= m && m <= 12 && 1 <= y && y <= 4000))
        return -1;
    if (m >= 3)m -= 3;else{m += 9;y--;}
    c = (y / 100)|0;
    ya = y - 100 * c;
    j = ((146097 * c) / 4)|0;
    j += ((1461 * ya) / 4)|0;
    j += ((153 * m + 2) / 5)|0;
    j += d + 1721119;
    jdate(j, function(d){dd = d});
    if (d != dd) j = -1;
    return j;
}

function jdate(j, callback)
{
    var d, m, y, ret = 0;
    if (!(1721426 <= j && j <= 3182395))
      return 1;
    j -= 1721119;
    y = ((4 * j - 1) / 146097)|0;
    j = (4 * j - 1) % 146097;
    d = (j / 4)|0;
    j = ((4 * d + 3) / 1461)|0;
    d = (4 * d + 3) % 1461;
    d = ((d + 4) / 4)|0;
    m = ((5 * d - 3) / 153)|0;
    d = (5 * d - 3) % 153;
    d = ((d + 5) / 5)|0;
    y = 100 * y + j;
    if (m <= 9)
        m += 3;
    else{
        m -= 9; y++;
    }
    callback(d, m, y);
    return ret;
}
