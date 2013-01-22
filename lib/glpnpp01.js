
function npp_create_wksp(){
    /* create LP/MIP preprocessor workspace */
    var npp = {};
    npp.orig_dir = 0;
    npp.orig_m = npp.orig_n = npp.orig_nnz = 0;
    npp.name = npp.obj = null;
    npp.c0 = 0.0;
    npp.nrows = npp.ncols = 0;
    npp.r_head = npp.r_tail = null;
    npp.c_head = npp.c_tail = null;
    npp.top = null;
    npp.m = npp.n = npp.nnz = 0;
    npp.row_ref = npp.col_ref = null;
    npp.sol = npp.scaling = 0;
    npp.p_stat = npp.d_stat = npp.t_stat = npp.i_stat = 0;
    npp.r_stat = null;
    /*npp.r_prim =*/ npp.r_pi = null;
    npp.c_stat = null;
    npp.c_value = /*npp.c_dual =*/ null;
    return npp;
}

function npp_insert_row(npp, row, where){
    /* insert row to the row list */
    if (where == 0)
    {  /* insert row to the beginning of the row list */
        row.prev = null;
        row.next = npp.r_head;
        if (row.next == null)
            npp.r_tail = row;
        else
            row.next.prev = row;
        npp.r_head = row;
    }
    else
    {  /* insert row to the end of the row list */
        row.prev = npp.r_tail;
        row.next = null;
        if (row.prev == null)
            npp.r_head = row;
        else
            row.prev.next = row;
        npp.r_tail = row;
    }
}

function npp_remove_row(npp, row){
    /* remove row from the row list */
    if (row.prev == null)
        npp.r_head = row.next;
    else
        row.prev.next = row.next;
    if (row.next == null)
        npp.r_tail = row.prev;
    else
        row.next.prev = row.prev;
}

function npp_activate_row(npp, row){
    /* make row active */
    if (!row.temp)
    {  row.temp = 1;
        /* move the row to the beginning of the row list */
        npp_remove_row(npp, row);
        npp_insert_row(npp, row, 0);
    }
}

function npp_deactivate_row(npp, row){
    /* make row inactive */
    if (row.temp)
    {  row.temp = 0;
        /* move the row to the end of the row list */
        npp_remove_row(npp, row);
        npp_insert_row(npp, row, 1);
    }
}

function npp_insert_col(npp, col, where){
    /* insert column to the column list */
    if (where == 0)
    {  /* insert column to the beginning of the column list */
        col.prev = null;
        col.next = npp.c_head;
        if (col.next == null)
            npp.c_tail = col;
        else
            col.next.prev = col;
        npp.c_head = col;
    }
    else
    {  /* insert column to the end of the column list */
        col.prev = npp.c_tail;
        col.next = null;
        if (col.prev == null)
            npp.c_head = col;
        else
            col.prev.next = col;
        npp.c_tail = col;
    }
}

function npp_remove_col(npp, col){
    /* remove column from the column list */
    if (col.prev == null)
        npp.c_head = col.next;
    else
        col.prev.next = col.next;
    if (col.next == null)
        npp.c_tail = col.prev;
    else
        col.next.prev = col.prev;
}

function npp_activate_col(npp, col){
    /* make column active */
    if (!col.temp)
    {  col.temp = 1;
        /* move the column to the beginning of the column list */
        npp_remove_col(npp, col);
        npp_insert_col(npp, col, 0);
    }
}

function npp_deactivate_col(npp, col){
    /* make column inactive */
    if (col.temp)
    {  col.temp = 0;
        /* move the column to the end of the column list */
        npp_remove_col(npp, col);
        npp_insert_col(npp, col, 1);
    }
}

function npp_add_row(npp){
    /* add new row to the current problem */
    var row = {};
    row.i = ++(npp.nrows);
    row.name = null;
    row.lb = -DBL_MAX;
    row.ub = +DBL_MAX;
    row.ptr = null;
    row.temp = 0;
    npp_insert_row(npp, row, 1);
    return row;
}

function npp_add_col(npp){
    /* add new column to the current problem */
    var col = {};
    col.j = ++(npp.ncols);
    col.name = null;
    col.is_int = 0;
    col.lb = col.ub = col.coef = 0.0;
    col.ptr = null;
    col.temp = 0;
    col.ll = {};
    col.uu = {};
    npp_insert_col(npp, col, 1);
    return col;
}

