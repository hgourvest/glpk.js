function ios_choose_var(T, callback){
    var j;
    if (T.parm.br_tech == GLP_BR_FFV)
    {  /* branch on first fractional variable */
        j = branch_first(T, callback);
    }
    else if (T.parm.br_tech == GLP_BR_LFV)
    {  /* branch on last fractional variable */
        j = branch_last(T, callback);
    }
    else if (T.parm.br_tech == GLP_BR_MFV)
    {  /* branch on most fractional variable */
        j = branch_mostf(T, callback);
    }
    else if (T.parm.br_tech == GLP_BR_DTH)
    {  /* branch using the heuristic by Dreebeck and Tomlin */
        j = branch_drtom(T, callback);
    }
    else if (T.parm.br_tech == GLP_BR_PCH)
    {  /* hybrid pseudocost heuristic */
        j = ios_pcost_branch(T, callback);
    }
    else
        xassert(T != T);
    return j;
}

function branch_first(T, callback){
    var j, next;
    var beta;
    /* choose the column to branch on */
    for (j = 1; j <= T.n; j++)
        if (T.non_int[j]) break;
    xassert(1 <= j && j <= T.n);
    /* select the branch to be solved next */
    beta = glp_get_col_prim(T.mip, j);
    if (beta - Math.floor(beta) < Math.ceil(beta) - beta)
        next = GLP_DN_BRNCH;
    else
        next = GLP_UP_BRNCH;
    callback(next);
    return j;
}

function branch_last(T, callback){
    var j, next;
    var beta;
    /* choose the column to branch on */
    for (j = T.n; j >= 1; j--)
        if (T.non_int[j]) break;
    xassert(1 <= j && j <= T.n);
    /* select the branch to be solved next */
    beta = glp_get_col_prim(T.mip, j);
    if (beta - Math.floor(beta) < Math.ceil(beta) - beta)
        next = GLP_DN_BRNCH;
    else
        next = GLP_UP_BRNCH;
    callback(next);
    return j;
}

function branch_mostf(T, callback){
    var j, jj, next;
    var beta, most, temp;
    /* choose the column to branch on */
    jj = 0; most = DBL_MAX;
    for (j = 1; j <= T.n; j++)
    {  if (T.non_int[j])
    {  beta = glp_get_col_prim(T.mip, j);
        temp = Math.floor(beta) + 0.5;
        if (most > Math.abs(beta - temp))
        {  jj = j; most = Math.abs(beta - temp);
            if (beta < temp)
                next = GLP_DN_BRNCH;
            else
                next = GLP_UP_BRNCH;
        }
    }
    }
    callback(next);
    return jj;
}

