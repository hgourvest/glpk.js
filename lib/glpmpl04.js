/* glpmpl04.c */

/**********************************************************************/
/* * *              GENERATING AND POSTSOLVING MODEL              * * */
/**********************************************************************/

function mpl_internal_alloc_content(mpl){
    var stmt;
    /* walk through all model statements */
    for (stmt = mpl.model; stmt != null; stmt = stmt.next)
    {  switch (stmt.type)
    {  case A_SET:
            /* model set */
            xassert(stmt.u.set.array == null);
            stmt.u.set.array = mpl_internal_create_array(mpl, A_ELEMSET,
                stmt.u.set.dim);
            break;
        case A_PARAMETER:
            /* model parameter */
            xassert(stmt.u.par.array == null);
            switch (stmt.u.par.type)
            {  case A_NUMERIC:
                case A_INTEGER:
                case A_BINARY:
                    stmt.u.par.array = mpl_internal_create_array(mpl, A_NUMERIC,
                        stmt.u.par.dim);
                    break;
                case A_SYMBOLIC:
                    stmt.u.par.array = mpl_internal_create_array(mpl, A_SYMBOLIC,
                        stmt.u.par.dim);
                    break;
                default:
                    xassert(stmt != stmt);
            }
            break;
        case A_VARIABLE:
            /* model variable */
            xassert(stmt.u.var.array == null);
            stmt.u.var.array = mpl_internal_create_array(mpl, A_ELEMVAR,
                stmt.u.var.dim);
            break;
        case A_CONSTRAINT:
            /* model constraint/objective */
            xassert(stmt.u.con.array == null);
            stmt.u.con.array = mpl_internal_create_array(mpl, A_ELEMCON,
                stmt.u.con.dim);
            break;
        case A_TABLE:
        case A_SOLVE:
        case A_CHECK:
        case A_DISPLAY:
        case A_PRINTF:
        case A_FOR:
            /* functional statements have no content array */
            break;
        default:
            xassert(stmt != stmt);
    }
    }
}

function mpl_internal_generate_model(mpl){
    var stmt;

    xassert(!mpl.flag_p);
    for (stmt = mpl.model; stmt != null; stmt = stmt.next)
    {   mpl_internal_execute_statement(mpl, stmt);
        if (mpl.stmt.type == A_SOLVE) break;
    }
    mpl.stmt = stmt;
}

function mpl_internal_build_problem(mpl){
    var stmt;

    var memb;
    var v;
    var c;
    var t;
    var i, j;
    xassert(mpl.m == 0);
    xassert(mpl.n == 0);
    xassert(mpl.row == null);
    xassert(mpl.col == null);
    /* check that all elemental variables has zero column numbers */
    for (stmt = mpl.model; stmt != null; stmt = stmt.next)
    {  if (stmt.type == A_VARIABLE)
    {  v = stmt.u.var;
        for (memb = v.array.head; memb != null; memb = memb.next)
            xassert(memb.value.var.j == 0);
    }
    }
    /* assign row numbers to elemental constraints and objectives */
    for (stmt = mpl.model; stmt != null; stmt = stmt.next)
    {  if (stmt.type == A_CONSTRAINT)
    {  c = stmt.u.con;
        for (memb = c.array.head; memb != null; memb = memb.next)
        {  xassert(memb.value.con.i == 0);
            memb.value.con.i = ++mpl.m;
            /* walk through linear form and mark elemental variables,
             which are referenced at least once */
            for (t = memb.value.con.form; t != null; t = t.next)
            {  xassert(t.var != null);
                t.var.memb.value.var.j = -1;
            }
        }
    }
    }
    /* assign column numbers to marked elemental variables */
    for (stmt = mpl.model; stmt != null; stmt = stmt.next)
    {  if (stmt.type == A_VARIABLE)
    {  v = stmt.u.var;
        for (memb = v.array.head; memb != null; memb = memb.next)
            if (memb.value.var.j != 0) memb.value.var.j =
                ++mpl.n;
    }
    }
    /* build list of rows */
    mpl.row = new Array(1+mpl.m);
    for (i = 1; i <= mpl.m; i++) mpl.row[i] = null;
    for (stmt = mpl.model; stmt != null; stmt = stmt.next)
    {  if (stmt.type == A_CONSTRAINT)
    {  c = stmt.u.con;
        for (memb = c.array.head; memb != null; memb = memb.next)
        {  i = memb.value.con.i;
            xassert(1 <= i && i <= mpl.m);
            xassert(mpl.row[i] == null);
            mpl.row[i] = memb.value.con;
        }
    }
    }
    for (i = 1; i <= mpl.m; i++) xassert(mpl.row[i] != null);
    /* build list of columns */
    mpl.col = new Array(1+mpl.n);
    for (j = 1; j <= mpl.n; j++) mpl.col[j] = null;
    for (stmt = mpl.model; stmt != null; stmt = stmt.next)
    {  if (stmt.type == A_VARIABLE)
    {  v = stmt.u.var;
        for (memb = v.array.head; memb != null; memb = memb.next)
        {  j = memb.value.var.j;
            if (j == 0) continue;
            xassert(1 <= j && j <= mpl.n);
            xassert(mpl.col[j] == null);
            mpl.col[j] = memb.value.var;
        }
    }
    }
    for (j = 1; j <= mpl.n; j++) xassert(mpl.col[j] != null);
}

