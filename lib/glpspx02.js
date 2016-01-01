function spx_dual(lp, parm){

    var kappa = 0.10;

    function alloc_csa(lp){
        var m = lp.m;
        var n = lp.n;
        var nnz = lp.nnz;
        var csa = {};
        xassert(m > 0 && n > 0);
        csa.m = m;
        csa.n = n;
        csa.type = new Int8Array(1+m+n);
        csa.lb = new Float64Array(1+m+n);
        csa.ub = new Float64Array(1+m+n);
        csa.coef = new Float64Array(1+m+n);
        csa.orig_type = new Int8Array(1+m+n);
        csa.orig_lb = new Float64Array(1+m+n);
        csa.orig_ub = new Float64Array(1+m+n);
        csa.obj = new Float64Array(1+n);
        csa.A_ptr = new Int32Array(1+n+1);
        csa.A_ind = new Int32Array(1+nnz);
        csa.A_val = new Float64Array(1+nnz);
        csa.AT_ptr = new Int32Array(1+m+1);
        csa.AT_ind = new Int32Array(1+nnz);
        csa.AT_val = new Float64Array(1+nnz);
        csa.head = new Int32Array(1+m+n);
        csa.bind = new Int32Array(1+m+n);
        csa.stat = new Int8Array(1+n);
        csa.bbar = new Float64Array(1+m);
        csa.cbar = new Float64Array(1+n);
        csa.refsp = new Int8Array(1+m+n);
        csa.gamma = new Float64Array(1+m);
        csa.trow_ind = new Int32Array(1+n);
        csa.trow_vec = new Float64Array(1+n);
        csa.tcol_ind = new Int32Array(1+m);
        csa.tcol_vec = new Float64Array(1+m);
        csa.work1 = new Float64Array(1+m);
        csa.work2 = new Float64Array(1+m);
        csa.work3 = new Float64Array(1+m);
        csa.work4 = new Float64Array(1+m);
        return csa;
    }

    this["chrome_workaround_1"] = function(csa, lp){
        var A_ptr = csa.A_ptr;
        var A_ind = csa.A_ind;
        var A_val = csa.A_val;
        var n = csa.n;
        var aij, loc, j;
        /* matrix A (by columns) */
        loc = 1;
        for (j = 1; j <= n; j++)
        {
            A_ptr[j] = loc;
            for (aij = lp.col[j].ptr; aij != null; aij = aij.c_next)
            {  A_ind[loc] = aij.row.i;
                A_val[loc] = aij.row.rii * aij.val * aij.col.sjj;
                loc++;
            }
        }
        A_ptr[n+1] = loc;
        xassert(loc-1 == lp.nnz);
    };

    this["chrome_workaround_2"] = function(csa, lp){
        var loc, i, aij;
        var AT_ptr = csa.AT_ptr;
        var AT_ind = csa.AT_ind;
        var AT_val = csa.AT_val;
        var m = csa.m;

        /* matrix A (by rows) */
        loc = 1;
        for (i = 1; i <= m; i++)
        {
            AT_ptr[i] = loc;
            for (aij = lp.row[i].ptr; aij != null; aij = aij.r_next)
            {  AT_ind[loc] = aij.col.j;
                AT_val[loc] = aij.row.rii * aij.val * aij.col.sjj;
                loc++;
            }
        }
        AT_ptr[m+1] = loc;
        xassert(loc-1 == lp.nnz);

    };

    function init_csa(csa, lp){
        var m = csa.m;
        var n = csa.n;
        var type = csa.type;
        var lb = csa.lb;
        var ub = csa.ub;
        var coef = csa.coef;
        var orig_type = csa.orig_type;
        var orig_lb = csa.orig_lb;
        var orig_ub = csa.orig_ub;
        var obj = csa.obj;

        var head = csa.head;
        var bind = csa.bind;
        var stat = csa.stat;
        var refsp = csa.refsp;
        var gamma = csa.gamma;
        var i, j, k, loc;
        var cmax, aij, row, col;
        /* auxiliary variables */
        for (i = 1; i <= m; i++)
        {  row = lp.row[i];
            type[i] = row.type;
            lb[i] = row.lb * row.rii;
            ub[i] = row.ub * row.rii;
            coef[i] = 0.0;
        }
        /* structural variables */
        for (j = 1; j <= n; j++)
        {  col = lp.col[j];
            type[m+j] = col.type;
            lb[m+j] = col.lb / col.sjj;
            ub[m+j] = col.ub / col.sjj;
            coef[m+j] = col.coef * col.sjj;
        }
        /* original bounds of variables */
        xcopyArr(orig_type, 1, type, 1, m+n);
        xcopyArr(orig_lb, 1, lb, 1, m+n);
        xcopyArr(orig_ub, 1, ub, 1, m+n);
        /* original objective function */
        obj[0] = lp.c0;
        xcopyArr(obj, 1, coef, m+1, n);
        /* factor used to scale original objective coefficients */
        cmax = 0.0;
        for (j = 1; j <= n; j++)
            if (cmax < Math.abs(obj[j])) cmax = Math.abs(obj[j]);
        if (cmax == 0.0) cmax = 1.0;
        switch (lp.dir)
        {  case GLP_MIN:
            csa.zeta = + 1.0 / cmax;
            break;
            case GLP_MAX:
                csa.zeta = - 1.0 / cmax;
                break;
            default:
                xassert(lp != lp);
        }
        if (Math.abs(csa.zeta) < 1.0) csa.zeta *= 1000.0;
        /* scale working objective coefficients */
        for (j = 1; j <= n; j++) coef[m+j] *= csa.zeta;

        chrome_workaround_1(csa, lp);
        chrome_workaround_2(csa, lp);

        /* basis header */
        xassert(lp.valid);
        xcopyArr(head, 1, lp.head, 1, m);
        k = 0;
        for (i = 1; i <= m; i++)
        {  row = lp.row[i];
            if (row.stat != GLP_BS)
            {  k++;
                xassert(k <= n);
                head[m+k] = i;
                stat[k] = row.stat;
            }
        }
        for (j = 1; j <= n; j++)
        {  col = lp.col[j];
            if (col.stat != GLP_BS)
            {  k++;
                xassert(k <= n);
                head[m+k] = m + j;
                stat[k] = col.stat;
            }
        }
        xassert(k == n);
        for (k = 1; k <= m+n; k++)
            bind[head[k]] = k;
        /* factorization of matrix B */
        csa.valid = 1; lp.valid = 0;
        csa.bfd = lp.bfd; lp.bfd = null;
        /* working parameters */
        csa.phase = 0;
        csa.tm_beg = xtime();
        csa.it_beg = csa.it_cnt = lp.it_cnt;
        csa.it_dpy = -1;
        /* reference space and steepest edge coefficients */
        csa.refct = 0;
        xfillArr(refsp, 1, 0, m+n);
        for (i = 1; i <= m; i++) gamma[i] = 1.0;
    }

    function inv_col(csa, i, ind, val){
        /* this auxiliary routine returns row indices and numeric values
         of non-zero elements of i-th column of the basis matrix */
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var A_ptr = csa.A_ptr;
        var A_ind = csa.A_ind;
        var A_val = csa.A_val;
        var head = csa.head;
        var k, len, ptr, t;
        if (GLP_DEBUG){xassert(1 <= i && i <= m)}
        k = head[i]; /* B[i] is k-th column of (I|-A) */
        if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
        if (k <= m)
        {  /* B[i] is k-th column of submatrix I */
            len = 1;
            ind[1] = k;
            val[1] = 1.0;
        }
        else
        {  /* B[i] is (k-m)-th column of submatrix (-A) */
            ptr = A_ptr[k-m];
            len = A_ptr[k-m+1] - ptr;
            xcopyArr(ind, 1, A_ind, ptr, len);
            xcopyArr(val, 1, A_val, ptr, len);
            for (t = 1; t <= len; t++) val[t] = - val[t];
        }
        return len;
    }

    function invert_B(csa){
        var ret = bfd_factorize(csa.bfd, csa.m, null, inv_col, csa);
        csa.valid = (ret == 0);
        return ret;
    }

    function update_B(csa, i, k)
    {   var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var ret, val;
        if (GLP_DEBUG){
            xassert(1 <= i && i <= m);
            xassert(1 <= k && k <= m+n);
        }
        if (k <= m)
        {  /* new i-th column of B is k-th column of I */
            var ind = new Array(1+1);
            val = new Array(1+1);
            ind[1] = k;
            val[1] = 1.0;
            xassert(csa.valid);
            ret = bfd_update_it(csa.bfd, i, 0, 1, ind, 0, val);
        }
        else
        {  /* new i-th column of B is (k-m)-th column of (-A) */
            var A_ptr = csa.A_ptr;
            var A_ind = csa.A_ind;
            var A_val = csa.A_val;
            val = csa.work1;
            var beg, end, ptr, len;
            beg = A_ptr[k-m];
            end = A_ptr[k-m+1];
            len = 0;
            for (ptr = beg; ptr < end; ptr++)
                val[++len] = - A_val[ptr];
            xassert(csa.valid);
            ret = bfd_update_it(csa.bfd, i, 0, len, A_ind, beg-1, val);
        }
        csa.valid = (ret == 0);
        return ret;
    }

    function error_ftran(csa, h, x, r){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var A_ptr = csa.A_ptr;
        var A_ind = csa.A_ind;
        var A_val = csa.A_val;
        var head = csa.head;
        var i, k, beg, end, ptr;
        var temp;
        /* compute the residual vector:
         r = h - B * x = h - B[1] * x[1] - ... - B[m] * x[m],
         where B[1], ..., B[m] are columns of matrix B */
        xcopyArr(r, 1, h, 1, m);
        for (i = 1; i <= m; i++)
        {  temp = x[i];
            if (temp == 0.0) continue;
            k = head[i]; /* B[i] is k-th column of (I|-A) */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            if (k <= m)
            {  /* B[i] is k-th column of submatrix I */
                r[k] -= temp;
            }
            else
            {  /* B[i] is (k-m)-th column of submatrix (-A) */
                beg = A_ptr[k-m];
                end = A_ptr[k-m+1];
                for (ptr = beg; ptr < end; ptr++)
                    r[A_ind[ptr]] += A_val[ptr] * temp;
            }
        }
    }

    function refine_ftran(csa, h, x){
        var m = csa.m;
        var r = csa.work1;
        var d = csa.work1;
        var i;
        /* compute the residual vector r = h - B * x */
        error_ftran(csa, h, x, r);
        /* compute the correction vector d = inv(B) * r */
        xassert(csa.valid);
        bfd_ftran(csa.bfd, d);
        /* refine the solution vector (new x) = (old x) + d */
        for (i = 1; i <= m; i++) x[i] += d[i];
    }

    function error_btran(csa, h, x, r){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var A_ptr = csa.A_ptr;
        var A_ind = csa.A_ind;
        var A_val = csa.A_val;
        var head = csa.head;
        var i, k, beg, end, ptr;
        var temp;
        /* compute the residual vector r = b - B'* x */
        for (i = 1; i <= m; i++)
        {  /* r[i] := b[i] - (i-th column of B)'* x */
            k = head[i]; /* B[i] is k-th column of (I|-A) */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            temp = h[i];
            if (k <= m)
            {  /* B[i] is k-th column of submatrix I */
                temp -= x[k];
            }
            else
            {  /* B[i] is (k-m)-th column of submatrix (-A) */
                beg = A_ptr[k-m];
                end = A_ptr[k-m+1];
                for (ptr = beg; ptr < end; ptr++)
                    temp += A_val[ptr] * x[A_ind[ptr]];
            }
            r[i] = temp;
        }
    }

    function refine_btran(csa, h, x){
        var m = csa.m;
        var r = csa.work1;
        var d = csa.work1;
        var i;
        /* compute the residual vector r = h - B'* x */
        error_btran(csa, h, x, r);
        /* compute the correction vector d = inv(B') * r */
        xassert(csa.valid);
        bfd_btran(csa.bfd, d);
        /* refine the solution vector (new x) = (old x) + d */
        for (i = 1; i <= m; i++) x[i] += d[i];
    }

    function get_xN(csa, j){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var lb = csa.lb;
        var ub = csa.ub;
        var head = csa.head;
        var stat = csa.stat;
        var k;
        var xN;
        if (GLP_DEBUG){xassert(1 <= j && j <= n)}
        k = head[m+j]; /* x[k] = xN[j] */
        if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
        switch (stat[j])
        {  case GLP_NL:
            /* x[k] is on its lower bound */
            xN = lb[k]; break;
            case GLP_NU:
                /* x[k] is on its upper bound */
                xN = ub[k]; break;
            case GLP_NF:
                /* x[k] is free non-basic variable */
                xN = 0.0; break;
            case GLP_NS:
                /* x[k] is fixed non-basic variable */
                xN = lb[k]; break;
            default:
                xassert(stat != stat);
        }
        return xN;
    }

    function eval_beta(csa, beta){
        var m = csa.m;
        var n = csa.n;
        var A_ptr = csa.A_ptr;
        var A_ind = csa.A_ind;
        var A_val = csa.A_val;
        var head = csa.head;
        var h = csa.work2;
        var i, j, k, beg, end, ptr;
        var xN;
        /* compute the right-hand side vector:
         h := - N * xN = - N[1] * xN[1] - ... - N[n] * xN[n],
         where N[1], ..., N[n] are columns of matrix N */
        for (i = 1; i <= m; i++)
            h[i] = 0.0;
        for (j = 1; j <= n; j++)
        {   k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            /* determine current value of xN[j] */
            xN = get_xN(csa, j);
            if (xN == 0.0) continue;
            if (k <= m)
            {  /* N[j] is k-th column of submatrix I */
                h[k] -= xN;
            }
            else
            {  /* N[j] is (k-m)-th column of submatrix (-A) */
                beg = A_ptr[k-m];
                end = A_ptr[k-m+1];
                for (ptr = beg; ptr < end; ptr++)
                    h[A_ind[ptr]] += xN * A_val[ptr];
            }
        }
        /* solve system B * beta = h */
        xcopyArr(beta, 1, h, 1, m);
        xassert(csa.valid);
        bfd_ftran(csa.bfd, beta);
        /* and refine the solution */
        refine_ftran(csa, h, beta);
    }

    function eval_pi(csa, pi){
        var m = csa.m;
        var c = csa.coef;
        var head = csa.head;
        var cB = csa.work2;
        var i;
        /* construct the right-hand side vector cB */
        for (i = 1; i <= m; i++)
            cB[i] = c[head[i]];
        /* solve system B'* pi = cB */
        xcopyArr(pi, 1, cB, 1, m);
        xassert(csa.valid);
        bfd_btran(csa.bfd, pi);
        /* and refine the solution */
        refine_btran(csa, cB, pi);
    }

    function eval_cost(csa, pi, j){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var coef = csa.coef;
        var head = csa.head;
        var k;
        var dj;
        if (GLP_DEBUG){xassert(1 <= j && j <= n)}
        k = head[m+j]; /* x[k] = xN[j] */
        if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
        dj = coef[k];
        if (k <= m)
        {  /* N[j] is k-th column of submatrix I */
            dj -= pi[k];
        }
        else
        {  /* N[j] is (k-m)-th column of submatrix (-A) */
            var A_ptr = csa.A_ptr;
            var A_ind = csa.A_ind;
            var A_val = csa.A_val;
            var beg, end, ptr;
            beg = A_ptr[k-m];
            end = A_ptr[k-m+1];
            for (ptr = beg; ptr < end; ptr++)
                dj += A_val[ptr] * pi[A_ind[ptr]];
        }
        return dj;
    }

    function eval_bbar(csa){
        eval_beta(csa, csa.bbar);
    }

    function eval_cbar(csa){
        if (GLP_DEBUG){var m = csa.m}
        var n = csa.n;
        if (GLP_DEBUG){var head = csa.head}
        var cbar = csa.cbar;
        var pi = csa.work3;
        var j;
        if (GLP_DEBUG){var k}
        /* compute simplex multipliers */
        eval_pi(csa, pi);
        /* compute and store reduced costs */
        for (j = 1; j <= n; j++)
        {
            if (GLP_DEBUG){
                k = head[m+j]; /* x[k] = xN[j] */
                xassert(1 <= k && k <= m+n);
            }
            cbar[j] = eval_cost(csa, pi, j);
        }
    }

    function reset_refsp(csa){
        var m = csa.m;
        var n = csa.n;
        var head = csa.head;
        var refsp = csa.refsp;
        var gamma = csa.gamma;
        var i, k;
        xassert(csa.refct == 0);
        csa.refct = 1000;
        xfillArr(refsp, 1, 0, m+n);
        for (i = 1; i <= m; i++)
        {  k = head[i]; /* x[k] = xB[i] */
            refsp[k] = 1;
            gamma[i] = 1.0;
        }
    }

    function eval_gamma(csa, gamma){
        var m = csa.m;
        var n = csa.n;
        var type = csa.type;
        var head = csa.head;
        var refsp = csa.refsp;
        var alfa = csa.work3;
        var h = csa.work3;
        var i, j, k;
        /* gamma[i] := eta[i] (or 1, if xB[i] is free) */
        for (i = 1; i <= m; i++)
        {  k = head[i]; /* x[k] = xB[i] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            if (type[k] == GLP_FR)
                gamma[i] = 1.0;
            else
                gamma[i] = (refsp[k] ? 1.0 : 0.0);
        }
        /* compute columns of the current simplex table */
        for (j = 1; j <= n; j++)
        {  k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            /* skip column, if xN[j] is not in C */
            if (!refsp[k]) continue;
            if (GLP_DEBUG){
                /* set C must not contain fixed variables */
                xassert(type[k] != GLP_FX);
            }
            /* construct the right-hand side vector h = - N[j] */
            for (i = 1; i <= m; i++)
                h[i] = 0.0;
            if (k <= m)
            {  /* N[j] is k-th column of submatrix I */
                h[k] = -1.0;
            }
            else
            {  /* N[j] is (k-m)-th column of submatrix (-A) */
                var A_ptr = csa.A_ptr;
                var A_ind = csa.A_ind;
                var A_val = csa.A_val;
                var beg, end, ptr;
                beg = A_ptr[k-m];
                end = A_ptr[k-m+1];
                for (ptr = beg; ptr < end; ptr++)
                    h[A_ind[ptr]] = A_val[ptr];
            }
            /* solve system B * alfa = h */
            xassert(csa.valid);
            bfd_ftran(csa.bfd, alfa);
            /* gamma[i] := gamma[i] + alfa[i,j]^2 */
            for (i = 1; i <= m; i++)
            {  k = head[i]; /* x[k] = xB[i] */
                if (type[k] != GLP_FR)
                    gamma[i] += alfa[i] * alfa[i];
            }
        }
    }

    function chuzr(csa, tol_bnd){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var type = csa.type;
        var lb = csa.lb;
        var ub = csa.ub;
        var head = csa.head;
        var bbar = csa.bbar;
        var gamma = csa.gamma;
        var i, k, p;
        var delta, best, eps, ri, temp;
        /* nothing is chosen so far */
        p = 0; delta = 0.0; best = 0.0;
        /* look through the list of basic variables */
        for (i = 1; i <= m; i++)
        {  k = head[i]; /* x[k] = xB[i] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            /* determine bound violation ri[i] */
            ri = 0.0;
            if (type[k] == GLP_LO || type[k] == GLP_DB ||
                type[k] == GLP_FX)
            {  /* xB[i] has lower bound */
                eps = tol_bnd * (1.0 + kappa * Math.abs(lb[k]));
                if (bbar[i] < lb[k] - eps)
                {  /* and significantly violates it */
                    ri = lb[k] - bbar[i];
                }
            }
            if (type[k] == GLP_UP || type[k] == GLP_DB ||
                type[k] == GLP_FX)
            {  /* xB[i] has upper bound */
                eps = tol_bnd * (1.0 + kappa * Math.abs(ub[k]));
                if (bbar[i] > ub[k] + eps)
                {  /* and significantly violates it */
                    ri = ub[k] - bbar[i];
                }
            }
            /* if xB[i] is not eligible, skip it */
            if (ri == 0.0) continue;
            /* xB[i] is eligible basic variable; choose one with largest
             weighted bound violation */
            if (GLP_DEBUG){xassert(gamma[i] >= 0.0)}
            temp = gamma[i];
            if (temp < DBL_EPSILON) temp = DBL_EPSILON;
            temp = (ri * ri) / temp;
            if (best < temp){
                p = i; delta = ri; best = temp;
            }
        }
        /* store the index of basic variable xB[p] chosen and its change
         in the adjacent basis */
        csa.p = p;
        csa.delta = delta;
    }

    function eval_rho(csa, e){
        var m = csa.m;
        var p = csa.p;
        var i;
        if (GLP_DEBUG){xassert(1 <= p && p <= m)}
        /* construct the right-hand side vector e[p] */
        for (i = 1; i <= m; i++)
            e[i] = 0.0;
        e[p] = 1.0;
        /* solve system B'* rho = e[p] */
        xassert(csa.valid);
        bfd_btran(csa.bfd, rho);
    }

    function refine_rho(csa, rho){
        var m = csa.m;
        var p = csa.p;
        var e = csa.work3;
        var i;
        if (GLP_DEBUG){xassert(1 <= p && p <= m)}
        /* construct the right-hand side vector e[p] */
        for (i = 1; i <= m; i++)
            e[i] = 0.0;
        e[p] = 1.0;
        /* refine solution of B'* rho = e[p] */
        refine_btran(csa, e, rho);
    }

    function eval_trow1(csa, rho){
        var m = csa.m;
        var n = csa.n;
        var A_ptr = csa.A_ptr;
        var A_ind = csa.A_ind;
        var A_val = csa.A_val;
        var head = csa.head;
        var stat = csa.stat;
        var trow_ind = csa.trow_ind;
        var trow_vec = csa.trow_vec;
        var j, k, beg, end, ptr, nnz;
        var temp;
        /* compute the pivot row as inner products of columns of the
         matrix N and vector rho: trow[j] = - rho * N[j] */
        nnz = 0;
        for (j = 1; j <= n; j++)
        {  if (stat[j] == GLP_NS)
        {  /* xN[j] is fixed */
            trow_vec[j] = 0.0;
            continue;
        }
            k = head[m+j]; /* x[k] = xN[j] */
            if (k <= m)
            {  /* N[j] is k-th column of submatrix I */
                temp = - rho[k];
            }
            else
            {  /* N[j] is (k-m)-th column of submatrix (-A) */
                beg = A_ptr[k-m]; end = A_ptr[k-m+1];
                temp = 0.0;
                for (ptr = beg; ptr < end; ptr++)
                    temp += rho[A_ind[ptr]] * A_val[ptr];
            }
            if (temp != 0.0)
                trow_ind[++nnz] = j;
            trow_vec[j] = temp;
        }
        csa.trow_nnz = nnz;
    }

    function eval_trow2(csa, rho){
        var m = csa.m;
        var n = csa.n;
        var AT_ptr = csa.AT_ptr;
        var AT_ind = csa.AT_ind;
        var AT_val = csa.AT_val;
        var bind = csa.bind;
        var stat = csa.stat;
        var trow_ind = csa.trow_ind;
        var trow_vec = csa.trow_vec;
        var i, j, beg, end, ptr, nnz;
        var temp;
        /* clear the pivot row */
        for (j = 1; j <= n; j++)
            trow_vec[j] = 0.0;
        /* compute the pivot row as a linear combination of rows of the
         matrix N: trow = - rho[1] * N'[1] - ... - rho[m] * N'[m] */
        for (i = 1; i <= m; i++)
        {  temp = rho[i];
            if (temp == 0.0) continue;
            /* trow := trow - rho[i] * N'[i] */
            j = bind[i] - m; /* x[i] = xN[j] */
            if (j >= 1 && stat[j] != GLP_NS)
                trow_vec[j] -= temp;
            beg = AT_ptr[i]; end = AT_ptr[i+1];
            for (ptr = beg; ptr < end; ptr++)
            {  j = bind[m + AT_ind[ptr]] - m; /* x[k] = xN[j] */
                if (j >= 1 && stat[j] != GLP_NS)
                    trow_vec[j] += temp * AT_val[ptr];
            }
        }
        /* construct sparse pattern of the pivot row */
        nnz = 0;
        for (j = 1; j <= n; j++)
        {  if (trow_vec[j] != 0.0)
            trow_ind[++nnz] = j;
        }
        csa.trow_nnz = nnz;
    }

    function eval_trow(csa, rho){
        var m = csa.m;
        var i, nnz;
        var dens;
        /* determine the density of the vector rho */
        nnz = 0;
        for (i = 1; i <= m; i++)
            if (rho[i] != 0.0) nnz++;
        dens = nnz / m;
        if (dens >= 0.20)
        {  /* rho is relatively dense */
            eval_trow1(csa, rho);
        }
        else
        {  /* rho is relatively sparse */
            eval_trow2(csa, rho);
        }
    }

    function sort_trow(csa, tol_piv){
        if (GLP_DEBUG){
            var n = csa.n;
            var stat = csa.stat;
        }
        var nnz = csa.trow_nnz;
        var trow_ind = csa.trow_ind;
        var trow_vec = csa.trow_vec;
        var j, num, pos;
        var big, eps, temp;
        /* compute infinity (maximum) norm of the row */
        big = 0.0;
        for (pos = 1; pos <= nnz; pos++)
        {
            if (GLP_DEBUG){
                j = trow_ind[pos];
                xassert(1 <= j && j <= n);
                xassert(stat[j] != GLP_NS);
            }
            temp = Math.abs(trow_vec[trow_ind[pos]]);
            if (big < temp) big = temp;
        }
        csa.trow_max = big;
        /* determine absolute pivot tolerance */
        eps = tol_piv * (1.0 + 0.01 * big);
        /* move significant row components to the front of the list */
        for (num = 0; num < nnz; )
        {  j = trow_ind[nnz];
            if (Math.abs(trow_vec[j]) < eps)
                nnz--;
            else
            {  num++;
                trow_ind[nnz] = trow_ind[num];
                trow_ind[num] = j;
            }
        }
        csa.trow_num = num;
    }

    function chuzc(csa, rtol){
        if (GLP_DEBUG){
            var m = csa.m;
            var n = csa.n;
        }
        var stat = csa.stat;
        var cbar = csa.cbar;
        if (GLP_DEBUG){
            var p = csa.p;
        }
        var delta = csa.delta;
        var trow_ind = csa.trow_ind;
        var trow_vec = csa.trow_vec;
        var trow_num = csa.trow_num;
        var j, pos, q;
        var alfa, big, s, t, teta, tmax;
        if (GLP_DEBUG){xassert(1 <= p && p <= m)}
        /* delta > 0 means that xB[p] violates its lower bound and goes
         to it in the adjacent basis, so lambdaB[p] is increasing from
         its lower zero bound;
         delta < 0 means that xB[p] violates its upper bound and goes
         to it in the adjacent basis, so lambdaB[p] is decreasing from
         its upper zero bound */
        if (GLP_DEBUG){xassert(delta != 0.0)}
        /* s := sign(delta) */
        s = (delta > 0.0 ? +1.0 : -1.0);
        /*** FIRST PASS ***/
        /* nothing is chosen so far */
        q = 0; teta = DBL_MAX; big = 0.0;
        /* walk through significant elements of the pivot row */
        for (pos = 1; pos <= trow_num; pos++)
        {  j = trow_ind[pos];
            if (GLP_DEBUG){xassert(1 <= j && j <= n)}
            alfa = s * trow_vec[j];
            if (GLP_DEBUG){xassert(alfa != 0.0)}
            /* lambdaN[j] = ... - alfa * lambdaB[p] - ..., and due to s we
             need to consider only increasing lambdaB[p] */
            if (alfa > 0.0)
            {  /* lambdaN[j] is decreasing */
                if (stat[j] == GLP_NL || stat[j] == GLP_NF)
                {  /* lambdaN[j] has zero lower bound */
                    t = (cbar[j] + rtol) / alfa;
                }
                else
                {  /* lambdaN[j] has no lower bound */
                    continue;
                }
            }
            else
            {  /* lambdaN[j] is increasing */
                if (stat[j] == GLP_NU || stat[j] == GLP_NF)
                {  /* lambdaN[j] has zero upper bound */
                    t = (cbar[j] - rtol) / alfa;
                }
                else
                {  /* lambdaN[j] has no upper bound */
                    continue;
                }
            }
            /* t is a change of lambdaB[p], on which lambdaN[j] reaches
             its zero bound (possibly relaxed); since the basic solution
             is assumed to be dual feasible, t has to be non-negative by
             definition; however, it may happen that lambdaN[j] slightly
             (i.e. within a tolerance) violates its zero bound, that
             leads to negative t; in the latter case, if xN[j] is chosen,
             negative t means that lambdaB[p] changes in wrong direction
             that may cause wrong results on updating reduced costs;
             thus, if t is negative, we should replace it by exact zero
             assuming that lambdaN[j] is exactly on its zero bound, and
             violation appears due to round-off errors */
            if (t < 0.0) t = 0.0;
            /* apply minimal ratio test */
            if (teta > t || teta == t && big < Math.abs(alfa)){
                q = j; teta = t; big = Math.abs(alfa);
            }

        }
        /* the second pass is skipped in the following cases: */
        /* if the standard ratio test is used */
        if (rtol == 0.0) return done();
        /* if no non-basic variable has been chosen on the first pass */
        if (q == 0) return done();
        /* if lambdaN[q] prevents lambdaB[p] from any change */
        if (teta == 0.0) return done();
        /*** SECOND PASS ***/
        /* here tmax is a maximal change of lambdaB[p], on which the
         solution remains dual feasible within a tolerance */
        tmax = teta;
        /* nothing is chosen so far */
        q = 0; teta = DBL_MAX; big = 0.0;
        /* walk through significant elements of the pivot row */
        for (pos = 1; pos <= trow_num; pos++)
        {  j = trow_ind[pos];
            if (GLP_DEBUG){xassert(1 <= j && j <= n)}
            alfa = s * trow_vec[j];
            if (GLP_DEBUG){xassert(alfa != 0.0)}
            /* lambdaN[j] = ... - alfa * lambdaB[p] - ..., and due to s we
             need to consider only increasing lambdaB[p] */
            if (alfa > 0.0)
            {  /* lambdaN[j] is decreasing */
                if (stat[j] == GLP_NL || stat[j] == GLP_NF)
                {  /* lambdaN[j] has zero lower bound */
                    t = cbar[j] / alfa;
                }
                else
                {  /* lambdaN[j] has no lower bound */
                    continue;
                }
            }
            else
            {  /* lambdaN[j] is increasing */
                if (stat[j] == GLP_NU || stat[j] == GLP_NF)
                {  /* lambdaN[j] has zero upper bound */
                    t = cbar[j] / alfa;
                }
                else
                {  /* lambdaN[j] has no upper bound */
                    continue;
                }
            }
            /* (see comments for the first pass) */
            if (t < 0.0) t = 0.0;
            /* t is a change of lambdaB[p], on which lambdaN[j] reaches
             its zero (lower or upper) bound; if t <= tmax, all reduced
             costs can violate their zero bounds only within relaxation
             tolerance rtol, so we can choose non-basic variable having
             largest influence coefficient to avoid possible numerical
             instability */
            if (t <= tmax && big < Math.abs(alfa)){
                q = j; teta = t; big = Math.abs(alfa);
            }
        }
        /* something must be chosen on the second pass */
        xassert(q != 0);

        function done(){
            /* store the index of non-basic variable xN[q] chosen */
            csa.q = q;
            /* store reduced cost of xN[q] in the adjacent basis */
            csa.new_dq = s * teta;
        }
        done();
    }

    function eval_tcol(csa){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var head = csa.head;
        var q = csa.q;
        var tcol_ind = csa.tcol_ind;
        var tcol_vec = csa.tcol_vec;
        var h = csa.tcol_vec;
        var i, k, nnz;
        if (GLP_DEBUG){xassert(1 <= q && q <= n)}
        k = head[m+q]; /* x[k] = xN[q] */
        if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
        /* construct the right-hand side vector h = - N[q] */
        for (i = 1; i <= m; i++)
            h[i] = 0.0;
        if (k <= m)
        {  /* N[q] is k-th column of submatrix I */
            h[k] = -1.0;
        }
        else
        {  /* N[q] is (k-m)-th column of submatrix (-A) */
            var A_ptr = csa.A_ptr;
            var A_ind = csa.A_ind;
            var A_val = csa.A_val;
            var beg, end, ptr;
            beg = A_ptr[k-m];
            end = A_ptr[k-m+1];
            for (ptr = beg; ptr < end; ptr++)
                h[A_ind[ptr]] = A_val[ptr];
        }
        /* solve system B * tcol = h */
        xassert(csa.valid);
        bfd_ftran(csa.bfd, tcol_vec);
        /* construct sparse pattern of the pivot column */
        nnz = 0;
        for (i = 1; i <= m; i++)
        {  if (tcol_vec[i] != 0.0)
            tcol_ind[++nnz] = i;
        }
        csa.tcol_nnz = nnz;
    }

    function refine_tcol(csa){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var head = csa.head;
        var q = csa.q;
        var tcol_ind = csa.tcol_ind;
        var tcol_vec = csa.tcol_vec;
        var h = csa.work3;
        var i, k, nnz;
        if (GLP_DEBUG){xassert(1 <= q && q <= n)}
        k = head[m+q]; /* x[k] = xN[q] */
        if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
        /* construct the right-hand side vector h = - N[q] */
        for (i = 1; i <= m; i++)
            h[i] = 0.0;
        if (k <= m)
        {  /* N[q] is k-th column of submatrix I */
            h[k] = -1.0;
        }
        else
        {  /* N[q] is (k-m)-th column of submatrix (-A) */
            var A_ptr = csa.A_ptr;
            var A_ind = csa.A_ind;
            var A_val = csa.A_val;
            var beg, end, ptr;
            beg = A_ptr[k-m];
            end = A_ptr[k-m+1];
            for (ptr = beg; ptr < end; ptr++)
                h[A_ind[ptr]] = A_val[ptr];
        }
        /* refine solution of B * tcol = h */
        refine_ftran(csa, h, tcol_vec);
        /* construct sparse pattern of the pivot column */
        nnz = 0;
        for (i = 1; i <= m; i++)
        {  if (tcol_vec[i] != 0.0)
            tcol_ind[++nnz] = i;
        }
        csa.tcol_nnz = nnz;
    }

    function update_cbar(csa){
        if (GLP_DEBUG){var n = csa.n}
        var cbar = csa.cbar;
        var trow_nnz = csa.trow_nnz;
        var trow_ind = csa.trow_ind;
        var trow_vec = csa.trow_vec;
        var q = csa.q;
        var new_dq = csa.new_dq;
        var j, pos;
        if (GLP_DEBUG){xassert(1 <= q && q <= n)}
        /* set new reduced cost of xN[q] */
        cbar[q] = new_dq;
        /* update reduced costs of other non-basic variables */
        if (new_dq == 0.0) return;
        for (pos = 1; pos <= trow_nnz; pos++)
        {  j = trow_ind[pos];
            if (GLP_DEBUG){xassert(1 <= j && j <= n)}
            if (j != q)
                cbar[j] -= trow_vec[j] * new_dq;
        }
    }

    function update_bbar(csa){
        if (GLP_DEBUG){
            var m = csa.m;
            var n = csa.n;
        }
        var bbar = csa.bbar;
        var p = csa.p;
        var delta = csa.delta;
        var q = csa.q;
        var tcol_nnz = csa.tcol_nnz;
        var tcol_ind = csa.tcol_ind;
        var tcol_vec = csa.tcol_vec;
        var i, pos;
        var teta;
        if (GLP_DEBUG){
            xassert(1 <= p && p <= m);
            xassert(1 <= q && q <= n);
            /* determine the change of xN[q] in the adjacent basis */
            xassert(tcol_vec[p] != 0.0);
        }
        teta = delta / tcol_vec[p];
        /* set new primal value of xN[q] */
        bbar[p] = get_xN(csa, q) + teta;
        /* update primal values of other basic variables */
        if (teta == 0.0) return;
        for (pos = 1; pos <= tcol_nnz; pos++)
        {  i = tcol_ind[pos];
            if (GLP_DEBUG){xassert(1 <= i && i <= m)}
            if (i != p)
                bbar[i] += tcol_vec[i] * teta;
        }
    }

    function update_gamma(csa){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var type = csa.type;
        var head = csa.head;
        var refsp = csa.refsp;
        var gamma = csa.gamma;
        var p = csa.p;
        var trow_nnz = csa.trow_nnz;
        var trow_ind = csa.trow_ind;
        var trow_vec = csa.trow_vec;
        var q = csa.q;
        var tcol_nnz = csa.tcol_nnz;
        var tcol_ind = csa.tcol_ind;
        var tcol_vec = csa.tcol_vec;
        var u = csa.work3;
        var i, j, k,pos;
        var gamma_p, eta_p, pivot, t, t1, t2;
        if (GLP_DEBUG){
            xassert(1 <= p && p <= m);
            xassert(1 <= q && q <= n);
        }
        /* the basis changes, so decrease the count */
        xassert(csa.refct > 0);
        csa.refct--;
        /* recompute gamma[p] for the current basis more accurately and
         compute auxiliary vector u */
        if (GLP_DEBUG){xassert(type[head[p]] != GLP_FR)}
        gamma_p = eta_p = (refsp[head[p]] ? 1.0 : 0.0);
        for (i = 1; i <= m; i++) u[i] = 0.0;
        for (pos = 1; pos <= trow_nnz; pos++)
        {   j = trow_ind[pos];
            if (GLP_DEBUG){xassert(1 <= j && j <= n)}
            k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG){
                xassert(1 <= k && k <= m+n);
                xassert(type[k] != GLP_FX);
            }
            if (!refsp[k]) continue;
            t = trow_vec[j];
            gamma_p += t * t;
            /* u := u + N[j] * delta[j] * trow[j] */
            if (k <= m)
            {  /* N[k] = k-j stolbec submatrix I */
                u[k] += t;
            }
            else
            {  /* N[k] = k-m-k stolbec (-A) */
                var A_ptr = csa.A_ptr;
                var A_ind = csa.A_ind;
                var A_val = csa.A_val;
                var beg, end, ptr;
                beg = A_ptr[k-m];
                end = A_ptr[k-m+1];
                for (ptr = beg; ptr < end; ptr++)
                    u[A_ind[ptr]] -= t * A_val[ptr];
            }
        }
        xassert(csa.valid);
        bfd_ftran(csa.bfd, u);
        /* update gamma[i] for other basic variables (except xB[p] and
         free variables) */
        pivot = tcol_vec[p];
        if (GLP_DEBUG){xassert(pivot != 0.0)}
        for (pos = 1; pos <= tcol_nnz; pos++)
        {   i = tcol_ind[pos];
            if (GLP_DEBUG){xassert(1 <= i && i <= m)}
            k = head[i];
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            /* skip xB[p] */
            if (i == p) continue;
            /* skip free basic variable */
            if (type[head[i]] == GLP_FR)
            {
                if (GLP_DEBUG){xassert(gamma[i] == 1.0)}
                continue;
            }
            /* compute gamma[i] for the adjacent basis */
            t = tcol_vec[i] / pivot;
            t1 = gamma[i] + t * t * gamma_p + 2.0 * t * u[i];
            t2 = (refsp[k] ? 1.0 : 0.0) + eta_p * t * t;
            gamma[i] = (t1 >= t2 ? t1 : t2);
            /* (though gamma[i] can be exact zero, because the reference
             space does not include non-basic fixed variables) */
            if (gamma[i] < DBL_EPSILON) gamma[i] = DBL_EPSILON;
        }
        /* compute gamma[p] for the adjacent basis */
        if (type[head[m+q]] == GLP_FR)
            gamma[p] = 1.0;
        else
        {  gamma[p] = gamma_p / (pivot * pivot);
            if (gamma[p] < DBL_EPSILON) gamma[p] = DBL_EPSILON;
        }
        /* if xB[p], which becomes xN[q] in the adjacent basis, is fixed
         and belongs to the reference space, remove it from there, and
         change all gamma's appropriately */
        k = head[p];
        if (type[k] == GLP_FX && refsp[k])
        {  refsp[k] = 0;
            for (pos = 1; pos <= tcol_nnz; pos++)
            {  i = tcol_ind[pos];
                if (i == p)
                {  if (type[head[m+q]] == GLP_FR) continue;
                    t = 1.0 / tcol_vec[p];
                }
                else
                {  if (type[head[i]] == GLP_FR) continue;
                    t = tcol_vec[i] / tcol_vec[p];
                }
                gamma[i] -= t * t;
                if (gamma[i] < DBL_EPSILON) gamma[i] = DBL_EPSILON;
            }
        }
    }

    function err_in_bbar(csa){
        var m = csa.m;
        var bbar = csa.bbar;
        var i;
        var e, emax;
        var beta = new Float64Array(1+m);
        eval_beta(csa, beta);
        emax = 0.0;
        for (i = 1; i <= m; i++)
        {  e = Math.abs(beta[i] - bbar[i]) / (1.0 + Math.abs(beta[i]));
            if (emax < e) emax = e;
        }
        return emax;
    }

    /***********************************************************************
     *  err_in_cbar - compute maximal relative error in dual solution
     *
     *  This routine returns maximal relative error:
     *
     *     max |cost[j] - cbar[j]| / (1 + |cost[j]|),
     *
     *  where cost and cbar are, respectively, directly computed and the
     *  current (updated) reduced costs of non-basic non-fixed variables.
     *
     *  NOTE: The routine is intended only for debugginig purposes. */

    function err_in_cbar(csa){
        var m = csa.m;
        var n = csa.n;
        var stat = csa.stat;
        var cbar = csa.cbar;
        var j;
        var e, emax, cost;
        var pi = new Float64Array(1+m);
        eval_pi(csa, pi);
        emax = 0.0;
        for (j = 1; j <= n; j++)
        {  if (stat[j] == GLP_NS) continue;
            cost = eval_cost(csa, pi, j);
            e = Math.abs(cost - cbar[j]) / (1.0 + Math.abs(cost));
            if (emax < e) emax = e;
        }
        return emax;
    }

    function err_in_gamma(csa){
        var m = csa.m;
        var type = csa.type;
        var head = csa.head;
        var gamma = csa.gamma;
        var exact = csa.work4;
        var i;
        var e, emax, temp;
        eval_gamma(csa, exact);
        emax = 0.0;
        for (i = 1; i <= m; i++)
        {  if (type[head[i]] == GLP_FR)
        {  xassert(gamma[i] == 1.0);
            xassert(exact[i] == 1.0);
            continue;
        }
            temp = exact[i];
            e = Math.abs(temp - gamma[i]) / (1.0 + Math.abs(temp));
            if (emax < e) emax = e;
        }
        return emax;
    }

    function change_basis(csa){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var type = csa.type;
        var head = csa.head;
        var bind = csa.bind;
        var stat = csa.stat;
        var p = csa.p;
        var delta = csa.delta;
        var q = csa.q;
        var k;
        /* xB[p] leaves the basis, xN[q] enters the basis */
        if (GLP_DEBUG){
            xassert(1 <= p && p <= m);
            xassert(1 <= q && q <= n);
        }
        /* xB[p] <. xN[q] */
        k = head[p]; head[p] = head[m+q]; head[m+q] = k;
        bind[head[p]] = p; bind[head[m+q]] = m + q;
        if (type[k] == GLP_FX)
            stat[q] = GLP_NS;
        else if (delta > 0.0)
        {
            if (GLP_DEBUG){
                xassert(type[k] == GLP_LO || type[k] == GLP_DB)
            }

            stat[q] = GLP_NL;
        }
        else /* delta < 0.0 */
        {
            if (GLP_DEBUG)
                xassert(type[k] == GLP_UP || type[k] == GLP_DB);
            stat[q] = GLP_NU;
        }
    }

    function check_feas(csa, tol_dj){
        var m = csa.m;
        var n = csa.n;
        var orig_type = csa.orig_type;
        var head = csa.head;
        var cbar = csa.cbar;
        var j, k;
        for (j = 1; j <= n; j++)
        {  k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG)
                xassert(1 <= k && k <= m+n);
            if (cbar[j] < - tol_dj)
                if (orig_type[k] == GLP_LO || orig_type[k] == GLP_FR)
                    return 1;
            if (cbar[j] > + tol_dj)
                if (orig_type[k] == GLP_UP || orig_type[k] == GLP_FR)
                    return 1;
        }
        return 0;
    }

    function set_aux_bnds(csa){
        var m = csa.m;
        var n = csa.n;
        var type = csa.type;
        var lb = csa.lb;
        var ub = csa.ub;
        var orig_type = csa.orig_type;
        var head = csa.head;
        var stat = csa.stat;
        var cbar = csa.cbar;
        var j, k;
        for (k = 1; k <= m+n; k++)
        {  switch (orig_type[k])
        {  case GLP_FR:
                /* to force free variables to enter the basis */
                type[k] = GLP_DB; lb[k] = -1e3; ub[k] = +1e3;
                break;
            case GLP_LO:
                type[k] = GLP_DB; lb[k] = 0.0; ub[k] = +1.0;
                break;
            case GLP_UP:
                type[k] = GLP_DB; lb[k] = -1.0; ub[k] = 0.0;
                break;
            case GLP_DB:
            case GLP_FX:
                type[k] = GLP_FX; lb[k] = ub[k] = 0.0;
                break;
            default:
                xassert(orig_type != orig_type);
        }
        }
        for (j = 1; j <= n; j++)
        {   k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG)
                xassert(1 <= k && k <= m+n);
            if (type[k] == GLP_FX)
                stat[j] = GLP_NS;
            else if (cbar[j] >= 0.0)
                stat[j] = GLP_NL;
            else
                stat[j] = GLP_NU;
        }
    }

    function set_orig_bnds(csa){
        var m = csa.m;
        var n = csa.n;
        var type = csa.type;
        var lb = csa.lb;
        var ub = csa.ub;
        var orig_type = csa.orig_type;
        var orig_lb = csa.orig_lb;
        var orig_ub = csa.orig_ub;
        var head = csa.head;
        var stat = csa.stat;
        var cbar = csa.cbar;
        var j, k;
        xcopyArr(type, 1, orig_type, 1, m+n);
        xcopyArr(lb, 1, orig_lb, 1, m+n);
        xcopyArr(ub, 1, orig_ub, 1, m+n);
        for (j = 1; j <= n; j++)
        {  k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG)
                xassert(1 <= k && k <= m+n);
            switch (type[k])
            {  case GLP_FR:
                stat[j] = GLP_NF;
                break;
                case GLP_LO:
                    stat[j] = GLP_NL;
                    break;
                case GLP_UP:
                    stat[j] = GLP_NU;
                    break;
                case GLP_DB:
                    if (cbar[j] >= +DBL_EPSILON)
                        stat[j] = GLP_NL;
                    else if (cbar[j] <= -DBL_EPSILON)
                        stat[j] = GLP_NU;
                    else if (Math.abs(lb[k]) <= Math.abs(ub[k]))
                        stat[j] = GLP_NL;
                    else
                        stat[j] = GLP_NU;
                    break;
                case GLP_FX:
                    stat[j] = GLP_NS;
                    break;
                default:
                    xassert(type != type);
            }
        }
    }

    function check_stab(csa, tol_dj){
        var n = csa.n;
        var stat = csa.stat;
        var cbar = csa.cbar;
        var j;
        for (j = 1; j <= n; j++)
        {  if (cbar[j] < - tol_dj)
            if (stat[j] == GLP_NL || stat[j] == GLP_NF) return 1;
            if (cbar[j] > + tol_dj)
                if (stat[j] == GLP_NU || stat[j] == GLP_NF) return 1;
        }
        return 0;
    }

    function eval_obj(csa){
        var m = csa.m;
        var n = csa.n;
        var obj = csa.obj;
        var head = csa.head;
        var bbar = csa.bbar;
        var i, j, k;
        var sum;
        sum = obj[0];
        /* walk through the list of basic variables */
        for (i = 1; i <= m; i++)
        {  k = head[i]; /* x[k] = xB[i] */
            if (GLP_DEBUG)
                xassert(1 <= k && k <= m+n);
            if (k > m)
                sum += obj[k-m] * bbar[i];
        }
        /* walk through the list of non-basic variables */
        for (j = 1; j <= n; j++)
        {  k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG)
                xassert(1 <= k && k <= m+n);
            if (k > m)
                sum += obj[k-m] * get_xN(csa, j);
        }
        return sum;
    }

    function display(csa, parm, spec){
        var m = csa.m;
        var n = csa.n;
        var coef = csa.coef;
        var orig_type = csa.orig_type;
        var head = csa.head;
        var stat = csa.stat;
        var phase = csa.phase;
        var bbar = csa.bbar;
        var cbar = csa.cbar;
        var i, j, cnt;
        var sum;
        if (parm.msg_lev < GLP_MSG_ON) return;
        if (parm.out_dly > 0 &&
            1000.0 * xdifftime(xtime(), csa.tm_beg) < parm.out_dly)
            return;
        if (csa.it_cnt == csa.it_dpy) return;
        if (!spec && csa.it_cnt % parm.out_frq != 0) return;
        /* compute the sum of dual infeasibilities */
        sum = 0.0;
        if (phase == 1)
        {  for (i = 1; i <= m; i++)
            sum -= coef[head[i]] * bbar[i];
            for (j = 1; j <= n; j++)
                sum -= coef[head[m+j]] * get_xN(csa, j);
        }
        else
        {  for (j = 1; j <= n; j++)
        {  if (cbar[j] < 0.0)
            if (stat[j] == GLP_NL || stat[j] == GLP_NF)
                sum -= cbar[j];
            if (cbar[j] > 0.0)
                if (stat[j] == GLP_NU || stat[j] == GLP_NF)
                    sum += cbar[j];
        }
        }
        /* determine the number of basic fixed variables */
        cnt = 0;
        for (i = 1; i <= m; i++)
            if (orig_type[head[i]] == GLP_FX) cnt++;
        if (csa.phase == 1)
            xprintf(" " + csa.it_cnt + ":  infeas = " + sum + " (" + cnt + ")");
        else
            xprintf("|" + csa.it_cnt + ": obj = " + eval_obj(csa) + "  infeas = " + sum + " (" + cnt + ")");
        csa.it_dpy = csa.it_cnt;
    }

    function store_sol(csa, lp, p_stat, d_stat, ray){
        var m = csa.m;
        var n = csa.n;
        var zeta = csa.zeta;
        var head = csa.head;
        var stat = csa.stat;
        var bbar = csa.bbar;
        var cbar = csa.cbar;
        var i, j, k;
        var col, row;
        if (GLP_DEBUG){
            xassert(lp.m == m);
            xassert(lp.n == n);
            /* basis factorization */
            xassert(!lp.valid && lp.bfd == null);
            xassert(csa.valid && csa.bfd != null);
        }
        lp.valid = 1; csa.valid = 0;
        lp.bfd = csa.bfd; csa.bfd = null;
        xcopyArr(lp.head, 1, head, 1, m);
        /* basic solution status */
        lp.pbs_stat = p_stat;
        lp.dbs_stat = d_stat;
        /* objective function value */
        lp.obj_val = eval_obj(csa);
        /* simplex iteration count */
        lp.it_cnt = csa.it_cnt;
        /* unbounded ray */
        lp.some = ray;
        /* basic variables */
        for (i = 1; i <= m; i++)
        {  k = head[i]; /* x[k] = xB[i] */
            if (GLP_DEBUG)
                xassert(1 <= k && k <= m+n);
            if (k <= m)
            {   row = lp.row[k];
                row.stat = GLP_BS;
                row.bind = i;
                row.prim = bbar[i] / row.rii;
                row.dual = 0.0;
            }
            else
            {   col = lp.col[k-m];
                col.stat = GLP_BS;
                col.bind = i;
                col.prim = bbar[i] * col.sjj;
                col.dual = 0.0;
            }
        }
        /* non-basic variables */
        for (j = 1; j <= n; j++)
        {  k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG)
                xassert(1 <= k && k <= m+n);
            if (k <= m)
            {   row = lp.row[k];
                row.stat = stat[j];
                row.bind = 0;
                switch (stat[j])
                {  case GLP_NL:
                    row.prim = row.lb; break;
                    case GLP_NU:
                        row.prim = row.ub; break;
                    case GLP_NF:
                        row.prim = 0.0; break;
                    case GLP_NS:
                        row.prim = row.lb; break;
                    default:
                        xassert(stat != stat);
                }
                row.dual = (cbar[j] * row.rii) / zeta;
            }
            else
            {   col = lp.col[k-m];
                col.stat = stat[j];
                col.bind = 0;
                switch (stat[j])
                {  case GLP_NL:
                    col.prim = col.lb; break;
                    case GLP_NU:
                        col.prim = col.ub; break;
                    case GLP_NF:
                        col.prim = 0.0; break;
                    case GLP_NS:
                        col.prim = col.lb; break;
                    default:
                        xassert(stat != stat);
                }
                col.dual = (cbar[j] / col.sjj) / zeta;
            }
        }
    }

    var csa;
    var binv_st = 2;
    /* status of basis matrix factorization:
     0 - invalid; 1 - just computed; 2 - updated */
    var bbar_st = 0;
    /* status of primal values of basic variables:
     0 - invalid; 1 - just computed; 2 - updated */
    var cbar_st = 0;
    /* status of reduced costs of non-basic variables:
     0 - invalid; 1 - just computed; 2 - updated */
    var rigorous = 0;
    /* rigorous mode flag; this flag is used to enable iterative
     refinement on computing pivot rows and columns of the simplex
     table */
    var check = 0;
    var p_stat, d_stat, ret;
    /* allocate and initialize the common storage area */
    csa = alloc_csa(lp);
    init_csa(csa, lp);
    if (parm.msg_lev >= GLP_MSG_DBG)
        xprintf("Objective scale factor = " + csa.zeta + "");

    while (true){
        /* main loop starts here */
        /* compute factorization of the basis matrix */
        if (binv_st == 0)
        {  ret = invert_B(csa);
            if (ret != 0)
            {  if (parm.msg_lev >= GLP_MSG_ERR)
            {  xprintf("Error: unable to factorize the basis matrix (" + ret + ")");
                xprintf("Sorry, basis recovery procedure not implemented yet");
            }
                xassert(!lp.valid && lp.bfd == null);
                lp.bfd = csa.bfd; csa.bfd = null;
                lp.pbs_stat = lp.dbs_stat = GLP_UNDEF;
                lp.obj_val = 0.0;
                lp.it_cnt = csa.it_cnt;
                lp.some = 0;
                ret = GLP_EFAIL;
                return ret;
            }
            csa.valid = 1;
            binv_st = 1; /* just computed */
            /* invalidate basic solution components */
            bbar_st = cbar_st = 0;
        }
        /* compute reduced costs of non-basic variables */
        if (cbar_st == 0)
        {  eval_cbar(csa);
            cbar_st = 1; /* just computed */
            /* determine the search phase, if not determined yet */
            if (csa.phase == 0)
            {  if (check_feas(csa, 0.90 * parm.tol_dj) != 0)
            {  /* current basic solution is dual infeasible */
                /* start searching for dual feasible solution */
                csa.phase = 1;
                set_aux_bnds(csa);
            }
            else
            {  /* current basic solution is dual feasible */
                /* start searching for optimal solution */
                csa.phase = 2;
                set_orig_bnds(csa);
            }
                xassert(check_stab(csa, parm.tol_dj) == 0);
                /* some non-basic double-bounded variables might become
                 fixed (on phase I) or vice versa (on phase II) */
                csa.refct = 0;
                /* bounds of non-basic variables have been changed, so
                 invalidate primal values */
                bbar_st = 0;
            }
            /* make sure that the current basic solution remains dual
             feasible */
            if (check_stab(csa, parm.tol_dj) != 0)
            {  if (parm.msg_lev >= GLP_MSG_ERR)
                xprintf("Warning: numerical instability (dual simplex, phase " + (csa.phase == 1 ? "I" : "II") + ")");
                if (parm.meth == GLP_DUALP)
                {  store_sol(csa, lp, GLP_UNDEF, GLP_UNDEF, 0);
                    ret = GLP_EFAIL;
                    return ret;
                }
                /* restart the search */
                csa.phase = 0;
                binv_st = 0;
                rigorous = 5;
                continue;
            }
        }
        xassert(csa.phase == 1 || csa.phase == 2);
        /* on phase I we do not need to wait until the current basic
         solution becomes primal feasible; it is sufficient to make
         sure that all reduced costs have correct signs */
        if (csa.phase == 1 && check_feas(csa, parm.tol_dj) == 0)
        {  /* the current basis is dual feasible; switch to phase II */
            display(csa, parm, 1);
            csa.phase = 2;
            if (cbar_st != 1)
            {  eval_cbar(csa);
                cbar_st = 1;
            }
            set_orig_bnds(csa);
            csa.refct = 0;
            bbar_st = 0;
        }
        /* compute primal values of basic variables */
        if (bbar_st == 0)
        {  eval_bbar(csa);
            if (csa.phase == 2)
                csa.bbar[0] = eval_obj(csa);
            bbar_st = 1; /* just computed */
        }
        /* redefine the reference space, if required */
        switch (parm.pricing)
        {  case GLP_PT_STD:
            break;
            case GLP_PT_PSE:
                if (csa.refct == 0) reset_refsp(csa);
                break;
            default:
                xassert(parm != parm);
        }
        /* at this point the basis factorization and all basic solution
         components are valid */
        xassert(binv_st && bbar_st && cbar_st);
        /* check accuracy of current basic solution components (only for
         debugging) */
        if (check)
        {  var e_bbar = err_in_bbar(csa);
            var e_cbar = err_in_cbar(csa);
            var e_gamma =
                (parm.pricing == GLP_PT_PSE ? err_in_gamma(csa) : 0.0);
            xprintf("e_bbar = " + e_bbar + "; e_cbar = " + e_cbar + "; e_gamma = " + e_gamma + "");
            xassert(e_bbar <= 1e-5 && e_cbar <= 1e-5 && e_gamma <= 1e-3);
        }
        /* if the objective has to be maximized, check if it has reached
         its lower limit */
        if (csa.phase == 2 && csa.zeta < 0.0 &&
            parm.obj_ll > -DBL_MAX && csa.bbar[0] <= parm.obj_ll)
        {  if (bbar_st != 1 || cbar_st != 1)
        {  if (bbar_st != 1) bbar_st = 0;
            if (cbar_st != 1) cbar_st = 0;
            continue;
        }
            display(csa, parm, 1);
            if (parm.msg_lev >= GLP_MSG_ALL)
                xprintf("OBJECTIVE LOWER LIMIT REACHED; SEARCH TERMINATED"
                );
            store_sol(csa, lp, GLP_INFEAS, GLP_FEAS, 0);
            ret = GLP_EOBJLL;
            return ret;
        }
        /* if the objective has to be minimized, check if it has reached
         its upper limit */
        if (csa.phase == 2 && csa.zeta > 0.0 &&
            parm.obj_ul < +DBL_MAX && csa.bbar[0] >= parm.obj_ul)
        {  if (bbar_st != 1 || cbar_st != 1)
        {  if (bbar_st != 1) bbar_st = 0;
            if (cbar_st != 1) cbar_st = 0;
            continue;
        }
            display(csa, parm, 1);
            if (parm.msg_lev >= GLP_MSG_ALL)
                xprintf("OBJECTIVE UPPER LIMIT REACHED; SEARCH TERMINATED"
                );
            store_sol(csa, lp, GLP_INFEAS, GLP_FEAS, 0);
            ret = GLP_EOBJUL;
            return ret;
        }
        /* check if the iteration limit has been exhausted */
        if (parm.it_lim < INT_MAX &&
            csa.it_cnt - csa.it_beg >= parm.it_lim)
        {  if (csa.phase == 2 && bbar_st != 1 || cbar_st != 1)
        {  if (csa.phase == 2 && bbar_st != 1) bbar_st = 0;
            if (cbar_st != 1) cbar_st = 0;
            continue;
        }
            display(csa, parm, 1);
            if (parm.msg_lev >= GLP_MSG_ALL)
                xprintf("ITERATION LIMIT EXCEEDED; SEARCH TERMINATED");
            switch (csa.phase)
            {  case 1:
                d_stat = GLP_INFEAS;
                set_orig_bnds(csa);
                eval_bbar(csa);
                break;
                case 2:
                    d_stat = GLP_FEAS;
                    break;
                default:
                    xassert(csa != csa);
            }
            store_sol(csa, lp, GLP_INFEAS, d_stat, 0);
            ret = GLP_EITLIM;
            return ret;
        }
        /* check if the time limit has been exhausted */
        if (parm.tm_lim < INT_MAX &&
            1000.0 * xdifftime(xtime(), csa.tm_beg) >= parm.tm_lim)
        {  if (csa.phase == 2 && bbar_st != 1 || cbar_st != 1)
        {  if (csa.phase == 2 && bbar_st != 1) bbar_st = 0;
            if (cbar_st != 1) cbar_st = 0;
            continue;
        }
            display(csa, parm, 1);
            if (parm.msg_lev >= GLP_MSG_ALL)
                xprintf("TIME LIMIT EXCEEDED; SEARCH TERMINATED");
            switch (csa.phase)
            {  case 1:
                d_stat = GLP_INFEAS;
                set_orig_bnds(csa);
                eval_bbar(csa);
                break;
                case 2:
                    d_stat = GLP_FEAS;
                    break;
                default:
                    xassert(csa != csa);
            }
            store_sol(csa, lp, GLP_INFEAS, d_stat, 0);
            ret = GLP_ETMLIM;
            return ret;
        }
        /* display the search progress */
        display(csa, parm, 0);
        /* choose basic variable xB[p] */
        chuzr(csa, parm.tol_bnd);
        if (csa.p == 0)
        {  if (bbar_st != 1 || cbar_st != 1)
        {  if (bbar_st != 1) bbar_st = 0;
            if (cbar_st != 1) cbar_st = 0;
            continue;
        }
            display(csa, parm, 1);
            switch (csa.phase)
            {  case 1:
                if (parm.msg_lev >= GLP_MSG_ALL)
                    xprintf("PROBLEM HAS NO DUAL FEASIBLE SOLUTION");
                set_orig_bnds(csa);
                eval_bbar(csa);
                p_stat = GLP_INFEAS; d_stat = GLP_NOFEAS;
                break;
                case 2:
                    if (parm.msg_lev >= GLP_MSG_ALL)
                        xprintf("OPTIMAL SOLUTION FOUND");
                    p_stat = d_stat = GLP_FEAS;
                    break;
                default:
                    xassert(csa != csa);
            }
            store_sol(csa, lp, p_stat, d_stat, 0);
            ret = 0;
            return ret;
        }
        /* compute pivot row of the simplex table */
        {  var rho = csa.work4;
            eval_rho(csa, rho);
            if (rigorous) refine_rho(csa, rho);
            eval_trow(csa, rho);
            sort_trow(csa, parm.tol_bnd);
        }
        /* choose non-basic variable xN[q] */
        switch (parm.r_test)
        {  case GLP_RT_STD:
            chuzc(csa, 0.0);
            break;
            case GLP_RT_HAR:
                chuzc(csa, 0.30 * parm.tol_dj);
                break;
            default:
                xassert(parm != parm);
        }
        if (csa.q == 0)
        {  if (bbar_st != 1 || cbar_st != 1 || !rigorous)
        {  if (bbar_st != 1) bbar_st = 0;
            if (cbar_st != 1) cbar_st = 0;
            rigorous = 1;
            continue;
        }
            display(csa, parm, 1);
            switch (csa.phase)
            {  case 1:
                if (parm.msg_lev >= GLP_MSG_ERR)
                    xprintf("Error: unable to choose basic variable on phase I");
                xassert(!lp.valid && lp.bfd == null);
                lp.bfd = csa.bfd; csa.bfd = null;
                lp.pbs_stat = lp.dbs_stat = GLP_UNDEF;
                lp.obj_val = 0.0;
                lp.it_cnt = csa.it_cnt;
                lp.some = 0;
                ret = GLP_EFAIL;
                break;
                case 2:
                    if (parm.msg_lev >= GLP_MSG_ALL)
                        xprintf("PROBLEM HAS NO FEASIBLE SOLUTION");
                    store_sol(csa, lp, GLP_NOFEAS, GLP_FEAS,
                        csa.head[csa.p]);
                    ret = 0;
                    break;
                default:
                    xassert(csa != csa);
            }
            return ret;
        }
        /* check if the pivot element is acceptable */
        {  var piv = csa.trow_vec[csa.q];
            var eps = 1e-5 * (1.0 + 0.01 * csa.trow_max);
            if (Math.abs(piv) < eps)
            {  if (parm.msg_lev >= GLP_MSG_DBG)
                xprintf("piv = " + piv + "; eps = " + eps + "");
                if (!rigorous)
                {  rigorous = 5;
                    continue;
                }
            }
        }
        /* now xN[q] and xB[p] have been chosen anyhow */
        /* compute pivot column of the simplex table */
        eval_tcol(csa);
        if (rigorous) refine_tcol(csa);
        /* accuracy check based on the pivot element */
        {  var piv1 = csa.tcol_vec[csa.p]; /* more accurate */
            var piv2 = csa.trow_vec[csa.q]; /* less accurate */
            xassert(piv1 != 0.0);
            if (Math.abs(piv1 - piv2) > 1e-8 * (1.0 + Math.abs(piv1)) ||
                !(piv1 > 0.0 && piv2 > 0.0 || piv1 < 0.0 && piv2 < 0.0))
            {  if (parm.msg_lev >= GLP_MSG_DBG)
                xprintf("piv1 = " + piv1 + "; piv2 = " + piv2 + "");
                if (binv_st != 1 || !rigorous)
                {  if (binv_st != 1) binv_st = 0;
                    rigorous = 5;
                    continue;
                }
                /* (not a good idea; should be revised later) */
                if (csa.tcol_vec[csa.p] == 0.0)
                {  csa.tcol_nnz++;
                    xassert(csa.tcol_nnz <= csa.m);
                    csa.tcol_ind[csa.tcol_nnz] = csa.p;
                }
                csa.tcol_vec[csa.p] = piv2;
            }
        }
        /* update primal values of basic variables */
        update_bbar(csa);
        if (csa.phase == 2)
            csa.bbar[0] += (csa.cbar[csa.q] / csa.zeta) *
                (csa.delta / csa.tcol_vec[csa.p]);
        bbar_st = 2; /* updated */
        /* update reduced costs of non-basic variables */
        update_cbar(csa);
        cbar_st = 2; /* updated */
        /* update steepest edge coefficients */
        switch (parm.pricing)
        {  case GLP_PT_STD:
            break;
            case GLP_PT_PSE:
                if (csa.refct > 0) update_gamma(csa);
                break;
            default:
                xassert(parm != parm);
        }
        /* update factorization of the basis matrix */
        ret = update_B(csa, csa.p, csa.head[csa.m+csa.q]);
        if (ret == 0)
            binv_st = 2; /* updated */
        else
        {  csa.valid = 0;
            binv_st = 0; /* invalid */
        }
        /* change the basis header */
        change_basis(csa);
        /* iteration complete */
        csa.it_cnt++;
        if (rigorous > 0) rigorous--;
    }
}

