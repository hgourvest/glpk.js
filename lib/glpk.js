/* library version numbers: */
var
    GLP_MAJOR_VERSION = exports["GLP_MAJOR_VERSION"] = 4,
    GLP_MINOR_VERSION = exports["GLP_MINOR_VERSION"] = 49,

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
    /** @const */GLP_ASN_MMP = exports["GLP_ASN_MMP"] = 3; /* maximum matching */