function mpl_internal_postsolve_model(mpl){
    var stmt;

    xassert(!mpl.flag_p);
    mpl.flag_p = 1;
    for (stmt = mpl.stmt; stmt != null; stmt = stmt.next)
        mpl_internal_execute_statement(mpl, stmt);
    mpl.stmt = null;
}

function mpl_internal_clean_model(mpl){
    var stmt;
    for (stmt = mpl.model; stmt != null; stmt = stmt.next)
        mpl_internal_clean_statement(mpl, stmt);
    /* check that all atoms have been returned to their pools
     if (Object.keys(mpl.strings).length != 0)
     error(mpl, "internal logic error: " + Object.keys(mpl.strings).length + " string segment(s) were lost");
     if (Object.keys(mpl.symbols).length != 0)
     error(mpl, "internal logic error: " + Object.keys(mpl.symbols).length + " symbol(s) were lost");
     if (Object.keys(mpl.tuples).length != 0)
     error(mpl, "internal logic error: " + Object.keys(mpl.tuples).length + " n-tuple component(s) were lost");
     if (Object.keys(mpl.arrays).length != 0)
     error(mpl, "internal logic error: " + Object.keys(mpl.arrays).length + " array(s) were lost");
     if (Object.keys(mpl.members).length != 0)
     error(mpl, "internal logic error: " + Object.keys(mpl.members).length + " array member(s) were lost");
     if (Object.keys(mpl.elemvars).length != 0)
     error(mpl, "internal logic error: " + Object.keys(mpl.elemvars).length + " elemental variable(s) were lost");
     if (Object.keys(mpl.formulae).length != 0)
     error(mpl, "internal logic error: " + Object.keys(mpl.formulae).length + " linear term(s) were lost");
     if (Object.keys(mpl.elemcons).length != 0)
     error(mpl, "internal logic error: " + Object.keys(mpl.elemcons).length + " elemental constraint(s) were lost");*/
}

/**********************************************************************/
/* * *                        INPUT/OUTPUT                        * * */
/**********************************************************************/

function mpl_internal_open_input(mpl, name, callback){
    mpl.line = 0;
    mpl.c = '\n';
    mpl.token = 0;
    mpl.imlen = 0;
    mpl.image = '';
    mpl.value = 0.0;
    mpl.b_token = T_EOF;
    mpl.b_imlen = 0;
    mpl.b_image = '';
    mpl.b_value = 0.0;
    mpl.f_dots = 0;
    mpl.f_scan = 0;
    mpl.f_token = 0;
    mpl.f_imlen = 0;
    mpl.f_image = '';
    mpl.f_value = 0.0;
    xfillArr(mpl.context, 0, ' ', CONTEXT_SIZE);
    mpl.c_ptr = 0;
    xassert(mpl.in_fp == null);
    mpl.in_fp = callback;
    mpl.in_file = name || 'input';
    /* scan the very first character */
    mpl_internal_get_char(mpl);
    /* scan the very first token */
    mpl_internal_get_token(mpl);
}

