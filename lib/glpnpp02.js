
function npp_free_row(npp, p){
    /* process free (unbounded) row */
    var info;
    /* the row must be free */
    xassert(p.lb == -DBL_MAX && p.ub == +DBL_MAX);
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover free (unbounded) row */
            if (npp.sol == GLP_SOL)
                npp.r_stat[info.p] = GLP_BS;
            if (npp.sol != GLP_MIP)
                npp.r_pi[info.p] = 0.0;
            return 0;
        }
    );
    info.p = p.i;
    /* remove the row from the problem */
    npp_del_row(npp, p);
}

function npp_geq_row(npp, p){
    /* process row of 'not less than' type */
    var info;
    var s;
    /* the row must have lower bound */
    xassert(p.lb != -DBL_MAX);
    xassert(p.lb < p.ub);
    /* create column for surplus variable */
    s = npp_add_col(npp);
    s.lb = 0.0;
    s.ub = (p.ub == +DBL_MAX ? +DBL_MAX : p.ub - p.lb);
    /* and add it to the transformed problem */
    npp_add_aij(p, s, -1.0);
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function rcv_geq_row(npp, info){
            /* recover row of 'not less than' type */
            if (npp.sol == GLP_SOL)
            {  if (npp.r_stat[info.p] == GLP_BS)
            {  if (npp.c_stat[info.s] == GLP_BS)
            {  npp_error();
                return 1;
            }
            else if (npp.c_stat[info.s] == GLP_NL ||
                npp.c_stat[info.s] == GLP_NU)
                npp.r_stat[info.p] = GLP_BS;
            else
            {  npp_error();
                return 1;
            }
            }
            else if (npp.r_stat[info.p] == GLP_NS)
            {  if (npp.c_stat[info.s] == GLP_BS)
                npp.r_stat[info.p] = GLP_BS;
            else if (npp.c_stat[info.s] == GLP_NL)
                npp.r_stat[info.p] = GLP_NL;
            else if (npp.c_stat[info.s] == GLP_NU)
                npp.r_stat[info.p] = GLP_NU;
            else
            {  npp_error();
                return 1;
            }
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
    info.s = s.j;
    /* replace the row by equality constraint */
    p.ub = p.lb;
}

function npp_leq_row(npp, p){
    /* process row of 'not greater than' type */
    var info;
    var s;
    /* the row must have upper bound */
    xassert(p.ub != +DBL_MAX);
    xassert(p.lb < p.ub);
    /* create column for slack variable */
    s = npp_add_col(npp);
    s.lb = 0.0;
    s.ub = (p.lb == -DBL_MAX ? +DBL_MAX : p.ub - p.lb);
    /* and add it to the transformed problem */
    npp_add_aij(p, s, +1.0);
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover row of 'not greater than' type */
            if (npp.sol == GLP_SOL)
            {  if (npp.r_stat[info.p] == GLP_BS)
            {  if (npp.c_stat[info.s] == GLP_BS)
            {  npp_error();
                return 1;
            }
            else if (npp.c_stat[info.s] == GLP_NL ||
                npp.c_stat[info.s] == GLP_NU)
                npp.r_stat[info.p] = GLP_BS;
            else
            {  npp_error();
                return 1;
            }
            }
            else if (npp.r_stat[info.p] == GLP_NS)
            {  if (npp.c_stat[info.s] == GLP_BS)
                npp.r_stat[info.p] = GLP_BS;
            else if (npp.c_stat[info.s] == GLP_NL)
                npp.r_stat[info.p] = GLP_NU;
            else if (npp.c_stat[info.s] == GLP_NU)
                npp.r_stat[info.p] = GLP_NL;
            else
            {  npp_error();
                return 1;
            }
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
    info.s = s.j;
    /* replace the row by equality constraint */
    p.lb = p.ub;
}

function npp_free_col(npp, q){
    /* process free (unbounded) column */
    var info;
    var s;
    var aij;
    /* the column must be free */
    xassert(q.lb == -DBL_MAX && q.ub == +DBL_MAX);
    /* variable x[q] becomes s' */
    q.lb = 0.0; q.ub = +DBL_MAX;
    /* create variable s'' */
    s = npp_add_col(npp);
    s.is_int = q.is_int;
    s.lb = 0.0; s.ub = +DBL_MAX;
    /* duplicate objective coefficient */
    s.coef = -q.coef;
    /* duplicate column of the constraint matrix */
    for (aij = q.ptr; aij != null; aij = aij.c_next)
        npp_add_aij(aij.row, s, -aij.val);
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover free (unbounded) column */
            if (npp.sol == GLP_SOL)
            {  if (npp.c_stat[info.q] == GLP_BS)
            {  if (npp.c_stat[info.s] == GLP_BS)
            {  npp_error();
                return 1;
            }
            else if (npp.c_stat[info.s] == GLP_NL)
                npp.c_stat[info.q] = GLP_BS;
            else
            {  npp_error();
                return -1;
            }
            }
            else if (npp.c_stat[info.q] == GLP_NL)
            {  if (npp.c_stat[info.s] == GLP_BS)
                npp.c_stat[info.q] = GLP_BS;
            else if (npp.c_stat[info.s] == GLP_NL)
                npp.c_stat[info.q] = GLP_NF;
            else
            {  npp_error();
                return -1;
            }
            }
            else
            {  npp_error();
                return -1;
            }
            }
            /* compute value of x[q] with formula (2) */
            npp.c_value[info.q] -= npp.c_value[info.s];
            return 0;
        }
    );
    info.q = q.j;
    info.s = s.j;
}

function npp_lbnd_col(npp, q){
    /* process column with (non-zero) lower bound */
    var info;
    var i;
    var aij;
    /* the column must have non-zero lower bound */
    xassert(q.lb != 0.0);
    xassert(q.lb != -DBL_MAX);
    xassert(q.lb < q.ub);
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover column with (non-zero) lower bound */
            if (npp.sol == GLP_SOL)
            {  if (npp.c_stat[info.q] == GLP_BS ||
                npp.c_stat[info.q] == GLP_NL ||
                npp.c_stat[info.q] == GLP_NU)
                npp.c_stat[info.q] = npp.c_stat[info.q];
            else
            {  npp_error();
                return 1;
            }
            }
            /* compute value of x[q] with formula (2) */
            npp.c_value[info.q] = info.bnd + npp.c_value[info.q];
            return 0;
        }
    );
    info.q = q.j;
    info.bnd = q.lb;
    /* substitute x[q] into objective row */
    npp.c0 += q.coef * q.lb;
    /* substitute x[q] into constraint rows */
    for (aij = q.ptr; aij != null; aij = aij.c_next)
    {  i = aij.row;
        if (i.lb == i.ub)
            i.ub = (i.lb -= aij.val * q.lb);
        else
        {  if (i.lb != -DBL_MAX)
            i.lb -= aij.val * q.lb;
            if (i.ub != +DBL_MAX)
                i.ub -= aij.val * q.lb;
        }
    }
    /* column x[q] becomes column s */
    if (q.ub != +DBL_MAX)
        q.ub -= q.lb;
    q.lb = 0.0;
}

function npp_ubnd_col(npp, q){
    /* process column with upper bound */
    var info;
    var i;
    var aij;
    /* the column must have upper bound */
    xassert(q.ub != +DBL_MAX);
    xassert(q.lb < q.ub);
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover column with upper bound */
            if (npp.sol == GLP_BS)
            {  if (npp.c_stat[info.q] == GLP_BS)
                npp.c_stat[info.q] = GLP_BS;
            else if (npp.c_stat[info.q] == GLP_NL)
                npp.c_stat[info.q] = GLP_NU;
            else if (npp.c_stat[info.q] == GLP_NU)
                npp.c_stat[info.q] = GLP_NL;
            else
            {  npp_error();
                return 1;
            }
            }
            /* compute value of x[q] with formula (2) */
            npp.c_value[info.q] = info.bnd - npp.c_value[info.q];
            return 0;
        }
    );
    info.q = q.j;
    info.bnd = q.ub;
    /* substitute x[q] into objective row */
    npp.c0 += q.coef * q.ub;
    q.coef = -q.coef;
    /* substitute x[q] into constraint rows */
    for (aij = q.ptr; aij != null; aij = aij.c_next)
    {  i = aij.row;
        if (i.lb == i.ub)
            i.ub = (i.lb -= aij.val * q.ub);
        else
        {  if (i.lb != -DBL_MAX)
            i.lb -= aij.val * q.ub;
            if (i.ub != +DBL_MAX)
                i.ub -= aij.val * q.ub;
        }
        aij.val = -aij.val;
    }
    /* column x[q] becomes column s */
    if (q.lb != -DBL_MAX)
        q.ub -= q.lb;
    else
        q.ub = +DBL_MAX;
    q.lb = 0.0;
}

