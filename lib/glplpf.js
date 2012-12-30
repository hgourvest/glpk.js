/* return codes: */
var
    LPF_ESING    = 1;  /* singular matrix */
    LPF_ECOND    = 2;  /* ill-conditioned matrix */
    LPF_ELIMIT   = 3;  /* update limit reached */


var _GLPLPF_DEBUG = 0;

function lpf_create_it(){
    var lpf;
    if (_GLPLPF_DEBUG){
        xprintf("lpf_create_it: warning: debug mode enabled");
    }
    lpf = {};
    lpf.valid = 0;
    lpf.m0_max = lpf.m0 = 0;
    lpf.luf = luf_create_it();
    lpf.m = 0;
    lpf.B = null;
    lpf.n_max = 50;
    lpf.n = 0;
    lpf.R_ptr = lpf.R_len = null;
    lpf.S_ptr = lpf.S_len = null;
    lpf.scf = null;
    lpf.P_row = lpf.P_col = null;
    lpf.Q_row = lpf.Q_col = null;
    lpf.v_size = 1000;
    lpf.v_ptr = 0;
    lpf.v_ind = null;
    lpf.v_val = null;
    lpf.work1 = lpf.work2 = null;
    return lpf;
}

function lpf_factorize(lpf, m, bh, col, info){
    var k, ret;
    if (_GLPLPF_DEBUG){
        var i, j, len, ind;
        var B, val;
    }
    xassert(bh == bh);
    if (m < 1)
        xerror("lpf_factorize: m = " + m + "; invalid parameter");
    if (m > M_MAX)
        xerror("lpf_factorize: m = " + m + "; matrix too big");
    lpf.m0 = lpf.m = m;
    /* invalidate the factorization */
    lpf.valid = 0;
    /* allocate/reallocate arrays, if necessary */
    if (lpf.R_ptr == null)
        lpf.R_ptr = new Array(1+lpf.n_max);
    if (lpf.R_len == null)
        lpf.R_len = new Array(1+lpf.n_max);
    if (lpf.S_ptr == null)
        lpf.S_ptr = new Array(1+lpf.n_max);
    if (lpf.S_len == null)
        lpf.S_len = new Array(1+lpf.n_max);
    if (lpf.scf == null)
        lpf.scf = scf_create_it(lpf.n_max);
    if (lpf.v_ind == null)
        lpf.v_ind = new Array(1+lpf.v_size);
    if (lpf.v_val == null)
        lpf.v_val = new Array(1+lpf.v_size);
    if (lpf.m0_max < m)
    {
        lpf.m0_max = m + 100;
        lpf.P_row = new Array(1+lpf.m0_max+lpf.n_max);
        lpf.P_col = new Array(1+lpf.m0_max+lpf.n_max);
        lpf.Q_row = new Array(1+lpf.m0_max+lpf.n_max);
        lpf.Q_col = new Array(1+lpf.m0_max+lpf.n_max);
        lpf.work1 = new Array(1+lpf.m0_max+lpf.n_max);
        lpf.work2 = new Array(1+lpf.m0_max+lpf.n_max);
    }
    /* try to factorize the basis matrix */
    switch (luf_factorize(lpf.luf, m, col, info))
    {  case 0:
        break;
        case LUF_ESING:
            ret = LPF_ESING;
            return ret;
        case LUF_ECOND:
            ret = LPF_ECOND;
            return ret;
        default:
            xassert(lpf != lpf);
    }
    /* the basis matrix has been successfully factorized */
    lpf.valid = 1;
    if (_GLPLPF_DEBUG){
        /* store the basis matrix for debugging */
        xassert(m <= 32767);
        lpf.B = B = new Array(1+m*m);
        ind = new Array(1+m);
        val = new Array(1+m);
        for (k = 1; k <= m * m; k++)
            B[k] = 0.0;
        for (j = 1; j <= m; j++)
        {  len = col(info, j, ind, val);
            xassert(0 <= len && len <= m);
            for (k = 1; k <= len; k++)
            {  i = ind[k];
                xassert(1 <= i && i <= m);
                xassert(B[(i - 1) * m + j] == 0.0);
                xassert(val[k] != 0.0);
                B[(i - 1) * m + j] = val[k];
            }
        }
    }
    /* B = B0, so there are no additional rows/columns */
    lpf.n = 0;
    /* reset the Schur complement factorization */
    scf_reset_it(lpf.scf);
    /* P := Q := I */
    for (k = 1; k <= m; k++)
    {  lpf.P_row[k] = lpf.P_col[k] = k;
        lpf.Q_row[k] = lpf.Q_col[k] = k;
    }
    /* make all SVA locations free */
    lpf.v_ptr = 1;
    ret = 0;
    /* return to the calling program */
    return ret;
}

