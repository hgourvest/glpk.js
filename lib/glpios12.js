
function ios_choose_node(T){
    function most_feas(T){
        /* select subproblem whose parent has minimal sum of integer
         infeasibilities */
        var node;
        var p;
        var best;
        p = 0; best = DBL_MAX;
        for (node = T.head; node != null; node = node.next)
        {  xassert(node.up != null);
            if (best > node.up.ii_sum){
                p = node.p; best = node.up.ii_sum;
            }
        }
        return p;
    }

    function best_proj(T){
        /* select subproblem using the best projection heuristic */
        var root, node;
        var p;
        var best, deg, obj;
        /* the global bound must exist */
        xassert(T.mip.mip_stat == GLP_FEAS);
        /* obtain pointer to the root node, which must exist */
        root = T.slot[1].node;
        xassert(root != null);
        /* deg estimates degradation of the objective function per unit
         of the sum of integer infeasibilities */
        xassert(root.ii_sum > 0.0);
        deg = (T.mip.mip_obj - root.bound) / root.ii_sum;
        /* nothing has been selected so far */
        p = 0; best = DBL_MAX;
        /* walk through the list of active subproblems */
        for (node = T.head; node != null; node = node.next)
        {  xassert(node.up != null);
            /* obj estimates optimal objective value if the sum of integer
             infeasibilities were zero */
            obj = node.up.bound + deg * node.up.ii_sum;
            if (T.mip.dir == GLP_MAX) obj = - obj;
            /* select the subproblem which has the best estimated optimal
             objective value */
            if (best > obj){p = node.p; best = obj}
        }
        return p;
    }

    function best_node(T){
        /* select subproblem with best local bound */
        var node, best = null;
        var bound, eps;
        switch (T.mip.dir)
        {  case GLP_MIN:
            bound = +DBL_MAX;
            for (node = T.head; node != null; node = node.next)
                if (bound > node.bound) bound = node.bound;
            xassert(bound != +DBL_MAX);
            eps = 0.001 * (1.0 + Math.abs(bound));
            for (node = T.head; node != null; node = node.next)
            {  if (node.bound <= bound + eps)
            {  xassert(node.up != null);
                if (best == null ||
                    best.up.ii_sum > node.up.ii_sum) best = node;
            }
            }
            break;
            case GLP_MAX:
                bound = -DBL_MAX;
                for (node = T.head; node != null; node = node.next)
                    if (bound < node.bound) bound = node.bound;
                xassert(bound != -DBL_MAX);
                eps = 0.001 * (1.0 + Math.abs(bound));
                for (node = T.head; node != null; node = node.next)
                {  if (node.bound >= bound - eps)
                {  xassert(node.up != null);
                    if (best == null ||
                        best.lp_obj < node.lp_obj) best = node;
                }
                }
                break;
            default:
                xassert(T != T);
        }
        xassert(best != null);
        return best.p;
    }

    var p;
    if (T.parm.bt_tech == GLP_BT_DFS)
    {  /* depth first search */
        xassert(T.tail != null);
        p = T.tail.p;
    }
    else if (T.parm.bt_tech == GLP_BT_BFS)
    {  /* breadth first search */
        xassert(T.head != null);
        p = T.head.p;
    }
    else if (T.parm.bt_tech == GLP_BT_BLB)
    {  /* select node with best local bound */
        p = best_node(T);
    }
    else if (T.parm.bt_tech == GLP_BT_BPH)
    {  if (T.mip.mip_stat == GLP_UNDEF)
    {  /* "most integer feasible" subproblem */
        p = most_feas(T);
    }
    else
    {  /* best projection heuristic */
        p = best_proj(T);
    }
    }
    else
        xassert(T != T);
    return p;
}

