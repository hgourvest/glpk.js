function new_node(tree, parent){
    /* pull a free slot for the new node */
    var p = get_slot(tree);
    /* create descriptor of the new subproblem */
    var node = {};
    tree.slot[p].node = node;
    node.p = p;
    node.up = parent;
    node.level = (parent == null ? 0 : parent.level + 1);
    node.count = 0;
    node.b_ptr = null;
    node.s_ptr = null;
    node.r_ptr = null;
    node.solved = 0;
    node.lp_obj = (parent == null ? (tree.mip.dir == GLP_MIN ?
        -DBL_MAX : +DBL_MAX) : parent.lp_obj);
    node.bound = (parent == null ? (tree.mip.dir == GLP_MIN ?
        -DBL_MAX : +DBL_MAX) : parent.bound);
    node.br_var = 0;
    node.br_val = 0.0;
    node.ii_cnt = 0;
    node.ii_sum = 0.0;
    node.changed = 0;
    if (tree.parm.cb_size == 0)
        node.data = null;
    else
    {
        node.data = {};
    }
    node.temp = null;
    node.prev = tree.tail;
    node.next = null;
    /* add the new subproblem to the end of the active list */
    if (tree.head == null)
        tree.head = node;
    else
        tree.tail.next = node;
    tree.tail = node;
    tree.a_cnt++;
    tree.n_cnt++;
    tree.t_cnt++;
    /* increase the number of child subproblems */
    if (parent == null)
        xassert(p == 1);
    else
        parent.count++;
    return node;
}

function get_slot(tree){
    var p;
    /* if no free slots are available, increase the room */
    if (tree.avail == 0)
    {  var nslots = tree.nslots;
        var save = tree.slot;
        if (nslots == 0)
            tree.nslots = 20;
        else
        {  tree.nslots = nslots + nslots;
            xassert(tree.nslots > nslots);
        }
        tree.slot = new Array(1+tree.nslots);
        xfillObjArr(tree.slot, 0, 1+tree.nslots);
        if (save != null)
        {
            xcopyArr(tree.slot, 1, save, 1, nslots);
        }
        /* push more free slots into the stack */
        for (p = tree.nslots; p > nslots; p--)
        {  tree.slot[p].node = null;
            tree.slot[p].next = tree.avail;
            tree.avail = p;
        }
    }
    /* pull a free slot from the stack */
    p = tree.avail;
    tree.avail = tree.slot[p].next;
    xassert(tree.slot[p].node == null);
    tree.slot[p].next = 0;
    return p;
}

function ios_create_tree(mip, parm){
    var m = mip.m;
    var n = mip.n;
    var tree;
    var i, j;
    xassert(mip.tree == null);
    mip.tree = tree = {};
    tree.n = n;
    /* save original problem components */
    tree.orig_m = m;
    tree.orig_type = new Int8Array(1+m+n);
    tree.orig_lb = new Float64Array(1+m+n);
    tree.orig_ub = new Float64Array(1+m+n);
    tree.orig_stat = new Int8Array(1+m+n);
    tree.orig_prim = new Float64Array(1+m+n);
    tree.orig_dual = new Float64Array(1+m+n);
    for (i = 1; i <= m; i++)
    {  var row = mip.row[i];
        tree.orig_type[i] = row.type;
        tree.orig_lb[i] = row.lb;
        tree.orig_ub[i] = row.ub;
        tree.orig_stat[i] = row.stat;
        tree.orig_prim[i] = row.prim;
        tree.orig_dual[i] = row.dual;
    }
    for (j = 1; j <= n; j++)
    {  var col = mip.col[j];
        tree.orig_type[m+j] = col.type;
        tree.orig_lb[m+j] = col.lb;
        tree.orig_ub[m+j] = col.ub;
        tree.orig_stat[m+j] = col.stat;
        tree.orig_prim[m+j] = col.prim;
        tree.orig_dual[m+j] = col.dual;
    }
    tree.orig_obj = mip.obj_val;
    /* initialize the branch-and-bound tree */
    tree.nslots = 0;
    tree.avail = 0;
    tree.slot = null;
    tree.head = tree.tail = null;
    tree.a_cnt = tree.n_cnt = tree.t_cnt = 0;
    /* the root subproblem is not solved yet, so its final components
     are unknown so far */
    tree.root_m = 0;
    tree.root_type = null;
    tree.root_lb = tree.root_ub = null;
    tree.root_stat = null;
    /* the current subproblem does not exist yet */
    tree.curr = null;
    tree.mip = mip;
    /*tree.solved = 0;*/
    tree.non_int = new Int8Array(1+n);
    xfillArr(tree.non_int, 1, 0, n);
    /* arrays to save parent subproblem components will be allocated
     later */
    tree.pred_m = tree.pred_max = 0;
    tree.pred_type = null;
    tree.pred_lb = tree.pred_ub = null;
    tree.pred_stat = null;
    /* cut generator */
    tree.local = ios_create_pool(tree);
    /*tree.first_attempt = 1;*/
    /*tree.max_added_cuts = 0;*/
    /*tree.min_eff = 0.0;*/
    /*tree.miss = 0;*/
    /*tree.just_selected = 0;*/
    tree.mir_gen = null;
    tree.clq_gen = null;
    /*tree.round = 0;*/
    /* pseudocost branching */
    tree.pcost = null;
    tree.iwrk = new Int32Array(1+n);
    tree.dwrk = new Float64Array(1+n);
    /* initialize control parameters */
    tree.parm = parm;
    tree.tm_beg = xtime();
    tree.tm_lag = 0;
    tree.sol_cnt = 0;
    /* initialize advanced solver interface */
    tree.reason = 0;
    tree.reopt = 0;
    tree.reinv = 0;
    tree.br_var = 0;
    tree.br_sel = 0;
    tree.child = 0;
    tree.next_p = 0;
    /*tree.btrack = null;*/
    tree.stop = 0;
    /* create the root subproblem, which initially is identical to
     the original MIP */
    new_node(tree, null);
    return tree;
}

