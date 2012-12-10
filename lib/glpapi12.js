var glp_bf_exists = exports.glp_bf_exists = function(lp){
    return (lp.m == 0 || lp.valid);
};

var glp_factorize = exports.glp_factorize = function(lp){

    function b_col(lp, j, ind, val){
        var m = lp.m;
        var aij;
        var k, len;
        xassert(1 <= j && j <= m);
        /* determine the ordinal number of basic auxiliary or structural
         variable x[k] corresponding to basic variable xB[j] */
        k = lp.head[j];
        /* build j-th column of the basic matrix, which is k-th column of
         the scaled augmented matrix (I | -R*A*S) */
        if (k <= m)
        {  /* x[k] is auxiliary variable */
            len = 1;
            ind[1] = k;
            val[1] = 1.0;
        }
        else
        {  /* x[k] is structural variable */
            len = 0;
            for (aij = lp.col[k-m].ptr; aij != null; aij = aij.c_next)
            {  len++;
                ind[len] = aij.row.i;
                val[len] = - aij.row.rii * aij.val * aij.col.sjj;
            }
        }
        return len;
    }

    var m = lp.m;
    var n = lp.n;
    var row = lp.row;
    var col = lp.col;
    var head = lp.head;
    var j, k, stat, ret;
    /* invalidate the basis factorization */
    lp.valid = 0;
    /* build the basis header */
    j = 0;
    for (k = 1; k <= m+n; k++)
    {  if (k <= m)
    {  stat = row[k].stat;
        row[k].bind = 0;
    }
    else
    {  stat = col[k-m].stat;
        col[k-m].bind = 0;
    }
        if (stat == GLP_BS)
        {  j++;
            if (j > m)
            {  /* too many basic variables */
                ret = GLP_EBADB;
                return ret;
            }
            head[j] = k;
            if (k <= m)
                row[k].bind = j;
            else
                col[k-m].bind = j;
        }
    }
    if (j < m)
    {  /* too few basic variables */
        ret = GLP_EBADB;
        return ret;
    }
    /* try to factorize the basis matrix */
    if (m > 0)
    {  if (lp.bfd == null)
    {  lp.bfd = bfd_create_it();
        copy_bfcp(lp);
    }
        switch (bfd_factorize(lp.bfd, m, lp.head, b_col, lp))
        {  case 0:
            /* ok */
            break;
            case BFD_ESING:
                /* singular matrix */
                ret = GLP_ESING;
                return ret;
            case BFD_ECOND:
                /* ill-conditioned matrix */
                ret = GLP_ECOND;
                return ret;
            default:
                xassert(lp != lp);
        }
        lp.valid = 1;
    }
    /* factorization successful */
    ret = 0;
    /* bring the return code to the calling program */
    return ret;
};

var glp_bf_updated = exports.glp_bf_updated = function(lp){
    if (!(lp.m == 0 || lp.valid))
        xerror("glp_bf_update: basis factorization does not exist");
    return (lp.m == 0 ? 0 : bfd_get_count(lp.bfd));
};

var glp_get_bfcp = exports.glp_get_bfcp = function(lp, parm){
    var bfcp = lp.bfcp;
    if (bfcp == null)
    {  parm.type = GLP_BF_FT;
        parm.lu_size = 0;
        parm.piv_tol = 0.10;
        parm.piv_lim = 4;
        parm.suhl = GLP_ON;
        parm.eps_tol = 1e-15;
        parm.max_gro = 1e+10;
        parm.nfs_max = 100;
        parm.upd_tol = 1e-6;
        parm.nrs_max = 100;
        parm.rs_size = 0;
    }
    else
        xcopyObj(parm, bfcp);
};

function copy_bfcp(lp){
    var parm = {};
    glp_get_bfcp(lp, parm);
    bfd_set_parm(lp.bfd, parm);
}

var glp_set_bfcp = exports.glp_set_bfcp = function(lp, parm){
    var bfcp = lp.bfcp;
    if (parm == null)
    {  /* reset to default values */
        if (bfcp != null)
            lp.bfcp = null;
    }
    else
    {  /* set to specified values */
        if (bfcp == null)
            bfcp = lp.bfcp = {};
        xcopyObj(bfcp, parm);
        if (!(bfcp.type == GLP_BF_FT || bfcp.type == GLP_BF_BG ||
            bfcp.type == GLP_BF_GR))
            xerror("glp_set_bfcp: type = " + bfcp.type + "; invalid parameter");
        if (bfcp.lu_size < 0)
            xerror("glp_set_bfcp: lu_size = " + bfcp.lu_size + "; invalid parameter");
        if (!(0.0 < bfcp.piv_tol && bfcp.piv_tol < 1.0))
            xerror("glp_set_bfcp: piv_tol = " + bfcp.piv_tol + "; invalid parameter");
        if (bfcp.piv_lim < 1)
            xerror("glp_set_bfcp: piv_lim = " + bfcp.piv_lim + "; invalid parameter");
        if (!(bfcp.suhl == GLP_ON || bfcp.suhl == GLP_OFF))
            xerror("glp_set_bfcp: suhl = " + bfcp.suhl + "; invalid parameter");
        if (!(0.0 <= bfcp.eps_tol && bfcp.eps_tol <= 1e-6))
            xerror("glp_set_bfcp: eps_tol = " + bfcp.eps_tol + "; invalid parameter");
        if (bfcp.max_gro < 1.0)
            xerror("glp_set_bfcp: max_gro = " + bfcp.max_gro + "; invalid parameter");
        if (!(1 <= bfcp.nfs_max && bfcp.nfs_max <= 32767))
            xerror("glp_set_bfcp: nfs_max = " + bfcp.nfs_max + "; invalid parameter");
        if (!(0.0 < bfcp.upd_tol && bfcp.upd_tol < 1.0))
            xerror("glp_set_bfcp: upd_tol = " + bfcp.upd_tol + "; invalid parameter");
        if (!(1 <= bfcp.nrs_max && bfcp.nrs_max <= 32767))
            xerror("glp_set_bfcp: nrs_max = " + bfcp.nrs_max + "; invalid parameter");
        if (bfcp.rs_size < 0)
            xerror("glp_set_bfcp: rs_size = " + bfcp.nrs_max + "; invalid parameter");
        if (bfcp.rs_size == 0)
            bfcp.rs_size = 20 * bfcp.nrs_max;
    }
    if (lp.bfd != null) copy_bfcp(lp);
};

