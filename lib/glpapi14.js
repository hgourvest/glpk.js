/* glpapi14.c (processing models in GNU MathProg language) */

var glp_mpl_alloc_wksp = exports["glp_mpl_alloc_wksp"] = function(){
    /* allocate the MathProg translator workspace */
    return mpl_initialize();
};

var _glp_mpl_init_rand = exports["_glp_mpl_init_rand"] = function (tran, seed){
    if (tran.phase != 0)
    xerror("glp_mpl_init_rand: invalid call sequence\n");
    rng_init_rand(tran.rand, seed);
};

var glp_mpl_read_model = exports["glp_mpl_read_model"] = function(tran, name, callback, skip){
    /* read and translate model section */
    var ret;
    if (tran.phase != 0)
        xerror("glp_mpl_read_model: invalid call sequence");
    ret = mpl_read_model(tran, name, callback, skip);
    if (ret == 1 || ret == 2)
        ret = 0;
    else if (ret == 4)
        ret = 1;
    else
        xassert(ret != ret);
    return ret;
};

var glp_mpl_read_model_from_string = exports["glp_mpl_read_model_from_string"] = function(tran, name, str, skip){
    var pos = 0;
    return glp_mpl_read_model(tran, name,
        function(){
            if (pos < str.length){
                return str[pos++];
            } else
                return -1;
        },
        skip
    )
};

var glp_mpl_read_data = exports["glp_mpl_read_data"] = function(tran, name, callback){
    /* read and translate data section */
    var ret;
    if (!(tran.phase == 1 || tran.phase == 2))
        xerror("glp_mpl_read_data: invalid call sequence");
    ret = mpl_read_data(tran, name, callback);
    if (ret == 2)
        ret = 0;
    else if (ret == 4)
        ret = 1;
    else
        xassert(ret != ret);
    return ret;
};

var glp_mpl_read_data_from_string = exports["glp_mpl_read_data_from_string"] = function(tran, name, str){
    var pos = 0;
    return glp_mpl_read_data(tran, name,
        function(){
            if (pos < str.length){
                return str[pos++];
            } else
                return -1;
        }
    )
};

var glp_mpl_generate = exports["glp_mpl_generate"] = function(tran, name, callback){
    /* generate the model */
    var ret;
    if (!(tran.phase == 1 || tran.phase == 2))
        xerror("glp_mpl_generate: invalid call sequence\n");
    ret = mpl_generate(tran, name, callback);
    if (ret == 3)
        ret = 0;
    else if (ret == 4)
        ret = 1;
    return ret;
};

var glp_mpl_build_prob = exports["glp_mpl_build_prob"] = function(tran, prob){
    /* build LP/MIP problem instance from the model */
    var m, n, i, j, t, kind, type, len, ind;
    var lb, ub, val;
    if (tran.phase != 3)
        xerror("glp_mpl_build_prob: invalid call sequence\n");
    /* erase the problem object */
    glp_erase_prob(prob);
    /* set problem name */
    glp_set_prob_name(prob, mpl_get_prob_name(tran));
    /* build rows (constraints) */
    m = mpl_get_num_rows(tran);
    if (m > 0)
        glp_add_rows(prob, m);
    for (i = 1; i <= m; i++)
    {  /* set row name */
        glp_set_row_name(prob, i, mpl_get_row_name(tran, i));
        /* set row bounds */
        type = mpl_get_row_bnds(tran, i, function(l,u){lb=l; ub=u});
        switch (type)
        {  case MPL_FR: type = GLP_FR; break;
            case MPL_LO: type = GLP_LO; break;
            case MPL_UP: type = GLP_UP; break;
            case MPL_DB: type = GLP_DB; break;
            case MPL_FX: type = GLP_FX; break;
            default: xassert(type != type);
        }
        if (type == GLP_DB && Math.abs(lb - ub) < 1e-9 * (1.0 + Math.abs(lb)))
        {  type = GLP_FX;
            if (Math.abs(lb) <= Math.abs(ub)) ub = lb; else lb = ub;
        }
        glp_set_row_bnds(prob, i, type, lb, ub);
        /* warn about non-zero constant term */
        if (mpl_get_row_c0(tran, i) != 0.0)
            xprintf("glp_mpl_build_prob: row " + mpl_get_row_name(tran, i) + "; constant term " + mpl_get_row_c0(tran, i) + " ignored");
    }
    /* build columns (variables) */
    n = mpl_get_num_cols(tran);
    if (n > 0)
        glp_add_cols(prob, n);
    for (j = 1; j <= n; j++)
    {  /* set column name */
        glp_set_col_name(prob, j, mpl_get_col_name(tran, j));
        /* set column kind */
        kind = mpl_get_col_kind(tran, j);
        switch (kind)
        {  case MPL_NUM:
            break;
            case MPL_INT:
            case MPL_BIN:
                glp_set_col_kind(prob, j, GLP_IV);
                break;
            default:
                xassert(kind != kind);
        }
        /* set column bounds */
        type = mpl_get_col_bnds(tran, j, function(l,u){lb=l; ub=u});
        switch (type)
        {  case MPL_FR: type = GLP_FR; break;
            case MPL_LO: type = GLP_LO; break;
            case MPL_UP: type = GLP_UP; break;
            case MPL_DB: type = GLP_DB; break;
            case MPL_FX: type = GLP_FX; break;
            default: xassert(type != type);
        }
        if (kind == MPL_BIN)
        {  if (type == GLP_FR || type == GLP_UP || lb < 0.0) lb = 0.0;
            if (type == GLP_FR || type == GLP_LO || ub > 1.0) ub = 1.0;
            type = GLP_DB;
        }
        if (type == GLP_DB && Math.abs(lb - ub) < 1e-9 * (1.0 + Math.abs(lb)))
        {  type = GLP_FX;
            if (Math.abs(lb) <= Math.abs(ub)) ub = lb; else lb = ub;
        }
        glp_set_col_bnds(prob, j, type, lb, ub);
    }
    /* load the constraint matrix */
    ind = new Array(1+n);
    val = new Array(1+n);
    for (i = 1; i <= m; i++)
    {  len = mpl_get_mat_row(tran, i, ind, val);
        glp_set_mat_row(prob, i, len, ind, val);
    }
    /* build objective function (the first objective is used) */
    for (i = 1; i <= m; i++)
    {  kind = mpl_get_row_kind(tran, i);
        if (kind == MPL_MIN || kind == MPL_MAX)
        {  /* set objective name */
            glp_set_obj_name(prob, mpl_get_row_name(tran, i));
            /* set optimization direction */
            glp_set_obj_dir(prob, kind == MPL_MIN ? GLP_MIN : GLP_MAX);
            /* set constant term */
            glp_set_obj_coef(prob, 0, mpl_get_row_c0(tran, i));
            /* set objective coefficients */
            len = mpl_get_mat_row(tran, i, ind, val);
            for (t = 1; t <= len; t++)
                glp_set_obj_coef(prob, ind[t], val[t]);
            break;
        }
    }
};