function npp_add_aij(row, col, val){
    /* add new element to the constraint matrix */
    var aij = {};
    aij.row = row;
    aij.col = col;
    aij.val = val;
    aij.r_prev = null;
    aij.r_next = row.ptr;
    aij.c_prev = null;
    aij.c_next = col.ptr;
    if (aij.r_next != null)
        aij.r_next.r_prev = aij;
    if (aij.c_next != null)
        aij.c_next.c_prev = aij;
    row.ptr = col.ptr = aij;
    return aij;
}

function npp_row_nnz(row){
    /* count number of non-zero coefficients in row */
    var nnz = 0;
    for (var aij = row.ptr; aij != null; aij = aij.r_next)
        nnz++;
    return nnz;
}

function npp_col_nnz(col){
    /* count number of non-zero coefficients in column */
    var nnz = 0;
    for (var aij = col.ptr; aij != null; aij = aij.c_next)
        nnz++;
    return nnz;
}

function npp_push_tse(npp, func){
    /* push new entry to the transformation stack */
    var tse;
    tse = {};
    tse.func = func;
    tse.info = {};
    tse.link = npp.top;
    npp.top = tse;
    return tse.info;
}

function npp_erase_row(row){
    /* erase row content to make it empty */
    var aij;
    while (row.ptr != null)
    {  aij = row.ptr;
        row.ptr = aij.r_next;
        if (aij.c_prev == null)
            aij.col.ptr = aij.c_next;
        else
            aij.c_prev.c_next = aij.c_next;
        if (aij.c_next != null)
            aij.c_next.c_prev = aij.c_prev;
    }
}

function npp_del_row(npp, row){
    /* remove row from the current problem */
    npp_erase_row(row);
    npp_remove_row(npp, row);
}

function npp_del_col(npp, col){
    /* remove column from the current problem */
    var aij;
    while (col.ptr != null)
    {  aij = col.ptr;
        col.ptr = aij.c_next;
        if (aij.r_prev == null)
            aij.row.ptr = aij.r_next;
        else
            aij.r_prev.r_next = aij.r_next;
        if (aij.r_next != null)
            aij.r_next.r_prev = aij.r_prev;
    }
    npp_remove_col(npp, col);
}

function npp_del_aij(aij){
    /* remove element from the constraint matrix */
    if (aij.r_prev == null)
        aij.row.ptr = aij.r_next;
    else
        aij.r_prev.r_next = aij.r_next;
    if (aij.r_next != null)
        aij.r_next.r_prev = aij.r_prev;
    if (aij.c_prev == null)
        aij.col.ptr = aij.c_next;
    else
        aij.c_prev.c_next = aij.c_next;
    if (aij.c_next != null)
        aij.c_next.c_prev = aij.c_prev;
}

