function npp_empty_row(npp, p){
    /* process empty row */
    var eps = 1e-3;
    /* the row must be empty */
    xassert(p.ptr == null);
    /* check primal feasibility */
    if (p.lb > +eps || p.ub < -eps)
        return 1;
    /* replace the row by equivalent free (unbounded) row */
    p.lb = -DBL_MAX; p.ub = +DBL_MAX;
    /* and process it */
    npp_free_row(npp, p);
    return 0;
}

function npp_empty_col(npp, q){
    /* process empty column */
    var info;
    var eps = 1e-3;
    /* the column must be empty */
    xassert(q.ptr == null);
    /* check dual feasibility */
    if (q.coef > +eps && q.lb == -DBL_MAX)
        return 1;
    if (q.coef < -eps && q.ub == +DBL_MAX)
        return 1;
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover empty column */
            if (npp.sol == GLP_SOL)
                npp.c_stat[info.q] = info.stat;
            return 0;
        }
    );
    info.q = q.j;
    /* fix the column */

    function lo(){  
        /* column with lower bound */
        info.stat = GLP_NL;
        q.ub = q.lb;
    }

    function up(){
        /* column with upper bound */
        info.stat = GLP_NU;
        q.lb = q.ub;
    }
    
    if (q.lb == -DBL_MAX && q.ub == +DBL_MAX)
    {  /* free column */
        info.stat = GLP_NF;
        q.lb = q.ub = 0.0;
    }
    else if (q.ub == +DBL_MAX)
        lo();   
    else if (q.lb == -DBL_MAX)
        up();
    else if (q.lb != q.ub)
    {  /* double-bounded column */
        if (q.coef >= +DBL_EPSILON) 
            lo();
        else if (q.coef <= -DBL_EPSILON) 
            up();
        else if (Math.abs(q.lb) <= Math.abs(q.ub)) 
            lo();
        else 
            up();
    }
    else
    {  /* fixed column */
        info.stat = GLP_NS;
    }
    /* process fixed column */
    npp_fixed_col(npp, q);
    return 0;
}

function npp_implied_value(npp, q, s){
    /* process implied column value */
    var eps, nint;
    xassert(npp == npp);
    /* column must not be fixed */
    xassert(q.lb < q.ub);
    /* check integrality */
    if (q.is_int)
    {  nint = Math.floor(s + 0.5);
        if (Math.abs(s - nint) <= 1e-5)
            s = nint;
        else
            return 2;
    }
    /* check current column lower bound */
    if (q.lb != -DBL_MAX)
    {  eps = (q.is_int ? 1e-5 : 1e-5 + 1e-8 * Math.abs(q.lb));
        if (s < q.lb - eps) return 1;
        /* if s[q] is close to l[q], fix column at its lower bound
         rather than at the implied value */
        if (s < q.lb + 1e-3 * eps)
        {  q.ub = q.lb;
            return 0;
        }
    }
    /* check current column upper bound */
    if (q.ub != +DBL_MAX)
    {  eps = (q.is_int ? 1e-5 : 1e-5 + 1e-8 * Math.abs(q.ub));
        if (s > q.ub + eps) return 1;
        /* if s[q] is close to u[q], fix column at its upper bound
         rather than at the implied value */
        if (s > q.ub - 1e-3 * eps)
        {  q.lb = q.ub;
            return 0;
        }
    }
    /* fix column at the implied value */
    q.lb = q.ub = s;
    return 0;
}

function npp_eq_singlet(npp, p){
    /* process row singleton (equality constraint) */
    var info;
    var q;
    var aij;
    var lfe;
    var ret;
    var s;
    /* the row must be singleton equality constraint */
    xassert(p.lb == p.ub);
    xassert(p.ptr != null && p.ptr.r_next == null);
    /* compute and process implied column value */
    aij = p.ptr;
    q = aij.col;
    s = p.lb / aij.val;
    ret = npp_implied_value(npp, q, s);
    xassert(0 <= ret && ret <= 2);
    if (ret != 0) return ret;
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover row singleton (equality constraint) */
            var lfe;
            var temp;
            if (npp.sol == GLP_SOL)
            {  /* column q must be already recovered as GLP_NS */
                if (npp.c_stat[info.q] != GLP_NS)
                {  npp_error();
                    return 1;
                }
                npp.r_stat[info.p] = GLP_NS;
                npp.c_stat[info.q] = GLP_BS;
            }
            if (npp.sol != GLP_MIP)
            {  /* compute multiplier for row p with formula (3) */
                temp = info.c;
                for (lfe = info.ptr; lfe != null; lfe = lfe.next)
                    temp -= lfe.val * npp.r_pi[lfe.ref];
                npp.r_pi[info.p] = temp / info.apq;
            }
            return 0;
        }
    );
    info.p = p.i;
    info.q = q.j;
    info.apq = aij.val;
    info.c = q.coef;
    info.ptr = null;
    /* save column coefficients a[i,q], i != p (not needed for MIP
     solution) */
    if (npp.sol != GLP_MIP)
    {  for (aij = q.ptr; aij != null; aij = aij.c_next)
    {  if (aij.row == p) continue; /* skip a[p,q] */
        lfe = {};
        lfe.ref = aij.row.i;
        lfe.val = aij.val;
        lfe.next = info.ptr;
        info.ptr = lfe;
    }
    }
    /* remove the row from the problem */
    npp_del_row(npp, p);
    return 0;
}