function ios_revive_node(tree, p){
    var mip = tree.mip;
    var node, root;
    var b, r, s, a;
    /* obtain pointer to the specified subproblem */
    xassert(1 <= p && p <= tree.nslots);
    node = tree.slot[p].node;
    xassert(node != null);
    /* the specified subproblem must be active */
    xassert(node.count == 0);
    /* the current subproblem must not exist */
    xassert(tree.curr == null);
    /* the specified subproblem becomes current */
    tree.curr = node;
    /*tree.solved = 0;*/
    /* obtain pointer to the root subproblem */
    root = tree.slot[1].node;
    xassert(root != null);
    /* at this point problem object components correspond to the root
     subproblem, so if the root subproblem should be revived, there
     is nothing more to do */
    if (node == root) return;
    xassert(mip.m == tree.root_m);
    /* build path from the root to the current node */
    node.temp = null;
    for (; node != null; node = node.up)
    {  if (node.up == null)
        xassert(node == root);
    else
        node.up.temp = node;
    }
    /* go down from the root to the current node and make necessary
     changes to restore components of the current subproblem */
    for (node = root; node != null; node = node.temp)
    {  var m = mip.m;
        var n = mip.n;
        /* if the current node is reached, the problem object at this
         point corresponds to its parent, so save attributes of rows
         and columns for the parent subproblem */
        if (node.temp == null)
        {   var i, j;
            tree.pred_m = m;
            /* allocate/reallocate arrays, if necessary */
            if (tree.pred_max < m + n)
            {  var new_size = m + n + 100;
                tree.pred_max = new_size;
                tree.pred_type = new Int8Array(1+new_size);
                tree.pred_lb = new Float64Array(1+new_size);
                tree.pred_ub = new Float64Array(1+new_size);
                tree.pred_stat = new Int8Array(1+new_size);
            }
            /* save row attributes */
            for (i = 1; i <= m; i++)
            {  var row = mip.row[i];
                tree.pred_type[i] = row.type;
                tree.pred_lb[i] = row.lb;
                tree.pred_ub[i] = row.ub;
                tree.pred_stat[i] = row.stat;
            }
            /* save column attributes */
            for (j = 1; j <= n; j++)
            {  var col = mip.col[j];
                tree.pred_type[mip.m+j] = col.type;
                tree.pred_lb[mip.m+j] = col.lb;
                tree.pred_ub[mip.m+j] = col.ub;
                tree.pred_stat[mip.m+j] = col.stat;
            }
        }
        /* change bounds of rows and columns */
        {   for (b = node.b_ptr; b != null; b = b.next)
        {  if (b.k <= m)
            glp_set_row_bnds(mip, b.k, b.type, b.lb, b.ub);
        else
            glp_set_col_bnds(mip, b.k-m, b.type, b.lb, b.ub);
        }
        }
        /* change statuses of rows and columns */
        {   for (s = node.s_ptr; s != null; s = s.next)
        {  if (s.k <= m)
            glp_set_row_stat(mip, s.k, s.stat);
        else
            glp_set_col_stat(mip, s.k-m, s.stat);
        }
        }
        /* add new rows */
        if (node.r_ptr != null)
        {
            var len, ind;
            var val;
            ind = new Int32Array(1+n);
            val = new Float64Array(1+n);
            for (r = node.r_ptr; r != null; r = r.next)
            {  i = glp_add_rows(mip, 1);
                glp_set_row_name(mip, i, r.name);
                xassert(mip.row[i].level == 0);
                mip.row[i].level = node.level;
                mip.row[i].origin = r.origin;
                mip.row[i].klass = r.klass;
                glp_set_row_bnds(mip, i, r.type, r.lb, r.ub);
                len = 0;
                for (a = r.ptr; a != null; a = a.next){
                    len++; ind[len] = a.j; val[len] = a.val;
                }
                glp_set_mat_row(mip, i, len, ind, val);
                glp_set_rii(mip, i, r.rii);
                glp_set_row_stat(mip, i, r.stat);
            }
        }
    }
    /* the specified subproblem has been revived */
    node = tree.curr;
    /* delete its bound change list */
    while (node.b_ptr != null)
    {   b = node.b_ptr;
        node.b_ptr = b.next;
    }
    /* delete its status change list */
    while (node.s_ptr != null)
    {   s = node.s_ptr;
        node.s_ptr = s.next;
    }
    /* delete its row addition list (additional rows may appear, for
     example, due to branching on GUB constraints */
    while (node.r_ptr != null)
    {   r = node.r_ptr;
        node.r_ptr = r.next;
        xassert(r.name == null);
        while (r.ptr != null)
        {   a = r.ptr;
            r.ptr = a.next;
        }
    }
}