function r_prod(lpf, y, a, x, idx){
    var n = lpf.n;
    var R_ptr = lpf.R_ptr;
    var R_len = lpf.R_len;
    var v_ind = lpf.v_ind;
    var v_val = lpf.v_val;
    var j, beg, end, ptr;
    var t;
    for (j = 1; j <= n; j++)
    {  if (x[j+idx] == 0.0) continue;
        /* y := y + alpha * R[j] * x[j] */
        t = a * x[j+idx];
        beg = R_ptr[j];
        end = beg + R_len[j];
        for (ptr = beg; ptr < end; ptr++)
            y[v_ind[ptr]] += t * v_val[ptr];
    }
}

function rt_prod(lpf, y, idx, a, x){
    var n = lpf.n;
    var R_ptr = lpf.R_ptr;
    var R_len = lpf.R_len;
    var v_ind = lpf.v_ind;
    var v_val = lpf.v_val;
    var j, beg, end, ptr;
    var t;
    for (j = 1; j <= n; j++)
    {  /* t := (j-th column of R) * x */
        t = 0.0;
        beg = R_ptr[j];
        end = beg + R_len[j];
        for (ptr = beg; ptr < end; ptr++)
            t += v_val[ptr] * x[v_ind[ptr]];
        /* y[j] := y[j] + alpha * t */
        y[j+idx] += a * t;
    }
}

function s_prod(lpf, y, idx, a, x){
    var n = lpf.n;
    var S_ptr = lpf.S_ptr;
    var S_len = lpf.S_len;
    var v_ind = lpf.v_ind;
    var v_val = lpf.v_val;
    var i, beg, end, ptr;
    var t;
    for (i = 1; i <= n; i++)
    {  /* t := (i-th row of S) * x */
        t = 0.0;
        beg = S_ptr[i];
        end = beg + S_len[i];
        for (ptr = beg; ptr < end; ptr++)
            t += v_val[ptr] * x[v_ind[ptr]];
        /* y[i] := y[i] + alpha * t */
        y[i+idx] += a * t;
    }
}

function st_prod(lpf, y, a, x, idx){
    var n = lpf.n;
    var S_ptr = lpf.S_ptr;
    var S_len = lpf.S_len;
    var v_ind = lpf.v_ind;
    var v_val = lpf.v_val;
    var i, beg, end, ptr;
    var t;
    for (i = 1; i <= n; i++)
    {  if (x[i+idx] == 0.0) continue;
        /* y := y + alpha * S'[i] * x[i] */
        t = a * x[i+idx];
        beg = S_ptr[i];
        end = beg + S_len[i];
        for (ptr = beg; ptr < end; ptr++)
            y[v_ind[ptr]] += t * v_val[ptr];
    }
}

if (_GLPLPF_DEBUG){
    /***********************************************************************
     *  The routine check_error computes the maximal relative error between
     *  left- and right-hand sides for the system B * x = b (if tr is zero)
     *  or B' * x = b (if tr is non-zero), where B' is a matrix transposed
     *  to B. (This routine is intended for debugging only.) */

    function check_error(lpf, tr, x, b){
        var m = lpf.m;
        var B = lpf.B;
        var i, j;
        var d, dmax = 0.0, s, t, tmax;
        for (i = 1; i <= m; i++)
        {  s = 0.0;
            tmax = 1.0;
            for (j = 1; j <= m; j++)
            {  if (!tr)
                t = B[m * (i - 1) + j] * x[j];
            else
                t = B[m * (j - 1) + i] * x[j];
                if (tmax < Math.abs(t)) tmax = Math.abs(t);
                s += t;
            }
            d = Math.abs(s - b[i]) / tmax;
            if (dmax < d) dmax = d;
        }
        if (dmax > 1e-8)
            xprintf((!tr ? "lpf_ftran" : "lpf_btran") + ": dmax = " + dmax + "; relative error too large");
    }
}

