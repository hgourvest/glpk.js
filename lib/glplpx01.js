function lpx_create_prob(){
    /* create problem object */
    return glp_create_prob();
}

function lpx_set_prob_name(lp, name)
{     /* assign (change) problem name */
    glp_set_prob_name(lp, name);
}

function lpx_set_obj_name(lp, name){
    /* assign (change) objective function name */
    glp_set_obj_name(lp, name);
}

function lpx_set_obj_dir(lp, dir){
    /* set (change) optimization direction flag */
    glp_set_obj_dir(lp, dir - LPX_MIN + GLP_MIN);
}

function lpx_add_rows(lp, nrs){
    /* add new rows to problem object */
    return glp_add_rows(lp, nrs);
}

function lpx_add_cols(lp, ncs){
    /* add new columns to problem object */
    return glp_add_cols(lp, ncs);
}

function lpx_set_row_name(lp, i, name)
{     /* assign (change) row name */
    glp_set_row_name(lp, i, name);
}

function lpx_set_col_name(lp, j, name){
    /* assign (change) column name */
    glp_set_col_name(lp, j, name);
}

function lpx_set_row_bnds(lp, i, type, lb, ub){
    /* set (change) row bounds */
    glp_set_row_bnds(lp, i, type - LPX_FR + GLP_FR, lb, ub);
}

function lpx_set_col_bnds(lp, j, type, lb, ub){
    /* set (change) column bounds */
    glp_set_col_bnds(lp, j, type - LPX_FR + GLP_FR, lb, ub);
}

function lpx_set_obj_coef(lp, j, coef){
    /* set (change) obj. coefficient or constant term */
    glp_set_obj_coef(lp, j, coef);
}

function lpx_set_mat_row(lp, i, len, ind, val){
    /* set (replace) row of the constraint matrix */
    glp_set_mat_row(lp, i, len, ind, val);
}

function lpx_set_mat_col(lp, j, len, ind, val){
    /* set (replace) column of the constraint matrix */
    glp_set_mat_col(lp, j, len, ind, val);
}

function lpx_load_matrix(lp, ne, ia, ja, ar){
    /* load (replace) the whole constraint matrix */
    glp_load_matrix(lp, ne, ia, ja, ar);
}

function lpx_del_rows(lp, nrs, num){
    /* delete specified rows from problem object */
    glp_del_rows(lp, nrs, num);
}

function lpx_del_cols(lp, ncs, num){
    /* delete specified columns from problem object */
    glp_del_cols(lp, ncs, num);
}

function lpx_delete_prob(lp){
    /* delete problem object */
    glp_delete_prob(lp);
}

function lpx_get_prob_name(lp){
    /* retrieve problem name */
    return glp_get_prob_name(lp);
}

function lpx_get_obj_name(lp){
    /* retrieve objective function name */
    return glp_get_obj_name(lp);
}

function lpx_get_obj_dir(lp){
    /* retrieve optimization direction flag */
    return glp_get_obj_dir(lp) - GLP_MIN + LPX_MIN;
}

function lpx_get_num_rows(lp){
    /* retrieve number of rows */
    return glp_get_num_rows(lp);
}

function lpx_get_num_cols(lp){
    /* retrieve number of columns */
    return glp_get_num_cols(lp);
}

function lpx_get_row_name(lp, i){
    /* retrieve row name */
    return glp_get_row_name(lp, i);
}

function lpx_get_col_name(lp, j){
    /* retrieve column name */
    return glp_get_col_name(lp, j);
}

function lpx_get_row_type(lp, i){
    /* retrieve row type */
    return glp_get_row_type(lp, i) - GLP_FR + LPX_FR;
}

function lpx_get_row_lb(lp, i){
    /* retrieve row lower bound */
    var lb = glp_get_row_lb(lp, i);
    if (lb == -DBL_MAX) lb = 0.0;
    return lb;
}

function lpx_get_row_ub(lp, i){
    /* retrieve row upper bound */
    var ub = glp_get_row_ub(lp, i);
    if (ub == +DBL_MAX) ub = 0.0;
    return ub;
}

function lpx_get_row_bnds(lp, i, callback){
    /* retrieve row bounds */
    callback(lpx_get_row_type(lp, i), lpx_get_row_lb(lp, i), lpx_get_row_ub(lp, i));
}

function lpx_get_col_type(lp, j){
    /* retrieve column type */
    return glp_get_col_type(lp, j) - GLP_FR + LPX_FR;
}

function lpx_get_col_lb(lp, j){
    /* retrieve column lower bound */
    var lb = glp_get_col_lb(lp, j);
    if (lb == -DBL_MAX) lb = 0.0;
    return lb;
}

function lpx_get_col_ub(lp, j){
    /* retrieve column upper bound */
    var ub = glp_get_col_ub(lp, j);
    if (ub == +DBL_MAX) ub = 0.0;
    return ub;
}

function lpx_get_col_bnds(lp, j, callback)
{     /* retrieve column bounds */
    callback(lpx_get_col_type(lp, j), lpx_get_col_lb(lp, j), lpx_get_col_ub(lp, j));
}

function lpx_get_obj_coef(lp, j){
    /* retrieve obj. coefficient or constant term */
    return glp_get_obj_coef(lp, j);
}

function lpx_get_num_nz(lp){
    /* retrieve number of constraint coefficients */
    return glp_get_num_nz(lp);
}