function ios_freeze_node(tree){
    var mip = tree.mip;
    var m = mip.m;
    var n = mip.n;
    /* obtain pointer to the current subproblem */
    var node = tree.curr;
    xassert(node != null);


    var k, i, row, col;
    if (node.up == null)
    {  /* freeze the root subproblem */
        xassert(node.p == 1);
        xassert(tree.root_m == 0);
        xassert(tree.root_type == null);
        xassert(tree.root_lb == null);
        xassert(tree.root_ub == null);
        xassert(tree.root_stat == null);
        tree.root_m = m;
        tree.root_type = new Int8Array(1+m+n);
        tree.root_lb = new Float64Array(1+m+n);
        tree.root_ub = new Float64Array(1+m+n);
        tree.root_stat = new Int8Array(1+m+n);
        for (k = 1; k <= m+n; k++)
        {  if (k <= m)
        {   row = mip.row[k];
            tree.root_type[k] = row.type;
            tree.root_lb[k] = row.lb;
            tree.root_ub[k] = row.ub;
            tree.root_stat[k] = row.stat;
        }
        else
        {   col = mip.col[k-m];
            tree.root_type[k] = col.type;
            tree.root_lb[k] = col.lb;
            tree.root_ub[k] = col.ub;
            tree.root_stat[k] = col.stat;
        }
        }
    }
    else
    {  /* freeze non-root subproblem */
        var root_m = tree.root_m;
        var pred_m = tree.pred_m;
        var j;
        xassert(pred_m <= m);
        /* build change lists for rows and columns which exist in the
         parent subproblem */
        xassert(node.b_ptr == null);
        xassert(node.s_ptr == null);
        for (k = 1; k <= pred_m + n; k++)
        {  var pred_type, pred_stat, type, stat;
            var pred_lb, pred_ub, lb, ub;
            /* determine attributes in the parent subproblem */
            pred_type = tree.pred_type[k];
            pred_lb = tree.pred_lb[k];
            pred_ub = tree.pred_ub[k];
            pred_stat = tree.pred_stat[k];
            /* determine attributes in the current subproblem */
            if (k <= pred_m)
            {   row = mip.row[k];
                type = row.type;
                lb = row.lb;
                ub = row.ub;
                stat = row.stat;
            }
            else
            {   col = mip.col[k - pred_m];
                type = col.type;
                lb = col.lb;
                ub = col.ub;
                stat = col.stat;
            }
            /* save type and bounds of a row/column, if changed */
            if (!(pred_type == type && pred_lb == lb && pred_ub == ub))
            {   var b = {};
                b.k = k;
                b.type = type;
                b.lb = lb;
                b.ub = ub;
                b.next = node.b_ptr;
                node.b_ptr = b;
            }
            /* save status of a row/column, if changed */
            if (pred_stat != stat)
            {   var s = {};
                s.k = k;
                s.stat = stat;
                s.next = node.s_ptr;
                node.s_ptr = s;
            }
        }
        /* save new rows added to the current subproblem */
        xassert(node.r_ptr == null);
        if (pred_m < m)
        {  var len, ind;
            var val;
            ind = new Int32Array(1+n);
            val = new Float64Array(1+n);
            for (i = m; i > pred_m; i--)
            {   row = mip.row[i];
                var r = {};
                var name = glp_get_row_name(mip, i);
                if (name == null)
                    r.name = null;
                else
                {
                    r.name = name;
                }
                r.type = row.type;
                r.lb = row.lb;
                r.ub = row.ub;
                r.ptr = null;
                len = glp_get_mat_row(mip, i, ind, val);
                for (k = 1; k <= len; k++)
                {
                    var a = {};
                    a.j = ind[k];
                    a.val = val[k];
                    a.next = r.ptr;
                    r.ptr = a;
                }
                r.rii = row.rii;
                r.stat = row.stat;
                r.next = node.r_ptr;
                node.r_ptr = r;
            }
        }
        /* remove all rows missing in the root subproblem */
        if (m != root_m)
        {
            var nrs = m - root_m;
            xassert(nrs > 0);
            var num = new Int32Array(1+nrs);
            for (i = 1; i <= nrs; i++) num[i] = root_m + i;
            glp_del_rows(mip, nrs, num);
        }
        m = mip.m;
        /* and restore attributes of all rows and columns for the root
         subproblem */
        xassert(m == root_m);
        for (i = 1; i <= m; i++)
        {  glp_set_row_bnds(mip, i, tree.root_type[i],
            tree.root_lb[i], tree.root_ub[i]);
            glp_set_row_stat(mip, i, tree.root_stat[i]);
        }
        for (j = 1; j <= n; j++)
        {  glp_set_col_bnds(mip, j, tree.root_type[m+j],
            tree.root_lb[m+j], tree.root_ub[m+j]);
            glp_set_col_stat(mip, j, tree.root_stat[m+j]);
        }
    }
    /* the current subproblem has been frozen */
    tree.curr = null;
}