var glp_get_bhead = exports.glp_get_bhead = function(lp, k){
    if (!(lp.m == 0 || lp.valid))
        xerror("glp_get_bhead: basis factorization does not exist");
    if (!(1 <= k && k <= lp.m))
        xerror("glp_get_bhead: k = " + k + "; index out of range");
    return lp.head[k];
};

var glp_get_row_bind = exports.glp_get_row_bind = function(lp, i){
    if (!(lp.m == 0 || lp.valid))
        xerror("glp_get_row_bind: basis factorization does not exist");
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_row_bind: i = " + i + "; row number out of range");
    return lp.row[i].bind;
};

var glp_get_col_bind = exports.glp_get_col_bind = function(lp, j){
    if (!(lp.m == 0 || lp.valid))
        xerror("glp_get_col_bind: basis factorization does not exist");
    if (!(1 <= j && j <= lp.n))
        xerror("glp_get_col_bind: j = " + j + "; column number out of range");
    return lp.col[j].bind;
};

var glp_ftran = exports.glp_ftran = function(lp, x){
    var m = lp.m;
    var row = lp.row;
    var col = lp.col;
    var i, k;
    /* B*x = b ===> (R*B*SB)*(inv(SB)*x) = R*b ===>
     B"*x" = b", where b" = R*b, x = SB*x" */
    if (!(m == 0 || lp.valid))
        xerror("glp_ftran: basis factorization does not exist");
    /* b" := R*b */
    for (i = 1; i <= m; i++)
        x[i] *= row[i].rii;
    /* x" := inv(B")*b" */
    if (m > 0) bfd_ftran(lp.bfd, x);
    /* x := SB*x" */
    for (i = 1; i <= m; i++)
    {  k = lp.head[i];
        if (k <= m)
            x[i] /= row[k].rii;
        else
            x[i] *= col[k-m].sjj;
    }
};

var glp_btran = exports.glp_btran = function(lp, x){
    var m = lp.m;
    var row = lp.row;
    var col = lp.col;
    var i, k;
    /* B'*x = b ===> (SB*B'*R)*(inv(R)*x) = SB*b ===>
     (B")'*x" = b", where b" = SB*b, x = R*x" */
    if (!(m == 0 || lp.valid))
        xerror("glp_btran: basis factorization does not exist");
    /* b" := SB*b */
    for (i = 1; i <= m; i++)
    {  k = lp.head[i];
        if (k <= m)
            x[i] /= row[k].rii;
        else
            x[i] *= col[k-m].sjj;
    }
    /* x" := inv[(B")']*b" */
    if (m > 0) bfd_btran(lp.bfd, x);
    /* x := R*x" */
    for (i = 1; i <= m; i++)
        x[i] *= row[i].rii;
};

