var glp_set_col_kind = exports.glp_set_col_kind = function(mip, j, kind){
    if (!(1 <= j && j <= mip.n))
        xerror("glp_set_col_kind: j = " + j + "; column number out of range");
    var col = mip.col[j];
    switch (kind)
    {  case GLP_CV:
        col.kind = GLP_CV;
        break;
        case GLP_IV:
            col.kind = GLP_IV;
            break;
        case GLP_BV:
            col.kind = GLP_IV;
            if (!(col.type == GLP_DB && col.lb == 0.0 && col.ub ==
                1.0)) glp_set_col_bnds(mip, j, GLP_DB, 0.0, 1.0);
            break;
        default:
            xerror("glp_set_col_kind: j = " + j + "; kind = " + kind + "; invalid column kind");
    }
};

var glp_get_col_kind = exports.glp_get_col_kind = function(mip, j){
    if (!(1 <= j && j <= mip.n))
        xerror("glp_get_col_kind: j = " + j + "; column number out of range");
    var col = mip.col[j];
    var kind = col.kind;
    switch (kind)
    {  case GLP_CV:
        break;
        case GLP_IV:
            if (col.type == GLP_DB && col.lb == 0.0 && col.ub == 1.0)
                kind = GLP_BV;
            break;
        default:
            xassert(kind != kind);
    }
    return kind;
};

var glp_get_num_int = exports.glp_get_num_int = function(mip){
    var col;
    var count = 0;
    for (var j = 1; j <= mip.n; j++)
    {  col = mip.col[j];
        if (col.kind == GLP_IV) count++;
    }
    return count;
};

var glp_get_num_bin = exports.glp_get_num_bin = function(mip){
    var col;
    var count = 0;
    for (var j = 1; j <= mip.n; j++)
    {  col = mip.col[j];
        if (col.kind == GLP_IV && col.type == GLP_DB && col.lb ==
            0.0 && col.ub == 1.0) count++;
    }
    return count;
};

