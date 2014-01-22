var
/* problem class: */
/** @const */LPX_LP = exports["LPX_LP"] = 100, /* linear programming (LP) */
/** @const */LPX_MIP = exports["LPX_MIP"] = 101, /* mixed integer programming (MIP) */

    /* type of auxiliary/structural variable: */
/** @const */LPX_FR = exports["LPX_FR"] = 110, /* free variable */
/** @const */LPX_LO = exports["LPX_LO"] = 111, /* variable with lower bound */
/** @const */LPX_UP = exports["LPX_UP"] = 112, /* variable with upper bound */
/** @const */LPX_DB = exports["LPX_DB"] = 113, /* double-bounded variable */
/** @const */LPX_FX = exports["LPX_FX"] = 114, /* fixed variable */

    /* optimization direction flag: */
/** @const */LPX_MIN = exports["LPX_MIN"] = 120, /* minimization */
/** @const */LPX_MAX = exports["LPX_MAX"] = 121, /* maximization */

    /* status of primal basic solution: */
/** @const */LPX_P_UNDEF = exports["LPX_P_UNDEF"] = 132, /* primal solution is undefined */
/** @const */LPX_P_FEAS = exports["LPX_P_FEAS"] = 133, /* solution is primal feasible */
/** @const */LPX_P_INFEAS = exports["LPX_P_INFEAS"] = 134, /* solution is primal infeasible */
/** @const */LPX_P_NOFEAS = exports["LPX_P_NOFEAS"] = 135, /* no primal feasible solution exists */

    /* status of dual basic solution: */
/** @const */LPX_D_UNDEF = exports["LPX_D_UNDEF"] = 136, /* dual solution is undefined */
/** @const */LPX_D_FEAS = exports["LPX_D_FEAS"] = 137, /* solution is dual feasible */
/** @const */LPX_D_INFEAS = exports["LPX_D_INFEAS"] = 138, /* solution is dual infeasible */
/** @const */LPX_D_NOFEAS = exports["LPX_D_NOFEAS"] = 139, /* no dual feasible solution exists */

    /* status of auxiliary/structural variable: */
/** @const */LPX_BS = exports["LPX_BS"] = 140, /* basic variable */
/** @const */LPX_NL = exports["LPX_NL"] = 141, /* non-basic variable on lower bound */
/** @const */LPX_NU = exports["LPX_NU"] = 142, /* non-basic variable on upper bound */
/** @const */LPX_NF = exports["LPX_NF"] = 143, /* non-basic free variable */
/** @const */LPX_NS = exports["LPX_NS"] = 144, /* non-basic fixed variable */

    /* status of interior-point solution: */
/** @const */LPX_T_UNDEF = exports["LPX_T_UNDEF"] = 150, /* interior solution is undefined */
/** @const */LPX_T_OPT = exports["LPX_T_OPT"] = 151, /* interior solution is optimal */

    /* kind of structural variable: */
/** @const */LPX_CV = exports["LPX_CV"] = 160, /* continuous variable */
/** @const */LPX_IV = exports["LPX_IV"] = 161, /* integer variable */

    /* status of integer solution: */
/** @const */LPX_I_UNDEF = exports["LPX_I_UNDEF"] = 170, /* integer solution is undefined */
/** @const */LPX_I_OPT = exports["LPX_I_OPT"] = 171, /* integer solution is optimal */
/** @const */LPX_I_FEAS = exports["LPX_I_FEAS"] = 172, /* integer solution is feasible */
/** @const */LPX_I_NOFEAS = exports["LPX_I_NOFEAS"] = 173, /* no integer solution exists */

    /* status codes reported by the routine lpx_get_status: */
/** @const */LPX_OPT = exports["LPX_OPT"] = 180, /* optimal */
/** @const */LPX_FEAS = exports["LPX_FEAS"] = 181, /* feasible */
/** @const */LPX_INFEAS = exports["LPX_INFEAS"] = 182, /* infeasible */
/** @const */LPX_NOFEAS = exports["LPX_NOFEAS"] = 183, /* no feasible */
/** @const */LPX_UNBND = exports["LPX_UNBND"] = 184, /* unbounded */
/** @const */LPX_UNDEF = exports["LPX_UNDEF"] = 185, /* undefined */

    /* exit codes returned by solver routines: */
/** @const */LPX_E_OK = exports["LPX_E_OK"] = 200, /* success */
/** @const */LPX_E_EMPTY = exports["LPX_E_EMPTY"] = 201, /* empty problem */
/** @const */LPX_E_BADB = exports["LPX_E_BADB"] = 202, /* invalid initial basis */
/** @const */LPX_E_INFEAS = exports["LPX_E_INFEAS"] = 203, /* infeasible initial solution */
/** @const */LPX_E_FAULT = exports["LPX_E_FAULT"] = 204, /* unable to start the search */
/** @const */LPX_E_OBJLL = exports["LPX_E_OBJLL"] = 205, /* objective lower limit reached */
/** @const */LPX_E_OBJUL = exports["LPX_E_OBJUL"] = 206, /* objective upper limit reached */
/** @const */LPX_E_ITLIM = exports["LPX_E_ITLIM"] = 207, /* iterations limit exhausted */
/** @const */LPX_E_TMLIM = exports["LPX_E_TMLIM"] = 208, /* time limit exhausted */
/** @const */LPX_E_NOFEAS = exports["LPX_E_NOFEAS"] = 209, /* no feasible solution */
/** @const */LPX_E_INSTAB = exports["LPX_E_INSTAB"] = 210, /* numerical instability */
/** @const */LPX_E_SING = exports["LPX_E_SING"] = 211, /* problems with basis matrix */
/** @const */LPX_E_NOCONV = exports["LPX_E_NOCONV"] = 212, /* no convergence (interior) */
/** @const */LPX_E_NOPFS = exports["LPX_E_NOPFS"] = 213, /* no primal feas. sol. (LP presolver) */
/** @const */LPX_E_NODFS = exports["LPX_E_NODFS"] = 214, /* no dual feas. sol. (LP presolver) */
/** @const */LPX_E_MIPGAP = exports["LPX_E_MIPGAP"] = 215, /* relative mip gap tolerance reached */

    /* control parameter identifiers: */