var glp_warm_up = exports.glp_warm_up = function(P){
    var row;
    var col;
    var aij;
    var i, j, type, ret;
    var eps, temp, work;
    /* invalidate basic solution */
    P.pbs_stat = P.dbs_stat = GLP_UNDEF;
    P.obj_val = 0.0;
    P.some = 0;
    for (i = 1; i <= P.m; i++)
    {  row = P.row[i];
        row.prim = row.dual = 0.0;
    }
    for (j = 1; j <= P.n; j++)
    {  col = P.col[j];
        col.prim = col.dual = 0.0;
    }
    /* compute the basis factorization, if necessary */
    if (!glp_bf_exists(P))
    {  ret = glp_factorize(P);
        if (ret != 0) return ret;
    }
    /* allocate working array */
    work = new Array(1+P.m);
    /* determine and store values of non-basic variables, compute
     vector (- N * xN) */
    for (i = 1; i <= P.m; i++)
        work[i] = 0.0;
    for (i = 1; i <= P.m; i++)
    {  row = P.row[i];
        if (row.stat == GLP_BS)
            continue;
        else if (row.stat == GLP_NL)
            row.prim = row.lb;
        else if (row.stat == GLP_NU)
            row.prim = row.ub;
        else if (row.stat == GLP_NF)
            row.prim = 0.0;
        else if (row.stat == GLP_NS)
            row.prim = row.lb;
        else
            xassert(row != row);
        /* N[j] is i-th column of matrix (I|-A) */
        work[i] -= row.prim;
    }
    for (j = 1; j <= P.n; j++)
    {  col = P.col[j];
        if (col.stat == GLP_BS)
            continue;
        else if (col.stat == GLP_NL)
            col.prim = col.lb;
        else if (col.stat == GLP_NU)
            col.prim = col.ub;
        else if (col.stat == GLP_NF)
            col.prim = 0.0;
        else if (col.stat == GLP_NS)
            col.prim = col.lb;
        else
            xassert(col != col);
        /* N[j] is (m+j)-th column of matrix (I|-A) */
        if (col.prim != 0.0)
        {  for (aij = col.ptr; aij != null; aij = aij.c_next)
            work[aij.row.i] += aij.val * col.prim;
        }
    }
    /* compute vector of basic variables xB = - inv(B) * N * xN */
    glp_ftran(P, work);
    /* store values of basic variables, check primal feasibility */
    P.pbs_stat = GLP_FEAS;
    for (i = 1; i <= P.m; i++)
    {  row = P.row[i];
        if (row.stat != GLP_BS)
            continue;
        row.prim = work[row.bind];
        type = row.type;
        if (type == GLP_LO || type == GLP_DB || type == GLP_FX)
        {  eps = 1e-6 + 1e-9 * Math.abs(row.lb);
            if (row.prim < row.lb - eps)
                P.pbs_stat = GLP_INFEAS;
        }
        if (type == GLP_UP || type == GLP_DB || type == GLP_FX)
        {  eps = 1e-6 + 1e-9 * Math.abs(row.ub);
            if (row.prim > row.ub + eps)
                P.pbs_stat = GLP_INFEAS;
        }
    }
    for (j = 1; j <= P.n; j++)
    {  col = P.col[j];
        if (col.stat != GLP_BS)
            continue;
        col.prim = work[col.bind];
        type = col.type;
        if (type == GLP_LO || type == GLP_DB || type == GLP_FX)
        {  eps = 1e-6 + 1e-9 * Math.abs(col.lb);
            if (col.prim < col.lb - eps)
                P.pbs_stat = GLP_INFEAS;
        }
        if (type == GLP_UP || type == GLP_DB || type == GLP_FX)
        {  eps = 1e-6 + 1e-9 * Math.abs(col.ub);
            if (col.prim > col.ub + eps)
                P.pbs_stat = GLP_INFEAS;
        }
    }
    /* compute value of the objective function */
    P.obj_val = P.c0;
    for (j = 1; j <= P.n; j++)
    {  col = P.col[j];
        P.obj_val += col.coef * col.prim;
    }
    /* build vector cB of objective coefficients at basic variables */
    for (i = 1; i <= P.m; i++)
        work[i] = 0.0;
    for (j = 1; j <= P.n; j++)
    {  col = P.col[j];
        if (col.stat == GLP_BS)
            work[col.bind] = col.coef;
    }
    /* compute vector of simplex multipliers pi = inv(B') * cB */
    glp_btran(P, work);
    /* compute and store reduced costs of non-basic variables d[j] =
     c[j] - N'[j] * pi, check dual feasibility */
    P.dbs_stat = GLP_FEAS;
    for (i = 1; i <= P.m; i++)
    {  row = P.row[i];
        if (row.stat == GLP_BS)
        {  row.dual = 0.0;
            continue;
        }
        /* N[j] is i-th column of matrix (I|-A) */
        row.dual = - work[i];
        type = row.type;
        temp = (P.dir == GLP_MIN ? + row.dual : - row.dual);
        if ((type == GLP_FR || type == GLP_LO) && temp < -1e-5 ||
            (type == GLP_FR || type == GLP_UP) && temp > +1e-5)
            P.dbs_stat = GLP_INFEAS;
    }
    for (j = 1; j <= P.n; j++)
    {  col = P.col[j];
        if (col.stat == GLP_BS)
        {  col.dual = 0.0;
            continue;
        }
        /* N[j] is (m+j)-th column of matrix (I|-A) */
        col.dual = col.coef;
        for (aij = col.ptr; aij != null; aij = aij.c_next)
            col.dual += aij.val * work[aij.row.i];
        type = col.type;
        temp = (P.dir == GLP_MIN ? + col.dual : - col.dual);
        if ((type == GLP_FR || type == GLP_LO) && temp < -1e-5 ||
            (type == GLP_FR || type == GLP_UP) && temp > +1e-5)
            P.dbs_stat = GLP_INFEAS;
    }
    /* free working array */
    return 0;
}

var glp_eval_tab_row = exports.glp_eval_tab_row = function(lp, k, ind, val){
    var m = lp.m;
    var n = lp.n;
    var i, t, len, lll, iii;
    var alfa, rho, vvv;
    if (!(m == 0 || lp.valid))
        xerror("glp_eval_tab_row: basis factorization does not exist");
    if (!(1 <= k && k <= m+n))
        xerror("glp_eval_tab_row: k = " + k + "; variable number out of range");
    /* determine xB[i] which corresponds to x[k] */
    if (k <= m)
        i = glp_get_row_bind(lp, k);
    else
        i = glp_get_col_bind(lp, k-m);
    if (i == 0)
        xerror("glp_eval_tab_row: k = " + k + "; variable must be basic");
    xassert(1 <= i && i <= m);
    /* allocate working arrays */
    rho = new Array(1+m);
    iii = new Array(1+m);
    vvv = new Array(1+m);
    /* compute i-th row of the inverse; see (8) */
    for (t = 1; t <= m; t++) rho[t] = 0.0;
    rho[i] = 1.0;
    glp_btran(lp, rho);
    /* compute i-th row of the simplex table */
    len = 0;
    for (k = 1; k <= m+n; k++)
    {  if (k <= m)
    {  /* x[k] is auxiliary variable, so N[k] is a unity column */
        if (glp_get_row_stat(lp, k) == GLP_BS) continue;
        /* compute alfa[i,j]; see (9) */
        alfa = - rho[k];
    }
    else
    {  /* x[k] is structural variable, so N[k] is a column of the
     original constraint matrix A with negative sign */
        if (glp_get_col_stat(lp, k-m) == GLP_BS) continue;
        /* compute alfa[i,j]; see (9) */
        lll = glp_get_mat_col(lp, k-m, iii, vvv);
        alfa = 0.0;
        for (t = 1; t <= lll; t++) alfa += rho[iii[t]] * vvv[t];
    }
        /* store alfa[i,j] */
        if (alfa != 0.0) {
            len++;
            ind[len] = k;
            val[len] = alfa;
        }
    }
    xassert(len <= n);
    /* return to the calling program */
    return len;
};

