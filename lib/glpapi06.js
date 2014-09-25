var glp_simplex = exports["glp_simplex"] = function(P, parm){

    function solve_lp(P, parm){
        /* solve LP directly without using the preprocessor */
        var ret;
        if (!glp_bf_exists(P)){
            ret = glp_factorize(P);
            if (ret == 0){

            }
            else if (ret == GLP_EBADB){
                if (parm.msg_lev >= GLP_MSG_ERR)
                    xprintf("glp_simplex: initial basis is invalid");
            }
            else if (ret == GLP_ESING){
                if (parm.msg_lev >= GLP_MSG_ERR)
                    xprintf("glp_simplex: initial basis is singular");
            }
            else if (ret == GLP_ECOND){
                if (parm.msg_lev >= GLP_MSG_ERR)
                    xprintf("glp_simplex: initial basis is ill-conditioned");
            }
            else
                xassert(ret != ret);
            if (ret != 0) return ret;
        }
        if (parm.meth == GLP_PRIMAL)
            ret = spx_primal(P, parm);
        else if (parm.meth == GLP_DUALP)
        {  ret = spx_dual(P, parm);
            if (ret == GLP_EFAIL && P.valid)
                ret = spx_primal(P, parm);
        }
        else if (parm.meth == GLP_DUAL)
            ret = spx_dual(P, parm);
        else
            xassert(parm != parm);
        return ret;
    }

    function preprocess_and_solve_lp(P, parm){
        /* solve LP using the preprocessor */
        var npp;
        var lp = null;
        var bfcp = {};
        var ret;


        function post(){
            /* postprocess solution from the transformed LP */
            npp_postprocess(npp, lp);
            /* the transformed LP is no longer needed */
            lp = null;
            /* store solution to the original problem */
            npp_unload_sol(npp, P);
            /* the original LP has been successfully solved */
            ret = 0;
            return ret;
        }


        if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("Preprocessing...");
        /* create preprocessor workspace */
        npp = npp_create_wksp();
        /* load original problem into the preprocessor workspace */
        npp_load_prob(npp, P, GLP_OFF, GLP_SOL, GLP_OFF);
        /* process LP prior to applying primal/dual simplex method */
        ret = npp_simplex(npp, parm);
        if (ret == 0)
        {

        }
        else if (ret == GLP_ENOPFS)
        {  if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("PROBLEM HAS NO PRIMAL FEASIBLE SOLUTION");
        }
        else if (ret == GLP_ENODFS)
        {  if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("PROBLEM HAS NO DUAL FEASIBLE SOLUTION");
        }
        else
            xassert(ret != ret);
        if (ret != 0) return ret;
        /* build transformed LP */
        lp = glp_create_prob();
        npp_build_prob(npp, lp);
        /* if the transformed LP is empty, it has empty solution, which
         is optimal */
        if (lp.m == 0 && lp.n == 0)
        {  lp.pbs_stat = lp.dbs_stat = GLP_FEAS;
            lp.obj_val = lp.c0;
            if (parm.msg_lev >= GLP_MSG_ON && parm.out_dly == 0)
            {  xprintf(P.it_cnt + ": obj = " + lp.obj_val + "  infeas = 0.0");
            }
            if (parm.msg_lev >= GLP_MSG_ALL)
                xprintf("OPTIMAL SOLUTION FOUND BY LP PREPROCESSOR");
            return post();
        }
        if (parm.msg_lev >= GLP_MSG_ALL)
        {  xprintf(lp.m + " row" + (lp.m == 1 ? "" : "s") + ", " + lp.n + " column" + (lp.n == 1 ? "" : "s") + ", "
            + lp.nnz + " non-zero" + (lp.nnz == 1 ? "" : "s") + "");
        }
        /* inherit basis factorization control parameters */
        glp_get_bfcp(P, bfcp);
        glp_set_bfcp(lp, bfcp);
        /* scale the transformed problem */

        {   var env = get_env_ptr();
            var term_out = env.term_out;
            if (!term_out || parm.msg_lev < GLP_MSG_ALL)
                env.term_out = GLP_OFF;
            else
                env.term_out = GLP_ON;
            glp_scale_prob(lp, GLP_SF_AUTO);
            env.term_out = term_out;
        }
        /* build advanced initial basis */
        {   env = get_env_ptr();
            term_out = env.term_out;
            if (!term_out || parm.msg_lev < GLP_MSG_ALL)
                env.term_out = GLP_OFF;
            else
                env.term_out = GLP_ON;
            glp_adv_basis(lp, 0);
            env.term_out = term_out;
        }
        /* solve the transformed LP */
        lp.it_cnt = P.it_cnt;
        ret = solve_lp(lp, parm);
        P.it_cnt = lp.it_cnt;
        /* only optimal solution can be postprocessed */
        if (!(ret == 0 && lp.pbs_stat == GLP_FEAS && lp.dbs_stat == GLP_FEAS)){
            if (parm.msg_lev >= GLP_MSG_ERR)
                xprintf("glp_simplex: unable to recover undefined or non-optimal solution");
            if (ret == 0){
                if (lp.pbs_stat == GLP_NOFEAS)
                    ret = GLP_ENOPFS;
                else if (lp.dbs_stat == GLP_NOFEAS)
                    ret = GLP_ENODFS;
                else
                    xassert(lp != lp);
            }
            return ret;
        }
        return post();
    }

    function trivial_lp(P, parm){
        /* solve trivial LP which has empty constraint matrix */
        var row, col;
        var i, j;
        var p_infeas, d_infeas, zeta;
        P.valid = 0;
        P.pbs_stat = P.dbs_stat = GLP_FEAS;
        P.obj_val = P.c0;
        P.some = 0;
        p_infeas = d_infeas = 0.0;
        /* make all auxiliary variables basic */
        for (i = 1; i <= P.m; i++){
            row = P.row[i];
            row.stat = GLP_BS;
            row.prim = row.dual = 0.0;
            /* check primal feasibility */
            if (row.type == GLP_LO || row.type == GLP_DB || row.type == GLP_FX){
                /* row has lower bound */
                if (row.lb > + parm.tol_bnd){
                    P.pbs_stat = GLP_NOFEAS;
                    if (P.some == 0 && parm.meth != GLP_PRIMAL)
                        P.some = i;
                }
                if (p_infeas < + row.lb)
                    p_infeas = + row.lb;
            }
            if (row.type == GLP_UP || row.type == GLP_DB || row.type == GLP_FX){
                /* row has upper bound */
                if (row.ub < - parm.tol_bnd){
                    P.pbs_stat = GLP_NOFEAS;
                    if (P.some == 0 && parm.meth != GLP_PRIMAL)
                        P.some = i;
                }
                if (p_infeas < - row.ub)
                    p_infeas = - row.ub;
            }
        }
        /* determine scale factor for the objective row */
        zeta = 1.0;
        for (j = 1; j <= P.n; j++)
        {  col = P.col[j];
            if (zeta < Math.abs(col.coef)) zeta = Math.abs(col.coef);
        }
        zeta = (P.dir == GLP_MIN ? +1.0 : -1.0) / zeta;
        /* make all structural variables non-basic */

        function lo(){col.stat = GLP_NL; col.prim = col.lb}
        function up(){col.stat = GLP_NU; col.prim = col.ub}

        for (j = 1; j <= P.n; j++)
        {  col = P.col[j];
            if (col.type == GLP_FR){
                col.stat = GLP_NF; col.prim = 0.0;
            }
            else if (col.type == GLP_LO)
                lo();
            else if (col.type == GLP_UP)
                up();
            else if (col.type == GLP_DB)
            {  if (zeta * col.coef > 0.0)
                lo();
            else if (zeta * col.coef < 0.0)
                up();
            else if (Math.abs(col.lb) <= Math.abs(col.ub))
                lo();
            else
                up();
            }
            else if (col.type == GLP_FX){
                col.stat = GLP_NS; col.prim = col.lb;
            }
            col.dual = col.coef;
            P.obj_val += col.coef * col.prim;
            /* check dual feasibility */
            if (col.type == GLP_FR || col.type == GLP_LO){
                /* column has no upper bound */
                if (zeta * col.dual < - parm.tol_dj){
                    P.dbs_stat = GLP_NOFEAS;
                    if (P.some == 0 && parm.meth == GLP_PRIMAL)
                        P.some = P.m + j;
                }
                if (d_infeas < - zeta * col.dual)
                    d_infeas = - zeta * col.dual;
            }
            if (col.type == GLP_FR || col.type == GLP_UP)
            {  /* column has no lower bound */
                if (zeta * col.dual > + parm.tol_dj)
                {  P.dbs_stat = GLP_NOFEAS;
                    if (P.some == 0 && parm.meth == GLP_PRIMAL)
                        P.some = P.m + j;
                }
                if (d_infeas < + zeta * col.dual)
                    d_infeas = + zeta * col.dual;
            }
        }
        /* simulate the simplex solver output */
        if (parm.msg_lev >= GLP_MSG_ON && parm.out_dly == 0){
            xprintf("~" + P.it_cnt + ": obj = " + P.obj_val + "  infeas = " + (parm.meth == GLP_PRIMAL ? p_infeas : d_infeas) + "");
        }
        if (parm.msg_lev >= GLP_MSG_ALL && parm.out_dly == 0){
            if (P.pbs_stat == GLP_FEAS && P.dbs_stat == GLP_FEAS)
                xprintf("OPTIMAL SOLUTION FOUND");
            else if (P.pbs_stat == GLP_NOFEAS)
                xprintf("PROBLEM HAS NO FEASIBLE SOLUTION");
            else if (parm.meth == GLP_PRIMAL)
                xprintf("PROBLEM HAS UNBOUNDED SOLUTION");
            else
                xprintf("PROBLEM HAS NO DUAL FEASIBLE SOLUTION");
        }
    }

    /* solve LP problem with the simplex method */
    var i, j, ret;
    /* check problem object */
    if (P == null || P.magic != GLP_PROB_MAGIC)
        xerror("glp_simplex: P = " + P + "; invalid problem object");
    if (P.tree != null && P.tree.reason != 0)
        xerror("glp_simplex: operation not allowed");
    /* check control parameters */
    if (parm == null){
        parm = new SMCP();
    }
    if (!(parm.msg_lev == GLP_MSG_OFF ||
        parm.msg_lev == GLP_MSG_ERR ||
        parm.msg_lev == GLP_MSG_ON  ||
        parm.msg_lev == GLP_MSG_ALL ||
        parm.msg_lev == GLP_MSG_DBG))
        xerror("glp_simplex: msg_lev = " + parm.msg_lev + "; invalid parameter");
    if (!(parm.meth == GLP_PRIMAL ||
        parm.meth == GLP_DUALP  ||
        parm.meth == GLP_DUAL))
        xerror("glp_simplex: meth = " + parm.meth + "; invalid parameter");
    if (!(parm.pricing == GLP_PT_STD || parm.pricing == GLP_PT_PSE))
        xerror("glp_simplex: pricing = " + parm.pricing + "; invalid parameter");
    if (!(parm.r_test == GLP_RT_STD || parm.r_test == GLP_RT_HAR))
        xerror("glp_simplex: r_test = " + parm.r_test + "; invalid parameter");
    if (!(0.0 < parm.tol_bnd && parm.tol_bnd < 1.0))
        xerror("glp_simplex: tol_bnd = " + parm.tol_bnd + "; invalid parameter");
    if (!(0.0 < parm.tol_dj && parm.tol_dj < 1.0))
        xerror("glp_simplex: tol_dj = " + parm.tol_dj + "; invalid parameter");
    if (!(0.0 < parm.tol_piv && parm.tol_piv < 1.0))
        xerror("glp_simplex: tol_piv = " + parm.tol_piv + "; invalid parameter");
    if (parm.it_lim < 0)
        xerror("glp_simplex: it_lim = " + parm.it_lim + "; invalid parameter");
    if (parm.tm_lim < 0)
        xerror("glp_simplex: tm_lim = " + parm.tm_lim + "; invalid parameter");
    if (parm.out_frq < 1)
        xerror("glp_simplex: out_frq = " + parm.out_frq + "; invalid parameter");
    if (parm.out_dly < 0)
        xerror("glp_simplex: out_dly = " + parm.out_dly + "; invalid parameter");
    if (!(parm.presolve == GLP_ON || parm.presolve == GLP_OFF))
        xerror("glp_simplex: presolve = " + parm.presolve + "; invalid parameter");
    /* basic solution is currently undefined */
    P.pbs_stat = P.dbs_stat = GLP_UNDEF;
    P.obj_val = 0.0;
    P.some = 0;
    /* check bounds of double-bounded variables */
    for (i = 1; i <= P.m; i++)
    {  var row = P.row[i];
        if (row.type == GLP_DB && row.lb >= row.ub)
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_simplex: row " + i + ": lb = " + row.lb + ", ub = " + row.ub + "; incorrect bounds");
            ret = GLP_EBOUND;
            return ret;
        }
    }
    for (j = 1; j <= P.n; j++)
    {  var col = P.col[j];
        if (col.type == GLP_DB && col.lb >= col.ub)
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_simplex: column " +  j + ": lb = " + col.lb + ", ub = " + col.ub + "; incorrect bounds");
            ret = GLP_EBOUND;
            return ret;
        }
    }
    /* solve LP problem */
    if (parm.msg_lev >= GLP_MSG_ALL)
    {   xprintf("GLPK Simplex Optimizer, v" + glp_version() + "");
        xprintf(P.m + " row" + (P.m == 1 ? "" : "s") + ", " + P.n + " column" + (P.n == 1 ? "" : "s") + ", " +
            P.nnz + " non-zero" + (P.nnz == 1 ? "" : "s") + "");
    }
    if (P.nnz == 0){
        trivial_lp(P, parm);
        ret = 0;
    }
    else if (!parm.presolve)
        ret = solve_lp(P, parm);
    else
        ret = preprocess_and_solve_lp(P, parm);
    /* return to the application program */
    return ret;
};

