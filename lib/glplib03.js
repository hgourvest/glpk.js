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