var glp_eval_tab_col = exports.glp_eval_tab_col = function(lp, k, ind, val){
    var m = lp.m;
    var n = lp.n;
    var t, len, stat;
    var col;
    if (!(m == 0 || lp.valid))
        xerror("glp_eval_tab_col: basis factorization does not exist");
    if (!(1 <= k && k <= m+n))
        xerror("glp_eval_tab_col: k = " + k + "; variable number out of range");
    if (k <= m)
        stat = glp_get_row_stat(lp, k);
    else
        stat = glp_get_col_stat(lp, k-m);
    if (stat == GLP_BS)
        xerror("glp_eval_tab_col: k = " + k + "; variable must be non-basic");
    /* obtain column N[k] with negative sign */
    col = new Array(1+m);
    for (t = 1; t <= m; t++) col[t] = 0.0;
    if (k <= m)
    {  /* x[k] is auxiliary variable, so N[k] is a unity column */
        col[k] = -1.0;
    }
    else
    {  /* x[k] is structural variable, so N[k] is a column of the
     original constraint matrix A with negative sign */
        len = glp_get_mat_col(lp, k-m, ind, val);
        for (t = 1; t <= len; t++) col[ind[t]] = val[t];
    }
    /* compute column of the simplex table, which corresponds to the
     specified non-basic variable x[k] */
    glp_ftran(lp, col);
    len = 0;
    for (t = 1; t <= m; t++)
    {  if (col[t] != 0.0)
    {  len++;
        ind[len] = glp_get_bhead(lp, t);
        val[len] = col[t];
    }
    }
    /* return to the calling program */
    return len;
};

var glp_transform_row = exports.glp_transform_row = function(P, len, ind, val){
    var i, j, k, m, n, t, lll, iii;
    var alfa, a, aB, rho, vvv;
    if (!glp_bf_exists(P))
        xerror("glp_transform_row: basis factorization does not exist ");
    m = glp_get_num_rows(P);
    n = glp_get_num_cols(P);
    /* unpack the row to be transformed to the array a */
    a = new Array(1+n);
    for (j = 1; j <= n; j++) a[j] = 0.0;
    if (!(0 <= len && len <= n))
        xerror("glp_transform_row: len = " + len + "; invalid row length");
    for (t = 1; t <= len; t++)
    {  j = ind[t];
        if (!(1 <= j && j <= n))
            xerror("glp_transform_row: ind[" + t + "] = " + j + "; column index out of range");
        if (val[t] == 0.0)
            xerror("glp_transform_row: val[" + t + "] = 0; zero coefficient not allowed");
        if (a[j] != 0.0)
            xerror("glp_transform_row: ind[" + t + "] = " + j + "; duplicate column indices not allowed");
        a[j] = val[t];
    }
    /* construct the vector aB */
    aB = new Array(1+m);
    for (i = 1; i <= m; i++)
    {  k = glp_get_bhead(P, i);
        /* xB[i] is k-th original variable */
        xassert(1 <= k && k <= m+n);
        aB[i] = (k <= m ? 0.0 : a[k-m]);
    }
    /* solve the system B'*rho = aB to compute the vector rho */
    rho = aB; glp_btran(P, rho);
    /* compute coefficients at non-basic auxiliary variables */
    len = 0;
    for (i = 1; i <= m; i++)
    {  if (glp_get_row_stat(P, i) != GLP_BS)
    {  alfa = - rho[i];
        if (alfa != 0.0)
        {  len++;
            ind[len] = i;
            val[len] = alfa;
        }
    }
    }
    /* compute coefficients at non-basic structural variables */
    iii = new Array(1+m);
    vvv = new Array(1+m);
    for (j = 1; j <= n; j++)
    {  if (glp_get_col_stat(P, j) != GLP_BS)
    {  alfa = a[j];
        lll = glp_get_mat_col(P, j, iii, vvv);
        for (t = 1; t <= lll; t++) alfa += vvv[t] * rho[iii[t]];
        if (alfa != 0.0)
        {  len++;
            ind[len] = m+j;
            val[len] = alfa;
        }
    }
    }
    xassert(len <= n);
    return len;
};

var glp_transform_col = exports.glp_transform_col = function(P, len, ind, val){
    var i, m, t;
    var a, alfa;
    if (!glp_bf_exists(P))
        xerror("glp_transform_col: basis factorization does not exist ");
    m = glp_get_num_rows(P);
    /* unpack the column to be transformed to the array a */
    a = new Array(1+m);
    for (i = 1; i <= m; i++) a[i] = 0.0;
    if (!(0 <= len && len <= m))
        xerror("glp_transform_col: len = " + len + "; invalid column length");
    for (t = 1; t <= len; t++)
    {  i = ind[t];
        if (!(1 <= i && i <= m))
            xerror("glp_transform_col: ind[" + t + "] = " + i + "; row index out of range");
        if (val[t] == 0.0)
            xerror("glp_transform_col: val[" + t + "] = 0; zero coefficient not allowed");
        if (a[i] != 0.0)
            xerror("glp_transform_col: ind[" + t + "] = " + i + "; duplicate row indices not allowed");
        a[i] = val[t];
    }
    /* solve the system B*a = alfa to compute the vector alfa */
    alfa = a; glp_ftran(P, alfa);
    /* store resultant coefficients */
    len = 0;
    for (i = 1; i <= m; i++)
    {  if (alfa[i] != 0.0)
    {  len++;
        ind[len] = glp_get_bhead(P, i);
        val[len] = alfa[i];
    }
    }
    return len;
};