/***********************************************************************
 *  NAME
 *
 *  glp_init_smcp - initialize simplex method control parameters
 *
 *  SYNOPSIS
 *
 *  void glp_init_smcp(glp_smcp *parm);
 *
 *  DESCRIPTION
 *
 *  The routine glp_init_smcp initializes control parameters, which are
 *  used by the simplex solver, with default values.
 *
 *  Default values of the control parameters are stored in a glp_smcp
 *  structure, which the parameter parm points to. */

var SMCP = exports["SMCP"] = /**@constructor*/ function(options){
    options = options || {};
    this.msg_lev = options["msg_lev"] || GLP_MSG_ALL;
    this.meth = options["meth"] || GLP_PRIMAL;
    this.pricing = options["pricing"] || GLP_PT_PSE;
    this.r_test = options["r_test"] || GLP_RT_HAR;
    this.tol_bnd = options["tol_bnd"] || 1e-7;
    this.tol_dj = options["tol_dj"] || 1e-7;
    this.tol_piv = options["tol_piv"] || 1e-10;
    this.obj_ll = options["obj_ll"] || -DBL_MAX;
    this.obj_ul = options["obj_ul"] || +DBL_MAX;
    this.it_lim = options["it_lim"] || INT_MAX;
    this.tm_lim = options["tm_lim"] || INT_MAX;
    this.out_frq = options["out_frq"] || 500;
    this.out_dly = options["out_dly"] || 0;
    this.presolve = options["presolve"] || GLP_OFF;
};

