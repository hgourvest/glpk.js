
function lpx_create_cog(lp){
    const MAX_NB = 4000;
    const MAX_ROW_LEN = 500;

    function get_row_lb(lp, i){
        /* this routine returns lower bound of row i or -DBL_MAX if the
         row has no lower bound */
        var lb;
        switch (lpx_get_row_type(lp, i))
        {  case LPX_FR:
            case LPX_UP:
                lb = -DBL_MAX;
                break;
            case LPX_LO:
            case LPX_DB:
            case LPX_FX:
                lb = lpx_get_row_lb(lp, i);
                break;
            default:
                xassert(lp != lp);
        }
        return lb;
    }

    function get_row_ub(lp, i){
        /* this routine returns upper bound of row i or +DBL_MAX if the
         row has no upper bound */
        var ub;
        switch (lpx_get_row_type(lp, i))
        {  case LPX_FR:
            case LPX_LO:
                ub = +DBL_MAX;
                break;
            case LPX_UP:
            case LPX_DB:
            case LPX_FX:
                ub = lpx_get_row_ub(lp, i);
                break;
            default:
                xassert(lp != lp);
        }
        return ub;
    }

    function get_col_lb(lp, j){
        /* this routine returns lower bound of column j or -DBL_MAX if
         the column has no lower bound */
        var lb;
        switch (lpx_get_col_type(lp, j))
        {  case LPX_FR:
            case LPX_UP:
                lb = -DBL_MAX;
                break;
            case LPX_LO:
            case LPX_DB:
            case LPX_FX:
                lb = lpx_get_col_lb(lp, j);
                break;
            default:
                xassert(lp != lp);
        }
        return lb;
    }

    function get_col_ub(lp, j){
        /* this routine returns upper bound of column j or +DBL_MAX if
         the column has no upper bound */
        var ub;
        switch (lpx_get_col_type(lp, j))
        {  case LPX_FR:
            case LPX_LO:
                ub = +DBL_MAX;
                break;
            case LPX_UP:
            case LPX_DB:
            case LPX_FX:
                ub = lpx_get_col_ub(lp, j);
                break;
            default:
                xassert(lp != lp);
        }
        return ub;
    }

    function is_binary(lp, j){
        /* this routine checks if variable x[j] is binary */
        return lpx_get_col_kind(lp, j) == LPX_IV &&
            lpx_get_col_type(lp, j) == LPX_DB &&
            lpx_get_col_lb(lp, j) == 0.0 && lpx_get_col_ub(lp, j) == 1.0;
    }

    function eval_lf_min(lp, len, ind, val){
        /* this routine computes the minimum of a specified linear form

         sum a[j]*x[j]
         j

         using the formula:

         min =   sum   a[j]*lb[j] +   sum   a[j]*ub[j],
         j in J+              j in J-

         where J+ = {j: a[j] > 0}, J- = {j: a[j] < 0}, lb[j] and ub[j]
         are lower and upper bound of variable x[j], resp. */
        var j, t;
        var lb, ub, sum;
        sum = 0.0;
        for (t = 1; t <= len; t++)
        {  j = ind[t];
            if (val[t] > 0.0)
            {  lb = get_col_lb(lp, j);
                if (lb == -DBL_MAX)
                {  sum = -DBL_MAX;
                    break;
                }
                sum += val[t] * lb;
            }
            else if (val[t] < 0.0)
            {  ub = get_col_ub(lp, j);
                if (ub == +DBL_MAX)
                {  sum = -DBL_MAX;
                    break;
                }
                sum += val[t] * ub;
            }
            else
                xassert(val != val);
        }
        return sum;
    }

    function eval_lf_max(lp, len, ind, val){
        /* this routine computes the maximum of a specified linear form

         sum a[j]*x[j]
         j

         using the formula:

         max =   sum   a[j]*ub[j] +   sum   a[j]*lb[j],
         j in J+              j in J-

         where J+ = {j: a[j] > 0}, J- = {j: a[j] < 0}, lb[j] and ub[j]
         are lower and upper bound of variable x[j], resp. */
        var j, t;
        var lb, ub, sum;
        sum = 0.0;
        for (t = 1; t <= len; t++)
        {  j = ind[t];
            if (val[t] > 0.0)
            {  ub = get_col_ub(lp, j);
                if (ub == +DBL_MAX)
                {  sum = +DBL_MAX;
                    break;
                }
                sum += val[t] * ub;
            }
            else if (val[t] < 0.0)
            {  lb = get_col_lb(lp, j);
                if (lb == -DBL_MAX)
                {  sum = +DBL_MAX;
                    break;
                }
                sum += val[t] * lb;
            }
            else
                xassert(val != val);
        }
        return sum;
    }

    function probing(len, val, L, U, lf_min, lf_max, p, set, q){
        var temp;
        xassert(1 <= p && p < q && q <= len);
        /* compute L' (3) */
        if (L != -DBL_MAX && set) L -= val[p];
        /* compute U' (4) */
        if (U != +DBL_MAX && set) U -= val[p];
        /* compute MIN (9) */
        if (lf_min != -DBL_MAX)
        {  if (val[p] < 0.0) lf_min -= val[p];
            if (val[q] < 0.0) lf_min -= val[q];
        }
        /* compute MAX (10) */
        if (lf_max != +DBL_MAX)
        {  if (val[p] > 0.0) lf_max -= val[p];
            if (val[q] > 0.0) lf_max -= val[q];
        }
        /* compute implied lower bound of x[q]; see (7), (8) */
        if (val[q] > 0.0)
        {  if (L == -DBL_MAX || lf_max == +DBL_MAX)
            temp = -DBL_MAX;
        else
            temp = (L - lf_max) / val[q];
        }
        else
        {  if (U == +DBL_MAX || lf_min == -DBL_MAX)
            temp = -DBL_MAX;
        else
            temp = (U - lf_min) / val[q];
        }
        if (temp > 0.001) return 2;
        /* compute implied upper bound of x[q]; see (7), (8) */
        if (val[q] > 0.0)
        {  if (U == +DBL_MAX || lf_min == -DBL_MAX)
            temp = +DBL_MAX;
        else
            temp = (U - lf_min) / val[q];
        }
        else
        {  if (L == -DBL_MAX || lf_max == +DBL_MAX)
            temp = +DBL_MAX;
        else
            temp = (L - lf_max) / val[q];
        }
        if (temp < 0.999) return 1;
        /* there is no logical relation between x[p] and x[q] */
        return 0;
    }

    var cog = null;
    var m, n, nb, i, j, p, q, len, ind, vert, orig;
    var L, U, lf_min, lf_max, val;
    xprintf("Creating the conflict graph...");
    m = lpx_get_num_rows(lp);
    n = lpx_get_num_cols(lp);
    /* determine which binary variables should be included in the
     conflict graph */
    nb = 0;
    vert = new Array(1+n);
    for (j = 1; j <= n; j++) vert[j] = 0;
    orig = new Array(1+n);
    ind = new Array(1+n);
    val = new Array(1+n);
    for (i = 1; i <= m; i++)
    {  L = get_row_lb(lp, i);
        U = get_row_ub(lp, i);
        if (L == -DBL_MAX && U == +DBL_MAX) continue;
        len = lpx_get_mat_row(lp, i, ind, val);
        if (len > MAX_ROW_LEN) continue;
        lf_min = eval_lf_min(lp, len, ind, val);
        lf_max = eval_lf_max(lp, len, ind, val);
        for (p = 1; p <= len; p++)
        {  if (!is_binary(lp, ind[p])) continue;
            for (q = p+1; q <= len; q++)
            {  if (!is_binary(lp, ind[q])) continue;
                if (probing(len, val, L, U, lf_min, lf_max, p, 0, q) ||
                    probing(len, val, L, U, lf_min, lf_max, p, 1, q))
                {  /* there is a logical relation */
                    /* include the first variable in the graph */
                    j = ind[p];
                    if (vert[j] == 0) {nb++; vert[j] = nb; orig[nb] = j}
                    /* incude the second variable in the graph */
                    j = ind[q];
                    if (vert[j] == 0) {nb++; vert[j] = nb; orig[nb] = j}
                }
            }
        }
    }
    /* if the graph is either empty or has too many vertices, do not
     create it */
    if (nb == 0 || nb > MAX_NB)
    {  xprintf("The conflict graph is either empty or too big");
       return cog;
    }
    /* create the conflict graph */
    cog = {};
    cog.n = n;
    cog.nb = nb;
    cog.ne = 0;
    cog.vert = vert;
    cog.orig = orig;
    len = nb + nb; /* number of vertices */
    len = (len * (len - 1)) / 2; /* number of entries in triangle */
    len = (len + (CHAR_BIT - 1)) / CHAR_BIT; /* bytes needed */
    cog.a = new Array(len);
    xfillArr(cog.a, 0, 0, len);
    for (j = 1; j <= nb; j++)
    {  /* add edge between variable and its complement */
        lpx_add_cog_edge(cog, +orig[j], -orig[j]);
    }
    for (i = 1; i <= m; i++)
    {  L = get_row_lb(lp, i);
        U = get_row_ub(lp, i);
        if (L == -DBL_MAX && U == +DBL_MAX) continue;
        len = lpx_get_mat_row(lp, i, ind, val);
        if (len > MAX_ROW_LEN) continue;
        lf_min = eval_lf_min(lp, len, ind, val);
        lf_max = eval_lf_max(lp, len, ind, val);
        for (p = 1; p <= len; p++)
        {  if (!is_binary(lp, ind[p])) continue;
            for (q = p+1; q <= len; q++)
            {  if (!is_binary(lp, ind[q])) continue;
                /* set x[p] to 0 and examine x[q] */
                switch (probing(len, val, L, U, lf_min, lf_max, p, 0, q))
                {  case 0:
                    /* no logical relation */
                    break;
                    case 1:
                        /* x[p] = 0 implies x[q] = 0 */
                        lpx_add_cog_edge(cog, -ind[p], +ind[q]);
                        break;
                    case 2:
                        /* x[p] = 0 implies x[q] = 1 */
                        lpx_add_cog_edge(cog, -ind[p], -ind[q]);
                        break;
                    default:
                        xassert(lp != lp);
                }
                /* set x[p] to 1 and examine x[q] */
                switch (probing(len, val, L, U, lf_min, lf_max, p, 1, q))
                {  case 0:
                    /* no logical relation */
                    break;
                    case 1:
                        /* x[p] = 1 implies x[q] = 0 */
                        lpx_add_cog_edge(cog, +ind[p], +ind[q]);
                        break;
                    case 2:
                        /* x[p] = 1 implies x[q] = 1 */
                        lpx_add_cog_edge(cog, +ind[p], -ind[q]);
                        break;
                    default:
                        xassert(lp != lp);
                }
            }
        }
    }
    xprintf("The conflict graph has 2*" + cog.nb + " vertices and " + cog.ne + " edges");
    return cog;
}