function ios_clone_node(tree, p, nnn, ref){
    var node, k;
    /* obtain pointer to the subproblem to be cloned */
    xassert(1 <= p && p <= tree.nslots);
    node = tree.slot[p].node;
    xassert(node != null);
    /* the specified subproblem must be active */
    xassert(node.count == 0);
    /* and must be in the frozen state */
    xassert(tree.curr != node);
    /* remove the specified subproblem from the active list, because
     it becomes inactive */
    if (node.prev == null)
        tree.head = node.next;
    else
        node.prev.next = node.next;
    if (node.next == null)
        tree.tail = node.prev;
    else
        node.next.prev = node.prev;
    node.prev = node.next = null;
    tree.a_cnt--;
    /* create clone subproblems */
    xassert(nnn > 0);
    for (k = 1; k <= nnn; k++)
        ref[k] = new_node(tree, node).p;
}

function ios_delete_node(tree, p){
    var node, temp;
    /* obtain pointer to the subproblem to be deleted */
    xassert(1 <= p && p <= tree.nslots);
    node = tree.slot[p].node;
    xassert(node != null);
    /* the specified subproblem must be active */
    xassert(node.count == 0);
    /* and must be in the frozen state */
    xassert(tree.curr != node);
    /* remove the specified subproblem from the active list, because
     it is gone from the tree */
    if (node.prev == null)
        tree.head = node.next;
    else
        node.prev.next = node.next;
    if (node.next == null)
        tree.tail = node.prev;
    else
        node.next.prev = node.prev;
    node.prev = node.next = null;
    tree.a_cnt--;
    while (true){
        /* recursive deletion starts here */
        /* delete the bound change list */
        {  var b;
            while (node.b_ptr != null)
            {  b = node.b_ptr;
                node.b_ptr = b.next;
            }
        }
        /* delete the status change list */
        {  var s;
            while (node.s_ptr != null)
            {  s = node.s_ptr;
                node.s_ptr = s.next;
            }
        }
        /* delete the row addition list */
        while (node.r_ptr != null)
        {  var r;
            r = node.r_ptr;
            r.name = null;
            while (r.ptr != null)
            {  var a;
                a = r.ptr;
                r.ptr = a.next;
            }
            node.r_ptr = r.next;
        }
        /* free application-specific data */
        if (tree.parm.cb_size == 0)
            xassert(node.data == null);
        /* free the corresponding node slot */
        p = node.p;
        xassert(tree.slot[p].node == node);
        tree.slot[p].node = null;
        tree.slot[p].next = tree.avail;
        tree.avail = p;
        /* save pointer to the parent subproblem */
        temp = node.up;
        /* delete the subproblem descriptor */
        tree.n_cnt--;
        /* take pointer to the parent subproblem */
        node = temp;
        if (node != null)
        {  /* the parent subproblem exists; decrease the number of its
         child subproblems */
            xassert(node.count > 0);
            node.count--;
            /* if now the parent subproblem has no childs, it also must be
             deleted */
            if (node.count == 0) continue;
        }
        break;
    }
}