function mpl_internal_read_char(mpl){
    var c;
    xassert(mpl.in_fp != null);
    c = mpl.in_fp();
    if (c < 0)
    {
        c = MPL_EOF;
    }
    return c;
}

function mpl_internal_close_input(mpl){
    xassert(mpl.in_fp != null);
    mpl.in_fp = null;
}

function mpl_internal_open_output(mpl, name, callback){
    xassert(mpl.out_fp == null);
    if (callback == null)
    {
        mpl.out_fp = xprintf;
    }
    else
    {   mpl.out_fp = callback;
        if (mpl.out_fp == null)
            mpl_internal_error(mpl, "unable to use output callback");
        mpl.out_file = name;
    }
    mpl.flush = '';
}

function mpl_internal_write_char(mpl, c){
    xassert(mpl.out_fp != null);
    if (c == '\n'){
        mpl.out_fp(mpl.flush);
        mpl.flush = '';
    } else
        mpl.flush += c;
}

function mpl_internal_write_text(mpl, str){
    xassert(mpl.out_fp != null);
    mpl.out_fp(str);
}

function mpl_internal_flush_output(mpl){
    xassert(mpl.out_fp != null);
}

/**********************************************************************/
/* * *                      SOLVER INTERFACE                      * * */
/**********************************************************************/

function mpl_internal_error(mpl, msg){
    var str;
    switch (mpl.phase)
    {  case 1:
        case 2:
            /* translation phase */
            str = mpl.in_file + ":" + mpl.line + ": " + msg;
            mpl_internal_print_context(mpl);
            break;
        case 3:
            /* generation/postsolve phase */
            str = (mpl.stmt == null ? 0 : mpl.stmt.line) + ": " + msg;
            break;
        default:
            xassert(mpl != mpl);
    }
    mpl.phase = 4;
    throw new Error(msg);
}

function mpl_internal_warning(mpl, msg){
    switch (mpl.phase)
    {  case 1:
        case 2:
            /* translation phase */
            xprintf(mpl.in_file + ":" + mpl.line + ": warning: " + msg);
            break;
        case 3:
            /* generation/postsolve phase */
            xprintf(mpl.mod_file + ":" + (mpl.stmt == null ? 0 : mpl.stmt.line) + ": warning: " + msg);
            break;
        default:
            xassert(mpl != mpl);
    }
}

var mpl_initialize = exports.mpl_initialize = function(){
    var mpl = {};
    /* scanning segment */
    mpl.line = 0;
    mpl.c = 0;
    mpl.token = 0;
    mpl.imlen = 0;
    mpl.image = '';
    mpl.value = 0.0;
    mpl.b_token = 0;
    mpl.b_imlen = 0;
    mpl.b_image = '';
    mpl.b_value = 0.0;
    mpl.f_dots = 0;
    mpl.f_scan = 0;
    mpl.f_token = 0;
    mpl.f_imlen = 0;
    mpl.f_image = '';
    mpl.f_value = 0.0;
    mpl.context = new Array(CONTEXT_SIZE);
    xfillArr(mpl.context, 0, ' ', CONTEXT_SIZE);
    mpl.c_ptr = 0;
    mpl.flag_d = 0;
    /* translating segment */
    //mpl.pool = dmp_create_poolx(0);
    mpl.tree = {};
    mpl.model = null;
    mpl.flag_x = 0;
    mpl.as_within = 0;
    mpl.as_in = 0;
    mpl.as_binary = 0;
    mpl.flag_s = 0;
    /* common segment
     mpl.strings = {};
     mpl.symbols = {};
     mpl.tuples = {};
     mpl.arrays = {};
     mpl.members = {};
     mpl.elemvars = {};
     mpl.formulae = {};
     mpl.elemcons = {};*/
    mpl.a_list = null;
    mpl.sym_buf = '';
    mpl.tup_buf = '';

    /* generating/postsolving segment */
    mpl.rand = rng_create_rand();
    mpl.flag_p = 0;
    mpl.stmt = null;
    mpl.dca = null;
    mpl.m = 0;
    mpl.n = 0;
    mpl.row = null;
    mpl.col = null;
    /* input/output segment */
    mpl.in_fp = null;
    mpl.in_file = null;
    mpl.out_fp = null;
    mpl.out_file = null;
    mpl.prt_fp = null;
    mpl.prt_file = null;
    /* solver interface segment */
    mpl.phase = 0;
    mpl.mod_file = null;
    mpl.mpl_buf = '';
    return mpl;
};

