function lpx_cover_cut(lp, len, ind, val, x){
    var alfa = null, beta = null;

    var MAXTRY = 1000;

    function cover2(n, a, b, u, x, y, cov){
        /* try to generate mixed cover cut using two-element cover */
        var i, j, try_ = 0, ret = 0;
        var eps, temp, rmax = 0.001;
        eps = 0.001 * (1.0 + Math.abs(b));
        for (i = 1; i <= n; i++)
            for (j = i+1; j <= n; j++)
            {  /* C = {i, j} */
                try_++;
                if (try_ > MAXTRY) return ret;
                /* check if condition (8) is satisfied */
                if (a[i] + a[j] + y > b + eps)
                {  /* compute parameters for inequality (15) */
                    temp = a[i] + a[j] - b;
                    alfa = 1.0 / (temp + u);
                    beta = 2.0 - alfa * temp;
                    /* compute violation of inequality (15) */
                    temp = x[i] + x[j] + alfa * y - beta;
                    /* choose C providing maximum violation */
                    if (rmax < temp)
                    {  rmax = temp;
                        cov[1] = i;
                        cov[2] = j;
                        ret = 1;
                    }
                }
            }
        return ret;
    }

    function cover3(n, a, b, u, x, y, cov){
        /* try to generate mixed cover cut using three-element cover */
        var i, j, k, try_ = 0, ret = 0;
        var eps, temp, rmax = 0.001;
        eps = 0.001 * (1.0 + Math.abs(b));
        for (i = 1; i <= n; i++)
            for (j = i+1; j <= n; j++)
                for (k = j+1; k <= n; k++)
                {  /* C = {i, j, k} */
                    try_++;
                    if (try_ > MAXTRY) return ret;
                    /* check if condition (8) is satisfied */
                    if (a[i] + a[j] + a[k] + y > b + eps)
                    {  /* compute parameters for inequality (15) */
                        temp = a[i] + a[j] + a[k] - b;
                        alfa = 1.0 / (temp + u);
                        beta = 3.0 - alfa * temp;
                        /* compute violation of inequality (15) */
                        temp = x[i] + x[j] + x[k] + alfa * y - beta;
                        /* choose C providing maximum violation */
                        if (rmax < temp)
                        {  rmax = temp;
                            cov[1] = i;
                            cov[2] = j;
                            cov[3] = k;
                            ret = 1;
                        }
                    }
                }
        return ret;
    }

    function cover4(n, a, b, u, x, y, cov){
        /* try_ to generate mixed cover cut using four-element cover */
        var i, j, k, l, try_ = 0, ret = 0;
        var eps, temp, rmax = 0.001;
        eps = 0.001 * (1.0 + Math.abs(b));
        for (i = 1; i <= n; i++)
            for (j = i+1; j <= n; j++)
                for (k = j+1; k <= n; k++)
                    for (l = k+1; l <= n; l++)
                    {  /* C = {i, j, k, l} */
                        try_++;
                        if (try_ > MAXTRY) return ret;
                        /* check if condition (8) is satisfied */
                        if (a[i] + a[j] + a[k] + a[l] + y > b + eps)
                        {  /* compute parameters for inequality (15) */
                            temp = a[i] + a[j] + a[k] + a[l] - b;
                            alfa = 1.0 / (temp + u);
                            beta = 4.0 - alfa * temp;
                            /* compute violation of inequality (15) */
                            temp = x[i] + x[j] + x[k] + x[l] + alfa * y - beta;
                            /* choose C providing maximum violation */
                            if (rmax < temp)
                            {  rmax = temp;
                                cov[1] = i;
                                cov[2] = j;
                                cov[3] = k;
                                cov[4] = l;
                                ret = 1;
                            }
                        }
                    }
        return ret;
    }

    function cover(n, a, b, u, x, y, cov){
        /* try to generate mixed cover cut;
         input (see (5)):
         n        is the number of binary variables;
         a[1:n]   are coefficients at binary variables;
         b        is the right-hand side;
         u        is upper bound of continuous variable;
         x[1:n]   are values of binary variables at current point;
         y        is value of continuous variable at current point;
         output (see (15), (16), (17)):
         cov[1:r] are indices of binary variables included in cover C,
         where r is the set cardinality returned on exit;
         alfa     coefficient at continuous variable;
         beta     is the right-hand side; */
        var j;
        /* perform some sanity checks */
        xassert(n >= 2);
        for (j = 1; j <= n; j++) xassert(a[j] > 0.0);
        xassert(b > -1e-5);
        xassert(u >= 0.0);
        for (j = 1; j <= n; j++) xassert(0.0 <= x[j] && x[j] <= 1.0);
        xassert(0.0 <= y && y <= u);
        /* try to generate mixed cover cut */
        if (cover2(n, a, b, u, x, y, cov)) return 2;
        if (cover3(n, a, b, u, x, y, cov)) return 3;
        if (cover4(n, a, b, u, x, y, cov)) return 4;
        return 0;
    }



    var cov = new Array(1+4), j, k, nb, newlen, r;
    var f_min, f_max, u, y;
    /* substitute and remove fixed variables */
    newlen = 0;
    for (k = 1; k <= len; k++)
    {  j = ind[k];
        if (lpx_get_col_type(lp, j) == LPX_FX)
            val[0] -= val[k] * lpx_get_col_lb(lp, j);
        else
        {  newlen++;
            ind[newlen] = ind[k];
            val[newlen] = val[k];
        }
    }
    len = newlen;
    /* move binary variables to the beginning of the list so that
     elements 1, 2, ..., nb correspond to binary variables, and
     elements nb+1, nb+2, ..., len correspond to rest variables */
    nb = 0;
    for (k = 1; k <= len; k++)
    {  j = ind[k];
        if (lpx_get_col_kind(lp, j) == LPX_IV &&
            lpx_get_col_type(lp, j) == LPX_DB &&
            lpx_get_col_lb(lp, j) == 0.0 &&
            lpx_get_col_ub(lp, j) == 1.0)
        {  /* binary variable */
            var ind_k;
            var val_k;
            nb++;
            ind_k = ind[nb]; val_k = val[nb];
            ind[nb] = ind[k]; val[nb] = val[k];
            ind[k] = ind_k; val[k] = val_k;
        }
    }
    /* now the specified row has the form:
     sum a[j]*x[j] + sum a[j]*y[j] <= b,
     where x[j] are binary variables, y[j] are rest variables */
    /* at least two binary variables are needed */
    if (nb < 2) return 0;
    /* compute implied lower and upper bounds for sum a[j]*y[j] */
    f_min = f_max = 0.0;
    for (k = nb+1; k <= len; k++)
    {  j = ind[k];
        /* both bounds must be finite */
        if (lpx_get_col_type(lp, j) != LPX_DB) return 0;
        if (val[k] > 0.0)
        {  f_min += val[k] * lpx_get_col_lb(lp, j);
            f_max += val[k] * lpx_get_col_ub(lp, j);
        }
        else
        {  f_min += val[k] * lpx_get_col_ub(lp, j);
            f_max += val[k] * lpx_get_col_lb(lp, j);
        }
    }
    /* sum a[j]*x[j] + sum a[j]*y[j] <= b ===>
     sum a[j]*x[j] + (sum a[j]*y[j] - f_min) <= b - f_min ===>
     sum a[j]*x[j] + y <= b - f_min,
     where y = sum a[j]*y[j] - f_min;
     note that 0 <= y <= u, u = f_max - f_min */
    /* determine upper bound of y */
    u = f_max - f_min;
    /* determine value of y at the current point */
    y = 0.0;
    for (k = nb+1; k <= len; k++)
    {  j = ind[k];
        y += val[k] * lpx_get_col_prim(lp, j);
    }
    y -= f_min;
    if (y < 0.0) y = 0.0;
    if (y > u) y = u;
    /* modify the right-hand side b */
    val[0] -= f_min;
    /* now the transformed row has the form:
     sum a[j]*x[j] + y <= b, where 0 <= y <= u */
    /* determine values of x[j] at the current point */
    for (k = 1; k <= nb; k++)
    {  j = ind[k];
        x[k] = lpx_get_col_prim(lp, j);
        if (x[k] < 0.0) x[k] = 0.0;
        if (x[k] > 1.0) x[k] = 1.0;
    }
    /* if a[j] < 0, replace x[j] by its complement 1 - x'[j] */
    for (k = 1; k <= nb; k++)
    {  if (val[k] < 0.0)
    {  ind[k] = - ind[k];
        val[k] = - val[k];
        val[0] += val[k];
        x[k] = 1.0 - x[k];
    }
    }
    /* try to generate a mixed cover cut for the transformed row */
    r = cover(nb, val, val[0], u, x, y, cov);
    if (r == 0) return 0;
    xassert(2 <= r && r <= 4);
    /* now the cut is in the form:
     sum{j in C} x[j] + alfa * y <= beta */
    /* store the right-hand side beta */
    ind[0] = 0; val[0] = beta;
    /* restore the original ordinal numbers of x[j] */
    for (j = 1; j <= r; j++) cov[j] = ind[cov[j]];
    /* store cut coefficients at binary variables complementing back
     the variables having negative row coefficients */
    xassert(r <= nb);
    for (k = 1; k <= r; k++)
    {  if (cov[k] > 0)
    {  ind[k] = +cov[k];
        val[k] = +1.0;
    }
    else
    {  ind[k] = -cov[k];
        val[k] = -1.0;
        val[0] -= 1.0;
    }
    }
    /* substitute y = sum a[j]*y[j] - f_min */
    for (k = nb+1; k <= len; k++)
    {  r++;
        ind[r] = ind[k];
        val[r] = alfa * val[k];
    }
    val[0] += alfa * f_min;
    xassert(r <= len);
    len = r;
    return len;
}