function branch_drtom(T, callback){
    var mip = T.mip;
    var m = mip.m;
    var n = mip.n;
    var non_int = T.non_int;
    var j, jj, k, t, next, kase, len, stat, ind;
    var x, dk, alfa, delta_j, delta_k, delta_z, dz_dn, dz_up,
        dd_dn, dd_up, degrad, val;
    /* basic solution of LP relaxation must be optimal */
    xassert(glp_get_status(mip) == GLP_OPT);
    /* allocate working arrays */
    ind = new Array(1+n);
    val = new Array(1+n);
    /* nothing has been chosen so far */
    jj = 0; degrad = -1.0;
    /* walk through the list of columns (structural variables) */
    for (j = 1; j <= n; j++)
    {  /* if j-th column is not marked as fractional, skip it */
        if (!non_int[j]) continue;
        /* obtain (fractional) value of j-th column in basic solution
         of LP relaxation */
        x = glp_get_col_prim(mip, j);
        /* since the value of j-th column is fractional, the column is
         basic; compute corresponding row of the simplex table */
        len = glp_eval_tab_row(mip, m+j, ind, val);
        /* the following fragment computes a change in the objective
         function: delta Z = new Z - old Z, where old Z is the
         objective value in the current optimal basis, and new Z is
         the objective value in the adjacent basis, for two cases:
         1) if new upper bound ub' = Math.floor(x[j]) is introduced for
         j-th column (down branch);
         2) if new lower bound lb' = Math.ceil(x[j]) is introduced for
         j-th column (up branch);
         since in both cases the solution remaining dual feasible
         becomes primal infeasible, one implicit simplex iteration
         is performed to determine the change delta Z;
         it is obvious that new Z, which is never better than old Z,
         is a lower (minimization) or upper (maximization) bound of
         the objective function for down- and up-branches. */
        for (kase = -1; kase <= +1; kase += 2)
        {  /* if kase < 0, the new upper bound of x[j] is introduced;
         in this case x[j] should decrease in order to leave the
         basis and go to its new upper bound */
            /* if kase > 0, the new lower bound of x[j] is introduced;
             in this case x[j] should increase in order to leave the
             basis and go to its new lower bound */
            /* apply the dual ratio test in order to determine which
             auxiliary or structural variable should enter the basis
             to keep dual feasibility */
            k = glp_dual_rtest(mip, len, ind, val, kase, 1e-9);
            if (k != 0) k = ind[k];
            /* if no non-basic variable has been chosen, LP relaxation
             of corresponding branch being primal infeasible and dual
             unbounded has no primal feasible solution; in this case
             the change delta Z is formally set to infinity */
            if (k == 0)
            {  delta_z =
                (T.mip.dir == GLP_MIN ? +DBL_MAX : -DBL_MAX);
            } else {
                /* row of the simplex table that corresponds to non-basic
                 variable x[k] choosen by the dual ratio test is:
                 x[j] = ... + alfa * x[k] + ...
                 where alfa is the influence coefficient (an element of
                 the simplex table row) */
                /* determine the coefficient alfa */
                for (t = 1; t <= len; t++) if (ind[t] == k) break;
                xassert(1 <= t && t <= len);
                alfa = val[t];
                /* since in the adjacent basis the variable x[j] becomes
                 non-basic, knowing its value in the current basis we can
                 determine its change delta x[j] = new x[j] - old x[j] */
                delta_j = (kase < 0 ? Math.floor(x) : Math.ceil(x)) - x;
                /* and knowing the coefficient alfa we can determine the
                 corresponding change delta x[k] = new x[k] - old x[k],
                 where old x[k] is a value of x[k] in the current basis,
                 and new x[k] is a value of x[k] in the adjacent basis */
                delta_k = delta_j / alfa;
                /* Tomlin noticed that if the variable x[k] is of integer
                 kind, its change cannot be less (eventually) than one in
                 the magnitude */
                if (k > m && glp_get_col_kind(mip, k-m) != GLP_CV)
                {  /* x[k] is structural integer variable */
                    if (Math.abs(delta_k - Math.floor(delta_k + 0.5)) > 1e-3)
                    {  if (delta_k > 0.0)
                        delta_k = Math.ceil(delta_k);  /* +3.14 . +4 */
                    else
                        delta_k = Math.floor(delta_k); /* -3.14 . -4 */
                    }
                }
                /* now determine the status and reduced cost of x[k] in the
                 current basis */
                if (k <= m)
                {  stat = glp_get_row_stat(mip, k);
                    dk = glp_get_row_dual(mip, k);
                }
                else
                {  stat = glp_get_col_stat(mip, k-m);
                    dk = glp_get_col_dual(mip, k-m);
                }
                /* if the current basis is dual degenerate, some reduced
                 costs which are close to zero may have wrong sign due to
                 round-off errors, so correct the sign of d[k] */
                switch (T.mip.dir)
                {  case GLP_MIN:
                    if (stat == GLP_NL && dk < 0.0 ||
                        stat == GLP_NU && dk > 0.0 ||
                        stat == GLP_NF) dk = 0.0;
                    break;
                    case GLP_MAX:
                        if (stat == GLP_NL && dk > 0.0 ||
                            stat == GLP_NU && dk < 0.0 ||
                            stat == GLP_NF) dk = 0.0;
                        break;
                    default:
                        xassert(T != T);
                }
                /* now knowing the change of x[k] and its reduced cost d[k]
                 we can compute the corresponding change in the objective
                 function delta Z = new Z - old Z = d[k] * delta x[k];
                 note that due to Tomlin's modification new Z can be even
                 worse than in the adjacent basis */
                delta_z = dk * delta_k;
            }

            /* new Z is never better than old Z, therefore the change
            delta Z is always non-negative (in case of minimization)
            or non-positive (in case of maximization) */
               switch (T.mip.dir)
               {  case GLP_MIN: xassert(delta_z >= 0.0); break;
                   case GLP_MAX: xassert(delta_z <= 0.0); break;
                   default: xassert(T != T);
               }
            /* save the change in the objective fnction for down- and
               up-branches, respectively */
            if (kase < 0) dz_dn = delta_z; else dz_up = delta_z;
        }
        /* thus, in down-branch no integer feasible solution can be
         better than Z + dz_dn, and in up-branch no integer feasible
         solution can be better than Z + dz_up, where Z is value of
         the objective function in the current basis */
        /* following the heuristic by Driebeck and Tomlin we choose a
         column (i.e. structural variable) which provides largest
         degradation of the objective function in some of branches;
         besides, we select the branch with smaller degradation to
         be solved next and keep other branch with larger degradation
         in the active list hoping to minimize the number of further
         backtrackings */
        if (degrad < Math.abs(dz_dn) || degrad < Math.abs(dz_up))
        {  jj = j;
            if (Math.abs(dz_dn) < Math.abs(dz_up))
            {  /* select down branch to be solved next */
                next = GLP_DN_BRNCH;
                degrad = Math.abs(dz_up);
            }
            else
            {  /* select up branch to be solved next */
                next = GLP_UP_BRNCH;
                degrad = Math.abs(dz_dn);
            }
            /* save the objective changes for printing */
            dd_dn = dz_dn; dd_up = dz_up;
            /* if down- or up-branch has no feasible solution, we does
             not need to consider other candidates (in principle, the
             corresponding branch could be pruned right now) */
            if (degrad == DBL_MAX) break;
        }
    }
    /* something must be chosen */
    xassert(1 <= jj && jj <= n);
    if (degrad < 1e-6 * (1.0 + 0.001 * Math.abs(mip.obj_val)))
    {  jj = branch_mostf(T, callback);
        return jj;
    }
    if (T.parm.msg_lev >= GLP_MSG_DBG)
    {  xprintf("branch_drtom: column " + jj + " chosen to branch on");
        if (Math.abs(dd_dn) == DBL_MAX)
            xprintf("branch_drtom: down-branch is infeasible");
        else
            xprintf("branch_drtom: down-branch bound is " + (lpx_get_obj_val(mip) + dd_dn) + "");
        if (Math.abs(dd_up) == DBL_MAX)
            xprintf("branch_drtom: up-branch   is infeasible");
        else
            xprintf("branch_drtom: up-branch   bound is " + (lpx_get_obj_val(mip) + dd_up) + "");
    }
    callback(next);
    return jj;
}

