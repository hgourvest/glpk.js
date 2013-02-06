/* library version numbers: */
var
    GLP_MAJOR_VERSION = exports["GLP_MAJOR_VERSION"] = 4,
    GLP_MINOR_VERSION = exports["GLP_MINOR_VERSION"] = 48,

/* optimization direction flag: */
    /** @const */GLP_MIN = exports["GLP_MIN"] = 1, /* minimization */
    /** @const */GLP_MAX = exports["GLP_MAX"] = 2, /* maximization */

/* kind of structural variable: */
    /** @const */GLP_CV = exports["GLP_CV"] = 1, /* continuous variable */
    /** @const */GLP_IV = exports["GLP_IV"] = 2, /* integer variable */
    /** @const */GLP_BV = exports["GLP_BV"] = 3, /* binary variable */

/* type of auxiliary/structural variable: */
    /** @const */GLP_FR = exports["GLP_FR"] = 1, /* free variable */
    /** @const */GLP_LO = exports["GLP_LO"] = 2, /* variable with lower bound */
    /** @const */GLP_UP = exports["GLP_UP"] = 3, /* variable with upper bound */
    /** @const */GLP_DB = exports["GLP_DB"] = 4, /* double-bounded variable */
    /** @const */GLP_FX = exports["GLP_FX"] = 5, /* fixed variable */

/* status of auxiliary/structural variable: */
    /** @const */GLP_BS = exports["GLP_BS"] = 1, /* basic variable */
    /** @const */GLP_NL = exports["GLP_NL"] = 2, /* non-basic variable on lower bound */
    /** @const */GLP_NU = exports["GLP_NU"] = 3, /* non-basic variable on upper bound */
    /** @const */GLP_NF = exports["GLP_NF"] = 4, /* non-basic free variable */
    /** @const */GLP_NS = exports["GLP_NS"] = 5, /* non-basic fixed variable */

/* scaling options: */
    /** @const */GLP_SF_GM = exports["GLP_SF_GM"] = 0x01, /* perform geometric mean scaling */
    /** @const */GLP_SF_EQ = exports["GLP_SF_EQ"] = 0x10, /* perform equilibration scaling */
    /** @const */GLP_SF_2N = exports["GLP_SF_2N"] = 0x20, /* round scale factors to power of two */
    /** @const */GLP_SF_SKIP = exports["GLP_SF_SKIP"] = 0x40, /* skip if problem is well scaled */
    /** @const */GLP_SF_AUTO = exports["GLP_SF_AUTO"] = 0x80, /* choose scaling options automatically */

/* solution indicator: */
    /** @const */GLP_SOL = exports["GLP_SOL"] = 1, /* basic solution */
    /** @const */GLP_IPT = exports["GLP_IPT"] = 2, /* interior-point solution */
    /** @const */GLP_MIP = exports["GLP_MIP"] = 3, /* mixed integer solution */

/* solution status: */
    /** @const */GLP_UNDEF = exports["GLP_UNDEF"] = 1, /* solution is undefined */
    /** @const */GLP_FEAS = exports["GLP_FEAS"] = 2, /* solution is feasible */
    /** @const */GLP_INFEAS = exports["GLP_INFEAS"] = 3, /* solution is infeasible */
    /** @const */GLP_NOFEAS = exports["GLP_NOFEAS"] = 4, /* no feasible solution exists */
    /** @const */GLP_OPT = exports["GLP_OPT"] = 5, /* solution is optimal */
    /** @const */GLP_UNBND = exports["GLP_UNBND"] = 6, /* solution is unbounded */

/* basis factorization control parameters */
    /** @const */GLP_BF_FT = exports["GLP_BF_FT"] = 1, /* LUF + Forrest-Tomlin */
    /** @const */GLP_BF_BG = exports["GLP_BF_BG"] = 2, /* LUF + Schur compl. + Bartels-Golub */
    /** @const */GLP_BF_GR = exports["GLP_BF_GR"] = 3, /* LUF + Schur compl. + Givens rotation */

