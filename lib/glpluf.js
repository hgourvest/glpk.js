/* return codes: */
const
    LUF_ESING   = 1,  /* singular matrix */
    LUF_ECOND   = 2;  /* ill-conditioned matrix */

function luf_create_it(){
    var luf = {};
    luf.n_max = luf.n = 0;
    luf.valid = 0;
    luf.fr_ptr = luf.fr_len = null;
    luf.fc_ptr = luf.fc_len = null;
    luf.vr_ptr = luf.vr_len = luf.vr_cap = null;
    luf.vr_piv = null;
    luf.vc_ptr = luf.vc_len = luf.vc_cap = null;
    luf.pp_row = luf.pp_col = null;
    luf.qq_row = luf.qq_col = null;
    luf.sv_size = 0;
    luf.sv_beg = luf.sv_end = 0;
    luf.sv_ind = null;
    luf.sv_val = null;
    luf.sv_head = luf.sv_tail = 0;
    luf.sv_prev = luf.sv_next = null;
    luf.vr_max = null;
    luf.rs_head = luf.rs_prev = luf.rs_next = null;
    luf.cs_head = luf.cs_prev = luf.cs_next = null;
    luf.flag = null;
    luf.work = null;
    luf.new_sva = 0;
    luf.piv_tol = 0.10;
    luf.piv_lim = 4;
    luf.suhl = 1;
    luf.eps_tol = 1e-15;
    luf.max_gro = 1e+10;
    luf.nnz_a = luf.nnz_f = luf.nnz_v = 0;
    luf.max_a = luf.big_v = 0.0;
    luf.rank = 0;
    return luf;
}

function luf_defrag_sva(luf){
    var n = luf.n;
    var vr_ptr = luf.vr_ptr;
    var vr_len = luf.vr_len;
    var vr_cap = luf.vr_cap;
    var vc_ptr = luf.vc_ptr;
    var vc_len = luf.vc_len;
    var vc_cap = luf.vc_cap;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var sv_next = luf.sv_next;
    var sv_beg = 1;
    var i, j, k;
    /* skip rows and columns, which do not need to be relocated */
    for (k = luf.sv_head; k != 0; k = sv_next[k])
    {  if (k <= n)
    {  /* i-th row of the matrix V */
        i = k;
        if (vr_ptr[i] != sv_beg) break;
        vr_cap[i] = vr_len[i];
        sv_beg += vr_cap[i];
    }
    else
    {  /* j-th column of the matrix V */
        j = k - n;
        if (vc_ptr[j] != sv_beg) break;
        vc_cap[j] = vc_len[j];
        sv_beg += vc_cap[j];
    }
    }
    /* relocate other rows and columns in order to gather all unused
     locations in one continuous extent */
    for (; k != 0; k = sv_next[k])
    {  if (k <= n)
    {  /* i-th row of the matrix V */
        i = k;
        xcopyArr(sv_ind, sv_beg, sv_ind, vr_ptr[i], vr_len[i]);
        xcopyArr(sv_val, sv_beg, sv_val, vr_ptr[i], vr_len[i]);
        vr_ptr[i] = sv_beg;
        vr_cap[i] = vr_len[i];
        sv_beg += vr_cap[i];
    }
    else
    {  /* j-th column of the matrix V */
        j = k - n;
        xcopyArr(sv_ind, sv_beg, sv_ind, vc_ptr[j], vc_len[j]);
        xcopyArr(sv_val, sv_beg, sv_val ,vc_ptr[j], vc_len[j]);
        vc_ptr[j] = sv_beg;
        vc_cap[j] = vc_len[j];
        sv_beg += vc_cap[j];
    }
    }
    /* set new pointer to the beginning of the free part */
    luf.sv_beg = sv_beg;
}

function luf_enlarge_row(luf, i, cap){
    var n = luf.n;
    var vr_ptr = luf.vr_ptr;
    var vr_len = luf.vr_len;
    var vr_cap = luf.vr_cap;
    var vc_cap = luf.vc_cap;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var sv_prev = luf.sv_prev;
    var sv_next = luf.sv_next;
    var ret = 0;
    var cur, k, kk;
    xassert(1 <= i && i <= n);
    xassert(vr_cap[i] < cap);
    /* if there are less than cap free locations, defragment SVA */
    if (luf.sv_end - luf.sv_beg < cap)
    {  luf_defrag_sva(luf);
        if (luf.sv_end - luf.sv_beg < cap)
        {  ret = 1;
            return ret;
        }
    }
    /* save current capacity of the i-th row */
    cur = vr_cap[i];
    /* copy existing elements to the beginning of the free part */
    xcopyArr(sv_ind, luf.sv_beg, sv_ind, vr_ptr[i], vr_len[i]);
    xcopyArr(sv_val, luf.sv_beg, sv_val, vr_ptr[i], vr_len[i]);
    /* set new pointer and new capacity of the i-th row */
    vr_ptr[i] = luf.sv_beg;
    vr_cap[i] = cap;
    /* set new pointer to the beginning of the free part */
    luf.sv_beg += cap;
    /* now the i-th row starts in the rightmost location among other
     rows and columns of the matrix V, so its node should be moved
     to the end of the row/column linked list */
    k = i;
    /* remove the i-th row node from the linked list */
    if (sv_prev[k] == 0)
        luf.sv_head = sv_next[k];
    else
    {  /* capacity of the previous row/column can be increased at the
     expense of old locations of the i-th row */
        kk = sv_prev[k];
        if (kk <= n) vr_cap[kk] += cur; else vc_cap[kk-n] += cur;
        sv_next[sv_prev[k]] = sv_next[k];
    }
    if (sv_next[k] == 0)
        luf.sv_tail = sv_prev[k];
    else
        sv_prev[sv_next[k]] = sv_prev[k];
    /* insert the i-th row node to the end of the linked list */
    sv_prev[k] = luf.sv_tail;
    sv_next[k] = 0;
    if (sv_prev[k] == 0)
        luf.sv_head = k;
    else
        sv_next[sv_prev[k]] = k;
    luf.sv_tail = k;
    return ret;
}