function npp_load_prob(npp, orig, names, sol, scaling){
    /* load original problem into the preprocessor workspace */
    var m = orig.m;
    var n = orig.n;
    var link;
    var i, j;
    var dir;
    xassert(names == GLP_OFF || names == GLP_ON);
    xassert(sol == GLP_SOL || sol == GLP_IPT || sol == GLP_MIP);
    xassert(scaling == GLP_OFF || scaling == GLP_ON);
    if (sol == GLP_MIP) xassert(!scaling);
    npp.orig_dir = orig.dir;
    if (npp.orig_dir == GLP_MIN)
        dir = +1.0;
    else if (npp.orig_dir == GLP_MAX)
        dir = -1.0;
    else
        xassert(npp != npp);
    npp.orig_m = m;
    npp.orig_n = n;
    npp.orig_nnz = orig.nnz;
    if (names && orig.name != null)
        npp.name = orig.name;
    if (names && orig.obj != null)
        npp.obj = orig.obj;
    npp.c0 = dir * orig.c0;
    /* load rows */
    link = new Array(1+m);
    for (i = 1; i <= m; i++)
    {  var rrr = orig.row[i];
        var row;
        link[i] = row = npp_add_row(npp);
        xassert(row.i == i);
        if (names && rrr.name != null)
            row.name = rrr.name;
        if (!scaling)
        {  if (rrr.type == GLP_FR){
            row.lb = -DBL_MAX; row.ub = +DBL_MAX;
        }
        else if (rrr.type == GLP_LO){
            row.lb = rrr.lb; row.ub = +DBL_MAX;
        }
        else if (rrr.type == GLP_UP){
            row.lb = -DBL_MAX; row.ub = rrr.ub;
        }
        else if (rrr.type == GLP_DB){
            row.lb = rrr.lb; row.ub = rrr.ub;
        }
        else if (rrr.type == GLP_FX)
            row.lb = row.ub = rrr.lb;
        else
            xassert(rrr != rrr);
        }
        else
        {  var rii = rrr.rii;
            if (rrr.type == GLP_FR){
                row.lb = -DBL_MAX; row.ub = +DBL_MAX;
            }
            else if (rrr.type == GLP_LO){
                row.lb = rrr.lb * rii; row.ub = +DBL_MAX;
            }
            else if (rrr.type == GLP_UP){
                row.lb = -DBL_MAX; row.ub = rrr.ub * rii;
            }
            else if (rrr.type == GLP_DB){
                row.lb = rrr.lb * rii; row.ub = rrr.ub * rii;
            }
            else if (rrr.type == GLP_FX)
                row.lb = row.ub = rrr.lb * rii;
            else
                xassert(rrr != rrr);
        }
    }
    /* load columns and constraint coefficients */
    for (j = 1; j <= n; j++)
    {  var ccc = orig.col[j];
        var aaa;
        var col;
        col = npp_add_col(npp);
        xassert(col.j == j);
        if (names && ccc.name != null)
            col.name =  ccc.name;
        if (sol == GLP_MIP)
            col.is_int = Number(ccc.kind == GLP_IV);
        if (!scaling){
            if (ccc.type == GLP_FR){
                col.lb = -DBL_MAX; col.ub = +DBL_MAX;
            }
            else if (ccc.type == GLP_LO){
                col.lb = ccc.lb; col.ub = +DBL_MAX;
            }
            else if (ccc.type == GLP_UP){
                col.lb = -DBL_MAX; col.ub = ccc.ub;
            }
            else if (ccc.type == GLP_DB){
                col.lb = ccc.lb; col.ub = ccc.ub;
            }
            else if (ccc.type == GLP_FX)
                col.lb = col.ub = ccc.lb;
            else
                xassert(ccc != ccc);
            col.coef = dir * ccc.coef;
            for (aaa = ccc.ptr; aaa != null; aaa = aaa.c_next)
                npp_add_aij(link[aaa.row.i], col, aaa.val);
        }
        else
        {  var sjj = ccc.sjj;
            if (ccc.type == GLP_FR){
                col.lb = -DBL_MAX; col.ub = +DBL_MAX;
            }
            else if (ccc.type == GLP_LO){
                col.lb = ccc.lb / sjj; col.ub = +DBL_MAX;
            }
            else if (ccc.type == GLP_UP){
                col.lb = -DBL_MAX; col.ub = ccc.ub / sjj;
            }
            else if (ccc.type == GLP_DB){
                col.lb = ccc.lb / sjj; col.ub = ccc.ub / sjj;
            }
            else if (ccc.type == GLP_FX)
                col.lb = col.ub = ccc.lb / sjj;
            else
                xassert(ccc != ccc);
            col.coef = dir * ccc.coef * sjj;
            for (aaa = ccc.ptr; aaa != null; aaa = aaa.c_next)
                npp_add_aij(link[aaa.row.i], col,
                    aaa.row.rii * aaa.val * sjj);
        }
    }
    /* keep solution indicator and scaling option */
    npp.sol = sol;
    npp.scaling = scaling;
}

