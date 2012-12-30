var
    SCF_TBG     = 1,  /* Bartels-Golub elimination */
    SCF_TGR     = 2;  /* Givens plane rotation */

/* return codes: */
var
    SCF_ESING    = 1,  /* singular matrix */
    SCF_ELIMIT   = 2;  /* update limit reached */

var _GLPSCF_DEBUG = 0;

var SCF_EPS = 1e-10;

function scf_create_it(n_max){
    if (_GLPSCF_DEBUG){
        xprintf("scf_create_it: warning: debug mode enabled");
    }
    if (!(1 <= n_max && n_max <= 32767))
        xerror("scf_create_it: n_max = " + n_max + "; invalid parameter");
    var scf = {};
    scf.n_max = n_max;
    scf.n = 0;
    scf.f = new Array(1 + n_max * n_max);
    scf.u = new Array(1 + n_max * (n_max + 1) / 2);
    scf.p = new Array(1 + n_max);
    scf.t_opt = SCF_TBG;
    scf.rank = 0;
    if (_GLPSCF_DEBUG)
        scf.c = new Array(1 + n_max * n_max);
    else
        scf.c = null;
    scf.w = new Array(1 + n_max);
    return scf;
}

function f_loc(scf, i, j){
    var n_max = scf.n_max;
    var n = scf.n;
    xassert(1 <= i && i <= n);
    xassert(1 <= j && j <= n);
    return (i - 1) * n_max + j;
}

function u_loc(scf, i, j){
    var n_max = scf.n_max;
    var n = scf.n;
    xassert(1 <= i && i <= n);
    xassert(i <= j && j <= n);
    return (i - 1) * n_max + j - i * (i - 1) / 2;
}

function bg_transform(scf, k, un){
    var n = scf.n;
    var f = scf.f;
    var u = scf.u;
    var j, k1, kj, kk, n1, nj;
    var t;
    xassert(1 <= k && k <= n);
    /* main elimination loop */
    for (; k < n; k++)
    {  /* determine location of U[k,k] */
        kk = u_loc(scf, k, k);
        /* determine location of F[k,1] */
        k1 = f_loc(scf, k, 1);
        /* determine location of F[n,1] */
        n1 = f_loc(scf, n, 1);
        /* if |U[k,k]| < |U[n,k]|, interchange k-th and n-th rows to
         provide |U[k,k]| >= |U[n,k]| */
        if (Math.abs(u[kk]) < Math.abs(un[k]))
        {  /* interchange k-th and n-th rows of matrix U */
            for (j = k, kj = kk; j <= n; j++, kj++){
                t = u[kj]; u[kj] = un[j]; un[j] = t;
            }
            /* interchange k-th and n-th rows of matrix F to keep the
             main equality F * C = U * P */
            for (j = 1, kj = k1, nj = n1; j <= n; j++, kj++, nj++){
                t = f[kj]; f[kj] = f[nj]; f[nj] = t;
            }
        }
        /* now |U[k,k]| >= |U[n,k]| */
        /* if U[k,k] is too small in the magnitude, replace U[k,k] and
         U[n,k] by exact zero */
        if (Math.abs(u[kk]) < SCF_EPS) u[kk] = un[k] = 0.0;
        /* if U[n,k] is already zero, elimination is not needed */
        if (un[k] == 0.0) continue;
        /* compute gaussian multiplier t = U[n,k] / U[k,k] */
        t = un[k] / u[kk];
        /* apply gaussian elimination to nullify U[n,k] */
        /* (n-th row of U) := (n-th row of U) - t * (k-th row of U) */
        for (j = k+1, kj = kk+1; j <= n; j++, kj++)
            un[j] -= t * u[kj];
        /* (n-th row of F) := (n-th row of F) - t * (k-th row of F)
         to keep the main equality F * C = U * P */
        for (j = 1, kj = k1, nj = n1; j <= n; j++, kj++, nj++)
            f[nj] -= t * f[kj];
    }
    /* if U[n,n] is too small in the magnitude, replace it by exact
     zero */
    if (Math.abs(un[n]) < SCF_EPS) un[n] = 0.0;
    /* store U[n,n] in a proper location */
    u[u_loc(scf, n, n)] = un[n];
}

