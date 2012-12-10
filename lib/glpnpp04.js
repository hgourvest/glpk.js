
function npp_binarize_prob(npp){
    /* binarize MIP problem */
    var info;
    var row;
    var col, bin;
    var aij;
    var u, n, k, temp, nfails, nvars, nbins, nrows;
    /* new variables will be added to the end of the column list, so
     we go from the end to beginning of the column list */
    nfails = nvars = nbins = nrows = 0;
    for (col = npp.c_tail; col != null; col = col.prev)
    {  /* skip continuous variable */
        if (!col.is_int) continue;
        /* skip fixed variable */
        if (col.lb == col.ub) continue;
        /* skip binary variable */
        if (col.lb == 0.0 && col.ub == 1.0) continue;
        /* check if the transformation is applicable */
        if (col.lb < -1e6 || col.ub > +1e6 ||
            col.ub - col.lb > 4095.0)
        {  /* unfortunately, not */
            nfails++;
            continue;
        }
        /* process integer non-binary variable x[q] */
        nvars++;
        /* make x[q] non-negative, if its lower bound is non-zero */
        if (col.lb != 0.0)
            npp_lbnd_col(npp, col);
        /* now 0 <= x[q] <= u[q] */
        xassert(col.lb == 0.0);
        u = col.ub;
        xassert(col.ub == u);
        /* if x[q] is binary, further processing is not needed */
        if (u == 1) continue;
        /* determine smallest n such that u <= 2^n - 1 (thus, n is the
         number of binary variables needed) */
        n = 2; temp = 4;
        while (u >= temp){
            n++; temp += temp;
        }
        nbins += n;
        /* create transformation stack entry */
        info = npp_push_tse(npp,
            function (npp, info)
            {     /* recovery binarized variable */
                var k, temp;
                /* compute value of x[q]; see formula (3) */
                var sum = npp.c_value[info.q];
                for (k = 1, temp = 2; k < info.n; k++, temp += temp)
                    sum += temp * npp.c_value[info.j + (k-1)];
                npp.c_value[info.q] = sum;
                return 0;
            }
        );
        info.q = col.j;
        info.j = 0; /* will be set below */
        info.n = n;
        /* if u < 2^n - 1, we need one additional row for (4) */
        if (u < temp - 1)
        {  row = npp_add_row(npp); nrows++;
            row.lb = -DBL_MAX; row.ub = u;
        }
        else
            row = null;
        /* in the transformed problem variable x[q] becomes binary
         variable x[0], so its objective and constraint coefficients
         are not changed */
        col.ub = 1.0;
        /* include x[0] into constraint (4) */
        if (row != null)
            npp_add_aij(row, col, 1.0);
        /* add other binary variables x[1], ..., x[n-1] */
        for (k = 1, temp = 2; k < n; k++, temp += temp)
        {  /* add new binary variable x[k] */
            bin = npp_add_col(npp);
            bin.is_int = 1;
            bin.lb = 0.0; bin.ub = 1.0;
            bin.coef = temp * col.coef;
            /* store column reference number for x[1] */
            if (info.j == 0)
                info.j = bin.j;
            else
                xassert(info.j + (k-1) == bin.j);
            /* duplicate constraint coefficients for x[k]; this also
             automatically includes x[k] into constraint (4) */
            for (aij = col.ptr; aij != null; aij = aij.c_next)
                npp_add_aij(aij.row, bin, temp * aij.val);
        }
    }
    if (nvars > 0)
        xprintf(nvars + " integer variable(s) were replaced by " + nbins + " binary ones");
    if (nrows > 0)
        xprintf(nrows + " row(s) were added due to binarization");
    if (nfails > 0)
        xprintf("Binarization failed for " + nfails + " integer variable(s)");
    return nfails;
}

function copy_form(row, s){
    /* copy linear form */
    var aij;
    var ptr, e;
    ptr = null;
    for (aij = row.ptr; aij != null; aij = aij.r_next)
    {  e = {};
        e.aj = s * aij.val;
        e.xj = aij.col;
        e.next = ptr;
        ptr = e;
    }
    return ptr;
}