function npp_build_prob(npp, prob){
    /* build resultant (preprocessed) problem */
    var row;
    var col;
    var aij;
    var i, j, type, len, ind;
    var dir, val;
    glp_erase_prob(prob);
    glp_set_prob_name(prob, npp.name);
    glp_set_obj_name(prob, npp.obj);
    glp_set_obj_dir(prob, npp.orig_dir);
    if (npp.orig_dir == GLP_MIN)
        dir = +1.0;
    else if (npp.orig_dir == GLP_MAX)
        dir = -1.0;
    else
        xassert(npp != npp);
    glp_set_obj_coef(prob, 0, dir * npp.c0);
    /* build rows */
    for (row = npp.r_head; row != null; row = row.next)
    {  row.temp = i = glp_add_rows(prob, 1);
        glp_set_row_name(prob, i, row.name);
        if (row.lb == -DBL_MAX && row.ub == +DBL_MAX)
            type = GLP_FR;
        else if (row.ub == +DBL_MAX)
            type = GLP_LO;
        else if (row.lb == -DBL_MAX)
            type = GLP_UP;
        else if (row.lb != row.ub)
            type = GLP_DB;
        else
            type = GLP_FX;
        glp_set_row_bnds(prob, i, type, row.lb, row.ub);
    }
    /* build columns and the constraint matrix */
    ind = new Int32Array(1+prob.m);
    val = new Float64Array(1+prob.m);
    for (col = npp.c_head; col != null; col = col.next)
    {  j = glp_add_cols(prob, 1);
        glp_set_col_name(prob, j, col.name);
        glp_set_col_kind(prob, j, col.is_int ? GLP_IV : GLP_CV);
        if (col.lb == -DBL_MAX && col.ub == +DBL_MAX)
            type = GLP_FR;
        else if (col.ub == +DBL_MAX)
            type = GLP_LO;
        else if (col.lb == -DBL_MAX)
            type = GLP_UP;
        else if (col.lb != col.ub)
            type = GLP_DB;
        else
            type = GLP_FX;
        glp_set_col_bnds(prob, j, type, col.lb, col.ub);
        glp_set_obj_coef(prob, j, dir * col.coef);
        len = 0;
        for (aij = col.ptr; aij != null; aij = aij.c_next)
        {  len++;
            ind[len] = aij.row.temp;
            val[len] = aij.val;
        }
        glp_set_mat_col(prob, j, len, ind, val);
    }
    /* resultant problem has been built */
    npp.m = prob.m;
    npp.n = prob.n;
    npp.nnz = prob.nnz;
    npp.row_ref = new Int32Array(1+npp.m);
    npp.col_ref = new Int32Array(1+npp.n);
    for (row = npp.r_head, i = 0; row != null; row = row.next)
        npp.row_ref[++i] = row.i;
    for (col = npp.c_head, j = 0; col != null; col = col.next)
        npp.col_ref[++j] = col.j;
    /* transformed problem segment is no longer needed */
    npp.name = npp.obj = null;
    npp.c0 = 0.0;
    npp.r_head = npp.r_tail = null;
    npp.c_head = npp.c_tail = null;
}

