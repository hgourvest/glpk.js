const
    MPL_EOF = -1;

const
    A_BINARY       = 101,   /* something binary */
    A_CHECK        = 102,   /* check statement */
    A_CONSTRAINT   = 103,   /* model constraint */
    A_DISPLAY      = 104,   /* display statement */
    A_ELEMCON      = 105,   /* elemental constraint/objective */
    A_ELEMSET      = 106,   /* elemental set */
    A_ELEMVAR      = 107,   /* elemental variable */
    A_EXPRESSION   = 108,   /* expression */
    A_FOR          = 109,   /* for statement */
    A_FORMULA      = 110,   /* formula */
    A_INDEX        = 111,   /* dummy index */
    A_INPUT        = 112,   /* input table */
    A_INTEGER      = 113,   /* something integer */
    A_LOGICAL      = 114,   /* something logical */
    A_MAXIMIZE     = 115,   /* objective has to be maximized */
    A_MINIMIZE     = 116,   /* objective has to be minimized */
    A_NONE         = 117,   /* nothing */
    A_NUMERIC      = 118,   /* something numeric */
    A_OUTPUT       = 119,   /* output table */
    A_PARAMETER    = 120,   /* model parameter */
    A_PRINTF       = 121,   /* printf statement */
    A_SET          = 122,   /* model set */
    A_SOLVE        = 123,   /* solve statement */
    A_SYMBOLIC     = 124,   /* something symbolic */
    A_TABLE        = 125,   /* data table */
    A_TUPLE        = 126,   /* n-tuple */
    A_VARIABLE     = 127;   /* model variable */

const
    MAX_LENGTH = 100;
/* maximal length of any symbolic value (this includes symbolic names,
 numeric and string literals, and all symbolic values that may appear
 during the evaluation phase) */

const CONTEXT_SIZE = 60;
/* size of the context queue, in characters */

const OUTBUF_SIZE = 1024;
/* size of the output buffer, in characters */

const
    T_EOF          = 201,   /* end of file */
    T_NAME         = 202,   /* symbolic name (model section only) */
    T_SYMBOL       = 203,   /* symbol (data section only) */
    T_NUMBER       = 204,   /* numeric literal */
    T_STRING       = 205,   /* string literal */
    T_AND          = 206,   /* and && */
    T_BY           = 207,   /* by */
    T_CROSS        = 208,   /* cross */
    T_DIFF         = 209,   /* diff */
    T_DIV          = 210,   /* div */
    T_ELSE         = 211,   /* else */
    T_IF           = 212,   /* if */
    T_IN           = 213,   /* in */
    T_INFINITY     = 214,   /* Infinity */
    T_INTER        = 215,   /* inter */
    T_LESS         = 216,   /* less */
    T_MOD          = 217,   /* mod */
    T_NOT          = 218,   /* not ! */
    T_OR           = 219,   /* or || */
    T_SPTP         = 220,   /* s.t. */
    T_SYMDIFF      = 221,   /* symdiff */
    T_THEN         = 222,   /* then */
    T_UNION        = 223,   /* union */
    T_WITHIN       = 224,   /* within */
    T_PLUS         = 225,   /* + */
    T_MINUS        = 226,   /* - */
    T_ASTERISK     = 227,   /* * */
    T_SLASH        = 228,   /* / */
    T_POWER        = 229,   /* ^ ** */
    T_LT           = 230,   /* <  */
    T_LE           = 231,   /* <= */
    T_EQ           = 232,   /* = == */
    T_GE           = 233,   /* >= */
    T_GT           = 234,   /* >  */
    T_NE           = 235,   /* <> != */
    T_CONCAT       = 236,   /* & */
    T_BAR          = 237,   /* | */
    T_POINT        = 238,   /* . */
    T_COMMA        = 239,   /* , */
    T_COLON        = 240,   /* : */
    T_SEMICOLON    = 241,   /* ; */
    T_ASSIGN       = 242,   /* := */
    T_DOTS         = 243,   /* .. */
    T_LEFT         = 244,   /* ( */
    T_RIGHT        = 245,   /* ) */
    T_LBRACKET     = 246,   /* [ */
    T_RBRACKET     = 247,   /* ] */
    T_LBRACE       = 248,   /* { */
    T_RBRACE       = 249,   /* } */
    T_APPEND       = 250,   /* >> */
    T_TILDE        = 251,   /* ~ */
    T_INPUT        = 252;   /* <- */

            /* suffix specified: */
const
    DOT_NONE       = 0x00,  /* none     (means variable itself) */
    DOT_LB         = 0x01,  /* .lb      (lower bound) */
    DOT_UB         = 0x02,  /* .ub      (upper bound) */
    DOT_STATUS     = 0x03,  /* .status  (status) */
    DOT_VAL        = 0x04,  /* .val     (primal value) */
    DOT_DUAL       = 0x05;  /* .dual    (dual value) */

        /* operation code: */
