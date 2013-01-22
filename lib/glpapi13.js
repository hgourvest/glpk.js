var glp_ios_reason = exports["glp_ios_reason"] = function(tree){
    return tree.reason;
};

var glp_ios_get_prob = exports["glp_ios_get_prob"] = function(tree){
    return tree.mip;
};

function glp_ios_tree_size(tree, callback){
    callback(tree.a_cnt, tree.n_cnt, tree.t_cnt);
}

function glp_ios_curr_node(tree){
    /* obtain pointer to the current subproblem */
    var node = tree.curr;
    /* return its reference number */
    return node == null ? 0 : node.p;
}

function glp_ios_next_node(tree, p){

    function doError(){
        xerror("glp_ios_next_node: p = " + p + "; invalid subproblem reference number");
    }

    var node;
    if (p == 0)
    {  /* obtain pointer to the first active subproblem */
        node = tree.head;
    }
    else
    {  /* obtain pointer to the specified subproblem */
        if (!(1 <= p && p <= tree.nslots))
            doError();
        node = tree.slot[p].node;
        if (node == null) doError();
        /* the specified subproblem must be active */
        if (node.count != 0)
            xerror("glp_ios_next_node: p = " + p + "; subproblem not in the active list");
        /* obtain pointer to the next active subproblem */
        node = node.next;
    }
    /* return the reference number */
    return node == null ? 0 : node.p;
}

function glp_ios_prev_node(tree, p){
    var node;

    function doError(){
        xerror("glp_ios_prev_node: p = " + p + "; invalid subproblem reference number")
    }

    if (p == 0)
    {  /* obtain pointer to the last active subproblem */
        node = tree.tail;
    }
    else
    {  /* obtain pointer to the specified subproblem */
        if (!(1 <= p && p <= tree.nslots))
            doError();
        node = tree.slot[p].node;
        if (node == null) doError();
        /* the specified subproblem must be active */
        if (node.count != 0)
            xerror("glp_ios_prev_node: p = " + p + "; subproblem not in the active list");
        /* obtain pointer to the previous active subproblem */
        node = node.prev;
    }
    /* return the reference number */
    return node == null ? 0 : node.p;
}

function glp_ios_up_node(tree, p){
    var node;

    function doError(){
        xerror("glp_ios_up_node: p = " + p + "; invalid subproblem reference number")
    }

    /* obtain pointer to the specified subproblem */
    if (!(1 <= p && p <= tree.nslots))
        doError();
    node = tree.slot[p].node;
    if (node == null) doError();
    /* obtain pointer to the parent subproblem */
    node = node.up;
    /* return the reference number */
    return node == null ? 0 : node.p;
}

function glp_ios_node_level(tree, p){
    var node;

    function doError(){
        xerror("glp_ios_node_level: p = " + p + "; invalid subproblem reference number")
    }

    /* obtain pointer to the specified subproblem */
    if (!(1 <= p && p <= tree.nslots))
        doError();
    node = tree.slot[p].node;
    if (node == null) doError();
    /* return the node level */
    return node.level;
}

function glp_ios_node_bound(tree, p){
    var node;

    function doError(){
        xerror("glp_ios_node_bound: p = " + p + "; invalid subproblem reference number")
    }

    /* obtain pointer to the specified subproblem */
    if (!(1 <= p && p <= tree.nslots))
        doError();
    node = tree.slot[p].node;
    if (node == null) doError();
    /* return the node local bound */
    return node.bound;
}

function glp_ios_best_node(tree){
    return ios_best_node(tree);
}

function glp_ios_mip_gap(tree){
    return ios_relative_gap(tree);
}

function glp_ios_node_data(tree, p)
{
    var node;

    function doError(){
        xerror("glp_ios_node_level: p = " + p + "; invalid subproblem reference number")
    }

    /* obtain pointer to the specified subproblem */
    if (!(1 <= p && p <= tree.nslots))
        doError();
    node = tree.slot[p].node;
    if (node == null) doError();
    /* return pointer to the application-specific data */
    return node.data;
}

function glp_ios_row_attr(tree, i, attr){
    var row;
    if (!(1 <= i && i <= tree.mip.m))
        xerror("glp_ios_row_attr: i = " + i + "; row number out of range");
    row = tree.mip.row[i];
    attr.level = row.level;
    attr.origin = row.origin;
    attr.klass = row.klass;
}

function glp_ios_pool_size(tree){
    /* determine current size of the cut pool */
    if (tree.reason != GLP_ICUTGEN)
        xerror("glp_ios_pool_size: operation not allowed");
    xassert(tree.local != null);
    return tree.local.size;
}

