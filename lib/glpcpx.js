function check_parm(func, parm){
    /* check control parameters */
    xassert(func != null);
    xassert(parm != null);
}

const CHAR_SET = "!\"#$%&()/,.;?@_`'{}|~";
/* characters, which may appear in symbolic names */

var glp_read_lp = exports.glp_read_lp = function(P, parm, callback){
    const
        T_EOF        = 0x00,  /* end of file */
        T_MINIMIZE   = 0x01,  /* keyword 'minimize' */
        T_MAXIMIZE   = 0x02,  /* keyword 'maximize' */
        T_SUBJECT_TO = 0x03,  /* keyword 'subject to' */
        T_BOUNDS     = 0x04,  /* keyword 'bounds' */
        T_GENERAL    = 0x05,  /* keyword 'general' */
        T_INTEGER    = 0x06,  /* keyword 'integer' */
        T_BINARY     = 0x07,  /* keyword 'binary' */
        T_END        = 0x08,  /* keyword 'end' */
        T_NAME       = 0x09,  /* symbolic name */
        T_NUMBER     = 0x0A,  /* numeric constant */
        T_PLUS       = 0x0B,  /* delimiter '+' */
        T_MINUS      = 0x0C,  /* delimiter '-' */
        T_COLON      = 0x0D,  /* delimiter ':' */
        T_LE         = 0x0E,  /* delimiter '<=' */
        T_GE         = 0x0F,  /* delimiter '>=' */
        T_EQ         = 0x10;  /* delimiter '=' */

    function error(csa, fmt){
        /* print error message and terminate processing */
        throw new Error(csa.count + ": " + fmt);
    }

    function warning(csa, fmt)
    {     /* print warning message and continue processing */
        xprintf(csa.count + ": warning: " + fmt);
    }

    function read_char(csa){
        /* read next character from input file */
        var c;
        xassert(csa.c != XEOF);
        if (csa.c == '\n') csa.count++;
        c = csa.callback();
        if (c < 0)
        {
            if (csa.c == '\n')
            {  csa.count--;
                c = XEOF;
            }
            else
            {  warning(csa, "missing final end of line");
                c = '\n';
            }
        }
        else if (c == '\n'){

        }
        else if (isspace(c))
            c = ' ';
        else if (iscntrl(c))
            error(csa, "invalid control character " + c.charCodeAt(0));
        csa.c = c;
    }

    function add_char(csa){
        /* append current character to current token */
        csa.image += csa.c;
        read_char(csa);
    }

    function the_same(s1, s2)
    {
        /* compare two character strings ignoring case sensitivity */
        return (s1.toLowerCase() == s2.toLowerCase())?1:0;
    }

    function scan_token(csa){
        /* scan next token */
        var flag;
        csa.token = -1;
        csa.image = "";
        csa.value = 0.0;


        function name(){  /* symbolic name */
            csa.token = T_NAME;
            while (isalnum(csa.c) || strchr(CHAR_SET, csa.c) >= 0)
                add_char(csa);
            if (flag)
            {  /* check for keyword */
                if (the_same(csa.image, "minimize"))
                    csa.token = T_MINIMIZE;
                else if (the_same(csa.image, "minimum"))
                    csa.token = T_MINIMIZE;
                else if (the_same(csa.image, "min"))
                    csa.token = T_MINIMIZE;
                else if (the_same(csa.image, "maximize"))
                    csa.token = T_MAXIMIZE;
                else if (the_same(csa.image, "maximum"))
                    csa.token = T_MAXIMIZE;
                else if (the_same(csa.image, "max"))
                    csa.token = T_MAXIMIZE;
                else if (the_same(csa.image, "subject"))
                {  if (csa.c == ' ')
                {  read_char(csa);
                    if (tolower(csa.c) == 't')
                    {  csa.token = T_SUBJECT_TO;
                        csa.image += ' ';
                        add_char(csa);
                        if (tolower(csa.c) != 'o')
                            error(csa, "keyword `subject to' incomplete");
                        add_char(csa);
                        if (isalpha(csa.c))
                            error(csa, "keyword `" + csa.image + csa.c + "...' not recognized");
                    }
                }
                }
                else if (the_same(csa.image, "such"))
                {  if (csa.c == ' ')
                {  read_char(csa);
                    if (tolower(csa.c) == 't')
                    {  csa.token = T_SUBJECT_TO;
                        csa.image += ' ';
                        add_char(csa);
                        if (tolower(csa.c) != 'h')
                            error(csa, "keyword `such that' incomplete");
                        add_char(csa);
                        if (tolower(csa.c) != 'a')
                            error(csa, "keyword `such that' incomplete");
                        add_char(csa);
                        if (tolower(csa.c) != 't')
                            error(csa, "keyword `such that' incomplete");
                        add_char(csa);
                        if (isalpha(csa.c))
                            error(csa, "keyword `" + csa.image + csa.c + "...' not recognized");
                    }
                }
                }
                else if (the_same(csa.image, "st"))
                    csa.token = T_SUBJECT_TO;
                else if (the_same(csa.image, "s.t."))
                    csa.token = T_SUBJECT_TO;
                else if (the_same(csa.image, "st."))
                    csa.token = T_SUBJECT_TO;
                else if (the_same(csa.image, "bounds"))
                    csa.token = T_BOUNDS;
                else if (the_same(csa.image, "bound"))
                    csa.token = T_BOUNDS;
                else if (the_same(csa.image, "general"))
                    csa.token = T_GENERAL;
                else if (the_same(csa.image, "generals"))
                    csa.token = T_GENERAL;
                else if (the_same(csa.image, "gen"))
                    csa.token = T_GENERAL;
                else if (the_same(csa.image, "integer"))
                    csa.token = T_INTEGER;
                else if (the_same(csa.image, "integers"))
                    csa.token = T_INTEGER;
                else if (the_same(csa.image, "int"))
                    csa.token = T_INTEGER;
                else if (the_same(csa.image, "binary"))
                    csa.token = T_BINARY;
                else if (the_same(csa.image, "binaries"))
                    csa.token = T_BINARY;
                else if (the_same(csa.image, "bin"))
                    csa.token = T_BINARY;
                else if (the_same(csa.image, "end"))
                    csa.token = T_END;
            }
        }

        while (true){
            flag = 0;
            /* skip non-significant characters */
            while (csa.c == ' ') read_char(csa);
            /* recognize and scan current token */
            if (csa.c == XEOF)
                csa.token = T_EOF;
            else if (csa.c == '\n')
            {  read_char(csa);
                /* if the next character is letter, it may begin a keyword */
                if (isalpha(csa.c))
                {  flag = 1;
                    name();
                } else
                    continue;
            }
            else if (csa.c == '\\')
            {  /* comment; ignore everything until end-of-line */
                while (csa.c != '\n') read_char(csa);
                continue;
            }
            else if (isalpha(csa.c) || csa.c != '.' && strchr(CHAR_SET, csa.c) >= 0){
                name();

            }
            else if (isdigit(csa.c) || csa.c == '.')
            {  /* numeric constant */
                csa.token = T_NUMBER;
                /* scan integer part */
                while (isdigit(csa.c)) add_char(csa);
                /* scan optional fractional part (it is mandatory, if there is
                 no integer part) */
                if (csa.c == '.')
                {  add_char(csa);
                    if (csa.image.length == 1 && !isdigit(csa.c))
                        error(csa, "invalid use of decimal point");
                    while (isdigit(csa.c)) add_char(csa);
                }
                /* scan optional decimal exponent */
                if (csa.c == 'e' || csa.c == 'E')
                {  add_char(csa);
                    if (csa.c == '+' || csa.c == '-') add_char(csa);
                    if (!isdigit(csa.c))
                        error(csa, "numeric constant `" + csa.image + "' incomplete");
                    while (isdigit(csa.c)) add_char(csa);
                }
                /* convert the numeric constant to floating-point */
                csa.value = Number(csa.image);
                if (csa.value == Number.NaN)
                    error(csa, "numeric constant `" + csa.image + "' out of range");
            }
            else if (csa.c == '+'){
                csa.token = T_PLUS; add_char(csa);
            }
            else if (csa.c == '-'){
                csa.token = T_MINUS; add_char(csa);
            }
            else if (csa.c == ':'){
                csa.token = T_COLON; add_char(csa);
            }
            else if (csa.c == '<')
            {  csa.token = T_LE; add_char(csa);
                if (csa.c == '=') add_char(csa);
            }
            else if (csa.c == '>')
            {  csa.token = T_GE; add_char(csa);
                if (csa.c == '=') add_char(csa);
            }
            else if (csa.c == '=')
            {  csa.token = T_EQ; add_char(csa);
                if (csa.c == '<'){
                    csa.token = T_LE; add_char(csa);
                }
                else if (csa.c == '>'){
                    csa.token = T_GE; add_char(csa);
                }
            }
            else
                error(csa, "character `" + csa.c + "' not recognized");
            break
        }

        /* skip non-significant characters */
        while (csa.c == ' ') read_char(csa);
    }

    function find_col(csa, name){
        /* find column by its symbolic name */
        var j = glp_find_col(csa.P, name);
        if (j == 0)
        {  /* not found; create new column */
            j = glp_add_cols(csa.P, 1);
            glp_set_col_name(csa.P, j, name);
            /* enlarge working arrays, if necessary */
            if (csa.n_max < j)
            {  var n_max = csa.n_max;
                var ind = csa.ind;
                var val = csa.val;
                var flag = csa.flag;
                var lb = csa.lb;
                var ub = csa.ub;
                csa.n_max += csa.n_max;
                csa.ind = new Array(1+csa.n_max);
                xcopyArr(csa.ind, 1, ind, 1, n_max);
                csa.val = new Array(1+csa.n_max);
                xcopyArr(csa.val, 1, val, 1, n_max);
                csa.flag = new Array(1+csa.n_max);
                xfillArr(csa.flag, 1, 0, csa.n_max);
                xcopyArr(csa.flag, 1, flag, 1, n_max);
                csa.lb = new Array(1+csa.n_max);
                xcopyArr(csa.lb, 1, lb, 1, n_max);
                csa.ub = new Array(1+csa.n_max);
                xcopyArr(csa.ub, 1, ub, 1, n_max);
            }
            csa.lb[j] = +DBL_MAX; csa.ub[j] = -DBL_MAX;
        }
        return j;
    }

    function parse_linear_form(csa){
        var j, k, len = 0, newlen;
        var s, coef;

        while(true){
            /* parse an optional sign */
            if (csa.token == T_PLUS){
                s = +1.0; scan_token(csa);
            }
            else if (csa.token == T_MINUS){
                s = -1.0; scan_token(csa);
            }
            else
                s = +1.0;
            /* parse an optional coefficient */
            if (csa.token == T_NUMBER){
                coef = csa.value; scan_token(csa);
            }
            else
                coef = 1.0;
            /* parse a variable name */
            if (csa.token != T_NAME)
                error(csa, "missing variable name");
            /* find the corresponding column */
            j = find_col(csa, csa.image);
            /* check if the variable is already used in the linear form */
            if (csa.flag[j])
                error(csa, "multiple use of variable `" + csa.image + "' not allowed");
            /* add new term to the linear form */
            len++; csa.ind[len] = j; csa.val[len] = s * coef;
            /* and mark that the variable is used in the linear form */
            csa.flag[j] = 1;
            scan_token(csa);
            /* if the next token is a sign, there is another term */
            if (csa.token == T_PLUS || csa.token == T_MINUS) continue;
            /* clear marks of the variables used in the linear form */
            for (k = 1; k <= len; k++) csa.flag[csa.ind[k]] = 0;
            /* remove zero coefficients */
            newlen = 0;
            for (k = 1; k <= len; k++)
            {  if (csa.val[k] != 0.0)
            {  newlen++;
                csa.ind[newlen] = csa.ind[k];
                csa.val[newlen] = csa.val[k];
            }
            }
            break;
        }
        return newlen;
    }

    function parse_objective(csa){
        /* parse objective sense */
        var k, len;
        /* parse the keyword 'minimize' or 'maximize' */
        if (csa.token == T_MINIMIZE)
            glp_set_obj_dir(csa.P, GLP_MIN);
        else if (csa.token == T_MAXIMIZE)
            glp_set_obj_dir(csa.P, GLP_MAX);
        else
            xassert(csa != csa);
        scan_token(csa);
        /* parse objective name */
        if (csa.token == T_NAME && csa.c == ':')
        {  /* objective name is followed by a colon */
            glp_set_obj_name(csa.P, csa.image);
            scan_token(csa);
            xassert(csa.token == T_COLON);
            scan_token(csa);
        }
        else
        {  /* objective name is not specified; use default */
            glp_set_obj_name(csa.P, "obj");
        }
        /* parse linear form */
        len = parse_linear_form(csa);
        for (k = 1; k <= len; k++)
            glp_set_obj_coef(csa.P, csa.ind[k], csa.val[k]);
    }

    function parse_constraints(csa){
        var i, len, type;
        var s;
        /* parse the keyword 'subject to' */
        xassert(csa.token == T_SUBJECT_TO);
        scan_token(csa);

        while (true){
            /* create new row (constraint) */
            i = glp_add_rows(csa.P, 1);
            /* parse row name */
            if (csa.token == T_NAME && csa.c == ':')
            {  /* row name is followed by a colon */
                if (glp_find_row(csa.P, csa.image) != 0)
                    error(csa, "constraint `" + csa.image + "' multiply defined");
                glp_set_row_name(csa.P, i, csa.image);
                scan_token(csa);
                xassert(csa.token == T_COLON);
                scan_token(csa);
            }
            else
            {  /* row name is not specified; use default */
                glp_set_row_name(csa.P, i, "r." + csa.count);
            }
            /* parse linear form */
            len = parse_linear_form(csa);
            glp_set_mat_row(csa.P, i, len, csa.ind, csa.val);
            /* parse constraint sense */
            if (csa.token == T_LE){
                type = GLP_UP; scan_token(csa);
            }
            else if (csa.token == T_GE){
                type = GLP_LO; scan_token(csa);
            }
            else if (csa.token == T_EQ){
                type = GLP_FX; scan_token(csa);
            }
            else
                error(csa, "missing constraint sense");
            /* parse right-hand side */
            if (csa.token == T_PLUS){
                s = +1.0; scan_token(csa);
            }
            else if (csa.token == T_MINUS){
                s = -1.0; scan_token(csa);
            }
            else
                s = +1.0;
            if (csa.token != T_NUMBER)
                error(csa, "missing right-hand side");
            glp_set_row_bnds(csa.P, i, type, s * csa.value, s * csa.value);
            /* the rest of the current line must be empty */
            if (!(csa.c == '\n' || csa.c == XEOF))
                error(csa, "invalid symbol(s) beyond right-hand side");
            scan_token(csa);
            /* if the next token is a sign, numeric constant, or a symbolic
             name, here is another constraint */
            if (csa.token == T_PLUS || csa.token == T_MINUS ||
                csa.token == T_NUMBER || csa.token == T_NAME) continue;
            break;
        }
    }

    function set_lower_bound(csa, j, lb){
        /* set lower bound of j-th variable */
        if (csa.lb[j] != +DBL_MAX)
        {
            warning(csa, "lower bound of variable `" + glp_get_col_name(csa.P, j) + "' redefined");
        }
        csa.lb[j] = lb;
    }

    function set_upper_bound(csa, j, ub){
        /* set upper bound of j-th variable */
        if (csa.ub[j] != -DBL_MAX)
        {
            warning(csa, "upper bound of variable `" + glp_get_col_name(csa.P, j) + "' redefined");
        }
        csa.ub[j] = ub;
    }

    function parse_bounds(csa){
        var j, lb_flag;
        var lb, s;
        /* parse the keyword 'bounds' */
        xassert(csa.token == T_BOUNDS);
        scan_token(csa);

        while (true){
            /* bound definition can start with a sign, numeric constant, or
             a symbolic name */
            if (!(csa.token == T_PLUS || csa.token == T_MINUS ||
                csa.token == T_NUMBER || csa.token == T_NAME)) return;
            /* parse bound definition */
            if (csa.token == T_PLUS || csa.token == T_MINUS)
            {  /* parse signed lower bound */
                lb_flag = 1;
                s = (csa.token == T_PLUS ? +1.0 : -1.0);
                scan_token(csa);
                if (csa.token == T_NUMBER){
                    lb = s * csa.value; scan_token(csa);
                }
                else if (the_same(csa.image, "infinity") ||
                    the_same(csa.image, "inf"))
                {  if (s > 0.0)
                    error(csa, "invalid use of `+inf' as lower bound");
                    lb = -DBL_MAX; scan_token(csa);
                }
                else
                    error(csa, "missing lower bound");
            }
            else if (csa.token == T_NUMBER)
            {  /* parse unsigned lower bound */
                lb_flag = 1;
                lb = csa.value; scan_token(csa);
            }
            else
            {  /* lower bound is not specified */
                lb_flag = 0;
            }
            /* parse the token that should follow the lower bound */
            if (lb_flag)
            {  if (csa.token != T_LE)
                error(csa, "missing `<', `<=', or `=<' after lower bound");
                scan_token(csa);
            }
            /* parse variable name */
            if (csa.token != T_NAME)
                error(csa, "missing variable name");
            j = find_col(csa, csa.image);
            /* set lower bound */
            if (lb_flag) set_lower_bound(csa, j, lb);
            scan_token(csa);
            /* parse the context that follows the variable name */
            if (csa.token == T_LE)
            {  /* parse upper bound */
                scan_token(csa);
                if (csa.token == T_PLUS || csa.token == T_MINUS)
                {  /* parse signed upper bound */
                    s = (csa.token == T_PLUS ? +1.0 : -1.0);
                    scan_token(csa);
                    if (csa.token == T_NUMBER)
                    {  set_upper_bound(csa, j, s * csa.value);
                        scan_token(csa);
                    }
                    else if (the_same(csa.image, "infinity") ||
                        the_same(csa.image, "inf"))
                    {  if (s < 0.0)
                        error(csa, "invalid use of `-inf' as upper bound");
                        set_upper_bound(csa, j, +DBL_MAX);
                        scan_token(csa);
                    }
                    else
                        error(csa, "missing upper bound");
                }
                else if (csa.token == T_NUMBER)
                {  /* parse unsigned upper bound */
                    set_upper_bound(csa, j, csa.value);
                    scan_token(csa);
                }
                else
                    error(csa, "missing upper bound");
            }
            else if (csa.token == T_GE)
            {  /* parse lower bound */
                if (lb_flag)
                {  /* the context '... <= x >= ...' is invalid */
                    error(csa, "invalid bound definition");
                }
                scan_token(csa);
                if (csa.token == T_PLUS || csa.token == T_MINUS)
                {  /* parse signed lower bound */
                    s = (csa.token == T_PLUS ? +1.0 : -1.0);
                    scan_token(csa);
                    if (csa.token == T_NUMBER)
                    {  set_lower_bound(csa, j, s * csa.value);
                        scan_token(csa);
                    }
                    else if (the_same(csa.image, "infinity") ||
                        the_same(csa.image, "inf") == 0)
                    {  if (s > 0.0)
                        error(csa, "invalid use of `+inf' as lower bound");
                        set_lower_bound(csa, j, -DBL_MAX);
                        scan_token(csa);
                    }
                    else
                        error(csa, "missing lower bound");
                }
                else if (csa.token == T_NUMBER)
                {  /* parse unsigned lower bound */
                    set_lower_bound(csa, j, csa.value);
                    scan_token(csa);
                }
                else
                    error(csa, "missing lower bound");
            }
            else if (csa.token == T_EQ)
            {  /* parse fixed value */
                if (lb_flag)
                {  /* the context '... <= x = ...' is invalid */
                    error(csa, "invalid bound definition");
                }
                scan_token(csa);
                if (csa.token == T_PLUS || csa.token == T_MINUS)
                {  /* parse signed fixed value */
                    s = (csa.token == T_PLUS ? +1.0 : -1.0);
                    scan_token(csa);
                    if (csa.token == T_NUMBER)
                    {  set_lower_bound(csa, j, s * csa.value);
                        set_upper_bound(csa, j, s * csa.value);
                        scan_token(csa);
                    }
                    else
                        error(csa, "missing fixed value");
                }
                else if (csa.token == T_NUMBER)
                {  /* parse unsigned fixed value */
                    set_lower_bound(csa, j, csa.value);
                    set_upper_bound(csa, j, csa.value);
                    scan_token(csa);
                }
                else
                    error(csa, "missing fixed value");
            }
            else if (the_same(csa.image, "free"))
            {  /* parse the keyword 'free' */
                if (lb_flag)
                {  /* the context '... <= x free ...' is invalid */
                    error(csa, "invalid bound definition");
                }
                set_lower_bound(csa, j, -DBL_MAX);
                set_upper_bound(csa, j, +DBL_MAX);
                scan_token(csa);
            }
            else if (!lb_flag)
            {  /* neither lower nor upper bounds are specified */
                error(csa, "invalid bound definition");
            }
        }
    }

    function parse_integer(csa){
        var j, binary;
        /* parse the keyword 'general', 'integer', or 'binary' */
        if (csa.token == T_GENERAL){
            binary = 0; scan_token(csa);
        }
        else if (csa.token == T_INTEGER){
            binary = 0; scan_token(csa);
        }
        else if (csa.token == T_BINARY){
            binary = 1; scan_token(csa);
        }
        else
            xassert(csa != csa);
        /* parse list of variables (may be empty) */
        while (csa.token == T_NAME)
        {  /* find the corresponding column */
            j = find_col(csa, csa.image);
            /* change kind of the variable */
            glp_set_col_kind(csa.P, j, GLP_IV);
            /* set 0-1 bounds for the binary variable */
            if (binary)
            {  set_lower_bound(csa, j, 0.0);
                set_upper_bound(csa, j, 1.0);
            }
            scan_token(csa);
        }
    }

    /* read problem data in CPLEX LP format */
    var csa = {};
    var ret;
    xprintf("Reading problem data");
    if (parm == null){
        parm = {};
    }
    /* check control parameters */
    check_parm("glp_read_lp", parm);
    /* initialize common storage area */
    csa.P = P;
    csa.parm = parm;
    csa.callback = callback;
    csa.count = 0;
    csa.c = '\n';
    csa.token = T_EOF;
    csa.image = "";
    csa.value = 0.0;
    csa.n_max = 100;
    csa.ind = new Array(1+csa.n_max);
    csa.val = new Array(1+csa.n_max);
    csa.flag = new Array(1+csa.n_max);
    xfillArr(csa.flag, 1, 0, csa.n_max);
    csa.lb = new Array(1+csa.n_max);
    csa.ub = new Array(1+csa.n_max);
    /* erase problem object */
    glp_erase_prob(P);
    glp_create_index(P);
    /* scan very first token */
    scan_token(csa);
    /* parse definition of the objective function */
    if (!(csa.token == T_MINIMIZE || csa.token == T_MAXIMIZE))
        error(csa, "`minimize' or `maximize' keyword missing");
    parse_objective(csa);
    /* parse constraints section */
    if (csa.token != T_SUBJECT_TO)
        error(csa, "constraints section missing");
    parse_constraints(csa);
    /* parse optional bounds section */
    if (csa.token == T_BOUNDS) parse_bounds(csa);
    /* parse optional general, integer, and binary sections */
    while (csa.token == T_GENERAL ||
        csa.token == T_INTEGER ||
        csa.token == T_BINARY) parse_integer(csa);
    /* check for the keyword 'end' */
    if (csa.token == T_END)
        scan_token(csa);
    else if (csa.token == T_EOF)
        warning(csa, "keyword `end' missing");
    else
        error(csa, "symbol " + csa.image + " in wrong position");
    /* nothing must follow the keyword 'end' (except comments) */
    if (csa.token != T_EOF)
        error(csa, "extra symbol(s) detected beyond `end'");
    /* set bounds of variables */
    {  var j, type;
        var lb, ub;
        for (j = 1; j <= P.n; j++)
        {  lb = csa.lb[j];
            ub = csa.ub[j];
            if (lb == +DBL_MAX) lb = 0.0;      /* default lb */
            if (ub == -DBL_MAX) ub = +DBL_MAX; /* default ub */
            if (lb == -DBL_MAX && ub == +DBL_MAX)
                type = GLP_FR;
            else if (ub == +DBL_MAX)
                type = GLP_LO;
            else if (lb == -DBL_MAX)
                type = GLP_UP;
            else if (lb != ub)
                type = GLP_DB;
            else
                type = GLP_FX;
            glp_set_col_bnds(csa.P, j, type, lb, ub);
        }
    }
    /* print some statistics */
    xprintf(P.m + " row" + (P.m == 1 ? "" : "s") + ", " + P.n + " column" + (P.n == 1 ? "" : "s") + ", " + P.nnz + " non-zero" + (P.nnz == 1 ? "" : "s"));
    if (glp_get_num_int(P) > 0)
    {  var ni = glp_get_num_int(P);
        var nb = glp_get_num_bin(P);
        if (ni == 1)
        {  if (nb == 0)
            xprintf("One variable is integer");
        else
            xprintf("One variable is binary");
        }
        else
        {   var line = ni + " integer variables, ";
            if (nb == 0)
                line += "none";
            else if (nb == 1)
                line += "one";
            else if (nb == ni)
                line += "all";
            else
                line += nb;
            xprintf(line + " of which " + (nb == 1 ? "is" : "are") + " binary");
        }
    }
    xprintf(csa.count + " lines were read");
    /* problem data has been successfully read */
    glp_delete_index(P);
    glp_sort_matrix(P);
    ret = 0;

    function done(){
        if (ret != 0) glp_erase_prob(P);
        return ret;
    }
    return done();
};