function luf_enlarge_col(luf, j, cap){
    var n = luf.n;
    var vr_cap = luf.vr_cap;
    var vc_ptr = luf.vc_ptr;
    var vc_len = luf.vc_len;
    var vc_cap = luf.vc_cap;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var sv_prev = luf.sv_prev;
    var sv_next = luf.sv_next;
    var ret = 0;
    var cur, k, kk;
    xassert(1 <= j && j <= n);
    xassert(vc_cap[j] < cap);
    /* if there are less than cap free locations, defragment SVA */
    if (luf.sv_end - luf.sv_beg < cap)
    {  luf_defrag_sva(luf);
        if (luf.sv_end - luf.sv_beg < cap)
        {  ret = 1;
            return ret;
        }
    }
    /* save current capacity of the j-th column */
    cur = vc_cap[j];
    /* copy existing elements to the beginning of the free part */
    xcopyArr(sv_ind, luf.sv_beg, sv_ind, vc_ptr[j], vc_len[j]);
    xcopyArr(sv_val, luf.sv_beg, sv_val, vc_ptr[j], vc_len[j]);
    /* set new pointer and new capacity of the j-th column */
    vc_ptr[j] = luf.sv_beg;
    vc_cap[j] = cap;
    /* set new pointer to the beginning of the free part */
    luf.sv_beg += cap;
    /* now the j-th column starts in the rightmost location among
     other rows and columns of the matrix V, so its node should be
     moved to the end of the row/column linked list */
    k = n + j;
    /* remove the j-th column node from the linked list */
    if (sv_prev[k] == 0)
        luf.sv_head = sv_next[k];
    else
    {  /* capacity of the previous row/column can be increased at the
     expense of old locations of the j-th column */
        kk = sv_prev[k];
        if (kk <= n) vr_cap[kk] += cur; else vc_cap[kk-n] += cur;
        sv_next[sv_prev[k]] = sv_next[k];
    }
    if (sv_next[k] == 0)
        luf.sv_tail = sv_prev[k];
    else
        sv_prev[sv_next[k]] = sv_prev[k];
    /* insert the j-th column node to the end of the linked list */
    sv_prev[k] = luf.sv_tail;
    sv_next[k] = 0;
    if (sv_prev[k] == 0)
        luf.sv_head = k;
    else
        sv_next[sv_prev[k]] = k;
    luf.sv_tail = k;
    return ret;
}

function reallocate(luf, n){
    var n_max = luf.n_max;
    luf.n = n;
    if (n <= n_max) return;
    luf.n_max = n_max = n + 100;
    luf.fr_ptr = new Array(1+n_max);
    luf.fr_len = new Array(1+n_max);
    luf.fc_ptr = new Array(1+n_max);
    luf.fc_len = new Array(1+n_max);
    luf.vr_ptr = new Array(1+n_max);
    luf.vr_len = new Array(1+n_max);
    luf.vr_cap = new Array(1+n_max);
    luf.vr_piv = new Array(1+n_max);
    luf.vc_ptr = new Array(1+n_max);
    luf.vc_len = new Array(1+n_max);
    luf.vc_cap = new Array(1+n_max);
    luf.pp_row = new Array(1+n_max);
    luf.pp_col = new Array(1+n_max);
    luf.qq_row = new Array(1+n_max);
    luf.qq_col = new Array(1+n_max);
    luf.sv_prev = new Array(1+n_max+n_max);
    luf.sv_next = new Array(1+n_max+n_max);
    luf.vr_max = new Array(1+n_max);
    luf.rs_head = new Array(1+n_max);
    luf.rs_prev = new Array(1+n_max);
    luf.rs_next = new Array(1+n_max);
    luf.cs_head = new Array(1+n_max);
    luf.cs_prev = new Array(1+n_max);
    luf.cs_next = new Array(1+n_max);
    luf.flag = new Array(1+n_max);
    luf.work = new Array(1+n_max);
}

