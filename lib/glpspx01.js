function spx_primal(lp, parm){

    var kappa = 0.10;

    function alloc_csa(lp){
        var m = lp.m;
        var n = lp.n;
        var nnz = lp.nnz;
        var csa = {};
        xassert(m > 0 && n > 0);
        csa.m = m;
        csa.n = n;
        csa.type = new Array(1+m+n);
        csa.lb = new Array(1+m+n);
        csa.ub = new Array(1+m+n);
        csa.coef = new Array(1+m+n);
        csa.obj = new Array(1+n);
        csa.A_ptr = new Array(1+n+1);
        csa.A_ind = new Array(1+nnz);
        csa.A_val = new Array(1+nnz);
        csa.head = new Array(1+m+n);
        csa.stat = new Array(1+n);
        csa.N_ptr = new Array(1+m+1);
        csa.N_len = new Array(1+m);
        csa.N_ind = null; /* will be allocated later */
        csa.N_val = null; /* will be allocated later */
        csa.bbar = new Array(1+m);
        csa.cbar = new Array(1+n);
        csa.refsp = new Array(1+m+n);
        csa.gamma = new Array(1+n);
        csa.tcol_ind = new Array(1+m);
        csa.tcol_vec = new Array(1+m);
        csa.trow_ind = new Array(1+n);
        csa.trow_vec = new Array(1+n);
        csa.work1 = new Array(1+m);
        csa.work2 = new Array(1+m);
        csa.work3 = new Array(1+m);
        csa.work4 = new Array(1+m);
        return csa;
    }

    function init_csa(csa, lp){
        var m = csa.m;
        var n = csa.n;
        var type = csa.type;
        var lb = csa.lb;
        var ub = csa.ub;
        var coef = csa.coef;
        var obj = csa.obj;
        var A_ptr = csa.A_ptr;
        var A_ind = csa.A_ind;
        var A_val = csa.A_val;
        var head = csa.head;
        var stat = csa.stat;
        var refsp = csa.refsp;
        var gamma = csa.gamma;
        var i, j, k, loc;
        var cmax;
        var row, col;
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
        /* matrix A (by columns) */
        loc = 1;
        for (j = 1; j <= n; j++)
        {   A_ptr[j] = loc;
            for (var aij = lp.col[j].ptr; aij != null; aij = aij.c_next)
            {  A_ind[loc] = aij.row.i;
                A_val[loc] = aij.row.rii * aij.val * aij.col.sjj;
                loc++;
            }
        }
        A_ptr[n+1] = loc;
        xassert(loc == lp.nnz+1);
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
        /* factorization of matrix B */
        csa.valid = 1; lp.valid = 0;
        csa.bfd = lp.bfd; lp.bfd = null;
        /* matrix N (by rows) */
        alloc_N(csa);
        build_N(csa);
        /* working parameters */
        csa.phase = 0;
        csa.tm_beg = xtime();
        csa.it_beg = csa.it_cnt = lp.it_cnt;
        csa.it_dpy = -1;
        /* reference space and steepest edge coefficients */
        csa.refct = 0;
        xfillArr(refsp, 1, 0, m+n);
        for (j = 1; j <= n; j++) gamma[j] = 1.0;
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
        if(GLP_DEBUG){xassert(1 <= i && i <= m)}
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

    function update_B(csa, i, k){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var val, ret;
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

    function alloc_N(csa){
        var m = csa.m;
        var n = csa.n;
        var A_ptr = csa.A_ptr;
        var A_ind = csa.A_ind;
        var N_ptr = csa.N_ptr;
        var N_len = csa.N_len;
        var i, j, beg, end, ptr;
        /* determine number of non-zeros in each row of the augmented
         constraint matrix (I|-A) */
        for (i = 1; i <= m; i++)
            N_len[i] = 1;
        for (j = 1; j <= n; j++)
        {  beg = A_ptr[j];
            end = A_ptr[j+1];
            for (ptr = beg; ptr < end; ptr++)
                N_len[A_ind[ptr]]++;
        }
        /* determine maximal row lengths of matrix N and set its row
         pointers */
        N_ptr[1] = 1;
        for (i = 1; i <= m; i++)
        {  /* row of matrix N cannot have more than n non-zeros */
            if (N_len[i] > n) N_len[i] = n;
            N_ptr[i+1] = N_ptr[i] + N_len[i];
        }
        /* now maximal number of non-zeros in matrix N is known */
        csa.N_ind = new Array(N_ptr[m+1]);
        csa.N_val = new Array(N_ptr[m+1]);
    }

    function add_N_col(csa, j, k){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var N_ptr = csa.N_ptr;
        var N_len = csa.N_len;
        var N_ind = csa.N_ind;
        var N_val = csa.N_val;
        var pos;
        if (GLP_DEBUG){
            xassert(1 <= j && j <= n);
            xassert(1 <= k && k <= m+n);
        }
        if (k <= m)
        {  /* N[j] is k-th column of submatrix I */
            pos = N_ptr[k] + (N_len[k]++);
            if (GLP_DEBUG){xassert(pos < N_ptr[k+1])}
            N_ind[pos] = j;
            N_val[pos] = 1.0;
        }
        else
        {  /* N[j] is (k-m)-th column of submatrix (-A) */
            var A_ptr = csa.A_ptr;
            var A_ind = csa.A_ind;
            var A_val = csa.A_val;
            var i, beg, end, ptr;
            beg = A_ptr[k-m];
            end = A_ptr[k-m+1];
            for (ptr = beg; ptr < end; ptr++)
            {  i = A_ind[ptr]; /* row number */
                pos = N_ptr[i] + (N_len[i]++);
                if (GLP_DEBUG){xassert(pos < N_ptr[i+1])}
                N_ind[pos] = j;
                N_val[pos] = - A_val[ptr];
            }
        }
    }

    function del_N_col(csa, j, k){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var N_ptr = csa.N_ptr;
        var N_len = csa.N_len;
        var N_ind = csa.N_ind;
        var N_val = csa.N_val;
        var pos, head, tail;
        if (GLP_DEBUG){
            xassert(1 <= j && j <= n);
            xassert(1 <= k && k <= m+n);
        }
        if (k <= m)
        {  /* N[j] is k-th column of submatrix I */
            /* find element in k-th row of N */
            head = N_ptr[k];
            for (pos = head; N_ind[pos] != j; pos++){} /* nop */
            /* and remove it from the row list */
            tail = head + (--N_len[k]);
            if (GLP_DEBUG){xassert(pos <= tail)}
            N_ind[pos] = N_ind[tail];
            N_val[pos] = N_val[tail];
        }
        else
        {  /* N[j] is (k-m)-th column of submatrix (-A) */
            var A_ptr = csa.A_ptr;
            var A_ind = csa.A_ind;
            var i, beg, end, ptr;
            beg = A_ptr[k-m];
            end = A_ptr[k-m+1];
            for (ptr = beg; ptr < end; ptr++)
            {  i = A_ind[ptr]; /* row number */
                /* find element in i-th row of N */
                head = N_ptr[i];
                for (pos = head; N_ind[pos] != j; pos++){} /* nop */
                /* and remove it from the row list */
                tail = head + (--N_len[i]);
                if (GLP_DEBUG){xassert(pos <= tail)}
                N_ind[pos] = N_ind[tail];
                N_val[pos] = N_val[tail];
            }
        }
    }

    function build_N(csa){
        var m = csa.m;
        var n = csa.n;
        var head = csa.head;
        var stat = csa.stat;
        var N_len = csa.N_len;
        var j, k;
        /* N := empty matrix */
        xfillArr(N_len, 1, 0, m);
        /* go through non-basic columns of matrix (I|-A) */
        for (j = 1; j <= n; j++)
        {  if (stat[j] != GLP_NS)
        {  /* xN[j] is non-fixed; add j-th column to matrix N which is
         k-th column of matrix (I|-A) */
            k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            add_N_col(csa, j, k);
        }
        }
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
        {  k = head[m+j]; /* x[k] = xN[j] */
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

    function eval_bbar(csa)
    {
        eval_beta(csa, csa.bbar);
    }

    function eval_cbar(csa){
        if (GLP_DEBUG){var m = csa.m}
        var n = csa.n;
        if (GLP_DEBUG){var head = csa.head}
        var cbar = csa.cbar;
        var pi = csa.work3;
        var j;
        if(GLP_DEBUG){var k}
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
        var j, k;
        xassert(csa.refct == 0);
        csa.refct = 1000;
        xfillArr(refsp, 1, 0, m+n);
        for (j = 1; j <= n; j++)
        {  k = head[m+j]; /* x[k] = xN[j] */
            refsp[k] = 1;
            gamma[j] = 1.0;
        }
    }

    function eval_gamma(csa, j){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var head = csa.head;
        var refsp = csa.refsp;
        var alfa = csa.work3;
        var h = csa.work3;
        var i, k;
        var gamma;
        if (GLP_DEBUG){xassert(1 <= j && j <= n)}
        k = head[m+j]; /* x[k] = xN[j] */
        if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
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
        /* compute gamma */
        gamma = (refsp[k] ? 1.0 : 0.0);
        for (i = 1; i <= m; i++)
        {  k = head[i];
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            if (refsp[k]) gamma += alfa[i] * alfa[i];
        }
        return gamma;
    }

    function chuzc(csa, tol_dj){
        var n = csa.n;
        var stat = csa.stat;
        var cbar = csa.cbar;
        var gamma = csa.gamma;
        var j, q;
        var dj, best, temp;
        /* nothing is chosen so far */
        q = 0; best = 0.0;
        /* look through the list of non-basic variables */
        for (j = 1; j <= n; j++)
        {  dj = cbar[j];
            switch (stat[j])
            {  case GLP_NL:
                /* xN[j] can increase */
                if (dj >= - tol_dj) continue;
                break;
                case GLP_NU:
                    /* xN[j] can decrease */
                    if (dj <= + tol_dj) continue;
                    break;
                case GLP_NF:
                    /* xN[j] can change in any direction */
                    if (- tol_dj <= dj && dj <= + tol_dj) continue;
                    break;
                case GLP_NS:
                    /* xN[j] cannot change at all */
                    continue;
                default:
                    xassert(stat != stat);
            }
            /* xN[j] is eligible non-basic variable; choose one which has
             largest weighted reduced cost */
            if (GLP_DEBUG){xassert(gamma[j] > 0.0)}
            temp = (dj * dj) / gamma[j];
            if (best < temp){
                q = j;
                best = temp;
            }
        }
        /* store the index of non-basic variable xN[q] chosen */
        csa.q = q;
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

    function sort_tcol(csa, tol_piv){
        if (GLP_DEBUG){var m = csa.m}
        var nnz = csa.tcol_nnz;
        var tcol_ind = csa.tcol_ind;
        var tcol_vec = csa.tcol_vec;
        var i, num, pos;
        var big, eps, temp;
        /* compute infinity (maximum) norm of the column */
        big = 0.0;
        for (pos = 1; pos <= nnz; pos++)
        {
            if (GLP_DEBUG){
                i = tcol_ind[pos];
                xassert(1 <= i && i <= m);
            }
            temp = Math.abs(tcol_vec[tcol_ind[pos]]);
            if (big < temp) big = temp;
        }
        csa.tcol_max = big;
        /* determine absolute pivot tolerance */
        eps = tol_piv * (1.0 + 0.01 * big);
        /* move significant column components to front of the list */
        for (num = 0; num < nnz; )
        {  i = tcol_ind[nnz];
            if (Math.abs(tcol_vec[i]) < eps)
                nnz--;
            else
            {  num++;
                tcol_ind[nnz] = tcol_ind[num];
                tcol_ind[num] = i;
            }
        }
        csa.tcol_num = num;
    }

    function chuzr(csa, rtol){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var type = csa.type;
        var lb = csa.lb;
        var ub = csa.ub;
        var coef = csa.coef;
        var head = csa.head;
        var phase = csa.phase;
        var bbar = csa.bbar;
        var cbar = csa.cbar;
        var q = csa.q;
        var tcol_ind = csa.tcol_ind;
        var tcol_vec = csa.tcol_vec;
        var tcol_num = csa.tcol_num;
        var i, i_stat, k, p, p_stat, pos;
        var alfa, big, delta, s, t, teta, tmax;
        if (GLP_DEBUG){xassert(1 <= q && q <= n)}
        /* s := - sign(d[q]), where d[q] is reduced cost of xN[q] */
        if (GLP_DEBUG){xassert(cbar[q] != 0.0)}
        s = (cbar[q] > 0.0 ? -1.0 : +1.0);
        /*** FIRST PASS ***/
        k = head[m+q]; /* x[k] = xN[q] */
        if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
        if (type[k] == GLP_DB)
        {  /* xN[q] has both lower and upper bounds */
            p = -1; p_stat = 0; teta = ub[k] - lb[k]; big = 1.0;
        }
        else
        {  /* xN[q] has no opposite bound */
            p = 0; p_stat = 0; teta = DBL_MAX; big = 0.0;
        }
        /* walk through significant elements of the pivot column */
        for (pos = 1; pos <= tcol_num; pos++)
        {  i = tcol_ind[pos];
            if (GLP_DEBUG){xassert(1 <= i && i <= m)}
            k = head[i]; /* x[k] = xB[i] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            alfa = s * tcol_vec[i];
            if (GLP_DEBUG){xassert(alfa != 0.0)}
            /* xB[i] = ... + alfa * xN[q] + ..., and due to s we need to
             consider the only case when xN[q] is increasing */
            if (alfa > 0.0)
            {  /* xB[i] is increasing */
                if (phase == 1 && coef[k] < 0.0)
                {  /* xB[i] violates its lower bound, which plays the role
                 of an upper bound on phase I */
                    delta = rtol * (1.0 + kappa * Math.abs(lb[k]));
                    t = ((lb[k] + delta) - bbar[i]) / alfa;
                    i_stat = GLP_NL;
                }
                else if (phase == 1 && coef[k] > 0.0)
                {  /* xB[i] violates its upper bound, which plays the role
                 of an lower bound on phase I */
                    continue;
                }
                else if (type[k] == GLP_UP || type[k] == GLP_DB ||
                    type[k] == GLP_FX)
                {  /* xB[i] is within its bounds and has an upper bound */
                    delta = rtol * (1.0 + kappa * Math.abs(ub[k]));
                    t = ((ub[k] + delta) - bbar[i]) / alfa;
                    i_stat = GLP_NU;
                }
                else
                {  /* xB[i] is within its bounds and has no upper bound */
                    continue;
                }
            }
            else
            {  /* xB[i] is decreasing */
                if (phase == 1 && coef[k] > 0.0)
                {  /* xB[i] violates its upper bound, which plays the role
                 of an lower bound on phase I */
                    delta = rtol * (1.0 + kappa * Math.abs(ub[k]));
                    t = ((ub[k] - delta) - bbar[i]) / alfa;
                    i_stat = GLP_NU;
                }
                else if (phase == 1 && coef[k] < 0.0)
                {  /* xB[i] violates its lower bound, which plays the role
                 of an upper bound on phase I */
                    continue;
                }
                else if (type[k] == GLP_LO || type[k] == GLP_DB ||
                    type[k] == GLP_FX)
                {  /* xB[i] is within its bounds and has an lower bound */
                    delta = rtol * (1.0 + kappa * Math.abs(lb[k]));
                    t = ((lb[k] - delta) - bbar[i]) / alfa;
                    i_stat = GLP_NL;
                }
                else
                {  /* xB[i] is within its bounds and has no lower bound */
                    continue;
                }
            }
            /* t is a change of xN[q], on which xB[i] reaches its bound
             (possibly relaxed); since the basic solution is assumed to
             be primal feasible (or pseudo feasible on phase I), t has
             to be non-negative by definition; however, it may happen
             that xB[i] slightly (i.e. within a tolerance) violates its
             bound, that leads to negative t; in the latter case, if
             xB[i] is chosen, negative t means that xN[q] changes in
             wrong direction; if pivot alfa[i,q] is close to zero, even
             small bound violation of xB[i] may lead to a large change
             of xN[q] in wrong direction; let, for example, xB[i] >= 0
             and in the current basis its value be -5e-9; let also xN[q]
             be on its zero bound and should increase; from the ratio
             test rule it follows that the pivot alfa[i,q] < 0; however,
             if alfa[i,q] is, say, -1e-9, the change of xN[q] in wrong
             direction is 5e-9 / (-1e-9) = -5, and using it for updating
             values of other basic variables will give absolutely wrong
             results; therefore, if t is negative, we should replace it
             by exact zero assuming that xB[i] is exactly on its bound,
             and the violation appears due to round-off errors */
            if (t < 0.0) t = 0.0;
            /* apply minimal ratio test */
            if (teta > t || teta == t && big < Math.abs(alfa)){
                p = i; p_stat = i_stat; teta = t; big = Math.abs(alfa);
            }

        }
        /* the second pass is skipped in the following cases: */
        /* if the standard ratio test is used */
        if (rtol == 0.0) return done();
        /* if xN[q] reaches its opposite bound or if no basic variable
         has been chosen on the first pass */
        if (p <= 0) return done();
        /* if xB[p] is a blocking variable, i.e. if it prevents xN[q]
         from any change */
        if (teta == 0.0) return done();
        /*** SECOND PASS ***/
        /* here tmax is a maximal change of xN[q], on which the solution
         remains primal feasible (or pseudo feasible on phase I) within
         a tolerance */
        tmax = teta;
        /* nothing is chosen so far */
        p = 0; p_stat = 0; teta = DBL_MAX; big = 0.0;
        /* walk through significant elements of the pivot column */
        for (pos = 1; pos <= tcol_num; pos++)
        {  i = tcol_ind[pos];
            if (GLP_DEBUG){xassert(1 <= i && i <= m)}
            k = head[i]; /* x[k] = xB[i] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            alfa = s * tcol_vec[i];
            if (GLP_DEBUG){xassert(alfa != 0.0)}
            /* xB[i] = ... + alfa * xN[q] + ..., and due to s we need to
             consider the only case when xN[q] is increasing */
            if (alfa > 0.0)
            {  /* xB[i] is increasing */
                if (phase == 1 && coef[k] < 0.0)
                {  /* xB[i] violates its lower bound, which plays the role
                 of an upper bound on phase I */
                    t = (lb[k] - bbar[i]) / alfa;
                    i_stat = GLP_NL;
                }
                else if (phase == 1 && coef[k] > 0.0)
                {  /* xB[i] violates its upper bound, which plays the role
                 of an lower bound on phase I */
                    continue;
                }
                else if (type[k] == GLP_UP || type[k] == GLP_DB ||
                    type[k] == GLP_FX)
                {  /* xB[i] is within its bounds and has an upper bound */
                    t = (ub[k] - bbar[i]) / alfa;
                    i_stat = GLP_NU;
                }
                else
                {  /* xB[i] is within its bounds and has no upper bound */
                    continue;
                }
            }
            else
            {  /* xB[i] is decreasing */
                if (phase == 1 && coef[k] > 0.0)
                {  /* xB[i] violates its upper bound, which plays the role
                 of an lower bound on phase I */
                    t = (ub[k] - bbar[i]) / alfa;
                    i_stat = GLP_NU;
                }
                else if (phase == 1 && coef[k] < 0.0)
                {  /* xB[i] violates its lower bound, which plays the role
                 of an upper bound on phase I */
                    continue;
                }
                else if (type[k] == GLP_LO || type[k] == GLP_DB ||
                    type[k] == GLP_FX)
                {  /* xB[i] is within its bounds and has an lower bound */
                    t = (lb[k] - bbar[i]) / alfa;
                    i_stat = GLP_NL;
                }
                else
                {  /* xB[i] is within its bounds and has no lower bound */
                    continue;
                }
            }
            /* (see comments for the first pass) */
            if (t < 0.0) t = 0.0;
            /* t is a change of xN[q], on which xB[i] reaches its bound;
             if t <= tmax, all basic variables can violate their bounds
             only within relaxation tolerance delta; we can use this
             freedom and choose basic variable having largest influence
             coefficient to avoid possible numeric instability */
            if (t <= tmax && big < Math.abs(alfa)){
                p = i; p_stat = i_stat; teta = t; big = Math.abs(alfa);
            }
        }
        /* something must be chosen on the second pass */
        xassert(p != 0);

        function done(){
            /* store the index and status of basic variable xB[p] chosen */
            csa.p = p;
            if (p > 0 && type[head[p]] == GLP_FX)
                csa.p_stat = GLP_NS;
            else
                csa.p_stat = p_stat;
            /* store corresponding change of non-basic variable xN[q] */
            if (GLP_DEBUG){xassert(teta >= 0.0)}
            csa.teta = s * teta;
        }
        done();
    }

    function eval_rho(csa, rho){
        var m = csa.m;
        var p = csa.p;
        var i;
        if (GLP_DEBUG){xassert(1 <= p && p <= m)}
        /* construct the right-hand side vector rho[p] */
        for (i = 1; i <= m; i++)
            rho[i] = 0.0;
        rho[p] = 1.0;
        /* solve system B'* rho = rho[p] */
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

    function eval_trow(csa, rho){
        var m = csa.m;
        var n = csa.n;
        if (GLP_DEBUG){var stat = csa.stat}
        var N_ptr = csa.N_ptr;
        var N_len = csa.N_len;
        var N_ind = csa.N_ind;
        var N_val = csa.N_val;
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
            beg = N_ptr[i];
            end = beg + N_len[i];
            for (ptr = beg; ptr < end; ptr++)
            {
                if (GLP_DEBUG){
                    j = N_ind[ptr];
                    xassert(1 <= j && j <= n);
                    xassert(stat[j] != GLP_NS);
                }
                trow_vec[N_ind[ptr]] -= temp * N_val[ptr];
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

    function update_bbar(csa){
        if (GLP_DEBUG){
            var m = csa.m;
            var n = csa.n;
        }
        var bbar = csa.bbar;
        var q = csa.q;
        var tcol_nnz = csa.tcol_nnz;
        var tcol_ind = csa.tcol_ind;
        var tcol_vec = csa.tcol_vec;
        var p = csa.p;
        var teta = csa.teta;
        var i, pos;
        if (GLP_DEBUG){
            xassert(1 <= q && q <= n);
            xassert(p < 0 || 1 <= p && p <= m);
        }
        /* if xN[q] leaves the basis, compute its value in the adjacent
         basis, where it will replace xB[p] */
        if (p > 0)
            bbar[p] = get_xN(csa, q) + teta;
        /* update values of other basic variables (except xB[p], because
         it will be replaced by xN[q]) */
        if (teta == 0.0) return;
        for (pos = 1; pos <= tcol_nnz; pos++)
        {  i = tcol_ind[pos];
            /* skip xB[p] */
            if (i == p) continue;
            /* (change of xB[i]) = alfa[i,q] * (change of xN[q]) */
            bbar[i] += tcol_vec[i] * teta;
        }
    }

    function reeval_cost(csa){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var coef = csa.coef;
        var head = csa.head;
        var q = csa.q;
        var tcol_nnz = csa.tcol_nnz;
        var tcol_ind = csa.tcol_ind;
        var tcol_vec = csa.tcol_vec;
        var i, pos;
        var dq;
        if (GLP_DEBUG){xassert(1 <= q && q <= n)}
        dq = coef[head[m+q]];
        for (pos = 1; pos <= tcol_nnz; pos++)
        {  i = tcol_ind[pos];
            if (GLP_DEBUG){xassert(1 <= i && i <= m)}
            dq += coef[head[i]] * tcol_vec[i];
        }
        return dq;
    }

    function update_cbar(csa){
        if (GLP_DEBUG){var n = csa.n}
        var cbar = csa.cbar;
        var q = csa.q;
        var trow_nnz = csa.trow_nnz;
        var trow_ind = csa.trow_ind;
        var trow_vec = csa.trow_vec;
        var j, pos;
        var new_dq;
        if (GLP_DEBUG){xassert(1 <= q && q <= n)}
        /* compute reduced cost of xB[p] in the adjacent basis, where it
         will replace xN[q] */
        if (GLP_DEBUG){xassert(trow_vec[q] != 0.0)}
        new_dq = (cbar[q] /= trow_vec[q]);
        /* update reduced costs of other non-basic variables (except
         xN[q], because it will be replaced by xB[p]) */
        for (pos = 1; pos <= trow_nnz; pos++)
        {  j = trow_ind[pos];
            /* skip xN[q] */
            if (j == q) continue;
            cbar[j] -= trow_vec[j] * new_dq;
        }
    }

    function update_gamma(csa){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var type = csa.type;
        var A_ptr = csa.A_ptr;
        var A_ind = csa.A_ind;
        var A_val = csa.A_val;
        var head = csa.head;
        var refsp = csa.refsp;
        var gamma = csa.gamma;
        var q = csa.q;
        var tcol_nnz = csa.tcol_nnz;
        var tcol_ind = csa.tcol_ind;
        var tcol_vec = csa.tcol_vec;
        var p = csa.p;
        var trow_nnz = csa.trow_nnz;
        var trow_ind = csa.trow_ind;
        var trow_vec = csa.trow_vec;
        var u = csa.work3;
        var i, j, k, pos, beg, end, ptr;
        var gamma_q, delta_q, pivot, s, t, t1, t2;
        if (GLP_DEBUG){
            xassert(1 <= p && p <= m);
            xassert(1 <= q && q <= n);
        }
        /* the basis changes, so decrease the count */
        xassert(csa.refct > 0);
        csa.refct--;
        /* recompute gamma[q] for the current basis more accurately and
         compute auxiliary vector u */
        gamma_q = delta_q = (refsp[head[m+q]] ? 1.0 : 0.0);
        for (i = 1; i <= m; i++) u[i] = 0.0;
        for (pos = 1; pos <= tcol_nnz; pos++)
        {  i = tcol_ind[pos];
            if (refsp[head[i]])
            {  u[i] = t = tcol_vec[i];
                gamma_q += t * t;
            }
            else
                u[i] = 0.0;
        }
        xassert(csa.valid);
        bfd_btran(csa.bfd, u);
        /* update gamma[k] for other non-basic variables (except fixed
         variables and xN[q], because it will be replaced by xB[p]) */
        pivot = trow_vec[q];
        if (GLP_DEBUG){xassert(pivot != 0.0)}
        for (pos = 1; pos <= trow_nnz; pos++)
        {  j = trow_ind[pos];
            /* skip xN[q] */
            if (j == q) continue;
            /* compute t */
            t = trow_vec[j] / pivot;
            /* compute inner product s = N'[j] * u */
            k = head[m+j]; /* x[k] = xN[j] */
            if (k <= m)
                s = u[k];
            else
            {  s = 0.0;
                beg = A_ptr[k-m];
                end = A_ptr[k-m+1];
                for (ptr = beg; ptr < end; ptr++)
                    s -= A_val[ptr] * u[A_ind[ptr]];
            }
            /* compute gamma[k] for the adjacent basis */
            t1 = gamma[j] + t * t * gamma_q + 2.0 * t * s;
            t2 = (refsp[k] ? 1.0 : 0.0) + delta_q * t * t;
            gamma[j] = (t1 >= t2 ? t1 : t2);
            if (gamma[j] < DBL_EPSILON) gamma[j] = DBL_EPSILON;
        }
        /* compute gamma[q] for the adjacent basis */
        if (type[head[p]] == GLP_FX)
            gamma[q] = 1.0;
        else
        {  gamma[q] = gamma_q / (pivot * pivot);
            if (gamma[q] < DBL_EPSILON) gamma[q] = DBL_EPSILON;
        }
    }

    function err_in_bbar(csa){
        var m = csa.m;
        var bbar = csa.bbar;
        var i;
        var e, emax, beta;
        beta = new Array(1+m);
        eval_beta(csa, beta);
        emax = 0.0;
        for (i = 1; i <= m; i++)
        {  e = Math.abs(beta[i] - bbar[i]) / (1.0 + Math.abs(beta[i]));
            if (emax < e) emax = e;
        }
        return emax;
    }

    function err_in_cbar(csa){
        var m = csa.m;
        var n = csa.n;
        var stat = csa.stat;
        var cbar = csa.cbar;
        var j;
        var e, emax, cost, pi;
        pi = new Array(1+m);
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
        var n = csa.n;
        var stat = csa.stat;
        var gamma = csa.gamma;
        var j;
        var e, emax, temp;
        emax = 0.0;
        for (j = 1; j <= n; j++)
        {  if (stat[j] == GLP_NS)
        {  xassert(gamma[j] == 1.0);
            continue;
        }
            temp = eval_gamma(csa, j);
            e = Math.abs(temp - gamma[j]) / (1.0 + Math.abs(temp));
            if (emax < e) emax = e;
        }
        return emax;
    }

    function change_basis(csa){
        var m = csa.m;
        if (GLP_DEBUG){
            var n = csa.n;
            var type = csa.type;
        }
        var head = csa.head;
        var stat = csa.stat;
        var q = csa.q;
        var p = csa.p;
        var p_stat = csa.p_stat;
        var k;
        if (GLP_DEBUG){xassert(1 <= q && q <= n)}
        if (p < 0)
        {  /* xN[q] goes to its opposite bound */
            if (GLP_DEBUG){
                k = head[m+q]; /* x[k] = xN[q] */
                xassert(1 <= k && k <= m+n);
                xassert(type[k] == GLP_DB);
            }
            switch (stat[q])
            {  case GLP_NL:
                /* xN[q] increases */
                stat[q] = GLP_NU;
                break;
                case GLP_NU:
                    /* xN[q] decreases */
                    stat[q] = GLP_NL;
                    break;
                default:
                    xassert(stat != stat);
            }
        }
        else
        {  /* xB[p] leaves the basis, xN[q] enters the basis */
            if (GLP_DEBUG){
                xassert(1 <= p && p <= m);
                k = head[p]; /* x[k] = xB[p] */
                switch (p_stat)
                {  case GLP_NL:
                    /* xB[p] goes to its lower bound */
                    xassert(type[k] == GLP_LO || type[k] == GLP_DB);
                    break;
                    case GLP_NU:
                        /* xB[p] goes to its upper bound */
                        xassert(type[k] == GLP_UP || type[k] == GLP_DB);
                        break;
                    case GLP_NS:
                        /* xB[p] goes to its fixed value */
                        xassert(type[k] == GLP_NS);
                        break;
                    default:
                        xassert(p_stat != p_stat);
                }
            }
            /* xB[p] <. xN[q] */
            k = head[p];
            head[p] = head[m+q];
            head[m+q] = k;
            stat[q] = p_stat;
        }
    }

    function set_aux_obj(csa, tol_bnd){
        var m = csa.m;
        var n = csa.n;
        var type = csa.type;
        var lb = csa.lb;
        var ub = csa.ub;
        var coef = csa.coef;
        var head = csa.head;
        var bbar = csa.bbar;
        var i, k, cnt = 0;
        var eps;
        /* use a bit more restrictive tolerance */
        tol_bnd *= 0.90;
        /* clear all objective coefficients */
        for (k = 1; k <= m+n; k++)
            coef[k] = 0.0;
        /* walk through the list of basic variables */
        for (i = 1; i <= m; i++)
        {  k = head[i]; /* x[k] = xB[i] */
            if (type[k] == GLP_LO || type[k] == GLP_DB ||
                type[k] == GLP_FX)
            {  /* x[k] has lower bound */
                eps = tol_bnd * (1.0 + kappa * Math.abs(lb[k]));
                if (bbar[i] < lb[k] - eps)
                {  /* and violates it */
                    coef[k] = -1.0;
                    cnt++;
                }
            }
            if (type[k] == GLP_UP || type[k] == GLP_DB ||
                type[k] == GLP_FX)
            {  /* x[k] has upper bound */
                eps = tol_bnd * (1.0 + kappa * Math.abs(ub[k]));
                if (bbar[i] > ub[k] + eps)
                {  /* and violates it */
                    coef[k] = +1.0;
                    cnt++;
                }
            }
        }
        return cnt;
    }

    function set_orig_obj(csa){
        var m = csa.m;
        var n = csa.n;
        var coef = csa.coef;
        var obj = csa.obj;
        var zeta = csa.zeta;
        var i, j;
        for (i = 1; i <= m; i++)
            coef[i] = 0.0;
        for (j = 1; j <= n; j++)
            coef[m+j] = zeta * obj[j];
    }

    function check_stab(csa, tol_bnd){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var type = csa.type;
        var lb = csa.lb;
        var ub = csa.ub;
        var coef = csa.coef;
        var head = csa.head;
        var phase = csa.phase;
        var bbar = csa.bbar;
        var i, k;
        var eps;
        /* walk through the list of basic variables */
        for (i = 1; i <= m; i++)
        {  k = head[i]; /* x[k] = xB[i] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            if (phase == 1 && coef[k] < 0.0)
            {  /* x[k] must not be greater than its lower bound */
                if (GLP_DEBUG){
                    xassert(type[k] == GLP_LO || type[k] == GLP_DB ||
                        type[k] == GLP_FX);
                }
                eps = tol_bnd * (1.0 + kappa * Math.abs(lb[k]));
                if (bbar[i] > lb[k] + eps) return 1;
            }
            else if (phase == 1 && coef[k] > 0.0)
            {  /* x[k] must not be less than its upper bound */
                if (GLP_DEBUG){
                    xassert(type[k] == GLP_UP || type[k] == GLP_DB ||
                        type[k] == GLP_FX);
                }
                eps = tol_bnd * (1.0 + kappa * Math.abs(ub[k]));
                if (bbar[i] < ub[k] - eps) return 1;
            }
            else
            {  /* either phase = 1 and coef[k] = 0, or phase = 2 */
                if (type[k] == GLP_LO || type[k] == GLP_DB ||
                    type[k] == GLP_FX)
                {  /* x[k] must not be less than its lower bound */
                    eps = tol_bnd * (1.0 + kappa * Math.abs(lb[k]));
                    if (bbar[i] < lb[k] - eps) return 1;
                }
                if (type[k] == GLP_UP || type[k] == GLP_DB ||
                    type[k] == GLP_FX)
                {  /* x[k] must not be greater then its upper bound */
                    eps = tol_bnd * (1.0 + kappa * Math.abs(ub[k]));
                    if (bbar[i] > ub[k] + eps) return 1;
                }
            }
        }
        /* basic solution is primal feasible within a tolerance */
        return 0;
    }

    function check_feas(csa, tol_bnd){
        var m = csa.m;
        if (GLP_DEBUG){
            var n = csa.n;
            var type = csa.type;
        }
        var lb = csa.lb;
        var ub = csa.ub;
        var coef = csa.coef;
        var head = csa.head;
        var bbar = csa.bbar;
        var i, k;
        var eps;
        xassert(csa.phase == 1);
        /* walk through the list of basic variables */
        for (i = 1; i <= m; i++)
        {  k = head[i]; /* x[k] = xB[i] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            if (coef[k] < 0.0)
            {  /* check if x[k] still violates its lower bound */
                if (GLP_DEBUG){
                    xassert(type[k] == GLP_LO || type[k] == GLP_DB ||
                        type[k] == GLP_FX);
                }
                eps = tol_bnd * (1.0 + kappa * Math.abs(lb[k]));
                if (bbar[i] < lb[k] - eps) return 1;
            }
            else if (coef[k] > 0.0)
            {  /* check if x[k] still violates its upper bound */
                if (GLP_DEBUG){
                    xassert(type[k] == GLP_UP || type[k] == GLP_DB ||
                        type[k] == GLP_FX);
                }
                eps = tol_bnd * (1.0 + kappa * Math.abs(ub[k]));
                if (bbar[i] > ub[k] + eps) return 1;
            }
        }
        /* basic solution is primal feasible within a tolerance */
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
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            if (k > m)
                sum += obj[k-m] * bbar[i];
        }
        /* walk through the list of non-basic variables */
        for (j = 1; j <= n; j++)
        {  k = head[m+j]; /* x[k] = xN[j] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            if (k > m)
                sum += obj[k-m] * get_xN(csa, j);
        }
        return sum;
    }

    function display(csa, parm, spec){
        var m = csa.m;
        if (GLP_DEBUG){var n = csa.n}
        var type = csa.type;
        var lb = csa.lb;
        var ub = csa.ub;
        var phase = csa.phase;
        var head = csa.head;
        var bbar = csa.bbar;
        var i, k, cnt;
        var sum;
        if (parm.msg_lev < GLP_MSG_ON) return;
        if (parm.out_dly > 0 &&
            1000.0 * xdifftime(xtime(), csa.tm_beg) < parm.out_dly)
            return;
        if (csa.it_cnt == csa.it_dpy) return;
        if (!spec && csa.it_cnt % parm.out_frq != 0) return;
        /* compute the sum of primal infeasibilities and determine the
         number of basic fixed variables */
        sum = 0.0; cnt = 0;
        for (i = 1; i <= m; i++)
        {  k = head[i]; /* x[k] = xB[i] */
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
            if (type[k] == GLP_LO || type[k] == GLP_DB ||
                type[k] == GLP_FX)
            {  /* x[k] has lower bound */
                if (bbar[i] < lb[k])
                    sum += (lb[k] - bbar[i]);
            }
            if (type[k] == GLP_UP || type[k] == GLP_DB ||
                type[k] == GLP_FX)
            {  /* x[k] has upper bound */
                if (bbar[i] > ub[k])
                    sum += (bbar[i] - ub[k]);
            }
            if (type[k] == GLP_FX) cnt++;
        }
        xprintf((phase == 1 ? ' ' : '*') + csa.it_cnt + ": obj = " + eval_obj(csa) + "  infeas = " + sum + " (" + cnt + ")");
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
        var row, col;
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
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
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
            if (GLP_DEBUG){xassert(1 <= k && k <= m+n)}
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
        /* compute primal values of basic variables */
        if (bbar_st == 0)
        {  eval_bbar(csa);
            bbar_st = 1; /* just computed */
            /* determine the search phase, if not determined yet */
            if (csa.phase == 0)
            {  if (set_aux_obj(csa, parm.tol_bnd) > 0)
            {  /* current basic solution is primal infeasible */
                /* start to minimize the sum of infeasibilities */
                csa.phase = 1;
            }
            else
            {  /* current basic solution is primal feasible */
                /* start to minimize the original objective function */
                set_orig_obj(csa);
                csa.phase = 2;
            }
                xassert(check_stab(csa, parm.tol_bnd) == 0);
                /* working objective coefficients have been changed, so
                 invalidate reduced costs */
                cbar_st = 0;
                display(csa, parm, 1);
            }
            /* make sure that the current basic solution remains primal
             feasible (or pseudo feasible on phase I) */
            if (check_stab(csa, parm.tol_bnd))
            {  /* there are excessive bound violations due to round-off
             errors */
                if (parm.msg_lev >= GLP_MSG_ERR)
                    xprintf("Warning: numerical instability (primal simplex, phase " + (csa.phase == 1 ? "I" : "II") + ")");
                /* restart the search */
                csa.phase = 0;
                binv_st = 0;
                rigorous = 5;
                continue;
            }
        }
        xassert(csa.phase == 1 || csa.phase == 2);
        /* on phase I we do not need to wait until the current basic
         solution becomes dual feasible; it is sufficient to make sure
         that no basic variable violates its bounds */
        if (csa.phase == 1 && !check_feas(csa, parm.tol_bnd))
        {  /* the current basis is primal feasible; switch to phase II */
            csa.phase = 2;
            set_orig_obj(csa);
            cbar_st = 0;
            display(csa, parm, 1);
        }
        /* compute reduced costs of non-basic variables */
        if (cbar_st == 0)
        {  eval_cbar(csa);
            cbar_st = 1; /* just computed */
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
        /* check if the iteration limit has been exhausted */
        if (parm.it_lim < INT_MAX &&
            csa.it_cnt - csa.it_beg >= parm.it_lim)
        {  if (bbar_st != 1 || csa.phase == 2 && cbar_st != 1)
        {  if (bbar_st != 1) bbar_st = 0;
            if (csa.phase == 2 && cbar_st != 1) cbar_st = 0;
            continue;
        }
            display(csa, parm, 1);
            if (parm.msg_lev >= GLP_MSG_ALL)
                xprintf("ITERATION LIMIT EXCEEDED; SEARCH TERMINATED");
            switch (csa.phase)
            {  case 1:
                p_stat = GLP_INFEAS;
                set_orig_obj(csa);
                eval_cbar(csa);
                break;
                case 2:
                    p_stat = GLP_FEAS;
                    break;
                default:
                    xassert(csa != csa);
            }
            chuzc(csa, parm.tol_dj);
            d_stat = (csa.q == 0 ? GLP_FEAS : GLP_INFEAS);
            store_sol(csa, lp, p_stat, d_stat, 0);
            ret = GLP_EITLIM;
            return ret;
        }
        /* check if the time limit has been exhausted */
        if (parm.tm_lim < INT_MAX &&
            1000.0 * xdifftime(xtime(), csa.tm_beg) >= parm.tm_lim)
        {  if (bbar_st != 1 || csa.phase == 2 && cbar_st != 1)
        {  if (bbar_st != 1) bbar_st = 0;
            if (csa.phase == 2 && cbar_st != 1) cbar_st = 0;
            continue;
        }
            display(csa, parm, 1);
            if (parm.msg_lev >= GLP_MSG_ALL)
                xprintf("TIME LIMIT EXCEEDED; SEARCH TERMINATED");
            switch (csa.phase)
            {  case 1:
                p_stat = GLP_INFEAS;
                set_orig_obj(csa);
                eval_cbar(csa);
                break;
                case 2:
                    p_stat = GLP_FEAS;
                    break;
                default:
                    xassert(csa != csa);
            }
            chuzc(csa, parm.tol_dj);
            d_stat = (csa.q == 0 ? GLP_FEAS : GLP_INFEAS);
            store_sol(csa, lp, p_stat, d_stat, 0);
            ret = GLP_ETMLIM;
            return ret;
        }
        /* display the search progress */
        display(csa, parm, 0);
        /* choose non-basic variable xN[q] */
        chuzc(csa, parm.tol_dj);
        if (csa.q == 0)
        {  if (bbar_st != 1 || cbar_st != 1)
        {  if (bbar_st != 1) bbar_st = 0;
            if (cbar_st != 1) cbar_st = 0;
            continue;
        }
            display(csa, parm, 1);
            switch (csa.phase)
            {  case 1:
                if (parm.msg_lev >= GLP_MSG_ALL)
                    xprintf("PROBLEM HAS NO FEASIBLE SOLUTION");
                p_stat = GLP_NOFEAS;
                set_orig_obj(csa);
                eval_cbar(csa);
                chuzc(csa, parm.tol_dj);
                d_stat = (csa.q == 0 ? GLP_FEAS : GLP_INFEAS);
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
        /* compute pivot column of the simplex table */
        eval_tcol(csa);
        if (rigorous) refine_tcol(csa);
        sort_tcol(csa, parm.tol_piv);
        /* check accuracy of the reduced cost of xN[q] */
        {  var d1 = csa.cbar[csa.q]; /* less accurate */
            var d2 = reeval_cost(csa);  /* more accurate */
            xassert(d1 != 0.0);
            if (Math.abs(d1 - d2) > 1e-5 * (1.0 + Math.abs(d2)) ||
                !(d1 < 0.0 && d2 < 0.0 || d1 > 0.0 && d2 > 0.0))
            {  if (parm.msg_lev >= GLP_MSG_DBG)
                xprintf("d1 = " + d1 + "; d2 = " + d2 + "");
                if (cbar_st != 1 || !rigorous)
                {  if (cbar_st != 1) cbar_st = 0;
                    rigorous = 5;
                    continue;
                }
            }
            /* replace cbar[q] by more accurate value keeping its sign */
            if (d1 > 0.0)
                csa.cbar[csa.q] = (d2 > 0.0 ? d2 : +DBL_EPSILON);
            else
                csa.cbar[csa.q] = (d2 < 0.0 ? d2 : -DBL_EPSILON);
        }
        /* choose basic variable xB[p] */
        switch (parm.r_test)
        {  case GLP_RT_STD:
            chuzr(csa, 0.0);
            break;
            case GLP_RT_HAR:
                chuzr(csa, 0.30 * parm.tol_bnd);
                break;
            default:
                xassert(parm != parm);
        }
        if (csa.p == 0)
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
                        xprintf("PROBLEM HAS UNBOUNDED SOLUTION");
                    store_sol(csa, lp, GLP_FEAS, GLP_NOFEAS,
                        csa.head[csa.m+csa.q]);
                    ret = 0;
                    break;
                default:
                    xassert(csa != csa);
            }
            return ret;
        }
        /* check if the pivot element is acceptable */
        if (csa.p > 0)
        {  var piv = csa.tcol_vec[csa.p];
            var eps = 1e-5 * (1.0 + 0.01 * csa.tcol_max);
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
        /* compute pivot row of the simplex table */
        if (csa.p > 0)
        {  var rho = csa.work4;
            eval_rho(csa, rho);
            if (rigorous) refine_rho(csa, rho);
            eval_trow(csa, rho);
        }
        /* accuracy check based on the pivot element */
        if (csa.p > 0)
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
                /* use more accurate version in the pivot row */
                if (csa.trow_vec[csa.q] == 0.0)
                {  csa.trow_nnz++;
                    xassert(csa.trow_nnz <= csa.n);
                    csa.trow_ind[csa.trow_nnz] = csa.q;
                }
                csa.trow_vec[csa.q] = piv1;
            }
        }
        /* update primal values of basic variables */
        update_bbar(csa);
        bbar_st = 2; /* updated */
        /* update reduced costs of non-basic variables */
        if (csa.p > 0)
        {  update_cbar(csa);
            cbar_st = 2; /* updated */
            /* on phase I objective coefficient of xB[p] in the adjacent
             basis becomes zero */
            if (csa.phase == 1)
            {  var k = csa.head[csa.p]; /* x[k] = xB[p] . xN[q] */
                csa.cbar[csa.q] -= csa.coef[k];
                csa.coef[k] = 0.0;
            }
        }
        /* update steepest edge coefficients */
        if (csa.p > 0)
        {  switch (parm.pricing)
        {  case GLP_PT_STD:
                break;
            case GLP_PT_PSE:
                if (csa.refct > 0) update_gamma(csa);
                break;
            default:
                xassert(parm != parm);
        }
        }
        /* update factorization of the basis matrix */
        if (csa.p > 0)
        {  ret = update_B(csa, csa.p, csa.head[csa.m+csa.q]);
            if (ret == 0)
                binv_st = 2; /* updated */
            else
            {  csa.valid = 0;
                binv_st = 0; /* invalid */
            }
        }
        /* update matrix N */
        if (csa.p > 0)
        {  del_N_col(csa, csa.q, csa.head[csa.m+csa.q]);
            if (csa.type[csa.head[csa.p]] != GLP_FX)
                add_N_col(csa, csa.q, csa.head[csa.p]);
        }
        /* change the basis header */
        change_basis(csa);
        /* iteration complete */
        csa.it_cnt++;
        if (rigorous > 0) rigorous--;
        continue;
    }

    /* return to the calling program */
    //return ret;
}