function ios_pcost_init(tree){
    /* initialize working data used on pseudocost branching */
    var n = tree.n, j;
    var csa = {};
    csa.dn_cnt = new Array(1+n);
    csa.dn_sum = new Array(1+n);
    csa.up_cnt = new Array(1+n);
    csa.up_sum = new Array(1+n);
    for (j = 1; j <= n; j++)
    {  csa.dn_cnt[j] = csa.up_cnt[j] = 0;
        csa.dn_sum[j] = csa.up_sum[j] = 0.0;
    }
    return csa;
}


function ios_pcost_update(tree){
    /* update history information for pseudocost branching */
    /* this routine is called every time when LP relaxation of the
     current subproblem has been solved to optimality with all lazy
     and cutting plane constraints included */
    var j;
    var dx, dz, psi;
    var csa = tree.pcost;
    xassert(csa != null);
    xassert(tree.curr != null);
    /* if the current subproblem is the root, skip updating */
    if (tree.curr.up == null) return;
    /* determine branching variable x[j], which was used in the
     parent subproblem to create the current subproblem */
    j = tree.curr.up.br_var;
    xassert(1 <= j && j <= tree.n);
    /* determine the change dx[j] = new x[j] - old x[j],
     where new x[j] is a value of x[j] in optimal solution to LP
     relaxation of the current subproblem, old x[j] is a value of
     x[j] in optimal solution to LP relaxation of the parent
     subproblem */
    dx = tree.mip.col[j].prim - tree.curr.up.br_val;
    xassert(dx != 0.0);
    /* determine corresponding change dz = new dz - old dz in the
     objective function value */
    dz = tree.mip.obj_val - tree.curr.up.lp_obj;
    /* determine per unit degradation of the objective function */
    psi = Math.abs(dz / dx);
    /* update history information */
    if (dx < 0.0)
    {  /* the current subproblem is down-branch */
        csa.dn_cnt[j]++;
        csa.dn_sum[j] += psi;
    }
    else /* dx > 0.0 */
    {  /* the current subproblem is up-branch */
        csa.up_cnt[j]++;
        csa.up_sum[j] += psi;
    }
}