function npp_implied_lower(npp, q, l){
    /* process implied column lower bound */
    var ret;
    var eps, nint;
    xassert(npp == npp);
    /* column must not be fixed */
    xassert(q.lb < q.ub);
    /* implied lower bound must be finite */
    xassert(l != -DBL_MAX);
    /* if column is integral, round up l'[q] */
    if (q.is_int)
    {  nint = Math.floor(l + 0.5);
        if (Math.abs(l - nint) <= 1e-5)
            l = nint;
        else
            l = Math.ceil(l);
    }
    /* check current column lower bound */
    if (q.lb != -DBL_MAX)
    {  eps = (q.is_int ? 1e-3 : 1e-3 + 1e-6 * Math.abs(q.lb));
        if (l < q.lb + eps)
        {  ret = 0; /* redundant */
            return ret;
        }
    }
    /* check current column upper bound */
    if (q.ub != +DBL_MAX)
    {  eps = (q.is_int ? 1e-5 : 1e-5 + 1e-8 * Math.abs(q.ub));
        if (l > q.ub + eps)
        {  ret = 4; /* infeasible */
            return ret;
        }
        /* if l'[q] is close to u[q], fix column at its upper bound */
        if (l > q.ub - 1e-3 * eps)
        {  q.lb = q.ub;
            ret = 3; /* fixed */
            return ret;
        }
    }
    /* check if column lower bound changes significantly */
    if (q.lb == -DBL_MAX)
        ret = 2; /* significantly */
    else if (q.is_int && l > q.lb + 0.5)
        ret = 2; /* significantly */
    else if (l > q.lb + 0.30 * (1.0 + Math.abs(q.lb)))
        ret = 2; /* significantly */
    else
        ret = 1; /* not significantly */
    /* set new column lower bound */
    q.lb = l;
    return ret;
}

function npp_implied_upper(npp, q, u){
    var ret;
    var eps, nint;
    xassert(npp == npp);
    /* column must not be fixed */
    xassert(q.lb < q.ub);
    /* implied upper bound must be finite */
    xassert(u != +DBL_MAX);
    /* if column is integral, round down u'[q] */
    if (q.is_int)
    {  nint = Math.floor(u + 0.5);
        if (Math.abs(u - nint) <= 1e-5)
            u = nint;
        else
            u = Math.floor(u);
    }
    /* check current column upper bound */
    if (q.ub != +DBL_MAX)
    {  eps = (q.is_int ? 1e-3 : 1e-3 + 1e-6 * Math.abs(q.ub));
        if (u > q.ub - eps)
        {  ret = 0; /* redundant */
            return ret;
        }
    }
    /* check current column lower bound */
    if (q.lb != -DBL_MAX)
    {  eps = (q.is_int ? 1e-5 : 1e-5 + 1e-8 * Math.abs(q.lb));
        if (u < q.lb - eps)
        {  ret = 4; /* infeasible */
            return ret;
        }
        /* if u'[q] is close to l[q], fix column at its lower bound */
        if (u < q.lb + 1e-3 * eps)
        {  q.ub = q.lb;
            ret = 3; /* fixed */
            return ret;
        }
    }
    /* check if column upper bound changes significantly */
    if (q.ub == +DBL_MAX)
        ret = 2; /* significantly */
    else if (q.is_int && u < q.ub - 0.5)
        ret = 2; /* significantly */
    else if (u < q.ub - 0.30 * (1.0 + Math.abs(q.ub)))
        ret = 2; /* significantly */
    else
        ret = 1; /* not significantly */
    /* set new column upper bound */
    q.ub = u;
    return ret;
}

