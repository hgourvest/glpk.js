
const _MIR_DEBUG = 0;

const MAXAGGR = 5;
/* maximal number of rows which can be aggregated */

function ios_mir_init(tree){
    function set_row_attrib(tree, mir){
        /* set global row attributes */
        var mip = tree.mip;
        var m = mir.m;
        var k;
        for (k = 1; k <= m; k++)
        {  var row = mip.row[k];
            mir.skip[k] = 0;
            mir.isint[k] = 0;
            switch (row.type)
            {  case GLP_FR:
                mir.lb[k] = -DBL_MAX; mir.ub[k] = +DBL_MAX; break;
                case GLP_LO:
                    mir.lb[k] = row.lb; mir.ub[k] = +DBL_MAX; break;
                case GLP_UP:
                    mir.lb[k] = -DBL_MAX; mir.ub[k] = row.ub; break;
                case GLP_DB:
                    mir.lb[k] = row.lb; mir.ub[k] = row.ub; break;
                case GLP_FX:
                    mir.lb[k] = mir.ub[k] = row.lb; break;
                default:
                    xassert(row != row);
            }
            mir.vlb[k] = mir.vub[k] = 0;
        }
    }

    function set_col_attrib(tree, mir){
        /* set global column attributes */
        var mip = tree.mip;
        var m = mir.m;
        var n = mir.n;
        var k;
        for (k = m+1; k <= m+n; k++)
        {  var col = mip.col[k-m];
            switch (col.kind)
            {  case GLP_CV:
                mir.isint[k] = 0; break;
                case GLP_IV:
                    mir.isint[k] = 1; break;
                default:
                    xassert(col != col);
            }
            switch (col.type)
            {  case GLP_FR:
                mir.lb[k] = -DBL_MAX; mir.ub[k] = +DBL_MAX; break;
                case GLP_LO:
                    mir.lb[k] = col.lb; mir.ub[k] = +DBL_MAX; break;
                case GLP_UP:
                    mir.lb[k] = -DBL_MAX; mir.ub[k] = col.ub; break;
                case GLP_DB:
                    mir.lb[k] = col.lb; mir.ub[k] = col.ub; break;
                case GLP_FX:
                    mir.lb[k] = mir.ub[k] = col.lb; break;
                default:
                    xassert(col != col);
            }
            mir.vlb[k] = mir.vub[k] = 0;
        }
    }

    function set_var_bounds(tree, mir){
        /* set variable bounds */
        var mip = tree.mip;
        var m = mir.m;
        var aij;
        var i, k1, k2;
        var a1, a2;
        for (i = 1; i <= m; i++)
        {  /* we need the row to be '>= 0' or '<= 0' */
            if (!(mir.lb[i] == 0.0 && mir.ub[i] == +DBL_MAX ||
                mir.lb[i] == -DBL_MAX && mir.ub[i] == 0.0)) continue;
            /* take first term */
            aij = mip.row[i].ptr;
            if (aij == null) continue;
            k1 = m + aij.col.j; a1 = aij.val;
            /* take second term */
            aij = aij.r_next;
            if (aij == null) continue;
            k2 = m + aij.col.j; a2 = aij.val;
            /* there must be only two terms */
            if (aij.r_next != null) continue;
            /* interchange terms, if needed */
            if (!mir.isint[k1] && mir.isint[k2]){

            }
            else if (mir.isint[k1] && !mir.isint[k2])
            {  k2 = k1; a2 = a1;
                k1 = m + aij.col.j; a1 = aij.val;
            }
            else
            {  /* both terms are either continuous or integer */
                continue;
            }
            /* x[k2] should be double-bounded */
            if (mir.lb[k2] == -DBL_MAX || mir.ub[k2] == +DBL_MAX ||
                mir.lb[k2] == mir.ub[k2]) continue;
            /* change signs, if necessary */
            if (mir.ub[i] == 0.0){a1 = - a1; a2 = - a2}
            /* now the row has the form a1 * x1 + a2 * x2 >= 0, where x1
             is continuous, x2 is integer */
            if (a1 > 0.0)
            {  /* x1 >= - (a2 / a1) * x2 */
                if (mir.vlb[k1] == 0)
                {  /* set variable lower bound for x1 */
                    mir.lb[k1] = - a2 / a1;
                    mir.vlb[k1] = k2;
                    /* the row should not be used */
                    mir.skip[i] = 1;
                }
            }
            else /* a1 < 0.0 */
            {  /* x1 <= - (a2 / a1) * x2 */
                if (mir.vub[k1] == 0)
                {  /* set variable upper bound for x1 */
                    mir.ub[k1] = - a2 / a1;
                    mir.vub[k1] = k2;
                    /* the row should not be used */
                    mir.skip[i] = 1;
                }
            }
        }
    }

    function mark_useless_rows(tree, mir){
        /* mark rows which should not be used */
        var mip = tree.mip;
        var m = mir.m;
        var aij;
        var i, k, nv;
        for (i = 1; i <= m; i++)
        {  /* free rows should not be used */
            if (mir.lb[i] == -DBL_MAX && mir.ub[i] == +DBL_MAX)
            {  mir.skip[i] = 1;
                continue;
            }
            nv = 0;
            for (aij = mip.row[i].ptr; aij != null; aij = aij.r_next)
            {  k = m + aij.col.j;
                /* rows with free variables should not be used */
                if (mir.lb[k] == -DBL_MAX && mir.ub[k] == +DBL_MAX)
                {  mir.skip[i] = 1;
                    break;
                }
                /* rows with integer variables having infinite (lower or
                 upper) bound should not be used */
                if (mir.isint[k] && mir.lb[k] == -DBL_MAX ||
                    mir.isint[k] && mir.ub[k] == +DBL_MAX)
                {  mir.skip[i] = 1;
                    break;
                }
                /* count non-fixed variables */
                if (!(mir.vlb[k] == 0 && mir.vub[k] == 0 &&
                    mir.lb[k] == mir.ub[k])) nv++;
            }
            /* rows with all variables fixed should not be used */
            if (nv == 0)
            {  mir.skip[i] = 1;
                //continue;
            }
        }
    }

    /* initialize MIR cut generator */
    var mip = tree.mip;
    var m = mip.m;
    var n = mip.n;
    var mir;
    if (_MIR_DEBUG){
        xprintf("ios_mir_init: warning: debug mode enabled");
    }
    /* allocate working area */
    mir = {};
    mir.m = m;
    mir.n = n;
    mir.skip = new Array(1+m);
    mir.isint = new Array(1+m+n);
    mir.lb = new Array(1+m+n);
    mir.vlb = new Array(1+m+n);
    mir.ub = new Array(1+m+n);
    mir.vub = new Array(1+m+n);
    mir.x = new Array(1+m+n);
    mir.agg_row = new Array(1+MAXAGGR);
    mir.agg_vec = ios_create_vec(m+n);
    mir.subst = new Array(1+m+n);
    mir.mod_vec = ios_create_vec(m+n);
    mir.cut_vec = ios_create_vec(m+n);
    /* set global row attributes */
    set_row_attrib(tree, mir);
    /* set global column attributes */
    set_col_attrib(tree, mir);
    /* set variable bounds */
    set_var_bounds(tree, mir);
    /* mark rows which should not be used */
    mark_useless_rows(tree, mir);
    return mir;
}