function ios_delete_tree(tree){
    var mip = tree.mip;
    var i, j;
    var m = mip.m;
    var n = mip.n;
    xassert(mip.tree == tree);
    /* remove all additional rows */
    if (m != tree.orig_m)
    {  var nrs, num;
        nrs = m - tree.orig_m;
        xassert(nrs > 0);
        num = new Int32Array(1+nrs);
        for (i = 1; i <= nrs; i++) num[i] = tree.orig_m + i;
        glp_del_rows(mip, nrs, num);
    }
    m = tree.orig_m;
    /* restore original attributes of rows and columns */
    xassert(m == tree.orig_m);
    xassert(n == tree.n);
    for (i = 1; i <= m; i++)
    {  glp_set_row_bnds(mip, i, tree.orig_type[i],
        tree.orig_lb[i], tree.orig_ub[i]);
        glp_set_row_stat(mip, i, tree.orig_stat[i]);
        mip.row[i].prim = tree.orig_prim[i];
        mip.row[i].dual = tree.orig_dual[i];
    }
    for (j = 1; j <= n; j++)
    {  glp_set_col_bnds(mip, j, tree.orig_type[m+j],
        tree.orig_lb[m+j], tree.orig_ub[m+j]);
        glp_set_col_stat(mip, j, tree.orig_stat[m+j]);
        mip.col[j].prim = tree.orig_prim[m+j];
        mip.col[j].dual = tree.orig_dual[m+j];
    }
    mip.pbs_stat = mip.dbs_stat = GLP_FEAS;
    mip.obj_val = tree.orig_obj;
    /* delete the branch-and-bound tree */
    xassert(tree.local != null);
    ios_delete_pool(tree.local);
    xassert(tree.mir_gen == null);
    xassert(tree.clq_gen == null);
    mip.tree = null;
}

