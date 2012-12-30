function create_prob(lp){
    lp.magic = GLP_PROB_MAGIC;
    //lp.pool = dmp_create_pool();
    lp.parms = null;
    lp.tree = null;
    /* LP/MIP data */
    lp.name = null;
    lp.obj = null;
    lp.dir = GLP_MIN;
    lp.c0 = 0.0;
    lp.m_max = 100;
    lp.n_max = 200;
    lp.m = lp.n = 0;
    lp.nnz = 0;
    lp.row = new Array(1+lp.m_max);
    lp.col = new Array(1+lp.n_max);
    lp.r_tree = {};
    lp.c_tree = {};
    /* basis factorization */
    lp.valid = 0;
    lp.head = new Array(1+lp.m_max);
    lp.bfcp = null;
    lp.bfd = null;
    /* basic solution (LP) */
    lp.pbs_stat = lp.dbs_stat = GLP_UNDEF;
    lp.obj_val = 0.0;
    lp.it_cnt = 0;
    lp.some = 0;
    /* interior-point solution (LP) */
    lp.ipt_stat = GLP_UNDEF;
    lp.ipt_obj = 0.0;
    /* integer solution (MIP) */
    lp.mip_stat = GLP_UNDEF;
    lp.mip_obj = 0.0;
}

var glp_create_prob = exports["glp_create_prob"] = function(){
    var lp = {};
    create_prob(lp);
    return lp;
};

var glp_set_prob_name = exports["glp_set_prob_name"] = function(lp, name){
    var tree = lp.tree;
    if (tree != null && tree.reason != 0)
        xerror("glp_set_prob_name: operation not allowed");
    lp.name = name;
};

var glp_set_obj_name = exports["glp_set_obj_name"] = function(lp, name){
    var tree = lp.tree;
    if (tree != null && tree.reason != 0)
        xerror("glp_set_obj_name: operation not allowed");
    lp.obj = name;
};

var glp_set_obj_dir = exports["glp_set_obj_dir"] = function(lp, dir){
    var tree = lp.tree;
    if (tree != null && tree.reason != 0)
        xerror("glp_set_obj_dir: operation not allowed");
    if (!(dir == GLP_MIN || dir == GLP_MAX))
        xerror("glp_set_obj_dir: dir = " + dir  + "; invalid direction flag");
    lp.dir = dir;
};

var glp_add_rows = exports["glp_add_rows"] = function (lp, nrs){
    var tree = lp.tree;
    var row;
    /* determine new number of rows */
    if (nrs < 1)
        xerror("glp_add_rows: nrs = " + nrs + "; invalid number of rows");
    if (nrs > M_MAX - lp.m)
        xerror("glp_add_rows: nrs = " + nrs + "; too many rows");
    var m_new = lp.m + nrs;
    /* increase the room, if necessary */
    if (lp.m_max < m_new){
        while (lp.m_max < m_new){
            lp.m_max += lp.m_max;
            xassert(lp.m_max > 0);
        }
        lp.row.length = 1+lp.m_max;

        /* do not forget about the basis header */
        lp.head = new Array(1+lp.m_max);
    }
    /* add new rows to the end of the row list */
    for (var i = lp.m+1; i <= m_new; i++)
    {  /* create row descriptor */
        lp.row[i] = row = {};
        row.i = i;
        row.name = null;
        row.node = null;
        row.level = 0;
        row.origin = 0;
        row.klass = 0;
        if (tree != null)
        {  switch (tree.reason)
        {  case 0:
                break;
            case GLP_IROWGEN:
                xassert(tree.curr != null);
                row.level = tree.curr.level;
                row.origin = GLP_RF_LAZY;
                break;
            case GLP_ICUTGEN:
                xassert(tree.curr != null);
                row.level = tree.curr.level;
                row.origin = GLP_RF_CUT;
                break;
            default:
                xassert(tree != tree);
        }
        }
        row.type = GLP_FR;
        row.lb = row.ub = 0.0;
        row.ptr = null;
        row.rii = 1.0;
        row.stat = GLP_BS;
        row.bind = 0;
        row.prim = row.dual = 0.0;
        row.pval = row.dval = 0.0;
        row.mipx = 0.0;
    }
    /* set new number of rows */
    lp.m = m_new;
    /* invalidate the basis factorization */
    lp.valid = 0;
    if (tree != null && tree.reason != 0) tree.reopt = 1;
    /* return the ordinal number of the first row added */
    return m_new - nrs + 1;
};