function lpx_get_mat_row(lp, i, ind, val){
    /* retrieve row of the constraint matrix */
    return glp_get_mat_row(lp, i, ind, val);
}

function lpx_get_mat_col(lp, j, ind, val){
    /* retrieve column of the constraint matrix */
    return glp_get_mat_col(lp, j, ind, val);
}

function lpx_create_index(lp){
    /* create the name index */
    glp_create_index(lp);
}

function lpx_find_row(lp, name){
    /* find row by its name */
    return glp_find_row(lp, name);
}

function lpx_find_col(lp, name){
    /* find column by its name */
    return glp_find_col(lp, name);
}

function lpx_delete_index(lp){
    /* delete the name index */
    glp_delete_index(lp);
}

function lpx_scale_prob(lp){
    /* scale problem data */
    switch (lpx_get_int_parm(lp, LPX_K_SCALE))
    {  case 0:
        /* no scaling */
        glp_unscale_prob(lp);
        break;
        case 1:
            /* equilibration scaling */
            glp_scale_prob(lp, GLP_SF_EQ);
            break;
        case 2:
            /* geometric mean scaling */
            glp_scale_prob(lp, GLP_SF_GM);
            break;
        case 3:
            /* geometric mean scaling, then equilibration scaling */
            glp_scale_prob(lp, GLP_SF_GM | GLP_SF_EQ);
            break;
        default:
            xassert(lp != lp);
    }
}

function lpx_unscale_prob(lp){
    /* unscale problem data */
    glp_unscale_prob(lp);
}

function lpx_set_row_stat(lp, i, stat){
    /* set (change) row status */
    glp_set_row_stat(lp, i, stat - LPX_BS + GLP_BS);
}

function lpx_set_col_stat(lp, j, stat){
    /* set (change) column status */
    glp_set_col_stat(lp, j, stat - LPX_BS + GLP_BS);
}

function lpx_std_basis(lp){
    /* construct standard initial LP basis */
    glp_std_basis(lp);
}

function lpx_adv_basis(lp){
    /* construct advanced initial LP basis */
    glp_adv_basis(lp, 0);
}

function lpx_cpx_basis(lp){
    /* construct Bixby's initial LP basis */
    glp_cpx_basis(lp);
}

function fill_smcp(lp, parm){
    glp_init_smcp(parm);
    switch (lpx_get_int_parm(lp, LPX_K_MSGLEV))
    {  case 0:  parm.msg_lev = GLP_MSG_OFF;   break;
        case 1:  parm.msg_lev = GLP_MSG_ERR;   break;
        case 2:  parm.msg_lev = GLP_MSG_ON;    break;
        case 3:  parm.msg_lev = GLP_MSG_ALL;   break;
        default: xassert(lp != lp);
    }
    switch (lpx_get_int_parm(lp, LPX_K_DUAL))
    {  case 0:  parm.meth = GLP_PRIMAL;       break;
        case 1:  parm.meth = GLP_DUAL;         break;
        default: xassert(lp != lp);
    }
    switch (lpx_get_int_parm(lp, LPX_K_PRICE))
    {  case 0:  parm.pricing = GLP_PT_STD;    break;
        case 1:  parm.pricing = GLP_PT_PSE;    break;
        default: xassert(lp != lp);
    }
    if (lpx_get_real_parm(lp, LPX_K_RELAX) == 0.0)
        parm.r_test = GLP_RT_STD;
    else
        parm.r_test = GLP_RT_HAR;
    parm.tol_bnd = lpx_get_real_parm(lp, LPX_K_TOLBND);
    parm.tol_dj  = lpx_get_real_parm(lp, LPX_K_TOLDJ);
    parm.tol_piv = lpx_get_real_parm(lp, LPX_K_TOLPIV);
    parm.obj_ll  = lpx_get_real_parm(lp, LPX_K_OBJLL);
    parm.obj_ul  = lpx_get_real_parm(lp, LPX_K_OBJUL);
    if (lpx_get_int_parm(lp, LPX_K_ITLIM) < 0)
        parm.it_lim = INT_MAX;
    else
        parm.it_lim = lpx_get_int_parm(lp, LPX_K_ITLIM);
    if (lpx_get_real_parm(lp, LPX_K_TMLIM) < 0.0)
        parm.tm_lim = INT_MAX;
    else
        parm.tm_lim = (1000.0 * lpx_get_real_parm(lp, LPX_K_TMLIM))|0;
    parm.out_frq = lpx_get_int_parm(lp, LPX_K_OUTFRQ);
    parm.out_dly = (1000.0 * lpx_get_real_parm(lp, LPX_K_OUTDLY))|0;
    switch (lpx_get_int_parm(lp, LPX_K_PRESOL))
    {  case 0:  parm.presolve = GLP_OFF;      break;
        case 1:  parm.presolve = GLP_ON;       break;
        default: xassert(lp != lp);
    }
}