function lpx_add_cog_edge(cog, i, j){
    var k;
    xassert(i != j);
    /* determine indices of corresponding vertices */
    if (i > 0)
    {  xassert(1 <= i && i <= cog.n);
        i = cog.vert[i];
        xassert(i != 0);
    }
    else
    {  i = -i;
        xassert(1 <= i && i <= cog.n);
        i = cog.vert[i];
        xassert(i != 0);
        i += cog.nb;
    }
    if (j > 0)
    {  xassert(1 <= j && j <= cog.n);
        j = cog.vert[j];
        xassert(j != 0);
    }
    else
    {  j = -j;
        xassert(1 <= j && j <= cog.n);
        j = cog.vert[j];
        xassert(j != 0);
        j += cog.nb;
    }
    /* only lower triangle is stored, so we need i > j */
    if (i < j){k = i; i = j; j = k}
    k = ((i - 1) * (i - 2)) / 2 + (j - 1);
    cog.a[k / CHAR_BIT] |=
        (1 << ((CHAR_BIT - 1) - k % CHAR_BIT));
    cog.ne++;
}

function lpx_clique_cut(lp, cog, ind, val){

    function is_edge(dsa, i, j) { return i == j ? 0 : i > j ? is_edge1(dsa, i, j) : is_edge1(dsa, j, i)}
    function is_edge1(dsa, i, j) {return is_edge2(dsa, (i * (i - 1)) / 2 + j)}
    function is_edge2(dsa, k){return (dsa.a[k / CHAR_BIT] & (1 << ((CHAR_BIT - 1) - k % CHAR_BIT)))}

    function sub(dsa, ct, table, level, weight, l_weight){
        var i, j, k, curr_weight, left_weight, p1, p2, newtable;
        newtable = new Array(dsa.n);
        if (ct <= 0)
        {  /* 0 or 1 elements left; include these */
            if (ct == 0)
            {  dsa.set[level++] = table[0];
                weight += l_weight;
            }
            if (weight > dsa.record)
            {  dsa.record = weight;
                dsa.rec_level = level;
                for (i = 0; i < level; i++) dsa.rec[i+1] = dsa.set[i];
            }
            return;
        }
        for (i = ct; i >= 0; i--)
        {  if ((level == 0) && (i < ct)) return;
            k = table[i];
            if ((level > 0) && (dsa.clique[k] <= (dsa.record - weight)))
                return; /* prune */
            dsa.set[level] = k;
            curr_weight = weight + dsa.wt[k+1];
            l_weight -= dsa.wt[k+1];
            if (l_weight <= (dsa.record - curr_weight))
                return; /* prune */
            p1 = 0;
            p2 = 0;
            left_weight = 0;
            while (p2 < table + i)
            {  j = table[p2]; p2++;
                if (is_edge(dsa, j, k))
                {  newtable[p1] = j; p1++;
                    left_weight += dsa.wt[j+1];
                }
            }
            if (left_weight <= (dsa.record - curr_weight)) continue;
            sub(dsa, p1 - 1, newtable, level + 1, curr_weight, left_weight);
        }
    }

    function wclique(_n, w, _a, sol){
        var dsa = {};
        var i, j, p, max_wt, max_nwt, wth, used, nwt, pos;
        var timer;
        dsa.n = _n;
        dsa.wt = w;
        dsa.a = _a;
        dsa.record = 0;
        dsa.rec_level = 0;
        dsa.rec = sol;
        dsa.clique = new Array(dsa.n);
        dsa.set = new Array(dsa.n);
        used = new Array(dsa.n);
        nwt = new Array(dsa.n);
        pos = new Array(dsa.n);
        /* start timer */
        timer = xtime();
        /* order vertices */
        for (i = 0; i < dsa.n; i++)
        {  nwt[i] = 0;
            for (j = 0; j < dsa.n; j++)
                if (is_edge(dsa, i, j)) nwt[i] += dsa.wt[j+1];
        }
        for (i = 0; i < dsa.n; i++)
            used[i] = 0;
        for (i = dsa.n-1; i >= 0; i--)
        {  max_wt = -1;
            max_nwt = -1;
            for (j = 0; j < dsa.n; j++)
            {  if ((!used[j]) && ((dsa.wt[j+1] > max_wt) || (dsa.wt[j+1] == max_wt
                && nwt[j] > max_nwt)))
            {  max_wt = dsa.wt[j+1];
                max_nwt = nwt[j];
                p = j;
            }
            }
            pos[i] = p;
            used[p] = 1;
            for (j = 0; j < dsa.n; j++)
                if ((!used[j]) && (j != p) && (is_edge(dsa, p, j)))
                    nwt[j] -= dsa.wt[p+1];
        }
        /* main routine */
        wth = 0;
        for (i = 0; i < dsa.n; i++)
        {  wth += dsa.wt[pos[i]+1];
            sub(dsa, i, pos, 0, 0, wth);
            dsa.clique[pos[i]] = dsa.record;
            if (xdifftime(xtime(), timer) >= 5.0 - 0.001)
            {  /* print current record and reset timer */
                xprintf("level = " + i+1 + " (" + dsa.n + "); best = " + dsa.record + "");
                timer = xtime();
            }
        }
        /* return the solution found */
        for (i = 1; i <= dsa.rec_level; i++) sol[i]++;
        return dsa.rec_level;
    }

    var n = lpx_get_num_cols(lp);
    var j, t, v, card, temp, len = 0, w, sol;
    var x, sum, b, vec;
    /* allocate working arrays */
    w = new Array(1 + 2 * cog.nb);
    sol = new Array(1 + 2 * cog.nb);
    vec = new Array(1+n);
    /* assign weights to vertices of the conflict graph */
    for (t = 1; t <= cog.nb; t++)
    {  j = cog.orig[t];
        x = lpx_get_col_prim(lp, j);
        temp = (100.0 * x + 0.5);
        if (temp < 0) temp = 0;
        if (temp > 100) temp = 100;
        w[t] = temp;
        w[cog.nb + t] = 100 - temp;
    }
    /* find a clique of maximum weight */
    card = wclique(2 * cog.nb, w, cog.a, sol);
    /* compute the clique weight for unscaled values */
    sum = 0.0;
    for ( t = 1; t <= card; t++)
    {  v = sol[t];
        xassert(1 <= v && v <= 2 * cog.nb);
        if (v <= cog.nb)
        {  /* vertex v corresponds to binary variable x[j] */
            j = cog.orig[v];
            x = lpx_get_col_prim(lp, j);
            sum += x;
        }
        else
        {  /* vertex v corresponds to the complement of x[j] */
            j = cog.orig[v - cog.nb];
            x = lpx_get_col_prim(lp, j);
            sum += 1.0 - x;
        }
    }
    /* if the sum of binary variables and their complements in the
     clique greater than 1, the clique cut is violated */
    if (sum >= 1.01)
    {  /* construct the inquality */
        for (j = 1; j <= n; j++) vec[j] = 0;
        b = 1.0;
        for (t = 1; t <= card; t++)
        {  v = sol[t];
            if (v <= cog.nb)
            {  /* vertex v corresponds to binary variable x[j] */
                j = cog.orig[v];
                xassert(1 <= j && j <= n);
                vec[j] += 1.0;
            }
            else
            {  /* vertex v corresponds to the complement of x[j] */
                j = cog.orig[v - cog.nb];
                xassert(1 <= j && j <= n);
                vec[j] -= 1.0;
                b -= 1.0;
            }
        }
        xassert(len == 0);
        for (j = 1; j <= n; j++)
        {  if (vec[j] != 0.0)
        {  len++;
            ind[len] = j; val[len] = vec[j];
        }
        }
        ind[0] = 0; val[0] = b;
    }
    /* return to the calling program */
    return len;
}

function ios_clq_init(tree){
    /* initialize clique cut generator */
    var mip = tree.mip;
    xassert(mip != null);
    return lpx_create_cog(mip);
}

function ios_clq_gen(tree, gen){
    var n = lpx_get_num_cols(tree.mip);
    var len, ind;
    var val;
    xassert(gen != null);
    ind = new Array(1+n);
    val = new Array(1+n);
    len = lpx_clique_cut(tree.mip, gen, ind, val);
    if (len > 0)
    {  /* xprintf("len = %d", len); */
        glp_ios_add_row(tree, null, GLP_RF_CLQ, 0, len, ind, val, GLP_UP, val[0]);
    }
}