function givens(a, b, callback){
    var t, c, s;
    if (b == 0.0){
        c = 1.0; s = 0.0;
    }
    else if (Math.abs(a) <= Math.abs(b)){
        t = - a / b; s = 1.0 / Math.sqrt(1.0 + t * t); c = s * t;
    }
    else{
        t = - b / a; c = 1.0 / Math.sqrt(1.0 + t * t); s = c * t;
    }
    callback(c, s);
}

function gr_transform(scf, k, un){
    var n = scf.n;
    var f = scf.f;
    var u = scf.u;
    var j, k1, kj, kk, n1, nj;
    xassert(1 <= k && k <= n);
    /* main elimination loop */
    for (; k < n; k++)
    {  /* determine location of U[k,k] */
        kk = u_loc(scf, k, k);
        /* determine location of F[k,1] */
        k1 = f_loc(scf, k, 1);
        /* determine location of F[n,1] */
        n1 = f_loc(scf, n, 1);
        /* if both U[k,k] and U[n,k] are too small in the magnitude,
         replace them by exact zero */
        if (Math.abs(u[kk]) < SCF_EPS && Math.abs(un[k]) < SCF_EPS)
            u[kk] = un[k] = 0.0;
        /* if U[n,k] is already zero, elimination is not needed */
        if (un[k] == 0.0) continue;
        /* compute the parameters of Givens plane rotation */
        givens(u[kk], un[k],
            function(c, s){
                /* apply Givens rotation to k-th and n-th rows of matrix U */
                for (j = k, kj = kk; j <= n; j++, kj++)
                {  var ukj = u[kj], unj = un[j];
                    u[kj] = c * ukj - s * unj;
                    un[j] = s * ukj + c * unj;
                }
                /* apply Givens rotation to k-th and n-th rows of matrix F
                 to keep the main equality F * C = U * P */
                for (j = 1, kj = k1, nj = n1; j <= n; j++, kj++, nj++)
                {  var fkj = f[kj], fnj = f[nj];
                    f[kj] = c * fkj - s * fnj;
                    f[nj] = s * fkj + c * fnj;
                }
            }
        );
    }
    /* if U[n,n] is too small in the magnitude, replace it by exact
     zero */
    if (Math.abs(un[n]) < SCF_EPS) un[n] = 0.0;
    /* store U[n,n] in a proper location */
    u[u_loc(scf, n, n)] = un[n];
}

function transform(scf, k, un){
    switch (scf.t_opt){
        case SCF_TBG:
            bg_transform(scf, k, un);
            break;
        case SCF_TGR:
            gr_transform(scf, k, un);
            break;
        default:
            xassert(scf != scf);
    }
}

function estimate_rank(scf){
    var n_max = scf.n_max;
    var n = scf.n;
    var u = scf.u;
    var i, ii, inc, rank = 0;
    for (i = 1, ii = u_loc(scf, i, i), inc = n_max; i <= n; i++, ii += inc, inc--)
        if (u[ii] != 0.0) rank++;
    return rank;
}

if (_GLPSCF_DEBUG){

    function check_error(scf, func){
        var n = scf.n;
        var f = scf.f;
        var u = scf.u;
        var p = scf.p;
        var c = scf.c;
        var i, j, k;
        var d, dmax = 0.0, s, t;
        xassert(c != null);
        for (i = 1; i <= n; i++)
        {  for (j = 1; j <= n; j++)
        {  /* compute element (i,j) of product F * C */
            s = 0.0;
            for (k = 1; k <= n; k++)
                s += f[f_loc(scf, i, k)] * c[f_loc(scf, k, j)];
            /* compute element (i,j) of product U * P */
            k = p[j];
            t = (i <= k ? u[u_loc(scf, i, k)] : 0.0);
            /* compute the maximal relative error */
            d = Math.abs(s - t) / (1.0 + Math.abs(t));
            if (dmax < d) dmax = d;
        }
        }
        if (dmax > 1e-8)
            xprintf(func + ": dmax = " + dmax + "; relative error too large");
    }
}