var mpl_read_model = function(mpl, name, callback, skip_data){

    function skip(){
        xprintf(mpl.line + " line" + (mpl.line == 1 ? "" : "s") + " were read");
        mpl_internal_close_input(mpl);
        /* return to the calling program */
        return mpl.phase;
    }

    if (mpl.phase != 0)
        xerror("mpl_read_model: invalid call sequence");
    if (callback == null)
        xerror("mpl_read_model: no input specified");
    /* translate model section */
    mpl.phase = 1;
    xprintf("Reading model section from " + name + " ...");
    mpl_internal_open_input(mpl, name, callback);
    mpl_internal_model_section(mpl);
    if (mpl.model == null)
        mpl_internal_error(mpl, "empty model section not allowed");
    /* save name of the input text file containing model section for
     error diagnostics during the generation phase */
    mpl.mod_file = mpl.in_file;

    /* allocate content arrays for all model objects */
    mpl_internal_alloc_content(mpl);
    /* optional data section may begin with the keyword 'data' */
    if (mpl_internal_is_keyword(mpl, "data"))
    {  if (skip_data)
    {  mpl_internal_warning(mpl, "data section ignored");
        return skip();
    }
        mpl.flag_d = 1;
        mpl_internal_get_token(mpl /* data */);
        if (mpl.token != T_SEMICOLON)
            mpl_internal_error(mpl, "semicolon missing where expected");
        mpl_internal_get_token(mpl /* ; */);
        /* translate data section */
        mpl.phase = 2;
        xprintf("Reading data section from " + name + " ...");
        mpl_internal_data_section(mpl);
    }
    /* process end statement */
    mpl_internal_end_statement(mpl);
    return skip();
};

var mpl_read_data = function(mpl, name, callback){
    if (!(mpl.phase == 1 || mpl.phase == 2))
        xerror("mpl_read_data: invalid call sequence");
    if (callback == null)
        xerror("mpl_read_data: no input specified");
    /* process data section */
    mpl.phase = 2;
    xprintf("Reading data section from " + name + " ...");
    mpl.flag_d = 1;
    mpl_internal_open_input(mpl, name, callback);
    /* in this case the keyword 'data' is optional */
    if (mpl_internal_is_literal(mpl, "data"))
    {  mpl_internal_get_token(mpl /* data */);
        if (mpl.token != T_SEMICOLON)
            mpl_internal_error(mpl, "semicolon missing where expected");
        mpl_internal_get_token(mpl /* ; */);
    }
    mpl_internal_data_section(mpl);
    /* process end statement */
    mpl_internal_end_statement(mpl);
    xprintf(mpl.line + " line" + (mpl.line == 1 ? "" : "s") + " were read");
    mpl_internal_close_input(mpl);
    /* return to the calling program */
    return mpl.phase;
};

var mpl_generate = exports.mpl_generate = function(mpl, name, callback){
    if (!(mpl.phase == 1 || mpl.phase == 2))
        xerror("mpl_generate: invalid call sequence");
    /* generate model */
    mpl.phase = 3;
    mpl_internal_open_output(mpl, name, callback);
    mpl_internal_generate_model(mpl);
    mpl_internal_flush_output(mpl);
    /* build problem instance */
    mpl_internal_build_problem(mpl);
    /* generation phase has been finished */
    xprintf("Model has been successfully generated");
    /* return to the calling program */
    return mpl.phase;
};

var mpl_get_prob_name = exports.mpl_get_prob_name = function(mpl){
    return mpl.mod_file;
};

var mpl_get_num_rows = exports.mpl_get_num_rows = function(mpl){
    if (mpl.phase != 3)
        xerror("mpl_get_num_rows: invalid call sequence");
    return mpl.m;
};