function npp_ineq_singlet(npp, p){
    /* process row singleton (inequality constraint) */
    var info;
    var q;
    var apq, aij;
    var lfe;
    var lb_changed, ub_changed;
    var ll, uu;
    /* the row must be singleton inequality constraint */
    xassert(p.lb != -DBL_MAX || p.ub != +DBL_MAX);
    xassert(p.lb < p.ub);
    xassert(p.ptr != null && p.ptr.r_next == null);
    /* compute implied column bounds */
    apq = p.ptr;
    q = apq.col;
    xassert(q.lb < q.ub);
    if (apq.val > 0.0)
    {  ll = (p.lb == -DBL_MAX ? -DBL_MAX : p.lb / apq.val);
        uu = (p.ub == +DBL_MAX ? +DBL_MAX : p.ub / apq.val);
    }
    else
    {  ll = (p.ub == +DBL_MAX ? -DBL_MAX : p.ub / apq.val);
        uu = (p.lb == -DBL_MAX ? +DBL_MAX : p.lb / apq.val);
    }
    /* process implied column lower bound */
    if (ll == -DBL_MAX)
        lb_changed = 0;
    else
    {  lb_changed = npp_implied_lower(npp, q, ll);
        xassert(0 <= lb_changed && lb_changed <= 4);
        if (lb_changed == 4) return 4; /* infeasible */
    }
    /* process implied column upper bound */
    if (uu == +DBL_MAX)
        ub_changed = 0;
    else if (lb_changed == 3)
    {  /* column was fixed on its upper bound due to l'[q] = u[q] */
        /* note that L[p] < U[p], so l'[q] = u[q] < u'[q] */
        ub_changed = 0;
    }
    else
    {  ub_changed = npp_implied_upper(npp, q, uu);
        xassert(0 <= ub_changed && ub_changed <= 4);
        if (ub_changed == 4) return 4; /* infeasible */
    }
    /* if neither lower nor upper column bound was changed, the row
     is originally redundant and can be replaced by free row */
    if (!lb_changed && !ub_changed)
    {  p.lb = -DBL_MAX; p.ub = +DBL_MAX;
        npp_free_row(npp, p);
        return 0;
    }
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover row singleton (inequality constraint) */
            var lfe;
            var lambda;
            if (npp.sol == GLP_MIP) return 0;
            /* compute lambda~[q] in solution to the transformed problem
             with formula (8) */
            lambda = info.c;
            for (lfe = info.ptr; lfe != null; lfe = lfe.next)
                lambda -= lfe.val * npp.r_pi[lfe.ref];
            if (npp.sol == GLP_SOL)
            {  /* recover basic solution */

                function nl(){  /* column q is non-basic with lower bound active */
                    if (info.lb_changed)
                    {  /* it is implied bound, so actually row p is active
                     while column q is basic */
                        npp.r_stat[info.p] =
                            (info.apq > 0.0 ? GLP_NL : GLP_NU);
                        npp.c_stat[info.q] = GLP_BS;
                        npp.r_pi[info.p] = lambda / info.apq;
                    }
                    else
                    {  /* it is original bound, so row p is inactive */
                        npp.r_stat[info.p] = GLP_BS;
                        npp.r_pi[info.p] = 0.0;
                    }
                    return 0;
                }

                function nu(){
                    /* column q is non-basic with upper bound active */
                    if (info.ub_changed)
                    {  /* it is implied bound, so actually row p is active
                     while column q is basic */
                        npp.r_stat[info.p] =
                            (info.apq > 0.0 ? GLP_NU : GLP_NL);
                        npp.c_stat[info.q] = GLP_BS;
                        npp.r_pi[info.p] = lambda / info.apq;
                    }
                    else
                    {  /* it is original bound, so row p is inactive */
                        npp.r_stat[info.p] = GLP_BS;
                        npp.r_pi[info.p] = 0.0;
                    }
                    return 0;
                }


                if (npp.c_stat[info.q] == GLP_BS)
                {  /* column q is basic, so row p is inactive */
                    npp.r_stat[info.p] = GLP_BS;
                    npp.r_pi[info.p] = 0.0;
                }
                else if (npp.c_stat[info.q] == GLP_NL)
                    nl();
                else if (npp.c_stat[info.q] == GLP_NU)
                    nu();
                else if (npp.c_stat[info.q] == GLP_NS)
                {  /* column q is non-basic and fixed; note, however, that in
                 in the original problem it is non-fixed */
                    if (lambda > +1e-7)
                    {  if (info.apq > 0.0 && info.lb != -DBL_MAX ||
                        info.apq < 0.0 && info.ub != +DBL_MAX ||
                        !info.lb_changed)
                    {  /* either corresponding bound of row p exists or
                     column q remains non-basic with its original lower
                     bound active */
                        npp.c_stat[info.q] = GLP_NL;
                        return nl();
                    }
                    }
                    if (lambda < -1e-7)
                    {  if (info.apq > 0.0 && info.ub != +DBL_MAX ||
                        info.apq < 0.0 && info.lb != -DBL_MAX ||
                        !info.ub_changed)
                    {  /* either corresponding bound of row p exists or
                     column q remains non-basic with its original upper
                     bound active */
                        npp.c_stat[info.q] = GLP_NU;
                        return nu();
                    }
                    }
                    /* either lambda~[q] is close to zero, or corresponding
                     bound of row p does not exist, because lambda~[q] has
                     wrong sign due to round-off errors; in the latter case
                     lambda~[q] is also assumed to be close to zero; so, we
                     can make row p active on its existing bound and column q
                     basic; pi[p] will have wrong sign, but it also will be
                     close to zero (rarus casus of dual degeneracy) */
                    if (info.lb != -DBL_MAX && info.ub == +DBL_MAX)
                    {  /* row lower bound exists, but upper bound doesn't */
                        npp.r_stat[info.p] = GLP_NL;
                    }
                    else if (info.lb == -DBL_MAX && info.ub != +DBL_MAX)
                    {  /* row upper bound exists, but lower bound doesn't */
                        npp.r_stat[info.p] = GLP_NU;
                    }
                    else if (info.lb != -DBL_MAX && info.ub != +DBL_MAX)
                    {  /* both row lower and upper bounds exist */
                        /* to choose proper active row bound we should not use
                         lambda~[q], because its value being close to zero is
                         unreliable; so we choose that bound which provides
                         primal feasibility for original constraint (1) */
                        if (info.apq * npp.c_value[info.q] <=
                            0.5 * (info.lb + info.ub))
                            npp.r_stat[info.p] = GLP_NL;
                        else
                            npp.r_stat[info.p] = GLP_NU;
                    }
                    else
                    {  npp_error();
                        return 1;
                    }
                    npp.c_stat[info.q] = GLP_BS;
                    npp.r_pi[info.p] = lambda / info.apq;
                }
                else
                {  npp_error();
                    return 1;
                }
            }

            if (npp.sol == GLP_IPT)
            {  /* recover interior-point solution */
                if (lambda > +DBL_EPSILON && info.lb_changed ||
                    lambda < -DBL_EPSILON && info.ub_changed)
                {  /* actually row p has corresponding active bound */
                    npp.r_pi[info.p] = lambda / info.apq;
                }
                else
                {  /* either bounds of column q are both inactive or its
                 original bound is active */
                    npp.r_pi[info.p] = 0.0;
                }
            }
            return 0;
        }
    );
    info.p = p.i;
    info.q = q.j;
    info.apq = apq.val;
    info.c = q.coef;
    info.lb = p.lb;
    info.ub = p.ub;
    info.lb_changed = lb_changed;
    info.ub_changed = ub_changed;
    info.ptr = null;
    /* save column coefficients a[i,q], i != p (not needed for MIP
     solution) */
    if (npp.sol != GLP_MIP)
    {  for (aij = q.ptr; aij != null; aij = aij.c_next)
    {  if (aij == apq) continue; /* skip a[p,q] */
        lfe = {};
        lfe.ref = aij.row.i;
        lfe.val = aij.val;
        lfe.next = info.ptr;
        info.ptr = lfe;
    }
    }
    /* remove the row from the problem */
    npp_del_row(npp, p);
    return lb_changed >= ub_changed ? lb_changed : ub_changed;
}