var glp_prim_rtest = exports.glp_prim_rtest = function(P, len, ind, val, dir, eps){
    var k, m, n, piv, t, type, stat;
    var alfa, big, beta, lb, ub, temp, teta;
    if (glp_get_prim_stat(P) != GLP_FEAS)
        xerror("glp_prim_rtest: basic solution is not primal feasible ");
    if (!(dir == +1 || dir == -1))
        xerror("glp_prim_rtest: dir = " + dir + "; invalid parameter");
    if (!(0.0 < eps && eps < 1.0))
        xerror("glp_prim_rtest: eps = " + eps + "; invalid parameter");
    m = glp_get_num_rows(P);
    n = glp_get_num_cols(P);
    /* initial settings */
    piv = 0; teta = DBL_MAX; big = 0.0;
    /* walk through the entries of the specified column */
    for (t = 1; t <= len; t++)
    {  /* get the ordinal number of basic variable */
        k = ind[t];
        if (!(1 <= k && k <= m+n))
            xerror("glp_prim_rtest: ind[" + t + "] = " + k + "; variable number out of range");
        /* determine type, bounds, status and primal value of basic
         variable xB[i] = x[k] in the current basic solution */
        if (k <= m)
        {  type = glp_get_row_type(P, k);
            lb = glp_get_row_lb(P, k);
            ub = glp_get_row_ub(P, k);
            stat = glp_get_row_stat(P, k);
            beta = glp_get_row_prim(P, k);
        }
        else
        {  type = glp_get_col_type(P, k-m);
            lb = glp_get_col_lb(P, k-m);
            ub = glp_get_col_ub(P, k-m);
            stat = glp_get_col_stat(P, k-m);
            beta = glp_get_col_prim(P, k-m);
        }
        if (stat != GLP_BS)
            xerror("glp_prim_rtest: ind[" + t + "] = " + k + "; non-basic variable not allowed");
        /* determine influence coefficient at basic variable xB[i]
         in the explicitly specified column and turn to the case of
         increasing the variable x in order to simplify the program
         logic */
        alfa = (dir > 0 ? + val[t] : - val[t]);
        /* analyze main cases */
        if (type == GLP_FR)
        {  /* xB[i] is free variable */
            continue;
        }
        else if (type == GLP_LO)
        {  /* xB[i] has an lower bound */
            if (alfa > - eps) continue;
            temp = (lb - beta) / alfa;
        }
        else if (type == GLP_UP)
        {  /* xB[i] has an upper bound */
            if (alfa < + eps) continue;
            temp = (ub - beta) / alfa;
        }
        else if (type == GLP_DB)
        {  /* xB[i] has both lower and upper bounds */
            if (alfa < 0.0)
            {  /* xB[i] has an lower bound */
                if (alfa > - eps) continue;
                temp = (lb - beta) / alfa;
            } else {
                /* xB[i] has an upper bound */
                if (alfa < + eps) continue;
                temp = (ub - beta) / alfa;
            }
        }
        else if (type == GLP_FX)
        {  /* xB[i] is fixed variable */
            if (- eps < alfa && alfa < + eps) continue;
            temp = 0.0;
        }
        else
            xassert(type != type);
        /* if the value of the variable xB[i] violates its lower or
         upper bound (slightly, because the current basis is assumed
         to be primal feasible), temp is negative; we can think this
         happens due to round-off errors and the value is exactly on
         the bound; this allows replacing temp by zero */
        if (temp < 0.0) temp = 0.0;
        /* apply the minimal ratio test */
        if (teta > temp || teta == temp && big < Math.abs(alfa)){
            piv = t;
            teta = temp;
            big = Math.abs(alfa);
        }

    }
    /* return index of the pivot element chosen */
    return piv;
};

var glp_dual_rtest = exports.glp_dual_rtest = function(P, len, ind, val, dir, eps){
    var k, m, n, piv, t, stat;
    var alfa, big, cost, obj, temp, teta;
    if (glp_get_dual_stat(P) != GLP_FEAS)
        xerror("glp_dual_rtest: basic solution is not dual feasible");
    if (!(dir == +1 || dir == -1))
        xerror("glp_dual_rtest: dir = " + dir + "; invalid parameter");
    if (!(0.0 < eps && eps < 1.0))
        xerror("glp_dual_rtest: eps = " + eps + "; invalid parameter");
    m = glp_get_num_rows(P);
    n = glp_get_num_cols(P);
    /* take into account optimization direction */
    obj = (glp_get_obj_dir(P) == GLP_MIN ? +1.0 : -1.0);
    /* initial settings */
    piv = 0; teta = DBL_MAX; big = 0.0;
    /* walk through the entries of the specified row */
    for (t = 1; t <= len; t++)
    {  /* get ordinal number of non-basic variable */
        k = ind[t];
        if (!(1 <= k && k <= m+n))
            xerror("glp_dual_rtest: ind[" + t + "] = " + k + "; variable number out of range");
        /* determine status and reduced cost of non-basic variable
         x[k] = xN[j] in the current basic solution */
        if (k <= m)
        {  stat = glp_get_row_stat(P, k);
            cost = glp_get_row_dual(P, k);
        }
        else
        {  stat = glp_get_col_stat(P, k-m);
            cost = glp_get_col_dual(P, k-m);
        }
        if (stat == GLP_BS)
            xerror("glp_dual_rtest: ind[" + t + "] = " + k + "; basic variable not allowed");
        /* determine influence coefficient at non-basic variable xN[j]
         in the explicitly specified row and turn to the case of
         increasing the variable x in order to simplify the program
         logic */
        alfa = (dir > 0 ? + val[t] : - val[t]);
        /* analyze main cases */
        if (stat == GLP_NL)
        {  /* xN[j] is on its lower bound */
            if (alfa < + eps) continue;
            temp = (obj * cost) / alfa;
        }
        else if (stat == GLP_NU)
        {  /* xN[j] is on its upper bound */
            if (alfa > - eps) continue;
            temp = (obj * cost) / alfa;
        }
        else if (stat == GLP_NF)
        {  /* xN[j] is non-basic free variable */
            if (- eps < alfa && alfa < + eps) continue;
            temp = 0.0;
        }
        else if (stat == GLP_NS)
        {  /* xN[j] is non-basic fixed variable */
            continue;
        }
        else
            xassert(stat != stat);
        /* if the reduced cost of the variable xN[j] violates its zero
         bound (slightly, because the current basis is assumed to be
         dual feasible), temp is negative; we can think this happens
         due to round-off errors and the reduced cost is exact zero;
         this allows replacing temp by zero */
        if (temp < 0.0) temp = 0.0;
        /* apply the minimal ratio test */
        if (teta > temp || teta == temp && big < Math.abs(alfa)){
            piv = t;
            teta = temp;
            big = Math.abs(alfa);
        }
    }
    /* return index of the pivot element chosen */
    return piv;
};

