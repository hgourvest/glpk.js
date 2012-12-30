var glp_get_prob_name = exports["glp_get_prob_name"] = function(lp){
    return lp.name;
};

var glp_get_obj_name = exports["glp_get_obj_name"] = function(lp){
    return lp.obj;
};

var glp_get_obj_dir = exports["glp_get_obj_dir"] = function(lp){
    return lp.dir;
};

var glp_get_num_rows = exports["glp_get_num_rows"] = function(lp){
    return lp.m;
};

var glp_get_num_cols = exports["glp_get_num_cols"] = function(lp){
    return lp.n;
};

var glp_get_row_name = exports["glp_get_row_name"] = function(lp, i){
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_row_name: i = " + i + "; row number out of range");
    return lp.row[i].name;
};

var glp_get_col_name = exports["glp_get_col_name"] = function(lp, j){
    if (!(1 <= j && j <= lp.n))
        xerror("glp_get_col_name: j = " + j + "; column number out of range");
    return lp.col[j].name;
};

var glp_get_row_type = exports["glp_get_row_type"] = function(lp, i){
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_row_type: i = " + i + "; row number out of range");
    return lp.row[i].type;
};

var glp_get_row_lb = exports["glp_get_row_lb"] = function(lp, i){
    var lb;
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_row_lb: i = " + i + "; row number out of range");
    switch (lp.row[i].type){
        case GLP_FR:
        case GLP_UP:
            lb = -DBL_MAX; break;
        case GLP_LO:
        case GLP_DB:
        case GLP_FX:
            lb = lp.row[i].lb; break;
        default:
            xassert(lp != lp);
    }
    return lb;
};

var glp_get_row_ub = exports["glp_get_row_ub"] = function(lp, i){
    var ub;
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_row_ub: i = " + i + "; row number out of range");
    switch (lp.row[i].type){
        case GLP_FR:
        case GLP_LO:
            ub = +DBL_MAX; break;
        case GLP_UP:
        case GLP_DB:
        case GLP_FX:
            ub = lp.row[i].ub; break;
        default:
            xassert(lp != lp);
    }
    return ub;
};

var glp_get_col_type = exports["glp_get_col_type"] = function(lp, j)
{     if (!(1 <= j && j <= lp.n))
    xerror("glp_get_col_type: j = " + j + "; column number out of range");
    return lp.col[j].type;
};

var glp_get_col_lb = exports["glp_get_col_lb"] = function(lp, j){
    var lb;
    if (!(1 <= j && j <= lp.n))
        xerror("glp_get_col_lb: j = " + j + "; column number out of range");
    switch (lp.col[j].type){
        case GLP_FR:
        case GLP_UP:
            lb = -DBL_MAX; break;
        case GLP_LO:
        case GLP_DB:
        case GLP_FX:
            lb = lp.col[j].lb; break;
        default:
            xassert(lp != lp);
    }
    return lb;
};

var glp_get_col_ub = exports["glp_get_col_ub"] = function(lp, j){
    var ub;
    if (!(1 <= j && j <= lp.n))
        xerror("glp_get_col_ub: j = " + j + "; column number out of range");
    switch (lp.col[j].type){
        case GLP_FR:
        case GLP_LO:
            ub = +DBL_MAX; break;
        case GLP_UP:
        case GLP_DB:
        case GLP_FX:
            ub = lp.col[j].ub; break;
        default:
            xassert(lp != lp);
    }
    return ub;
};

var glp_get_obj_coef = exports["glp_get_obj_coef"] = function(lp, j){
    if (!(0 <= j && j <= lp.n))
        xerror("glp_get_obj_coef: j = " + j + "; column number out of range");
    return j == 0 ? lp.c0 : lp.col[j].coef;
};

var glp_get_num_nz = exports["glp_get_num_nz"] = function (lp){
    return lp.nnz;
};

var glp_get_mat_row = exports["glp_get_mat_row"] = function(lp, i, ind, val){
    var aij;
    var len;
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_mat_row: i = " + i + "; row number out of range");
    len = 0;
    for (aij = lp.row[i].ptr; aij != null; aij = aij.r_next){
        len++;
        if (ind != null) ind[len] = aij.col.j;
        if (val != null) val[len] = aij.val;
    }
    xassert(len <= lp.n);
    return len;
};

var glp_get_mat_col = exports["glp_get_mat_col"] = function(lp, j, ind, val){
    var aij;
    var len;
    if (!(1 <= j && j <= lp.n))
        xerror("glp_get_mat_col: j = " + j + "; column number out of range");
    len = 0;
    for (aij = lp.col[j].ptr; aij != null; aij = aij.c_next){
        len++;
        if (ind != null) ind[len] = aij.row.i;
        if (val != null) val[len] = aij.val;
    }
    xassert(len <= lp.m);
    return len;
};