function lpx_simplex(lp){
    /* easy-to-use driver to the simplex method */
    var parm = {};
    var ret;
    fill_smcp(lp, parm);
    ret = glp_simplex(lp, parm);
    switch (ret)
    {  case 0:           ret = LPX_E_OK;      break;
        case GLP_EBADB:
        case GLP_ESING:
        case GLP_ECOND:
        case GLP_EBOUND:  ret = LPX_E_FAULT;   break;
        case GLP_EFAIL:   ret = LPX_E_SING;    break;
        case GLP_EOBJLL:  ret = LPX_E_OBJLL;   break;
        case GLP_EOBJUL:  ret = LPX_E_OBJUL;   break;
        case GLP_EITLIM:  ret = LPX_E_ITLIM;   break;
        case GLP_ETMLIM:  ret = LPX_E_TMLIM;   break;
        case GLP_ENOPFS:  ret = LPX_E_NOPFS;   break;
        case GLP_ENODFS:  ret = LPX_E_NODFS;   break;
        default:          xassert(ret != ret);
    }
    return ret;
}

function lpx_exact(lp){
    /* easy-to-use driver to the exact simplex method */
    var parm = {};
    var ret;
    fill_smcp(lp, parm);
    ret = glp_exact(lp, parm);
    switch (ret)
    {  case 0:           ret = LPX_E_OK;      break;
        case GLP_EBADB:
        case GLP_ESING:
        case GLP_EBOUND:
        case GLP_EFAIL:   ret = LPX_E_FAULT;   break;
        case GLP_EITLIM:  ret = LPX_E_ITLIM;   break;
        case GLP_ETMLIM:  ret = LPX_E_TMLIM;   break;
        default:          xassert(ret != ret);
    }
    return ret;
}

function lpx_get_status(lp){
    /* retrieve generic status of basic solution */
    var status;
    switch (glp_get_status(lp))
    {  case GLP_OPT:    status = LPX_OPT;    break;
        case GLP_FEAS:   status = LPX_FEAS;   break;
        case GLP_INFEAS: status = LPX_INFEAS; break;
        case GLP_NOFEAS: status = LPX_NOFEAS; break;
        case GLP_UNBND:  status = LPX_UNBND;  break;
        case GLP_UNDEF:  status = LPX_UNDEF;  break;
        default:         xassert(lp != lp);
    }
    return status;
}

function lpx_get_prim_stat(lp){
    /* retrieve status of primal basic solution */
    return glp_get_prim_stat(lp) - GLP_UNDEF + LPX_P_UNDEF;
}

function lpx_get_dual_stat(lp){
    /* retrieve status of dual basic solution */
    return glp_get_dual_stat(lp) - GLP_UNDEF + LPX_D_UNDEF;
}

function lpx_get_obj_val(lp){
    /* retrieve objective value (basic solution) */
    return glp_get_obj_val(lp);
}

function lpx_get_row_stat(lp, i){
    /* retrieve row status (basic solution) */
    return glp_get_row_stat(lp, i) - GLP_BS + LPX_BS;
}

function lpx_get_row_prim(lp, i){
    /* retrieve row primal value (basic solution) */
    return glp_get_row_prim(lp, i);
}

function lpx_get_row_dual(lp, i){
    /* retrieve row dual value (basic solution) */
    return glp_get_row_dual(lp, i);
}

function lpx_get_row_info(lp, i, callback){
    /* obtain row solution information */
    callback(lpx_get_row_stat(lp, i), lpx_get_row_prim(lp, i), lpx_get_row_dual(lp, i))
}

function lpx_get_col_stat(lp, j){
    /* retrieve column status (basic solution) */
    return glp_get_col_stat(lp, j) - GLP_BS + LPX_BS;
}

function lpx_get_col_prim(lp, j){
    /* retrieve column primal value (basic solution) */
    return glp_get_col_prim(lp, j);
}

function lpx_get_col_dual(lp, j){
    /* retrieve column dual value (basic solution) */
    return glp_get_col_dual(lp, j);
}

function lpx_get_col_info(lp, j, callback){
    /* obtain column solution information */
    callback(lpx_get_col_stat(lp, j), lpx_get_col_prim(lp, j), lpx_get_col_dual(lp, j));
}

function lpx_get_ray_info(lp){
    /* determine what causes primal unboundness */
    return glp_get_unbnd_ray(lp);
}

