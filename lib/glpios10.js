function ios_feas_pump(T){
    var P = T.mip;
    var n = P.n;
    var lp = null;
    var var_ = null;
    var rand = null;
    var col;
    var parm = {};
    var j, k, new_x, nfail, npass, nv, ret, stalling;
    var dist, tol;

    var
        start = 0,
        more = 1,
        pass = 2,
        loop = 3,
        skip = 4,
        done = 5;

    var label = start;

    while (true){
        var go_to = null;
        switch (label){
            case start:
                xassert(glp_get_status(P) == GLP_OPT);
                /* this heuristic is applied only once on the root level */
                if (!(T.curr.level == 0 && T.curr.solved == 1)){go_to = done; break}
                /* determine number of binary variables */
                nv = 0;
                for (j = 1; j <= n; j++)
                {  col = P.col[j];
                    /* if x[j] is continuous, skip it */
                    if (col.kind == GLP_CV) continue;
                    /* if x[j] is fixed, skip it */
                    if (col.type == GLP_FX) continue;
                    /* x[j] is non-fixed integer */
                    xassert(col.kind == GLP_IV);
                    if (col.type == GLP_DB && col.lb == 0.0 && col.ub == 1.0)
                    {  /* x[j] is binary */
                        nv++;
                    }
                    else
                    {  /* x[j] is general integer */
                        if (T.parm.msg_lev >= GLP_MSG_ALL)
                            xprintf("FPUMP heuristic cannot be applied due to genera"+
                                "l integer variables");
                        go_to = done;
                        break;
                    }
                }
                if (go_to != null) break;

                /* there must be at least one binary variable */
                if (nv == 0) {go_to = done; break}
                if (T.parm.msg_lev >= GLP_MSG_ALL)
                    xprintf("Applying FPUMP heuristic...");
                /* build the list of binary variables */
                var_ = new Array(1+nv);
                xfillObjArr(var_, 1, nv);
                k = 0;
                for (j = 1; j <= n; j++)
                {  col = P.col[j];
                    if (col.kind == GLP_IV && col.type == GLP_DB)
                        var_[++k].j = j;
                }
                xassert(k == nv);
                /* create working problem object */
                lp = glp_create_prob();
            case more:
                /* copy the original problem object to keep it intact */
                glp_copy_prob(lp, P, GLP_OFF);
                /* we are interested to find an integer feasible solution, which
                 is better than the best known one */
                if (P.mip_stat == GLP_FEAS)
                {  var ind;
                    var val, bnd;
                    /* add a row and make it identical to the objective row */
                    glp_add_rows(lp, 1);
                    ind = new Array(1+n);
                    val = new Array(1+n);
                    for (j = 1; j <= n; j++)
                    {  ind[j] = j;
                        val[j] = P.col[j].coef;
                    }
                    glp_set_mat_row(lp, lp.m, n, ind, val);

                    /* introduce upper (minimization) or lower (maximization)
                     bound to the original objective function; note that this
                     additional constraint is not violated at the optimal point
                     to LP relaxation */
                    bnd = 0.1 * P.obj_val + 0.9 * P.mip_obj;
                    /* xprintf("bnd = %f", bnd); */
                    if (P.dir == GLP_MIN)
                        glp_set_row_bnds(lp, lp.m, GLP_UP, 0.0, bnd - P.c0);
                    else if (P.dir == GLP_MAX)
                        glp_set_row_bnds(lp, lp.m, GLP_LO, bnd - P.c0, 0.0);
                    else
                        xassert(P != P);
                }
                /* reset pass count */
                npass = 0;
                /* invalidate the rounded point */
                for (k = 1; k <= nv; k++)
                    var_[k].x = -1;
            case pass:
                /* next pass starts here */
                npass++;
                if (T.parm.msg_lev >= GLP_MSG_ALL)
                    xprintf("Pass " + npass + "");
                /* initialize minimal distance between the basic point and the
                 rounded one obtained during this pass */
                dist = DBL_MAX;
                /* reset failure count (the number of succeeded iterations failed
                 to improve the distance) */
                nfail = 0;
                /* if it is not the first pass, perturb the last rounded point
                 rather than construct it from the basic solution */
                if (npass > 1)
                {  var rho, temp;
                    if (rand == null)
                        rand = rng_create_rand();
                    for (k = 1; k <= nv; k++)
                    {  j = var_[k].j;
                        col = lp.col[j];
                        rho = rng_uniform(rand, -0.3, 0.7);
                        if (rho < 0.0) rho = 0.0;
                        temp = Math.abs(var_[k].x - col.prim);
                        if (temp + rho > 0.5) var_[k].x = 1 - var_[k].x;
                    }
                    go_to = skip;
                    break;
                }
            case loop:
                /* innermost loop begins here */
                /* round basic solution (which is assumed primal feasible) */
                stalling = 1;
                for (k = 1; k <= nv; k++)
                {  col = lp.col[var_[k].j];
                    if (col.prim < 0.5)
                    {  /* rounded value is 0 */
                        new_x = 0;
                    }
                    else
                    {  /* rounded value is 1 */
                        new_x = 1;
                    }
                    if (var_[k].x != new_x)
                    {  stalling = 0;
                        var_[k].x = new_x;
                    }
                }
                /* if the rounded point has not changed (stalling), choose and
                 flip some its entries heuristically */
                if (stalling)
                {  /* compute d[j] = |x[j] - round(x[j])| */
                    for (k = 1; k <= nv; k++)
                    {  col = lp.col[var_[k].j];
                        var_[k].d = Math.abs(col.prim - var_[k].x);
                    }
                    /* sort the list of binary variables by descending d[j] */
                    xqsort(var_, 1, nv,
                        function(vx, vy){
                            /* comparison routine */
                            if (vx.d > vy.d)
                                return -1;
                            else if (vx.d < vy.d)
                                return +1;
                            else
                                return 0;
                        }
                    );
                    /* choose and flip some rounded components */
                    for (k = 1; k <= nv; k++)
                    {  if (k >= 5 && var_[k].d < 0.35 || k >= 10) break;
                        var_[k].x = 1 - var_[k].x;
                    }
                }
            case skip:
                /* check if the time limit has been exhausted */
                if (T.parm.tm_lim < INT_MAX &&
                    (T.parm.tm_lim - 1) <=
                        1000.0 * xdifftime(xtime(), T.tm_beg)) {go_to = done; break}
                /* build the objective, which is the distance between the current
                 (basic) point and the rounded one */
                lp.dir = GLP_MIN;
                lp.c0 = 0.0;
                for (j = 1; j <= n; j++)
                    lp.col[j].coef = 0.0;
                for (k = 1; k <= nv; k++)
                {  j = var_[k].j;
                    if (var_[k].x == 0)
                        lp.col[j].coef = +1.0;
                    else
                    {  lp.col[j].coef = -1.0;
                        lp.c0 += 1.0;
                    }
                }
                /* minimize the distance with the simplex method */
                glp_init_smcp(parm);
                if (T.parm.msg_lev <= GLP_MSG_ERR)
                    parm.msg_lev = T.parm.msg_lev;
                else if (T.parm.msg_lev <= GLP_MSG_ALL)
                {  parm.msg_lev = GLP_MSG_ON;
                    parm.out_dly = 10000;
                }
                ret = glp_simplex(lp, parm);
                if (ret != 0)
                {  if (T.parm.msg_lev >= GLP_MSG_ERR)
                    xprintf("Warning: glp_simplex returned " + ret + "");
                    go_to = done; break;
                }
                ret = glp_get_status(lp);
                if (ret != GLP_OPT)
                {  if (T.parm.msg_lev >= GLP_MSG_ERR)
                    xprintf("Warning: glp_get_status returned " + ret + "");
                    go_to = done; break;
                }
                if (T.parm.msg_lev >= GLP_MSG_DBG)
                    xprintf("delta = " + lp.obj_val + "");
                /* check if the basic solution is integer feasible; note that it
                 may be so even if the minimial distance is positive */
                tol = 0.3 * T.parm.tol_int;
                for (k = 1; k <= nv; k++)
                {  col = lp.col[var_[k].j];
                    if (tol < col.prim && col.prim < 1.0 - tol) break;
                }
                if (k > nv)
                {  /* okay; the basic solution seems to be integer feasible */
                    var x = new Array(1+n);
                    for (j = 1; j <= n; j++)
                    {  x[j] = lp.col[j].prim;
                        if (P.col[j].kind == GLP_IV) x[j] = Math.floor(x[j] + 0.5);
                    }
                    /* reset direction and right-hand side of objective */
                    lp.c0  = P.c0;
                    lp.dir = P.dir;
                    /* fix integer variables */
                    for (k = 1; k <= nv; k++)
                    {  lp.col[var_[k].j].lb   = x[var_[k].j];
                        lp.col[var_[k].j].ub   = x[var_[k].j];
                        lp.col[var_[k].j].type = GLP_FX;
                    }
                    /* copy original objective function */
                    for (j = 1; j <= n; j++)
                        lp.col[j].coef = P.col[j].coef;
                    /* solve original LP and copy result */
                    ret = glp_simplex(lp, parm);
                    if (ret != 0)
                    {  if (T.parm.msg_lev >= GLP_MSG_ERR)
                        xprintf("Warning: glp_simplex returned " + ret + "");
                        go_to = done; break;
                    }
                    ret = glp_get_status(lp);
                    if (ret != GLP_OPT)
                    {  if (T.parm.msg_lev >= GLP_MSG_ERR)
                        xprintf("Warning: glp_get_status returned " + ret + "");
                        go_to = done; break;
                    }
                    for (j = 1; j <= n; j++)
                        if (P.col[j].kind != GLP_IV) x[j] = lp.col[j].prim;
                    ret = glp_ios_heur_sol(T, x);
                    if (ret == 0)
                    {  /* the integer solution is accepted */
                        if (ios_is_hopeful(T, T.curr.bound))
                        {  /* it is reasonable to apply the heuristic once again */
                            go_to = more; break;
                        }
                        else
                        {  /* the best known integer feasible solution just found
                         is close to optimal solution to LP relaxation */
                            go_to = done; break;
                        }
                    }
                }
                /* the basic solution is fractional */
                if (dist == DBL_MAX ||
                    lp.obj_val <= dist - 1e-6 * (1.0 + dist))
                {  /* the distance is reducing */
                    nfail = 0; dist = lp.obj_val;
                }
                else
                {  /* improving the distance failed */
                    nfail++;
                }
                if (nfail < 3) {go_to = loop; break}
                if (npass < 5) {go_to = pass; break}
            case done:


        }
        if (go_to == null) break;
        label = go_to;
    }
}