function scf_update_exp(scf, x, idx, y, idy, z){
    var n_max = scf.n_max;
    var n = scf.n;
    var f = scf.f;
    var u = scf.u;
    var p = scf.p;
    if (_GLPSCF_DEBUG){var c = scf.c}
    var un = scf.w;
    var i, ij, in_, j, k, nj, ret = 0;
    var t;
    /* check if the factorization can be expanded */
    if (n == n_max)
    {  /* there is not enough room */
        ret = SCF_ELIMIT;
        return ret;
    }
    /* increase the order of the factorization */
    scf.n = ++n;
    /* fill new zero column of matrix F */
    for (i = 1, in_ = f_loc(scf, i, n); i < n; i++, in_ += n_max)
    f[in_] = 0.0;
    /* fill new zero row of matrix F */
    for (j = 1, nj = f_loc(scf, n, j); j < n; j++, nj++)
        f[nj] = 0.0;
    /* fill new unity diagonal element of matrix F */
    f[f_loc(scf, n, n)] = 1.0;
    /* compute new column of matrix U, which is (old F) * x */
    for (i = 1; i < n; i++)
    {  /* u[i,n] := (i-th row of old F) * x */
        t = 0.0;
        for (j = 1, ij = f_loc(scf, i, 1); j < n; j++, ij++)
            t += f[ij] * x[j+idx];
        u[u_loc(scf, i, n)] = t;
    }
    /* compute new (spiked) row of matrix U, which is (old P) * y */
    for (j = 1; j < n; j++) un[j] = y[p[j]+idy];
    /* store new diagonal element of matrix U, which is z */
    un[n] = z;
    /* expand matrix P */
    p[n] = n;
    if (_GLPSCF_DEBUG){
        /* expand matrix C */
        /* fill its new column, which is x */
        for (i = 1, in_ = f_loc(scf, i, n); i < n; i++, in_ += n_max)
            c[in_] = x[i+idx];
        /* fill its new row, which is y */
        for (j = 1, nj = f_loc(scf, n, j); j < n; j++, nj++)
            c[nj] = y[j+idy];
        /* fill its new diagonal element, which is z */
        c[f_loc(scf, n, n)] = z;
    }
    /* restore upper triangular structure of matrix U */
    for (k = 1; k < n; k++)
        if (un[k] != 0.0) break;
    transform(scf, k, un);
    /* estimate the rank of matrices C and U */
    scf.rank = estimate_rank(scf);
    if (scf.rank != n) ret = SCF_ESING;
    if (_GLPSCF_DEBUG){
        /* check that the factorization is accurate enough */
        check_error(scf, "scf_update_exp");
    }
    return ret;
}

function solve(scf, x, idx){
    var n = scf.n;
    var f = scf.f;
    var u = scf.u;
    var p = scf.p;
    var y = scf.w;
    var i, j, ij;
    var t;
    /* y := F * b */
    for (i = 1; i <= n; i++)
    {  /* y[i] = (i-th row of F) * b */
        t = 0.0;
        for (j = 1, ij = f_loc(scf, i, 1); j <= n; j++, ij++)
            t += f[ij] * x[j+idx];
        y[i] = t;
    }
    /* y := inv(U) * y */
    for (i = n; i >= 1; i--)
    {  t = y[i];
        for (j = n, ij = u_loc(scf, i, n); j > i; j--, ij--)
            t -= u[ij] * y[j];
        y[i] = t / u[ij];
    }
    /* x := P' * y */
    for (i = 1; i <= n; i++) x[p[i]+idx] = y[i];
}

function tsolve(scf, x, idx){
    var n = scf.n;
    var f = scf.f;
    var u = scf.u;
    var p = scf.p;
    var y = scf.w;
    var i, j, ij;
    var t;
    /* y := P * b */
    for (i = 1; i <= n; i++) y[i] = x[p[i]+idx];
    /* y := inv(U') * y */
    for (i = 1; i <= n; i++)
    {  /* compute y[i] */
        ij = u_loc(scf, i, i);
        t = (y[i] /= u[ij]);
        /* substitute y[i] in other equations */
        for (j = i+1, ij++; j <= n; j++, ij++)
            y[j] -= u[ij] * t;
    }
    /* x := F' * y (computed as linear combination of rows of F) */
    for (j = 1; j <= n; j++) x[j+idx] = 0.0;
    for (i = 1; i <= n; i++)
    {  t = y[i]; /* coefficient of linear combination */
        for (j = 1, ij = f_loc(scf, i, 1); j <= n; j++, ij++)
            x[j+idx] += f[ij] * t;
    }
}

function scf_solve_it(scf, tr, x, idx){
    if (scf.rank < scf.n)
        xerror("scf_solve_it: singular matrix");
    if (!tr)
        solve(scf, x, idx);
    else
        tsolve(scf, x, idx);
}

function scf_reset_it(scf){
    /* reset factorization for empty matrix C */
    scf.n = scf.rank = 0;
}

