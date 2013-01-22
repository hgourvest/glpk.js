function glp_adv_basis(lp, flags){
    function triang(m, n, info, mat, rn, cn){
        var ndx; /* int ndx[1+max(m,n)]; */
        /* this array is used for querying row and column patterns of the
         given matrix A (the third parameter to the routine mat) */
        var rs_len; /* int rs_len[1+m]; */
        /* rs_len[0] is not used;
         rs_len[i], 1 <= i <= m, is number of non-zeros in the i-th row
         of the matrix A, which (non-zeros) belong to the current active
         submatrix */
        var rs_head; /* int rs_head[1+n]; */
        /* rs_head[len], 0 <= len <= n, is the number i of the first row
         of the matrix A, for which rs_len[i] = len */
        var rs_prev; /* int rs_prev[1+m]; */
        /* rs_prev[0] is not used;
         rs_prev[i], 1 <= i <= m, is a number i' of the previous row of
         the matrix A, for which rs_len[i] = rs_len[i'] (zero marks the
         end of this linked list) */
        var rs_next; /* int rs_next[1+m]; */
        /* rs_next[0] is not used;
         rs_next[i], 1 <= i <= m, is a number i' of the next row of the
         matrix A, for which rs_len[i] = rs_len[i'] (zero marks the end
         this linked list) */
        var cs_head;
        /* is a number j of the first column of the matrix A, which has
         maximal number of non-zeros among other columns */
        var cs_prev; /* cs_prev[1+n]; */
        /* cs_prev[0] is not used;
         cs_prev[j], 1 <= j <= n, is a number of the previous column of
         the matrix A with the same or greater number of non-zeros than
         in the j-th column (zero marks the end of this linked list) */
        var cs_next; /* cs_next[1+n]; */
        /* cs_next[0] is not used;
         cs_next[j], 1 <= j <= n, is a number of the next column of
         the matrix A with the same or lesser number of non-zeros than
         in the j-th column (zero marks the end of this linked list) */
        var i, j, ii, jj, k1, k2, len, t, size = 0;
        var head, rn_inv, cn_inv;
        if (!(m > 0 && n > 0))
            xerror("triang: m = " + m + "; n = " + n + "; invalid dimension");
        /* allocate working arrays */
        ndx = new Int32Array(1+(m >= n ? m : n));
        rs_len = new Int32Array(1+m);
        rs_head = new Int32Array(1+n);
        rs_prev = new Int32Array(1+m);
        rs_next = new Int32Array(1+m);
        cs_prev = new Int32Array(1+n);
        cs_next = new Int32Array(1+n);
        /* build linked lists of columns of the matrix A with the same
         number of non-zeros */
        head = rs_len; /* currently rs_len is used as working array */
        for (len = 0; len <= m; len ++) head[len] = 0;
        for (j = 1; j <= n; j++)
        {  /* obtain length of the j-th column */
            len = mat(info, -j, ndx);
            xassert(0 <= len && len <= m);
            /* include the j-th column in the corresponding linked list */
            cs_prev[j] = head[len];
            head[len] = j;
        }
        /* merge all linked lists of columns in one linked list, where
         columns are ordered by descending of their lengths */
        cs_head = 0;
        for (len = 0; len <= m; len++)
        {  for (j = head[len]; j != 0; j = cs_prev[j])
        {  cs_next[j] = cs_head;
            cs_head = j;
        }
        }
        jj = 0;
        for (j = cs_head; j != 0; j = cs_next[j])
        {  cs_prev[j] = jj;
            jj = j;
        }
        /* build initial doubly linked lists of rows of the matrix A with
         the same number of non-zeros */
        for (len = 0; len <= n; len++) rs_head[len] = 0;
        for (i = 1; i <= m; i++)
        {  /* obtain length of the i-th row */
            rs_len[i] = len = mat(info, +i, ndx);
            xassert(0 <= len && len <= n);
            /* include the i-th row in the correspondng linked list */
            rs_prev[i] = 0;
            rs_next[i] = rs_head[len];
            if (rs_next[i] != 0) rs_prev[rs_next[i]] = i;
            rs_head[len] = i;
        }
        /* initially all rows and columns of the matrix A are active */
        for (i = 1; i <= m; i++) rn[i] = 0;
        for (j = 1; j <= n; j++) cn[j] = 0;
        /* set initial bounds of the active submatrix */
        k1 = 1; k2 = n;
        /* main loop starts here */
        while (k1 <= k2)
        {  i = rs_head[1];
            if (i != 0)
            {  /* the i-th row of the matrix A is a row singleton, since
             it has the only non-zero in the active submatrix */
                xassert(rs_len[i] == 1);
                /* determine the number j of an active column of the matrix
                 A, in which this non-zero is placed */
                j = 0;
                t = mat(info, +i, ndx);
                xassert(0 <= t && t <= n);
                for (; t >= 1; t--)
                {  jj = ndx[t];
                    xassert(1 <= jj && jj <= n);
                    if (cn[jj] == 0)
                    {  xassert(j == 0);
                        j = jj;
                    }
                }
                xassert(j != 0);
                /* the singleton is a[i,j]; move a[i,j] to the position
                 b[k1,k1] of the matrix B */
                rn[i] = cn[j] = k1;
                /* shift the left bound of the active submatrix */
                k1++;
                /* increase the size of the lower triangular part */
                size++;
            }
            else
            {  /* the current active submatrix has no row singletons */
                /* remove an active column with maximal number of non-zeros
                 from the active submatrix */
                j = cs_head;
                xassert(j != 0);
                cn[j] = k2;
                /* shift the right bound of the active submatrix */
                k2--;
            }
            /* the j-th column of the matrix A has been removed from the
             active submatrix */
            /* remove the j-th column from the linked list */
            if (cs_prev[j] == 0)
                cs_head = cs_next[j];
            else
                cs_next[cs_prev[j]] = cs_next[j];
            if (cs_next[j] != 0)
                cs_prev[cs_next[j]] = cs_prev[j];
            /* go through non-zeros of the j-th columns and update active
             lengths of the corresponding rows */
            t = mat(info, -j, ndx);
            xassert(0 <= t && t <= m);
            for (; t >= 1; t--)
            {  i = ndx[t];
                xassert(1 <= i && i <= m);
                /* the non-zero a[i,j] has left the active submatrix */
                len = rs_len[i];
                xassert(len >= 1);
                /* remove the i-th row from the linked list of rows with
                 active length len */
                if (rs_prev[i] == 0)
                    rs_head[len] = rs_next[i];
                else
                    rs_next[rs_prev[i]] = rs_next[i];
                if (rs_next[i] != 0)
                    rs_prev[rs_next[i]] = rs_prev[i];
                /* decrease the active length of the i-th row */
                rs_len[i] = --len;
                /* return the i-th row to the corresponding linked list */
                rs_prev[i] = 0;
                rs_next[i] = rs_head[len];
                if (rs_next[i] != 0) rs_prev[rs_next[i]] = i;
                rs_head[len] = i;
            }
        }
        /* other rows of the matrix A, which are still active, correspond
         to rows k1, ..., m of the matrix B (in arbitrary order) */
        for (i = 1; i <= m; i++) if (rn[i] == 0) rn[i] = k1++;
        /* but for columns this is not needed, because now the submatrix
         B2 has no columns */
        for (j = 1; j <= n; j++) xassert(cn[j] != 0);
        /* perform some optional checks */
        /* make sure that rn is a permutation of {1, ..., m} and cn is a
         permutation of {1, ..., n} */
        rn_inv = rs_len; /* used as working array */
        for (ii = 1; ii <= m; ii++) rn_inv[ii] = 0;
        for (i = 1; i <= m; i++)
        {  ii = rn[i];
            xassert(1 <= ii && ii <= m);
            xassert(rn_inv[ii] == 0);
            rn_inv[ii] = i;
        }
        cn_inv = rs_head; /* used as working array */
        for (jj = 1; jj <= n; jj++) cn_inv[jj] = 0;
        for (j = 1; j <= n; j++)
        {  jj = cn[j];
            xassert(1 <= jj && jj <= n);
            xassert(cn_inv[jj] == 0);
            cn_inv[jj] = j;
        }
        /* make sure that the matrix B = P*A*Q really has the form, which
         was declared */
        for (ii = 1; ii <= size; ii++)
        {  var diag = 0;
            i = rn_inv[ii];
            t = mat(info, +i, ndx);
            xassert(0 <= t && t <= n);
            for (; t >= 1; t--)
            {  j = ndx[t];
                xassert(1 <= j && j <= n);
                jj = cn[j];
                if (jj <= size) xassert(jj <= ii);
                if (jj == ii)
                {  xassert(!diag);
                    diag = 1;
                }
            }
            xassert(diag);
        }
        /* return to the calling program */
        return size;
    }

    function mat(lp, k, ndx){
        /* this auxiliary routine returns the pattern of a given row or
         a given column of the augmented constraint matrix A~ = (I|-A),
         in which columns of fixed variables are implicitly cleared */
        var m = lpx_get_num_rows(lp);
        var n = lpx_get_num_cols(lp);
        var i, j, lll, len = 0;

        if (k > 0)
        {  /* the pattern of the i-th row is required */
            i = +k;
            xassert(1 <= i && i <= m);
            lll = lpx_get_mat_row(lp, i, ndx, null);
            for (k = 1; k <= lll; k++)
            {
                lpx_get_col_bnds(lp, ndx[k], function(typx){
                        if (typx != LPX_FX) ndx[++len] = m + ndx[k];
                });

            }
            lpx_get_row_bnds(lp, i, function(typx){
                if (typx != LPX_FX) ndx[++len] = i;
            });
        }
        else
        {  /* the pattern of the j-th column is required */
            j = -k;
            xassert(1 <= j && j <= m+n);
            /* if the (auxiliary or structural) variable x[j] is fixed,
             the pattern of its column is empty */

            function doit(typx){
                if (typx != LPX_FX)
                {  if (j <= m)
                {  /* x[j] is non-fixed auxiliary variable */
                    ndx[++len] = j;
                }
                else
                {  /* x[j] is non-fixed structural variables */
                    len = lpx_get_mat_col(lp, j-m, ndx, null);
                }
                }
            }

            if (j <= m)
                lpx_get_row_bnds(lp, j, doit);
            else
                lpx_get_col_bnds(lp, j-m, doit);

        }
        /* return the length of the row/column pattern */
        return len;
    }

    function adv_basis(lp){
        var m = lpx_get_num_rows(lp);
        var n = lpx_get_num_cols(lp);
        var i, j, jj, k, size;
        var rn, cn, rn_inv, cn_inv;
        var tagx = new Int32Array(1+m+n);
        xprintf("Constructing initial basis...");
        if (m == 0 || n == 0)
        {  glp_std_basis(lp);
            return;
        }
        /* use the routine triang (see above) to find maximal triangular
         part of the augmented constraint matrix A~ = (I|-A); in order
         to prevent columns of fixed variables to be included in the
         triangular part, such columns are implictly removed from the
         matrix A~ by the routine adv_mat */
        rn = new Int32Array(1+m);
        cn = new Int32Array(1+m+n);
        size = triang(m, m+n, lp, mat, rn, cn);
        if (lpx_get_int_parm(lp, LPX_K_MSGLEV) >= 3)
            xprintf("Size of triangular part = " + size + "");
        /* the first size rows and columns of the matrix P*A~*Q (where
         P and Q are permutation matrices defined by the arrays rn and
         cn) form a lower triangular matrix; build the arrays (rn_inv
         and cn_inv), which define the matrices inv(P) and inv(Q) */
        rn_inv = new Int32Array(1+m);
        cn_inv = new Int32Array(1+m+n);
        for (i = 1; i <= m; i++) rn_inv[rn[i]] = i;
        for (j = 1; j <= m+n; j++) cn_inv[cn[j]] = j;
        /* include the columns of the matrix A~, which correspond to the
         first size columns of the matrix P*A~*Q, in the basis */
        for (k = 1; k <= m+n; k++) tagx[k] = -1;
        for (jj = 1; jj <= size; jj++)
        {  j = cn_inv[jj];
            /* the j-th column of A~ is the jj-th column of P*A~*Q */
            tagx[j] = LPX_BS;
        }
        /* if size < m, we need to add appropriate columns of auxiliary
         variables to the basis */
        for (jj = size + 1; jj <= m; jj++)
        {  /* the jj-th column of P*A~*Q should be replaced by the column
         of the auxiliary variable, for which the only unity element
         is placed in the position [jj,jj] */
            i = rn_inv[jj];
            /* the jj-th row of P*A~*Q is the i-th row of A~, but in the
             i-th row of A~ the unity element belongs to the i-th column
             of A~; therefore the disired column corresponds to the i-th
             auxiliary variable (note that this column doesn't belong to
             the triangular part found by the routine triang) */
            xassert(1 <= i && i <= m);
            xassert(cn[i] > size);
            tagx[i] = LPX_BS;
        }
        /* build tags of non-basic variables */
        for (k = 1; k <= m+n; k++){
            if (tagx[k] != LPX_BS){

                function doit(typx, lb, ub){
                    switch (typx){
                        case LPX_FR:
                            tagx[k] = LPX_NF; break;
                        case LPX_LO:
                            tagx[k] = LPX_NL; break;
                        case LPX_UP:
                            tagx[k] = LPX_NU; break;
                        case LPX_DB:
                            tagx[k] = (Math.abs(lb) <= Math.abs(ub) ? LPX_NL : LPX_NU); break;
                        case LPX_FX:
                            tagx[k] = LPX_NS; break;
                        default:
                            xassert(typx != typx);
                    }
                }

                if (k <= m)
                    lpx_get_row_bnds(lp, k, doit);
                else
                    lpx_get_col_bnds(lp, k-m, doit);
            }
        }
        for (k = 1; k <= m+n; k++){
            if (k <= m)
                lpx_set_row_stat(lp, k, tagx[k]);
            else
                lpx_set_col_stat(lp, k-m, tagx[k]);
        }
    }

    if (flags != 0)
        xerror("glp_adv_basis: flags = " + flags + "; invalid flags");
    if (lp.m == 0 || lp.n == 0)
        glp_std_basis(lp);
    else
        adv_basis(lp);
}