var glp_intopt = exports.glp_intopt = function(P, parm){
    function solve_mip(P, parm){
        /* solve MIP directly without using the preprocessor */
        var T;
        var ret;
        /* optimal basis to LP relaxation must be provided */
        if (glp_get_status(P) != GLP_OPT)
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_intopt: optimal basis to initial LP relaxation not provided");
            ret = GLP_EROOT;
            return ret;
        }
        /* it seems all is ok */
        if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("Integer optimization begins...");
        /* create the branch-and-bound tree */
        T = ios_create_tree(P, parm);
        /* solve the problem instance */
        ret = ios_driver(T);
        /* delete the branch-and-bound tree */
        ios_delete_tree(T);
        /* analyze exit code reported by the mip driver */
        if (ret == 0)
        {  if (P.mip_stat == GLP_FEAS)
        {  if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("INTEGER OPTIMAL SOLUTION FOUND");
            P.mip_stat = GLP_OPT;
        }
        else
        {  if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("PROBLEM HAS NO INTEGER FEASIBLE SOLUTION");
            P.mip_stat = GLP_NOFEAS;
        }
        }
        else if (ret == GLP_EMIPGAP)
        {  if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("RELATIVE MIP GAP TOLERANCE REACHED; SEARCH TERMINATED");
        }
        else if (ret == GLP_ETMLIM)
        {  if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("TIME LIMIT EXCEEDED; SEARCH TERMINATED");
        }
        else if (ret == GLP_EFAIL)
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_intopt: cannot solve current LP relaxation");
        }
        else if (ret == GLP_ESTOP)
        {  if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("SEARCH TERMINATED BY APPLICATION");
        }
        else
            xassert(ret != ret);
        return ret;
    }

    function preprocess_and_solve_mip(P, parm){
        /* solve MIP using the preprocessor */
        var env = get_env_ptr();
        var term_out = env.term_out;
        var npp;
        var mip = null;
        var bfcp = {};
        var smcp = {};
        var ret;

        function done(){
            /* delete the transformed MIP, if it exists */
            if (mip != null) glp_delete_prob(mip);
            return ret;
        }

        function post(){
            npp_postprocess(npp, mip);
            /* the transformed MIP is no longer needed */
            glp_delete_prob(mip);
            mip = null;
            /* store solution to the original problem */
            npp_unload_sol(npp, P);
            return done();
        }


        if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("Preprocessing...");
        /* create preprocessor workspace */
        npp = npp_create_wksp();
        /* load original problem into the preprocessor workspace */
        npp_load_prob(npp, P, GLP_OFF, GLP_MIP, GLP_OFF);
        /* process MIP prior to applying the branch-and-bound method */
        if (!term_out || parm.msg_lev < GLP_MSG_ALL)
            env.term_out = GLP_OFF;
        else
            env.term_out = GLP_ON;
        ret = npp_integer(npp, parm);
        env.term_out = term_out;
        if (ret == 0)
        {

        }
        else if (ret == GLP_ENOPFS)
        {  if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("PROBLEM HAS NO PRIMAL FEASIBLE SOLUTION");
        }
        else if (ret == GLP_ENODFS)
        {  if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("LP RELAXATION HAS NO DUAL FEASIBLE SOLUTION");
        }
        else
            xassert(ret != ret);
        if (ret != 0) return done();
        /* build transformed MIP */
        mip = glp_create_prob();
        npp_build_prob(npp, mip);
        /* if the transformed MIP is empty, it has empty solution, which
         is optimal */
        if (mip.m == 0 && mip.n == 0)
        {  mip.mip_stat = GLP_OPT;
            mip.mip_obj = mip.c0;
            if (parm.msg_lev >= GLP_MSG_ALL)
            {  xprintf("Objective value = " + mip.mip_obj + "");
                xprintf("INTEGER OPTIMAL SOLUTION FOUND BY MIP PREPROCESSOR");
            }
            return post();
        }
        /* display some statistics */
        if (parm.msg_lev >= GLP_MSG_ALL)
        {   var ni = glp_get_num_int(mip);
            var nb = glp_get_num_bin(mip);
            var s;
            xprintf(mip.m + " row" + (mip.m == 1 ? "" : "s") + ", " + mip.n + " column" + (mip.n == 1 ? "" : "s") +
                ", " + mip.nnz + " non-zero" + (mip.nnz == 1 ? "" : "s") + "");
            if (nb == 0)
                s = "none of";
            else if (ni == 1 && nb == 1)
                s = "";
            else if (nb == 1)
                s = "one of";
            else if (nb == ni)
                s = "all of";
            else
                s = nb + " of";
            xprintf(ni + " integer variable" + (ni == 1 ? "" : "s") + ", " + s + " which " + (nb == 1 ? "is" : "are") + " binary");
        }
        /* inherit basis factorization control parameters */
        glp_get_bfcp(P, bfcp);
        glp_set_bfcp(mip, bfcp);
        /* scale the transformed problem */
        if (!term_out || parm.msg_lev < GLP_MSG_ALL)
            env.term_out = GLP_OFF;
        else
            env.term_out = GLP_ON;
        glp_scale_prob(mip,
            GLP_SF_GM | GLP_SF_EQ | GLP_SF_2N | GLP_SF_SKIP);
        env.term_out = term_out;
        /* build advanced initial basis */
        if (!term_out || parm.msg_lev < GLP_MSG_ALL)
            env.term_out = GLP_OFF;
        else
            env.term_out = GLP_ON;
        glp_adv_basis(mip, 0);
        env.term_out = term_out;
        /* solve initial LP relaxation */
        if (parm.msg_lev >= GLP_MSG_ALL)
            xprintf("Solving LP relaxation...");
        glp_init_smcp(smcp);
        smcp.msg_lev = parm.msg_lev;
        mip.it_cnt = P.it_cnt;
        ret = glp_simplex(mip, smcp);
        P.it_cnt = mip.it_cnt;
        if (ret != 0)
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_intopt: cannot solve LP relaxation");
            ret = GLP_EFAIL;
            return done();
        }
        /* check status of the basic solution */
        ret = glp_get_status(mip);
        if (ret == GLP_OPT)
            ret = 0;
        else if (ret == GLP_NOFEAS)
            ret = GLP_ENOPFS;
        else if (ret == GLP_UNBND)
            ret = GLP_ENODFS;
        else
            xassert(ret != ret);
        if (ret != 0) return done();
        /* solve the transformed MIP */
        mip.it_cnt = P.it_cnt;
        ret = solve_mip(mip, parm);
        P.it_cnt = mip.it_cnt;
        /* only integer feasible solution can be postprocessed */
        if (!(mip.mip_stat == GLP_OPT || mip.mip_stat == GLP_FEAS))
        {  P.mip_stat = mip.mip_stat;
            return done();
        }
        return post();
    }

    /* solve MIP problem with the branch-and-bound method */
    var i, j, ret, col;
    /* check problem object */
    if (P == null || P.magic != GLP_PROB_MAGIC)
        xerror("glp_intopt: P = " + P + "; invalid problem object");
    if (P.tree != null)
        xerror("glp_intopt: operation not allowed");
    /* check control parameters */
    if (parm == null){
        parm = {};
        glp_init_iocp(parm);
    }
    if (!(parm.msg_lev == GLP_MSG_OFF ||
        parm.msg_lev == GLP_MSG_ERR ||
        parm.msg_lev == GLP_MSG_ON  ||
        parm.msg_lev == GLP_MSG_ALL ||
        parm.msg_lev == GLP_MSG_DBG))
        xerror("glp_intopt: msg_lev = " + parm.msg_lev + "; invalid parameter");
    if (!(parm.br_tech == GLP_BR_FFV ||
        parm.br_tech == GLP_BR_LFV ||
        parm.br_tech == GLP_BR_MFV ||
        parm.br_tech == GLP_BR_DTH ||
        parm.br_tech == GLP_BR_PCH))
        xerror("glp_intopt: br_tech = " + parm.br_tech + "; invalid parameter");
    if (!(parm.bt_tech == GLP_BT_DFS ||
        parm.bt_tech == GLP_BT_BFS ||
        parm.bt_tech == GLP_BT_BLB ||
        parm.bt_tech == GLP_BT_BPH))
        xerror("glp_intopt: bt_tech = " + parm.bt_tech + "; invalid parameter");
    if (!(0.0 < parm.tol_int && parm.tol_int < 1.0))
        xerror("glp_intopt: tol_int = " + parm.tol_int + "; invalid parameter");
    if (!(0.0 < parm.tol_obj && parm.tol_obj < 1.0))
        xerror("glp_intopt: tol_obj = " + parm.tol_obj + "; invalid parameter");
    if (parm.tm_lim < 0)
        xerror("glp_intopt: tm_lim = " + parm.tm_lim + "; invalid parameter");
    if (parm.out_frq < 0)
        xerror("glp_intopt: out_frq = " + parm.out_frq + "; invalid parameter");
    if (parm.out_dly < 0)
        xerror("glp_intopt: out_dly = " + parm.out_dly + "; invalid parameter");
    if (!(0 <= parm.cb_size && parm.cb_size <= 256))
        xerror("glp_intopt: cb_size = " + parm.cb_size + "; invalid parameter");
    if (!(parm.pp_tech == GLP_PP_NONE ||
        parm.pp_tech == GLP_PP_ROOT ||
        parm.pp_tech == GLP_PP_ALL))
        xerror("glp_intopt: pp_tech = " + parm.pp_tech + "; invalid parameter");
    if (parm.mip_gap < 0.0)
        xerror("glp_intopt: mip_gap = " + parm.mip_gap + "; invalid parameter");
    if (!(parm.mir_cuts == GLP_ON || parm.mir_cuts == GLP_OFF))
        xerror("glp_intopt: mir_cuts = " + parm.mir_cuts + "; invalid parameter");
    if (!(parm.gmi_cuts == GLP_ON || parm.gmi_cuts == GLP_OFF))
        xerror("glp_intopt: gmi_cuts = " + parm.gmi_cuts + "; invalid parameter");
    if (!(parm.cov_cuts == GLP_ON || parm.cov_cuts == GLP_OFF))
        xerror("glp_intopt: cov_cuts = " + parm.cov_cuts + "; invalid parameter");
    if (!(parm.clq_cuts == GLP_ON || parm.clq_cuts == GLP_OFF))
        xerror("glp_intopt: clq_cuts = " + parm.clq_cuts + "; invalid parameter");
    if (!(parm.presolve == GLP_ON || parm.presolve == GLP_OFF))
        xerror("glp_intopt: presolve = " + parm.presolve + "; invalid parameter");
    if (!(parm.binarize == GLP_ON || parm.binarize == GLP_OFF))
        xerror("glp_intopt: binarize = " + parm.binarize + "; invalid parameter");
    if (!(parm.fp_heur == GLP_ON || parm.fp_heur == GLP_OFF))
        xerror("glp_intopt: fp_heur = " + parm.fp_heur + "; invalid parameter");
    /* integer solution is currently undefined */
    P.mip_stat = GLP_UNDEF;
    P.mip_obj = 0.0;
    /* check bounds of double-bounded variables */
    for (i = 1; i <= P.m; i++)
    {   var row = P.row[i];
        if (row.type == GLP_DB && row.lb >= row.ub)
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_intopt: row " + i + ": lb = " + row.lb + ", ub = " + row.ub + "; incorrect bounds");
            ret = GLP_EBOUND;
            return ret;
        }
    }
    for (j = 1; j <= P.n; j++)
    {   col = P.col[j];
        if (col.type == GLP_DB && col.lb >= col.ub)
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_intopt: column " + j + ": lb = " + col.lb + ", ub = " + col.ub + "; incorrect bounds");
            ret = GLP_EBOUND;
            return ret;
        }
    }
    /* bounds of all integer variables must be integral */
    for (j = 1; j <= P.n; j++)
    {   col = P.col[j];
        if (col.kind != GLP_IV) continue;
        if (col.type == GLP_LO || col.type == GLP_DB)
        {  if (col.lb != Math.floor(col.lb))
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_intopt: integer column " + j + " has non-integer lower bound " + col.lb + "");
            ret = GLP_EBOUND;
            return ret;
        }
        }
        if (col.type == GLP_UP || col.type == GLP_DB)
        {  if (col.ub != Math.floor(col.ub))
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_intopt: integer column " + j + " has non-integer upper bound " + col.ub + "");
            ret = GLP_EBOUND;
            return ret;
        }
        }
        if (col.type == GLP_FX)
        {  if (col.lb != Math.floor(col.lb))
        {  if (parm.msg_lev >= GLP_MSG_ERR)
            xprintf("glp_intopt: integer column " + j + " has non-integer fixed value " + col.lb + "");
            ret = GLP_EBOUND;
            return ret;
        }
        }
    }
    /* solve MIP problem */
    if (parm.msg_lev >= GLP_MSG_ALL)
    {   var ni = glp_get_num_int(P);
        var nb = glp_get_num_bin(P);
        var s;
        xprintf("GLPK Integer Optimizer, v" + glp_version() + "");
        xprintf(P.m + " row" + (P.m == 1 ? "" : "s") + ", " + P.n + " column" + (P.n == 1 ? "" : "s") + ", " + P.nnz + " non-zero" + (P.nnz == 1 ? "" : "s") + "");
        if (nb == 0)
            s = "none of";
        else if (ni == 1 && nb == 1)
            s = "";
        else if (nb == 1)
            s = "one of";
        else if (nb == ni)
            s = "all of";
        else
            s = nb + " of";
        xprintf(ni + " integer variable" + (ni == 1 ? "" : "s") + ", " + s + " which " + (nb == 1 ? "is" : "are") + " binary");
    }
    if (!parm.presolve)
        ret = solve_mip(P, parm);
    else
        ret = preprocess_and_solve_mip(P, parm);
    /* return to the application program */
    return ret;
};