function _glp_analyze_row(P, len, ind, val, type, rhs, eps, callback){
    var t, k, dir, piv, ret = 0;
    var x, dx, y, dy, dz;
    if (P.pbs_stat == GLP_UNDEF)
        xerror("glp_analyze_row: primal basic solution components are undefined");
    if (P.dbs_stat != GLP_FEAS)
        xerror("glp_analyze_row: basic solution is not dual feasible");
    /* compute the row value y = sum alfa[j] * xN[j] in the current
     basis */
    if (!(0 <= len && len <= P.n))
        xerror("glp_analyze_row: len = " + len + "; invalid row length");
    y = 0.0;
    for (t = 1; t <= len; t++)
    {  /* determine value of x[k] = xN[j] in the current basis */
        k = ind[t];
        if (!(1 <= k && k <= P.m+P.n))
            xerror("glp_analyze_row: ind[" + t + "] = " + k + "; row/column index out of range");
        if (k <= P.m)
        {  /* x[k] is auxiliary variable */
            if (P.row[k].stat == GLP_BS)
                xerror("glp_analyze_row: ind[" + t + "] = " + k + "; basic auxiliary variable is not allowed");
            x = P.row[k].prim;
        }
        else
        {  /* x[k] is structural variable */
            if (P.col[k-P.m].stat == GLP_BS)
                xerror("glp_analyze_row: ind[" + t + "] = " + k + "; basic structural variable is not allowed");
            x = P.col[k-P.m].prim;
        }
        y += val[t] * x;
    }
    /* check if the row is primal infeasible in the current basis,
     i.e. the constraint is violated at the current point */
    if (type == GLP_LO)
    {  if (y >= rhs)
    {  /* the constraint is not violated */
        ret = 1;
        return ret;
    }
        /* in the adjacent basis y goes to its lower bound */
        dir = +1;
    }
    else if (type == GLP_UP)
    {  if (y <= rhs)
    {  /* the constraint is not violated */
        ret = 1;
        return ret;
    }
        /* in the adjacent basis y goes to its upper bound */
        dir = -1;
    }
    else
        xerror("glp_analyze_row: type = " + type + "; invalid parameter");
    /* compute dy = y.new - y.old */
    dy = rhs - y;
    /* perform dual ratio test to determine which non-basic variable
     should enter the adjacent basis to keep it dual feasible */
    piv = glp_dual_rtest(P, len, ind, val, dir, eps);
    if (piv == 0)
    {  /* no dual feasible adjacent basis exists */
        ret = 2;
        return ret;
    }
    /* non-basic variable x[k] = xN[j] should enter the basis */
    k = ind[piv];
    xassert(1 <= k && k <= P.m+P.n);
    /* determine its value in the current basis */
    if (k <= P.m)
        x = P.row[k].prim;
    else
        x = P.col[k-P.m].prim;
    /* compute dx = x.new - x.old = dy / alfa[j] */
    xassert(val[piv] != 0.0);
    dx = dy / val[piv];
    /* compute dz = z.new - z.old = d[j] * dx, where d[j] is reduced
     cost of xN[j] in the current basis */
    if (k <= P.m)
        dz = P.row[k].dual * dx;
    else
        dz = P.col[k-P.m].dual * dx;
    /* store the analysis results */

    callback(piv, x, dx, y, dy, dz);
    return ret;
}

