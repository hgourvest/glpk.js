function ios_gmi_gen(tree){

    var MAXCUTS = 50;
    /* maximal number of cuts to be generated for one round */

    function f(x) {return x - Math.floor(x)}
    /* compute fractional part of x */

    function gen_cut(tree, worka, j){
        /* this routine tries to generate Gomory's mixed integer cut for
         specified structural variable x[m+j] of integer kind, which is
         basic and has fractional value in optimal solution to current
         LP relaxation */
        var mip = tree.mip;
        var m = mip.m;
        var n = mip.n;
        var ind = worka.ind;
        var val = worka.val;
        var phi = worka.phi;
        var i, k, len, kind, stat;
        var lb, ub, alfa, beta, ksi, phi1, rhs;
        var row, col;
        /* compute row of the simplex tableau, which (row) corresponds
         to specified basic variable xB[i] = x[m+j]; see (23) */
        len = glp_eval_tab_row(mip, m+j, ind, val);
        /* determine beta[i], which a value of xB[i] in optimal solution
         to current LP relaxation; note that this value is the same as
         if it would be computed with formula (27); it is assumed that
         beta[i] is fractional enough */
        beta = mip.col[j].prim;
        /* compute cut coefficients phi and right-hand side rho, which
         correspond to formula (30); dense format is used, because rows
         of the simplex tableau is usually dense */
        for (k = 1; k <= m+n; k++) phi[k] = 0.0;
        rhs = f(beta); /* initial value of rho; see (28), (32) */
        for (j = 1; j <= len; j++)
        {  /* determine original number of non-basic variable xN[j] */
            k = ind[j];
            xassert(1 <= k && k <= m+n);
            /* determine the kind, bounds and current status of xN[j] in
             optimal solution to LP relaxation */
            if (k <= m)
            {  /* auxiliary variable */
                row = mip.row[k];
                kind = GLP_CV;
                lb = row.lb;
                ub = row.ub;
                stat = row.stat;
            }
            else
            {  /* structural variable */
                col = mip.col[k-m];
                kind = col.kind;
                lb = col.lb;
                ub = col.ub;
                stat = col.stat;
            }
            /* xN[j] cannot be basic */
            xassert(stat != GLP_BS);
            /* determine row coefficient ksi[i,j] at xN[j]; see (23) */
            ksi = val[j];
            /* if ksi[i,j] is too large in the magnitude, do not generate
             the cut */
            if (Math.abs(ksi) > 1e+05) return;
            /* if ksi[i,j] is too small in the magnitude, skip it */
            if (Math.abs(ksi) < 1e-10) continue;
            /* compute row coefficient alfa[i,j] at y[j]; see (26) */
            switch (stat)
            {  case GLP_NF:
                /* xN[j] is free (unbounded) having non-zero ksi[i,j];
                 do not generate the cut */
                return;
                case GLP_NL:
                    /* xN[j] has active lower bound */
                    alfa = - ksi;
                    break;
                case GLP_NU:
                    /* xN[j] has active upper bound */
                    alfa = + ksi;
                    break;
                case GLP_NS:
                    /* xN[j] is fixed; skip it */
                    continue;
                default:
                    xassert(stat != stat);
            }
            /* compute cut coefficient phi'[j] at y[j]; see (21), (28) */
            switch (kind)
            {  case GLP_IV:
                /* y[j] is integer */
                if (Math.abs(alfa - Math.floor(alfa + 0.5)) < 1e-10)
                {  /* alfa[i,j] is close to nearest integer; skip it */
                    continue;
                }
                else if (f(alfa) <= f(beta))
                    phi1 = f(alfa);
                else
                    phi1 = (f(beta) / (1.0 - f(beta))) * (1.0 - f(alfa));
                break;
                case GLP_CV:
                    /* y[j] is continuous */
                    if (alfa >= 0.0)
                        phi1 = + alfa;
                    else
                        phi1 = (f(beta) / (1.0 - f(beta))) * (- alfa);
                    break;
                default:
                    xassert(kind != kind);
            }
            /* compute cut coefficient phi[j] at xN[j] and update right-
             hand side rho; see (31), (32) */
            switch (stat)
            {  case GLP_NL:
                /* xN[j] has active lower bound */
                phi[k] = + phi1;
                rhs += phi1 * lb;
                break;
                case GLP_NU:
                    /* xN[j] has active upper bound */
                    phi[k] = - phi1;
                    rhs -= phi1 * ub;
                    break;
                default:
                    xassert(stat != stat);
            }
        }
        /* now the cut has the form sum_k phi[k] * x[k] >= rho, where cut
         coefficients are stored in the array phi in dense format;
         x[1,...,m] are auxiliary variables, x[m+1,...,m+n] are struc-
         tural variables; see (30) */
        /* eliminate auxiliary variables in order to express the cut only
         through structural variables; see (33) */
        for (i = 1; i <= m; i++)
        {
            var aij;
            if (Math.abs(phi[i]) < 1e-10) continue;
            /* auxiliary variable x[i] has non-zero cut coefficient */
            row = mip.row[i];
            /* x[i] cannot be fixed */
            xassert(row.type != GLP_FX);
            /* substitute x[i] = sum_j a[i,j] * x[m+j] */
            for (aij = row.ptr; aij != null; aij = aij.r_next)
                phi[m+aij.col.j] += phi[i] * aij.val;
        }
        /* convert the final cut to sparse format and substitute fixed
         (structural) variables */
        len = 0;
        for (j = 1; j <= n; j++)
        {
            if (Math.abs(phi[m+j]) < 1e-10) continue;
            /* structural variable x[m+j] has non-zero cut coefficient */
            col = mip.col[j];
            if (col.type == GLP_FX)
            {  /* eliminate x[m+j] */
                rhs -= phi[m+j] * col.lb;
            }
            else
            {  len++;
                ind[len] = j;
                val[len] = phi[m+j];
            }
        }
        if (Math.abs(rhs) < 1e-12) rhs = 0.0;
        /* if the cut inequality seems to be badly scaled, reject it to
         avoid numeric difficulties */
        for (k = 1; k <= len; k++)
        {  if (Math.abs(val[k]) < 1e-03) return;
            if (Math.abs(val[k]) > 1e+03) return;
        }
        /* add the cut to the cut pool for further consideration */
        glp_ios_add_row(tree, null, GLP_RF_GMI, 0, len, ind, val, GLP_LO, rhs);
    }

    /* main routine to generate Gomory's cuts */
    var mip = tree.mip;
    var m = mip.m;
    var n = mip.n;
    var var_;
    var k, nv, j, size;
    var worka = {};
    /* allocate working arrays */
    var_ = new Array(1+n);
    worka.ind = new Array(1+n);
    worka.val = new Array(1+n);
    worka.phi = new Array(1+m+n);
    /* build the list of integer structural variables, which are
     basic and have fractional value in optimal solution to current
     LP relaxation */
    nv = 0;
    for (j = 1; j <= n; j++)
    {  var col = mip.col[j];
        var frac;
        if (col.kind != GLP_IV) continue;
        if (col.type == GLP_FX) continue;
        if (col.stat != GLP_BS) continue;
        frac = f(col.prim);
        if (!(0.05 <= frac && frac <= 0.95)) continue;
        /* add variable to the list */
        nv++; var_[nv].j = j; var_[nv].f = frac;
    }
    /* order the list by descending fractionality */
    xqsort(var_, 1, nv,
        function(v1, v2){
            if (v1.f > v2.f) return -1;
            if (v1.f < v2.f) return +1;
            return 0;
        }
    );
    /* try to generate cuts by one for each variable in the list, but
     not more than MAXCUTS cuts */
    size = glp_ios_pool_size(tree);
    for (k = 1; k <= nv; k++)
    {  if (glp_ios_pool_size(tree) - size >= MAXCUTS) break;
        gen_cut(tree, worka, var_[k].j);
    }
}