function initialize(luf, col, info){
    var n = luf.n;
    var fc_ptr = luf.fc_ptr;
    var fc_len = luf.fc_len;
    var vr_ptr = luf.vr_ptr;
    var vr_len = luf.vr_len;
    var vr_cap = luf.vr_cap;
    var vc_ptr = luf.vc_ptr;
    var vc_len = luf.vc_len;
    var vc_cap = luf.vc_cap;
    var pp_row = luf.pp_row;
    var pp_col = luf.pp_col;
    var qq_row = luf.qq_row;
    var qq_col = luf.qq_col;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var sv_prev = luf.sv_prev;
    var sv_next = luf.sv_next;
    var vr_max = luf.vr_max;
    var rs_head = luf.rs_head;
    var rs_prev = luf.rs_prev;
    var rs_next = luf.rs_next;
    var cs_head = luf.cs_head;
    var cs_prev = luf.cs_prev;
    var cs_next = luf.cs_next;
    var flag = luf.flag;
    var work = luf.work;
    var ret = 0;
    var i, i_ptr, j, j_beg, j_end, k, len, nnz, sv_beg, sv_end, ptr;
    var big, val;
    /* free all locations of the sparse vector area */
    sv_beg = 1;
    sv_end = luf.sv_size + 1;
    /* (row-wise representation of the matrix F is not initialized,
     because it is not used at the factorization stage) */
    /* build the matrix F in column-wise format (initially F = I) */
    for (j = 1; j <= n; j++)
    {  fc_ptr[j] = sv_end;
        fc_len[j] = 0;
    }
    /* clear rows of the matrix V; clear the flag array */
    for (i = 1; i <= n; i++)
        vr_len[i] = vr_cap[i] = 0, flag[i] = 0;
    /* build the matrix V in column-wise format (initially V = A);
     count non-zeros in rows of this matrix; count total number of
     non-zeros; compute largest of absolute values of elements */
    nnz = 0;
    big = 0.0;
    for (j = 1; j <= n; j++)
    {  var rn = pp_row;
        var aj = work;
        /* obtain j-th column of the matrix A */
        len = col(info, j, rn, aj);
        if (!(0 <= len && len <= n))
            xerror("luf_factorize: j = " + j + "; len = " + len + "; invalid column length");
        /* check for free locations */
        if (sv_end - sv_beg < len)
        {  /* overflow of the sparse vector area */
            ret = 1;
            return ret;
        }
        /* set pointer to the j-th column */
        vc_ptr[j] = sv_beg;
        /* set length of the j-th column */
        vc_len[j] = vc_cap[j] = len;
        /* count total number of non-zeros */
        nnz += len;
        /* walk through elements of the j-th column */
        for (ptr = 1; ptr <= len; ptr++)
        {  /* get row index and numerical value of a[i,j] */
            i = rn[ptr];
            val = aj[ptr];
            if (!(1 <= i && i <= n))
                xerror("luf_factorize: i = " + i + "; j = " + j + "; invalid row index");
            if (flag[i])
                xerror("luf_factorize: i = " + i + "; j = " + j + "; duplicate element not allowed");
            if (val == 0.0)
                xerror("luf_factorize: i = " + i + "; j = " + j + "; zero element not allowed");
            /* add new element v[i,j] = a[i,j] to j-th column */
            sv_ind[sv_beg] = i;
            sv_val[sv_beg] = val;
            sv_beg++;
            /* big := max(big, |a[i,j]|) */
            if (val < 0.0) val = - val;
            if (big < val) big = val;
            /* mark non-zero in the i-th position of the j-th column */
            flag[i] = 1;
            /* increase length of the i-th row */
            vr_cap[i]++;
        }
        /* reset all non-zero marks */
        for (ptr = 1; ptr <= len; ptr++) flag[rn[ptr]] = 0;
    }
    /* allocate rows of the matrix V */
    for (i = 1; i <= n; i++)
    {  /* get length of the i-th row */
        len = vr_cap[i];
        /* check for free locations */
        if (sv_end - sv_beg < len)
        {  /* overflow of the sparse vector area */
            ret = 1;
            return ret;
        }
        /* set pointer to the i-th row */
        vr_ptr[i] = sv_beg;
        /* reserve locations for the i-th row */
        sv_beg += len;
    }
    /* build the matrix V in row-wise format using representation of
     this matrix in column-wise format */
    for (j = 1; j <= n; j++)
    {  /* walk through elements of the j-th column */
        j_beg = vc_ptr[j];
        j_end = j_beg + vc_len[j] - 1;
        for (k = j_beg; k <= j_end; k++)
        {  /* get row index and numerical value of v[i,j] */
            i = sv_ind[k];
            val = sv_val[k];
            /* store element in the i-th row */
            i_ptr = vr_ptr[i] + vr_len[i];
            sv_ind[i_ptr] = j;
            sv_val[i_ptr] = val;
            /* increase count of the i-th row */
            vr_len[i]++;
        }
    }
    /* initialize the matrices P and Q (initially P = Q = I) */
    for (k = 1; k <= n; k++)
        pp_row[k] = pp_col[k] = qq_row[k] = qq_col[k] = k;
    /* set sva partitioning pointers */
    luf.sv_beg = sv_beg;
    luf.sv_end = sv_end;
    /* the initial physical order of rows and columns of the matrix V
     is n+1, ..., n+n, 1, ..., n (firstly columns, then rows) */
    luf.sv_head = n+1;
    luf.sv_tail = n;
    for (i = 1; i <= n; i++)
    {  sv_prev[i] = i-1;
        sv_next[i] = i+1;
    }
    sv_prev[1] = n+n;
    sv_next[n] = 0;
    for (j = 1; j <= n; j++)
    {  sv_prev[n+j] = n+j-1;
        sv_next[n+j] = n+j+1;
    }
    sv_prev[n+1] = 0;
    sv_next[n+n] = 1;
    /* clear working arrays */
    for (k = 1; k <= n; k++)
    {  flag[k] = 0;
        work[k] = 0.0;
    }
    /* initialize some statistics */
    luf.nnz_a = nnz;
    luf.nnz_f = 0;
    luf.nnz_v = nnz;
    luf.max_a = big;
    luf.big_v = big;
    luf.rank = -1;
    /* initially the active submatrix is the entire matrix V */
    /* largest of absolute values of elements in each active row is
     unknown yet */
    for (i = 1; i <= n; i++) vr_max[i] = -1.0;
    /* build linked lists of active rows */
    for (len = 0; len <= n; len++) rs_head[len] = 0;
    for (i = 1; i <= n; i++)
    {  len = vr_len[i];
        rs_prev[i] = 0;
        rs_next[i] = rs_head[len];
        if (rs_next[i] != 0) rs_prev[rs_next[i]] = i;
        rs_head[len] = i;
    }
    /* build linked lists of active columns */
    for (len = 0; len <= n; len++) cs_head[len] = 0;
    for (j = 1; j <= n; j++)
    {  len = vc_len[j];
        cs_prev[j] = 0;
        cs_next[j] = cs_head[len];
        if (cs_next[j] != 0) cs_prev[cs_next[j]] = j;
        cs_head[len] = j;
    }
    /* return to the factorizing routine */
    return ret;
}

