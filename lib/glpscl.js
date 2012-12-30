var glp_scale_prob = exports["glp_scale_prob"] = function(lp, flags){
    function min_row_aij(lp, i, scaled){
        var aij;
        var min_aij, temp;
        xassert(1 <= i && i <= lp.m);
        min_aij = 1.0;
        for (aij = lp.row[i].ptr; aij != null; aij = aij.r_next)
        {  temp = Math.abs(aij.val);
            if (scaled) temp *= (aij.row.rii * aij.col.sjj);
            if (aij.r_prev == null || min_aij > temp)
                min_aij = temp;
        }
        return min_aij;
    }

    function max_row_aij(lp, i, scaled){
        var aij;
        var max_aij, temp;
        xassert(1 <= i && i <= lp.m);
        max_aij = 1.0;
        for (aij = lp.row[i].ptr; aij != null; aij = aij.r_next)
        {  temp = Math.abs(aij.val);
            if (scaled) temp *= (aij.row.rii * aij.col.sjj);
            if (aij.r_prev == null || max_aij < temp)
                max_aij = temp;
        }
        return max_aij;
    }

    function min_col_aij(lp, j, scaled){
        var aij;
        var min_aij, temp;
        xassert(1 <= j && j <= lp.n);
        min_aij = 1.0;
        for (aij = lp.col[j].ptr; aij != null; aij = aij.c_next)
        {  temp = Math.abs(aij.val);
            if (scaled) temp *= (aij.row.rii * aij.col.sjj);
            if (aij.c_prev == null || min_aij > temp)
                min_aij = temp;
        }
        return min_aij;
    }

    function max_col_aij(lp, j, scaled){
        var aij;
        var max_aij, temp;
        xassert(1 <= j && j <= lp.n);
        max_aij = 1.0;
        for (aij = lp.col[j].ptr; aij != null; aij = aij.c_next)
        {  temp = Math.abs(aij.val);
            if (scaled) temp *= (aij.row.rii * aij.col.sjj);
            if (aij.c_prev == null || max_aij < temp)
                max_aij = temp;
        }
        return max_aij;
    }

    function min_mat_aij(lp, scaled){
        var i;
        var min_aij, temp;
        min_aij = 1.0;
        for (i = 1; i <= lp.m; i++)
        {  temp = min_row_aij(lp, i, scaled);
            if (i == 1 || min_aij > temp)
                min_aij = temp;
        }
        return min_aij;
    }

    function max_mat_aij(lp, scaled){
        var i;
        var max_aij, temp;
        max_aij = 1.0;
        for (i = 1; i <= lp.m; i++)
        {  temp = max_row_aij(lp, i, scaled);
            if (i == 1 || max_aij < temp)
                max_aij = temp;
        }
        return max_aij;
    }

    function eq_scaling(lp, flag){
        var i, j, pass;
        var temp;
        xassert(flag == 0 || flag == 1);
        for (pass = 0; pass <= 1; pass++)
        {  if (pass == flag)
        {  /* scale rows */
            for (i = 1; i <= lp.m; i++)
            {  temp = max_row_aij(lp, i, 1);
                glp_set_rii(lp, i, glp_get_rii(lp, i) / temp);
            }
        }
        else
        {  /* scale columns */
            for (j = 1; j <= lp.n; j++)
            {  temp = max_col_aij(lp, j, 1);
                glp_set_sjj(lp, j, glp_get_sjj(lp, j) / temp);
            }
        }
        }
    }

    function gm_scaling(lp, flag){
        var i, j, pass;
        var temp;
        xassert(flag == 0 || flag == 1);
        for (pass = 0; pass <= 1; pass++)
        {  if (pass == flag)
        {  /* scale rows */
            for (i = 1; i <= lp.m; i++)
            {  temp = min_row_aij(lp, i, 1) * max_row_aij(lp, i, 1);
                glp_set_rii(lp, i, glp_get_rii(lp, i) / Math.sqrt(temp));
            }
        }
        else
        {  /* scale columns */
            for (j = 1; j <= lp.n; j++)
            {  temp = min_col_aij(lp, j, 1) * max_col_aij(lp, j, 1);
                glp_set_sjj(lp, j, glp_get_sjj(lp, j) / Math.sqrt(temp));
            }
        }
        }
    }

    function max_row_ratio(lp){
        var i;
        var ratio, temp;
        ratio = 1.0;
        for (i = 1; i <= lp.m; i++)
        {  temp = max_row_aij(lp, i, 1) / min_row_aij(lp, i, 1);
            if (i == 1 || ratio < temp) ratio = temp;
        }
        return ratio;
    }

    function max_col_ratio(lp){
        var j;
        var ratio, temp;
        ratio = 1.0;
        for (j = 1; j <= lp.n; j++)
        {  temp = max_col_aij(lp, j, 1) / min_col_aij(lp, j, 1);
            if (j == 1 || ratio < temp) ratio = temp;
        }
        return ratio;
    }

    function gm_iterate(lp, it_max, tau){
        var k, flag;
        var ratio = 0.0, r_old;
        /* if the scaling "quality" for rows is better than for columns,
         the rows are scaled first; otherwise, the columns are scaled
         first */
        flag = (max_row_ratio(lp) > max_col_ratio(lp));
        for (k = 1; k <= it_max; k++)
        {  /* save the scaling "quality" from previous iteration */
            r_old = ratio;
            /* determine the current scaling "quality" */
            ratio = max_mat_aij(lp, 1) / min_mat_aij(lp, 1);
            /* if improvement is not enough, terminate scaling */
            if (k > 1 && ratio > tau * r_old) break;
            /* otherwise, perform another iteration */
            gm_scaling(lp, flag);
        }
    }

    function scale_prob(lp, flags){

        function fmt(a, b, c, d){
            return a + ": min|aij| = " + b + "  max|aij| = " + c + "  ratio = " + d + ""
        }

        var min_aij, max_aij, ratio;
        xprintf("Scaling...");
        /* cancel the current scaling effect */
        glp_unscale_prob(lp);
        /* report original scaling "quality" */
        min_aij = min_mat_aij(lp, 1);
        max_aij = max_mat_aij(lp, 1);
        ratio = max_aij / min_aij;
        xprintf(fmt(" A", min_aij, max_aij, ratio));
        /* check if the problem is well scaled */
        if (min_aij >= 0.10 && max_aij <= 10.0)
        {  xprintf("Problem data seem to be well scaled");
            /* skip scaling, if required */
            if (flags & GLP_SF_SKIP) return;
        }
        /* perform iterative geometric mean scaling, if required */
        if (flags & GLP_SF_GM)
        {  gm_iterate(lp, 15, 0.90);
            min_aij = min_mat_aij(lp, 1);
            max_aij = max_mat_aij(lp, 1);
            ratio = max_aij / min_aij;
            xprintf(fmt("GM", min_aij, max_aij, ratio));
        }
        /* perform equilibration scaling, if required */
        if (flags & GLP_SF_EQ)
        {  eq_scaling(lp, max_row_ratio(lp) > max_col_ratio(lp));
            min_aij = min_mat_aij(lp, 1);
            max_aij = max_mat_aij(lp, 1);
            ratio = max_aij / min_aij;
            xprintf(fmt("EQ", min_aij, max_aij, ratio));
        }
        /* round scale factors to nearest power of two, if required */
        if (flags & GLP_SF_2N)
        {  var i, j;
            for (i = 1; i <= lp.m; i++)
                glp_set_rii(lp, i, round2n(glp_get_rii(lp, i)));
            for (j = 1; j <= lp.n; j++)
                glp_set_sjj(lp, j, round2n(glp_get_sjj(lp, j)));
            min_aij = min_mat_aij(lp, 1);
            max_aij = max_mat_aij(lp, 1);
            ratio = max_aij / min_aij;
            xprintf(fmt("2N", min_aij, max_aij, ratio));
        }
    }


    if (flags & ~(GLP_SF_GM | GLP_SF_EQ | GLP_SF_2N | GLP_SF_SKIP | GLP_SF_AUTO))
        xerror("glp_scale_prob: flags = " + flags + "; invalid scaling options");
    if (flags & GLP_SF_AUTO)
        flags = (GLP_SF_GM | GLP_SF_EQ | GLP_SF_SKIP);
    scale_prob(lp, flags);
};