var glp_analyze_bound = exports.glp_analyze_bound = function(P, k, callback){
    var row;
    var col;
    var  m, n, stat, kase, p, len, piv, ind;
    var  x, new_x, ll, uu, xx, delta, val;
    var value1, var1, value2, var2;
    value1 = var1 = value2 = var2 = null;

    function store(){
        /* store analysis results */
        if (kase < 0)
        {  value1 = new_x;
            var1 = p;
        }
        else
        {  value2 = new_x;
            var2 = p;
        }
    }

    /* sanity checks */
    if (P == null || P.magic != GLP_PROB_MAGIC)
        xerror("glp_analyze_bound: P = " + P + "; invalid problem object");
    m = P.m; n = P.n;
    if (!(P.pbs_stat == GLP_FEAS && P.dbs_stat == GLP_FEAS))
        xerror("glp_analyze_bound: optimal basic solution required");
    if (!(m == 0 || P.valid))
        xerror("glp_analyze_bound: basis factorization required");
    if (!(1 <= k && k <= m+n))
        xerror("glp_analyze_bound: k = " + k + "; variable number out of range");
    /* retrieve information about the specified non-basic variable
     x[k] whose active bound is to be analyzed */
    if (k <= m)
    {  row = P.row[k];
        stat = row.stat;
        x = row.prim;
    }
    else
    {  col = P.col[k-m];
        stat = col.stat;
        x = col.prim;
    }
    if (stat == GLP_BS)
        xerror("glp_analyze_bound: k = " + k + "; basic variable not allowed ");
    /* allocate working arrays */
    ind = new Array(1+m);
    val = new Array(1+m);
    /* compute column of the simplex table corresponding to the
     non-basic variable x[k] */
    len = glp_eval_tab_col(P, k, ind, val);
    xassert(0 <= len && len <= m);
    /* perform analysis */
    for (kase = -1; kase <= +1; kase += 2)
    {  /* kase < 0 means active bound of x[k] is decreasing;
     kase > 0 means active bound of x[k] is increasing */
        /* use the primal ratio test to determine some basic variable
         x[p] which reaches its bound first */
        piv = glp_prim_rtest(P, len, ind, val, kase, 1e-9);
        if (piv == 0)
        {  /* nothing limits changing the active bound of x[k] */
            p = 0;
            new_x = (kase < 0 ? -DBL_MAX : +DBL_MAX);
            store();
            continue;
        }
        /* basic variable x[p] limits changing the active bound of
         x[k]; determine its value in the current basis */
        xassert(1 <= piv && piv <= len);
        p = ind[piv];
        if (p <= m)
        {  row = P.row[p];
            ll = glp_get_row_lb(P, row.i);
            uu = glp_get_row_ub(P, row.i);
            stat = row.stat;
            xx = row.prim;
        }
        else
        {  col = P.col[p-m];
            ll = glp_get_col_lb(P, col.j);
            uu = glp_get_col_ub(P, col.j);
            stat = col.stat;
            xx = col.prim;
        }
        xassert(stat == GLP_BS);
        /* determine delta x[p] = bound of x[p] - value of x[p] */
        if (kase < 0 && val[piv] > 0.0 ||
            kase > 0 && val[piv] < 0.0)
        {  /* delta x[p] < 0, so x[p] goes toward its lower bound */
            xassert(ll != -DBL_MAX);
            delta = ll - xx;
        }
        else
        {  /* delta x[p] > 0, so x[p] goes toward its upper bound */
            xassert(uu != +DBL_MAX);
            delta = uu - xx;
        }
        /* delta x[p] = alfa[p,k] * delta x[k], so new x[k] = x[k] +
         delta x[k] = x[k] + delta x[p] / alfa[p,k] is the value of
         x[k] in the adjacent basis */
        xassert(val[piv] != 0.0);
        new_x = x + delta / val[piv];
        store();
    }
    callback(value1, var1, value2, var2)
};