function find_pivot(luf, callback){
    var n = luf.n;
    var vr_ptr = luf.vr_ptr;
    var vr_len = luf.vr_len;
    var vc_ptr = luf.vc_ptr;
    var vc_len = luf.vc_len;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var vr_max = luf.vr_max;
    var rs_head = luf.rs_head;
    var rs_next = luf.rs_next;
    var cs_head = luf.cs_head;
    var cs_prev = luf.cs_prev;
    var cs_next = luf.cs_next;
    var piv_tol = luf.piv_tol;
    var piv_lim = luf.piv_lim;
    var suhl = luf.suhl;
    var p, q, len, i, i_beg, i_end, i_ptr, j, j_beg, j_end, j_ptr,
        ncand, next_j, min_p, min_q, min_len;
    var best, cost, big, temp;
    /* initially no pivot candidates have been found so far */
    p = q = 0; best = DBL_MAX; ncand = 0;
    /* if in the active submatrix there is a column that has the only
     non-zero (column singleton), choose it as pivot */
    j = cs_head[1];
    if (j != 0)
    {  xassert(vc_len[j] == 1);
        p = sv_ind[vc_ptr[j]]; q = j;
        return done();
    }
    /* if in the active submatrix there is a row that has the only
     non-zero (row singleton), choose it as pivot */
    i = rs_head[1];
    if (i != 0)
    {  xassert(vr_len[i] == 1);
        p = i; q = sv_ind[vr_ptr[i]];
        return done();
    }
    /* there are no singletons in the active submatrix; walk through
     other non-empty rows and columns */
    for (len = 2; len <= n; len++)
    {  /* consider active columns that have len non-zeros */
        for (j = cs_head[len]; j != 0; j = next_j)
        {  /* the j-th column has len non-zeros */
            j_beg = vc_ptr[j];
            j_end = j_beg + vc_len[j] - 1;
            /* save pointer to the next column with the same length */
            next_j = cs_next[j];
            /* find an element in the j-th column, which is placed in a
             row with minimal number of non-zeros and satisfies to the
             stability condition (such element may not exist) */
            min_p = min_q = 0; min_len = INT_MAX;
            for (j_ptr = j_beg; j_ptr <= j_end; j_ptr++)
            {  /* get row index of v[i,j] */
                i = sv_ind[j_ptr];
                i_beg = vr_ptr[i];
                i_end = i_beg + vr_len[i] - 1;
                /* if the i-th row is not shorter than that one, where
                 minimal element is currently placed, skip v[i,j] */
                if (vr_len[i] >= min_len) continue;
                /* determine the largest of absolute values of elements
                 in the i-th row */
                big = vr_max[i];
                if (big < 0.0)
                {  /* the largest value is unknown yet; compute it */
                    for (i_ptr = i_beg; i_ptr <= i_end; i_ptr++)
                    {  temp = sv_val[i_ptr];
                        if (temp < 0.0) temp = - temp;
                        if (big < temp) big = temp;
                    }
                    vr_max[i] = big;
                }
                /* find v[i,j] in the i-th row */
                for (i_ptr = vr_ptr[i]; sv_ind[i_ptr] != j; i_ptr++){}
                xassert(i_ptr <= i_end);
                /* if v[i,j] doesn't satisfy to the stability condition,
                 skip it */
                temp = sv_val[i_ptr];
                if (temp < 0.0) temp = - temp;
                if (temp < piv_tol * big) continue;
                /* v[i,j] is better than the current minimal element */
                min_p = i; min_q = j; min_len = vr_len[i];
                /* if Markowitz cost of the current minimal element is
                 not greater than (len-1)**2, it can be chosen right
                 now; this heuristic reduces the search and works well
                 in many cases */
                if (min_len <= len)
                {  p = min_p; q = min_q;
                    return done();
                }
            }
            /* the j-th column has been scanned */
            if (min_p != 0)
            {  /* the minimal element is a next pivot candidate */
                ncand++;
                /* compute its Markowitz cost */
                cost = (min_len - 1) * (len - 1);
                /* choose between the minimal element and the current
                 candidate */
                if (cost < best) {p = min_p; q = min_q; best = cost}
                /* if piv_lim candidates have been considered, there are
                 doubts that a much better candidate exists; therefore
                 it's time to terminate the search */
                if (ncand == piv_lim) return done();
            }
            else
            {  /* the j-th column has no elements, which satisfy to the
             stability condition; Uwe Suhl suggests to exclude such
             column from the further consideration until it becomes
             a column singleton; in hard cases this significantly
             reduces a time needed for pivot searching */
                if (suhl)
                {  /* remove the j-th column from the active set */
                    if (cs_prev[j] == 0)
                        cs_head[len] = cs_next[j];
                    else
                        cs_next[cs_prev[j]] = cs_next[j];
                    if (cs_next[j] == 0){
                        /* nop */
                    }
                    else
                        cs_prev[cs_next[j]] = cs_prev[j];
                    /* the following assignment is used to avoid an error
                     when the routine eliminate (see below) will try to
                     remove the j-th column from the active set */
                    cs_prev[j] = cs_next[j] = j;
                }
            }
        }
        /* consider active rows that have len non-zeros */
        for (i = rs_head[len]; i != 0; i = rs_next[i])
        {  /* the i-th row has len non-zeros */
            i_beg = vr_ptr[i];
            i_end = i_beg + vr_len[i] - 1;
            /* determine the largest of absolute values of elements in
             the i-th row */
            big = vr_max[i];
            if (big < 0.0)
            {  /* the largest value is unknown yet; compute it */
                for (i_ptr = i_beg; i_ptr <= i_end; i_ptr++)
                {  temp = sv_val[i_ptr];
                    if (temp < 0.0) temp = - temp;
                    if (big < temp) big = temp;
                }
                vr_max[i] = big;
            }
            /* find an element in the i-th row, which is placed in a
             column with minimal number of non-zeros and satisfies to
             the stability condition (such element always exists) */
            min_p = min_q = 0; min_len = INT_MAX;
            for (i_ptr = i_beg; i_ptr <= i_end; i_ptr++)
            {  /* get column index of v[i,j] */
                j = sv_ind[i_ptr];
                /* if the j-th column is not shorter than that one, where
                 minimal element is currently placed, skip v[i,j] */
                if (vc_len[j] >= min_len) continue;
                /* if v[i,j] doesn't satisfy to the stability condition,
                 skip it */
                temp = sv_val[i_ptr];
                if (temp < 0.0) temp = - temp;
                if (temp < piv_tol * big) continue;
                /* v[i,j] is better than the current minimal element */
                min_p = i; min_q = j; min_len = vc_len[j];
                /* if Markowitz cost of the current minimal element is
                 not greater than (len-1)**2, it can be chosen right
                 now; this heuristic reduces the search and works well
                 in many cases */
                if (min_len <= len)
                {  p = min_p; q = min_q;
                    return done();
                }
            }
            /* the i-th row has been scanned */
            if (min_p != 0)
            {  /* the minimal element is a next pivot candidate */
                ncand++;
                /* compute its Markowitz cost */
                cost = (len - 1) * (min_len - 1);
                /* choose between the minimal element and the current
                 candidate */
                if (cost < best) {p = min_p; q = min_q; best = cost}
                /* if piv_lim candidates have been considered, there are
                 doubts that a much better candidate exists; therefore
                 it's time to terminate the search */
                if (ncand == piv_lim) return done();
            }
            else
            {  /* this can't be because this can never be */
                xassert(min_p != min_p);
            }
        }
    }
    function done(){
        /* bring the pivot to the factorizing routine */
        callback(p, q);
        return (p == 0);
    }
    return done();
}

