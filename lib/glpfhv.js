/* return codes: */
var
    FHV_ESING   = 1,  /* singular matrix */
    FHV_ECOND   = 2,  /* ill-conditioned matrix */
    FHV_ECHECK  = 3,  /* insufficient accuracy */
    FHV_ELIMIT  = 4,  /* update limit reached */
    FHV_EROOM   = 5;  /* SVA overflow */

function fhv_create_it(){
    var fhv;
    fhv = {};
    fhv.m_max = fhv.m = 0;
    fhv.valid = 0;
    fhv.luf = luf_create_it();
    fhv.hh_max = 50;
    fhv.hh_nfs = 0;
    fhv.hh_ind = fhv.hh_ptr = fhv.hh_len = null;
    fhv.p0_row = fhv.p0_col = null;
    fhv.cc_ind = null;
    fhv.cc_val = null;
    fhv.upd_tol = 1e-6;
    fhv.nnz_h = 0;
    return fhv;
}

function fhv_factorize(fhv, m, col, info){
    var ret;
    if (m < 1)
        xerror("fhv_factorize: m = " + m + "; invalid parameter");
    if (m > M_MAX)
        xerror("fhv_factorize: m = " + m + "; matrix too big");
    fhv.m = m;
    /* invalidate the factorization */
    fhv.valid = 0;
    /* allocate/reallocate arrays, if necessary */
    if (fhv.hh_ind == null)
        fhv.hh_ind = new Int32Array(1+fhv.hh_max);
    if (fhv.hh_ptr == null)
        fhv.hh_ptr = new Int32Array(1+fhv.hh_max);
    if (fhv.hh_len == null)
        fhv.hh_len = new Int32Array(1+fhv.hh_max);
    if (fhv.m_max < m)
    {
        fhv.m_max = m + 100;
        fhv.p0_row = new Int32Array(1+fhv.m_max);
        fhv.p0_col = new Int32Array(1+fhv.m_max);
        fhv.cc_ind = new Int32Array(1+fhv.m_max);
        fhv.cc_val = new Float64Array(1+fhv.m_max);
    }
    /* try to factorize the basis matrix */
    switch (luf_factorize(fhv.luf, m, col, info))
    {  case 0:
        break;
        case LUF_ESING:
            ret = FHV_ESING;
            return ret;
        case LUF_ECOND:
            ret = FHV_ECOND;
            return ret;
        default:
            xassert(fhv != fhv);
    }
    /* the basis matrix has been successfully factorized */
    fhv.valid = 1;
    /* H := I */
    fhv.hh_nfs = 0;
    /* P0 := P */
    xcopyArr(fhv.p0_row, 1, fhv.luf.pp_row, 1, m);
    xcopyArr(fhv.p0_col, 1, fhv.luf.pp_col, 1, m);
    /* currently H has no factors */
    fhv.nnz_h = 0;
    ret = 0;
    /* return to the calling program */
    return ret;
}

function fhv_h_solve(fhv, tr, x){
    var nfs = fhv.hh_nfs;
    var hh_ind = fhv.hh_ind;
    var hh_ptr = fhv.hh_ptr;
    var hh_len = fhv.hh_len;
    var sv_ind = fhv.luf.sv_ind;
    var sv_val = fhv.luf.sv_val;
    var i, k, beg, end, ptr;
    var temp;
    if (!fhv.valid)
        xerror("fhv_h_solve: the factorization is not valid");
    if (!tr)
    {  /* solve the system H*x = b */
        for (k = 1; k <= nfs; k++)
        {  i = hh_ind[k];
            temp = x[i];
            beg = hh_ptr[k];
            end = beg + hh_len[k] - 1;
            for (ptr = beg; ptr <= end; ptr++)
                temp -= sv_val[ptr] * x[sv_ind[ptr]];
            x[i] = temp;
        }
    }
    else
    {  /* solve the system H'*x = b */
        for (k = nfs; k >= 1; k--)
        {  i = hh_ind[k];
            temp = x[i];
            if (temp == 0.0) continue;
            beg = hh_ptr[k];
            end = beg + hh_len[k] - 1;
            for (ptr = beg; ptr <= end; ptr++)
                x[sv_ind[ptr]] -= sv_val[ptr] * temp;
        }
    }
}