function npp_is_packing(npp, row){
    /* test if constraint is packing inequality */
    var col;
    var aij;
    var b;
    xassert(npp == npp);
    if (!(row.lb == -DBL_MAX && row.ub != +DBL_MAX))
        return 0;
    b = 1;
    for (aij = row.ptr; aij != null; aij = aij.r_next)
    {  col = aij.col;
        if (!(col.is_int && col.lb == 0.0 && col.ub == 1.0))
            return 0;
        if (aij.val == +1.0){

        }
        else if (aij.val == -1.0)
            b--;
        else
            return 0;
    }
    if (row.ub != b) return 0;
    return 1;
}

function hidden_packing(npp, ptr, b, callback)
{     /* process inequality constraint: sum a[j] x[j] <= b;
 0 - specified row is NOT hidden packing inequality;
 1 - specified row is packing inequality;
 2 - specified row is hidden packing inequality. */
    var e, ej, ek;
    var neg;
    var eps;
    xassert(npp == npp);
    /* a[j] must be non-zero, x[j] must be binary, for all j in J */
    for (e = ptr; e != null; e = e.next)
    {  xassert(e.aj != 0.0);
        xassert(e.xj.is_int);
        xassert(e.xj.lb == 0.0 && e.xj.ub == 1.0);
    }
    /* check if the specified inequality constraint already has the
     form of packing inequality */
    neg = 0; /* neg is |Jn| */
    for (e = ptr; e != null; e = e.next)
    {  if (e.aj == +1.0){
        
    }
    else if (e.aj == -1.0)
        neg++;
    else
        break;
    }
    if (e == null)
    {  /* all coefficients a[j] are +1 or -1; check rhs b */
        if (b == (1 - neg))
        {  /* it is packing inequality; no processing is needed */
            return 1;
        }
    }
    /* substitute x[j] = 1 - x~[j] for all j in Jn to make all a[j]
     positive; the result is a~[j] = |a[j]| and new rhs b */
    for (e = ptr; e != null; e = e.next)
        if (e.aj < 0) b -= e.aj;
    /* now a[j] > 0 for all j in J (actually |a[j]| are used) */
    /* if a[j] > b, skip processing--this case must not appear */
    for (e = ptr; e != null; e = e.next)
        if (Math.abs(e.aj) > b) return 0;
    /* now 0 < a[j] <= b for all j in J */
    /* find two minimal coefficients a[j] and a[k], j != k */
    ej = null;
    for (e = ptr; e != null; e = e.next)
        if (ej == null || Math.abs(ej.aj) > Math.abs(e.aj)) ej = e;
    xassert(ej != null);
    ek = null;
    for (e = ptr; e != null; e = e.next)
        if (e != ej)
            if (ek == null || Math.abs(ek.aj) > Math.abs(e.aj)) ek = e;
    xassert(ek != null);
    /* the specified constraint is equivalent to packing inequality
     iff a[j] + a[k] > b + eps */
    eps = 1e-3 + 1e-6 * Math.abs(b);
    if (Math.abs(ej.aj) + Math.abs(ek.aj) <= b + eps) return 0;
    /* perform back substitution x~[j] = 1 - x[j] and construct the
     final equivalent packing inequality in generalized format */
    b = 1.0;
    for (e = ptr; e != null; e = e.next)
    {  if (e.aj > 0.0)
        e.aj = +1.0;
    else /* e.aj < 0.0 */{
        e.aj = -1.0; b -= 1.0
    }
    }
    callback(b);
    return 2;
}