function eliminate(luf, p, q){
    var n = luf.n;
    var fc_ptr = luf.fc_ptr;
    var fc_len = luf.fc_len;
    var vr_ptr = luf.vr_ptr;
    var vr_len = luf.vr_len;
    var vr_cap = luf.vr_cap;
    var vr_piv = luf.vr_piv;
    var vc_ptr = luf.vc_ptr;
    var vc_len = luf.vc_len;
    var vc_cap = luf.vc_cap;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var sv_prev = luf.sv_prev;
    var sv_next = luf.sv_next;
    var vr_max = luf.vr_max;
    var rs_head = luf.rs_head;
    var rs_prev = luf.rs_prev;
    var rs_next = luf.rs_next;
    var cs_head = luf.cs_head;
    var cs_prev = luf.cs_prev;
    var cs_next = luf.cs_next;
    var flag = luf.flag;
    var work = luf.work;
    var eps_tol = luf.eps_tol;
    /* at this stage the row-wise representation of the matrix F is
     not used, so fr_len can be used as a working array */
    var ndx = luf.fr_len;
    var ret = 0;
    var len, fill, i, i_beg, i_end, i_ptr, j, j_beg, j_end, j_ptr, k,
        p_beg, p_end, p_ptr, q_beg, q_end, q_ptr;
    var fip, val, vpq, temp;
    xassert(1 <= p && p <= n);
    xassert(1 <= q && q <= n);
    /* remove the p-th (pivot) row from the active set; this row will
     never return there */
    if (rs_prev[p] == 0)
        rs_head[vr_len[p]] = rs_next[p];
    else
        rs_next[rs_prev[p]] = rs_next[p];
    if (rs_next[p] == 0){

    }
    else
        rs_prev[rs_next[p]] = rs_prev[p];
    /* remove the q-th (pivot) column from the active set; this column
     will never return there */
    if (cs_prev[q] == 0)
        cs_head[vc_len[q]] = cs_next[q];
    else
        cs_next[cs_prev[q]] = cs_next[q];
    if (cs_next[q] == 0){

    }
    else
        cs_prev[cs_next[q]] = cs_prev[q];
    /* find the pivot v[p,q] = u[k,k] in the p-th row */
    p_beg = vr_ptr[p];
    p_end = p_beg + vr_len[p] - 1;
    for (p_ptr = p_beg; sv_ind[p_ptr] != q; p_ptr++){/* nop */}
    xassert(p_ptr <= p_end);
    /* store value of the pivot */
    vpq = (vr_piv[p] = sv_val[p_ptr]);
    /* remove the pivot from the p-th row */
    sv_ind[p_ptr] = sv_ind[p_end];
    sv_val[p_ptr] = sv_val[p_end];
    vr_len[p]--;
    p_end--;
    /* find the pivot v[p,q] = u[k,k] in the q-th column */
    q_beg = vc_ptr[q];
    q_end = q_beg + vc_len[q] - 1;
    for (q_ptr = q_beg; sv_ind[q_ptr] != p; q_ptr++){/* nop */}
    xassert(q_ptr <= q_end);
    /* remove the pivot from the q-th column */
    sv_ind[q_ptr] = sv_ind[q_end];
    vc_len[q]--;
    q_end--;
    /* walk through the p-th (pivot) row, which doesn't contain the
     pivot v[p,q] already, and do the following... */
    for (p_ptr = p_beg; p_ptr <= p_end; p_ptr++)
    {  /* get column index of v[p,j] */
        j = sv_ind[p_ptr];
        /* store v[p,j] to the working array */
        flag[j] = 1;
        work[j] = sv_val[p_ptr];
        /* remove the j-th column from the active set; this column will
         return there later with new length */
        if (cs_prev[j] == 0)
            cs_head[vc_len[j]] = cs_next[j];
        else
            cs_next[cs_prev[j]] = cs_next[j];
        if (cs_next[j] == 0){

        }
        else
            cs_prev[cs_next[j]] = cs_prev[j];
        /* find v[p,j] in the j-th column */
        j_beg = vc_ptr[j];
        j_end = j_beg + vc_len[j] - 1;
        for (j_ptr = j_beg; sv_ind[j_ptr] != p; j_ptr++){/* nop */}
        xassert(j_ptr <= j_end);
        /* since v[p,j] leaves the active submatrix, remove it from the
         j-th column; however, v[p,j] is kept in the p-th row */
        sv_ind[j_ptr] = sv_ind[j_end];
        vc_len[j]--;
    }
    /* walk through the q-th (pivot) column, which doesn't contain the
     pivot v[p,q] already, and perform gaussian elimination */
    while (q_beg <= q_end)
    {  /* element v[i,q] should be eliminated */
        /* get row index of v[i,q] */
        i = sv_ind[q_beg];
        /* remove the i-th row from the active set; later this row will
         return there with new length */
        if (rs_prev[i] == 0)
            rs_head[vr_len[i]] = rs_next[i];
        else
            rs_next[rs_prev[i]] = rs_next[i];
        if (rs_next[i] == 0){

        }
        else
            rs_prev[rs_next[i]] = rs_prev[i];
        /* find v[i,q] in the i-th row */
        i_beg = vr_ptr[i];
        i_end = i_beg + vr_len[i] - 1;
        for (i_ptr = i_beg; sv_ind[i_ptr] != q; i_ptr++){/* nop */}
        xassert(i_ptr <= i_end);
        /* compute gaussian multiplier f[i,p] = v[i,q] / v[p,q] */
        fip = sv_val[i_ptr] / vpq;
        /* since v[i,q] should be eliminated, remove it from the i-th
         row */
        sv_ind[i_ptr] = sv_ind[i_end];
        sv_val[i_ptr] = sv_val[i_end];
        vr_len[i]--;
        i_end--;
        /* and from the q-th column */
        sv_ind[q_beg] = sv_ind[q_end];
        vc_len[q]--;
        q_end--;
        /* perform gaussian transformation:
         (i-th row) := (i-th row) - f[i,p] * (p-th row)
         note that now the p-th row, which is in the working array,
         doesn't contain the pivot v[p,q], and the i-th row doesn't
         contain the eliminated element v[i,q] */
        /* walk through the i-th row and transform existing non-zero
         elements */
        fill = vr_len[p];
        for (i_ptr = i_beg; i_ptr <= i_end; i_ptr++)
        {  /* get column index of v[i,j] */
            j = sv_ind[i_ptr];
            /* v[i,j] := v[i,j] - f[i,p] * v[p,j] */
            if (flag[j])
            {  /* v[p,j] != 0 */
                temp = (sv_val[i_ptr] -= fip * work[j]);
                if (temp < 0.0) temp = - temp;
                flag[j] = 0;
                fill--; /* since both v[i,j] and v[p,j] exist */
                if (temp == 0.0 || temp < eps_tol)
                {  /* new v[i,j] is closer to zero; replace it by exact
                 zero, i.e. remove it from the active submatrix */
                    /* remove v[i,j] from the i-th row */
                    sv_ind[i_ptr] = sv_ind[i_end];
                    sv_val[i_ptr] = sv_val[i_end];
                    vr_len[i]--;
                    i_ptr--;
                    i_end--;
                    /* find v[i,j] in the j-th column */
                    j_beg = vc_ptr[j];
                    j_end = j_beg + vc_len[j] - 1;
                    for (j_ptr = j_beg; sv_ind[j_ptr] != i; j_ptr++){}
                    xassert(j_ptr <= j_end);
                    /* remove v[i,j] from the j-th column */
                    sv_ind[j_ptr] = sv_ind[j_end];
                    vc_len[j]--;
                }
                else
                {  /* v_big := max(v_big, |v[i,j]|) */
                    if (luf.big_v < temp) luf.big_v = temp;
                }
            }
        }
        /* now flag is the pattern of the set v[p,*] \ v[i,*], and fill
         is number of non-zeros in this set; therefore up to fill new
         non-zeros may appear in the i-th row */
        if (vr_len[i] + fill > vr_cap[i])
        {  /* enlarge the i-th row */
            if (luf_enlarge_row(luf, i, vr_len[i] + fill))
            {  /* overflow of the sparse vector area */
                ret = 1;
                return ret;
            }
            /* defragmentation may change row and column pointers of the
             matrix V */
            p_beg = vr_ptr[p];
            p_end = p_beg + vr_len[p] - 1;
            q_beg = vc_ptr[q];
            q_end = q_beg + vc_len[q] - 1;
        }
        /* walk through the p-th (pivot) row and create new elements
         of the i-th row that appear due to fill-in; column indices
         of these new elements are accumulated in the array ndx */
        len = 0;
        for (p_ptr = p_beg; p_ptr <= p_end; p_ptr++)
        {  /* get column index of v[p,j], which may cause fill-in */
            j = sv_ind[p_ptr];
            if (flag[j])
            {  /* compute new non-zero v[i,j] = 0 - f[i,p] * v[p,j] */
                temp = (val = - fip * work[j]);
                if (temp < 0.0) temp = - temp;
                if (temp == 0.0 || temp < eps_tol){
                    /* if v[i,j] is closer to zero; just ignore it */
                }
                else
                {  /* add v[i,j] to the i-th row */
                    i_ptr = vr_ptr[i] + vr_len[i];
                    sv_ind[i_ptr] = j;
                    sv_val[i_ptr] = val;
                    vr_len[i]++;
                    /* remember column index of v[i,j] */
                    ndx[++len] = j;
                    /* big_v := max(big_v, |v[i,j]|) */
                    if (luf.big_v < temp) luf.big_v = temp;
                }
            }
            else
            {  /* there is no fill-in, because v[i,j] already exists in
             the i-th row; restore the flag of the element v[p,j],
             which was reset before */
                flag[j] = 1;
            }
        }
        /* add new non-zeros v[i,j] to the corresponding columns */
        for (k = 1; k <= len; k++)
        {  /* get column index of new non-zero v[i,j] */
            j = ndx[k];
            /* one free location is needed in the j-th column */
            if (vc_len[j] + 1 > vc_cap[j])
            {  /* enlarge the j-th column */
                if (luf_enlarge_col(luf, j, vc_len[j] + 10))
                {  /* overflow of the sparse vector area */
                    ret = 1;
                    return ret;
                }
                /* defragmentation may change row and column pointers of
                 the matrix V */
                p_beg = vr_ptr[p];
                p_end = p_beg + vr_len[p] - 1;
                q_beg = vc_ptr[q];
                q_end = q_beg + vc_len[q] - 1;
            }
            /* add new non-zero v[i,j] to the j-th column */
            j_ptr = vc_ptr[j] + vc_len[j];
            sv_ind[j_ptr] = i;
            vc_len[j]++;
        }
        /* now the i-th row has been completely transformed, therefore
         it can return to the active set with new length */
        rs_prev[i] = 0;
        rs_next[i] = rs_head[vr_len[i]];
        if (rs_next[i] != 0) rs_prev[rs_next[i]] = i;
        rs_head[vr_len[i]] = i;
        /* the largest of absolute values of elements in the i-th row
         is currently unknown */
        vr_max[i] = -1.0;
        /* at least one free location is needed to store the gaussian
         multiplier */
        if (luf.sv_end - luf.sv_beg < 1)
        {  /* there are no free locations at all; defragment SVA */
            luf_defrag_sva(luf);
            if (luf.sv_end - luf.sv_beg < 1)
            {  /* overflow of the sparse vector area */
                ret = 1;
                return ret;
            }
            /* defragmentation may change row and column pointers of the
             matrix V */
            p_beg = vr_ptr[p];
            p_end = p_beg + vr_len[p] - 1;
            q_beg = vc_ptr[q];
            q_end = q_beg + vc_len[q] - 1;
        }
        /* add the element f[i,p], which is the gaussian multiplier,
         to the matrix F */
        luf.sv_end--;
        sv_ind[luf.sv_end] = i;
        sv_val[luf.sv_end] = fip;
        fc_len[p]++;
        /* end of elimination loop */
    }
    /* at this point the q-th (pivot) column should be empty */
    xassert(vc_len[q] == 0);
    /* reset capacity of the q-th column */
    vc_cap[q] = 0;
    /* remove node of the q-th column from the addressing list */
    k = n + q;
    if (sv_prev[k] == 0)
        luf.sv_head = sv_next[k];
    else
        sv_next[sv_prev[k]] = sv_next[k];
    if (sv_next[k] == 0)
        luf.sv_tail = sv_prev[k];
    else
        sv_prev[sv_next[k]] = sv_prev[k];
    /* the p-th column of the matrix F has been completely built; set
     its pointer */
    fc_ptr[p] = luf.sv_end;
    /* walk through the p-th (pivot) row and do the following... */
    for (p_ptr = p_beg; p_ptr <= p_end; p_ptr++)
    {  /* get column index of v[p,j] */
        j = sv_ind[p_ptr];
        /* erase v[p,j] from the working array */
        flag[j] = 0;
        work[j] = 0.0;
        /* the j-th column has been completely transformed, therefore
         it can return to the active set with new length; however
         the special case c_prev[j] = c_next[j] = j means that the
         routine find_pivot excluded the j-th column from the active
         set due to Uwe Suhl's rule, and therefore in this case the
         column can return to the active set only if it is a column
         singleton */
        if (!(vc_len[j] != 1 && cs_prev[j] == j && cs_next[j] == j))
        {  cs_prev[j] = 0;
            cs_next[j] = cs_head[vc_len[j]];
            if (cs_next[j] != 0) cs_prev[cs_next[j]] = j;
            cs_head[vc_len[j]] = j;
        }
    }
    /* return to the factorizing routine */
    return ret;
}