function ios_eval_degrad(tree, j, callback){
    var mip = tree.mip;
    var m = mip.m;
    var n = mip.n;
    var len, kase, k, t, stat;
    var alfa, beta, gamma, delta, dz;
    var ind = tree.iwrk;
    var val = tree.dwrk;
    var dn, up;

    /* current basis must be optimal */
    xassert(glp_get_status(mip) == GLP_OPT);
    /* basis factorization must exist */
    xassert(glp_bf_exists(mip));
    /* obtain (fractional) value of x[j] in optimal basic solution
     to LP relaxation of the current subproblem */
    xassert(1 <= j && j <= n);
    beta = mip.col[j].prim;
    /* since the value of x[j] is fractional, it is basic; compute
     corresponding row of the simplex table */
    len = lpx_eval_tab_row(mip, m+j, ind, val);
    /* kase < 0 means down-branch; kase > 0 means up-branch */
    for (kase = -1; kase <= +1; kase += 2)
    {  /* for down-branch we introduce new upper bound floor(beta)
     for x[j]; similarly, for up-branch we introduce new lower
     bound ceil(beta) for x[j]; in the current basis this new
     upper/lower bound is violated, so in the adjacent basis
     x[j] will leave the basis and go to its new upper/lower
     bound; we need to know which non-basic variable x[k] should
     enter the basis to keep dual feasibility */
        k = lpx_dual_ratio_test(mip, len, ind, val, kase, 1e-9);
        /* if no variable has been chosen, current basis being primal
         infeasible due to the new upper/lower bound of x[j] is dual
         unbounded, therefore, LP relaxation to corresponding branch
         has no primal feasible solution */
        if (k == 0)
        {  if (mip.dir == GLP_MIN)
        {  if (kase < 0)
            dn = +DBL_MAX;
        else
            up = +DBL_MAX;
        }
        else if (mip.dir == GLP_MAX)
        {  if (kase < 0)
            dn = -DBL_MAX;
        else
            up = -DBL_MAX;
        }
        else
            xassert(mip != mip);
            continue;
        }
        xassert(1 <= k && k <= m+n);
        /* row of the simplex table corresponding to specified basic
         variable x[j] is the following:
         x[j] = ... + alfa * x[k] + ... ;
         we need to know influence coefficient, alfa, at non-basic
         variable x[k] chosen with the dual ratio test */
        for (t = 1; t <= len; t++)
            if (ind[t] == k) break;
        xassert(1 <= t && t <= len);
        alfa = val[t];
        /* determine status and reduced cost of variable x[k] */
        if (k <= m)
        {  stat = mip.row[k].stat;
            gamma = mip.row[k].dual;
        }
        else
        {  stat = mip.col[k-m].stat;
            gamma = mip.col[k-m].dual;
        }
        /* x[k] cannot be basic or fixed non-basic */
        xassert(stat == GLP_NL || stat == GLP_NU || stat == GLP_NF);
        /* if the current basis is dual degenerative, some reduced
         costs, which are close to zero, may have wrong sign due to
         round-off errors, so correct the sign of gamma */
        if (mip.dir == GLP_MIN)
        {  if (stat == GLP_NL && gamma < 0.0 ||
            stat == GLP_NU && gamma > 0.0 ||
            stat == GLP_NF) gamma = 0.0;
        }
        else if (mip.dir == GLP_MAX)
        {  if (stat == GLP_NL && gamma > 0.0 ||
            stat == GLP_NU && gamma < 0.0 ||
            stat == GLP_NF) gamma = 0.0;
        }
        else
            xassert(mip != mip);
        /* determine the change of x[j] in the adjacent basis:
         delta x[j] = new x[j] - old x[j] */
        delta = (kase < 0 ? Math.floor(beta) : Math.ceil(beta)) - beta;
        /* compute the change of x[k] in the adjacent basis:
         delta x[k] = new x[k] - old x[k] = delta x[j] / alfa */
        delta /= alfa;
        /* compute the change of the objective in the adjacent basis:
         delta z = new z - old z = gamma * delta x[k] */
        dz = gamma * delta;
        if (mip.dir == GLP_MIN)
            xassert(dz >= 0.0);
        else if (mip.dir == GLP_MAX)
            xassert(dz <= 0.0);
        else
            xassert(mip != mip);
        /* compute the new objective value in the adjacent basis:
         new z = old z + delta z */
        if (kase < 0)
            dn = mip.obj_val + dz;
        else
            up = mip.obj_val + dz;
    }
    callback(dn, up);
    /*xprintf("obj = %g; dn = %g; up = %g",
     mip.obj_val, *dn, *up);*/
}

function ios_round_bound(tree, bound){
    var mip = tree.mip;
    var n = mip.n;
    var d, j, nn;
    var c = tree.iwrk;
    var s, h;
    /* determine c[j] and compute s */
    nn = 0; s = mip.c0; d = 0;
    for (j = 1; j <= n; j++)
    {  var col = mip.col[j];
        if (col.coef == 0.0) continue;
        if (col.type == GLP_FX)
        {  /* fixed variable */
            s += col.coef * col.prim;
        }
        else
        {  /* non-fixed variable */
            if (col.kind != GLP_IV) return bound;
            if (col.coef != Math.floor(col.coef)) return bound;
            if (Math.abs(col.coef) <= INT_MAX)
                c[++nn] = Math.abs(col.coef)|0;
            else
                d = 1;
        }
    }
    /* compute d = gcd(c[1],...c[nn]) */
    if (d == 0)
    {  if (nn == 0) return bound;
        d = gcdn(nn, c);
    }
    xassert(d > 0);
    /* compute new local bound */
    if (mip.dir == GLP_MIN)
    {  if (bound != +DBL_MAX)
    {  h = (bound - s) / d;
        if (h >= Math.floor(h) + 0.001)
        {  /* round up */
            h = Math.ceil(h);
            /*xprintf("d = %d; old = %g; ", d, bound);*/
            bound = d * h + s;
            /*xprintf("new = %g", bound);*/
        }
    }
    }
    else if (mip.dir == GLP_MAX)
    {  if (bound != -DBL_MAX)
    {  h = (bound - s) / d;
        if (h <= Math.ceil(h) - 0.001)
        {  /* round down */
            h = Math.floor(h);
            bound = d * h + s;
        }
    }
    }
    else
        xassert(mip != mip);
    return bound;
}