function lpf_ftran(lpf, x){
    var m0 = lpf.m0;
    var m = lpf.m;
    var n  = lpf.n;
    var P_col = lpf.P_col;
    var Q_col = lpf.Q_col;
    var fg = lpf.work1;
    var f = fg;
    var g = fg;
    var i, ii;
    if (_GLPLPF_DEBUG){var b}
    if (!lpf.valid)
        xerror("lpf_ftran: the factorization is not valid");
    xassert(0 <= m && m <= m0 + n);
    if (_GLPLPF_DEBUG){
        /* save the right-hand side vector */
        b = new Array(1+m);
        for (i = 1; i <= m; i++) b[i] = x[i];
    }
    /* (f g) := inv(P) * (b 0) */
    for (i = 1; i <= m0 + n; i++)
        fg[i] = ((ii = P_col[i]) <= m ? x[ii] : 0.0);
    /* f1 := inv(L0) * f */
    luf_f_solve(lpf.luf, 0, f);
    /* g1 := g - S * f1 */
    s_prod(lpf, g, m0, -1.0, f);
    /* g2 := inv(C) * g1 */
    scf_solve_it(lpf.scf, 0, g, m0);
    /* f2 := inv(U0) * (f1 - R * g2) */
    r_prod(lpf, f, -1.0, g, m0);
    luf_v_solve(lpf.luf, 0, f);
    /* (x y) := inv(Q) * (f2 g2) */
    for (i = 1; i <= m; i++)
        x[i] = fg[Q_col[i]];
    if (_GLPLPF_DEBUG){
        /* check relative error in solution */
        check_error(lpf, 0, x, b);
    }
}

function lpf_btran(lpf, x){
    var m0 = lpf.m0;
    var m = lpf.m;
    var n = lpf.n;
    var P_row = lpf.P_row;
    var Q_row = lpf.Q_row;
    var fg = lpf.work1;
    var f = fg;
    var g = fg;
    var i, ii;
    if (_GLPLPF_DEBUG){var b}
    if (!lpf.valid)
        xerror("lpf_btran: the factorization is not valid");
    xassert(0 <= m && m <= m0 + n);
    if (_GLPLPF_DEBUG){
        /* save the right-hand side vector */
        b = new Array(1+m);
        for (i = 1; i <= m; i++) b[i] = x[i];
    }
    /* (f g) := Q * (b 0) */
    for (i = 1; i <= m0 + n; i++)
        fg[i] = ((ii = Q_row[i]) <= m ? x[ii] : 0.0);
    /* f1 := inv(U'0) * f */
    luf_v_solve(lpf.luf, 1, f);
    /* g1 := inv(C') * (g - R' * f1) */
    rt_prod(lpf, g, m0, -1.0, f);
    scf_solve_it(lpf.scf, 1, g, m0);
    /* g2 := g1 */
    //g = g;
    /* f2 := inv(L'0) * (f1 - S' * g2) */
    st_prod(lpf, f, -1.0, g, m0);
    luf_f_solve(lpf.luf, 1, f);
    /* (x y) := P * (f2 g2) */
    for (i = 1; i <= m; i++)
        x[i] = fg[P_row[i]];
    if (_GLPLPF_DEBUG){
        /* check relative error in solution */
        check_error(lpf, 1, x, b);
    }
}

function enlarge_sva(lpf, new_size){
    var v_size = lpf.v_size;
    var used = lpf.v_ptr - 1;
    var v_ind = lpf.v_ind;
    var v_val = lpf.v_val;
    xassert(v_size < new_size);
    while (v_size < new_size) v_size += v_size;
    lpf.v_size = v_size;
    lpf.v_ind = new Array(1+v_size);
    lpf.v_val = new Array(1+v_size);
    xassert(used >= 0);
    xcopyArr(lpf.v_ind, 1, v_ind, 1, used);
    xcopyArr(lpf.v_val, 1, v_val, 1, used);
}