var glp_add_cols = exports["glp_add_cols"] = function(lp, ncs){
    var tree = lp.tree;
    var col;
    if (tree != null && tree.reason != 0)
        xerror("glp_add_cols: operation not allowed");
    /* determine new number of columns */
    if (ncs < 1)
        xerror("glp_add_cols: ncs = " + ncs + "; invalid number of columns");
    if (ncs > N_MAX - lp.n)
        xerror("glp_add_cols: ncs = " + ncs + "; too many columns");
    var n_new = lp.n + ncs;
    /* increase the room, if necessary */
    if (lp.n_max < n_new)
    {
        while (lp.n_max < n_new)
        {  lp.n_max += lp.n_max;
            xassert(lp.n_max > 0);
        }
        lp.col.length = 1+lp.n_max;
    }
    /* add new columns to the end of the column list */
    for (var j = lp.n+1; j <= n_new; j++)
    {  /* create column descriptor */
        lp.col[j] = col = {};
        col.j = j;
        col.name = null;
        col.node = null;
        col.kind = GLP_CV;
        col.type = GLP_FX;
        col.lb = col.ub = 0.0;
        col.coef = 0.0;
        col.ptr = null;
        col.sjj = 1.0;
        col.stat = GLP_NS;
        col.bind = 0; /* the basis may remain valid */
        col.prim = col.dual = 0.0;
        col.pval = col.dval = 0.0;
        col.mipx = 0.0;
    }
    /* set new number of columns */
    lp.n = n_new;
    /* return the ordinal number of the first column added */
    return n_new - ncs + 1;
};

var glp_set_row_name = exports["glp_set_row_name"] = function(lp, i, name)
{
    var tree = lp.tree;
    if (!(1 <= i && i <= lp.m))
        xerror("glp_set_row_name: i = " + i + "; row number out of range");
    var row = lp.row[i];
    if (tree != null && tree.reason != 0){
        xassert(tree.curr != null);
        xassert(row.level == tree.curr.level);
    }
    if (row.name != null){
        delete(lp.r_tree[row.name]);
        row.name = null;
    }
    if (name != null){
        row.name = name;
        lp.r_tree[row.name] = row;
    }
};

var glp_set_col_name = exports["glp_set_col_name"] = function(lp, j, name){
    var tree = lp.tree;
    if (tree != null && tree.reason != 0)
        xerror("glp_set_col_name: operation not allowed");
    if (!(1 <= j && j <= lp.n))
        xerror("glp_set_col_name: j = " + j + "; column number out of range");
    var col = lp.col[j];

    if (col.name != null){
        delete(lp.c_tree[col.name]);
        col.name = null;
    }

    if (name != null){
        col.name = name;
        lp.c_tree[col.name] = col;
    }
};

var glp_set_row_bnds = exports["glp_set_row_bnds"] = function(lp, i, type, lb, ub){
    if (!(1 <= i && i <= lp.m))
        xerror("glp_set_row_bnds: i = " + i + "; row number out of range");
    var row = lp.row[i];
    row.type = type;
    switch (type){
        case GLP_FR:
            row.lb = row.ub = 0.0;
            if (row.stat != GLP_BS) row.stat = GLP_NF;
            break;
        case GLP_LO:
            row.lb = lb; row.ub = 0.0;
            if (row.stat != GLP_BS) row.stat = GLP_NL;
            break;
        case GLP_UP:
            row.lb = 0.0; row.ub = ub;
            if (row.stat != GLP_BS) row.stat = GLP_NU;
            break;
        case GLP_DB:
            row.lb = lb; row.ub = ub;
            if (!(row.stat == GLP_BS ||
                row.stat == GLP_NL || row.stat == GLP_NU))
                row.stat = (Math.abs(lb) <= Math.abs(ub) ? GLP_NL : GLP_NU);
            break;
        case GLP_FX:
            row.lb = row.ub = lb;
            if (row.stat != GLP_BS) row.stat = GLP_NS;
            break;
        default:
            xerror("glp_set_row_bnds: i = " + i + "; type = " + type + "; invalid row type");
    }
};