var glp_write_lp = exports.glp_write_lp = function(P, parm, callback){

    function check_name(name){
        /* check if specified name is valid for CPLEX LP format */
        if (name[0] == '.') return 1;
        if (isdigit((name[0]))) return 1;
        for (var i = 0; i < name.length; i++)
        {  if (!isalnum(name[i]) &&
            strchr(CHAR_SET, name[i]) < 0) return 1;
        }
        return 0; /* name is ok */
    }

    function adjust_name(name){
        /* attempt to adjust specified name to make it valid for CPLEX LP format */
        for (var i = 0; i < name.length; i++)
        {  if (name[i] == ' ')
            name[i] = '_';
        else if (name[i] == '-')
            name[i] = '~';
        else if (name[i] == '[')
            name[i] = '(';
        else if (name[i] == ']')
            name[i] = ')';
        }
    }

    function row_name(csa, i){
        /* construct symbolic name of i-th row (constraint) */
        var name;
        if (i == 0)
            name = glp_get_obj_name(csa.P);
        else
            name = glp_get_row_name(csa.P, i);
        if (name == null) return fake();
        adjust_name(name);
        if (check_name(name)) return fake();
        return name;

        function fake(){
            if (i == 0)
                return "obj";
            else
                return "r_" + i;
        }
    }

    function col_name(csa, j){
        /* construct symbolic name of j-th column (variable) */
        var name = glp_get_col_name(csa.P, j);
        if (name == null) return fake();
        adjust_name(name);
        if (check_name(name)) return fake();
        return name;
        function fake(){
            return "x_" + j;
        }
    }

    /* write problem data in CPLEX LP format */
    var csa = {};
    var row;
    var col;
    var aij;
    var i, j, len, flag, count, ret;
    var line, term, name;
    xprintf("Writing problem data");
    if (parm == null){
        parm = {};
    }
    /* check control parameters */
    check_parm("glp_write_lp", parm);
    /* initialize common storage area */
    csa.P = P;
    csa.parm = parm;
    count = 0;
    /* write problem name */
    callback("\\* Problem: " + (P.name == null ? "Unknown" : P.name) + " *\\"); count++;
    callback(""); count++;
    /* the problem should contain at least one row and one column */
    if (!(P.m > 0 && P.n > 0))
    {  xprintf("Warning: problem has no rows/columns");
        callback("\\* WARNING: PROBLEM HAS NO ROWS/COLUMNS *\\"); count++;
        callback(""); count++;
        return skip();
    }
    /* write the objective function definition */
    if (P.dir == GLP_MIN){
        callback("Minimize"); count++;
    }
    else if (P.dir == GLP_MAX){
        callback("Maximize"); count++;
    }
    else
        xassert(P != P);
    name = row_name(csa, 0);
    line = " " + name + ":";
    len = 0;
    for (j = 1; j <= P.n; j++)
    {  col = P.col[j];
        if (col.coef != 0.0 || col.ptr == null)
        {  len++;
            name = col_name(csa, j);
            if (col.coef == 0.0)
                term = " + 0 " + name; /* empty column */
            else if (col.coef == +1.0)
                term = " + " + name;
            else if (col.coef == -1.0)
                term = " - " + name;
            else if (col.coef > 0.0)
                term = " + " + col.coef + " " + name;
            else
                term = " - " + (-col.coef) + " " + name;
            if (line.length + term.length > 72){
                callback(line); line = ""; count++;
            }

            line += term;
        }
    }
    if (len == 0)
    {  /* empty objective */
        term = " 0 " + col_name(csa, 1);
        line += term;
    }
    callback(line); count++;
    if (P.c0 != 0.0){
        callback("\\* constant term = " + P.c0 + " *\\"); count++;
    }

    callback(""); count++;
    /* write the constraints section */
    callback("Subject To"); count++;
    for (i = 1; i <= P.m; i++)
    {  row = P.row[i];
        if (row.type == GLP_FR) continue; /* skip free row */
        name = row_name(csa, i);
        line = " " + name + ":";
        /* linear form */
        for (aij = row.ptr; aij != null; aij = aij.r_next)
        {  name = col_name(csa, aij.col.j);
            if (aij.val == +1.0)
                term =  " + " + name;
            else if (aij.val == -1.0)
                term = " - " + name;
            else if (aij.val > 0.0)
                term = " + " + aij.val + " "  + name;
            else
                term = " - " + (-aij.val) + " " + name;
            if (line.length + term.length > 72){
                callback(line); line = ""; count++;
            }

            line += term;
        }
        if (row.type == GLP_DB)
        {  /* double-bounded (ranged) constraint */
            term = " - ~r_" + i;
            if (line.length + term.length > 72){
                callback(line); line = ""; count++;
            }
            line += term;
        }
        else if (row.ptr == null)
        {  /* empty constraint */
            term = " 0 " + col_name(csa, 1);
            line += term;
        }
        /* right hand-side */
        if (row.type == GLP_LO)
            term = " >= " + row.lb;
        else if (row.type == GLP_UP)
            term = " <= " + row.ub;
        else if (row.type == GLP_DB || row.type == GLP_FX)
            term = " = " + row.lb;
        else
            xassert(row != row);
        if (line.length + term.length > 72){
            callback(line); line = ""; count++;
        }
        line += term;
        callback(line); count++;
    }
    callback(""); count++;
    /* write the bounds section */
    flag = 0;
    for (i = 1; i <= P.m; i++)
    {  row = P.row[i];
        if (row.type != GLP_DB) continue;
        if (!flag){
            callback("Bounds"); flag = 1; count++;
        }

        callback(" 0 <= ~r_" + i + " <= " + (row.ub - row.lb)); count++;
    }
    for (j = 1; j <= P.n; j++)
    {  col = P.col[j];
        if (col.type == GLP_LO && col.lb == 0.0) continue;
        if (!flag){
            callback("Bounds"); flag = 1; count++;
        }
        name = col_name(csa, j);
        if (col.type == GLP_FR){
            callback(" " + name + " free"); count++;
        }
        else if (col.type == GLP_LO){
            callback(" " + name + " >= " + col.lb); count++;
        }
        else if (col.type == GLP_UP){
            callback(" -Inf <= " + name + " <= " + col.ub); count++;
        }
        else if (col.type == GLP_DB){
            callback(" " + col.lb + " <= " + name + " <= " + col.ub); count++;
        }
        else if (col.type == GLP_FX){
            callback(" " + name + " = " + col.lb); count++;
        }
        else
            xassert(col != col);
    }
    if (flag) callback(""); count++;
    /* write the integer section */
    flag = 0;
    for (j = 1; j <= P.n; j++)
    {  col = P.col[j];
        if (col.kind == GLP_CV) continue;
        xassert(col.kind == GLP_IV);
        if (!flag){
            callback("Generals"); flag = 1; count++;
        }

        callback(" " + col_name(csa, j)); count++;
    }
    if (flag) {callback(""); count++}

    function skip(){
        /* write the end keyword */
        callback("End"); count++;
        /* problem data has been successfully written */
        xprintf(count + " lines were written");
        return 0;
    }
    return skip();
};

var glp_read_lp_from_string = exports.glp_read_lp_from_string = function(P, parm, str){
    var pos = 0;
    return glp_read_lp(P, parm,
        function(){
            if (pos < str.length){
                return str[pos++];
            } else
                return -1;
        }
    )
};