function lpx_eval_row(lp, len, ind, val){
    var n = lpx_get_num_cols(lp);
    var j, k;
    var sum = 0.0;
    if (len < 0)
        xerror("lpx_eval_row: len = " + len + "; invalid row length");
    for (k = 1; k <= len; k++)
    {  j = ind[k];
        if (!(1 <= j && j <= n))
            xerror("lpx_eval_row: j = " + j + "; column number out of range");
        sum += val[k] * lpx_get_col_prim(lp, j);
    }
    return sum;
}

function ios_cov_gen(tree){
    var prob = tree.mip;
    var m = lpx_get_num_rows(prob);
    var n = lpx_get_num_cols(prob);
    var i, k, type, kase, len, ind;
    var r, val, work;
    xassert(lpx_get_status(prob) == LPX_OPT);
    /* allocate working arrays */
    ind = new Array(1+n);
    val = new Array(1+n);
    work = new Array(1+n);
    /* look through all rows */
    for (i = 1; i <= m; i++)
        for (kase = 1; kase <= 2; kase++)
        {  type = lpx_get_row_type(prob, i);
            if (kase == 1)
            {  /* consider rows of '<=' type */
                if (!(type == LPX_UP || type == LPX_DB)) continue;
                len = lpx_get_mat_row(prob, i, ind, val);
                val[0] = lpx_get_row_ub(prob, i);
            }
            else
            {  /* consider rows of '>=' type */
                if (!(type == LPX_LO || type == LPX_DB)) continue;
                len = lpx_get_mat_row(prob, i, ind, val);
                for (k = 1; k <= len; k++) val[k] = - val[k];
                val[0] = - lpx_get_row_lb(prob, i);
            }
            /* generate mixed cover cut:
             sum{j in J} a[j] * x[j] <= b */
            len = lpx_cover_cut(prob, len, ind, val, work);
            if (len == 0) continue;
            /* at the current point the cut inequality is violated, i.e.
             sum{j in J} a[j] * x[j] - b > 0 */
            r = lpx_eval_row(prob, len, ind, val) - val[0];
            if (r < 1e-3) continue;
            /* add the cut to the cut pool */
            glp_ios_add_row(tree, null, GLP_RF_COV, 0, len, ind, val,
                GLP_UP, val[0]);
        }
}