var mpl_get_num_cols = exports.mpl_get_num_cols = function(mpl){
    if (mpl.phase != 3)
        xerror("mpl_get_num_cols: invalid call sequence");
    return mpl.n;
};

var mpl_get_row_name = exports.mpl_get_row_name = function(mpl, i){
    if (mpl.phase != 3)
        xerror("mpl_get_row_name: invalid call sequence");
    if (!(1 <= i && i <= mpl.m))
        xerror("mpl_get_row_name: i = " + i + "; row number out of range");
    var name = mpl.row[i].con.name;
    var len = name.length;
    xassert(len <= 255);
    name += mpl_internal_format_tuple(mpl, '[', mpl.row[i].memb.tuple).slice(0, 255);
    if (name.length == 255) name = name.slice(0,252) + '...';
    xassert(name.length <= 255);
    return name;
};

var mpl_get_row_kind = mpl_get_row_kind = function(mpl, i){
    var kind;
    if (mpl.phase != 3)
        xerror("mpl_get_row_kind: invalid call sequence");
    if (!(1 <= i && i <= mpl.m))
        xerror("mpl_get_row_kind: i = " + i + "; row number out of range");
    switch (mpl.row[i].con.type)
    {  case A_CONSTRAINT:
        kind = MPL_ST; break;
        case A_MINIMIZE:
            kind = MPL_MIN; break;
        case A_MAXIMIZE:
            kind = MPL_MAX; break;
        default:
            xassert(mpl != mpl);
    }
    return kind;
};

var mpl_get_row_bnds = exports.mpl_get_row_bnds = function(mpl, i, callback){
    var con;
    var type;
    var lb, ub;
    if (mpl.phase != 3)
        xerror("mpl_get_row_bnds: invalid call sequence");
    if (!(1 <= i && i <= mpl.m))
        xerror("mpl_get_row_bnds: i = " + i + "; row number out of range");
    con = mpl.row[i];
    lb = (con.con.lbnd == null ? -DBL_MAX : con.lbnd);
    ub = (con.con.ubnd == null ? +DBL_MAX : con.ubnd);
    if (lb == -DBL_MAX && ub == +DBL_MAX){
        type = MPL_FR; lb = ub = 0.0;
    }
    else if (ub == +DBL_MAX){
        type = MPL_LO; ub = 0.0;
    }
    else if (lb == -DBL_MAX){
        type = MPL_UP; lb = 0.0;
    }
    else if (con.con.lbnd != con.con.ubnd)
        type = MPL_DB;
    else
        type = MPL_FX;
    callback(lb, ub);
    return type;
};

var mpl_get_mat_row = exports.mpl_get_mat_row = function(mpl, i, ndx, val){
    var term;
    var len = 0;
    if (mpl.phase != 3)
        xerror("mpl_get_mat_row: invalid call sequence");
    if (!(1 <= i && i <= mpl.m))
        xerror("mpl_get_mat_row: i = " + i + "; row number out of range");
    for (term = mpl.row[i].form; term != null; term = term.next)
    {  xassert(term.var != null);
        len++;
        xassert(len <= mpl.n);
        if (ndx != null) ndx[len] = term.var.j;
        if (val != null) val[len] = term.coef;
    }
    return len;
};

var mpl_get_row_c0 = exports.mpl_get_row_c0 = function(mpl, i){
    var con;
    var c0;
    if (mpl.phase != 3)
        xerror("mpl_get_row_c0: invalid call sequence");
    if (!(1 <= i && i <= mpl.m))
        xerror("mpl_get_row_c0: i = " + i + "; row number out of range");
    con = mpl.row[i];
    if (con.con.lbnd == null && con.con.ubnd == null)
        c0 = - con.lbnd;
    else
        c0 = 0.0;
    return c0;
};

var mpl_get_col_name = exports.mpl_get_col_name = function(mpl, j){
    if (mpl.phase != 3)
        xerror("mpl_get_col_name: invalid call sequence");
    if (!(1 <= j && j <= mpl.n))
        xerror("mpl_get_col_name: j = " + j + "; column number out of range");
    var name = mpl.col[j].var.name;
    var len = name.length;
    xassert(len <= 255);
    name += mpl_internal_format_tuple(mpl, '[', mpl.col[j].memb.tuple);
    if (name.length == 255) name = name.slice(0,252) + '...';
    xassert(name.length <= 255);
    return name;
};