function lpx_check_kkt(lp, scaled, kkt){
    /* check Karush-Kuhn-Tucker conditions */
    xassert(scaled == scaled);
    _glp_check_kkt(lp, GLP_SOL, GLP_KKT_PE,
        function(ae_max, ae_ind, re_max, re_ind){
            kkt.pe_ae_max = ae_max;
            kkt.pe_ae_row = ae_ind;
            kkt.pe_re_max = re_max;
            kkt.pe_re_row = re_ind;
            if (re_max <= 1e-9)
                kkt.pe_quality = 'H';
            else if (re_max <= 1e-6)
                kkt.pe_quality = 'M';
            else if (re_max <= 1e-3)
                kkt.pe_quality = 'L';
            else
                kkt.pe_quality = '?';
        }
    );

    _glp_check_kkt(lp, GLP_SOL, GLP_KKT_PB,
        function(ae_max, ae_ind, re_max, re_ind){
            kkt.pb_ae_max = ae_max;
            kkt.pb_ae_ind = ae_ind;
            kkt.pb_re_max = re_max;
            kkt.pb_re_ind = re_ind;
            if (re_max <= 1e-9)
                kkt.pb_quality = 'H';
            else if (re_max <= 1e-6)
                kkt.pb_quality = 'M';
            else if (re_max <= 1e-3)
                kkt.pb_quality = 'L';
            else
                kkt.pb_quality = '?';
        }
    );

    _glp_check_kkt(lp, GLP_SOL, GLP_KKT_DE,
        function(ae_max, ae_ind, re_max, re_ind){
            kkt.de_ae_max = ae_max;
            if (ae_ind == 0)
                kkt.de_ae_col = 0;
            else
                kkt.de_ae_col = ae_ind - lp.m;
            kkt.de_re_max = re_max;
            if (re_ind == 0)
                kkt.de_re_col = 0;
            else
                kkt.de_re_col = ae_ind - lp.m;
            if (re_max <= 1e-9)
                kkt.de_quality = 'H';
            else if (re_max <= 1e-6)
                kkt.de_quality = 'M';
            else if (re_max <= 1e-3)
                kkt.de_quality = 'L';
            else
                kkt.de_quality = '?';
        }
    );

    _glp_check_kkt(lp, GLP_SOL, GLP_KKT_DB,
        function(ae_max, ae_ind, re_max, re_ind){
            kkt.db_ae_max = ae_max;
            kkt.db_ae_ind = ae_ind;
            kkt.db_re_max = re_max;
            kkt.db_re_ind = re_ind;
            if (re_max <= 1e-9)
                kkt.db_quality = 'H';
            else if (re_max <= 1e-6)
                kkt.db_quality = 'M';
            else if (re_max <= 1e-3)
                kkt.db_quality = 'L';
            else
                kkt.db_quality = '?';
            kkt.cs_ae_max = 0.0; kkt.cs_ae_ind = 0;
            kkt.cs_re_max = 0.0; kkt.cs_re_ind = 0;
            kkt.cs_quality = 'H';
        }
    );
}

function lpx_warm_up(lp){
    /* "warm up" LP basis */
    var ret = glp_warm_up(lp);
    if (ret == 0)
        ret = LPX_E_OK;
    else if (ret == GLP_EBADB)
        ret = LPX_E_BADB;
    else if (ret == GLP_ESING)
        ret = LPX_E_SING;
    else if (ret == GLP_ECOND)
        ret = LPX_E_SING;
    else
        xassert(ret != ret);
    return ret;
}

function lpx_eval_tab_row(lp, k, ind, val){
    /* compute row of the simplex tableau */
    return glp_eval_tab_row(lp, k, ind, val);
}

function lpx_eval_tab_col(lp, k, ind, val){
    /* compute column of the simplex tableau */
    return glp_eval_tab_col(lp, k, ind, val);
}

function lpx_transform_row(lp, len, ind, val){
    /* transform explicitly specified row */
    return glp_transform_row(lp, len, ind, val);
}

function lpx_transform_col(lp, len, ind, val){
    /* transform explicitly specified column */
    return glp_transform_col(lp, len, ind, val);
}

function lpx_prim_ratio_test(lp, len, ind, val, how, tol){
    /* perform primal ratio test */
    var piv = glp_prim_rtest(lp, len, ind, val, how, tol);
    xassert(0 <= piv && piv <= len);
    return piv == 0 ? 0 : ind[piv];
}

function lpx_dual_ratio_test(lp, len, ind, val, how, tol){
    /* perform dual ratio test */
    var piv = glp_dual_rtest(lp, len, ind, val, how, tol);
    xassert(0 <= piv && piv <= len);
    return piv == 0 ? 0 : ind[piv];
}

function lpx_interior(lp){
    /* easy-to-use driver to the interior-point method */
    var ret = glp_interior(lp, null);
    switch (ret)
    {  case 0:           ret = LPX_E_OK;      break;
        case GLP_EFAIL:   ret = LPX_E_FAULT;   break;
        case GLP_ENOFEAS: ret = LPX_E_NOFEAS;  break;
        case GLP_ENOCVG:  ret = LPX_E_NOCONV;  break;
        case GLP_EITLIM:  ret = LPX_E_ITLIM;   break;
        case GLP_EINSTAB: ret = LPX_E_INSTAB;  break;
        default:          xassert(ret != ret);
    }
    return ret;
}

function lpx_ipt_status(lp){
    /* retrieve status of interior-point solution */
    var status;
    switch (glp_ipt_status(lp))
    {  case GLP_UNDEF:  status = LPX_T_UNDEF;  break;
        case GLP_OPT:    status = LPX_T_OPT;    break;
        default:         xassert(lp != lp);
    }
    return status;
}

function lpx_ipt_obj_val(lp){
    /* retrieve objective value (interior point) */
    return glp_ipt_obj_val(lp);
}

function lpx_ipt_row_prim(lp, i){
    /* retrieve row primal value (interior point) */
    return glp_ipt_row_prim(lp, i);
}

function lpx_ipt_row_dual(lp, i){
    /* retrieve row dual value (interior point) */
    return glp_ipt_row_dual(lp, i);
}

function lpx_ipt_col_prim(lp, j){
    /* retrieve column primal value (interior point) */
    return glp_ipt_col_prim(lp, j);
}

function lpx_ipt_col_dual(lp, j){
    /* retrieve column dual value (interior point) */
    return glp_ipt_col_dual(lp, j);
}

function lpx_set_class(lp, klass){
    /* set problem class */
    xassert(lp == lp);
    if (!(klass == LPX_LP || klass == LPX_MIP))
        xerror("lpx_set_class: invalid problem class");
}

function lpx_get_class(lp){
    /* determine problem klass */
    return glp_get_num_int(lp) == 0 ? LPX_LP : LPX_MIP;
}