function lpf_update_it(lpf, j, bh, len, ind, idx, val){
    var m0 = lpf.m0;
    var m = lpf.m;
    if (_GLPLPF_DEBUG){var B = lpf.B}
    var n = lpf.n;
    var R_ptr = lpf.R_ptr;
    var R_len = lpf.R_len;
    var S_ptr = lpf.S_ptr;
    var S_len = lpf.S_len;
    var P_row = lpf.P_row;
    var P_col = lpf.P_col;
    var Q_row = lpf.Q_row;
    var Q_col = lpf.Q_col;
    var v_ptr = lpf.v_ptr;
    var v_ind = lpf.v_ind;
    var v_val = lpf.v_val;
    var a = lpf.work2; /* new column */
    var fg = lpf.work1, f = fg, g = fg;
    var vw = lpf.work2, v = vw, w = vw;
    var x = g, y = w, z;
    var i, ii, k, ret;
    xassert(bh == bh);
    if (!lpf.valid)
        xerror("lpf_update_it: the factorization is not valid");
    if (!(1 <= j && j <= m))
        xerror("lpf_update_it: j = " + j + "; column number out of range");
    xassert(0 <= m && m <= m0 + n);
    /* check if the basis factorization can be expanded */
    if (n == lpf.n_max)
    {  lpf.valid = 0;
        ret = LPF_ELIMIT;
        return ret;
    }
    /* convert new j-th column of B to dense format */
    for (i = 1; i <= m; i++)
        a[i] = 0.0;
    for (k = 1; k <= len; k++)
    {  i = ind[idx + k];
        if (!(1 <= i && i <= m))
            xerror("lpf_update_it: ind[" + k + "] = " + i + "; row number out of range");
        if (a[i] != 0.0)
            xerror("lpf_update_it: ind[" + k + "] = " + i + "; duplicate row index not allowed");
        if (val[k] == 0.0)
            xerror("lpf_update_it: val[" + k + "] = " + val[k] + "; zero element not allowed");
        a[i] = val[k];
    }
    if (_GLPLPF_DEBUG){
        /* change column in the basis matrix for debugging */
        for (i = 1; i <= m; i++)
            B[(i - 1) * m + j] = a[i];
    }
    /* (f g) := inv(P) * (a 0) */
    for (i = 1; i <= m0+n; i++)
        fg[i] = ((ii = P_col[i]) <= m ? a[ii] : 0.0);
    /* (v w) := Q * (ej 0) */
    for (i = 1; i <= m0+n; i++) vw[i] = 0.0;
    vw[Q_col[j]] = 1.0;
    /* f1 := inv(L0) * f (new column of R) */
    luf_f_solve(lpf.luf, 0, f);
    /* v1 := inv(U'0) * v (new row of S) */
    luf_v_solve(lpf.luf, 1, v);
    /* we need at most 2 * m0 available locations in the SVA to store
     new column of matrix R and new row of matrix S */
    if (lpf.v_size < v_ptr + m0 + m0)
    {  enlarge_sva(lpf, v_ptr + m0 + m0);
        v_ind = lpf.v_ind;
        v_val = lpf.v_val;
    }
    /* store new column of R */
    R_ptr[n+1] = v_ptr;
    for (i = 1; i <= m0; i++)
    {  if (f[i] != 0.0){
        v_ind[v_ptr] = i; v_val[v_ptr] = f[i]; v_ptr++;
    }

    }
    R_len[n+1] = v_ptr - lpf.v_ptr;
    lpf.v_ptr = v_ptr;
    /* store new row of S */
    S_ptr[n+1] = v_ptr;
    for (i = 1; i <= m0; i++)
    {  if (v[i] != 0.0){
        v_ind[v_ptr] = i; v_val[v_ptr] = v[i]; v_ptr++;
    }

    }
    S_len[n+1] = v_ptr - lpf.v_ptr;
    lpf.v_ptr = v_ptr;
    /* x := g - S * f1 (new column of C) */
    s_prod(lpf, x, 0, -1.0, f);
    /* y := w - R' * v1 (new row of C) */
    rt_prod(lpf, y, 0, -1.0, v);
    /* z := - v1 * f1 (new diagonal element of C) */
    z = 0.0;
    for (i = 1; i <= m0; i++) z -= v[i] * f[i];
    /* update factorization of new matrix C */
    switch (scf_update_exp(lpf.scf, x, m0, y, m0, z))
    {  case 0:
        break;
        case SCF_ESING:
            lpf.valid = 0;
            ret = LPF_ESING;
            return ret;
        case SCF_ELIMIT:
            xassert(lpf != lpf);
        default:
            xassert(lpf != lpf);
    }
    /* expand matrix P */
    P_row[m0+n+1] = P_col[m0+n+1] = m0+n+1;
    /* expand matrix Q */
    Q_row[m0+n+1] = Q_col[m0+n+1] = m0+n+1;
    /* permute j-th and last (just added) column of matrix Q */
    i = Q_col[j]; ii = Q_col[m0+n+1];
    Q_row[i] = m0+n+1; Q_col[m0+n+1] = i;
    Q_row[ii] = j; Q_col[j] = ii;
    /* increase the number of additional rows and columns */
    lpf.n++;
    xassert(lpf.n <= lpf.n_max);
    /* the factorization has been successfully updated */
    ret = 0;
    /* return to the calling program */
    return ret;
}