var glp_set_col_bnds = exports["glp_set_col_bnds"] = function(lp, j, type, lb, ub){
    if (!(1 <= j && j <= lp.n))
        xerror("glp_set_col_bnds: j = " + j + "; column number out of range");
    var col = lp.col[j];
    col.type = type;
    switch (type){
        case GLP_FR:
            col.lb = col.ub = 0.0;
            if (col.stat != GLP_BS) col.stat = GLP_NF;
            break;
        case GLP_LO:
            col.lb = lb; col.ub = 0.0;
            if (col.stat != GLP_BS) col.stat = GLP_NL;
            break;
        case GLP_UP:
            col.lb = 0.0; col.ub = ub;
            if (col.stat != GLP_BS) col.stat = GLP_NU;
            break;
        case GLP_DB:
            col.lb = lb; col.ub = ub;
            if (!(col.stat == GLP_BS ||
                col.stat == GLP_NL || col.stat == GLP_NU))
                col.stat = (Math.abs(lb) <= Math.abs(ub) ? GLP_NL : GLP_NU);
            break;
        case GLP_FX:
            col.lb = col.ub = lb;
            if (col.stat != GLP_BS) col.stat = GLP_NS;
            break;
        default:
            xerror("glp_set_col_bnds: j = " + j + "; type = " + type + "; invalid column type");
    }
};

var glp_set_obj_coef = exports["glp_set_obj_coef"] = function(lp, j, coef){
    var tree = lp.tree;
    if (tree != null && tree.reason != 0)
        xerror("glp_set_obj_coef: operation not allowed");
    if (!(0 <= j && j <= lp.n))
        xerror("glp_set_obj_coef: j = " + j + "; column number out of range");
    if (j == 0)
        lp.c0 = coef;
    else
        lp.col[j].coef = coef;
};