function lpx_set_col_kind(lp, j, kind){
    /* set (change) column kind */
    glp_set_col_kind(lp, j, kind - LPX_CV + GLP_CV);
}

function lpx_get_col_kind(lp, j){
    /* retrieve column kind */
    return glp_get_col_kind(lp, j) == GLP_CV ? LPX_CV : LPX_IV;
}

function lpx_get_num_int(lp){
    /* retrieve number of integer columns */
    return glp_get_num_int(lp);
}

function lpx_get_num_bin(lp){
    /* retrieve number of binary columns */
    return glp_get_num_bin(lp);
}

function solve_mip(lp, presolve){
    var parm = {};
    var ret;
    glp_init_iocp(parm);
    switch (lpx_get_int_parm(lp, LPX_K_MSGLEV))
    {  case 0:  parm.msg_lev = GLP_MSG_OFF;   break;
        case 1:  parm.msg_lev = GLP_MSG_ERR;   break;
        case 2:  parm.msg_lev = GLP_MSG_ON;    break;
        case 3:  parm.msg_lev = GLP_MSG_ALL;   break;
        default: xassert(lp != lp);
    }
    switch (lpx_get_int_parm(lp, LPX_K_BRANCH))
    {  case 0:  parm.br_tech = GLP_BR_FFV;    break;
        case 1:  parm.br_tech = GLP_BR_LFV;    break;
        case 2:  parm.br_tech = GLP_BR_DTH;    break;
        case 3:  parm.br_tech = GLP_BR_MFV;    break;
        default: xassert(lp != lp);
    }
    switch (lpx_get_int_parm(lp, LPX_K_BTRACK))
    {  case 0:  parm.bt_tech = GLP_BT_DFS;    break;
        case 1:  parm.bt_tech = GLP_BT_BFS;    break;
        case 2:  parm.bt_tech = GLP_BT_BPH;    break;
        case 3:  parm.bt_tech = GLP_BT_BLB;    break;
        default: xassert(lp != lp);
    }
    parm.tol_int = lpx_get_real_parm(lp, LPX_K_TOLINT);
    parm.tol_obj = lpx_get_real_parm(lp, LPX_K_TOLOBJ);
    if (lpx_get_real_parm(lp, LPX_K_TMLIM) < 0.0 ||
        lpx_get_real_parm(lp, LPX_K_TMLIM) > 1e6)
        parm.tm_lim = INT_MAX;
    else
        parm.tm_lim = (1000.0 * lpx_get_real_parm(lp, LPX_K_TMLIM))|0;
    parm.mip_gap = lpx_get_real_parm(lp, LPX_K_MIPGAP);
    if (lpx_get_int_parm(lp, LPX_K_USECUTS) & LPX_C_GOMORY)
        parm.gmi_cuts = GLP_ON;
    else
        parm.gmi_cuts = GLP_OFF;
    if (lpx_get_int_parm(lp, LPX_K_USECUTS) & LPX_C_MIR)
        parm.mir_cuts = GLP_ON;
    else
        parm.mir_cuts = GLP_OFF;
    if (lpx_get_int_parm(lp, LPX_K_USECUTS) & LPX_C_COVER)
        parm.cov_cuts = GLP_ON;
    else
        parm.cov_cuts = GLP_OFF;
    if (lpx_get_int_parm(lp, LPX_K_USECUTS) & LPX_C_CLIQUE)
        parm.clq_cuts = GLP_ON;
    else
        parm.clq_cuts = GLP_OFF;
    parm.presolve = presolve;
    if (lpx_get_int_parm(lp, LPX_K_BINARIZE))
        parm.binarize = GLP_ON;
    ret = glp_intopt(lp, parm);
    switch (ret)
    {  case 0:           ret = LPX_E_OK;      break;
        case GLP_ENOPFS:  ret = LPX_E_NOPFS;   break;
        case GLP_ENODFS:  ret = LPX_E_NODFS;   break;
        case GLP_EBOUND:
        case GLP_EROOT:   ret = LPX_E_FAULT;   break;
        case GLP_EFAIL:   ret = LPX_E_SING;    break;
        case GLP_EMIPGAP: ret = LPX_E_MIPGAP;  break;
        case GLP_ETMLIM:  ret = LPX_E_TMLIM;   break;
        default:          xassert(ret != ret);
    }
    return ret;
}

function lpx_integer(lp){
    /* easy-to-use driver to the branch-and-bound method */
    return solve_mip(lp, GLP_OFF);
}

function lpx_intopt(lp){
    /* easy-to-use driver to the branch-and-bound method */
    return solve_mip(lp, GLP_ON);
}

function lpx_mip_status(lp){
    /* retrieve status of MIP solution */
    var status;
    switch (glp_mip_status(lp))
    {  case GLP_UNDEF:  status = LPX_I_UNDEF;  break;
        case GLP_OPT:    status = LPX_I_OPT;    break;
        case GLP_FEAS:   status = LPX_I_FEAS;   break;
        case GLP_NOFEAS: status = LPX_I_NOFEAS; break;
        default:         xassert(lp != lp);
    }
    return status;
}

function lpx_mip_obj_val(lp){
    /* retrieve objective value (MIP solution) */
    return glp_mip_obj_val(lp);
}