function npp_dbnd_col(npp, q){
    /* process non-negative column with upper bound */
    var info;
    var p;
    var s;
    /* the column must be non-negative with upper bound */
    xassert(q.lb == 0.0);
    xassert(q.ub > 0.0);
    xassert(q.ub != +DBL_MAX);
    /* create variable s */
    s = npp_add_col(npp);
    s.is_int = q.is_int;
    s.lb = 0.0; s.ub = +DBL_MAX;
    /* create equality constraint (2) */
    p = npp_add_row(npp);
    p.lb = p.ub = q.ub;
    npp_add_aij(p, q, +1.0);
    npp_add_aij(p, s, +1.0);
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover non-negative column with upper bound */
            if (npp.sol == GLP_BS)
            {  if (npp.c_stat[info.q] == GLP_BS)
            {  if (npp.c_stat[info.s] == GLP_BS)
                npp.c_stat[info.q] = GLP_BS;
            else if (npp.c_stat[info.s] == GLP_NL)
                npp.c_stat[info.q] = GLP_NU;
            else
            {  npp_error();
                return 1;
            }
            }
            else if (npp.c_stat[info.q] == GLP_NL)
            {  if (npp.c_stat[info.s] == GLP_BS ||
                npp.c_stat[info.s] == GLP_NL)
                npp.c_stat[info.q] = GLP_NL;
            else
            {  npp_error();
                return 1;
            }
            }
            else
            {  npp_error();
                return 1;
            }
            }
            return 0;
        }
    );
    info.q = q.j;
    info.s = s.j;
    /* remove upper bound of x[q] */
    q.ub = +DBL_MAX;
}