function npp_implied_slack(npp, q){
    /* process column singleton (implied slack variable) */
    var info;
    var p;
    var aij;
    var lfe;
    /* the column must be non-integral non-fixed singleton */
    xassert(!q.is_int);
    xassert(q.lb < q.ub);
    xassert(q.ptr != null && q.ptr.c_next == null);
    /* corresponding row must be equality constraint */
    aij = q.ptr;
    p = aij.row;
    xassert(p.lb == p.ub);
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover column singleton (implied slack variable) */
            var temp;
            var lfe;
            if (npp.sol == GLP_SOL)
            {  /* assign statuses to row p and column q */
                if (npp.r_stat[info.p] == GLP_BS ||
                    npp.r_stat[info.p] == GLP_NF)
                    npp.c_stat[info.q] = npp.r_stat[info.p];
                else if (npp.r_stat[info.p] == GLP_NL)
                    npp.c_stat[info.q] =
                        (info.apq > 0.0 ? GLP_NU : GLP_NL);
                else if (npp.r_stat[info.p] == GLP_NU)
                    npp.c_stat[info.q] =
                        (info.apq > 0.0 ? GLP_NL : GLP_NU);
                else
                {  npp_error();
                    return 1;
                }
                npp.r_stat[info.p] = GLP_NS;
            }
            if (npp.sol != GLP_MIP)
            {  /* compute multiplier for row p */
                npp.r_pi[info.p] += info.c / info.apq;
            }
            /* compute value of column q */
            temp = info.b;
            for (lfe = info.ptr; lfe != null; lfe = lfe.next)
                temp -= lfe.val * npp.c_value[lfe.ref];
            npp.c_value[info.q] = temp / info.apq;
            return 0;
        }
    );
    info.p = p.i;
    info.q = q.j;
    info.apq = aij.val;
    info.b = p.lb;
    info.c = q.coef;
    info.ptr = null;
    /* save row coefficients a[p,j], j != q, and substitute x[q]
     into the objective row */
    for (aij = p.ptr; aij != null; aij = aij.r_next)
    {  if (aij.col == q) continue; /* skip a[p,q] */
        lfe = {};
        lfe.ref = aij.col.j;
        lfe.val = aij.val;
        lfe.next = info.ptr;
        info.ptr = lfe;
        aij.col.coef -= info.c * (aij.val / info.apq);
    }
    npp.c0 += info.c * (info.b / info.apq);
    /* compute new row bounds */
    if (info.apq > 0.0)
    {  p.lb = (q.ub == +DBL_MAX ?
        -DBL_MAX : info.b - info.apq * q.ub);
        p.ub = (q.lb == -DBL_MAX ?
            +DBL_MAX : info.b - info.apq * q.lb);
    }
    else
    {  p.lb = (q.lb == -DBL_MAX ?
        -DBL_MAX : info.b - info.apq * q.lb);
        p.ub = (q.ub == +DBL_MAX ?
            +DBL_MAX : info.b - info.apq * q.ub);
    }
    /* remove the column from the problem */
    npp_del_col(npp, q);
}