function lpx_mip_row_val(lp, i){
    /* retrieve row value (MIP solution) */
    return glp_mip_row_val(lp, i);
}

function lpx_mip_col_val(lp, j){
    /* retrieve column value (MIP solution) */
    return glp_mip_col_val(lp, j);
}

function lpx_check_int(lp, kkt){
    /* check integer feasibility conditions */
    _glp_check_kkt(lp, GLP_MIP, GLP_KKT_PE,
        function(ae_max, ae_ind, re_max, re_ind){
            kkt.pe_ae_max = ae_max;
            kkt.pe_ae_row = ae_ind;
            kkt.pe_re_max = re_max;
            kkt.pe_re_row = re_ind;
            if (re_max <= 1e-9)
                kkt.pe_quality = 'H';
            else if (re_max <= 1e-6)
                kkt.pe_quality = 'M';
            else if (re_max <= 1e-3)
                kkt.pe_quality = 'L';
            else
                kkt.pe_quality = '?';
        }
    );

    _glp_check_kkt(lp, GLP_MIP, GLP_KKT_PB,
        function(ae_max, ae_ind, re_max, re_ind){
            kkt.pb_ae_max = ae_max;
            kkt.pb_ae_ind = ae_ind;
            kkt.pb_re_max = re_max;
            kkt.pb_re_ind = re_ind;
            if (re_max <= 1e-9)
                kkt.pb_quality = 'H';
            else if (re_max <= 1e-6)
                kkt.pb_quality = 'M';
            else if (re_max <= 1e-3)
                kkt.pb_quality = 'L';
            else
                kkt.pb_quality = '?';
        }
    );
}

function reset_parms(lp){
    /* reset control parameters to default values */
    var cps = lp.parms;
    xassert(cps != null);
    cps.msg_lev  = 3;
    cps.scale    = 1;
    cps.dual     = 0;
    cps.price    = 1;
    cps.relax    = 0.07;
    cps.tol_bnd  = 1e-7;
    cps.tol_dj   = 1e-7;
    cps.tol_piv  = 1e-9;
    cps.round    = 0;
    cps.obj_ll   = -DBL_MAX;
    cps.obj_ul   = +DBL_MAX;
    cps.it_lim   = -1;
    cps.tm_lim   = -1.0;
    cps.out_frq  = 200;
    cps.out_dly  = 0.0;
    cps.branch   = 2;
    cps.btrack   = 3;
    cps.tol_int  = 1e-5;
    cps.tol_obj  = 1e-7;
    cps.mps_info = 1;
    cps.mps_obj  = 2;
    cps.mps_orig = 0;
    cps.mps_wide = 1;
    cps.mps_free = 0;
    cps.mps_skip = 0;
    cps.lpt_orig = 0;
    cps.presol = 0;
    cps.binarize = 0;
    cps.use_cuts = 0;
    cps.mip_gap = 0.0;
}

function access_parms(lp){
    /* allocate and initialize control parameters, if necessary */
    if (lp.parms == null)
    {  lp.parms = {};
        reset_parms(lp);
    }
    return lp.parms;
}

function lpx_reset_parms(lp){
    /* reset control parameters to default values */
    access_parms(lp);
    reset_parms(lp);
}

function lpx_set_int_parm(lp, parm, val){
    /* set (change) integer control parameter */
    var cps = access_parms(lp);
    switch (parm)
    {  case LPX_K_MSGLEV:
        if (!(0 <= val && val <= 3))
            xerror("lpx_set_int_parm: MSGLEV = " + val + "; invalid value");
        cps.msg_lev = val;
        break;
        case LPX_K_SCALE:
            if (!(0 <= val && val <= 3))
                xerror("lpx_set_int_parm: SCALE = " + val + "; invalid value");
            cps.scale = val;
            break;
        case LPX_K_DUAL:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: DUAL = " + val + "; invalid value");
            cps.dual = val;
            break;
        case LPX_K_PRICE:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: PRICE = " + val + "; invalid value");
            cps.price = val;
            break;
        case LPX_K_ROUND:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: ROUND = " + val + "; invalid value");
            cps.round = val;
            break;
        case LPX_K_ITLIM:
            cps.it_lim = val;
            break;
        case LPX_K_ITCNT:
            lp.it_cnt = val;
            break;
        case LPX_K_OUTFRQ:
            if (!(val > 0))
                xerror("lpx_set_int_parm: OUTFRQ = " + val + "; invalid value");
            cps.out_frq = val;
            break;
        case LPX_K_BRANCH:
            if (!(val == 0 || val == 1 || val == 2 || val == 3))
                xerror("lpx_set_int_parm: BRANCH = " + val + "; invalid value");
            cps.branch = val;
            break;
        case LPX_K_BTRACK:
            if (!(val == 0 || val == 1 || val == 2 || val == 3))
                xerror("lpx_set_int_parm: BTRACK = " + val + "; invalid value");
            cps.btrack = val;
            break;
        case LPX_K_MPSINFO:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: MPSINFO = " + val + "; invalid value");
            cps.mps_info = val;
            break;
        case LPX_K_MPSOBJ:
            if (!(val == 0 || val == 1 || val == 2))
                xerror("lpx_set_int_parm: MPSOBJ = " + val + "; invalid value");
            cps.mps_obj = val;
            break;
        case LPX_K_MPSORIG:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: MPSORIG = " + val + "; invalid value");
            cps.mps_orig = val;
            break;
        case LPX_K_MPSWIDE:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: MPSWIDE = " + val + "; invalid value");
            cps.mps_wide = val;
            break;
        case LPX_K_MPSFREE:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: MPSFREE = " + val + "; invalid value");
            cps.mps_free = val;
            break;
        case LPX_K_MPSSKIP:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: MPSSKIP = " + val + "; invalid value");
            cps.mps_skip = val;
            break;
        case LPX_K_LPTORIG:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: LPTORIG = " + val + "; invalid value");
            cps.lpt_orig = val;
            break;
        case LPX_K_PRESOL:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: PRESOL = " + val + "; invalid value");
            cps.presol = val;
            break;
        case LPX_K_BINARIZE:
            if (!(val == 0 || val == 1))
                xerror("lpx_set_int_parm: BINARIZE = " + val + "; invalid value");
            cps.binarize = val;
            break;
        case LPX_K_USECUTS:
            if (val & ~LPX_C_ALL)
                xerror("lpx_set_int_parm: USECUTS = " + val + "; invalid value");
            cps.use_cuts = val;
            break;
        case LPX_K_BFTYPE:
        {   parm = {};
            glp_get_bfcp(lp, parm);
            switch (val)
            {  case 1:
                parm.type = GLP_BF_FT; break;
                case 2:
                    parm.type = GLP_BF_BG; break;
                case 3:
                    parm.type = GLP_BF_GR; break;
                default:
                    xerror("lpx_set_int_parm: BFTYPE = " + val + "; invalid value");
            }
            glp_set_bfcp(lp, parm);
        }
            break;
        default:
            xerror("lpx_set_int_parm: parm = " + parm + "; invalid parameter");
    }
}