function ios_is_hopeful(tree, bound){
    var mip = tree.mip;
    var ret = 1;
    var eps;
    if (mip.mip_stat == GLP_FEAS)
    {  eps = tree.parm.tol_obj * (1.0 + Math.abs(mip.mip_obj));
        switch (mip.dir)
        {  case GLP_MIN:
            if (bound >= mip.mip_obj - eps) ret = 0;
            break;
            case GLP_MAX:
                if (bound <= mip.mip_obj + eps) ret = 0;
                break;
            default:
                xassert(mip != mip);
        }
    }
    else
    {  switch (mip.dir)
    {  case GLP_MIN:
            if (bound == +DBL_MAX) ret = 0;
            break;
        case GLP_MAX:
            if (bound == -DBL_MAX) ret = 0;
            break;
        default:
            xassert(mip != mip);
    }
    }
    return ret;
}

function ios_best_node(tree){
    var node, best = null;
    switch (tree.mip.dir)
    {  case GLP_MIN:
        /* minimization */
        for (node = tree.head; node != null; node = node.next)
            if (best == null || best.bound > node.bound)
                best = node;
        break;
        case GLP_MAX:
            /* maximization */
            for (node = tree.head; node != null; node = node.next)
                if (best == null || best.bound < node.bound)
                    best = node;
            break;
        default:
            xassert(tree != tree);
    }
    return best == null ? 0 : best.p;
}

var ios_relative_gap = exports['glp_ios_relative_gap'] = function(tree){
    var mip = tree.mip;
    var p;
    var best_mip, best_bnd, gap;
    if (mip.mip_stat == GLP_FEAS)
    {  best_mip = mip.mip_obj;
        p = ios_best_node(tree);
        if (p == 0)
        {  /* the tree is empty */
            gap = 0.0;
        }
        else
        {  best_bnd = tree.slot[p].node.bound;
            gap = Math.abs(best_mip - best_bnd) / (Math.abs(best_mip) +
                DBL_EPSILON);
        }
    }
    else
    {  /* no integer feasible solution has been found yet */
        gap = DBL_MAX;
    }
    return gap;
};

function ios_solve_node(tree){
    var mip = tree.mip;
    var ret;
    /* the current subproblem must exist */
    xassert(tree.curr != null);
    /* set some control parameters */
    var parm = new SMCP();
    // glp_init_smcp(parm);
    switch (tree.parm.msg_lev)
    {  case GLP_MSG_OFF:
        parm.msg_lev = GLP_MSG_OFF; break;
        case GLP_MSG_ERR:
            parm.msg_lev = GLP_MSG_ERR; break;
        case GLP_MSG_ON:
        case GLP_MSG_ALL:
            parm.msg_lev = GLP_MSG_ON; break;
        case GLP_MSG_DBG:
            parm.msg_lev = GLP_MSG_ALL; break;
        default:
            xassert(tree != tree);
    }
    parm.meth = GLP_DUALP;
    if (tree.parm.msg_lev < GLP_MSG_DBG)
        parm.out_dly = tree.parm.out_dly;
    else
        parm.out_dly = 0;
    /* if the incumbent objective value is already known, use it to
     prematurely terminate the dual simplex search */
    if (mip.mip_stat == GLP_FEAS)
    {  switch (tree.mip.dir)
    {  case GLP_MIN:
            parm.obj_ul = mip.mip_obj;
            break;
        case GLP_MAX:
            parm.obj_ll = mip.mip_obj;
            break;
        default:
            xassert(mip != mip);
    }
    }
    /* try to solve/re-optimize the LP relaxation */
    ret = glp_simplex(mip, parm);
    tree.curr.solved++;
    return ret;
}

function ios_create_pool(tree){
    /* create cut pool */
    xassert(tree == tree);
    var pool = {};
    pool.size = 0;
    pool.head = pool.tail = null;
    pool.ord = 0; pool.curr = null;
    return pool;
}

