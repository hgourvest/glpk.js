function cpx_basis(lp){
    /* main routine */
    var C, C2, C3, C4;
    var m, n, i, j, jk, k, l, ll, t, n2, n3, n4, type, len, I, r, ind;
    var alpha, gamma, cmax, temp, v, val;
    xprintf("Constructing initial basis...");
    /* determine the number of rows and columns */
    m = glp_get_num_rows(lp);
    n = glp_get_num_cols(lp);
    /* allocate working arrays */
    C = new Array(1+n);
    I = new Array(1+m);
    r = new Array(1+m);
    v = new Array(1+m);
    ind = new Array(1+m);
    val = new Array(1+m);
    /* make all auxiliary variables non-basic */
    for (i = 1; i <= m; i++)
    {  if (glp_get_row_type(lp, i) != GLP_DB)
        glp_set_row_stat(lp, i, GLP_NS);
    else if (Math.abs(glp_get_row_lb(lp, i)) <=
        Math.abs(glp_get_row_ub(lp, i)))
        glp_set_row_stat(lp, i, GLP_NL);
    else
        glp_set_row_stat(lp, i, GLP_NU);
    }
    /* make all structural variables non-basic */
    for (j = 1; j <= n; j++)
    {  if (glp_get_col_type(lp, j) != GLP_DB)
        glp_set_col_stat(lp, j, GLP_NS);
    else if (Math.abs(glp_get_col_lb(lp, j)) <=
        Math.abs(glp_get_col_ub(lp, j)))
        glp_set_col_stat(lp, j, GLP_NL);
    else
        glp_set_col_stat(lp, j, GLP_NU);
    }
    /* C2 is a set of free structural variables */
    n2 = 0; C2 = 0;
    for (j = 1; j <= n; j++)
    {  type = glp_get_col_type(lp, j);
        if (type == GLP_FR)
        {   n2++;
            C[C2 + n2].j = j;
            C[C2 + n2].q = 0.0;
        }
    }
    /* C3 is a set of structural variables having excatly one (lower
     or upper) bound */
    n3 = 0; C3 = C2 + n2;
    for (j = 1; j <= n; j++)
    {  type = glp_get_col_type(lp, j);
        if (type == GLP_LO)
        {  n3++;
            C[C3 + n3].j = j;
            C[C3 + n3].q = + glp_get_col_lb(lp, j);
        }
        else if (type == GLP_UP)
        {  n3++;
            C[C3 + n3].j = j;
            C[C3 + n3].q = - glp_get_col_ub(lp, j);
        }
    }
    /* C4 is a set of structural variables having both (lower and
     upper) bounds */
    n4 = 0; C4 = C3 + n3;
    for (j = 1; j <= n; j++)
    {  type = glp_get_col_type(lp, j);
        if (type == GLP_DB)
        {  n4++;
            C[C4 + n4].j = j;
            C[C4 + n4].q = glp_get_col_lb(lp, j) - glp_get_col_ub(lp, j);
        }
    }
    /* compute gamma = max{|c[j]|: 1 <= j <= n} */
    gamma = 0.0;
    for (j = 1; j <= n; j++)
    {  temp = Math.abs(glp_get_obj_coef(lp, j));
        if (gamma < temp) gamma = temp;
    }
    /* compute cmax */
    cmax = (gamma == 0.0 ? 1.0 : 1000.0 * gamma);
    /* compute final penalty for all structural variables within sets
     C2, C3, and C4 */
    switch (glp_get_obj_dir(lp))
    {  case GLP_MIN: temp = +1.0; break;
        case GLP_MAX: temp = -1.0; break;
        default: xassert(lp != lp);
    }
    for (k = 1; k <= n2+n3+n4; k++)
    {  j = C[k].j;
        C[k].q += (temp * glp_get_obj_coef(lp, j)) / cmax;
    }
    /* sort structural variables within C2, C3, and C4 in ascending
     order of penalty value */

    function fcmp(col1, col2){
        /* this routine is passed to the qsort() function */
        if (col1.q < col2.q) return -1;
        if (col1.q > col2.q) return +1;
        return 0;
    }

    xqsort(C, C2+1+n2, fcmp);
    for (k = 1; k < n2; k++) xassert(C[C2+k].q <= C[C2+k+1].q);
    xqsort(C, C3+1+n3, fcmp);
    for (k = 1; k < n3; k++) xassert(C[C3+k].q <= C[C3+k+1].q);
    xqsort(C, C4+1+n4, fcmp);
    for (k = 1; k < n4; k++) xassert(C[C4+k].q <= C[C4+k+1].q);
    /*** STEP 1 ***/
    for (i = 1; i <= m; i++)
    {  type = glp_get_row_type(lp, i);
        if (type != GLP_FX)
        {  /* row i is either free or inequality constraint */
            glp_set_row_stat(lp, i, GLP_BS);
            I[i] = 1;
            r[i] = 1;
        }
        else
        {  /* row i is equality constraint */
            I[i] = 0;
            r[i] = 0;
        }
        v[i] = +DBL_MAX;
    }
    /*** STEP 2 ***/

    function get_column(lp, j, ind, val){
        /* Bixby's algorithm assumes that the constraint matrix is scaled
         such that the maximum absolute value in every non-zero row and
         column is 1 */
        var k;
        var len = glp_get_mat_col(lp, j, ind, val);
        var big = 0.0;
        for (k = 1; k <= len; k++)
            if (big < Math.abs(val[k])) big = Math.abs(val[k]);
        if (big == 0.0) big = 1.0;
        for (k = 1; k <= len; k++) val[k] /= big;
        return len;
    }

    for (k = 1; k <= n2+n3+n4; k++)
    {  jk = C[k].j;
        len = get_column(lp, jk, ind, val);
        /* let alpha = max{|A[l,jk]|: r[l] = 0} and let l' be such
         that alpha = |A[l',jk]| */
        alpha = 0.0; ll = 0;
        for (t = 1; t <= len; t++)
        {  l = ind[t];
            if (r[l] == 0 && alpha < Math.abs(val[t])){
                alpha = Math.abs(val[t]); ll = l;
            }
        }
        if (alpha >= 0.99)
        {  /* B := B union {jk} */
            glp_set_col_stat(lp, jk, GLP_BS);
            I[ll] = 1;
            v[ll] = alpha;
            /* r[l] := r[l] + 1 for all l such that |A[l,jk]| != 0 */
            for (t = 1; t <= len; t++)
            {  l = ind[t];
                if (val[t] != 0.0) r[l]++;
            }
            /* continue to the next k */
            continue;
        }
        /* if |A[l,jk]| > 0.01 * v[l] for some l, continue to the
         next k */
        for (t = 1; t <= len; t++)
        {  l = ind[t];
            if (Math.abs(val[t]) > 0.01 * v[l]) break;
        }
        if (t <= len) continue;
        /* otherwise, let alpha = max{|A[l,jk]|: I[l] = 0} and let l'
         be such that alpha = |A[l',jk]| */
        alpha = 0.0; ll = 0;
        for (t = 1; t <= len; t++)
        {  l = ind[t];
            if (I[l] == 0 && alpha < Math.abs(val[t])){
                alpha = Math.abs(val[t]); ll = l;
            }
        }
        /* if alpha = 0, continue to the next k */
        if (alpha == 0.0) continue;
        /* B := B union {jk} */
        glp_set_col_stat(lp, jk, GLP_BS);
        I[ll] = 1;
        v[ll] = alpha;
        /* r[l] := r[l] + 1 for all l such that |A[l,jk]| != 0 */
        for (t = 1; t <= len; t++)
        {  l = ind[t];
            if (val[t] != 0.0) r[l]++;
        }
    }
    /*** STEP 3 ***/
    /* add an artificial variable (auxiliary variable for equality
     constraint) to cover each remaining uncovered row */
    for (i = 1; i <= m; i++)
        if (I[i] == 0) glp_set_row_stat(lp, i, GLP_BS);
}

function glp_cpx_basis(lp){
    if (lp.m == 0 || lp.n == 0)
        glp_std_basis(lp);
    else
        cpx_basis(lp);
}

