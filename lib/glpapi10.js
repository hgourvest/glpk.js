function _glp_check_kkt(P, sol, cond, callback){
    /* check feasibility and optimality conditions */
    var m = P.m;
    var n = P.n;
    var row, col, aij;
    var i, j, ae_ind, re_ind;
    var e, sp, sn, t, ae_max, re_max;
    if (!(sol == GLP_SOL || sol == GLP_IPT || sol == GLP_MIP))
        xerror("glp_check_kkt: sol = " + sol + "; invalid solution indicator");
    if (!(cond == GLP_KKT_PE || cond == GLP_KKT_PB ||
        cond == GLP_KKT_DE || cond == GLP_KKT_DB ||
        cond == GLP_KKT_CS))
        xerror("glp_check_kkt: cond = " + cond + "; invalid condition indicator ");
    ae_max = re_max = 0.0;
    ae_ind = re_ind = 0;
    if (cond == GLP_KKT_PE)
    {  /* xR - A * xS = 0 */
        for (i = 1; i <= m; i++)
        {  row = P.row[i];
            sp = sn = 0.0;
            /* t := xR[i] */
            if (sol == GLP_SOL)
                t = row.prim;
            else if (sol == GLP_IPT)
                t = row.pval;
            else if (sol == GLP_MIP)
                t = row.mipx;
            else
                xassert(sol != sol);
            if (t >= 0.0) sp += t; else sn -= t;
            for (aij = row.ptr; aij != null; aij = aij.r_next)
            {  col = aij.col;
                /* t := - a[i,j] * xS[j] */
                if (sol == GLP_SOL)
                    t = - aij.val * col.prim;
                else if (sol == GLP_IPT)
                    t = - aij.val * col.pval;
                else if (sol == GLP_MIP)
                    t = - aij.val * col.mipx;
                else
                    xassert(sol != sol);
                if (t >= 0.0) sp += t; else sn -= t;
            }
            /* absolute error */
            e = Math.abs(sp - sn);
            if (ae_max < e){
                ae_max = e;
                ae_ind = i;
            }
            /* relative error */
            e /= (1.0 + sp + sn);
            if (re_max < e){
                re_max = e;
                re_ind = i;
            }

        }
    }
    else if (cond == GLP_KKT_PB)
    {  /* lR <= xR <= uR */
        for (i = 1; i <= m; i++)
        {  row = P.row[i];
            /* t := xR[i] */
            if (sol == GLP_SOL)
                t = row.prim;
            else if (sol == GLP_IPT)
                t = row.pval;
            else if (sol == GLP_MIP)
                t = row.mipx;
            else
                xassert(sol != sol);
            /* check lower bound */
            if (row.type == GLP_LO || row.type == GLP_DB ||
                row.type == GLP_FX)
            {  if (t < row.lb)
            {  /* absolute error */
                e = row.lb - t;
                if (ae_max < e){
                    ae_max = e;
                    ae_ind = i;
                }
                /* relative error */
                e /= (1.0 + Math.abs(row.lb));
                if (re_max < e){
                    re_max = e;
                    re_ind = i;
                }
            }
            }
            /* check upper bound */
            if (row.type == GLP_UP || row.type == GLP_DB ||
                row.type == GLP_FX)
            {  if (t > row.ub)
            {  /* absolute error */
                e = t - row.ub;
                if (ae_max < e){
                    ae_max = e;
                    ae_ind = i;
                }

                /* relative error */
                e /= (1.0 + Math.abs(row.ub));
                if (re_max < e){
                    re_max = e;
                    re_ind = i;
                }
            }
            }
        }
        /* lS <= xS <= uS */
        for (j = 1; j <= n; j++)
        {  col = P.col[j];
            /* t := xS[j] */
            if (sol == GLP_SOL)
                t = col.prim;
            else if (sol == GLP_IPT)
                t = col.pval;
            else if (sol == GLP_MIP)
                t = col.mipx;
            else
                xassert(sol != sol);
            /* check lower bound */
            if (col.type == GLP_LO || col.type == GLP_DB ||
                col.type == GLP_FX)
            {  if (t < col.lb)
            {  /* absolute error */
                e = col.lb - t;
                if (ae_max < e){
                    ae_max = e;
                    ae_ind = m+j;
                }
                /* relative error */
                e /= (1.0 + Math.abs(col.lb));
                if (re_max < e){
                    re_max = e;
                    re_ind = m+j;
                }
            }
            }
            /* check upper bound */
            if (col.type == GLP_UP || col.type == GLP_DB ||
                col.type == GLP_FX)
            {  if (t > col.ub)
            {  /* absolute error */
                e = t - col.ub;
                if (ae_max < e){
                    ae_max = e;
                    ae_ind = m+j;
                }
                /* relative error */
                e /= (1.0 + Math.abs(col.ub));
                if (re_max < e){
                    re_max = e;
                    re_ind = m+j;
                }
            }
            }
        }
    }
    else if (cond == GLP_KKT_DE)
    {  /* A' * (lambdaR - cR) + (lambdaS - cS) = 0 */
        for (j = 1; j <= n; j++)
        {  col = P.col[j];
            sp = sn = 0.0;
            /* t := lambdaS[j] - cS[j] */
            if (sol == GLP_SOL)
                t = col.dual - col.coef;
            else if (sol == GLP_IPT)
                t = col.dval - col.coef;
            else
                xassert(sol != sol);
            if (t >= 0.0) sp += t; else sn -= t;
            for (aij = col.ptr; aij != null; aij = aij.c_next)
            {  row = aij.row;
                /* t := a[i,j] * (lambdaR[i] - cR[i]) */
                if (sol == GLP_SOL)
                    t = aij.val * row.dual;
                else if (sol == GLP_IPT)
                    t = aij.val * row.dval;
                else
                    xassert(sol != sol);
                if (t >= 0.0) sp += t; else sn -= t;
            }
            /* absolute error */
            e = Math.abs(sp - sn);
            if (ae_max < e){
                ae_max = e;
                ae_ind = m+j;
            }
            /* relative error */
            e /= (1.0 + sp + sn);
            if (re_max < e){
                re_max = e;
                re_ind = m+j;
            }
        }
    }
    else if (cond == GLP_KKT_DB)
    {  /* check lambdaR */
        for (i = 1; i <= m; i++)
        {  row = P.row[i];
            /* t := lambdaR[i] */
            if (sol == GLP_SOL)
                t = row.dual;
            else if (sol == GLP_IPT)
                t = row.dval;
            else
                xassert(sol != sol);
            /* correct sign */
            if (P.dir == GLP_MIN)
                t = + t;
            else if (P.dir == GLP_MAX)
                t = - t;
            else
                xassert(P != P);
            /* check for positivity */
            if (row.type == GLP_FR || row.type == GLP_LO)
            {  if (t < 0.0)
            {  e = - t;
                if (ae_max < e){
                    ae_max = re_max = e;
                    ae_ind = re_ind = i;
                }
            }
            }
            /* check for negativity */
            if (row.type == GLP_FR || row.type == GLP_UP)
            {  if (t > 0.0)
            {  e = + t;
                if (ae_max < e){
                    ae_max = re_max = e;
                    ae_ind = re_ind = i;
                }
            }
            }
        }
        /* check lambdaS */
        for (j = 1; j <= n; j++)
        {  col = P.col[j];
            /* t := lambdaS[j] */
            if (sol == GLP_SOL)
                t = col.dual;
            else if (sol == GLP_IPT)
                t = col.dval;
            else
                xassert(sol != sol);
            /* correct sign */
            if (P.dir == GLP_MIN)
                t = + t;
            else if (P.dir == GLP_MAX)
                t = - t;
            else
                xassert(P != P);
            /* check for positivity */
            if (col.type == GLP_FR || col.type == GLP_LO)
            {  if (t < 0.0)
            {  e = - t;
                if (ae_max < e){
                    ae_max = re_max = e;
                    ae_ind = re_ind = m+j;
                }
            }
            }
            /* check for negativity */
            if (col.type == GLP_FR || col.type == GLP_UP)
            {  if (t > 0.0)
            {  e = + t;
                if (ae_max < e){
                    ae_max = re_max = e;
                    ae_ind = re_ind = m+j;
                }
            }
            }
        }
    }
    else
        xassert(cond != cond);

    callback(ae_max, ae_ind, re_max, re_ind);
}