function ios_add_row(tree, pool, name, klass, flags, len, ind, val, type, rhs){
    /* add row (constraint) to the cut pool */
    var cut, aij, k;
    xassert(pool != null);
    cut = {};
    if (name == null || name[0] == '\0')
        cut.name = null;
    else
    {
        cut.name = name;
    }
    if (!(0 <= klass && klass <= 255))
        xerror("glp_ios_add_row: klass = " + klass + "; invalid cut class");
    cut.klass = klass;
    if (flags != 0)
        xerror("glp_ios_add_row: flags = " + flags + "; invalid cut flags");
    cut.ptr = null;
    if (!(0 <= len && len <= tree.n))
        xerror("glp_ios_add_row: len = " + len + "; invalid cut length");
    for (k = 1; k <= len; k++)
    {  aij = {};
        if (!(1 <= ind[k] && ind[k] <= tree.n))
            xerror("glp_ios_add_row: ind[" + k + "] = " + ind[k] + "; column index out of range");
        aij.j = ind[k];
        aij.val = val[k];
        aij.next = cut.ptr;
        cut.ptr = aij;
    }
    if (!(type == GLP_LO || type == GLP_UP || type == GLP_FX))
        xerror("glp_ios_add_row: type = " + type + "; invalid cut type");
    cut.type = type;
    cut.rhs = rhs;
    cut.prev = pool.tail;
    cut.next = null;
    if (cut.prev == null)
        pool.head = cut;
    else
        cut.prev.next = cut;
    pool.tail = cut;
    pool.size++;
    return pool.size;
}

function ios_find_row(pool, i){
    /* find row (constraint) in the cut pool */
    /* (smart linear search) */
    xassert(pool != null);
    xassert(1 <= i && i <= pool.size);
    if (pool.ord == 0)
    {  xassert(pool.curr == null);
        pool.ord = 1;
        pool.curr = pool.head;
    }
    xassert(pool.curr != null);
    if (i < pool.ord)
    {  if (i < pool.ord - i)
    {  pool.ord = 1;
        pool.curr = pool.head;
        while (pool.ord != i)
        {  pool.ord++;
            xassert(pool.curr != null);
            pool.curr = pool.curr.next;
        }
    }
    else
    {  while (pool.ord != i)
    {  pool.ord--;
        xassert(pool.curr != null);
        pool.curr = pool.curr.prev;
    }
    }
    }
    else if (i > pool.ord)
    {  if (i - pool.ord < pool.size - i)
    {  while (pool.ord != i)
    {  pool.ord++;
        xassert(pool.curr != null);
        pool.curr = pool.curr.next;
    }
    }
    else
    {  pool.ord = pool.size;
        pool.curr = pool.tail;
        while (pool.ord != i)
        {  pool.ord--;
            xassert(pool.curr != null);
            pool.curr = pool.curr.prev;
        }
    }
    }
    xassert(pool.ord == i);
    xassert(pool.curr != null);
    return pool.curr;
}

function ios_del_row(pool, i){
    /* remove row (constraint) from the cut pool */
    var cut, aij;
    xassert(pool != null);
    if (!(1 <= i && i <= pool.size))
        xerror("glp_ios_del_row: i = " + i + "; cut number out of range");
    cut = ios_find_row(pool, i);
    xassert(pool.curr == cut);
    if (cut.next != null)
        pool.curr = cut.next;
    else if (cut.prev != null){
        pool.ord--; pool.curr = cut.prev;
    }
    else {
        pool.ord = 0; pool.curr = null;
    }
    if (cut.prev == null)
    {  xassert(pool.head == cut);
        pool.head = cut.next;
    }
    else
    {  xassert(cut.prev.next == cut);
        cut.prev.next = cut.next;
    }
    if (cut.next == null)
    {  xassert(pool.tail == cut);
        pool.tail = cut.prev;
    }
    else
    {  xassert(cut.next.prev == cut);
        cut.next.prev = cut.prev;
    }
    while (cut.ptr != null)
    {  aij = cut.ptr;
        cut.ptr = aij.next;
    }
    pool.size--;

}

function ios_clear_pool(pool){
    /* remove all rows (constraints) from the cut pool */
    xassert(pool != null);
    while (pool.head != null)
    {  var cut = pool.head;
        pool.head = cut.next;
        while (cut.ptr != null)
        {  var aij = cut.ptr;
            cut.ptr = aij.next;
        }
    }
    pool.size = 0;
    pool.head = pool.tail = null;
    pool.ord = 0;
    pool.curr = null;
}

function ios_delete_pool(pool){
    /* delete cut pool */
    xassert(pool != null);
    ios_clear_pool(pool);
}