var mpl_get_col_kind = exports.mpl_get_col_kind = function(mpl, j){
    var kind;
    if (mpl.phase != 3)
        xerror("mpl_get_col_kind: invalid call sequence");
    if (!(1 <= j && j <= mpl.n))
        xerror("mpl_get_col_kind: j = " + j + "; column number out of range");
    switch (mpl.col[j].var.type)
    {  case A_NUMERIC:
        kind = MPL_NUM; break;
        case A_INTEGER:
            kind = MPL_INT; break;
        case A_BINARY:
            kind = MPL_BIN; break;
        default:
            xassert(mpl != mpl);
    }
    return kind;
};

var mpl_get_col_bnds = exports.mpl_get_col_bnds = function(mpl, j, callback){
    var var_;
    var type;
    var lb, ub;
    if (mpl.phase != 3)
        xerror("mpl_get_col_bnds: invalid call sequence");
    if (!(1 <= j && j <= mpl.n))
        xerror("mpl_get_col_bnds: j = " + j + "; column number out of range");
    var_ = mpl.col[j];
    lb = (var_.var.lbnd == null ? -DBL_MAX : var_.lbnd);
    ub = (var_.var.ubnd == null ? +DBL_MAX : var_.ubnd);
    if (lb == -DBL_MAX && ub == +DBL_MAX){
        type = MPL_FR; lb = ub = 0.0;
    }
    else if (ub == +DBL_MAX){
        type = MPL_LO; ub = 0.0;
    }
    else if (lb == -DBL_MAX){
        type = MPL_UP; lb = 0.0;
    }
    else if (var_.var.lbnd != var_.var.ubnd)
        type = MPL_DB;
    else
        type = MPL_FX;
    callback(lb, ub);
    return type;
};

var mpl_has_solve_stmt = exports.mpl_has_solve_stmt = function(mpl){
    if (mpl.phase != 3)
        xerror("mpl_has_solve_stmt: invalid call sequence");
    return mpl.flag_s;
};

var mpl_put_row_soln = exports.mpl_put_row_soln = function(mpl, i, stat, prim, dual){
    /* store row (constraint/objective) solution components */
    xassert(mpl.phase == 3);
    xassert(1 <= i && i <= mpl.m);
    mpl.row[i].stat = stat;
    mpl.row[i].prim = prim;
    mpl.row[i].dual = dual;
};

var mpl_put_col_soln = exports.mpl_put_col_soln = function (mpl, j, stat, prim, dual){
    /* store column (variable) solution components */
    xassert(mpl.phase == 3);
    xassert(1 <= j && j <= mpl.n);
    mpl.col[j].stat = stat;
    mpl.col[j].prim = prim;
    mpl.col[j].dual = dual;
};

var mpl_postsolve = exports.mpl_postsolve = function(mpl){
    if (!(mpl.phase == 3 && !mpl.flag_p))
        xerror("mpl_postsolve: invalid call sequence");
    /* perform postsolving */
    mpl_internal_postsolve_model(mpl);
    mpl_internal_flush_output(mpl);
    /* postsolving phase has been finished */
    xprintf("Model has been successfully processed");
    /* return to the calling program */
    return mpl.phase;
};

var mpl_terminate = exports.mpl_terminate = function(mpl){
    switch (mpl.phase)
    {   case 0:
        case 1:
        case 2:
        case 3:
            /* there were no errors; clean the model content */
            mpl_internal_clean_model(mpl);
            xassert(mpl.a_list == null);
            xassert(mpl.dca == null);
            break;
        case 4:
            /* model processing has been finished due to error; delete
             search trees, which may be created for some arrays */
        {
            for (var a = mpl.a_list; a != null; a = a.next)
                if (a.tree != null) delete(a.tree);
        }
            mpl_internal_free_dca(mpl);
            break;
        default:
            xassert(mpl != mpl);
    }
};