function npp_postprocess(npp, prob){
    /* postprocess solution from the resultant problem */
    var row;
    var col;
    var tse;
    var i, j, k;
    var dir;
    xassert(npp.orig_dir == prob.dir);
    if (npp.orig_dir == GLP_MIN)
        dir = +1.0;
    else if (npp.orig_dir == GLP_MAX)
        dir = -1.0;
    else
        xassert(npp != npp);
    xassert(npp.m == prob.m);
    xassert(npp.n == prob.n);
    xassert(npp.nnz == prob.nnz);
    /* copy solution status */
    if (npp.sol == GLP_SOL)
    {  npp.p_stat = prob.pbs_stat;
        npp.d_stat = prob.dbs_stat;
    }
    else if (npp.sol == GLP_IPT)
        npp.t_stat = prob.ipt_stat;
    else if (npp.sol == GLP_MIP)
        npp.i_stat = prob.mip_stat;
    else
        xassert(npp != npp);
    /* allocate solution arrays */
    if (npp.sol == GLP_SOL)
    {  if (npp.r_stat == null)
        npp.r_stat = new Int8Array(1+npp.nrows);
        for (i = 1; i <= npp.nrows; i++)
            npp.r_stat[i] = 0;
        if (npp.c_stat == null)
            npp.c_stat = new Int8Array(1+npp.ncols);
        for (j = 1; j <= npp.ncols; j++)
            npp.c_stat[j] = 0;
    }
    if (npp.c_value == null)
        npp.c_value = new Float64Array(1+npp.ncols);
    for (j = 1; j <= npp.ncols; j++)
        npp.c_value[j] = DBL_MAX;
    if (npp.sol != GLP_MIP)
    {  if (npp.r_pi == null)
        npp.r_pi = new Float64Array(1+npp.nrows);
        for (i = 1; i <= npp.nrows; i++)
            npp.r_pi[i] = DBL_MAX;
    }
    /* copy solution components from the resultant problem */
    if (npp.sol == GLP_SOL)
    {  for (i = 1; i <= npp.m; i++)
    {  row = prob.row[i];
        k = npp.row_ref[i];
        npp.r_stat[k] = row.stat;
        /*npp.r_prim[k] = row.prim;*/
        npp.r_pi[k] = dir * row.dual;
    }
        for (j = 1; j <= npp.n; j++)
        {  col = prob.col[j];
            k = npp.col_ref[j];
            npp.c_stat[k] = col.stat;
            npp.c_value[k] = col.prim;
            /*npp.c_dual[k] = dir * col.dual;*/
        }
    }
    else if (npp.sol == GLP_IPT)
    {  for (i = 1; i <= npp.m; i++)
    {  row = prob.row[i];
        k = npp.row_ref[i];
        /*npp.r_prim[k] = row.pval;*/
        npp.r_pi[k] = dir * row.dval;
    }
        for (j = 1; j <= npp.n; j++)
        {  col = prob.col[j];
            k = npp.col_ref[j];
            npp.c_value[k] = col.pval;
            /*npp.c_dual[k] = dir * col.dval;*/
        }
    }
    else if (npp.sol == GLP_MIP)
    {
        for (j = 1; j <= npp.n; j++)
        {  col = prob.col[j];
            k = npp.col_ref[j];
            npp.c_value[k] = col.mipx;
        }
    }
    else
        xassert(npp != npp);
    /* perform postprocessing to construct solution to the original
     problem */
    for (tse = npp.top; tse != null; tse = tse.link)
    {  xassert(tse.func != null);
        xassert(tse.func(npp, tse.info) == 0);
    }
}

