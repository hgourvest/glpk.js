function rng_unif_01(rand){
    var x = rng_next_rand(rand) / 2147483647.0;
    xassert(0.0 <= x && x <= 1.0);
    return x;
}

function rng_uniform(rand, a, b){
    if (a >= b)
        xerror("rng_uniform: a = " + a + ", b = " + b + "; invalid range");
    var x = rng_unif_01(rand);
    x = a * (1.0 - x) + b * x;
    xassert(a <= x && x <= b);
    return x;
}