function npp_implied_free(npp, q){
    /* process column singleton (implied free variable) */
    var info;
    var p;
    var apq, aij;
    var alfa, beta, l, u, pi, eps;
    /* the column must be non-fixed singleton */
    xassert(q.lb < q.ub);
    xassert(q.ptr != null && q.ptr.c_next == null);
    /* corresponding row must be inequality constraint */
    apq = q.ptr;
    p = apq.row;
    xassert(p.lb != -DBL_MAX || p.ub != +DBL_MAX);
    xassert(p.lb < p.ub);
    /* compute alfa */
    alfa = p.lb;
    if (alfa != -DBL_MAX)
    {  for (aij = p.ptr; aij != null; aij = aij.r_next)
    {  if (aij == apq) continue; /* skip a[p,q] */
        if (aij.val > 0.0)
        {  if (aij.col.ub == +DBL_MAX)
        {  alfa = -DBL_MAX;
            break;
        }
            alfa -= aij.val * aij.col.ub;
        }
        else /* < 0.0 */
        {  if (aij.col.lb == -DBL_MAX)
        {  alfa = -DBL_MAX;
            break;
        }
            alfa -= aij.val * aij.col.lb;
        }
    }
    }
    /* compute beta */
    beta = p.ub;
    if (beta != +DBL_MAX)
    {  for (aij = p.ptr; aij != null; aij = aij.r_next)
    {  if (aij == apq) continue; /* skip a[p,q] */
        if (aij.val > 0.0)
        {  if (aij.col.lb == -DBL_MAX)
        {  beta = +DBL_MAX;
            break;
        }
            beta -= aij.val * aij.col.lb;
        }
        else /* < 0.0 */
        {  if (aij.col.ub == +DBL_MAX)
        {  beta = +DBL_MAX;
            break;
        }
            beta -= aij.val * aij.col.ub;
        }
    }
    }
    /* compute implied column lower bound l'[q] */
    if (apq.val > 0.0)
        l = (alfa == -DBL_MAX ? -DBL_MAX : alfa / apq.val);
    else /* < 0.0 */
        l = (beta == +DBL_MAX ? -DBL_MAX : beta / apq.val);
    /* compute implied column upper bound u'[q] */
    if (apq.val > 0.0)
        u = (beta == +DBL_MAX ? +DBL_MAX : beta / apq.val);
    else
        u = (alfa == -DBL_MAX ? +DBL_MAX : alfa / apq.val);
    /* check if column lower bound l[q] can be active */
    if (q.lb != -DBL_MAX)
    {  eps = 1e-9 + 1e-12 * Math.abs(q.lb);
        if (l < q.lb - eps) return 1; /* yes, it can */
    }
    /* check if column upper bound u[q] can be active */
    if (q.ub != +DBL_MAX)
    {  eps = 1e-9 + 1e-12 * Math.abs(q.ub);
        if (u > q.ub + eps) return 1; /* yes, it can */
    }
    /* okay; make column q free (unbounded) */
    q.lb = -DBL_MAX; q.ub = +DBL_MAX;
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover column singleton (implied free variable) */
            if (npp.sol == GLP_SOL)
            {  if (npp.r_stat[info.p] == GLP_BS)
                npp.r_stat[info.p] = GLP_BS;
            else if (npp.r_stat[info.p] == GLP_NS)
            {  xassert(info.stat == GLP_NL || info.stat == GLP_NU);
                npp.r_stat[info.p] = info.stat;
            }
            else
            {  npp_error();
                return 1;
            }
            }
            return 0;
        }
    );
    info.p = p.i;
    info.stat = -1;
    /* compute row multiplier pi[p] */
    pi = q.coef / apq.val;
    /* check dual feasibility for row p */

    function nl(){
        info.stat = GLP_NL;
        p.ub = p.lb;
    }

    function nu(){
        info.stat = GLP_NU;
        p.lb = p.ub;
    }

    if (pi > +DBL_EPSILON)
    {  /* lower bound L[p] must be active */
        if (p.lb != -DBL_MAX)
            nl();
        else
        {  if (pi > +1e-5) return 2; /* dual infeasibility */
            /* take a chance on U[p] */
            xassert(p.ub != +DBL_MAX);
            nu();
        }
    }
    else if (pi < -DBL_EPSILON)
    {  /* upper bound U[p] must be active */
        if (p.ub != +DBL_MAX)
            nu();
        else
        {  if (pi < -1e-5) return 2; /* dual infeasibility */
            /* take a chance on L[p] */
            xassert(p.lb != -DBL_MAX);
            nl();
        }
    }
    else
    {  /* any bound (either L[p] or U[p]) can be made active  */
        if (p.ub == +DBL_MAX)
        {  xassert(p.lb != -DBL_MAX);
           nl();
        }
        else if (p.lb == -DBL_MAX)
        {  xassert(p.ub != +DBL_MAX);
            nu();
        } else {
            if (Math.abs(p.lb) <= Math.abs(p.ub)) nl(); else nu();
        }

    }
    return 0;
}