/***********************************************************************
 *  NAME
 *
 *  glp_get_status - retrieve generic status of basic solution
 *
 *  SYNOPSIS
 *
 *  int glp_get_status(glp_prob *lp);
 *
 *  RETURNS
 *
 *  The routine glp_get_status reports the generic status of the basic
 *  solution for the specified problem object as follows:
 *
 *  GLP_OPT    - solution is optimal;
 *  GLP_FEAS   - solution is feasible;
 *  GLP_INFEAS - solution is infeasible;
 *  GLP_NOFEAS - problem has no feasible solution;
 *  GLP_UNBND  - problem has unbounded solution;
 *  GLP_UNDEF  - solution is undefined. */

var glp_get_status = exports["glp_get_status"] = function(lp){
    var status;
    status = glp_get_prim_stat(lp);
    switch (status)
    {  case GLP_FEAS:
        switch (glp_get_dual_stat(lp))
        {  case GLP_FEAS:
            status = GLP_OPT;
            break;
            case GLP_NOFEAS:
                status = GLP_UNBND;
                break;
            case GLP_UNDEF:
            case GLP_INFEAS:
                //status = status;
                break;
            default:
                xassert(lp != lp);
        }
        break;
        case GLP_UNDEF:
        case GLP_INFEAS:
        case GLP_NOFEAS:
            //status = status;
            break;
        default:
            xassert(lp != lp);
    }
    return status;
};