function ios_mir_gen(tree, mir){

    var beta, gamma;

    function cmir_sep(n, a, b, u, x, s, alpha){

        function cmir_cmp(v1, v2){
            if (v1.v < v2.v) return -1;
            if (v1.v > v2.v) return +1;
            return 0;
        }

        function cmir_ineq(n, a, b, u, cset, delta, alpha){

            function mir_ineq(n, a, b, alpha){
                var j;
                var f, t;
                if (Math.abs(b - Math.floor(b + .5)) < 0.01)
                    return 1;
                f = b - Math.floor(b);
                for (j = 1; j <= n; j++)
                {  t = (a[j] - Math.floor(a[j])) - f;
                    if (t <= 0.0)
                        alpha[j] = Math.floor(a[j]);
                    else
                        alpha[j] = Math.floor(a[j]) + t / (1.0 - f);
                }
                beta = Math.floor(b);
                gamma = 1.0 / (1.0 - f);
                return 0;
            }


            var j;
            var aa, bb;

            aa = alpha; bb = b;
            for (j = 1; j <= n; j++)
            {  aa[j] = a[j] / delta;
                if (cset[j])
                    aa[j] = - aa[j]; bb -= a[j] * u[j];
            }
            bb /= delta;
            if (mir_ineq(n, aa, bb, alpha)) return 1;
            for (j = 1; j <= n; j++)
            {  if (cset[j]){
                alpha[j] = - alpha[j];
                beta += alpha[j] * u[j];
            }

            }
            gamma /= delta;
            return 0;
        }

        var fail, j, k, nv, v;
        var delta, eps, d_try = new Array(1+3), r, r_best;
        var cset;
        var vset;

        /* allocate working arrays */
        cset = new Array(1+n);
        vset = new Array(1+n);
        /* choose initial C */
        for (j = 1; j <= n; j++)
            cset[j] = (x[j] >= 0.5 * u[j]);
        /* choose initial delta */
        r_best = delta = 0.0;
        for (j = 1; j <= n; j++)
        {  xassert(a[j] != 0.0);
            /* if x[j] is close to its bounds, skip it */
            eps = 1e-9 * (1.0 + Math.abs(u[j]));
            if (x[j] < eps || x[j] > u[j] - eps) continue;
            /* try delta = |a[j]| to construct c-MIR inequality */
            fail = cmir_ineq(n, a, b, u, cset, Math.abs(a[j]), alpha);
            if (fail) continue;
            /* compute violation */
            r = - beta - gamma * s;
            for (k = 1; k <= n; k++) r += alpha[k] * x[k];
            if (r_best < r){r_best = r; delta = Math.abs(a[j])}
        }
        if (r_best < 0.001) r_best = 0.0;
        if (r_best == 0.0) return r_best;
        xassert(delta > 0.0);
        /* try to increase violation by dividing delta by 2, 4, and 8,
         respectively */
        d_try[1] = delta / 2.0;
        d_try[2] = delta / 4.0;
        d_try[3] = delta / 8.0;
        for (j = 1; j <= 3; j++)
        {  /* construct c-MIR inequality */
            fail = cmir_ineq(n, a, b, u, cset, d_try[j], alpha);
            if (fail) continue;
            /* compute violation */
            r = - beta - gamma * s;
            for (k = 1; k <= n; k++) r += alpha[k] * x[k];
            if (r_best < r){r_best = r; delta = d_try[j]}
        }
        /* build subset of variables lying strictly between their bounds
         and order it by nondecreasing values of |x[j] - u[j]/2| */
        nv = 0;
        for (j = 1; j <= n; j++)
        {  /* if x[j] is close to its bounds, skip it */
            eps = 1e-9 * (1.0 + Math.abs(u[j]));
            if (x[j] < eps || x[j] > u[j] - eps) continue;
            /* add x[j] to the subset */
            nv++;
            vset[nv].j = j;
            vset[nv].v = Math.abs(x[j] - 0.5 * u[j]);
        }
        xqsort(vset, 1, nv, cmir_cmp);
        /* try to increase violation by successively complementing each
         variable in the subset */
        for (v = 1; v <= nv; v++)
        {  j = vset[v].j;
            /* replace x[j] by its complement or vice versa */
            cset[j] = !cset[j];
            /* construct c-MIR inequality */
            fail = cmir_ineq(n, a, b, u, cset, delta, alpha);
            /* restore the variable */
            cset[j] = !cset[j];
            /* do not replace the variable in case of failure */
            if (fail) continue;
            /* compute violation */
            r = - beta - gamma * s;
            for (k = 1; k <= n; k++) r += alpha[k] * x[k];
            if (r_best < r){r_best = r; cset[j] = !cset[j]}
        }
        /* construct the best c-MIR inequality chosen */
        fail = cmir_ineq(n, a, b, u, cset, delta, alpha);
        xassert(!fail);
        /* return to the calling routine */
        return r_best;
    }

    function get_current_point(tree, mir){
        /* obtain current point */
        var mip = tree.mip;
        var m = mir.m;
        var n = mir.n;
        var k;
        for (k = 1; k <= m; k++)
            mir.x[k] = mip.row[k].prim;
        for (k = m+1; k <= m+n; k++)
            mir.x[k] = mip.col[k-m].prim;
    }

    if (_MIR_DEBUG){
        function check_current_point(mir){
            /* check current point */
            var m = mir.m;
            var n = mir.n;
            var k, kk;
            var lb, ub, eps;
            for (k = 1; k <= m+n; k++)
            {  /* determine lower bound */
                lb = mir.lb[k];
                kk = mir.vlb[k];
                if (kk != 0)
                {  xassert(lb != -DBL_MAX);
                    xassert(!mir.isint[k]);
                    xassert(mir.isint[kk]);
                    lb *= mir.x[kk];
                }
                /* check lower bound */
                if (lb != -DBL_MAX)
                {  eps = 1e-6 * (1.0 + Math.abs(lb));
                    xassert(mir.x[k] >= lb - eps);
                }
                /* determine upper bound */
                ub = mir.ub[k];
                kk = mir.vub[k];
                if (kk != 0)
                {  xassert(ub != +DBL_MAX);
                    xassert(!mir.isint[k]);
                    xassert(mir.isint[kk]);
                    ub *= mir.x[kk];
                }
                /* check upper bound */
                if (ub != +DBL_MAX)
                {  eps = 1e-6 * (1.0 + Math.abs(ub));
                    xassert(mir.x[k] <= ub + eps);
                }
            }
        }
    }

    function initial_agg_row(tree, mir, i){
        /* use original i-th row as initial aggregated constraint */
        var mip = tree.mip;
        var m = mir.m;
        var aij;
        xassert(1 <= i && i <= m);
        xassert(!mir.skip[i]);
        /* mark i-th row in order not to use it in the same aggregated
         constraint */
        mir.skip[i] = 2;
        mir.agg_cnt = 1;
        mir.agg_row[1] = i;
        /* use x[i] - sum a[i,j] * x[m+j] = 0, where x[i] is auxiliary
         variable of row i, x[m+j] are structural variables */
        ios_clear_vec(mir.agg_vec);
        ios_set_vj(mir.agg_vec, i, 1.0);
        for (aij = mip.row[i].ptr; aij != null; aij = aij.r_next)
            ios_set_vj(mir.agg_vec, m + aij.col.j, - aij.val);
        mir.agg_rhs = 0.0;
        if (_MIR_DEBUG){
            ios_check_vec(mir.agg_vec);
        }
    }

    if (_MIR_DEBUG){
        function check_agg_row(mir)
        {     /* check aggregated constraint */
            var m = mir.m;
            var n = mir.n;
            var j, k;
            var r, big;
            /* compute the residual r = sum a[k] * x[k] - b and determine
             big = max(1, |a[k]|, |b|) */
            r = 0.0; big = 1.0;
            for (j = 1; j <= mir.agg_vec.nnz; j++)
            {  k = mir.agg_vec.ind[j];
                xassert(1 <= k && k <= m+n);
                r += mir.agg_vec.val[j] * mir.x[k];
                if (big < Math.abs(mir.agg_vec.val[j]))
                    big = Math.abs(mir.agg_vec.val[j]);
            }
            r -= mir.agg_rhs;
            if (big < Math.abs(mir.agg_rhs))
                big = Math.abs(mir.agg_rhs);
            /* the residual must be close to zero */
            xassert(Math.abs(r) <= 1e-6 * big);
        }
    }

    function subst_fixed_vars(mir){
        /* substitute fixed variables into aggregated constraint */
        var m = mir.m;
        var n = mir.n;
        var j, k;
        for (j = 1; j <= mir.agg_vec.nnz; j++)
        {  k = mir.agg_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (mir.vlb[k] == 0 && mir.vub[k] == 0 &&
                mir.lb[k] == mir.ub[k])
            {  /* x[k] is fixed */
                mir.agg_rhs -= mir.agg_vec.val[j] * mir.lb[k];
                mir.agg_vec.val[j] = 0.0;
            }
        }
        /* remove terms corresponding to fixed variables */
        ios_clean_vec(mir.agg_vec, DBL_EPSILON);
        if (_MIR_DEBUG){
            ios_check_vec(mir.agg_vec);
        }
    }

    function bound_subst_heur(mir){
        /* bound substitution heuristic */
        var m = mir.m;
        var n = mir.n;
        var j, k, kk;
        var d1, d2;
        for (j = 1; j <= mir.agg_vec.nnz; j++)
        {  k = mir.agg_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (mir.isint[k]) continue; /* skip integer variable */
            /* compute distance from x[k] to its lower bound */
            kk = mir.vlb[k];
            if (kk == 0)
            {  if (mir.lb[k] == -DBL_MAX)
                d1 = DBL_MAX;
            else
                d1 = mir.x[k] - mir.lb[k];
            }
            else
            {  xassert(1 <= kk && kk <= m+n);
                xassert(mir.isint[kk]);
                xassert(mir.lb[k] != -DBL_MAX);
                d1 = mir.x[k] - mir.lb[k] * mir.x[kk];
            }
            /* compute distance from x[k] to its upper bound */
            kk = mir.vub[k];
            if (kk == 0)
            {  if (mir.vub[k] == +DBL_MAX)
                d2 = DBL_MAX;
            else
                d2 = mir.ub[k] - mir.x[k];
            }
            else
            {  xassert(1 <= kk && kk <= m+n);
                xassert(mir.isint[kk]);
                xassert(mir.ub[k] != +DBL_MAX);
                d2 = mir.ub[k] * mir.x[kk] - mir.x[k];
            }
            /* x[k] cannot be free */
            xassert(d1 != DBL_MAX || d2 != DBL_MAX);
            /* choose the bound which is closer to x[k] */
            xassert(mir.subst[k] == '?');
            if (d1 <= d2)
                mir.subst[k] = 'L';
            else
                mir.subst[k] = 'U';
        }
    }

    function build_mod_row(mir){
        /* substitute bounds and build modified constraint */
        var m = mir.m;
        var n = mir.n;
        var j, jj, k, kk;
        /* initially modified constraint is aggregated constraint */
        ios_copy_vec(mir.mod_vec, mir.agg_vec);
        mir.mod_rhs = mir.agg_rhs;
        if (_MIR_DEBUG){
            ios_check_vec(mir.mod_vec);
        }
        /* substitute bounds for continuous variables; note that due to
         substitution of variable bounds additional terms may appear in
         modified constraint */
        for (j = mir.mod_vec.nnz; j >= 1; j--)
        {  k = mir.mod_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (mir.isint[k]) continue; /* skip integer variable */
            if (mir.subst[k] == 'L')
            {  /* x[k] = (lower bound) + x'[k] */
                xassert(mir.lb[k] != -DBL_MAX);
                kk = mir.vlb[k];
                if (kk == 0)
                {  /* x[k] = lb[k] + x'[k] */
                    mir.mod_rhs -= mir.mod_vec.val[j] * mir.lb[k];
                }
                else
                {  /* x[k] = lb[k] * x[kk] + x'[k] */
                    xassert(mir.isint[kk]);
                    jj = mir.mod_vec.pos[kk];
                    if (jj == 0)
                    {  ios_set_vj(mir.mod_vec, kk, 1.0);
                        jj = mir.mod_vec.pos[kk];
                        mir.mod_vec.val[jj] = 0.0;
                    }
                    mir.mod_vec.val[jj] +=
                        mir.mod_vec.val[j] * mir.lb[k];
                }
            }
            else if (mir.subst[k] == 'U')
            {  /* x[k] = (upper bound) - x'[k] */
                xassert(mir.ub[k] != +DBL_MAX);
                kk = mir.vub[k];
                if (kk == 0)
                {  /* x[k] = ub[k] - x'[k] */
                    mir.mod_rhs -= mir.mod_vec.val[j] * mir.ub[k];
                }
                else
                {  /* x[k] = ub[k] * x[kk] - x'[k] */
                    xassert(mir.isint[kk]);
                    jj = mir.mod_vec.pos[kk];
                    if (jj == 0)
                    {  ios_set_vj(mir.mod_vec, kk, 1.0);
                        jj = mir.mod_vec.pos[kk];
                        mir.mod_vec.val[jj] = 0.0;
                    }
                    mir.mod_vec.val[jj] +=
                        mir.mod_vec.val[j] * mir.ub[k];
                }
                mir.mod_vec.val[j] = - mir.mod_vec.val[j];
            }
            else
                xassert(k != k);
        }
        if (_MIR_DEBUG){
            ios_check_vec(mir.mod_vec);
        }
        /* substitute bounds for integer variables */
        for (j = 1; j <= mir.mod_vec.nnz; j++)
        {  k = mir.mod_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (!mir.isint[k]) continue; /* skip continuous variable */
            xassert(mir.subst[k] == '?');
            xassert(mir.vlb[k] == 0 && mir.vub[k] == 0);
            xassert(mir.lb[k] != -DBL_MAX && mir.ub[k] != +DBL_MAX);
            if (Math.abs(mir.lb[k]) <= Math.abs(mir.ub[k]))
            {  /* x[k] = lb[k] + x'[k] */
                mir.subst[k] = 'L';
                mir.mod_rhs -= mir.mod_vec.val[j] * mir.lb[k];
            }
            else
            {  /* x[k] = ub[k] - x'[k] */
                mir.subst[k] = 'U';
                mir.mod_rhs -= mir.mod_vec.val[j] * mir.ub[k];
                mir.mod_vec.val[j] = - mir.mod_vec.val[j];
            }
        }
        if (_MIR_DEBUG){
            ios_check_vec(mir.mod_vec);
        }
    }

    if (_MIR_DEBUG){
        function check_mod_row(mir){
            /* check modified constraint */
            var m = mir.m;
            var n = mir.n;
            var j, k, kk;
            var r, big, x;
            /* compute the residual r = sum a'[k] * x'[k] - b' and determine
             big = max(1, |a[k]|, |b|) */
            r = 0.0; big = 1.0;
            for (j = 1; j <= mir.mod_vec.nnz; j++)
            {  k = mir.mod_vec.ind[j];
                xassert(1 <= k && k <= m+n);
                if (mir.subst[k] == 'L')
                {  /* x'[k] = x[k] - (lower bound) */
                    xassert(mir.lb[k] != -DBL_MAX);
                    kk = mir.vlb[k];
                    if (kk == 0)
                        x = mir.x[k] - mir.lb[k];
                    else
                        x = mir.x[k] - mir.lb[k] * mir.x[kk];
                }
                else if (mir.subst[k] == 'U')
                {  /* x'[k] = (upper bound) - x[k] */
                    xassert(mir.ub[k] != +DBL_MAX);
                    kk = mir.vub[k];
                    if (kk == 0)
                        x = mir.ub[k] - mir.x[k];
                    else
                        x = mir.ub[k] * mir.x[kk] - mir.x[k];
                }
                else
                    xassert(k != k);
                r += mir.mod_vec.val[j] * x;
                if (big < Math.abs(mir.mod_vec.val[j]))
                    big = Math.abs(mir.mod_vec.val[j]);
            }
            r -= mir.mod_rhs;
            if (big < Math.abs(mir.mod_rhs))
                big = Math.abs(mir.mod_rhs);
            /* the residual must be close to zero */
            xassert(Math.abs(r) <= 1e-6 * big);
        }
    }

    function generate(mir){
        /* try to generate violated c-MIR cut for modified constraint */
        var m = mir.m;
        var n = mir.n;
        var j, k, kk, nint;
        var s, u, x, alpha, r_best = 0.0, b, beta = null, gamma = null;
        ios_copy_vec(mir.cut_vec, mir.mod_vec);
        mir.cut_rhs = mir.mod_rhs;
        /* remove small terms, which can appear due to substitution of
         variable bounds */
        ios_clean_vec(mir.cut_vec, DBL_EPSILON);
        if (_MIR_DEBUG){
            ios_check_vec(mir.cut_vec);
        }
        /* remove positive continuous terms to obtain MK relaxation */
        for (j = 1; j <= mir.cut_vec.nnz; j++)
        {  k = mir.cut_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (!mir.isint[k] && mir.cut_vec.val[j] > 0.0)
                mir.cut_vec.val[j] = 0.0;
        }
        ios_clean_vec(mir.cut_vec, 0.0);
        if (_MIR_DEBUG){
            ios_check_vec(mir.cut_vec);
        }
        /* move integer terms to the beginning of the sparse vector and
         determine the number of integer variables */
        nint = 0;
        for (j = 1; j <= mir.cut_vec.nnz; j++)
        {  k = mir.cut_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (mir.isint[k])
            {  var temp;
                nint++;
                /* interchange elements [nint] and [j] */
                kk = mir.cut_vec.ind[nint];
                mir.cut_vec.pos[k] = nint;
                mir.cut_vec.pos[kk] = j;
                mir.cut_vec.ind[nint] = k;
                mir.cut_vec.ind[j] = kk;
                temp = mir.cut_vec.val[nint];
                mir.cut_vec.val[nint] = mir.cut_vec.val[j];
                mir.cut_vec.val[j] = temp;
            }
        }
        if (_MIR_DEBUG){
            ios_check_vec(mir.cut_vec);
        }
        /* if there is no integer variable, nothing to generate */
        if (nint == 0) return r_best;
        /* allocate working arrays */
        u = new Array(1+nint);
        x = new Array(1+nint);
        alpha = new Array(1+nint);
        /* determine u and x */
        for (j = 1; j <= nint; j++)
        {  k = mir.cut_vec.ind[j];
            xassert(m+1 <= k && k <= m+n);
            xassert(mir.isint[k]);
            u[j] = mir.ub[k] - mir.lb[k];
            xassert(u[j] >= 1.0);
            if (mir.subst[k] == 'L')
                x[j] = mir.x[k] - mir.lb[k];
            else if (mir.subst[k] == 'U')
                x[j] = mir.ub[k] - mir.x[k];
            else
                xassert(k != k);
            xassert(x[j] >= -0.001);
            if (x[j] < 0.0) x[j] = 0.0;
        }
        /* compute s = - sum of continuous terms */
        s = 0.0;
        for (j = nint+1; j <= mir.cut_vec.nnz; j++)
        {
            k = mir.cut_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            /* must be continuous */
            xassert(!mir.isint[k]);
            if (mir.subst[k] == 'L')
            {  xassert(mir.lb[k] != -DBL_MAX);
                kk = mir.vlb[k];
                if (kk == 0)
                    x = mir.x[k] - mir.lb[k];
                else
                    x = mir.x[k] - mir.lb[k] * mir.x[kk];
            }
            else if (mir.subst[k] == 'U')
            {  xassert(mir.ub[k] != +DBL_MAX);
                kk = mir.vub[k];
                if (kk == 0)
                    x = mir.ub[k] - mir.x[k];
                else
                    x = mir.ub[k] * mir.x[kk] - mir.x[k];
            }
            else
                xassert(k != k);
            xassert(x >= -0.001);
            if (x < 0.0) x = 0.0;
            s -= mir.cut_vec.val[j] * x;
        }
        xassert(s >= 0.0);
        /* apply heuristic to obtain most violated c-MIR inequality */
        b = mir.cut_rhs;
        r_best = cmir_sep(nint, mir.cut_vec.val, b, u, x, s, alpha);
        if (r_best == 0.0) return r_best;
        xassert(r_best > 0.0);
        /* convert to raw cut */
        /* sum alpha[j] * x[j] <= beta + gamma * s */
        for (j = 1; j <= nint; j++)
            mir.cut_vec.val[j] = alpha[j];
        for (j = nint+1; j <= mir.cut_vec.nnz; j++)
        {  k = mir.cut_vec.ind[j];
            if (k <= m+n) mir.cut_vec.val[j] *= gamma;
        }
        mir.cut_rhs = beta;
        if (_MIR_DEBUG){
            ios_check_vec(mir.cut_vec);
        }
        return r_best;
    }

    if (_MIR_DEBUG){
        function check_raw_cut(mir, r_best){
            /* check raw cut before back bound substitution */
            var m = mir.m;
            var n = mir.n;
            var j, k, kk;
            var r, big, x;
            /* compute the residual r = sum a[k] * x[k] - b and determine
             big = max(1, |a[k]|, |b|) */
            r = 0.0; big = 1.0;
            for (j = 1; j <= mir.cut_vec.nnz; j++)
            {  k = mir.cut_vec.ind[j];
                xassert(1 <= k && k <= m+n);
                if (mir.subst[k] == 'L')
                {  xassert(mir.lb[k] != -DBL_MAX);
                    kk = mir.vlb[k];
                    if (kk == 0)
                        x = mir.x[k] - mir.lb[k];
                    else
                        x = mir.x[k] - mir.lb[k] * mir.x[kk];
                }
                else if (mir.subst[k] == 'U')
                {  xassert(mir.ub[k] != +DBL_MAX);
                    kk = mir.vub[k];
                    if (kk == 0)
                        x = mir.ub[k] - mir.x[k];
                    else
                        x = mir.ub[k] * mir.x[kk] - mir.x[k];
                }
                else
                    xassert(k != k);
                r += mir.cut_vec.val[j] * x;
                if (big < Math.abs(mir.cut_vec.val[j]))
                    big = Math.abs(mir.cut_vec.val[j]);
            }
            r -= mir.cut_rhs;
            if (big < Math.abs(mir.cut_rhs))
                big = Math.abs(mir.cut_rhs);
            /* the residual must be close to r_best */
            xassert(Math.abs(r - r_best) <= 1e-6 * big);
        }
    }

    function back_subst(mir){
        /* back substitution of original bounds */
        var m = mir.m;
        var n = mir.n;
        var j, jj, k, kk;
        /* at first, restore bounds of integer variables (because on
         restoring variable bounds of continuous variables we need
         original, not shifted, bounds of integer variables) */
        for (j = 1; j <= mir.cut_vec.nnz; j++)
        {  k = mir.cut_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (!mir.isint[k]) continue; /* skip continuous */
            if (mir.subst[k] == 'L')
            {  /* x'[k] = x[k] - lb[k] */
                xassert(mir.lb[k] != -DBL_MAX);
                xassert(mir.vlb[k] == 0);
                mir.cut_rhs += mir.cut_vec.val[j] * mir.lb[k];
            }
            else if (mir.subst[k] == 'U')
            {  /* x'[k] = ub[k] - x[k] */
                xassert(mir.ub[k] != +DBL_MAX);
                xassert(mir.vub[k] == 0);
                mir.cut_rhs -= mir.cut_vec.val[j] * mir.ub[k];
                mir.cut_vec.val[j] = - mir.cut_vec.val[j];
            }
            else
                xassert(k != k);
        }
        /* now restore bounds of continuous variables */
        for (j = 1; j <= mir.cut_vec.nnz; j++)
        {  k = mir.cut_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (mir.isint[k]) continue; /* skip integer */
            if (mir.subst[k] == 'L')
            {  /* x'[k] = x[k] - (lower bound) */
                xassert(mir.lb[k] != -DBL_MAX);
                kk = mir.vlb[k];
                if (kk == 0)
                {  /* x'[k] = x[k] - lb[k] */
                    mir.cut_rhs += mir.cut_vec.val[j] * mir.lb[k];
                }
                else
                {  /* x'[k] = x[k] - lb[k] * x[kk] */
                    jj = mir.cut_vec.pos[kk];
                    if (jj == 0)
                    {  ios_set_vj(mir.cut_vec, kk, 1.0);
                        jj = mir.cut_vec.pos[kk];
                        xassert(jj != 0);
                        mir.cut_vec.val[jj] = 0.0;
                    }
                    mir.cut_vec.val[jj] -= mir.cut_vec.val[j] *
                        mir.lb[k];
                }
            }
            else if (mir.subst[k] == 'U')
            {  /* x'[k] = (upper bound) - x[k] */
                xassert(mir.ub[k] != +DBL_MAX);
                kk = mir.vub[k];
                if (kk == 0)
                {  /* x'[k] = ub[k] - x[k] */
                    mir.cut_rhs -= mir.cut_vec.val[j] * mir.ub[k];
                }
                else
                {  /* x'[k] = ub[k] * x[kk] - x[k] */
                    jj = mir.cut_vec.pos[kk];
                    if (jj == 0)
                    {  ios_set_vj(mir.cut_vec, kk, 1.0);
                        jj = mir.cut_vec.pos[kk];
                        xassert(jj != 0);
                        mir.cut_vec.val[jj] = 0.0;
                    }
                    mir.cut_vec.val[jj] += mir.cut_vec.val[j] *
                        mir.ub[k];
                }
                mir.cut_vec.val[j] = - mir.cut_vec.val[j];
            }
            else
                xassert(k != k);
        }
        if (_MIR_DEBUG){
            ios_check_vec(mir.cut_vec);
        }
    }

    if (_MIR_DEBUG){
        function check_cut_row(mir, r_best){
            /* check the cut after back bound substitution or elimination of
             auxiliary variables */
            var m = mir.m;
            var n = mir.n;
            var j, k;
            var r, big;
            /* compute the residual r = sum a[k] * x[k] - b and determine
             big = max(1, |a[k]|, |b|) */
            r = 0.0; big = 1.0;
            for (j = 1; j <= mir.cut_vec.nnz; j++)
            {  k = mir.cut_vec.ind[j];
                xassert(1 <= k && k <= m+n);
                r += mir.cut_vec.val[j] * mir.x[k];
                if (big < Math.abs(mir.cut_vec.val[j]))
                    big = Math.abs(mir.cut_vec.val[j]);
            }
            r -= mir.cut_rhs;
            if (big < Math.abs(mir.cut_rhs))
                big = Math.abs(mir.cut_rhs);
            /* the residual must be close to r_best */
            xassert(Math.abs(r - r_best) <= 1e-6 * big);
        }
    }

    function subst_aux_vars(tree, mir){
        /* final substitution to eliminate auxiliary variables */
        var mip = tree.mip;
        var m = mir.m;
        var n = mir.n;
        var aij;
        var j, k, kk, jj;
        for (j = mir.cut_vec.nnz; j >= 1; j--)
        {  k = mir.cut_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (k > m) continue; /* skip structurals */
            for (aij = mip.row[k].ptr; aij != null; aij = aij.r_next)
            {  kk = m + aij.col.j; /* structural */
                jj = mir.cut_vec.pos[kk];
                if (jj == 0)
                {  ios_set_vj(mir.cut_vec, kk, 1.0);
                    jj = mir.cut_vec.pos[kk];
                    mir.cut_vec.val[jj] = 0.0;
                }
                mir.cut_vec.val[jj] += mir.cut_vec.val[j] * aij.val;
            }
            mir.cut_vec.val[j] = 0.0;
        }
        ios_clean_vec(mir.cut_vec, 0.0);
    }

    function add_cut(tree, mir){
        /* add constructed cut inequality to the cut pool */
        var m = mir.m;
        var n = mir.n;
        var j, k, len;
        var ind = new Array(1+n);
        var val = new Array(1+n);
        len = 0;
        for (j = mir.cut_vec.nnz; j >= 1; j--)
        {  k = mir.cut_vec.ind[j];
            xassert(m+1 <= k && k <= m+n);
            len++; ind[len] = k - m; val[len] = mir.cut_vec.val[j];
        }
        glp_ios_add_row(tree, null, GLP_RF_MIR, 0, len, ind, val, GLP_UP,
            mir.cut_rhs);
    }

    function aggregate_row(tree, mir){
        /* try to aggregate another row */
        var mip = tree.mip;
        var m = mir.m;
        var n = mir.n;
        var aij;
        var v;
        var ii, j, jj, k, kk, kappa = 0, ret = 0;
        var d1, d2, d, d_max = 0.0;
        /* choose appropriate structural variable in the aggregated row
         to be substituted */
        for (j = 1; j <= mir.agg_vec.nnz; j++)
        {  k = mir.agg_vec.ind[j];
            xassert(1 <= k && k <= m+n);
            if (k <= m) continue; /* skip auxiliary var */
            if (mir.isint[k]) continue; /* skip integer var */
            if (Math.abs(mir.agg_vec.val[j]) < 0.001) continue;
            /* compute distance from x[k] to its lower bound */
            kk = mir.vlb[k];
            if (kk == 0)
            {  if (mir.lb[k] == -DBL_MAX)
                d1 = DBL_MAX;
            else
                d1 = mir.x[k] - mir.lb[k];
            }
            else
            {  xassert(1 <= kk && kk <= m+n);
                xassert(mir.isint[kk]);
                xassert(mir.lb[k] != -DBL_MAX);
                d1 = mir.x[k] - mir.lb[k] * mir.x[kk];
            }
            /* compute distance from x[k] to its upper bound */
            kk = mir.vub[k];
            if (kk == 0)
            {  if (mir.vub[k] == +DBL_MAX)
                d2 = DBL_MAX;
            else
                d2 = mir.ub[k] - mir.x[k];
            }
            else
            {  xassert(1 <= kk && kk <= m+n);
                xassert(mir.isint[kk]);
                xassert(mir.ub[k] != +DBL_MAX);
                d2 = mir.ub[k] * mir.x[kk] - mir.x[k];
            }
            /* x[k] cannot be free */
            xassert(d1 != DBL_MAX || d2 != DBL_MAX);
            /* d = min(d1, d2) */
            d = (d1 <= d2 ? d1 : d2);
            xassert(d != DBL_MAX);
            /* should not be close to corresponding bound */
            if (d < 0.001) continue;
            if (d_max < d) {d_max = d; kappa = k}
        }
        if (kappa == 0)
        {  /* nothing chosen */
            ret = 1;
            return ret;
        }
        /* x[kappa] has been chosen */
        xassert(m+1 <= kappa && kappa <= m+n);
        xassert(!mir.isint[kappa]);
        /* find another row, which have not been used yet, to eliminate
         x[kappa] from the aggregated row */
        for (ii = 1; ii <= m; ii++)
        {  if (mir.skip[ii]) continue;
            for (aij = mip.row[ii].ptr; aij != null; aij = aij.r_next)
                if (aij.col.j == kappa - m) break;
            if (aij != null && Math.abs(aij.val) >= 0.001) break;
        }
        if (ii > m)
        {  /* nothing found */
            ret = 2;
            return ret;
        }
        /* row ii has been found; include it in the aggregated list */
        mir.agg_cnt++;
        xassert(mir.agg_cnt <= MAXAGGR);
        mir.agg_row[mir.agg_cnt] = ii;
        mir.skip[ii] = 2;
        /* v := new row */
        v = ios_create_vec(m+n);
        ios_set_vj(v, ii, 1.0);
        for (aij = mip.row[ii].ptr; aij != null; aij = aij.r_next)
            ios_set_vj(v, m + aij.col.j, - aij.val);
        if (_MIR_DEBUG){
            ios_check_vec(v);
        }
        /* perform gaussian elimination to remove x[kappa] */
        j = mir.agg_vec.pos[kappa];
        xassert(j != 0);
        jj = v.pos[kappa];
        xassert(jj != 0);
        ios_linear_comb(mir.agg_vec, - mir.agg_vec.val[j] / v.val[jj], v);
        ios_set_vj(mir.agg_vec, kappa, 0.0);
        if (_MIR_DEBUG){
            ios_check_vec(mir.agg_vec);
        }
        return ret;
    }

    /* main routine to generate MIR cuts */
    var mip = tree.mip;
    var m = mir.m;
    var n = mir.n;
    var i, k;
    var r_best;
    xassert(mip.m >= m);
    xassert(mip.n == n);
    /* obtain current point */
    get_current_point(tree, mir);
    if (_MIR_DEBUG){
        /* check current point */
        check_current_point(mir);
    }
    /* reset bound substitution flags */
    xfillArr(mir.subst, 1, '?', m+n);
    /* try to generate a set of violated MIR cuts */
    for (i = 1; i <= m; i++)
    {  if (mir.skip[i]) continue;
        /* use original i-th row as initial aggregated constraint */
        initial_agg_row(tree, mir, i);
        while (true){
            if (_MIR_DEBUG){
                /* check aggregated row */
                check_agg_row(mir);
            }
            /* substitute fixed variables into aggregated constraint */
            subst_fixed_vars(mir);
            if (_MIR_DEBUG){
                /* check aggregated row */
                check_agg_row(mir);
                /* check bound substitution flags */
                {
                    for (k = 1; k <= m+n; k++)
                        xassert(mir.subst[k] == '?');
                }
            }
            /* apply bound substitution heuristic */
            bound_subst_heur(mir);
            /* substitute bounds and build modified constraint */
            build_mod_row(mir);
            if (_MIR_DEBUG){
                /* check modified row */
                check_mod_row(mir);
            }
            /* try to generate violated c-MIR cut for modified row */
            r_best = generate(mir);
            if (r_best > 0.0){
                /* success */
                if (_MIR_DEBUG){
                    /* check raw cut before back bound substitution */
                    check_raw_cut(mir, r_best);
                }
                /* back substitution of original bounds */
                back_subst(mir);
                if (_MIR_DEBUG){
                    /* check the cut after back bound substitution */
                    check_cut_row(mir, r_best);
                }
                /* final substitution to eliminate auxiliary variables */
                subst_aux_vars(tree, mir);
                if (_MIR_DEBUG){
                    /* check the cut after elimination of auxiliaries */
                    check_cut_row(mir, r_best);
                }
                /* add constructed cut inequality to the cut pool */
                add_cut(tree, mir);
            }
            /* reset bound substitution flags */
            {
                for (var j = 1; j <= mir.mod_vec.nnz; j++)
                {  k = mir.mod_vec.ind[j];
                    xassert(1 <= k && k <= m+n);
                    xassert(mir.subst[k] != '?');
                    mir.subst[k] = '?';
                }
            }
            if (r_best == 0.0)
            {  /* failure */
                if (mir.agg_cnt < MAXAGGR)
                {  /* try to aggregate another row */
                    if (aggregate_row(tree, mir) == 0) continue;
                }
            }
            break;
        }

        /* unmark rows used in the aggregated constraint */
        {  var ii;
            for (k = 1; k <= mir.agg_cnt; k++)
            {  ii = mir.agg_row[k];
                xassert(1 <= ii && ii <= m);
                xassert(mir.skip[ii] == 2);
                mir.skip[ii] = 0;
            }
        }
    }
}