var glp_set_mat_row = exports["glp_set_mat_row"] = function(lp, i, len, ind, val){
    var tree = lp.tree;
    var col, aij, next, j, k;
    /* obtain pointer to i-th row */
    if (!(1 <= i && i <= lp.m))
        xerror("glp_set_mat_row: i = " + i + "; row number out of range");
    var row = lp.row[i];
    if (tree != null && tree.reason != 0){
        xassert(tree.curr != null);
        xassert(row.level == tree.curr.level);
    }
    /* remove all existing elements from i-th row */
    while (row.ptr != null){
        /* take next element in the row */
        aij = row.ptr;
        /* remove the element from the row list */
        row.ptr = aij.r_next;
        /* obtain pointer to corresponding column */
        col = aij.col;
        /* remove the element from the column list */
        if (aij.c_prev == null)
            col.ptr = aij.c_next;
        else
            aij.c_prev.c_next = aij.c_next;
        if (aij.c_next != null)
            aij.c_next.c_prev = aij.c_prev;
        /* return the element to the memory pool */
        lp.nnz--;
        /* if the corresponding column is basic, invalidate the basis
         factorization */
        if (col.stat == GLP_BS) lp.valid = 0;
    }
    /* store new contents of i-th row */
    if (!(0 <= len && len <= lp.n))
        xerror("glp_set_mat_row: i = " + i + "; len = " + len + "; invalid row length ");
    if (len > NNZ_MAX - lp.nnz)
        xerror("glp_set_mat_row: i = " + i + "; len = " + len + "; too many constraint coefficients");
    for (k = 1; k <= len; k++){
        /* take number j of corresponding column */
        j = ind[k];
        /* obtain pointer to j-th column */
        if (!(1 <= j && j <= lp.n))
            xerror("glp_set_mat_row: i = " + i + "; ind[" + k + "] = " + j + "; column index out of range");
        col = lp.col[j];
        /* if there is element with the same column index, it can only
         be found in the beginning of j-th column list */
        if (col.ptr != null && col.ptr.row.i == i)
            xerror("glp_set_mat_row: i = " + i + "; ind[" + k + "] = " + j + "; duplicate column indices not allowed");
        /* create new element */
        aij = {}; lp.nnz++;
        aij.row = row;
        aij.col = col;
        aij.val = val[k];
        /* add the new element to the beginning of i-th row and j-th
         column lists */
        aij.r_prev = null;
        aij.r_next = row.ptr;
        aij.c_prev = null;
        aij.c_next = col.ptr;
        if (aij.r_next != null) aij.r_next.r_prev = aij;
        if (aij.c_next != null) aij.c_next.c_prev = aij;
        row.ptr = col.ptr = aij;
        /* if the corresponding column is basic, invalidate the basis
         factorization */
        if (col.stat == GLP_BS && aij.val != 0.0) lp.valid = 0;
    }
    /* remove zero elements from i-th row */
    for (aij = row.ptr; aij != null; aij = next)
    {  next = aij.r_next;
        if (aij.val == 0.0)
        {  /* remove the element from the row list */
            if (aij.r_prev == null)
                row.ptr = next;
            else
                aij.r_prev.r_next = next;
            if (next != null)
                next.r_prev = aij.r_prev;
            /* remove the element from the column list */
            xassert(aij.c_prev == null);
            aij.col.ptr = aij.c_next;
            if (aij.c_next != null) aij.c_next.c_prev = null;
            /* return the element to the memory pool */
            lp.nnz--;
        }
    }
};

var glp_set_mat_col = exports["glp_set_mat_col"] = function(lp, j, len, ind, val){
    var tree = lp.tree;
    var row, aij, next;
    var i, k;
    if (tree != null && tree.reason != 0)
        xerror("glp_set_mat_col: operation not allowed");
    /* obtain pointer to j-th column */
    if (!(1 <= j && j <= lp.n))
        xerror("glp_set_mat_col: j = " + j + "; column number out of range");
    var col = lp.col[j];
    /* remove all existing elements from j-th column */
    while (col.ptr != null)
    {  /* take next element in the column */
        aij = col.ptr;
        /* remove the element from the column list */
        col.ptr = aij.c_next;
        /* obtain pointer to corresponding row */
        row = aij.row;
        /* remove the element from the row list */
        if (aij.r_prev == null)
            row.ptr = aij.r_next;
        else
            aij.r_prev.r_next = aij.r_next;
        if (aij.r_next != null)
            aij.r_next.r_prev = aij.r_prev;
        /* return the element to the memory pool */
        lp.nnz--;
    }
    /* store new contents of j-th column */
    if (!(0 <= len && len <= lp.m))
        xerror("glp_set_mat_col: j = " + j + "; len = " + len + "; invalid column length");
    if (len > NNZ_MAX - lp.nnz)
        xerror("glp_set_mat_col: j = " + j + "; len = " + len + "; too many constraint coefficients");
    for (k = 1; k <= len; k++){
        /* take number i of corresponding row */
        i = ind[k];
        /* obtain pointer to i-th row */
        if (!(1 <= i && i <= lp.m))
            xerror("glp_set_mat_col: j = " + j + "; ind[" + k + "] = " + i + "; row index out of range");
        row = lp.row[i];
        /* if there is element with the same row index, it can only be
         found in the beginning of i-th row list */
        if (row.ptr != null && row.ptr.col.j == j)
            xerror("glp_set_mat_col: j = " + j + "; ind[" + k + "] = " + i + "; duplicate row indices not allowed");
        /* create new element */
        aij = {}; lp.nnz++;
        aij.row = row;
        aij.col = col;
        aij.val = val[k];
        /* add the new element to the beginning of i-th row and j-th
         column lists */
        aij.r_prev = null;
        aij.r_next = row.ptr;
        aij.c_prev = null;
        aij.c_next = col.ptr;
        if (aij.r_next != null) aij.r_next.r_prev = aij;
        if (aij.c_next != null) aij.c_next.c_prev = aij;
        row.ptr = col.ptr = aij;
    }
    /* remove zero elements from j-th column */
    for (aij = col.ptr; aij != null; aij = next)
    {  next = aij.c_next;
        if (aij.val == 0.0)
        {  /* remove the element from the row list */
            xassert(aij.r_prev == null);
            aij.row.ptr = aij.r_next;
            if (aij.r_next != null) aij.r_next.r_prev = null;
            /* remove the element from the column list */
            if (aij.c_prev == null)
                col.ptr = next;
            else
                aij.c_prev.c_next = next;
            if (next != null)
                next.c_prev = aij.c_prev;
            /* return the element to the memory pool */
            lp.nnz--;
        }
    }
    /* if j-th column is basic, invalidate the basis factorization */
    if (col.stat == GLP_BS) lp.valid = 0;
};

