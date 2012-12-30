
/* return codes: */
var
    BFD_ESING   = 1,  /* singular matrix */
    BFD_ECOND   = 2,  /* ill-conditioned matrix */
    BFD_ECHECK  = 3,  /* insufficient accuracy */
    BFD_ELIMIT  = 4,  /* update limit reached */
    BFD_EROOM   = 5;  /* SVA overflow */

function bfd_create_it(){
    var bfd = {};
    bfd.valid = 0;
    bfd.type = GLP_BF_FT;
    bfd.fhv = null;
    bfd.lpf = null;
    bfd.lu_size = 0;
    bfd.piv_tol = 0.10;
    bfd.piv_lim = 4;
    bfd.suhl = 1;
    bfd.eps_tol = 1e-15;
    bfd.max_gro = 1e+10;
    bfd.nfs_max = 100;
    bfd.upd_tol = 1e-6;
    bfd.nrs_max = 100;
    bfd.rs_size = 1000;
    bfd.upd_lim = -1;
    bfd.upd_cnt = 0;
    return bfd;
}

function bfd_set_parm(bfd, parm){
    /* change LP basis factorization control parameters */
    xassert(bfd != null);
    bfd.type = parm.type;
    bfd.lu_size = parm.lu_size;
    bfd.piv_tol = parm.piv_tol;
    bfd.piv_lim = parm.piv_lim;
    bfd.suhl = parm.suhl;
    bfd.eps_tol = parm.eps_tol;
    bfd.max_gro = parm.max_gro;
    bfd.nfs_max = parm.nfs_max;
    bfd.upd_tol = parm.upd_tol;
    bfd.nrs_max = parm.nrs_max;
    bfd.rs_size = parm.rs_size;
}

function bfd_factorize(bfd, m, bh, col, info){
    var luf;
    var nov, ret;
    xassert(bfd != null);
    xassert(1 <= m && m <= M_MAX);
    /* invalidate the factorization */
    bfd.valid = 0;
    /* create the factorization, if necessary */
    nov = 0;
    switch (bfd.type)
    {  case GLP_BF_FT:
        bfd.lpf = null;
        if (bfd.fhv == null){
            bfd.fhv = fhv_create_it(); nov = 1;
        }
        break;
        case GLP_BF_BG:
        case GLP_BF_GR:
            bfd.fhv = null;
            if (bfd.lpf == null){
                bfd.lpf = lpf_create_it(); nov = 1;
            }
            break;
        default:
            xassert(bfd != bfd);
    }
    /* set control parameters specific to LUF */
    if (bfd.fhv != null)
        luf = bfd.fhv.luf;
    else if (bfd.lpf != null)
        luf = bfd.lpf.luf;
    else
        xassert(bfd != bfd);
    if (nov) luf.new_sva = bfd.lu_size;
    luf.piv_tol = bfd.piv_tol;
    luf.piv_lim = bfd.piv_lim;
    luf.suhl = bfd.suhl;
    luf.eps_tol = bfd.eps_tol;
    luf.max_gro = bfd.max_gro;
    /* set control parameters specific to FHV */
    if (bfd.fhv != null)
    {  if (nov) bfd.fhv.hh_max = bfd.nfs_max;
        bfd.fhv.upd_tol = bfd.upd_tol;
    }
    /* set control parameters specific to LPF */
    if (bfd.lpf != null)
    {  if (nov) bfd.lpf.n_max = bfd.nrs_max;
        if (nov) bfd.lpf.v_size = bfd.rs_size;
    }
    /* try to factorize the basis matrix */
    if (bfd.fhv != null)
    {  switch (fhv_factorize(bfd.fhv, m, col, info))
    {  case 0:
            break;
        case FHV_ESING:
            ret = BFD_ESING;
            return ret;
        case FHV_ECOND:
            ret = BFD_ECOND;
            return ret;
        default:
            xassert(bfd != bfd);
    }
    }
    else if (bfd.lpf != null)
    {  switch (lpf_factorize(bfd.lpf, m, bh, col, info))
    {  case 0:
            /* set the Schur complement update type */
            switch (bfd.type)
            {  case GLP_BF_BG:
                /* Bartels-Golub update */
                bfd.lpf.scf.t_opt = SCF_TBG;
                break;
                case GLP_BF_GR:
                    /* Givens rotation update */
                    bfd.lpf.scf.t_opt = SCF_TGR;
                    break;
                default:
                    xassert(bfd != bfd);
            }
            break;
        case LPF_ESING:
            ret = BFD_ESING;
            return ret;
        case LPF_ECOND:
            ret = BFD_ECOND;
            return ret;
        default:
            xassert(bfd != bfd);
    }
    }
    else
        xassert(bfd != bfd);
    /* the basis matrix has been successfully factorized */
    bfd.valid = 1;
    bfd.upd_cnt = 0;
    ret = 0;
    /* return to the calling program */
    return ret;
}

function bfd_ftran(bfd, x){
    xassert(bfd != null);
    xassert(bfd.valid);
    if (bfd.fhv != null)
        fhv_ftran(bfd.fhv, x);
    else if (bfd.lpf != null)
        lpf_ftran(bfd.lpf, x);
    else
        xassert(bfd != bfd);
}

function bfd_btran(bfd, x){
    xassert(bfd != null);
    xassert(bfd.valid);
    if (bfd.fhv != null)
        fhv_btran(bfd.fhv, x);
    else if (bfd.lpf != null)
        lpf_btran(bfd.lpf, x);
    else
        xassert(bfd != bfd);
}

function bfd_update_it(bfd, j, bh, len, ind, idx, val){
    var ret;
    xassert(bfd != null);
    xassert(bfd.valid);
    /* try to update the factorization */
    if (bfd.fhv != null)
    {  switch (fhv_update_it(bfd.fhv, j, len, ind, idx, val))
    {  case 0:
            break;
        case FHV_ESING:
            bfd.valid = 0;
            ret = BFD_ESING;
            return ret;
        case FHV_ECHECK:
            bfd.valid = 0;
            ret = BFD_ECHECK;
            return ret;
        case FHV_ELIMIT:
            bfd.valid = 0;
            ret = BFD_ELIMIT;
            return ret;
        case FHV_EROOM:
            bfd.valid = 0;
            ret = BFD_EROOM;
            return ret;
        default:
            xassert(bfd != bfd);
    }
    }
    else if (bfd.lpf != null)
    {  switch (lpf_update_it(bfd.lpf, j, bh, len, ind, idx, val))
    {  case 0:
            break;
        case LPF_ESING:
            bfd.valid = 0;
            ret = BFD_ESING;
            return ret;
        case LPF_ELIMIT:
            bfd.valid = 0;
            ret = BFD_ELIMIT;
            return ret;
        default:
            xassert(bfd != bfd);
    }
    }
    else
        xassert(bfd != bfd);
    /* the factorization has been successfully updated */
    /* increase the update count */
    bfd.upd_cnt++;
    ret = 0;
    /* return to the calling program */
    return ret;
}

function bfd_get_count(bfd){
    /* determine factorization update count */
    xassert(bfd != null);
    xassert(bfd.valid);
    return bfd.upd_cnt;
}