function npp_eq_doublet(npp, p){
    /* process row doubleton (equality constraint) */
    var info;
    var i;
    var q, r;
    var apq, apr, aiq, air, next;
    var lfe;
    var gamma;
    /* the row must be doubleton equality constraint */
    xassert(p.lb == p.ub);
    xassert(p.ptr != null && p.ptr.r_next != null &&
        p.ptr.r_next.r_next == null);
    /* choose column to be eliminated */
    {  var a1, a2;
        a1 = p.ptr; a2 = a1.r_next;
        if (Math.abs(a2.val) < 0.001 * Math.abs(a1.val))
        {  /* only first column can be eliminated, because second one
         has too small constraint coefficient */
            apq = a1; apr = a2;
        }
        else if (Math.abs(a1.val) < 0.001 * Math.abs(a2.val))
        {  /* only second column can be eliminated, because first one
         has too small constraint coefficient */
            apq = a2; apr = a1;
        }
        else
        {  /* both columns are appropriate; choose that one which is
         shorter to minimize fill-in */
            if (npp_col_nnz(a1.col) <= npp_col_nnz(a2.col))
            {  /* first column is shorter */
                apq = a1; apr = a2;
            }
            else
            {  /* second column is shorter */
                apq = a2; apr = a1;
            }
        }
    }
    /* now columns q and r have been chosen */
    q = apq.col; r = apr.col;
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover row doubleton (equality constraint) */
            var lfe;
            var gamma, temp;
            /* we assume that processing row p is followed by processing
             column q as singleton of type "implied slack variable", in
             which case row p must always be active equality constraint */
            if (npp.sol == GLP_SOL)
            {  if (npp.r_stat[info.p] != GLP_NS)
            {  npp_error();
                return 1;
            }
            }
            if (npp.sol != GLP_MIP)
            {  /* compute value of multiplier for row p; see (14) */
                temp = npp.r_pi[info.p];
                for (lfe = info.ptr; lfe != null; lfe = lfe.next)
                {  gamma = lfe.val / info.apq; /* a[i,q] / a[p,q] */
                    temp -= gamma * npp.r_pi[lfe.ref];
                }
                npp.r_pi[info.p] = temp;
            }
            return 0;
        }
    );
    info.p = p.i;
    info.apq = apq.val;
    info.ptr = null;
    /* transform each row i (i != p), where a[i,q] != 0, to eliminate
     column q */
    for (aiq = q.ptr; aiq != null; aiq = next)
    {  next = aiq.c_next;
        if (aiq == apq) continue; /* skip row p */
        i = aiq.row; /* row i to be transformed */
        /* save constraint coefficient a[i,q] */
        if (npp.sol != GLP_MIP)
        {  lfe = {};
            lfe.ref = i.i;
            lfe.val = aiq.val;
            lfe.next = info.ptr;
            info.ptr = lfe;
        }
        /* find coefficient a[i,r] in row i */
        for (air = i.ptr; air != null; air = air.r_next)
            if (air.col == r) break;
        /* if a[i,r] does not exist, create a[i,r] = 0 */
        if (air == null)
            air = npp_add_aij(i, r, 0.0);
        /* compute gamma[i] = a[i,q] / a[p,q] */
        gamma = aiq.val / apq.val;
        /* (row i) := (row i) - gamma[i] * (row p); see (3)-(6) */
        /* new a[i,q] is exact zero due to elimnation; remove it from
         row i */
        npp_del_aij(aiq);
        /* compute new a[i,r] */
        air.val -= gamma * apr.val;
        /* if new a[i,r] is close to zero due to numeric cancelation,
         remove it from row i */
        if (Math.abs(air.val) <= 1e-10)
            npp_del_aij(air);
        /* compute new lower and upper bounds of row i */
        if (i.lb == i.ub)
            i.lb = i.ub = (i.lb - gamma * p.lb);
        else
        {  if (i.lb != -DBL_MAX)
            i.lb -= gamma * p.lb;
            if (i.ub != +DBL_MAX)
                i.ub -= gamma * p.lb;
        }
    }
    return q;
}

function npp_forcing_row(npp, p, at){
    /* process forcing row */
    var info;
    var col = null;
    var j;
    var apj, aij;
    var lfe;
    var big;
    xassert(at == 0 || at == 1);
    /* determine maximal magnitude of the row coefficients */
    big = 1.0;
    for (apj = p.ptr; apj != null; apj = apj.r_next)
        if (big < Math.abs(apj.val)) big = Math.abs(apj.val);
    /* if there are too small coefficients in the row, transformation
     should not be applied */
    for (apj = p.ptr; apj != null; apj = apj.r_next)
        if (Math.abs(apj.val) < 1e-7 * big) return 1;
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover forcing row */
            var col, piv;
            var lfe;
            var d, big, temp;
            if (npp.sol == GLP_MIP) return 0;
            /* initially solution to the original problem is the same as
             to the transformed problem, where row p is inactive constraint
             with pi[p] = 0, and all columns are non-basic */
            if (npp.sol == GLP_SOL)
            {  if (npp.r_stat[info.p] != GLP_BS)
            {  npp_error();
                return 1;
            }
                for (col = info.ptr; col != null; col = col.next)
                {  if (npp.c_stat[col.j] != GLP_NS)
                {  npp_error();
                    return 1;
                }
                    npp.c_stat[col.j] = col.stat; /* original status */
                }
            }
            /* compute reduced costs d[j] for all columns with formula (10)
             and store them in col.c instead objective coefficients */
            for (col = info.ptr; col != null; col = col.next)
            {  d = col.c;
                for (lfe = col.ptr; lfe != null; lfe = lfe.next)
                    d -= lfe.val * npp.r_pi[lfe.ref];
                col.c = d;
            }
            /* consider columns j, whose multipliers lambda[j] has wrong
             sign in solution to the transformed problem (where lambda[j] =
             d[j]), and choose column q, whose multipler lambda[q] reaches
             zero last on changing row multiplier pi[p]; see (14) */
            piv = null; big = 0.0;
            for (col = info.ptr; col != null; col = col.next)
            {  d = col.c; /* d[j] */
                temp = Math.abs(d / col.a);
                if (col.stat == GLP_NL)
                {  /* column j has active lower bound */
                    if (d < 0.0 && big < temp){
                        piv = col; big = temp;
                    }
                }
                else if (col.stat == GLP_NU)
                {  /* column j has active upper bound */
                    if (d > 0.0 && big < temp){
                        piv = col; big = temp;
                    }
                }
                else
                {  npp_error();
                    return 1;
                }
            }
            /* if column q does not exist, no correction is needed */
            if (piv != null)
            {  /* correct solution; row p becomes active constraint while
             column q becomes basic */
                if (npp.sol == GLP_SOL)
                {  npp.r_stat[info.p] = info.stat;
                    npp.c_stat[piv.j] = GLP_BS;
                }
                /* assign new value to row multiplier pi[p] = d[p] / a[p,q] */
                npp.r_pi[info.p] = piv.c / piv.a;
            }
            return 0;
        }
    );
    info.p = p.i;
    if (p.lb == p.ub)
    {  /* equality constraint */
        info.stat = GLP_NS;
    }
    else if (at == 0)
    {  /* inequality constraint; case L[p] = U'[p] */
        info.stat = GLP_NL;
        xassert(p.lb != -DBL_MAX);
    }
    else /* at == 1 */
    {  /* inequality constraint; case U[p] = L'[p] */
        info.stat = GLP_NU;
        xassert(p.ub != +DBL_MAX);
    }
    info.ptr = null;
    /* scan the forcing row, fix columns at corresponding bounds, and
     save column information (the latter is not needed for MIP) */
    for (apj = p.ptr; apj != null; apj = apj.r_next)
    {  /* column j has non-zero coefficient in the forcing row */
        j = apj.col;
        /* it must be non-fixed */
        xassert(j.lb < j.ub);
        /* allocate stack entry to save column information */
        if (npp.sol != GLP_MIP)
        {  col = {};
            col.j = j.j;
            col.stat = -1; /* will be set below */
            col.a = apj.val;
            col.c = j.coef;
            col.ptr = null;
            col.next = info.ptr;
            info.ptr = col;
        }
        /* fix column j */
        if (at == 0 && apj.val < 0.0 || at != 0 && apj.val > 0.0)
        {  /* at its lower bound */
            if (npp.sol != GLP_MIP)
                col.stat = GLP_NL;
            xassert(j.lb != -DBL_MAX);
            j.ub = j.lb;
        }
        else
        {  /* at its upper bound */
            if (npp.sol != GLP_MIP)
                col.stat = GLP_NU;
            xassert(j.ub != +DBL_MAX);
            j.lb = j.ub;
        }
        /* save column coefficients a[i,j], i != p */
        if (npp.sol != GLP_MIP)
        {  for (aij = j.ptr; aij != null; aij = aij.c_next)
        {  if (aij == apj) continue; /* skip a[p,j] */
            lfe = {};
            lfe.ref = aij.row.i;
            lfe.val = aij.val;
            lfe.next = col.ptr;
            col.ptr = lfe;
        }
        }
    }
    /* make the row free (unbounded) */
    p.lb = -DBL_MAX; p.ub = +DBL_MAX;
    return 0;
}