function fhv_ftran(fhv, x){
    var pp_row = fhv.luf.pp_row;
    var pp_col = fhv.luf.pp_col;
    var p0_row = fhv.p0_row;
    var p0_col = fhv.p0_col;
    if (!fhv.valid)
        xerror("fhv_ftran: the factorization is not valid");
    /* B = F*H*V, therefore inv(B) = inv(V)*inv(H)*inv(F) */
    fhv.luf.pp_row = p0_row;
    fhv.luf.pp_col = p0_col;
    luf_f_solve(fhv.luf, 0, x);
    fhv.luf.pp_row = pp_row;
    fhv.luf.pp_col = pp_col;
    fhv_h_solve(fhv, 0, x);
    luf_v_solve(fhv.luf, 0, x);
}

function fhv_btran(fhv, x){
    var pp_row = fhv.luf.pp_row;
    var pp_col = fhv.luf.pp_col;
    var p0_row = fhv.p0_row;
    var p0_col = fhv.p0_col;
    if (!fhv.valid)
        xerror("fhv_btran: the factorization is not valid");
    /* B = F*H*V, therefore inv(B') = inv(F')*inv(H')*inv(V') */
    luf_v_solve(fhv.luf, 1, x);
    fhv_h_solve(fhv, 1, x);
    fhv.luf.pp_row = p0_row;
    fhv.luf.pp_col = p0_col;
    luf_f_solve(fhv.luf, 1, x);
    fhv.luf.pp_row = pp_row;
    fhv.luf.pp_col = pp_col;
}