function glp_ios_add_row(tree, name, klass, flags, len, ind, val, type, rhs){
    /* add row (constraint) to the cut pool */
    var num;
    if (tree.reason != GLP_ICUTGEN)
        xerror("glp_ios_add_row: operation not allowed");
    xassert(tree.local != null);
    num = ios_add_row(tree, tree.local, name, klass, flags, len,
        ind, val, type, rhs);
    return num;
}

function glp_ios_del_row(tree, i){
    /* remove row (constraint) from the cut pool */
    if (tree.reason != GLP_ICUTGEN)
        xerror("glp_ios_del_row: operation not allowed");
    ios_del_row(tree.local, i);
}

function glp_ios_clear_pool(tree){
    /* remove all rows (constraints) from the cut pool */
    if (tree.reason != GLP_ICUTGEN)
        xerror("glp_ios_clear_pool: operation not allowed");
    ios_clear_pool(tree.local);
}

function glp_ios_can_branch(tree, j){
    if (!(1 <= j && j <= tree.mip.n))
        xerror("glp_ios_can_branch: j = " + j + "; column number out of range");
    return tree.non_int[j];
}

function glp_ios_branch_upon(tree, j, sel){
    if (!(1 <= j && j <= tree.mip.n))
        xerror("glp_ios_branch_upon: j = " + j + "; column number out of range");
    if (!(sel == GLP_DN_BRNCH || sel == GLP_UP_BRNCH || sel == GLP_NO_BRNCH))
        xerror("glp_ios_branch_upon: sel = " + sel + ": invalid branch selection flag");
    if (!(tree.non_int[j]))
        xerror("glp_ios_branch_upon: j = " + j + "; variable cannot be used to branch upon");
    if (tree.br_var != 0)
        xerror("glp_ios_branch_upon: branching variable already chosen");
    tree.br_var = j;
    tree.br_sel = sel;
}

function glp_ios_select_node(tree, p){
    var node;

    function doError(){
        xerror("glp_ios_select_node: p = " + p + "; invalid subproblem reference number")
    }

    /* obtain pointer to the specified subproblem */
    if (!(1 <= p && p <= tree.nslots))
        doError();
    node = tree.slot[p].node;
    if (node == null) doError();
    /* the specified subproblem must be active */
    if (node.count != 0)
        xerror("glp_ios_select_node: p = " + p + "; subproblem not in the active list");
    /* no subproblem must be selected yet */
    if (tree.next_p != 0)
        xerror("glp_ios_select_node: subproblem already selected");
    /* select the specified subproblem to continue the search */
    tree.next_p = p;
}

function glp_ios_heur_sol(tree, x){
    var mip = tree.mip;
    var m = tree.orig_m;
    var n = tree.n;
    var i, j;
    var obj;
    xassert(mip.m >= m);
    xassert(mip.n == n);
    /* check values of integer variables and compute value of the
     objective function */
    obj = mip.c0;
    for (j = 1; j <= n; j++)
    {  var col = mip.col[j];
        if (col.kind == GLP_IV)
        {  /* provided value must be integral */
            if (x[j] != Math.floor(x[j])) return 1;
        }
        obj += col.coef * x[j];
    }
    /* check if the provided solution is better than the best known
     integer feasible solution */
    if (mip.mip_stat == GLP_FEAS)
    {  switch (mip.dir)
    {  case GLP_MIN:
            if (obj >= tree.mip.mip_obj) return 1;
            break;
        case GLP_MAX:
            if (obj <= tree.mip.mip_obj) return 1;
            break;
        default:
            xassert(mip != mip);
    }
    }
    /* it is better; store it in the problem object */
    if (tree.parm.msg_lev >= GLP_MSG_ON)
        xprintf("Solution found by heuristic: " + obj + "");
    mip.mip_stat = GLP_FEAS;
    mip.mip_obj = obj;
    for (j = 1; j <= n; j++)
        mip.col[j].mipx = x[j];
    for (i = 1; i <= m; i++)
    {  var row = mip.row[i];
        var aij;
        row.mipx = 0.0;
        for (aij = row.ptr; aij != null; aij = aij.r_next)
            row.mipx += aij.val * aij.col.mipx;
    }
    return 0;
}

function glp_ios_terminate(tree){
    if (tree.parm.msg_lev >= GLP_MSG_DBG)
        xprintf("The search is prematurely terminated due to application request");
    tree.stop = 1;
}