function npp_analyze_row(npp, p){
    /* perform general row analysis */
    var aij;
    var ret = 0x00;
    var l, u, eps;
    xassert(npp == npp);
    /* compute implied lower bound L'[p]; see (3) */
    l = 0.0;
    for (aij = p.ptr; aij != null; aij = aij.r_next)
    {  if (aij.val > 0.0)
    {  if (aij.col.lb == -DBL_MAX)
    {  l = -DBL_MAX;
        break;
    }
        l += aij.val * aij.col.lb;
    }
    else /* aij.val < 0.0 */
    {  if (aij.col.ub == +DBL_MAX)
    {  l = -DBL_MAX;
        break;
    }
        l += aij.val * aij.col.ub;
    }
    }
    /* compute implied upper bound U'[p]; see (4) */
    u = 0.0;
    for (aij = p.ptr; aij != null; aij = aij.r_next)
    {  if (aij.val > 0.0)
    {  if (aij.col.ub == +DBL_MAX)
    {  u = +DBL_MAX;
        break;
    }
        u += aij.val * aij.col.ub;
    }
    else /* aij.val < 0.0 */
    {  if (aij.col.lb == -DBL_MAX)
    {  u = +DBL_MAX;
        break;
    }
        u += aij.val * aij.col.lb;
    }
    }
    /* column bounds are assumed correct, so L'[p] <= U'[p] */
    /* check if row lower bound is consistent */
    if (p.lb != -DBL_MAX)
    {  eps = 1e-3 + 1e-6 * Math.abs(p.lb);
        if (p.lb - eps > u)
        {  ret = 0x33;
            return ret;
        }
    }
    /* check if row upper bound is consistent */
    if (p.ub != +DBL_MAX)
    {  eps = 1e-3 + 1e-6 * Math.abs(p.ub);
        if (p.ub + eps < l)
        {  ret = 0x33;
            return ret;
        }
    }
    /* check if row lower bound can be active/forcing */
    if (p.lb != -DBL_MAX)
    {  eps = 1e-9 + 1e-12 * Math.abs(p.lb);
        if (p.lb - eps > l)
        {  if (p.lb + eps <= u)
            ret |= 0x01;
        else
            ret |= 0x02;
        }
    }
    /* check if row upper bound can be active/forcing */
    if (p.ub != +DBL_MAX)
    {  eps = 1e-9 + 1e-12 * Math.abs(p.ub);
        if (p.ub + eps < u)
        {  /* check if the upper bound is forcing */
            if (p.ub - eps >= l)
                ret |= 0x10;
            else
                ret |= 0x20;
        }
    }
    return ret;
}