function build_v_cols(luf){
    var n = luf.n;
    var vr_ptr = luf.vr_ptr;
    var vr_len = luf.vr_len;
    var vc_ptr = luf.vc_ptr;
    var vc_len = luf.vc_len;
    var vc_cap = luf.vc_cap;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var sv_prev = luf.sv_prev;
    var sv_next = luf.sv_next;
    var ret = 0;
    var i, i_beg, i_end, i_ptr, j, j_ptr, k, nnz;
    /* it is assumed that on entry all columns of the matrix V are
     empty, i.e. vc_len[j] = vc_cap[j] = 0 for all j = 1, ..., n,
     and have been removed from the addressing list */
    /* count non-zeros in columns of the matrix V; count total number
     of non-zeros in this matrix */
    nnz = 0;
    for (i = 1; i <= n; i++)
    {  /* walk through elements of the i-th row and count non-zeros
     in the corresponding columns */
        i_beg = vr_ptr[i];
        i_end = i_beg + vr_len[i] - 1;
        for (i_ptr = i_beg; i_ptr <= i_end; i_ptr++)
            vc_cap[sv_ind[i_ptr]]++;
        /* count total number of non-zeros */
        nnz += vr_len[i];
    }
    /* store total number of non-zeros */
    luf.nnz_v = nnz;
    /* check for free locations */
    if (luf.sv_end - luf.sv_beg < nnz)
    {  /* overflow of the sparse vector area */
        ret = 1;
        return ret;
    }
    /* allocate columns of the matrix V */
    for (j = 1; j <= n; j++)
    {  /* set pointer to the j-th column */
        vc_ptr[j] = luf.sv_beg;
        /* reserve locations for the j-th column */
        luf.sv_beg += vc_cap[j];
    }
    /* build the matrix V in column-wise format using this matrix in
     row-wise format */
    for (i = 1; i <= n; i++)
    {  /* walk through elements of the i-th row */
        i_beg = vr_ptr[i];
        i_end = i_beg + vr_len[i] - 1;
        for (i_ptr = i_beg; i_ptr <= i_end; i_ptr++)
        {  /* get column index */
            j = sv_ind[i_ptr];
            /* store element in the j-th column */
            j_ptr = vc_ptr[j] + vc_len[j];
            sv_ind[j_ptr] = i;
            sv_val[j_ptr] = sv_val[i_ptr];
            /* increase length of the j-th column */
            vc_len[j]++;
        }
    }
    /* now columns are placed in the sparse vector area behind rows
     in the order n+1, n+2, ..., n+n; so insert column nodes in the
     addressing list using this order */
    for (k = n+1; k <= n+n; k++)
    {  sv_prev[k] = k-1;
        sv_next[k] = k+1;
    }
    sv_prev[n+1] = luf.sv_tail;
    sv_next[luf.sv_tail] = n+1;
    sv_next[n+n] = 0;
    luf.sv_tail = n+n;
    /* return to the factorizing routine */
    return ret;
}