var glp_init_iocp = exports.glp_init_iocp = function(parm){
    parm.msg_lev = GLP_MSG_ALL;
    parm.br_tech = GLP_BR_DTH;
    parm.bt_tech = GLP_BT_BLB;
    parm.tol_int = 1e-5;
    parm.tol_obj = 1e-7;
    parm.tm_lim = INT_MAX;
    parm.out_frq = 5000;
    parm.out_dly = 10000;
    parm.cb_func = null;
    parm.cb_info = null;
    parm.cb_size = 0;
    parm.pp_tech = GLP_PP_ALL;
    parm.mip_gap = 0.0;
    parm.mir_cuts = GLP_OFF;
    parm.gmi_cuts = GLP_OFF;
    parm.cov_cuts = GLP_OFF;
    parm.clq_cuts = GLP_OFF;
    parm.presolve = GLP_OFF;
    parm.binarize = GLP_OFF;
    parm.fp_heur = GLP_OFF;
};

var glp_mip_status = exports.glp_mip_status = function(mip){
    return mip.mip_stat;
};

var glp_mip_obj_val = exports.glp_mip_obj_val = function(mip){
    return mip.mip_obj;
};

var glp_mip_row_val = exports.glp_mip_row_val = function(mip, i){
    if (!(1 <= i && i <= mip.m))
        xerror("glp_mip_row_val: i = " + i + "; row number out of range");
    return mip.row[i].mipx;
};

var glp_mip_col_val = exports.glp_mip_col_val = function(mip, j){
    if (!(1 <= j && j <= mip.n))
        xerror("glp_mip_col_val: j = " + j + "; column number out of range");
    return mip.col[j].mipx;
};