function npp_hidden_packing(npp, row){
    /* identify hidden packing inequality */
    var copy;
    var aij;
    var ptr, e;
    var kase, ret, count = 0;
    var b;
    /* the row must be inequality constraint */
    xassert(row.lb < row.ub);
    for (kase = 0; kase <= 1; kase++)
    {  if (kase == 0)
    {  /* process row upper bound */
        if (row.ub == +DBL_MAX) continue;
        ptr = copy_form(row, +1.0);
        b = + row.ub;
    }
    else
    {  /* process row lower bound */
        if (row.lb == -DBL_MAX) continue;
        ptr = copy_form(row, -1.0);
        b = - row.lb;
    }
        /* now the inequality has the form "sum a[j] x[j] <= b" */
        ret = hidden_packing(npp, ptr, b, function(v){b=v});
        xassert(0 <= ret && ret <= 2);
        if (kase == 1 && ret == 1 || ret == 2)
        {  /* the original inequality has been identified as hidden
         packing inequality */
            count++;
            if (GLP_DEBUG){
                xprintf("Original constraint:");
                for (aij = row.ptr; aij != null; aij = aij.r_next)
                    xprintf(" " + aij.val + " x" + aij.col.j);
                if (row.lb != -DBL_MAX) xprintf(", >= " + row.lb);
                if (row.ub != +DBL_MAX) xprintf(", <= " + row.ub);
                xprintf("");
                xprintf("Equivalent packing inequality:");
                for (e = ptr; e != null; e = e.next)
                    xprintf(" " + (e.aj > 0.0 ? "+" : "-") + "x" + e.xj.j);
                xprintf(", <= " + b + "");
            }
            if (row.lb == -DBL_MAX || row.ub == +DBL_MAX)
            {  /* the original row is single-sided inequality; no copy
             is needed */
                copy = null;
            }
            else
            {  /* the original row is double-sided inequality; we need
             to create its copy for other bound before replacing it
             with the equivalent inequality */
                copy = npp_add_row(npp);
                if (kase == 0)
                {  /* the copy is for lower bound */
                    copy.lb = row.lb; copy.ub = +DBL_MAX;
                }
                else
                {  /* the copy is for upper bound */
                    copy.lb = -DBL_MAX; copy.ub = row.ub;
                }
                /* copy original row coefficients */
                for (aij = row.ptr; aij != null; aij = aij.r_next)
                    npp_add_aij(copy, aij.col, aij.val);
            }
            /* replace the original inequality by equivalent one */
            npp_erase_row(row);
            row.lb = -DBL_MAX; row.ub = b;
            for (e = ptr; e != null; e = e.next)
                npp_add_aij(row, e.xj, e.aj);
            /* continue processing lower bound for the copy */
            if (copy != null) row = copy;
        }
    }
    return count;
}

function npp_implied_packing(row, which, var_, set_){
    var ptr, e, i, k;
    var len = 0;
    var b, eps;
    /* build inequality (3) */
    if (which == 0)
    {  ptr = copy_form(row, -1.0);
        xassert(row.lb != -DBL_MAX);
        b = - row.lb;
    }
    else if (which == 1)
    {  ptr = copy_form(row, +1.0);
        xassert(row.ub != +DBL_MAX);
        b = + row.ub;
    }
    /* remove non-binary variables to build relaxed inequality (5);
     compute its right-hand side b~ with formula (6) */
    for (e = ptr; e != null; e = e.next)
    {  if (!(e.xj.is_int && e.xj.lb == 0.0 && e.xj.ub == 1.0))
    {  /* x[j] is non-binary variable */
        if (e.aj > 0.0)
        {  if (e.xj.lb == -DBL_MAX) return len;
            b -= e.aj * e.xj.lb;
        }
        else /* e.aj < 0.0 */
        {  if (e.xj.ub == +DBL_MAX) return len;
            b -= e.aj * e.xj.ub;
        }
        /* a[j] = 0 means that variable x[j] is removed */
        e.aj = 0.0;
    }
    }
    /* substitute x[j] = 1 - x~[j] to build knapsack inequality (8);
     compute its right-hand side beta with formula (11) */
    for (e = ptr; e != null; e = e.next)
        if (e.aj < 0.0) b -= e.aj;
    /* if beta is close to zero, the knapsack inequality is either
     infeasible or forcing inequality; this must never happen, so
     we skip further analysis */
    if (b < 1e-3) return len;
    /* build set P as well as sets Jp and Jn, and determine x[k] as
     explained above in comments to the routine */
    eps = 1e-3 + 1e-6 * b;
    i = k = null;
    for (e = ptr; e != null; e = e.next)
    {  /* note that alfa[j] = |a[j]| */
        if (Math.abs(e.aj) > 0.5 * (b + eps))
        {  /* alfa[j] > (b + eps) / 2; include x[j] in set P, i.e. in
         set Jp or Jn */
            var_[++len] = e.xj;
            set_[len] = (e.aj > 0.0 ? 0 : 1);
            /* alfa[i] = min alfa[j] over all j included in set P */
            if (i == null || Math.abs(i.aj) > Math.abs(e.aj)) i = e;
        }
        else if (Math.abs(e.aj) >= 1e-3)
        {  /* alfa[k] = max alfa[j] over all j not included in set P;
         we skip coefficient a[j] if it is close to zero to avoid
         numerically unreliable results */
            if (k == null || Math.abs(k.aj) < Math.abs(e.aj)) k = e;
        }
    }
    /* if alfa[k] satisfies to condition (13) for all j in P, include
     x[k] in P */
    if (i != null && k != null && Math.abs(i.aj) + Math.abs(k.aj) > b + eps)
    {  var_[++len] = k.xj;
        set_[len] = (k.aj > 0.0 ? 0 : 1);
    }
    /* trivial packing inequality being redundant must never appear,
     so we just ignore it */
    if (len < 2) len = 0;
    return len;

}