function build_f_rows(luf){
    var n = luf.n;
    var fr_ptr = luf.fr_ptr;
    var fr_len = luf.fr_len;
    var fc_ptr = luf.fc_ptr;
    var fc_len = luf.fc_len;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var ret = 0;
    var i, j, j_beg, j_end, j_ptr, ptr, nnz;
    /* clear rows of the matrix F */
    for (i = 1; i <= n; i++) fr_len[i] = 0;
    /* count non-zeros in rows of the matrix F; count total number of
     non-zeros in this matrix */
    nnz = 0;
    for (j = 1; j <= n; j++)
    {  /* walk through elements of the j-th column and count non-zeros
     in the corresponding rows */
        j_beg = fc_ptr[j];
        j_end = j_beg + fc_len[j] - 1;
        for (j_ptr = j_beg; j_ptr <= j_end; j_ptr++)
            fr_len[sv_ind[j_ptr]]++;
        /* increase total number of non-zeros */
        nnz += fc_len[j];
    }
    /* store total number of non-zeros */
    luf.nnz_f = nnz;
    /* check for free locations */
    if (luf.sv_end - luf.sv_beg < nnz)
    {  /* overflow of the sparse vector area */
        ret = 1;
        return ret;
    }
    /* allocate rows of the matrix F */
    for (i = 1; i <= n; i++)
    {  /* set pointer to the end of the i-th row; later this pointer
     will be set to the beginning of the i-th row */
        fr_ptr[i] = luf.sv_end;
        /* reserve locations for the i-th row */
        luf.sv_end -= fr_len[i];
    }
    /* build the matrix F in row-wise format using this matrix in
     column-wise format */
    for (j = 1; j <= n; j++)
    {  /* walk through elements of the j-th column */
        j_beg = fc_ptr[j];
        j_end = j_beg + fc_len[j] - 1;
        for (j_ptr = j_beg; j_ptr <= j_end; j_ptr++)
        {  /* get row index */
            i = sv_ind[j_ptr];
            /* store element in the i-th row */
            ptr = --fr_ptr[i];
            sv_ind[ptr] = j;
            sv_val[ptr] = sv_val[j_ptr];
        }
    }
    /* return to the factorizing routine */
    return ret;
}