/* simplex method control parameters */
    /** @const */GLP_MSG_OFF = exports["GLP_MSG_OFF"] = 0, /* no output */
    /** @const */GLP_MSG_ERR = exports["GLP_MSG_ERR"] = 1, /* warning and error messages only */
    /** @const */GLP_MSG_ON = exports["GLP_MSG_ON"] = 2, /* normal output */
    /** @const */GLP_MSG_ALL = exports["GLP_MSG_ALL"] = 3, /* full output */
    /** @const */GLP_MSG_DBG = exports["GLP_MSG_DBG"] = 4, /* debug output */

    /** @const */GLP_PRIMAL = exports["GLP_PRIMAL"] = 1, /* use primal simplex */
    /** @const */GLP_DUALP = exports["GLP_DUALP"] = 2, /* use dual; if it fails, use primal */
    /** @const */GLP_DUAL = exports["GLP_DUAL"] = 3, /* use dual simplex */

    /** @const */GLP_PT_STD = exports["GLP_PT_STD"] = 0x11, /* standard (Dantzig rule) */
    /** @const */GLP_PT_PSE = exports["GLP_PT_PSE"] = 0x22, /* projected steepest edge */

    /** @const */GLP_RT_STD = exports["GLP_RT_STD"] = 0x11, /* standard (textbook) */
    /** @const */GLP_RT_HAR = exports["GLP_RT_HAR"] = 0x22, /* two-pass Harris' ratio test */

/* interior-point solver control parameters */
    /** @const */GLP_ORD_NONE = exports["GLP_ORD_NONE"] = 0, /* natural (original) ordering */
    /** @const */GLP_ORD_QMD = exports["GLP_ORD_QMD"] = 1, /* quotient minimum degree (QMD) */
    /** @const */GLP_ORD_AMD = exports["GLP_ORD_AMD"] = 2, /* approx. minimum degree (AMD) */
    /** @const */GLP_ORD_SYMAMD = exports["GLP_ORD_SYMAMD"] = 3, /* approx. minimum degree (SYMAMD) */

/* integer optimizer control parameters */
    /** @const */GLP_BR_FFV = exports["GLP_BR_FFV"] = 1, /* first fractional variable */
    /** @const */GLP_BR_LFV = exports["GLP_BR_LFV"] = 2, /* last fractional variable */
    /** @const */GLP_BR_MFV = exports["GLP_BR_MFV"] = 3, /* most fractional variable */
    /** @const */GLP_BR_DTH = exports["GLP_BR_DTH"] = 4, /* heuristic by Driebeck and Tomlin */
    /** @const */GLP_BR_PCH = exports["GLP_BR_PCH"] = 5, /* hybrid pseudocost heuristic */

    /** @const */GLP_BT_DFS = exports["GLP_BT_DFS"] = 1, /* depth first search */
    /** @const */GLP_BT_BFS = exports["GLP_BT_BFS"] = 2, /* breadth first search */
    /** @const */GLP_BT_BLB = exports["GLP_BT_BLB"] = 3, /* best local bound */
    /** @const */GLP_BT_BPH = exports["GLP_BT_BPH"] = 4, /* best projection heuristic */

    /** @const */GLP_PP_NONE = exports["GLP_PP_NONE"] = 0, /* disable preprocessing */
    /** @const */GLP_PP_ROOT = exports["GLP_PP_ROOT"] = 1, /* preprocessing only on root level */
    /** @const */GLP_PP_ALL = exports["GLP_PP_ALL"] = 2, /* preprocessing on all levels */

/* additional row attributes */
    /** @const */GLP_RF_REG = exports["GLP_RF_REG"] = 0, /* regular constraint */
    /** @const */GLP_RF_LAZY = exports["GLP_RF_LAZY"] = 1, /* "lazy" constraint */
    /** @const */GLP_RF_CUT = exports["GLP_RF_CUT"] = 2, /* cutting plane constraint */

/* row class descriptor: */
    /** @const */GLP_RF_GMI = exports["GLP_RF_GMI"] = 1, /* Gomory's mixed integer cut */
    /** @const */GLP_RF_MIR = exports["GLP_RF_MIR"] = 2, /* mixed integer rounding cut */
    /** @const */GLP_RF_COV = exports["GLP_RF_COV"] = 3, /* mixed cover cut */
    /** @const */GLP_RF_CLQ = exports["GLP_RF_CLQ"] = 4, /* clique cut */

/* enable/disable flag: */
    /** @const */GLP_ON = exports["GLP_ON"] = 1, /* enable something */
    /** @const */GLP_OFF = exports["GLP_OFF"] = 0, /* disable something */