var glp_load_matrix = exports["glp_load_matrix"] = function(lp, ne, ia, ja, ar){
    var tree = lp.tree;
    var row, col, aij, next;
    var i, j, k;
    if (tree != null && tree.reason != 0)
        xerror("glp_load_matrix: operation not allowed");
    /* clear the constraint matrix */
    for (i = 1; i <= lp.m; i++){
        row = lp.row[i];
        while (row.ptr != null){
            aij = row.ptr;
            row.ptr = aij.r_next;
            lp.nnz--;
        }
    }
    xassert(lp.nnz == 0);
    for (j = 1; j <= lp.n; j++) lp.col[j].ptr = null;
    /* load the new contents of the constraint matrix and build its
     row lists */
    if (ne < 0)
        xerror("glp_load_matrix: ne = " + ne + "; invalid number of constraint coefficients");
    if (ne > NNZ_MAX)
        xerror("glp_load_matrix: ne = " + ne + "; too many constraint coefficients");
    for (k = 1; k <= ne; k++){
        /* take indices of new element */
        i = ia[k]; j = ja[k];
        /* obtain pointer to i-th row */
        if (!(1 <= i && i <= lp.m))
            xerror("glp_load_matrix: ia[" + k + "] = " + i + "; row index out of range");
        row = lp.row[i];
        /* obtain pointer to j-th column */
        if (!(1 <= j && j <= lp.n))
            xerror("glp_load_matrix: ja[" + k + "] = " + j + "; column index out of range");
        col = lp.col[j];
        /* create new element */
        aij = {}; lp.nnz++;
        aij.row = row;
        aij.col = col;
        aij.val = ar[k];
        /* add the new element to the beginning of i-th row list */
        aij.r_prev = null;
        aij.r_next = row.ptr;
        if (aij.r_next != null) aij.r_next.r_prev = aij;
        row.ptr = aij;
    }
    xassert(lp.nnz == ne);
    /* build column lists of the constraint matrix and check elements
     with identical indices */
    for (i = 1; i <= lp.m; i++){
        for (aij = lp.row[i].ptr; aij != null; aij = aij.r_next){
            /* obtain pointer to corresponding column */
            col = aij.col;
            /* if there is element with identical indices, it can only
             be found in the beginning of j-th column list */
            if (col.ptr != null && col.ptr.row.i == i){
                for (k = 1; k <= ne; k++)
                    if (ia[k] == i && ja[k] == col.j) break;
                xerror("glp_load_mat: ia[" + k + "] = " + i + "; ja[" + k + "] = " + col.j + "; duplicate indices not allowed");
            }
            /* add the element to the beginning of j-th column list */
            aij.c_prev = null;
            aij.c_next = col.ptr;
            if (aij.c_next != null) aij.c_next.c_prev = aij;
            col.ptr = aij;
        }
    }
    /* remove zero elements from the constraint matrix */
    for (i = 1; i <= lp.m; i++)
    {  row = lp.row[i];
        for (aij = row.ptr; aij != null; aij = next)
        {  next = aij.r_next;
            if (aij.val == 0.0)
            {  /* remove the element from the row list */
                if (aij.r_prev == null)
                    row.ptr = next;
                else
                    aij.r_prev.r_next = next;
                if (next != null)
                    next.r_prev = aij.r_prev;
                /* remove the element from the column list */
                if (aij.c_prev == null)
                    aij.col.ptr = aij.c_next;
                else
                    aij.c_prev.c_next = aij.c_next;
                if (aij.c_next != null)
                    aij.c_next.c_prev = aij.c_prev;
                /* return the element to the memory pool */
                lp.nnz--;
            }
        }
    }
    /* invalidate the basis factorization */
    lp.valid = 0;
};

