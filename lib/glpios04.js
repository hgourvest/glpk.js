function ios_create_vec(n){
    var v;
    xassert(n >= 0);
    v = {};
    v.n = n;
    v.nnz = 0;
    v.pos = new Int32Array(1+n);
    xfillArr(v.pos, 1, 0, n);
    v.ind = new Int32Array(1+n);
    v.val = new Float64Array(1+n);
    return v;
}

function ios_check_vec(v){
    var j, k, nnz;
    xassert(v.n >= 0);
    nnz = 0;
    for (j = v.n; j >= 1; j--)
    {  k = v.pos[j];
        xassert(0 <= k && k <= v.nnz);
        if (k != 0)
        {  xassert(v.ind[k] == j);
            nnz++;
        }
    }
    xassert(v.nnz == nnz);
}

function ios_get_vj(v, j){
    var k;
    xassert(1 <= j && j <= v.n);
    k = v.pos[j];
    xassert(0 <= k && k <= v.nnz);
    return (k == 0 ? 0.0 : v.val[k]);
}

function ios_set_vj(v, j, val){
    xassert(1 <= j && j <= v.n);
    var k = v.pos[j];
    if (val == 0.0)
    {  if (k != 0)
    {  /* remove j-th component */
        v.pos[j] = 0;
        if (k < v.nnz)
        {  v.pos[v.ind[v.nnz]] = k;
            v.ind[k] = v.ind[v.nnz];
            v.val[k] = v.val[v.nnz];
        }
        v.nnz--;
    }
    }
    else
    {  if (k == 0)
    {  /* create j-th component */
        k = ++(v.nnz);
        v.pos[j] = k;
        v.ind[k] = j;
    }
        v.val[k] = val;
    }
}

function ios_clear_vec(v){
    for (var k = 1; k <= v.nnz; k++)
        v.pos[v.ind[k]] = 0;
    v.nnz = 0;
}

function ios_clean_vec(v, eps){
    var nnz = 0;
    for (var k = 1; k <= v.nnz; k++)
    {  if (Math.abs(v.val[k]) == 0.0 || Math.abs(v.val[k]) < eps)
    {  /* remove component */
        v.pos[v.ind[k]] = 0;
    }
    else
    {  /* keep component */
        nnz++;
        v.pos[v.ind[k]] = nnz;
        v.ind[nnz] = v.ind[k];
        v.val[nnz] = v.val[k];
    }
    }
    v.nnz = nnz;
}

function ios_copy_vec(x, y){
    xassert(x != y);
    xassert(x.n == y.n);
    ios_clear_vec(x);
    x.nnz = y.nnz;
    xcopyArr(x.ind, 1, y.ind, 1, x.nnz);
    xcopyArr(x.val, 1, y.val, 1, x.nnz);
    for (var j = 1; j <= x.nnz; j++)
        x.pos[x.ind[j]] = j;
}

function ios_linear_comb(x, a, y){
    var j, xj, yj;
    xassert(x != y);
    xassert(x.n == y.n);
    for (var k = 1; k <= y.nnz; k++)
    {   j = y.ind[k];
        xj = ios_get_vj(x, j);
        yj = y.val[k];
        ios_set_vj(x, j, xj + a * yj);
    }
}