/* reason codes: */
    /** @const */GLP_IROWGEN = exports["GLP_IROWGEN"] = 0x01, /* request for row generation */
    /** @const */GLP_IBINGO = exports["GLP_IBINGO"] = 0x02, /* better integer solution found */
    /** @const */GLP_IHEUR = exports["GLP_IHEUR"] = 0x03, /* request for heuristic solution */
    /** @const */GLP_ICUTGEN = exports["GLP_ICUTGEN"] = 0x04, /* request for cut generation */
    /** @const */GLP_IBRANCH = exports["GLP_IBRANCH"] = 0x05, /* request for branching */
    /** @const */GLP_ISELECT = exports["GLP_ISELECT"] = 0x06, /* request for subproblem selection */
    /** @const */GLP_IPREPRO = exports["GLP_IPREPRO"] = 0x07, /* request for preprocessing */

/* branch selection indicator: */
    /** @const */GLP_NO_BRNCH = exports["GLP_NO_BRNCH"] = 0, /* select no branch */
    /** @const */GLP_DN_BRNCH = exports["GLP_DN_BRNCH"] = 1, /* select down-branch */
    /** @const */GLP_UP_BRNCH = exports["GLP_UP_BRNCH"] = 2, /* select up-branch */

/* return codes: */
    /** @const */GLP_EBADB = exports["GLP_EBADB"] = 0x01, /* invalid basis */
    /** @const */GLP_ESING = exports["GLP_ESING"] = 0x02, /* singular matrix */
    /** @const */GLP_ECOND = exports["GLP_ECOND"] = 0x03, /* ill-conditioned matrix */
    /** @const */GLP_EBOUND = exports["GLP_EBOUND"] = 0x04, /* invalid bounds */
    /** @const */GLP_EFAIL = exports["GLP_EFAIL"] = 0x05, /* solver failed */
    /** @const */GLP_EOBJLL = exports["GLP_EOBJLL"] = 0x06, /* objective lower limit reached */
    /** @const */GLP_EOBJUL = exports["GLP_EOBJUL"] = 0x07, /* objective upper limit reached */
    /** @const */GLP_EITLIM = exports["GLP_EITLIM"] = 0x08, /* iteration limit exceeded */
    /** @const */GLP_ETMLIM = exports["GLP_ETMLIM"] = 0x09, /* time limit exceeded */
    /** @const */GLP_ENOPFS = exports["GLP_ENOPFS"] = 0x0A, /* no primal feasible solution */
    /** @const */GLP_ENODFS = exports["GLP_ENODFS"] = 0x0B, /* no dual feasible solution */
    /** @const */GLP_EROOT = exports["GLP_EROOT"] = 0x0C, /* root LP optimum not provided */
    /** @const */GLP_ESTOP = exports["GLP_ESTOP"] = 0x0D, /* search terminated by application */
    /** @const */GLP_EMIPGAP = exports["GLP_EMIPGAP"] = 0x0E, /* relative mip gap tolerance reached */
    /** @const */GLP_ENOFEAS = exports["GLP_ENOFEAS"] = 0x0F, /* no primal/dual feasible solution */
    /** @const */GLP_ENOCVG = exports["GLP_ENOCVG"] = 0x10, /* no convergence */
    /** @const */GLP_EINSTAB = exports["GLP_EINSTAB"] = 0x11, /* numerical instability */
    /** @const */GLP_EDATA = exports["GLP_EDATA"] = 0x12, /* invalid data */
    /** @const */GLP_ERANGE = exports["GLP_ERANGE"] = 0x13, /* result out of range */

/* condition indicator: */
    /** @const */GLP_KKT_PE = exports["GLP_KKT_PE"] = 1, /* primal equalities */
    /** @const */GLP_KKT_PB = exports["GLP_KKT_PB"] = 2, /* primal bounds */
    /** @const */GLP_KKT_DE = exports["GLP_KKT_DE"] = 3, /* dual equalities */
    /** @const */GLP_KKT_DB = exports["GLP_KKT_DB"] = 4, /* dual bounds */
    /** @const */GLP_KKT_CS = exports["GLP_KKT_CS"] = 5, /* complementary slackness */

/* MPS file format: */
    /** @const */GLP_MPS_DECK = exports["GLP_MPS_DECK"] = 1, /* fixed (ancient) */
    /** @const */GLP_MPS_FILE = exports["GLP_MPS_FILE"] = 2, /* free (modern) */

/* assignment problem formulation: */
    /** @const */GLP_ASN_MIN = exports["GLP_ASN_MIN"] = 1, /* perfect matching (minimization) */
    /** @const */GLP_ASN_MAX = exports["GLP_ASN_MAX"] = 2, /* perfect matching (maximization) */
    /** @const */GLP_ASN_MMP = exports["GLP_ASN_MMP"] = 3, /* maximum matching */

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