var glp_get_prim_stat = exports["glp_get_prim_stat"] = function(lp){
    return lp.pbs_stat;
};

var glp_get_dual_stat = exports["glp_get_dual_stat"] = function(lp){
    return lp.dbs_stat;
};

var glp_get_obj_val = exports["glp_get_obj_val"] = function(lp){
    return lp.obj_val;
};

var glp_get_row_stat = exports["glp_get_row_stat"] = function(lp, i){
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_row_stat: i = " + i + "; row number out of range");
    return lp.row[i].stat;
};

var glp_get_row_prim = exports["glp_get_row_prim"] = function(lp, i){
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_row_prim: i = " + i + "; row number out of range");
    return lp.row[i].prim;
};

var glp_get_row_dual = exports["glp_get_row_dual"] = function(lp, i){
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_row_dual: i = " + i + "; row number out of range");
    return lp.row[i].dual;
};

var glp_get_col_stat = exports["glp_get_col_stat"] = function(lp, j){
    if (!(1 <= j && j <= lp.n))
        xerror("glp_get_col_stat: j = " + j + "; column number out of range");
    return lp.col[j].stat;
};

var glp_get_col_prim = exports["glp_get_col_prim"] = function(lp, j){
    if (!(1 <= j && j <= lp.n))
        xerror("glp_get_col_prim: j = " + j + "; column number out of range");
    return lp.col[j].prim;
};

var glp_get_col_dual = exports["glp_get_col_dual"] = function(lp, j){
    if (!(1 <= j && j <= lp.n))
        xerror("glp_get_col_dual: j = " + j + "; column number out of range");
    return lp.col[j].dual;
};

var glp_get_unbnd_ray = exports["glp_get_unbnd_ray"] = function(lp){
    var k = lp.some;
    xassert(k >= 0);
    if (k > lp.m + lp.n) k = 0;
    return k;
};