function luf_factorize(luf, n, col, info){
    var pp_row, pp_col, qq_row, qq_col;
    var max_gro = luf.max_gro;
    var i, j, k, p, q, t, ret = null;
    if (n < 1)
        xerror("luf_factorize: n = " + n + "; invalid parameter");
    if (n > N_MAX)
        xerror("luf_factorize: n = " + n + "; matrix too big");
    /* invalidate the factorization */
    luf.valid = 0;
    /* reallocate arrays, if necessary */
    reallocate(luf, n);
    pp_row = luf.pp_row;
    pp_col = luf.pp_col;
    qq_row = luf.qq_row;
    qq_col = luf.qq_col;
    /* estimate initial size of the SVA, if not specified */
    if (luf.sv_size == 0 && luf.new_sva == 0)
        luf.new_sva = 5 * (n + 10);


    function more(){
        /* reallocate the sparse vector area, if required */
        if (luf.new_sva > 0)
        {   luf.sv_size = luf.new_sva;
            luf.sv_ind = new Array(1+luf.sv_size);
            luf.sv_val = new Array(1+luf.sv_size);
            luf.new_sva = 0;
        }
        /* initialize LU-factorization data structures */
        if (initialize(luf, col, info))
        {  /* overflow of the sparse vector area */
            luf.new_sva = luf.sv_size + luf.sv_size;
            xassert(luf.new_sva > luf.sv_size);
            return true;
        }
        /* main elimination loop */
        for (k = 1; k <= n; k++)
        {  /* choose a pivot element v[p,q] */
            if (find_pivot(luf, function(_p, _q){p = _p; q = _q}))
            {  /* no pivot can be chosen, because the active submatrix is
             exactly zero */
                luf.rank = k - 1;
                ret = LUF_ESING;
                return false;
            }
            /* let v[p,q] correspond to u[i',j']; permute k-th and i'-th
             rows and k-th and j'-th columns of the matrix U = P*V*Q to
             move the element u[i',j'] to the position u[k,k] */
            i = pp_col[p]; j = qq_row[q];
            xassert(k <= i && i <= n && k <= j && j <= n);
            /* permute k-th and i-th rows of the matrix U */
            t = pp_row[k];
            pp_row[i] = t; pp_col[t] = i;
            pp_row[k] = p; pp_col[p] = k;
            /* permute k-th and j-th columns of the matrix U */
            t = qq_col[k];
            qq_col[j] = t; qq_row[t] = j;
            qq_col[k] = q; qq_row[q] = k;
            /* eliminate subdiagonal elements of k-th column of the matrix
             U = P*V*Q using the pivot element u[k,k] = v[p,q] */
            if (eliminate(luf, p, q))
            {  /* overflow of the sparse vector area */
                luf.new_sva = luf.sv_size + luf.sv_size;
                xassert(luf.new_sva > luf.sv_size);
                return true;
            }
            /* check relative growth of elements of the matrix V */
            if (luf.big_v > max_gro * luf.max_a)
            {  /* the growth is too intensive, therefore most probably the
             matrix A is ill-conditioned */
                luf.rank = k - 1;
                ret = LUF_ECOND;
                return false;
            }
        }
        /* now the matrix U = P*V*Q is upper triangular, the matrix V has
         been built in row-wise format, and the matrix F has been built
         in column-wise format */
        /* defragment the sparse vector area in order to merge all free
         locations in one continuous extent */
        luf_defrag_sva(luf);
        /* build the matrix V in column-wise format */
        if (build_v_cols(luf))
        {  /* overflow of the sparse vector area */
            luf.new_sva = luf.sv_size + luf.sv_size;
            xassert(luf.new_sva > luf.sv_size);
            return true;
        }
        /* build the matrix F in row-wise format */
        if (build_f_rows(luf))
        {  /* overflow of the sparse vector area */
            luf.new_sva = luf.sv_size + luf.sv_size;
            xassert(luf.new_sva > luf.sv_size);
            return true;
        }
        return false;
    }

    while (more()){}
    if (ret != null)
        return ret;

    /* the LU-factorization has been successfully computed */
    luf.valid = 1;
    luf.rank = n;
    ret = 0;
    /* if there are few free locations in the sparse vector area, try
     increasing its size in the future */
    t = 3 * (n + luf.nnz_v) + 2 * luf.nnz_f;
    if (luf.sv_size < t)
    {  luf.new_sva = luf.sv_size;
        while (luf.new_sva < t)
        {  k = luf.new_sva;
            luf.new_sva = k + k;
            xassert(luf.new_sva > k);
        }
    }
    /* return to the calling program */
    return ret;
}

function luf_f_solve(luf, tr, x){
    var n = luf.n;
    var fr_ptr = luf.fr_ptr;
    var fr_len = luf.fr_len;
    var fc_ptr = luf.fc_ptr;
    var fc_len = luf.fc_len;
    var pp_row = luf.pp_row;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var i, j, k, beg, end, ptr;
    var xk;
    if (!luf.valid)
        xerror("luf_f_solve: LU-factorization is not valid");
    if (!tr)
    {  /* solve the system F*x = b */
        for (j = 1; j <= n; j++)
        {  k = pp_row[j];
            xk = x[k];
            if (xk != 0.0)
            {  beg = fc_ptr[k];
                end = beg + fc_len[k] - 1;
                for (ptr = beg; ptr <= end; ptr++)
                    x[sv_ind[ptr]] -= sv_val[ptr] * xk;
            }
        }
    }
    else
    {  /* solve the system F'*x = b */
        for (i = n; i >= 1; i--)
        {  k = pp_row[i];
            xk = x[k];
            if (xk != 0.0)
            {  beg = fr_ptr[k];
                end = beg + fr_len[k] - 1;
                for (ptr = beg; ptr <= end; ptr++)
                    x[sv_ind[ptr]] -= sv_val[ptr] * xk;
            }
        }
    }
}

function luf_v_solve(luf, tr, x){
    var n = luf.n;
    var vr_ptr = luf.vr_ptr;
    var vr_len = luf.vr_len;
    var vr_piv = luf.vr_piv;
    var vc_ptr = luf.vc_ptr;
    var vc_len = luf.vc_len;
    var pp_row = luf.pp_row;
    var qq_col = luf.qq_col;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var b = luf.work;
    var i, j, k, beg, end, ptr;
    var temp;
    if (!luf.valid)
        xerror("luf_v_solve: LU-factorization is not valid");
    for (k = 1; k <= n; k++){b[k] = x[k]; x[k] = 0.0}
    if (!tr)
    {  /* solve the system V*x = b */
        for (k = n; k >= 1; k--)
        {  i = pp_row[k]; j = qq_col[k];
            temp = b[i];
            if (temp != 0.0)
            {  x[j] = (temp /= vr_piv[i]);
                beg = vc_ptr[j];
                end = beg + vc_len[j] - 1;
                for (ptr = beg; ptr <= end; ptr++)
                    b[sv_ind[ptr]] -= sv_val[ptr] * temp;
            }
        }
    }
    else
    {  /* solve the system V'*x = b */
        for (k = 1; k <= n; k++)
        {  i = pp_row[k]; j = qq_col[k];
            temp = b[j];
            if (temp != 0.0)
            {  x[i] = (temp /= vr_piv[i]);
                beg = vr_ptr[i];
                end = beg + vr_len[i] - 1;
                for (ptr = beg; ptr <= end; ptr++)
                    b[sv_ind[ptr]] -= sv_val[ptr] * temp;
            }
        }
    }
}

function luf_a_solve(luf, tr, x){
    if (!luf.valid)
        xerror("luf_a_solve: LU-factorization is not valid");
    if (!tr)
    {  /* A = F*V, therefore inv(A) = inv(V)*inv(F) */
        luf_f_solve(luf, 0, x);
        luf_v_solve(luf, 0, x);
    }
    else
    {  /* A' = V'*F', therefore inv(A') = inv(F')*inv(V') */
        luf_v_solve(luf, 1, x);
        luf_f_solve(luf, 1, x);
    }
}