function lpx_get_int_parm(lp, parm){
    /* query integer control parameter */
    var cps = access_parms(lp);
    var val = 0;
    switch (parm)
    {  case LPX_K_MSGLEV:
        val = cps.msg_lev; break;
        case LPX_K_SCALE:
            val = cps.scale; break;
        case LPX_K_DUAL:
            val = cps.dual; break;
        case LPX_K_PRICE:
            val = cps.price; break;
        case LPX_K_ROUND:
            val = cps.round; break;
        case LPX_K_ITLIM:
            val = cps.it_lim; break;
        case LPX_K_ITCNT:
            val = lp.it_cnt; break;
        case LPX_K_OUTFRQ:
            val = cps.out_frq; break;
        case LPX_K_BRANCH:
            val = cps.branch; break;
        case LPX_K_BTRACK:
            val = cps.btrack; break;
        case LPX_K_MPSINFO:
            val = cps.mps_info; break;
        case LPX_K_MPSOBJ:
            val = cps.mps_obj; break;
        case LPX_K_MPSORIG:
            val = cps.mps_orig; break;
        case LPX_K_MPSWIDE:
            val = cps.mps_wide; break;
        case LPX_K_MPSFREE:
            val = cps.mps_free; break;
        case LPX_K_MPSSKIP:
            val = cps.mps_skip; break;
        case LPX_K_LPTORIG:
            val = cps.lpt_orig; break;
        case LPX_K_PRESOL:
            val = cps.presol; break;
        case LPX_K_BINARIZE:
            val = cps.binarize; break;
        case LPX_K_USECUTS:
            val = cps.use_cuts; break;
        case LPX_K_BFTYPE:
        {   parm = {};
            glp_get_bfcp(lp, parm);
            switch (parm.type)
            {  case GLP_BF_FT:
                val = 1; break;
                case GLP_BF_BG:
                    val = 2; break;
                case GLP_BF_GR:
                    val = 3; break;
                default:
                    xassert(lp != lp);
            }
        }
            break;
        default:
            xerror("lpx_get_int_parm: parm = " + parm + "; invalid parameter");
    }
    return val;
}

function lpx_set_real_parm(lp, parm, val){
    /* set (change) real control parameter */
    var cps = access_parms(lp);
    switch (parm)
    {  case LPX_K_RELAX:
        if (!(0.0 <= val && val <= 1.0))
            xerror("lpx_set_real_parm: RELAX = " + val + "; invalid value");
        cps.relax = val;
        break;
        case LPX_K_TOLBND:
            if (!(DBL_EPSILON <= val && val <= 0.001))
                xerror("lpx_set_real_parm: TOLBND = " + val + "; invalid value");
            cps.tol_bnd = val;
            break;
        case LPX_K_TOLDJ:
            if (!(DBL_EPSILON <= val && val <= 0.001))
                xerror("lpx_set_real_parm: TOLDJ = " + val + "; invalid value");
            cps.tol_dj = val;
            break;
        case LPX_K_TOLPIV:
            if (!(DBL_EPSILON <= val && val <= 0.001))
                xerror("lpx_set_real_parm: TOLPIV = " + val + "; invalid value");
            cps.tol_piv = val;
            break;
        case LPX_K_OBJLL:
            cps.obj_ll = val;
            break;
        case LPX_K_OBJUL:
            cps.obj_ul = val;
            break;
        case LPX_K_TMLIM:
            cps.tm_lim = val;
            break;
        case LPX_K_OUTDLY:
            cps.out_dly = val;
            break;
        case LPX_K_TOLINT:
            if (!(DBL_EPSILON <= val && val <= 0.001))
                xerror("lpx_set_real_parm: TOLINT = " + val + "; invalid value");
            cps.tol_int = val;
            break;
        case LPX_K_TOLOBJ:
            if (!(DBL_EPSILON <= val && val <= 0.001))
                xerror("lpx_set_real_parm: TOLOBJ = " + val + "; invalid value");
            cps.tol_obj = val;
            break;
        case LPX_K_MIPGAP:
            if (val < 0.0)
                xerror("lpx_set_real_parm: MIPGAP = " + val + "; invalid value");
            cps.mip_gap = val;
            break;
        default:
            xerror("lpx_set_real_parm: parm = " + parm + "; invalid parameter");
    }
}