function npp_fixed_col(npp, q){
    /* process fixed column */
    var info;
    var i;
    var aij;
    /* the column must be fixed */
    xassert(q.lb == q.ub);
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover fixed column */
            if (npp.sol == GLP_SOL)
                npp.c_stat[info.q] = GLP_NS;
            npp.c_value[info.q] = info.s;
            return 0;
        }
    );
    info.q = q.j;
    info.s = q.lb;
    /* substitute x[q] = s[q] into objective row */
    npp.c0 += q.coef * q.lb;
    /* substitute x[q] = s[q] into constraint rows */
    for (aij = q.ptr; aij != null; aij = aij.c_next)
    {  i = aij.row;
        if (i.lb == i.ub)
            i.ub = (i.lb -= aij.val * q.lb);
        else
        {  if (i.lb != -DBL_MAX)
            i.lb -= aij.val * q.lb;
            if (i.ub != +DBL_MAX)
                i.ub -= aij.val * q.lb;
        }
    }
    /* remove the column from the problem */
    npp_del_col(npp, q);
}

function npp_make_equality(npp, p){
    /* process row with almost identical bounds */
    var info;
    var b, eps, nint;
    /* the row must be double-sided inequality */
    xassert(p.lb != -DBL_MAX);
    xassert(p.ub != +DBL_MAX);
    xassert(p.lb < p.ub);
    /* check row bounds */
    eps = 1e-9 + 1e-12 * Math.abs(p.lb);
    if (p.ub - p.lb > eps) return 0;
    /* row bounds are very close to each other */
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover row with almost identical bounds */
            if (npp.sol == GLP_SOL)
            {  if (npp.r_stat[info.p] == GLP_BS)
                npp.r_stat[info.p] = GLP_BS;
            else if (npp.r_stat[info.p] == GLP_NS)
            {  if (npp.r_pi[info.p] >= 0.0)
                npp.r_stat[info.p] = GLP_NL;
            else
                npp.r_stat[info.p] = GLP_NU;
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
    /* compute right-hand side */
    b = 0.5 * (p.ub + p.lb);
    nint = Math.floor(b + 0.5);
    if (Math.abs(b - nint) <= eps) b = nint;
    /* replace row p by almost equivalent equality constraint */
    p.lb = p.ub = b;
    return 1;
}

function npp_make_fixed(npp, q){
    /* process column with almost identical bounds */
    var info;
    var aij;
    var lfe;
    var s, eps, nint;
    /* the column must be double-bounded */
    xassert(q.lb != -DBL_MAX);
    xassert(q.ub != +DBL_MAX);
    xassert(q.lb < q.ub);
    /* check column bounds */
    eps = 1e-9 + 1e-12 * Math.abs(q.lb);
    if (q.ub - q.lb > eps) return 0;
    /* column bounds are very close to each other */
    /* create transformation stack entry */
    info = npp_push_tse(npp,
        function (npp, info){
            /* recover column with almost identical bounds */
            var lfe;
            var lambda;
            if (npp.sol == GLP_SOL)
            {  if (npp.c_stat[info.q] == GLP_BS)
                npp.c_stat[info.q] = GLP_BS;
            else if (npp.c_stat[info.q] == GLP_NS)
            {  /* compute multiplier for column q with formula (6) */
                lambda = info.c;
                for (lfe = info.ptr; lfe != null; lfe = lfe.next)
                    lambda -= lfe.val * npp.r_pi[lfe.ref];
                /* assign status to non-basic column */
                if (lambda >= 0.0)
                    npp.c_stat[info.q] = GLP_NL;
                else
                    npp.c_stat[info.q] = GLP_NU;
            }
            else
            {  npp_error();
                return 1;
            }
            }
            return 0;
        }
    );
    info.q = q.j;
    info.c = q.coef;
    info.ptr = null;
    /* save column coefficients a[i,q] (needed for basic solution
     only) */
    if (npp.sol == GLP_SOL)
    {  for (aij = q.ptr; aij != null; aij = aij.c_next)
    {   lfe = {};
        lfe.ref = aij.row.i;
        lfe.val = aij.val;
        lfe.next = info.ptr;
        info.ptr = lfe;
    }
    }
    /* compute column fixed value */
    s = 0.5 * (q.ub + q.lb);
    nint = Math.floor(s + 0.5);
    if (Math.abs(s - nint) <= eps) s = nint;
    /* make column q fixed */
    q.lb = q.ub = s;
    return 1;
}

