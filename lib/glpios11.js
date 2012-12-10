function ios_process_cuts(T){

    function parallel(a, b, work){
        var aij;
        var s = 0.0, sa = 0.0, sb = 0.0, temp;
        for (aij = a.ptr; aij != null; aij = aij.next)
        {  work[aij.j] = aij.val;
            sa += aij.val * aij.val;
        }
        for (aij = b.ptr; aij != null; aij = aij.next)
        {  s += work[aij.j] * aij.val;
            sb += aij.val * aij.val;
        }
        for (aij = a.ptr; aij != null; aij = aij.next)
            work[aij.j] = 0.0;
        temp = Math.sqrt(sa) * Math.sqrt(sb);
        if (temp < DBL_EPSILON * DBL_EPSILON) temp = DBL_EPSILON;
        return s / temp;
    }

    var pool;
    var cut;
    var aij;
    var info;
    var k, kk, max_cuts, len, ret, ind;
    var val, work;
    /* the current subproblem must exist */
    xassert(T.curr != null);
    /* the pool must exist and be non-empty */
    pool = T.local;
    xassert(pool != null);
    xassert(pool.size > 0);
    /* allocate working arrays */
    info = new Array(1+pool.size);
    ind = new Array(1+T.n);
    val = new Array(1+T.n);
    work = new Array(1+T.n);
    for (k = 1; k <= T.n; k++) work[k] = 0.0;
    /* build the list of cuts stored in the cut pool */
    for (k = 0, cut = pool.head; cut != null; cut = cut.next){
        k++; info[k].cut = cut; info[k].flag = 0;
    }
    xassert(k == pool.size);
    /* estimate efficiency of all cuts in the cut pool */
    for (k = 1; k <= pool.size; k++)
    {  var temp, dy = null, dz = null;
        cut = info[k].cut;
        /* build the vector of cut coefficients and compute its
         Euclidean norm */
        len = 0; temp = 0.0;
        for (aij = cut.ptr; aij != null; aij = aij.next)
        {  xassert(1 <= aij.j && aij.j <= T.n);
            len++; ind[len] = aij.j; val[len] = aij.val;
            temp += aij.val * aij.val;
        }
        if (temp < DBL_EPSILON * DBL_EPSILON) temp = DBL_EPSILON;
        /* transform the cut to express it only through non-basic
         (auxiliary and structural) variables */
        len = glp_transform_row(T.mip, len, ind, val);
        /* determine change in the cut value and in the objective
         value for the adjacent basis by simulating one step of the
         dual simplex */
        ret = _glp_analyze_row(T.mip, len, ind, val, cut.type,
            cut.rhs, 1e-9,  function(piv, x, dx, y, dy_, dz_){dy = dy_; dz = dz_});
        /* determine normalized residual and lower bound to objective
         degradation */
        if (ret == 0)
        {  info[k].eff = Math.abs(dy) / Math.sqrt(temp);
            /* if some reduced costs violates (slightly) their zero
             bounds (i.e. have wrong signs) due to round-off errors,
             dz also may have wrong sign being close to zero */
            if (T.mip.dir == GLP_MIN)
            {  if (dz < 0.0) dz = 0.0;
                info[k].deg = + dz;
            }
            else /* GLP_MAX */
            {  if (dz > 0.0) dz = 0.0;
                info[k].deg = - dz;
            }
        }
        else if (ret == 1)
        {  /* the constraint is not violated at the current point */
            info[k].eff = info[k].deg = 0.0;
        }
        else if (ret == 2)
        {  /* no dual feasible adjacent basis exists */
            info[k].eff = 1.0;
            info[k].deg = DBL_MAX;
        }
        else
            xassert(ret != ret);
        /* if the degradation is too small, just ignore it */
        if (info[k].deg < 0.01) info[k].deg = 0.0;
    }
    /* sort the list of cuts by decreasing objective degradation and
     then by decreasing efficacy */



    xqsort(info, 1, pool.size,
        function(info1, info2){
            if (info1.deg == 0.0 && info2.deg == 0.0)
            {  if (info1.eff > info2.eff) return -1;
                if (info1.eff < info2.eff) return +1;
            }
            else
            {  if (info1.deg > info2.deg) return -1;
                if (info1.deg < info2.deg) return +1;
            }
            return 0;
        }
    );
    /* only first (most efficient) max_cuts in the list are qualified
     as candidates to be added to the current subproblem */
    max_cuts = (T.curr.level == 0 ? 90 : 10);
    if (max_cuts > pool.size) max_cuts = pool.size;
    /* add cuts to the current subproblem */
    for (k = 1; k <= max_cuts; k++)
    {  var i;
        /* if this cut seems to be inefficient, skip it */
        if (info[k].deg < 0.01 && info[k].eff < 0.01) continue;
        /* if the angle between this cut and every other cut included
         in the current subproblem is small, skip this cut */
        for (kk = 1; kk < k; kk++)
        {  if (info[kk].flag)
        {  if (parallel(info[k].cut, info[kk].cut, work) > 0.90)
            break;
        }
        }
        if (kk < k) continue;
        /* add this cut to the current subproblem */
        cut = info[k].cut; info[k].flag = 1;
        i = glp_add_rows(T.mip, 1);
        if (cut.name != null)
            glp_set_row_name(T.mip, i, cut.name);
        xassert(T.mip.row[i].origin == GLP_RF_CUT);
        T.mip.row[i].klass = cut.klass;
        len = 0;
        for (aij = cut.ptr; aij != null; aij = aij.next){
            len++; ind[len] = aij.j; val[len] = aij.val;
        }
        glp_set_mat_row(T.mip, i, len, ind, val);
        xassert(cut.type == GLP_LO || cut.type == GLP_UP);
        glp_set_row_bnds(T.mip, i, cut.type, cut.rhs, cut.rhs);
    }
}