function lpx_get_real_parm(lp, parm){
    /* query real control parameter */
    var cps = access_parms(lp);
    var val = 0.0;
    switch (parm)
    {  case LPX_K_RELAX:
        val = cps.relax;
        break;
        case LPX_K_TOLBND:
            val = cps.tol_bnd;
            break;
        case LPX_K_TOLDJ:
            val = cps.tol_dj;
            break;
        case LPX_K_TOLPIV:
            val = cps.tol_piv;
            break;
        case LPX_K_OBJLL:
            val = cps.obj_ll;
            break;
        case LPX_K_OBJUL:
            val = cps.obj_ul;
            break;
        case LPX_K_TMLIM:
            val = cps.tm_lim;
            break;
        case LPX_K_OUTDLY:
            val = cps.out_dly;
            break;
        case LPX_K_TOLINT:
            val = cps.tol_int;
            break;
        case LPX_K_TOLOBJ:
            val = cps.tol_obj;
            break;
        case LPX_K_MIPGAP:
            val = cps.mip_gap;
            break;
        default:
            xerror("lpx_get_real_parm: parm = " + parm + "; invalid parameter");
    }
    return val;
}

function lpx_read_mps(fname){
    /* read problem data in fixed MPS format */
    var lp = lpx_create_prob();
    if (glp_read_mps(lp, GLP_MPS_DECK, null, fname)){
        lpx_delete_prob(lp); lp = null;
    }
    return lp;
}

function lpx_write_mps(lp, fname){
    /* write problem data in fixed MPS format */
    return glp_write_mps(lp, GLP_MPS_DECK, null, fname);
}

function lpx_read_bas(lp, fname){
    /* read LP basis in fixed MPS format */
    xassert(lp == lp);
    xassert(fname == fname);
    xerror("lpx_read_bas: operation not supported");
    return 0;
}

function lpx_write_bas(lp, fname){
    /* write LP basis in fixed MPS format */
    xassert(lp == lp);
    xassert(fname == fname);
    xerror("lpx_write_bas: operation not supported");
    return 0;
}

function lpx_read_freemps(fname){
    /* read problem data in free MPS format */
    var lp = lpx_create_prob();
    if (glp_read_mps(lp, GLP_MPS_FILE, null, fname)){
        lpx_delete_prob(lp); lp = null;
    }
    return lp;
}

function lpx_write_freemps(lp, fname){
    /* write problem data in free MPS format */
    return glp_write_mps(lp, GLP_MPS_FILE, null, fname);
}

function lpx_read_cpxlp(fname){
    /* read problem data in CPLEX LP format */
    var lp = lpx_create_prob();
    if (glp_read_lp(lp, null, fname)){
        lpx_delete_prob(lp); lp = null;
    }
    return lp;
}

function lpx_write_cpxlp(lp, fname){
    /* write problem data in CPLEX LP format */
    return glp_write_lp(lp, null, fname);
}

function lpx_read_model(model, data, output){
    /* read LP/MIP model written in GNU MathProg language */
    var lp = null;
    /* allocate the translator workspace */
    var tran = glp_mpl_alloc_wksp();
    /* read model section and optional data section */
    if (glp_mpl_read_model(tran, model, data != null)) return done();
    /* read separate data section, if required */
    if (data != null)
        if (glp_mpl_read_data(tran, data)) return done();
    /* generate the model */
    if (glp_mpl_generate(tran, output)) return done();
    /* build the problem instance from the model */
    lp = glp_create_prob();
    glp_mpl_build_prob(tran, lp);
    function done(){
        /* free the translator workspace */
        glp_mpl_free_wksp(tran);
        /* bring the problem object to the calling program */
        return lp;
    }
    return done();
}

function lpx_print_prob(lp, fname){
    /* write problem data in plain text format */
    return glp_write_lp(lp, null, fname);
}

function lpx_print_sol(lp, fname){
    /* write LP problem solution in printable format */
    return glp_print_sol(lp, fname);
}

function lpx_print_sens_bnds(lp, fname){
    /* write bounds sensitivity information */
    if (glp_get_status(lp) == GLP_OPT && !glp_bf_exists(lp))
        glp_factorize(lp);
    return glp_print_ranges(lp, 0, null, 0, fname);
}

function lpx_print_ips(lp, fname){
    /* write interior point solution in printable format */
    return glp_print_ipt(lp, fname);
}

function lpx_print_mip(lp, fname){
    /* write MIP problem solution in printable format */
    return glp_print_mip(lp, fname);
}

function lpx_is_b_avail(lp){
    /* check if LP basis is available */
    return glp_bf_exists(lp);
}

function lpx_main(argc, argv)
{     /* stand-alone LP/MIP solver */
    return glp_main(argc, argv);
}