function ios_pcost_free(tree){
    /* free working area used on pseudocost branching */
    var csa = tree.pcost;
    xassert(csa != null);
    tree.pcost = null;
}

function ios_pcost_branch(T, callback){
    function eval_degrad(P, j, bnd){
        /* compute degradation of the objective on fixing x[j] at given
         value with a limited number of dual simplex iterations */
        /* this routine fixes column x[j] at specified value bnd,
         solves resulting LP, and returns a lower bound to degradation
         of the objective, degrad >= 0 */
        var lp;
        var ret;
        var degrad;
        /* the current basis must be optimal */
        xassert(glp_get_status(P) == GLP_OPT);
        /* create a copy of P */
        lp = glp_create_prob();
        glp_copy_prob(lp, P, 0);
        /* fix column x[j] at specified value */
        glp_set_col_bnds(lp, j, GLP_FX, bnd, bnd);
        /* try to solve resulting LP */
        var parm = new SMCP();
        //glp_init_smcp(parm);
        parm.msg_lev = GLP_MSG_OFF;
        parm.meth = GLP_DUAL;
        parm.it_lim = 30;
        parm.out_dly = 1000;
        parm.meth = GLP_DUAL;
        ret = glp_simplex(lp, parm);
        if (ret == 0 || ret == GLP_EITLIM)
        {  if (glp_get_prim_stat(lp) == GLP_NOFEAS)
        {  /* resulting LP has no primal feasible solution */
            degrad = DBL_MAX;
        }
        else if (glp_get_dual_stat(lp) == GLP_FEAS)
        {  /* resulting basis is optimal or at least dual feasible,
         so we have the correct lower bound to degradation */
            if (P.dir == GLP_MIN)
                degrad = lp.obj_val - P.obj_val;
            else if (P.dir == GLP_MAX)
                degrad = P.obj_val - lp.obj_val;
            else
                xassert(P != P);
            /* degradation cannot be negative by definition */
            /* note that the lower bound to degradation may be close
             to zero even if its exact value is zero due to round-off
             errors on computing the objective value */
            if (degrad < 1e-6 * (1.0 + 0.001 * Math.abs(P.obj_val)))
                degrad = 0.0;
        }
        else
        {  /* the final basis reported by the simplex solver is dual
         infeasible, so we cannot determine a non-trivial lower
         bound to degradation */
            degrad = 0.0;
        }
        }
        else
        {  /* the simplex solver failed */
            degrad = 0.0;
        }
        return degrad;
    }

    function eval_psi(T, j, brnch){
        /* compute estimation of pseudocost of variable x[j] for down-
         or up-branch */
        var csa = T.pcost;
        var beta, degrad, psi;
        xassert(csa != null);
        xassert(1 <= j && j <= T.n);
        if (brnch == GLP_DN_BRNCH)
        {  /* down-branch */
            if (csa.dn_cnt[j] == 0)
            {  /* initialize down pseudocost */
                beta = T.mip.col[j].prim;
                degrad = eval_degrad(T.mip, j, Math.floor(beta));
                if (degrad == DBL_MAX)
                {  psi = DBL_MAX;
                    return psi;
                }
                csa.dn_cnt[j] = 1;
                csa.dn_sum[j] = degrad / (beta - Math.floor(beta));
            }
            psi = csa.dn_sum[j] / csa.dn_cnt[j];
        }
        else if (brnch == GLP_UP_BRNCH)
        {  /* up-branch */
            if (csa.up_cnt[j] == 0)
            {  /* initialize up pseudocost */
                beta = T.mip.col[j].prim;
                degrad = eval_degrad(T.mip, j, Math.ceil(beta));
                if (degrad == DBL_MAX)
                {  psi = DBL_MAX;
                    return psi;
                }
                csa.up_cnt[j] = 1;
                csa.up_sum[j] = degrad / (Math.ceil(beta) - beta);
            }
            psi = csa.up_sum[j] / csa.up_cnt[j];
        }
        else
            xassert(brnch != brnch);
        return psi;
    }

    function progress(T){
        /* display progress of pseudocost initialization */
        var csa = T.pcost;
        var j, nv = 0, ni = 0;
        for (j = 1; j <= T.n; j++)
        {  if (glp_ios_can_branch(T, j))
        {  nv++;
            if (csa.dn_cnt[j] > 0 && csa.up_cnt[j] > 0) ni++;
        }
        }
        xprintf("Pseudocosts initialized for " + ni + " of " + nv + " variables");
    }

    /* choose branching variable with pseudocost branching */
    var t = xtime();
    var j, jjj, sel;
    var beta, psi, d1, d2, d, dmax;
    /* initialize the working arrays */
    if (T.pcost == null)
        T.pcost = ios_pcost_init(T);
    /* nothing has been chosen so far */
    jjj = 0; dmax = -1.0;
    /* go through the list of branching candidates */
    for (j = 1; j <= T.n; j++)
    {  if (!glp_ios_can_branch(T, j)) continue;
        /* determine primal value of x[j] in optimal solution to LP
         relaxation of the current subproblem */
        beta = T.mip.col[j].prim;
        /* estimate pseudocost of x[j] for down-branch */
        psi = eval_psi(T, j, GLP_DN_BRNCH);
        if (psi == DBL_MAX)
        {  /* down-branch has no primal feasible solution */
            jjj = j; sel = GLP_DN_BRNCH;
            callback(sel);
            return jjj;
        }
        /* estimate degradation of the objective for down-branch */
        d1 = psi * (beta - Math.floor(beta));
        /* estimate pseudocost of x[j] for up-branch */
        psi = eval_psi(T, j, GLP_UP_BRNCH);
        if (psi == DBL_MAX)
        {  /* up-branch has no primal feasible solution */
            jjj = j; sel = GLP_UP_BRNCH;
            callback(sel);
            return jjj;
        }
        /* estimate degradation of the objective for up-branch */
        d2 = psi * (Math.ceil(beta) - beta);
        /* determine d = max(d1, d2) */
        d = (d1 > d2 ? d1 : d2);
        /* choose x[j] which provides maximal estimated degradation of
         the objective either in down- or up-branch */
        if (dmax < d)
        {  dmax = d;
            jjj = j;
            /* continue the search from a subproblem, where degradation
             is less than in other one */
            sel = (d1 <= d2 ? GLP_DN_BRNCH : GLP_UP_BRNCH);
        }
        /* display progress of pseudocost initialization */
        if (T.parm.msg_lev >= GLP_ON)
        {  if (xdifftime(xtime(), t) >= 10.0)
        {  progress(T);
            t = xtime();
        }
        }
    }
    if (dmax == 0.0)
    {  /* no degradation is indicated; choose a variable having most
     fractional value */
        jjj = branch_mostf(T, callback);
        return jjj;
    }
    callback(sel);
    return jjj;
}