var glp_analyze_coef = exports.glp_analyze_coef = function(P, k, out){
    var row, col;
    var m, n, type, stat, kase, p, q, dir, clen, cpiv, rlen, rpiv, cind, rind;
    var lb, ub, coef, x, lim_coef, new_x, d, delta, ll, uu, xx, rval, cval;
    var coef1 = null, var1 = null, value1 = null, coef2 = null, var2 = null, value2 = null;

    function store(){
        /* store analysis results */
        if (kase < 0)
        {   coef1 = lim_coef;
            var1 = q;
            value1 = new_x;
        }
        else
        {   coef2 = lim_coef;
            var2 = q;
            value2 = new_x;
        }
    }

    /* sanity checks */
    if (P == null || P.magic != GLP_PROB_MAGIC)
        xerror("glp_analyze_coef: P = " + P + "; invalid problem object");
    m = P.m;
    n = P.n;
    if (!(P.pbs_stat == GLP_FEAS && P.dbs_stat == GLP_FEAS))
        xerror("glp_analyze_coef: optimal basic solution required");
    if (!(m == 0 || P.valid))
        xerror("glp_analyze_coef: basis factorization required");
    if (!(1 <= k && k <= m+n))
        xerror("glp_analyze_coef: k = " + k + "; variable number out of range");
    /* retrieve information about the specified basic variable x[k]
     whose objective coefficient c[k] is to be analyzed */
    if (k <= m)
    {  row = P.row[k];
        type = row.type;
        lb = row.lb;
        ub = row.ub;
        coef = 0.0;
        stat = row.stat;
        x = row.prim;
    }
    else
    {  col = P.col[k-m];
        type = col.type;
        lb = col.lb;
        ub = col.ub;
        coef = col.coef;
        stat = col.stat;
        x = col.prim;
    }
    if (stat != GLP_BS)
        xerror("glp_analyze_coef: k = " + k + "; non-basic variable not allowed");
    /* allocate working arrays */
    cind = new Array(1+m);
    cval = new Array(1+m);
    rind = new Array(1+n);
    rval = new Array(1+n);
    /* compute row of the simplex table corresponding to the basic
     variable x[k] */
    rlen = glp_eval_tab_row(P, k, rind, rval);
    xassert(0 <= rlen && rlen <= n);
    /* perform analysis */
    for (kase = -1; kase <= +1; kase += 2)
    {  /* kase < 0 means objective coefficient c[k] is decreasing;
     kase > 0 means objective coefficient c[k] is increasing */
        /* note that decreasing c[k] is equivalent to increasing dual
         variable lambda[k] and vice versa; we need to correctly set
         the dir flag as required by the routine glp_dual_rtest */
        if (P.dir == GLP_MIN)
            dir = - kase;
        else if (P.dir == GLP_MAX)
            dir = + kase;
        else
            xassert(P != P);
        /* use the dual ratio test to determine non-basic variable
         x[q] whose reduced cost d[q] reaches zero bound first */
        rpiv = glp_dual_rtest(P, rlen, rind, rval, dir, 1e-9);
        if (rpiv == 0)
        {  /* nothing limits changing c[k] */
            lim_coef = (kase < 0 ? -DBL_MAX : +DBL_MAX);
            q = 0;
            /* x[k] keeps its current value */
            new_x = x;
            store();
            continue;
        }
        /* non-basic variable x[q] limits changing coefficient c[k];
         determine its status and reduced cost d[k] in the current
         basis */
        xassert(1 <= rpiv && rpiv <= rlen);
        q = rind[rpiv];
        xassert(1 <= q && q <= m+n);
        if (q <= m)
        {  row = P.row[q];
            stat = row.stat;
            d = row.dual;
        }
        else
        {  col = P.col[q-m];
            stat = col.stat;
            d = col.dual;
        }
        /* note that delta d[q] = new d[q] - d[q] = - d[q], because
         new d[q] = 0; delta d[q] = alfa[k,q] * delta c[k], so
         delta c[k] = delta d[q] / alfa[k,q] = - d[q] / alfa[k,q] */
        xassert(rval[rpiv] != 0.0);
        delta = - d / rval[rpiv];
        /* compute new c[k] = c[k] + delta c[k], which is the limiting
         value of the objective coefficient c[k] */
        lim_coef = coef + delta;
        /* let c[k] continue decreasing/increasing that makes d[q]
         dual infeasible and forces x[q] to enter the basis;
         to perform the primal ratio test we need to know in which
         direction x[q] changes on entering the basis; we determine
         that analyzing the sign of delta d[q] (see above), since
         d[q] may be close to zero having wrong sign */
        /* let, for simplicity, the problem is minimization */
        if (kase < 0 && rval[rpiv] > 0.0 ||
            kase > 0 && rval[rpiv] < 0.0)
        {  /* delta d[q] < 0, so d[q] being non-negative will become
         negative, so x[q] will increase */
            dir = +1;
        }
        else
        {  /* delta d[q] > 0, so d[q] being non-positive will become
         positive, so x[q] will decrease */
            dir = -1;
        }
        /* if the problem is maximization, correct the direction */
        if (P.dir == GLP_MAX) dir = - dir;
        /* check that we didn't make a silly mistake */
        if (dir > 0)
            xassert(stat == GLP_NL || stat == GLP_NF);
        else
            xassert(stat == GLP_NU || stat == GLP_NF);
        /* compute column of the simplex table corresponding to the
         non-basic variable x[q] */
        clen = glp_eval_tab_col(P, q, cind, cval);
        /* make x[k] temporarily free (unbounded) */
        if (k <= m)
        {  row = P.row[k];
            row.type = GLP_FR;
            row.lb = row.ub = 0.0;
        }
        else
        {  col = P.col[k-m];
            col.type = GLP_FR;
            col.lb = col.ub = 0.0;
        }
        /* use the primal ratio test to determine some basic variable
         which leaves the basis */
        cpiv = glp_prim_rtest(P, clen, cind, cval, dir, 1e-9);
        /* restore original bounds of the basic variable x[k] */
        if (k <= m)
        {  row = P.row[k];
            row.type = type;
            row.lb = lb;
            row.ub = ub;
        }
        else
        {  col = P.col[k-m];
            col.type = type;
            col.lb = lb;
            col.ub = ub;
        }
        if (cpiv == 0)
        {  /* non-basic variable x[q] can change unlimitedly */
            if (dir < 0 && rval[rpiv] > 0.0 ||
                dir > 0 && rval[rpiv] < 0.0)
            {  /* delta x[k] = alfa[k,q] * delta x[q] < 0 */
                new_x = -DBL_MAX;
            }
            else
            {  /* delta x[k] = alfa[k,q] * delta x[q] > 0 */
                new_x = +DBL_MAX;
            }
            store();
            continue;
        }
        /* some basic variable x[p] limits changing non-basic variable
         x[q] in the adjacent basis */
        xassert(1 <= cpiv && cpiv <= clen);
        p = cind[cpiv];
        xassert(1 <= p && p <= m+n);
        xassert(p != k);
        if (p <= m)
        {  row = P.row[p];
            xassert(row.stat == GLP_BS);
            ll = glp_get_row_lb(P, row.i);
            uu = glp_get_row_ub(P, row.i);
            xx = row.prim;
        }
        else
        {  col = P.col[p-m];
            xassert(col.stat == GLP_BS);
            ll = glp_get_col_lb(P, col.j);
            uu = glp_get_col_ub(P, col.j);
            xx = col.prim;
        }
        /* determine delta x[p] = new x[p] - x[p] */
        if (dir < 0 && cval[cpiv] > 0.0 ||
            dir > 0 && cval[cpiv] < 0.0)
        {  /* delta x[p] < 0, so x[p] goes toward its lower bound */
            xassert(ll != -DBL_MAX);
            delta = ll - xx;
        }
        else
        {  /* delta x[p] > 0, so x[p] goes toward its upper bound */
            xassert(uu != +DBL_MAX);
            delta = uu - xx;
        }
        /* compute new x[k] = x[k] + alfa[k,q] * delta x[q], where
         delta x[q] = delta x[p] / alfa[p,q] */
        xassert(cval[cpiv] != 0.0);
        new_x = x + (rval[rpiv] / cval[cpiv]) * delta;
        store();
    }
    callback(coef1, var1, value1, coef2, var2, value2)
};