function npp_unload_sol(npp, orig){
    /* store solution to the original problem */
    var row;
    var col;
    var i, j;
    var dir;
    var aij, temp;
    xassert(npp.orig_dir == orig.dir);
    if (npp.orig_dir == GLP_MIN)
        dir = +1.0;
    else if (npp.orig_dir == GLP_MAX)
        dir = -1.0;
    else
        xassert(npp != npp);
    xassert(npp.orig_m == orig.m);
    xassert(npp.orig_n == orig.n);
    xassert(npp.orig_nnz == orig.nnz);
    if (npp.sol == GLP_SOL)
    {  /* store basic solution */
        orig.valid = 0;
        orig.pbs_stat = npp.p_stat;
        orig.dbs_stat = npp.d_stat;
        orig.obj_val = orig.c0;
        orig.some = 0;
        for (i = 1; i <= orig.m; i++)
        {  row = orig.row[i];
            row.stat = npp.r_stat[i];
            if (!npp.scaling)
            {  /*row.prim = npp.r_prim[i];*/
                row.dual = dir * npp.r_pi[i];
            }
            else
            {  /*row.prim = npp.r_prim[i] / row.rii;*/
                row.dual = dir * npp.r_pi[i] * row.rii;
            }
            if (row.stat == GLP_BS)
                row.dual = 0.0;
            else if (row.stat == GLP_NL)
            {  xassert(row.type == GLP_LO || row.type == GLP_DB);
                row.prim = row.lb;
            }
            else if (row.stat == GLP_NU)
            {  xassert(row.type == GLP_UP || row.type == GLP_DB);
                row.prim = row.ub;
            }
            else if (row.stat == GLP_NF)
            {  xassert(row.type == GLP_FR);
                row.prim = 0.0;
            }
            else if (row.stat == GLP_NS)
            {  xassert(row.type == GLP_FX);
                row.prim = row.lb;
            }
            else
                xassert(row != row);
        }
        for (j = 1; j <= orig.n; j++)
        {  col = orig.col[j];
            col.stat = npp.c_stat[j];
            if (!npp.scaling)
            {  col.prim = npp.c_value[j];
                /*col.dual = dir * npp.c_dual[j];*/
            }
            else
            {  col.prim = npp.c_value[j] * col.sjj;
                /*col.dual = dir * npp.c_dual[j] / col.sjj;*/
            }
            if (col.stat == GLP_BS)
                col.dual = 0.0;
            else if (col.stat == GLP_NL)
            {  xassert(col.type == GLP_LO || col.type == GLP_DB);
                col.prim = col.lb;
            }
            else if (col.stat == GLP_NU)
            {  xassert(col.type == GLP_UP || col.type == GLP_DB);
                col.prim = col.ub;
            }
            else if (col.stat == GLP_NF)
            {  xassert(col.type == GLP_FR);
                col.prim = 0.0;
            }
            else if (col.stat == GLP_NS)
            {  xassert(col.type == GLP_FX);
                col.prim = col.lb;
            }
            else
                xassert(col != col);
            orig.obj_val += col.coef * col.prim;
        }
        /* compute primal values of inactive rows */
        for (i = 1; i <= orig.m; i++)
        {  row = orig.row[i];
            if (row.stat == GLP_BS)
            {
                temp = 0.0;
                for (aij = row.ptr; aij != null; aij = aij.r_next)
                    temp += aij.val * aij.col.prim;
                row.prim = temp;
            }
        }
        /* compute reduced costs of active columns */
        for (j = 1; j <= orig.n; j++)
        {  col = orig.col[j];
            if (col.stat != GLP_BS)
            {
                temp = col.coef;
                for (aij = col.ptr; aij != null; aij = aij.c_next)
                    temp -= aij.val * aij.row.dual;
                col.dual = temp;
            }
        }
    }
    else if (npp.sol == GLP_IPT)
    {  /* store interior-point solution */
        orig.ipt_stat = npp.t_stat;
        orig.ipt_obj = orig.c0;
        for (i = 1; i <= orig.m; i++)
        {  row = orig.row[i];
            if (!npp.scaling)
            {  /*row.pval = npp.r_prim[i];*/
                row.dval = dir * npp.r_pi[i];
            }
            else
            {  /*row.pval = npp.r_prim[i] / row.rii;*/
                row.dval = dir * npp.r_pi[i] * row.rii;
            }
        }
        for (j = 1; j <= orig.n; j++)
        {  col = orig.col[j];
            if (!npp.scaling)
            {  col.pval = npp.c_value[j];
                /*col.dval = dir * npp.c_dual[j];*/
            }
            else
            {  col.pval = npp.c_value[j] * col.sjj;
                /*col.dval = dir * npp.c_dual[j] / col.sjj;*/
            }
            orig.ipt_obj += col.coef * col.pval;
        }
        /* compute row primal values */
        for (i = 1; i <= orig.m; i++)
        {  row = orig.row[i];
            {
                temp = 0.0;
                for (aij = row.ptr; aij != null; aij = aij.r_next)
                    temp += aij.val * aij.col.pval;
                row.pval = temp;
            }
        }
        /* compute column dual values */
        for (j = 1; j <= orig.n; j++)
        {  col = orig.col[j];
            {
                temp = col.coef;
                for (aij = col.ptr; aij != null; aij = aij.c_next)
                    temp -= aij.val * aij.row.dval;
                col.dval = temp;
            }
        }
    }
    else if (npp.sol == GLP_MIP)
    {  /* store MIP solution */
        xassert(!npp.scaling);
        orig.mip_stat = npp.i_stat;
        orig.mip_obj = orig.c0;
        for (j = 1; j <= orig.n; j++)
        {  col = orig.col[j];
            col.mipx = npp.c_value[j];
            if (col.kind == GLP_IV)
                xassert(col.mipx == Math.floor(col.mipx));
            orig.mip_obj += col.coef * col.mipx;
        }
        /* compute row primal values */
        for (i = 1; i <= orig.m; i++)
        {  row = orig.row[i];
            {
                temp = 0.0;
                for (aij = row.ptr; aij != null; aij = aij.r_next)
                    temp += aij.val * aij.col.mipx;
                row.mipx = temp;
            }
        }
    }
    else
        xassert(npp != npp);
}

