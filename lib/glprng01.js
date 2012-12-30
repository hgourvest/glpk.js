
function mod_diff(x, y) {return (x - y) & 0x7FFFFFFF}
/* difference modulo 2^31 */

function flip_cycle(rand){
/* this is an auxiliary routine to do 55 more steps of the basic
 recurrence, at high speed, and to reset fptr */
    var ii, jj;
    for (ii = 1, jj = 32; jj <= 55; ii++, jj++)
        rand.A[ii] = mod_diff(rand.A[ii], rand.A[jj]);
    for (jj = 1; ii <= 55; ii++, jj++)
        rand.A[ii] = mod_diff(rand.A[ii], rand.A[jj]);
    rand.fptr = 54;
    return rand.A[55];
}

function rng_create_rand(){
    var rand = {};
    var i;
    rand.A = new Array(56);
    rand.A[0] = -1;
    for (i = 1; i <= 55; i++) rand.A[i] = 0;
    (rand.fptr) = 0;
    rng_init_rand(rand, 1);
    return rand;
}

function rng_init_rand(rand, seed){
    var i;
    var prev = seed, next = 1;
    seed = prev = mod_diff(prev, 0);
    rand.A[55] = prev;
    for (i = 21; i; i = (i + 21) % 55)
    {  rand.A[i] = next;
        next = mod_diff(prev, next);
        if (seed & 1)
            seed = 0x40000000 + (seed >> 1);
        else
            seed >>= 1;
        next = mod_diff(next, seed);
        prev = rand.A[i];
    }
    flip_cycle(rand);
    flip_cycle(rand);
    flip_cycle(rand);
    flip_cycle(rand);
    flip_cycle(rand);
}

function rng_next_rand(rand){
    return rand.A[rand.fptr] >= 0 ? rand.A[rand.fptr--] : flip_cycle(rand);
}

function rng_unif_rand(rand, m){
    var two_to_the_31 = 0x80000000;
    var t = two_to_the_31 - (two_to_the_31 % m);
    var r;
    xassert(m > 0);
    do { r = rng_next_rand(rand); } while (t <= r);
    return r % m;
}