function npp_is_covering(npp, row){
    /* test if constraint is covering inequality */
    var col;
    var aij;
    var b;
    xassert(npp == npp);
    if (!(row.lb != -DBL_MAX && row.ub == +DBL_MAX))
        return 0;
    b = 1;
    for (aij = row.ptr; aij != null; aij = aij.r_next)
    {  col = aij.col;
        if (!(col.is_int && col.lb == 0.0 && col.ub == 1.0))
            return 0;
        if (aij.val == +1.0){

        }
        else if (aij.val == -1.0)
            b--;
        else
            return 0;
    }
    if (row.lb != b) return 0;
    return 1;
}

function hidden_covering(npp, ptr, b, callback)
{     /* process inequality constraint: sum a[j] x[j] >= b;
 0 - specified row is NOT hidden covering inequality;
 1 - specified row is covering inequality;
 2 - specified row is hidden covering inequality. */
    var e;
    var neg;
    var eps;
    xassert(npp == npp);
    /* a[j] must be non-zero, x[j] must be binary, for all j in J */
    for (e = ptr; e != null; e = e.next)
    {  xassert(e.aj != 0.0);
        xassert(e.xj.is_int);
        xassert(e.xj.lb == 0.0 && e.xj.ub == 1.0);
    }
    /* check if the specified inequality constraint already has the
     form of covering inequality */
    neg = 0; /* neg is |Jn| */
    for (e = ptr; e != null; e = e.next)
    {  if (e.aj == +1.0){

    }
    else if (e.aj == -1.0)
        neg++;
    else
        break;
    }
    if (e == null)
    {  /* all coefficients a[j] are +1 or -1; check rhs b */
        if (b == (1 - neg))
        {  /* it is covering inequality; no processing is needed */
            return 1;
        }
    }
    /* substitute x[j] = 1 - x~[j] for all j in Jn to make all a[j]
     positive; the result is a~[j] = |a[j]| and new rhs b */
    for (e = ptr; e != null; e = e.next)
        if (e.aj < 0) b -= e.aj;
    /* now a[j] > 0 for all j in J (actually |a[j]| are used) */
    /* if b <= 0, skip processing--this case must not appear */
    if (b < 1e-3) return 0;
    /* now a[j] > 0 for all j in J, and b > 0 */
    /* the specified constraint is equivalent to covering inequality
     iff a[j] >= b for all j in J */
    eps = 1e-9 + 1e-12 * Math.abs(b);
    for (e = ptr; e != null; e = e.next)
        if (Math.abs(e.aj) < b - eps) return 0;
    /* perform back substitution x~[j] = 1 - x[j] and construct the
     final equivalent covering inequality in generalized format */
    b = 1.0;
    for (e = ptr; e != null; e = e.next)
    {  if (e.aj > 0.0)
        e.aj = +1.0;
    else /* e.aj < 0.0 */{
        e.aj = -1.0; b -= 1.0;
    }
    }
    callback(b);
    return 2;
}