function fhv_update_it(fhv, j, len, ind, idx, val){
    var m = fhv.m;
    var luf = fhv.luf;
    var vr_ptr = luf.vr_ptr;
    var vr_len = luf.vr_len;
    var vr_cap = luf.vr_cap;
    var vr_piv = luf.vr_piv;
    var vc_ptr = luf.vc_ptr;
    var vc_len = luf.vc_len;
    var vc_cap = luf.vc_cap;
    var pp_row = luf.pp_row;
    var pp_col = luf.pp_col;
    var qq_row = luf.qq_row;
    var qq_col = luf.qq_col;
    var sv_ind = luf.sv_ind;
    var sv_val = luf.sv_val;
    var work = luf.work;
    var eps_tol = luf.eps_tol;
    var hh_ind = fhv.hh_ind;
    var hh_ptr = fhv.hh_ptr;
    var hh_len = fhv.hh_len;
    var p0_row = fhv.p0_row;
    var p0_col = fhv.p0_col;
    var cc_ind = fhv.cc_ind;
    var cc_val = fhv.cc_val;
    var upd_tol = fhv.upd_tol;
    var i, i_beg, i_end, i_ptr, j_beg, j_end, j_ptr, k, k1, k2, p, q,
        p_beg, p_end, p_ptr, ptr, ret;
    var f, temp;
    if (!fhv.valid)
        xerror("fhv_update_it: the factorization is not valid");
    if (!(1 <= j && j <= m))
        xerror("fhv_update_it: j = " + j + "; column number out of range");
    /* check if the new factor of matrix H can be created */
    if (fhv.hh_nfs == fhv.hh_max)
    {  /* maximal number of updates has been reached */
        fhv.valid = 0;
        ret = FHV_ELIMIT;
        return ret;
    }
    /* convert new j-th column of B to dense format */
    for (i = 1; i <= m; i++)
        cc_val[i] = 0.0;
    for (k = 1; k <= len; k++)
    {  i = ind[idx + k];
        if (!(1 <= i && i <= m))
            xerror("fhv_update_it: ind[" + k + "] = " + i + "; row number out of range");
        if (cc_val[i] != 0.0)
            xerror("fhv_update_it: ind[" + k + "] = " + i + "; duplicate row index not allowed");
        if (val[k] == 0.0)
            xerror("fhv_update_it: val[" + k + "] = " + val[k] + "; zero element not allowed");
        cc_val[i] = val[k];
    }
    /* new j-th column of V := inv(F * H) * (new B[j]) */
    fhv.luf.pp_row = p0_row;
    fhv.luf.pp_col = p0_col;
    luf_f_solve(fhv.luf, 0, cc_val);
    fhv.luf.pp_row = pp_row;
    fhv.luf.pp_col = pp_col;
    fhv_h_solve(fhv, 0, cc_val);
    /* convert new j-th column of V to sparse format */
    len = 0;
    for (i = 1; i <= m; i++)
    {  temp = cc_val[i];
        if (temp == 0.0 || Math.abs(temp) < eps_tol) continue;
        len++; cc_ind[len] = i; cc_val[len] = temp;
    }
    /* clear old content of j-th column of matrix V */
    j_beg = vc_ptr[j];
    j_end = j_beg + vc_len[j] - 1;
    for (j_ptr = j_beg; j_ptr <= j_end; j_ptr++)
    {  /* get row index of v[i,j] */
        i = sv_ind[j_ptr];
        /* find v[i,j] in the i-th row */
        i_beg = vr_ptr[i];
        i_end = i_beg + vr_len[i] - 1;
        for (i_ptr = i_beg; sv_ind[i_ptr] != j; i_ptr++){/* nop */}
        xassert(i_ptr <= i_end);
        /* remove v[i,j] from the i-th row */
        sv_ind[i_ptr] = sv_ind[i_end];
        sv_val[i_ptr] = sv_val[i_end];
        vr_len[i]--;
    }
    /* now j-th column of matrix V is empty */
    luf.nnz_v -= vc_len[j];
    vc_len[j] = 0;
    /* add new elements of j-th column of matrix V to corresponding
     row lists; determine indices k1 and k2 */
    k1 = qq_row[j]; k2 = 0;
    for (ptr = 1; ptr <= len; ptr++)
    {  /* get row index of v[i,j] */
        i = cc_ind[ptr];
        /* at least one unused location is needed in i-th row */
        if (vr_len[i] + 1 > vr_cap[i])
        {  if (luf_enlarge_row(luf, i, vr_len[i] + 10))
        {  /* overflow of the sparse vector area */
            fhv.valid = 0;
            luf.new_sva = luf.sv_size + luf.sv_size;
            xassert(luf.new_sva > luf.sv_size);
            ret = FHV_EROOM;
            return ret;
        }
        }
        /* add v[i,j] to i-th row */
        i_ptr = vr_ptr[i] + vr_len[i];
        sv_ind[i_ptr] = j;
        sv_val[i_ptr] = cc_val[ptr];
        vr_len[i]++;
        /* adjust index k2 */
        if (k2 < pp_col[i]) k2 = pp_col[i];
    }
    /* capacity of j-th column (which is currently empty) should be
     not less than len locations */
    if (vc_cap[j] < len)
    {  if (luf_enlarge_col(luf, j, len))
    {  /* overflow of the sparse vector area */
        fhv.valid = 0;
        luf.new_sva = luf.sv_size + luf.sv_size;
        xassert(luf.new_sva > luf.sv_size);
        ret = FHV_EROOM;
        return ret;
    }
    }
    /* add new elements of matrix V to j-th column list */
    j_ptr = vc_ptr[j];
    xcopyArr(sv_ind, j_ptr, cc_ind, 1, len);
    xcopyArr(sv_val, j_ptr, cc_val, 1, len);
    vc_len[j] = len;
    luf.nnz_v += len;
    /* if k1 > k2, diagonal element u[k2,k2] of matrix U is zero and
     therefore the adjacent basis matrix is structurally singular */
    if (k1 > k2)
    {  fhv.valid = 0;
        ret = FHV_ESING;
        return ret;
    }
    /* perform implicit symmetric permutations of rows and columns of
     matrix U */
    i = pp_row[k1]; j = qq_col[k1];
    for (k = k1; k < k2; k++)
    {  pp_row[k] = pp_row[k+1]; pp_col[pp_row[k]] = k;
        qq_col[k] = qq_col[k+1]; qq_row[qq_col[k]] = k;
    }
    pp_row[k2] = i; pp_col[i] = k2;
    qq_col[k2] = j; qq_row[j] = k2;
    /* now i-th row of the matrix V is k2-th row of matrix U; since
     no pivoting is used, only this row will be transformed */
    /* copy elements of i-th row of matrix V to the working array and
     remove these elements from matrix V */
    for (j = 1; j <= m; j++) work[j] = 0.0;
    i_beg = vr_ptr[i];
    i_end = i_beg + vr_len[i] - 1;
    for (i_ptr = i_beg; i_ptr <= i_end; i_ptr++)
    {  /* get column index of v[i,j] */
        j = sv_ind[i_ptr];
        /* store v[i,j] to the working array */
        work[j] = sv_val[i_ptr];
        /* find v[i,j] in the j-th column */
        j_beg = vc_ptr[j];
        j_end = j_beg + vc_len[j] - 1;
        for (j_ptr = j_beg; sv_ind[j_ptr] != i; j_ptr++){/* nop */}
        xassert(j_ptr <= j_end);
        /* remove v[i,j] from the j-th column */
        sv_ind[j_ptr] = sv_ind[j_end];
        sv_val[j_ptr] = sv_val[j_end];
        vc_len[j]--;
    }
    /* now i-th row of matrix V is empty */
    luf.nnz_v -= vr_len[i];
    vr_len[i] = 0;
    /* create the next row-like factor of the matrix H; this factor
     corresponds to i-th (transformed) row */
    fhv.hh_nfs++;
    hh_ind[fhv.hh_nfs] = i;
    /* hh_ptr[] will be set later */
    hh_len[fhv.hh_nfs] = 0;
    /* up to (k2 - k1) free locations are needed to add new elements
     to the non-trivial row of the row-like factor */
    if (luf.sv_end - luf.sv_beg < k2 - k1)
    {  luf_defrag_sva(luf);
        if (luf.sv_end - luf.sv_beg < k2 - k1)
        {  /* overflow of the sparse vector area */
            fhv.valid = luf.valid = 0;
            luf.new_sva = luf.sv_size + luf.sv_size;
            xassert(luf.new_sva > luf.sv_size);
            ret = FHV_EROOM;
            return ret;
        }
    }
    /* eliminate subdiagonal elements of matrix U */
    for (k = k1; k < k2; k++)
    {  /* v[p,q] = u[k,k] */
        p = pp_row[k]; q = qq_col[k];
        /* this is the crucial point, where even tiny non-zeros should
         not be dropped */
        if (work[q] == 0.0) continue;
        /* compute gaussian multiplier f = v[i,q] / v[p,q] */
        f = work[q] / vr_piv[p];
        /* perform gaussian transformation:
         (i-th row) := (i-th row) - f * (p-th row)
         in order to eliminate v[i,q] = u[k2,k] */
        p_beg = vr_ptr[p];
        p_end = p_beg + vr_len[p] - 1;
        for (p_ptr = p_beg; p_ptr <= p_end; p_ptr++)
            work[sv_ind[p_ptr]] -= f * sv_val[p_ptr];
        /* store new element (gaussian multiplier that corresponds to
         p-th row) in the current row-like factor */
        luf.sv_end--;
        sv_ind[luf.sv_end] = p;
        sv_val[luf.sv_end] = f;
        hh_len[fhv.hh_nfs]++;
    }
    /* set pointer to the current row-like factor of the matrix H
     (if no elements were added to this factor, it is unity matrix
     and therefore can be discarded) */
    if (hh_len[fhv.hh_nfs] == 0)
        fhv.hh_nfs--;
    else
    {  hh_ptr[fhv.hh_nfs] = luf.sv_end;
        fhv.nnz_h += hh_len[fhv.hh_nfs];
    }
    /* store new pivot which corresponds to u[k2,k2] */
    vr_piv[i] = work[qq_col[k2]];
    /* new elements of i-th row of matrix V (which are non-diagonal
     elements u[k2,k2+1], ..., u[k2,m] of matrix U = P*V*Q) now are
     contained in the working array; add them to matrix V */
    len = 0;
    for (k = k2+1; k <= m; k++)
    {  /* get column index and value of v[i,j] = u[k2,k] */
        j = qq_col[k];
        temp = work[j];
        /* if v[i,j] is close to zero, skip it */
        if (Math.abs(temp) < eps_tol) continue;
        /* at least one unused location is needed in j-th column */
        if (vc_len[j] + 1 > vc_cap[j])
        {  if (luf_enlarge_col(luf, j, vc_len[j] + 10))
        {  /* overflow of the sparse vector area */
            fhv.valid = 0;
            luf.new_sva = luf.sv_size + luf.sv_size;
            xassert(luf.new_sva > luf.sv_size);
            ret = FHV_EROOM;
            return ret;
        }
        }
        /* add v[i,j] to j-th column */
        j_ptr = vc_ptr[j] + vc_len[j];
        sv_ind[j_ptr] = i;
        sv_val[j_ptr] = temp;
        vc_len[j]++;
        /* also store v[i,j] to the auxiliary array */
        len++; cc_ind[len] = j; cc_val[len] = temp;
    }
    /* capacity of i-th row (which is currently empty) should be not
     less than len locations */
    if (vr_cap[i] < len)
    {  if (luf_enlarge_row(luf, i, len))
    {  /* overflow of the sparse vector area */
        fhv.valid = 0;
        luf.new_sva = luf.sv_size + luf.sv_size;
        xassert(luf.new_sva > luf.sv_size);
        ret = FHV_EROOM;
        return ret;
    }
    }
    /* add new elements to i-th row list */
    i_ptr = vr_ptr[i];
    xcopyArr(sv_ind, i_ptr, cc_ind, 1, len);
    xcopyArr(sv_val, i_ptr, cc_val, 1, len);
    vr_len[i] = len;
    luf.nnz_v += len;
    /* updating is finished; check that diagonal element u[k2,k2] is
     not very small in absolute value among other elements in k2-th
     row and k2-th column of matrix U = P*V*Q */
    /* temp = max(|u[k2,*]|, |u[*,k2]|) */
    temp = 0.0;
    /* walk through k2-th row of U which is i-th row of V */
    i = pp_row[k2];
    i_beg = vr_ptr[i];
    i_end = i_beg + vr_len[i] - 1;
    for (i_ptr = i_beg; i_ptr <= i_end; i_ptr++)
        if (temp < Math.abs(sv_val[i_ptr])) temp = Math.abs(sv_val[i_ptr]);
    /* walk through k2-th column of U which is j-th column of V */
    j = qq_col[k2];
    j_beg = vc_ptr[j];
    j_end = j_beg + vc_len[j] - 1;
    for (j_ptr = j_beg; j_ptr <= j_end; j_ptr++)
        if (temp < Math.abs(sv_val[j_ptr])) temp = Math.abs(sv_val[j_ptr]);
    /* check that u[k2,k2] is not very small */
    if (Math.abs(vr_piv[i]) < upd_tol * temp)
    {  /* the factorization seems to be inaccurate and therefore must
     be recomputed */
        fhv.valid = 0;
        ret = FHV_ECHECK;
        return ret;
    }
    /* the factorization has been successfully updated */
    ret = 0;
    /* return to the calling program */
    return ret;
}