function npp_inactive_bound(npp, p, which){
    /* remove row lower/upper inactive bound */
    var info;
    if (npp.sol == GLP_SOL)
    {  /* create transformation stack entry */
        info = npp_push_tse(npp,
            function (npp, info){
                /* recover row status */
                if (npp.sol != GLP_SOL)
                {  npp_error();
                    return 1;
                }
                if (npp.r_stat[info.p] == GLP_BS)
                    npp.r_stat[info.p] = GLP_BS;
                else
                    npp.r_stat[info.p] = info.stat;
                return 0;
            }
        );
        info.p = p.i;
        if (p.ub == +DBL_MAX)
            info.stat = GLP_NL;
        else if (p.lb == -DBL_MAX)
            info.stat = GLP_NU;
        else if (p.lb != p.ub)
            info.stat = (which == 0 ? GLP_NU : GLP_NL);
        else
            info.stat = GLP_NS;
    }
    /* remove row inactive bound */
    if (which == 0)
    {  xassert(p.lb != -DBL_MAX);
        p.lb = -DBL_MAX;
    }
    else if (which == 1)
    {  xassert(p.ub != +DBL_MAX);
        p.ub = +DBL_MAX;
    }
    else
        xassert(which != which);
}

function npp_implied_bounds(npp, p){
    var apj, apk;
    var big, eps, temp;
    var skip = false;
    xassert(npp == npp);
    /* initialize implied bounds for all variables and determine
     maximal magnitude of row coefficients a[p,j] */
    big = 1.0;
    for (apj = p.ptr; apj != null; apj = apj.r_next)
    {  apj.col.ll.ll = -DBL_MAX; apj.col.uu.uu = +DBL_MAX;
        if (big < Math.abs(apj.val)) big = Math.abs(apj.val);
    }
    eps = 1e-6 * big;
    /* process row lower bound (assuming that it can be active) */
    if (p.lb != -DBL_MAX){
        apk = null;

        for (apj = p.ptr; apj != null; apj = apj.r_next){
            if (apj.val > 0.0 && apj.col.ub == +DBL_MAX || apj.val < 0.0 && apj.col.lb == -DBL_MAX){
                if (apk == null)
                    apk = apj;
                else {
                    skip = true;
                    break;
                }
            }
        }
        if (!skip){
            /* if a[p,k] = null then |J'| = 0 else J' = { k } */
            temp = p.lb;
            for (apj = p.ptr; apj != null; apj = apj.r_next)
            {  if (apj == apk){
                /* skip a[p,k] */
            }
            else if (apj.val > 0.0)
                temp -= apj.val * apj.col.ub;
            else /* apj.val < 0.0 */
                temp -= apj.val * apj.col.lb;
            }
            /* compute column implied bounds */
            if (apk == null)
            {  /* temp = L[p] - U'[p] */
                for (apj = p.ptr; apj != null; apj = apj.r_next)
                {  if (apj.val >= +eps)
                {  /* l'[j] := u[j] + (L[p] - U'[p]) / a[p,j] */
                    apj.col.ll.ll = apj.col.ub + temp / apj.val;
                }
                else if (apj.val <= -eps)
                {  /* u'[j] := l[j] + (L[p] - U'[p]) / a[p,j] */
                    apj.col.uu.uu = apj.col.lb + temp / apj.val;
                }
                }
            }
            else
            {  /* temp = L[p,k] */
                if (apk.val >= +eps)
                {  /* l'[k] := L[p,k] / a[p,k] */
                    apk.col.ll.ll = temp / apk.val;
                }
                else if (apk.val <= -eps)
                {  /* u'[k] := L[p,k] / a[p,k] */
                    apk.col.uu.uu = temp / apk.val;
                }
            }
        }
    }

    skip = false;
    /* process row upper bound (assuming that it can be active) */
    if (p.ub != +DBL_MAX)
    {  apk = null;
        for (apj = p.ptr; apj != null; apj = apj.r_next){
            if (apj.val > 0.0 && apj.col.lb == -DBL_MAX || apj.val < 0.0 && apj.col.ub == +DBL_MAX){
                if (apk == null)
                    apk = apj;
                else {
                    skip = true;
                    break;
                }
            }
        }
        if (!skip){
            /* if a[p,k] = null then |J''| = 0 else J'' = { k } */
            temp = p.ub;
            for (apj = p.ptr; apj != null; apj = apj.r_next)
            {  if (apj == apk){
                /* skip a[p,k] */
            }
            else if (apj.val > 0.0)
                temp -= apj.val * apj.col.lb;
            else /* apj.val < 0.0 */
                temp -= apj.val * apj.col.ub;
            }
            /* compute column implied bounds */
            if (apk == null)
            {  /* temp = U[p] - L'[p] */
                for (apj = p.ptr; apj != null; apj = apj.r_next)
                {  if (apj.val >= +eps)
                {  /* u'[j] := l[j] + (U[p] - L'[p]) / a[p,j] */
                    apj.col.uu.uu = apj.col.lb + temp / apj.val;
                }
                else if (apj.val <= -eps)
                {  /* l'[j] := u[j] + (U[p] - L'[p]) / a[p,j] */
                    apj.col.ll.ll = apj.col.ub + temp / apj.val;
                }
                }
            }
            else
            {  /* temp = U[p,k] */
                if (apk.val >= +eps)
                {  /* u'[k] := U[p,k] / a[p,k] */
                    apk.col.uu.uu = temp / apk.val;
                }
                else if (apk.val <= -eps)
                {  /* l'[k] := U[p,k] / a[p,k] */
                    apk.col.ll.ll = temp / apk.val;
                }
            }
        }
    }
}