var glp_mpl_postsolve = exports["glp_mpl_postsolve"] = function(tran, prob, sol){
    /* postsolve the model */
    var i, j, m, n, stat, ret;
    var prim, dual;
    if (!(tran.phase == 3 && !tran.flag_p))
        xerror("glp_mpl_postsolve: invalid call sequence");
    if (!(sol == GLP_SOL || sol == GLP_IPT || sol == GLP_MIP))
        xerror("glp_mpl_postsolve: sol = " + sol + "; invalid parameter");
    m = mpl_get_num_rows(tran);
    n = mpl_get_num_cols(tran);
    if (!(m == glp_get_num_rows(prob) &&
        n == glp_get_num_cols(prob)))
        xerror("glp_mpl_postsolve: wrong problem object\n");
    if (!mpl_has_solve_stmt(tran))
      return 0;
    for (i = 1; i <= m; i++)
    {  if (sol == GLP_SOL)
    {  stat = glp_get_row_stat(prob, i);
        prim = glp_get_row_prim(prob, i);
        dual = glp_get_row_dual(prob, i);
    }
    else if (sol == GLP_IPT)
    {  stat = 0;
        prim = glp_ipt_row_prim(prob, i);
        dual = glp_ipt_row_dual(prob, i);
    }
    else if (sol == GLP_MIP)
    {  stat = 0;
        prim = glp_mip_row_val(prob, i);
        dual = 0.0;
    }
    else
        xassert(sol != sol);
        if (Math.abs(prim) < 1e-9) prim = 0.0;
        if (Math.abs(dual) < 1e-9) dual = 0.0;
        mpl_put_row_soln(tran, i, stat, prim, dual);
    }
    for (j = 1; j <= n; j++)
    {  if (sol == GLP_SOL)
    {  stat = glp_get_col_stat(prob, j);
        prim = glp_get_col_prim(prob, j);
        dual = glp_get_col_dual(prob, j);
    }
    else if (sol == GLP_IPT)
    {  stat = 0;
        prim = glp_ipt_col_prim(prob, j);
        dual = glp_ipt_col_dual(prob, j);
    }
    else if (sol == GLP_MIP)
    {  stat = 0;
        prim = glp_mip_col_val(prob, j);
        dual = 0.0;
    }
    else
        xassert(sol != sol);
        if (Math.abs(prim) < 1e-9) prim = 0.0;
        if (Math.abs(dual) < 1e-9) dual = 0.0;
        mpl_put_col_soln(tran, j, stat, prim, dual);
    }
    ret = mpl_postsolve(tran);
    if (ret == 3)
        ret = 0;
    else if (ret == 4)
        ret = 1;
    return ret;
};