/** @const */LPX_K_MSGLEV = exports["LPX_K_MSGLEV"] = 300, /* lp.msg_lev */
/** @const */LPX_K_SCALE = exports["LPX_K_SCALE"] = 301, /* lp.scale */
/** @const */LPX_K_DUAL = exports["LPX_K_DUAL"] = 302, /* lp.dual */
/** @const */LPX_K_PRICE = exports["LPX_K_PRICE"] = 303, /* lp.price */
/** @const */LPX_K_RELAX = exports["LPX_K_RELAX"] = 304, /* lp.relax */
/** @const */LPX_K_TOLBND = exports["LPX_K_TOLBND"] = 305, /* lp.tol_bnd */
/** @const */LPX_K_TOLDJ = exports["LPX_K_TOLDJ"] = 306, /* lp.tol_dj */
/** @const */LPX_K_TOLPIV = exports["LPX_K_TOLPIV"] = 307, /* lp.tol_piv */
/** @const */LPX_K_ROUND = exports["LPX_K_ROUND"] = 308, /* lp.round */
/** @const */LPX_K_OBJLL = exports["LPX_K_OBJLL"] = 309, /* lp.obj_ll */
/** @const */LPX_K_OBJUL = exports["LPX_K_OBJUL"] = 310, /* lp.obj_ul */
/** @const */LPX_K_ITLIM = exports["LPX_K_ITLIM"] = 311, /* lp.it_lim */
/** @const */LPX_K_ITCNT = exports["LPX_K_ITCNT"] = 312, /* lp.it_cnt */
/** @const */LPX_K_TMLIM = exports["LPX_K_TMLIM"] = 313, /* lp.tm_lim */
/** @const */LPX_K_OUTFRQ = exports["LPX_K_OUTFRQ"] = 314, /* lp.out_frq */
/** @const */LPX_K_OUTDLY = exports["LPX_K_OUTDLY"] = 315, /* lp.out_dly */
/** @const */LPX_K_BRANCH = exports["LPX_K_BRANCH"] = 316, /* lp.branch */
/** @const */LPX_K_BTRACK = exports["LPX_K_BTRACK"] = 317, /* lp.btrack */
/** @const */LPX_K_TOLINT = exports["LPX_K_TOLINT"] = 318, /* lp.tol_int */
/** @const */LPX_K_TOLOBJ = exports["LPX_K_TOLOBJ"] = 319, /* lp.tol_obj */
/** @const */LPX_K_MPSINFO = exports["LPX_K_MPSINFO"] = 320, /* lp.mps_info */
/** @const */LPX_K_MPSOBJ = exports["LPX_K_MPSOBJ"] = 321, /* lp.mps_obj */
/** @const */LPX_K_MPSORIG = exports["LPX_K_MPSORIG"] = 322, /* lp.mps_orig */
/** @const */LPX_K_MPSWIDE = exports["LPX_K_MPSWIDE"] = 323, /* lp.mps_wide */
/** @const */LPX_K_MPSFREE = exports["LPX_K_MPSFREE"] = 324, /* lp.mps_free */
/** @const */LPX_K_MPSSKIP = exports["LPX_K_MPSSKIP"] = 325, /* lp.mps_skip */
/** @const */LPX_K_LPTORIG = exports["LPX_K_LPTORIG"] = 326, /* lp.lpt_orig */
/** @const */LPX_K_PRESOL = exports["LPX_K_PRESOL"] = 327, /* lp.presol */
/** @const */LPX_K_BINARIZE = exports["LPX_K_BINARIZE"] = 328, /* lp.binarize */
/** @const */LPX_K_USECUTS = exports["LPX_K_USECUTS"] = 329, /* lp.use_cuts */
/** @const */LPX_K_BFTYPE = exports["LPX_K_BFTYPE"] = 330, /* lp.bfcp.type */
/** @const */LPX_K_MIPGAP = exports["LPX_K_MIPGAP"] = 331, /* lp.mip_gap */

/** @const */LPX_C_COVER = exports["LPX_C_COVER"] = 0x01, /* mixed cover cuts */
/** @const */LPX_C_CLIQUE = exports["LPX_C_CLIQUE"] = 0x02, /* clique cuts */
/** @const */LPX_C_GOMORY = exports["LPX_C_GOMORY"] = 0x04, /* Gomory's mixed integer cuts */
/** @const */LPX_C_MIR = exports["LPX_C_MIR"] = 0x08, /* mixed integer rounding cuts */
/** @const */LPX_C_ALL = exports["LPX_C_ALL"] = 0xFF;