const
    O_NUMBER       = 301,   /* take floating-point number */
    O_STRING       = 302,   /* take character string */
    O_INDEX        = 303,   /* take dummy index */
    O_MEMNUM       = 304,   /* take member of numeric parameter */
    O_MEMSYM       = 305,   /* take member of symbolic parameter */
    O_MEMSET       = 306,   /* take member of set */
    O_MEMVAR       = 307,   /* take member of variable */
    O_MEMCON       = 308,   /* take member of constraint */
    O_TUPLE        = 309,   /* make n-tuple */
    O_MAKE         = 310,   /* make elemental set of n-tuples */
    O_SLICE        = 311,   /* define domain block (dummy op) */
      /* 0-ary operations --------------------*/
    O_IRAND224     = 312,   /* pseudo-random in [0, 2^24-1] */
    O_UNIFORM01    = 313,   /* pseudo-random in [0, 1) */
    O_NORMAL01     = 314,   /* gaussian random, mu = 0, sigma = 1 */
    O_GMTIME       = 315,   /* current calendar time (UTC) */
        /* unary operations --------------------*/
    O_CVTNUM       = 316,   /* conversion to numeric */
    O_CVTSYM       = 317,   /* conversion to symbolic */
    O_CVTLOG       = 318,   /* conversion to logical */
    O_CVTTUP       = 319,   /* conversion to 1-tuple */
    O_CVTLFM       = 320,   /* conversion to linear form */
    O_PLUS         = 321,   /* unary plus */
    O_MINUS        = 322,   /* unary minus */
    O_NOT          = 323,   /* negation (logical "not") */
    O_ABS          = 324,   /* absolute value */
    O_CEIL         = 325,   /* round upward ("ceiling of x") */
    O_FLOOR        = 326,   /* round downward ("floor of x") */
    O_EXP          = 327,   /* base-e exponential */
    O_LOG          = 328,   /* natural logarithm */
    O_LOG10        = 329,   /* common (decimal) logarithm */
    O_SQRT         = 330,   /* square root */
    O_SIN          = 331,   /* trigonometric sine */
    O_COS          = 332,   /* trigonometric cosine */
    O_ATAN         = 333,   /* trigonometric arctangent */
    O_ROUND        = 334,   /* round to nearest integer */
    O_TRUNC        = 335,   /* truncate to nearest integer */
    O_CARD         = 336,   /* cardinality of set */
    O_LENGTH       = 337,   /* length of symbolic value */
        /* binary operations -------------------*/
    O_ADD          = 338,   /* addition */
    O_SUB          = 339,   /* subtraction */
    O_LESS         = 340,   /* non-negative subtraction */
    O_MUL          = 341,   /* multiplication */
    O_DIV          = 342,   /* division */
    O_IDIV         = 343,   /* quotient of exact division */
    O_MOD          = 344,   /* remainder of exact division */
    O_POWER        = 345,   /* exponentiation (raise to power) */
    O_ATAN2        = 346,   /* trigonometric arctangent */
    O_ROUND2       = 347,   /* round to n fractional digits */
    O_TRUNC2       = 348,   /* truncate to n fractional digits */
    O_UNIFORM      = 349,   /* pseudo-random in [a, b) */
    O_NORMAL       = 350,   /* gaussian random, given mu and sigma */
    O_CONCAT       = 351,   /* concatenation */
    O_LT           = 352,   /* comparison on 'less than' */
    O_LE           = 353,   /* comparison on 'not greater than' */
    O_EQ           = 354,   /* comparison on 'equal to' */
    O_GE           = 355,   /* comparison on 'not less than' */
    O_GT           = 356,   /* comparison on 'greater than' */
    O_NE           = 357,   /* comparison on 'not equal to' */
    O_AND          = 358,   /* conjunction (logical "and") */
    O_OR           = 359,   /* disjunction (logical "or") */
    O_UNION        = 360,   /* union */
    O_DIFF         = 361,   /* difference */
    O_SYMDIFF      = 362,   /* symmetric difference */
    O_INTER        = 363,   /* intersection */
    O_CROSS        = 364,   /* cross (Cartesian) product */
    O_IN           = 365,   /* test on 'x in Y' */
    O_NOTIN        = 366,   /* test on 'x not in Y' */
    O_WITHIN       = 367,   /* test on 'X within Y' */
    O_NOTWITHIN    = 368,   /* test on 'X not within Y' */
    O_SUBSTR       = 369,   /* substring */
    O_STR2TIME     = 370,   /* convert string to time */
    O_TIME2STR     = 371,   /* convert time to string */
        /* ternary operations ------------------*/
    O_DOTS         = 372,   /* build "arithmetic" set */
    O_FORK         = 373,   /* if-then-else */
    O_SUBSTR3      = 374,   /* substring */
        /* n-ary operations --------------------*/
    O_MIN          = 375,   /* minimal value (n-ary) */
    O_MAX          = 376,   /* maximal value (n-ary) */
        /* iterated operations -----------------*/
    O_SUM          = 377,   /* summation */
    O_PROD         = 378,   /* multiplication */
    O_MINIMUM      = 379,   /* minimum */
    O_MAXIMUM      = 380,   /* maximum */
    O_FORALL       = 381,   /* conjunction (A-quantification) */
    O_EXISTS       = 382,   /* disjunction (E-quantification) */
    O_SETOF        = 383,   /* compute elemental set */
    O_BUILD        = 384;   /* build elemental set */

    /**********************************************************************/
    /* * *                      SOLVER INTERFACE                      * * */
    /**********************************************************************/
const
    MPL_FR         = 401,   /* free (unbounded) */
    MPL_LO         = 402,   /* lower bound */
    MPL_UP         = 403,   /* upper bound */
    MPL_DB         = 404,   /* both lower and upper bounds */
    MPL_FX         = 405,   /* fixed */
    MPL_ST         = 411,   /* constraint */
    MPL_MIN        = 412,   /* objective (minimization) */
    MPL_MAX        = 413,   /* objective (maximization) */
    MPL_NUM        = 421,   /* continuous */
    MPL_INT        = 422,   /* integer */
    MPL_BIN        = 423;   /* binary */

function mpl_internal_create_operands(){
    return {index: {},par: {},set: {},var: {},con: {},arg: {},loop: {}};
}