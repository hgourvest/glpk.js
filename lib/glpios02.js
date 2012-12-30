function ios_preprocess_node(tree, max_pass){
    function prepare_row_info(n, a, l, u, f){
        var j, j_min, j_max;
        var f_min, f_max;
        xassert(n >= 0);
        /* determine f_min and j_min */
        f_min = 0.0; j_min = 0;
        for (j = 1; j <= n; j++)
        {  if (a[j] > 0.0)
        {  if (l[j] == -DBL_MAX)
        {  if (j_min == 0)
            j_min = j;
        else
        {  f_min = -DBL_MAX; j_min = 0;
            break;
        }
        }
        else
            f_min += a[j] * l[j];
        }
        else if (a[j] < 0.0)
        {  if (u[j] == +DBL_MAX)
        {  if (j_min == 0)
            j_min = j;
        else
        {  f_min = -DBL_MAX; j_min = 0;
            break;
        }
        }
        else
            f_min += a[j] * u[j];
        }
        else
            xassert(a != a);
        }
        f.f_min = f_min; f.j_min = j_min;
        /* determine f_max and j_max */
        f_max = 0.0; j_max = 0;
        for (j = 1; j <= n; j++)
        {  if (a[j] > 0.0)
        {  if (u[j] == +DBL_MAX)
        {  if (j_max == 0)
            j_max = j;
        else
        {  f_max = +DBL_MAX; j_max = 0;
            break;
        }
        }
        else
            f_max += a[j] * u[j];
        }
        else if (a[j] < 0.0)
        {  if (l[j] == -DBL_MAX)
        {  if (j_max == 0)
            j_max = j;
        else
        {  f_max = +DBL_MAX; j_max = 0;
            break;
        }
        }
        else
            f_max += a[j] * l[j];
        }
        else
            xassert(a != a);
        }
        f.f_max = f_max; f.j_max = j_max;
    }

    function row_implied_bounds(f, callback){
        callback((f.j_min == 0 ? f.f_min : -DBL_MAX), (f.j_max == 0 ? f.f_max : +DBL_MAX));
    }

    function col_implied_bounds(f, n, a, L, U, l, u, k, callback){
        var ilb, iub, ll, uu;
        xassert(n >= 0);
        xassert(1 <= k && k <= n);
        /* determine implied lower bound of term a[k] * x[k] (14) */
        if (L == -DBL_MAX || f.f_max == +DBL_MAX)
            ilb = -DBL_MAX;
        else if (f.j_max == 0)
        {  if (a[k] > 0.0)
        {  xassert(u[k] != +DBL_MAX);
            ilb = L - (f.f_max - a[k] * u[k]);
        }
        else if (a[k] < 0.0)
        {  xassert(l[k] != -DBL_MAX);
            ilb = L - (f.f_max - a[k] * l[k]);
        }
        else
            xassert(a != a);
        }
        else if (f.j_max == k)
            ilb = L - f.f_max;
        else
            ilb = -DBL_MAX;
        /* determine implied upper bound of term a[k] * x[k] (15) */
        if (U == +DBL_MAX || f.f_min == -DBL_MAX)
            iub = +DBL_MAX;
        else if (f.j_min == 0)
        {  if (a[k] > 0.0)
        {  xassert(l[k] != -DBL_MAX);
            iub = U - (f.f_min - a[k] * l[k]);
        }
        else if (a[k] < 0.0)
        {  xassert(u[k] != +DBL_MAX);
            iub = U - (f.f_min - a[k] * u[k]);
        }
        else
            xassert(a != a);
        }
        else if (f.j_min == k)
            iub = U - f.f_min;
        else
            iub = +DBL_MAX;
        /* determine implied bounds of x[k] (16) and (17) */
        /* do not use a[k] if it has small magnitude to prevent wrong
         implied bounds; for example, 1e-15 * x1 >= x2 + x3, where
         x1 >= -10, x2, x3 >= 0, would lead to wrong conclusion that
         x1 >= 0 */
        if (Math.abs(a[k]) < 1e-6){
            ll = -DBL_MAX;
            uu = +DBL_MAX
        } else if (a[k] > 0.0)
        {  ll = (ilb == -DBL_MAX ? -DBL_MAX : ilb / a[k]);
            uu = (iub == +DBL_MAX ? +DBL_MAX : iub / a[k]);
        }
        else if (a[k] < 0.0)
        {  ll = (iub == +DBL_MAX ? -DBL_MAX : iub / a[k]);
            uu = (ilb == -DBL_MAX ? +DBL_MAX : ilb / a[k]);
        }
        else
            xassert(a != a);
        callback(ll, uu);
    }

    function check_row_bounds(f, L_, Lx, U_, Ux){
        var eps, ret = 0;
        var L = L_[Lx], U = U_[Ux], LL = null, UU = null;
        /* determine implied bounds of the row */
        row_implied_bounds(f, function(a, b){LL = a; UU = b});
        /* check if the original lower bound is infeasible */
        if (L != -DBL_MAX)
        {   eps = 1e-3 * (1.0 + Math.abs(L));
            if (UU < L - eps)
            {  ret = 1;
                return ret;
            }
        }
        /* check if the original upper bound is infeasible */
        if (U != +DBL_MAX)
        {   eps = 1e-3 * (1.0 + Math.abs(U));
            if (LL > U + eps)
            {  ret = 1;
                return ret;
            }
        }
        /* check if the original lower bound is redundant */
        if (L != -DBL_MAX)
        {   eps = 1e-12 * (1.0 + Math.abs(L));
            if (LL > L - eps)
            {  /* it cannot be active, so remove it */
                L_[Lx] = -DBL_MAX;
            }
        }
        /* check if the original upper bound is redundant */
        if (U != +DBL_MAX)
        {   eps = 1e-12 * (1.0 + Math.abs(U));
            if (UU < U + eps)
            {  /* it cannot be active, so remove it */
                U_[Ux] = +DBL_MAX;
            }
        }
        return ret
    }

    function check_col_bounds(f, n, a, L, U, l, u, flag, j, callback){
        var eps, ret = 0;
        var lj, uj, ll = null, uu = null;
        xassert(n >= 0);
        xassert(1 <= j && j <= n);
        lj = l[j]; uj = u[j];
        /* determine implied bounds of the column */
        col_implied_bounds(f, n, a, L, U, l, u, j, function(a,b){ll = a; uu = b});
        /* if x[j] is integral, round its implied bounds */
        if (flag)
        {  if (ll != -DBL_MAX)
            ll = (ll - Math.floor(ll) < 1e-3 ? Math.floor(ll) : Math.ceil(ll));
            if (uu != +DBL_MAX)
                uu = (Math.ceil(uu) - uu < 1e-3 ? Math.ceil(uu) : Math.floor(uu));
        }
        /* check if the original lower bound is infeasible */
        if (lj != -DBL_MAX)
        {   eps = 1e-3 * (1.0 + Math.abs(lj));
            if (uu < lj - eps)
            {  ret = 1;
                return ret;
            }
        }
        /* check if the original upper bound is infeasible */
        if (uj != +DBL_MAX)
        {   eps = 1e-3 * (1.0 + Math.abs(uj));
            if (ll > uj + eps)
            {  ret = 1;
                return ret;
            }
        }
        /* check if the original lower bound is redundant */
        if (ll != -DBL_MAX)
        {   eps = 1e-3 * (1.0 + Math.abs(ll));
            if (lj < ll - eps)
            {  /* it cannot be active, so tighten it */
                lj = ll;
            }
        }
        /* check if the original upper bound is redundant */
        if (uu != +DBL_MAX)
        {   eps = 1e-3 * (1.0 + Math.abs(uu));
            if (uj > uu + eps)
            {  /* it cannot be active, so tighten it */
                uj = uu;
            }
        }
        /* due to round-off errors it may happen that lj > uj (although
         lj < uj + eps, since no primal infeasibility is detected), so
         adjuct the new actual bounds to provide lj <= uj */
        if (!(lj == -DBL_MAX || uj == +DBL_MAX))
        {   var t1 = Math.abs(lj), t2 = Math.abs(uj);
            eps = 1e-10 * (1.0 + (t1 <= t2 ? t1 : t2));
            if (lj > uj - eps)
            {  if (lj == l[j])
                uj = lj;
            else if (uj == u[j])
                lj = uj;
            else if (t1 <= t2)
                uj = lj;
            else
                lj = uj;
            }
        }
        callback(lj, uj);
        return ret;
    }

    function check_efficiency(flag, l, u, ll, uu){
        var r, eff = 0;
        /* check efficiency for lower bound */
        if (l < ll)
        {  if (flag || l == -DBL_MAX)
            eff++;
        else
        {
            if (u == +DBL_MAX)
                r = 1.0 + Math.abs(l);
            else
                r = 1.0 + (u - l);
            if (ll - l >= 0.25 * r)
                eff++;
        }
        }
        /* check efficiency for upper bound */
        if (u > uu)
        {  if (flag || u == +DBL_MAX)
            eff++;
        else
        {
            if (l == -DBL_MAX)
                r = 1.0 + Math.abs(u);
            else
                r = 1.0 + (u - l);
            if (u - uu >= 0.25 * r)
                eff++;
        }
        }
        return eff;
    }

    function basic_preprocessing(mip, L, U, l, u, nrs, num, max_pass){
        var m = mip.m;
        var n = mip.n;
        var f = {};
        var i, j, k, len, size, ret = 0;
        var ind, list, mark, pass;
        var val, lb, ub;
        var aij, col;
        xassert(0 <= nrs && nrs <= m+1);
        xassert(max_pass > 0);
        /* allocate working arrays */
        ind = new Array(1+n);
        list = new Array(1+m+1);
        mark = new Array(1+m+1);
        xfillArr(mark, 0, 0, m+1);
        pass = new Array(1+m+1);
        xfillArr(pass, 0, 0, m+1);
        val = new Array(1+n);
        lb = new Array(1+n);
        ub = new Array(1+n);
        /* initialize the list of rows to be processed */
        size = 0;
        for (k = 1; k <= nrs; k++)
        {  i = num[k];
            xassert(0 <= i && i <= m);
            /* duplicate row numbers are not allowed */
            xassert(!mark[i]);
            list[++size] = i; mark[i] = 1;
        }
        xassert(size == nrs);
        /* process rows in the list until it becomes empty */
        while (size > 0)
        {  /* get a next row from the list */
            i = list[size--]; mark[i] = 0;
            /* increase the row processing count */
            pass[i]++;
            /* if the row is free, skip it */
            if (L[i] == -DBL_MAX && U[i] == +DBL_MAX) continue;
            /* obtain coefficients of the row */
            len = 0;
            if (i == 0)
            {   for (j = 1; j <= n; j++)
            {   col = mip.col[j];
                if (col.coef != 0.0){
                    len++; ind[len] = j; val[len] = col.coef;
                }
            }
            }
            else
            {   var row = mip.row[i];
                for (aij = row.ptr; aij != null; aij = aij.r_next){
                    len++; ind[len] = aij.col.j; val[len] = aij.val;
                }
            }
            /* determine lower and upper bounds of columns corresponding
             to non-zero row coefficients */
            for (k = 1; k <= len; k++){
                j = ind[k]; lb[k] = l[j]; ub[k] = u[j];
            }
            /* prepare the row info to determine implied bounds */
            prepare_row_info(len, val, lb, ub, f);
            /* check and relax bounds of the row */
            if (check_row_bounds(f, L, i, U, i))
            {  /* the feasible region is empty */
                ret = 1;
                return ret;
            }
            /* if the row became free, drop it */
            if (L[i] == -DBL_MAX && U[i] == +DBL_MAX) continue;
            /* process columns having non-zero coefficients in the row */
            for (k = 1; k <= len; k++){
                var flag, eff;
                var ll = null, uu = null;
                /* take a next column in the row */
                j = ind[k]; col = mip.col[j];
                flag = col.kind != GLP_CV;
                /* check and tighten bounds of the column */
                if (check_col_bounds(f, len, val, L[i], U[i], lb, ub,
                    flag, k, function(a, b){ll = a; uu = b}))
                {  /* the feasible region is empty */
                    ret = 1;
                    return ret;
                }
                /* check if change in the column bounds is efficient */
                eff = check_efficiency(flag, l[j], u[j], ll, uu);
                /* set new actual bounds of the column */
                l[j] = ll; u[j] = uu;
                /* if the change is efficient, add all rows affected by the
                 corresponding column, to the list */
                if (eff > 0)
                {
                    for (aij = col.ptr; aij != null; aij = aij.c_next)
                    {  var ii = aij.row.i;
                        /* if the row was processed maximal number of times,
                         skip it */
                        if (pass[ii] >= max_pass) continue;
                        /* if the row is free, skip it */
                        if (L[ii] == -DBL_MAX && U[ii] == +DBL_MAX) continue;
                        /* put the row into the list */
                        if (mark[ii] == 0)
                        {  xassert(size <= m);
                            list[++size] = ii; mark[ii] = 1;
                        }
                    }
                }
            }
        }
        return ret;
    }

    var mip = tree.mip;
    var m = mip.m;
    var n = mip.n;
    var i, j, nrs, num, ret = 0;
    var L, U, l, u;
    /* the current subproblem must exist */
    xassert(tree.curr != null);
    /* determine original row bounds */
    L = new Array(1+m);
    U = new Array(1+m);
    switch (mip.mip_stat)
    {  case GLP_UNDEF:
        L[0] = -DBL_MAX; U[0] = +DBL_MAX;
        break;
        case GLP_FEAS:
            switch (mip.dir)
            {  case GLP_MIN:
                L[0] = -DBL_MAX; U[0] = mip.mip_obj - mip.c0;
                break;
                case GLP_MAX:
                    L[0] = mip.mip_obj - mip.c0; U[0] = +DBL_MAX;
                    break;
                default:
                    xassert(mip != mip);
            }
            break;
        default:
            xassert(mip != mip);
    }
    for (i = 1; i <= m; i++)
    {  L[i] = glp_get_row_lb(mip, i);
        U[i] = glp_get_row_ub(mip, i);
    }
    /* determine original column bounds */
    l = new Array(1+n);
    u = new Array(1+n);
    for (j = 1; j <= n; j++)
    {  l[j] = glp_get_col_lb(mip, j);
        u[j] = glp_get_col_ub(mip, j);
    }
    /* build the initial list of rows to be analyzed */
    nrs = m + 1;
    num = new Array(1+nrs);
    for (i = 1; i <= nrs; i++) num[i] = i - 1;
    /* perform basic preprocessing */
    if (basic_preprocessing(mip , L, U, l, u, nrs, num, max_pass))
    {  ret = 1;
        return ret;
    }
    /* set new actual (relaxed) row bounds */
    for (i = 1; i <= m; i++)
    {  /* consider only non-active rows to keep dual feasibility */
        if (glp_get_row_stat(mip, i) == GLP_BS)
        {  if (L[i] == -DBL_MAX && U[i] == +DBL_MAX)
            glp_set_row_bnds(mip, i, GLP_FR, 0.0, 0.0);
        else if (U[i] == +DBL_MAX)
            glp_set_row_bnds(mip, i, GLP_LO, L[i], 0.0);
        else if (L[i] == -DBL_MAX)
            glp_set_row_bnds(mip, i, GLP_UP, 0.0, U[i]);
        }
    }
    /* set new actual (tightened) column bounds */
    for (j = 1; j <= n; j++)
    {  var type;
        if (l[j] == -DBL_MAX && u[j] == +DBL_MAX)
            type = GLP_FR;
        else if (u[j] == +DBL_MAX)
            type = GLP_LO;
        else if (l[j] == -DBL_MAX)
            type = GLP_UP;
        else if (l[j] != u[j])
            type = GLP_DB;
        else
            type = GLP_FX;
        glp_set_col_bnds(mip, j, type, l[j], u[j]);
    }
    return ret;
}