var glp_check_dup = exports["glp_check_dup"] = function(m, n, ne, ia, ja){
    var i, j, k, ptr, next, ret;
    var flag;
    if (m < 0)
        xerror("glp_check_dup: m = %d; invalid parameter");
    if (n < 0)
        xerror("glp_check_dup: n = %d; invalid parameter");
    if (ne < 0)
        xerror("glp_check_dup: ne = %d; invalid parameter");
    if (ne > 0 && ia == null)
        xerror("glp_check_dup: ia = " + ia + "; invalid parameter");
    if (ne > 0 && ja == null)
        xerror("glp_check_dup: ja = " + ja + "; invalid parameter");
    for (k = 1; k <= ne; k++){
        i = ia[k]; j = ja[k];
        if (!(1 <= i && i <= m && 1 <= j && j <= n)){
            ret = -k;
            return ret;
        }
    }
    if (m == 0 || n == 0)
    {  ret = 0;
        return ret;
    }
    /* allocate working arrays */
    ptr = new Array(1+m);
    next = new Array(1+ne);
    flag = new Array(1+n);
    /* build row lists */
    for (i = 1; i <= m; i++)
        ptr[i] = 0;
    for (k = 1; k <= ne; k++){
        i = ia[k];
        next[k] = ptr[i];
        ptr[i] = k;
    }
    /* clear column flags */
    for (j = 1; j <= n; j++)
        flag[j] = 0;
    /* check for duplicate elements */
    for (i = 1; i <= m; i++){
        for (k = ptr[i]; k != 0; k = next[k]){
            j = ja[k];
            if (flag[j]){
                /* find first element (i,j) */
                for (k = 1; k <= ne; k++)
                    if (ia[k] == i && ja[k] == j) break;
                xassert(k <= ne);
                /* find next (duplicate) element (i,j) */
                for (k++; k <= ne; k++)
                    if (ia[k] == i && ja[k] == j) break;
                xassert(k <= ne);
                ret = +k;
                return ret;
            }
            flag[j] = 1;
        }
        /* clear column flags */
        for (k = ptr[i]; k != 0; k = next[k])
            flag[ja[k]] = 0;
    }
    /* no duplicate element found */
    ret = 0;
    return ret;
};

var glp_sort_matrix = exports["glp_sort_matrix"] = function(P){
    var aij;
    var i, j;
    if (P == null || P.magic != GLP_PROB_MAGIC)
        xerror("glp_sort_matrix: P = " + P + "; invalid problem object");
    /* rebuild row linked lists */
    for (i = P.m; i >= 1; i--)
        P.row[i].ptr = null;
    for (j = P.n; j >= 1; j--){
        for (aij = P.col[j].ptr; aij != null; aij = aij.c_next){
            i = aij.row.i;
            aij.r_prev = null;
            aij.r_next = P.row[i].ptr;
            if (aij.r_next != null) aij.r_next.r_prev = aij;
            P.row[i].ptr = aij;
        }
    }
    /* rebuild column linked lists */
    for (j = P.n; j >= 1; j--)
        P.col[j].ptr = null;
    for (i = P.m; i >= 1; i--){
        for (aij = P.row[i].ptr; aij != null; aij = aij.r_next){
            j = aij.col.j;
            aij.c_prev = null;
            aij.c_next = P.col[j].ptr;
            if (aij.c_next != null) aij.c_next.c_prev = aij;
            P.col[j].ptr = aij;
        }
    }
};