function npp_hidden_covering(npp, row){
    /* identify hidden covering inequality */
    var copy;
    var aij;
    var ptr, e;
    var kase, ret, count = 0;
    var b;
    /* the row must be inequality constraint */
    xassert(row.lb < row.ub);
    for (kase = 0; kase <= 1; kase++)
    {  if (kase == 0)
    {  /* process row lower bound */
        if (row.lb == -DBL_MAX) continue;
        ptr = copy_form(row, +1.0);
        b = + row.lb;
    }
    else
    {  /* process row upper bound */
        if (row.ub == +DBL_MAX) continue;
        ptr = copy_form(row, -1.0);
        b = - row.ub;
    }
        /* now the inequality has the form "sum a[j] x[j] >= b" */
        ret = hidden_covering(npp, ptr, b, function(v){b=v});
        xassert(0 <= ret && ret <= 2);
        if (kase == 1 && ret == 1 || ret == 2)
        {  /* the original inequality has been identified as hidden
         covering inequality */
            count++;
            if (GLP_DEBUG){
                xprintf("Original constraint:");
                for (aij = row.ptr; aij != null; aij = aij.r_next)
                    xprintf(" " + aij.val + " x" + aij.col.j);
                if (row.lb != -DBL_MAX) xprintf(", >= " + row.lb);
                if (row.ub != +DBL_MAX) xprintf(", <= " + row.ub);
                xprintf("");
                xprintf("Equivalent covering inequality:");
                for (e = ptr; e != null; e = e.next)
                    xprintf(" " + (e.aj > 0.0 ? "+" : "-") + "x" + e.xj.j);
                xprintf(", >= " + b + "");
            }
            if (row.lb == -DBL_MAX || row.ub == +DBL_MAX)
            {  /* the original row is single-sided inequality; no copy
             is needed */
                copy = null;
            }
            else
            {  /* the original row is double-sided inequality; we need
             to create its copy for other bound before replacing it
             with the equivalent inequality */
                copy = npp_add_row(npp);
                if (kase == 0)
                {  /* the copy is for upper bound */
                    copy.lb = -DBL_MAX; copy.ub = row.ub;
                }
                else
                {  /* the copy is for lower bound */
                    copy.lb = row.lb; copy.ub = +DBL_MAX;
                }
                /* copy original row coefficients */
                for (aij = row.ptr; aij != null; aij = aij.r_next)
                    npp_add_aij(copy, aij.col, aij.val);
            }
            /* replace the original inequality by equivalent one */
            npp_erase_row(row);
            row.lb = b; row.ub = +DBL_MAX;
            for (e = ptr; e != null; e = e.next)
                npp_add_aij(row, e.xj, e.aj);
            /* continue processing upper bound for the copy */
            if (copy != null) row = copy;
        }
    }
    return count;
}

function npp_is_partitioning(npp, row){
    /* test if constraint is partitioning equality */
    var col;
    var aij;
    var b;
    xassert(npp == npp);
    if (row.lb != row.ub) return 0;
    b = 1;
    for (aij = row.ptr; aij != null; aij = aij.r_next)
    {  col = aij.col;
        if (!(col.is_int && col.lb == 0.0 && col.ub == 1.0))
            return 0;
        if (aij.val == +1.0){

        }
        else if (aij.val == -1.0)
            b--;
        else
            return 0;
    }
    if (row.lb != b) return 0;
    return 1;
}

function reduce_ineq_coef(npp, ptr, b, callback)
{     /* process inequality constraint: sum a[j] x[j] >= b */
    /* returns: the number of coefficients reduced */
    var e;
    var count = 0;
    var h, inf_t, new_a;
    xassert(npp == npp);
    /* compute h; see (15) */
    h = 0.0;
    for (e = ptr; e != null; e = e.next)
    {  if (e.aj > 0.0)
    {  if (e.xj.lb == -DBL_MAX) return count;
        h += e.aj * e.xj.lb;
    }
    else /* e.aj < 0.0 */
    {  if (e.xj.ub == +DBL_MAX) return count;
        h += e.aj * e.xj.ub;
    }
    }
    /* perform reduction of coefficients at binary variables */
    for (e = ptr; e != null; e = e.next)
    {  /* skip non-binary variable */
        if (!(e.xj.is_int && e.xj.lb == 0.0 && e.xj.ub == 1.0))
            continue;
        if (e.aj > 0.0)
        {  /* compute inf t[k]; see (14) */
            inf_t = h;
            if (b - e.aj < inf_t && inf_t < b)
            {  /* compute reduced coefficient a'[k]; see (7) */
                new_a = b - inf_t;
                if (new_a >= +1e-3 &&
                    e.aj - new_a >= 0.01 * (1.0 + e.aj))
                {  /* accept a'[k] */
                    if (GLP_DEBUG){xprintf("+")}
                    e.aj = new_a;
                    count++;
                }
            }
        }
        else /* e.aj < 0.0 */
        {  /* compute inf t[k]; see (14) */
            inf_t = h - e.aj;
            if (b < inf_t && inf_t < b - e.aj)
            {  /* compute reduced coefficient a'[k]; see (11) */
                new_a = e.aj + (inf_t - b);
                if (new_a <= -1e-3 &&
                    new_a - e.aj >= 0.01 * (1.0 - e.aj))
                {  /* accept a'[k] */
                    if (GLP_DEBUG){xprintf("-")}
                    e.aj = new_a;
                    /* update h; see (17) */
                    h += (inf_t - b);
                    /* compute b'; see (9) */
                    b = inf_t;
                    count++;
                }
            }
        }
    }
    callback(b);
    return count
}

function npp_reduce_ineq_coef(npp, row){
    /* reduce inequality constraint coefficients */
    var copy;
    var aij;
    var ptr, e;
    var kase, count = new Array(2);
    var b;
    /* the row must be inequality constraint */
    xassert(row.lb < row.ub);
    count[0] = count[1] = 0;
    for (kase = 0; kase <= 1; kase++)
    {  if (kase == 0)
    {  /* process row lower bound */
        if (row.lb == -DBL_MAX) continue;
        if (GLP_DEBUG){xprintf("L")}
        ptr = copy_form(row, +1.0);
        b = + row.lb;
    }
    else
    {  /* process row upper bound */
        if (row.ub == +DBL_MAX) continue;
        if (GLP_DEBUG){xprintf("U")}
        ptr = copy_form(row, -1.0);
        b = - row.ub;
    }
        /* now the inequality has the form "sum a[j] x[j] >= b" */
        count[kase] = reduce_ineq_coef(npp, ptr, b, function(v){b=v});
        if (count[kase] > 0)
        {  /* the original inequality has been replaced by equivalent
         one with coefficients reduced */
            if (row.lb == -DBL_MAX || row.ub == +DBL_MAX)
            {  /* the original row is single-sided inequality; no copy
             is needed */
                copy = null;
            }
            else
            {  /* the original row is double-sided inequality; we need
             to create its copy for other bound before replacing it
             with the equivalent inequality */
                if (GLP_DEBUG){xprintf("*")}
                copy = npp_add_row(npp);
                if (kase == 0)
                {  /* the copy is for upper bound */
                    copy.lb = -DBL_MAX; copy.ub = row.ub;
                }
                else
                {  /* the copy is for lower bound */
                    copy.lb = row.lb; copy.ub = +DBL_MAX;
                }
                /* copy original row coefficients */
                for (aij = row.ptr; aij != null; aij = aij.r_next)
                    npp_add_aij(copy, aij.col, aij.val);
            }
            /* replace the original inequality by equivalent one */
            npp_erase_row(row);
            row.lb = b; row.ub = +DBL_MAX;
            for (e = ptr; e != null; e = e.next)
                npp_add_aij(row, e.xj, e.aj);
            /* continue processing upper bound for the copy */
            if (copy != null) row = copy;
        }
    }
    return count[0] + count[1];
}