var glp_del_rows = exports["glp_del_rows"] = function(lp, nrs, num){
    var tree = lp.tree;
    var row;
    var i, k, m_new;
    /* mark rows to be deleted */
    if (!(1 <= nrs && nrs <= lp.m))
        xerror("glp_del_rows: nrs = " + nrs + "; invalid number of rows");
    for (k = 1; k <= nrs; k++){
        /* take the number of row to be deleted */
        i = num[k];
        /* obtain pointer to i-th row */
        if (!(1 <= i && i <= lp.m))
            xerror("glp_del_rows: num[" + k + "] = " + i + "; row number out of range");
        row = lp.row[i];
        if (tree != null && tree.reason != 0){
            if (!(tree.reason == GLP_IROWGEN || tree.reason == GLP_ICUTGEN))
                xerror("glp_del_rows: operation not allowed");
            xassert(tree.curr != null);
            if (row.level != tree.curr.level)
                xerror("glp_del_rows: num[" + k + "] = " + i + "; invalid attempt to delete row created not in current subproblem");
            if (row.stat != GLP_BS)
                xerror("glp_del_rows: num[" + k + "] = " + i + "; invalid attempt to delete active row (constraint)");
            tree.reinv = 1;
        }
        /* check that the row is not marked yet */
        if (row.i == 0)
            xerror("glp_del_rows: num[" + k + "] = " + i + "; duplicate row numbers not allowed");
        /* erase symbolic name assigned to the row */
        glp_set_row_name(lp, i, null);
        xassert(row.node == null);
        /* erase corresponding row of the constraint matrix */
        glp_set_mat_row(lp, i, 0, null, null);
        xassert(row.ptr == null);
        /* mark the row to be deleted */
        row.i = 0;
    }
    /* delete all marked rows from the row list */
    m_new = 0;
    for (i = 1; i <= lp.m; i++){
        /* obtain pointer to i-th row */
        row = lp.row[i];
        /* check if the row is marked */
        if (row.i != 0){
            /* it is not marked; keep it */
            row.i = ++m_new;
            lp.row[row.i] = row;
        }
    }
    /* set new number of rows */
    lp.m = m_new;
    /* invalidate the basis factorization */
    lp.valid = 0;
};

var glp_del_cols = exports["glp_del_cols"] = function(lp, ncs, num){
    var tree = lp.tree;
    var col;
    var j, k, n_new;
    if (tree != null && tree.reason != 0)
        xerror("glp_del_cols: operation not allowed");
    /* mark columns to be deleted */
    if (!(1 <= ncs && ncs <= lp.n))
        xerror("glp_del_cols: ncs = " + ncs + "; invalid number of columns");
    for (k = 1; k <= ncs; k++){
        /* take the number of column to be deleted */
        j = num[k];
        /* obtain pointer to j-th column */
        if (!(1 <= j && j <= lp.n))
            xerror("glp_del_cols: num[" + k + "] = " + j + "; column number out of range");
        col = lp.col[j];
        /* check that the column is not marked yet */
        if (col.j == 0)
            xerror("glp_del_cols: num[" + k + "] = " + j + "; duplicate column numbers not allowed");
        /* erase symbolic name assigned to the column */
        glp_set_col_name(lp, j, null);
        xassert(col.node == null);
        /* erase corresponding column of the constraint matrix */
        glp_set_mat_col(lp, j, 0, null, null);
        xassert(col.ptr == null);
        /* mark the column to be deleted */
        col.j = 0;
        /* if it is basic, invalidate the basis factorization */
        if (col.stat == GLP_BS) lp.valid = 0;
    }
    /* delete all marked columns from the column list */
    n_new = 0;
    for (j = 1; j <= lp.n; j++)
    {  /* obtain pointer to j-th column */
        col = lp.col[j];
        /* check if the column is marked */
        if (col.j != 0){
            /* it is not marked; keep it */
            col.j = ++n_new;
            lp.col[col.j] = col;
        }
    }
    /* set new number of columns */
    lp.n = n_new;
    /* if the basis header is still valid, adjust it */
    if (lp.valid){
        var m = lp.m;
        var head = lp.head;
        for (j = 1; j <= n_new; j++){
            k = lp.col[j].bind;
            if (k != 0){
                xassert(1 <= k && k <= m);
                head[k] = m + j;
            }
        }
    }
};

var glp_copy_prob = exports["glp_copy_prob"] = function(dest, prob, names){
    var tree = dest.tree;
    var bfcp = {};
    var i, j, len, ind;
    var val;
    if (tree != null && tree.reason != 0)
        xerror("glp_copy_prob: operation not allowed");
    if (dest == prob)
        xerror("glp_copy_prob: copying problem object to itself not allowed");
    if (!(names == GLP_ON || names == GLP_OFF))
        xerror("glp_copy_prob: names = " + names + "; invalid parameter");
    glp_erase_prob(dest);
    if (names && prob.name != null)
        glp_set_prob_name(dest, prob.name);
    if (names && prob.obj != null)
        glp_set_obj_name(dest, prob.obj);
    dest.dir = prob.dir;
    dest.c0 = prob.c0;
    if (prob.m > 0)
        glp_add_rows(dest, prob.m);
    if (prob.n > 0)
        glp_add_cols(dest, prob.n);
    glp_get_bfcp(prob, bfcp);
    glp_set_bfcp(dest, bfcp);
    dest.pbs_stat = prob.pbs_stat;
    dest.dbs_stat = prob.dbs_stat;
    dest.obj_val = prob.obj_val;
    dest.some = prob.some;
    dest.ipt_stat = prob.ipt_stat;
    dest.ipt_obj = prob.ipt_obj;
    dest.mip_stat = prob.mip_stat;
    dest.mip_obj = prob.mip_obj;
    var to, from;
    for (i = 1; i <= prob.m; i++){
        to = dest.row[i];
        from = prob.row[i];
        if (names && from.name != null)
            glp_set_row_name(dest, i, from.name);
        to.type = from.type;
        to.lb = from.lb;
        to.ub = from.ub;
        to.rii = from.rii;
        to.stat = from.stat;
        to.prim = from.prim;
        to.dual = from.dual;
        to.pval = from.pval;
        to.dval = from.dval;
        to.mipx = from.mipx;
    }
    ind = new Array(1+prob.m);
    val = new Array(1+prob.m);
    for (j = 1; j <= prob.n; j++){
        to = dest.col[j];
        from = prob.col[j];
        if (names && from.name != null)
            glp_set_col_name(dest, j, from.name);
        to.kind = from.kind;
        to.type = from.type;
        to.lb = from.lb;
        to.ub = from.ub;
        to.coef = from.coef;
        len = glp_get_mat_col(prob, j, ind, val);
        glp_set_mat_col(dest, j, len, ind, val);
        to.sjj = from.sjj;
        to.stat = from.stat;
        to.prim = from.prim;
        to.dual = from.dual;
        to.pval = from.pval;
        to.dval = from.dval;
        to.mipx = from.mipx;
    }
};

var glp_erase_prob = exports["glp_erase_prob"] = function(lp){
    var tree = lp.tree;
    if (tree != null && tree.reason != 0)
        xerror("glp_erase_prob: operation not allowed");
    delete_prob(lp);
    create_prob(lp);
};

function delete_prob(lp){
    lp.magic = 0x3F3F3F3F;
    lp.parms = null;
    xassert(lp.tree == null);
    lp.row = null;
    lp.col = null;
    lp.r_tree = null;
    lp.c_tree = null;
    lp.head = null;
    lp.bfcp = null;
    lp.bfd = null;
}

