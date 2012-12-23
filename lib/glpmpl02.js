/* glpmpl02.c */

/**********************************************************************/
/* * *                  PROCESSING DATA SECTION                   * * */
/**********************************************************************/

function mpl_internal_expand_slice
    (   mpl,
        slice,           /* destroyed */
        sym             /* destroyed */
        ){
    var temp;
    /* create a new component */
    var tail = {};
    tail.sym = sym;
    tail.next = null;
    /* and append it to the component list */
    if (slice == null)
        slice = tail;
    else
    {  for (temp = slice; temp.next != null; temp = temp.next){}
        temp.next = tail;
    }
    return slice;
}

function mpl_internal_slice_dimen
    (   mpl,
        slice            /* not changed */
        ){
    var temp;

    var dim = 0;
    for (temp = slice; temp != null; temp = temp.next) dim++;
    return dim;
}

function mpl_internal_slice_arity
    (   mpl,
        slice            /* not changed */
        ){
    var temp;

    var arity = 0;
    for (temp = slice; temp != null; temp = temp.next)
        if (temp.sym == null) arity++;
    return arity;
}

function mpl_internal_fake_slice(mpl, dim){
    var slice = null;
    while (dim-- > 0) slice = mpl_internal_expand_slice(mpl, slice, null);
    return slice;
}

function mpl_internal_delete_slice
    (   mpl,
        slice            /* destroyed */
        ){
    var temp;
    while (slice != null)
    {  temp = slice;
        slice = temp.next;
    }
}

function mpl_internal_is_number(mpl){
    return mpl.token == T_NUMBER;
}

function mpl_internal_is_symbol(mpl){
    return mpl.token == T_NUMBER ||
        mpl.token == T_SYMBOL ||
        mpl.token == T_STRING;
}

function mpl_internal_is_literal(mpl, literal){
    return mpl_internal_is_symbol(mpl) && mpl.image == literal;
}

function mpl_internal_read_number(mpl){
    xassert(mpl_internal_is_number(mpl));
    var num = mpl.value;
    mpl_internal_get_token(mpl /* <number> */);
    return num;
}

function mpl_internal_read_symbol(mpl){
    var sym;
    xassert(mpl_internal_is_symbol(mpl));
    if (mpl_internal_is_number(mpl))
        sym = mpl_internal_create_symbol_num(mpl, mpl.value);
    else
        sym = mpl_internal_create_symbol_str(mpl, mpl.image);
    mpl_internal_get_token(mpl /* <symbol> */);
    return sym;
}

function mpl_internal_read_slice(mpl, name, dim){
    var slice;
    var close;
    xassert(name != null);
    switch (mpl.token)
    {  case T_LBRACKET:
        close = T_RBRACKET;
        break;
        case T_LEFT:
            xassert(dim > 0);
            close = T_RIGHT;
            break;
        default:
            xassert(mpl != mpl);
    }
    if (dim == 0)
        mpl_internal_error(mpl, name + " cannot be subscripted");
    mpl_internal_get_token(mpl /* ( | [ */);
    /* read slice components */
    slice = null;
    for (;;)
    {  /* the current token must be a symbol or asterisk */
        if (mpl_internal_is_symbol(mpl))
            slice = mpl_internal_expand_slice(mpl, slice, mpl_internal_read_symbol(mpl));
        else if (mpl.token == T_ASTERISK)
        {  slice = mpl_internal_expand_slice(mpl, slice, null);
            mpl_internal_get_token(mpl /* * */);
        }
        else
            mpl_internal_error(mpl, "number, symbol, or asterisk missing where expected");
        /* check a token that follows the symbol */
        if (mpl.token == T_COMMA)
            mpl_internal_get_token(mpl /* , */);
        else if (mpl.token == close)
            break;
        else
            mpl_internal_error(mpl, "syntax error in slice");
    }
    /* number of slice components must be the same as the appropriate
     dimension */
    if (mpl_internal_slice_dimen(mpl, slice) != dim)
    {  switch (close)
    {  case T_RBRACKET:
            mpl_internal_error(mpl, name + " must have " + dim +
                " subscript" + (dim == 1 ? "" : "s") + ", not " + mpl_internal_slice_dimen(mpl, slice));
            break;
        case T_RIGHT:
            mpl_internal_error(mpl, name + " has dimension " + dim + ", not " + mpl_internal_slice_dimen(mpl, slice));
            break;
        default:
            xassert(close != close);
    }
    }
    mpl_internal_get_token(mpl /* ) | ] */);
    return slice;
}

function mpl_internal_select_set
    (   mpl,
        name              /* not changed */
        ){
    var set;
    var node;
    xassert(name != null);
    node = mpl.tree[name];
    if (node == null || node.type != A_SET)
        mpl_internal_error(mpl, name + " not a set");
    set = node.link;
    if (set.assign != null || set.gadget != null)
        mpl_internal_error(mpl, name + " needs no data");
    set.data = 1;
    return set;
}

function mpl_internal_simple_format
    (   mpl,
        set,               /* not changed */
        memb,           /* modified */
        slice            /* not changed */
        ){
    var tuple;
    var temp;
    var sym, with_ = null;
    xassert(set != null);
    xassert(memb != null);
    xassert(slice != null);
    xassert(set.dimen == mpl_internal_slice_dimen(mpl, slice));
    xassert(memb.value.set.dim == set.dimen);
    if (mpl_internal_slice_arity(mpl, slice) > 0) xassert(mpl_internal_is_symbol(mpl));
    /* read symbols and construct complete n-tuple */
    tuple = null;
    for (temp = slice; temp != null; temp = temp.next)
    {  if (temp.sym == null)
    {  /* substitution is needed; read symbol */
        if (!mpl_internal_is_symbol(mpl))
        {  var lack = mpl_internal_slice_arity(mpl, temp);
            /* with cannot be null due to assertion above */
            xassert(with_ != null);
            if (lack == 1)
                mpl_internal_error(mpl, "one item missing in data group beginning with " + mpl_internal_format_symbol(mpl, with_));
            else
                mpl_internal_error(mpl, lack + " items missing in data group beginning with " + mpl_internal_format_symbol(mpl, with_));
        }
        sym = mpl_internal_read_symbol(mpl);
        if (with_ == null) with_ = sym;
    }
    else
    {  /* copy symbol from the slice */
        sym = mpl_internal_copy_symbol(mpl, temp.sym);
    }
        /* append the symbol to the n-tuple */
        tuple = mpl_internal_expand_tuple(mpl, tuple, sym);
        /* skip optional comma *between* <symbols> */
        if (temp.next != null && mpl.token == T_COMMA)
            mpl_internal_get_token(mpl /* , */);
    }
    /* add constructed n-tuple to elemental set */
    mpl_internal_check_then_add(mpl, memb.value.set, tuple);
}

function mpl_internal_matrix_format
    (   mpl,
        set,               /* not changed */
        memb,           /* modified */
        slice,           /* not changed */
        tr
        ){
    var list, col, temp;
    var tuple;
    var row;
    xassert(set != null);
    xassert(memb != null);
    xassert(slice != null);
    xassert(set.dimen == mpl_internal_slice_dimen(mpl, slice));
    xassert(memb.value.set.dim == set.dimen);
    xassert(mpl_internal_slice_arity(mpl, slice) == 2);
    /* read the matrix heading that contains column symbols (there
     may be no columns at all) */
    list = null;
    while (mpl.token != T_ASSIGN)
    {  /* read column symbol and append it to the column list */
        if (!mpl_internal_is_symbol(mpl))
            mpl_internal_error(mpl, "number, symbol, or := missing where expected");
        list = mpl_internal_expand_slice(mpl, list, mpl_internal_read_symbol(mpl));
    }
    mpl_internal_get_token(mpl /* := */);
    /* read zero or more rows that contain matrix data */
    while (mpl_internal_is_symbol(mpl))
    {  /* read row symbol (if the matrix has no columns, row symbols
     are just ignored) */
        row = mpl_internal_read_symbol(mpl);
        /* read the matrix row accordingly to the column list */
        for (col = list; col != null; col = col.next)
        {  var which = 0;
            /* check indicator */
            if (mpl_internal_is_literal(mpl, "+")){

            }
            else if (mpl_internal_is_literal(mpl, "-"))
            {  mpl_internal_get_token(mpl /* - */);
                continue;
            }
            else
            {  var lack = mpl_internal_slice_dimen(mpl, col);
                if (lack == 1)
                    mpl_internal_error(mpl, "one item missing in data group beginning with " + mpl_internal_format_symbol(mpl, row));
                else
                    mpl_internal_error(mpl, lack + " items missing in data group beginning with " + mpl_internal_format_symbol(mpl, row));
            }
            /* construct complete n-tuple */
            tuple = null;
            for (temp = slice; temp != null; temp = temp.next)
            {  if (temp.sym == null)
            {  /* substitution is needed */
                switch (++which)
                {  case 1:
                    /* substitute in the first null position */
                    tuple = mpl_internal_expand_tuple(mpl, tuple,
                        mpl_internal_copy_symbol(mpl, tr ? col.sym : row));
                    break;
                    case 2:
                        /* substitute in the second null position */
                        tuple = mpl_internal_expand_tuple(mpl, tuple,
                            mpl_internal_copy_symbol(mpl, tr ? row : col.sym));
                        break;
                    default:
                        xassert(which != which);
                }
            }
            else
            {  /* copy symbol from the slice */
                tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_copy_symbol(mpl,
                    temp.sym));
            }
            }
            xassert(which == 2);
            /* add constructed n-tuple to elemental set */
            mpl_internal_check_then_add(mpl, memb.value.set, tuple);
            mpl_internal_get_token(mpl /* + */);
        }
    }
    /* delete the column list */
    mpl_internal_delete_slice(mpl, list);
}

function mpl_internal_set_data(mpl){
    var set;
    var tuple;
    var memb;
    var slice;
    var tr = 0;

    function err1(){mpl_internal_error(mpl, "slice currently used must specify 2 asterisks, not " + mpl_internal_slice_arity(mpl, slice))}
    function err2(){mpl_internal_error(mpl, "transpose indicator (tr) incomplete")}
    function left(){
        /* left parenthesis begins the "transpose" indicator, which
         is followed by data in the matrix format */
        mpl_internal_get_token(mpl /* ( */);
        if (!mpl_internal_is_literal(mpl, "tr"))
            err2();
        if (mpl_internal_slice_arity(mpl, slice) != 2) err1();
        mpl_internal_get_token(mpl /* tr */);
        if (mpl.token != T_RIGHT) err2();
        mpl_internal_get_token(mpl /* ) */);
        /* in this case the colon is optional */
        if (mpl.token == T_COLON) mpl_internal_get_token(mpl /* : */);
        /* set the "transpose" indicator */
        tr = 1;
        /* read elemental set data in the matrix format */
        mpl_internal_matrix_format(mpl, set, memb, slice, tr);
    }

    xassert(mpl_internal_is_literal(mpl, "set"));
    mpl_internal_get_token(mpl /* set */);
    /* symbolic name of set must follows the keyword 'set' */
    if (!mpl_internal_is_symbol(mpl))
        mpl_internal_error(mpl, "set name missing where expected");
    /* select the set to saturate it with data */
    set = mpl_internal_select_set(mpl, mpl.image);
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* read optional subscript list, which identifies member of the
     set to be read */
    tuple = null;
    if (mpl.token == T_LBRACKET)
    {  /* subscript list is specified */
        if (set.dim == 0)
            mpl_internal_error(mpl, set.name + " cannot be subscripted");
        mpl_internal_get_token(mpl /* [ */);
        /* read symbols and construct subscript list */
        for (;;)
        {  if (!mpl_internal_is_symbol(mpl))
            mpl_internal_error(mpl, "number or symbol missing where expected");
            tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_read_symbol(mpl));
            if (mpl.token == T_COMMA)
                mpl_internal_get_token(mpl /* , */);
            else if (mpl.token == T_RBRACKET)
                break;
            else
                mpl_internal_error(mpl, "syntax error in subscript list");
        }
        if (set.dim != mpl_internal_tuple_dimen(mpl, tuple))
            mpl_internal_error(mpl, set.name + " must have " + set.dim + " subscript" + (set.dim == 1 ? "" : "s")
                + " rather than " + mpl_internal_tuple_dimen(mpl, tuple));
        mpl_internal_get_token(mpl /* ] */);
    }
    else
    {  /* subscript list is not specified */
        if (set.dim != 0)
            mpl_internal_error(mpl, set.name + " must be subscripted");
    }
    /* there must be no member with the same subscript list */
    if (mpl_internal_find_member(mpl, set.array, tuple) != null)
        mpl_internal_error(mpl, set.name + mpl_internal_format_tuple(mpl, '[', tuple) + " already defined");
    /* add new member to the set and assign it empty elemental set */
    memb = mpl_internal_add_member(mpl, set.array, tuple);
    memb.value.set = mpl_internal_create_elemset(mpl, set.dimen);
    /* create an initial fake slice of all asterisks */
    slice = mpl_internal_fake_slice(mpl, set.dimen);
    /* read zero or more data assignments */
    for (;;)
    {  /* skip optional comma */
        if (mpl.token == T_COMMA) mpl_internal_get_token(mpl /* , */);
        /* process assignment element */
        if (mpl.token == T_ASSIGN)
        {  /* assignment ligature is non-significant element */
            mpl_internal_get_token(mpl /* := */);
        }
        else if (mpl.token == T_LEFT)
        {  /* left parenthesis begins either new slice or "transpose"
         indicator */
            var is_tr;
            mpl_internal_get_token(mpl /* ( */);
            is_tr = mpl_internal_is_literal(mpl, "tr");
            mpl_internal_unget_token(mpl /* ( */);
            if (is_tr) {
                left();
            } else {
                /* delete the current slice and read new one */
                mpl_internal_delete_slice(mpl, slice);
                slice = mpl_internal_read_slice(mpl, set.name, set.dimen);
                /* each new slice resets the "transpose" indicator */
                tr = 0;
                /* if the new slice is 0-ary, formally there is one 0-tuple
                 (in the simple format) that follows it */
                if (mpl_internal_slice_arity(mpl, slice) == 0)
                    mpl_internal_simple_format(mpl, set, memb, slice);
            }
        }
        else if (mpl_internal_is_symbol(mpl))
        {  /* number or symbol begins data in the simple format */
            mpl_internal_simple_format(mpl, set, memb, slice);
        }
        else if (mpl.token == T_COLON)
        {  /* colon begins data in the matrix format */
            if (mpl_internal_slice_arity(mpl, slice) != 2)
                err1();
            mpl_internal_get_token(mpl /* : */);
            /* read elemental set data in the matrix format */
            mpl_internal_matrix_format(mpl, set, memb, slice, tr);
        }
        else if (mpl.token == T_LEFT){
            left();
        }
        else if (mpl.token == T_SEMICOLON)
        {  /* semicolon terminates the data block */
            mpl_internal_get_token(mpl /* ; */);
            break;
        }
        else
            mpl_internal_error(mpl, "syntax error in set data block");
    }
    /* delete the current slice */
    mpl_internal_delete_slice(mpl, slice);
}

function mpl_internal_select_parameter(
    mpl,
    name              /* not changed */
    ){
    var par;
    var node;
    xassert(name != null);
    node = mpl.tree[name];
    if (node == null || node.type != A_PARAMETER)
        mpl_internal_error(mpl, name + " not a parameter");
    par = node.link;
    if (par.assign != null)
        mpl_internal_error(mpl, name + " needs no data");
    if (par.data)
        mpl_internal_error(mpl, name + " already provided with data");
    par.data = 1;
    return par;
}

function mpl_internal_set_default(
    mpl,
    par,         /* not changed */
    altval          /* destroyed */
    ){
    xassert(par != null);
    xassert(altval != null);
    if (par.option != null)
        mpl_internal_error(mpl, "default value for " + par.name + " already specified in model section");
    xassert(par.defval == null);
    par.defval = altval;
}

function mpl_internal_read_value
    (   mpl,
        par,         /* not changed */
        tuple            /* destroyed */
        ){
    var memb;
    xassert(par != null);
    xassert(mpl_internal_is_symbol(mpl));
    /* there must be no member with the same n-tuple */
    if (mpl_internal_find_member(mpl, par.array, tuple) != null)
        mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " already defined");
    /* create new parameter member with given n-tuple */
    memb = mpl_internal_add_member(mpl, par.array, tuple);
    /* read value and assigns it to the new parameter member */
    switch (par.type)
    {  case A_NUMERIC:
        case A_INTEGER:
        case A_BINARY:
            if (!mpl_internal_is_number(mpl))
                mpl_internal_error(mpl, par.name + " requires numeric data");
            memb.value.num = mpl_internal_read_number(mpl);
            break;
        case A_SYMBOLIC:
            memb.value.sym = mpl_internal_read_symbol(mpl);
            break;
        default:
            xassert(par != par);
    }
    return memb;
}

function mpl_internal_plain_format
    (   mpl,
        par,         /* not changed */
        slice            /* not changed */
        )
{
    var tuple;
    var temp;
    var sym, with_ = null;
    xassert(par != null);
    xassert(par.dim == mpl_internal_slice_dimen(mpl, slice));
    xassert(mpl_internal_is_symbol(mpl));
    /* read symbols and construct complete subscript list */
    tuple = null;
    for (temp = slice; temp != null; temp = temp.next)
    {  if (temp.sym == null)
    {  /* substitution is needed; read symbol */
        if (!mpl_internal_is_symbol(mpl))
        {   var lack = mpl_internal_slice_arity(mpl, temp) + 1;
            xassert(with_ != null);
            xassert(lack > 1);
            mpl_internal_error(mpl, lack + " items missing in data group beginning with " + mpl_internal_format_symbol(mpl, with_));
        }
        sym = mpl_internal_read_symbol(mpl);
        if (with_ == null) with_ = sym;
    }
    else
    {  /* copy symbol from the slice */
        sym = mpl_internal_copy_symbol(mpl, temp.sym);
    }
        /* append the symbol to the subscript list */
        tuple = mpl_internal_expand_tuple(mpl, tuple, sym);
        /* skip optional comma */
        if (mpl.token == T_COMMA) mpl_internal_get_token(mpl /* , */);
    }
    /* read value and assign it to new parameter member */
    if (!mpl_internal_is_symbol(mpl))
    {  xassert(with_ != null);
        mpl_internal_error(mpl, "one item missing in data group beginning with " + mpl_internal_format_symbol(mpl, with_));
    }
    mpl_internal_read_value(mpl, par, tuple);
}

function mpl_internal_tabular_format
    (   mpl,
        par,         /* not changed */
        slice,           /* not changed */
        tr
        ){
    var list, col, temp;
    var tuple;
    var row;
    xassert(par != null);
    xassert(par.dim == mpl_internal_slice_dimen(mpl, slice));
    xassert(mpl_internal_slice_arity(mpl, slice) == 2);
    /* read the table heading that contains column symbols (the table
     may have no columns) */
    list = null;
    while (mpl.token != T_ASSIGN)
    {  /* read column symbol and append it to the column list */
        if (!mpl_internal_is_symbol(mpl))
            mpl_internal_error(mpl, "number, symbol, or := missing where expected");
        list = mpl_internal_expand_slice(mpl, list, mpl_internal_read_symbol(mpl));
    }
    mpl_internal_get_token(mpl /* := */);
    /* read zero or more rows that contain tabular data */
    while (mpl_internal_is_symbol(mpl))
    {  /* read row symbol (if the table has no columns, these symbols
     are just ignored) */
        row = mpl_internal_read_symbol(mpl);
        /* read values accordingly to the column list */
        for (col = list; col != null; col = col.next)
        {  var which = 0;
            /* if the token is single point, no value is provided */
            if (mpl_internal_is_literal(mpl, "."))
            {  mpl_internal_get_token(mpl /* . */);
                continue;
            }
            /* construct complete subscript list */
            tuple = null;
            for (temp = slice; temp != null; temp = temp.next)
            {  if (temp.sym == null)
            {  /* substitution is needed */
                switch (++which)
                {  case 1:
                    /* substitute in the first null position */
                    tuple = mpl_internal_expand_tuple(mpl, tuple,
                        mpl_internal_copy_symbol(mpl, tr ? col.sym : row));
                    break;
                    case 2:
                        /* substitute in the second null position */
                        tuple = mpl_internal_expand_tuple(mpl, tuple,
                            mpl_internal_copy_symbol(mpl, tr ? row : col.sym));
                        break;
                    default:
                        xassert(which != which);
                }
            }
            else
            {  /* copy symbol from the slice */
                tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_copy_symbol(mpl,
                    temp.sym));
            }
            }
            xassert(which == 2);
            /* read value and assign it to new parameter member */
            if (!mpl_internal_is_symbol(mpl))
            {  var lack = mpl_internal_slice_dimen(mpl, col);
                if (lack == 1)
                    mpl_internal_error(mpl, "one item missing in data group beginning with " + mpl_internal_format_symbol(mpl, row));
                else
                    mpl_internal_error(mpl, lack + " items missing in data group beginning with " + mpl_internal_format_symbol(mpl, row));
            }
            mpl_internal_read_value(mpl, par, tuple);
        }
    }
    /* delete the column list */
    mpl_internal_delete_slice(mpl, list);
}

function mpl_internal_tabbing_format
    (   mpl,
        altval          /* not changed */
        ){
    var set = null;
    var par;
    var list, col;
    var tuple;
    var next_token, j, dim = 0;
    var last_name = null;
    /* read the optional <prefix> */
    if (mpl_internal_is_symbol(mpl))
    {  mpl_internal_get_token(mpl /* <symbol> */);
        next_token = mpl.token;
        mpl_internal_unget_token(mpl /* <symbol> */);
        if (next_token == T_COLON)
        {  /* select the set to saturate it with data */
            set = mpl_internal_select_set(mpl, mpl.image);
            /* the set must be simple (i.e. not set of sets) */
            if (set.dim != 0)
                mpl_internal_error(mpl, set.name + " must be a simple set");
            /* and must not be defined yet */
            if (set.array.head != null)
                mpl_internal_error(mpl, set.name + " already defined");
            /* add new (the only) member to the set and assign it empty
             elemental set */
            mpl_internal_add_member(mpl, set.array, null).value.set =
                mpl_internal_create_elemset(mpl, set.dimen);
            last_name = set.name; dim = set.dimen;
            mpl_internal_get_token(mpl /* <symbol> */);
            xassert(mpl.token == T_COLON);
            mpl_internal_get_token(mpl /* : */);
        }
    }
    /* read the table heading that contains parameter names */
    list = null;
    while (mpl.token != T_ASSIGN)
    {  /* there must be symbolic name of parameter */
        if (!mpl_internal_is_symbol(mpl))
            mpl_internal_error(mpl, "parameter name or := missing where expected");
        /* select the parameter to saturate it with data */
        par = mpl_internal_select_parameter(mpl, mpl.image);
        /* the parameter must be subscripted */
        if (par.dim == 0)
            mpl_internal_error(mpl, mpl.image + " not a subscripted parameter");
        /* the set (if specified) and all the parameters in the data
         block must have identical dimension */
        if (dim != 0 && par.dim != dim)
        {  xassert(last_name != null);
            mpl_internal_error(mpl, last_name + " has dimension " + dim + " while " + par.name + " has dimension " + par.dim);
        }
        /* set default value for the parameter (if specified) */
        if (altval != null)
            mpl_internal_set_default(mpl, par, mpl_internal_copy_symbol(mpl, altval));
        /* append the parameter to the column list */
        list = mpl_internal_expand_slice(mpl, list, par);
        last_name = par.name; dim = par.dim;
        mpl_internal_get_token(mpl /* <symbol> */);
        /* skip optional comma */
        if (mpl.token == T_COMMA) mpl_internal_get_token(mpl /* , */);
    }
    if (mpl_internal_slice_dimen(mpl, list) == 0)
        mpl_internal_error(mpl, "at least one parameter name required");
    mpl_internal_get_token(mpl /* := */);
    /* skip optional comma */
    if (mpl.token == T_COMMA) mpl_internal_get_token(mpl /* , */);
    /* read rows that contain tabbing data */
    while (mpl_internal_is_symbol(mpl))
    {  /* read subscript list */
        var lack;
        tuple = null;
        for (j = 1; j <= dim; j++)
        {  /* read j-th subscript */
            if (!mpl_internal_is_symbol(mpl))
            {   lack = mpl_internal_slice_dimen(mpl, list) + dim - j + 1;
                xassert(tuple != null);
                xassert(lack > 1);
                mpl_internal_error(mpl, lack + " items missing in data group beginning with " + mpl_internal_format_symbol(mpl, tuple.sym));
            }
            /* read and append j-th subscript to the n-tuple */
            tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_read_symbol(mpl));
            /* skip optional comma *between* <symbols> */
            if (j < dim && mpl.token == T_COMMA)
                mpl_internal_get_token(mpl /* , */);
        }
        /* if the set is specified, add to it new n-tuple, which is a
         copy of the subscript list just read */
        if (set != null)
            mpl_internal_check_then_add(mpl, set.array.head.value.set, mpl_internal_copy_tuple(mpl, tuple));
        /* skip optional comma between <symbol> and <value> */
        if (mpl.token == T_COMMA) mpl_internal_get_token(mpl /* , */);
        /* read values accordingly to the column list */
        for (col = list; col != null; col = col.next)
        {  /* if the token is single point, no value is provided */
            if (mpl_internal_is_literal(mpl, "."))
            {  mpl_internal_get_token(mpl /* . */);
                continue;
            }
            /* read value and assign it to new parameter member */
            if (!mpl_internal_is_symbol(mpl))
            {   lack = mpl_internal_slice_dimen(mpl, col);
                xassert(tuple != null);
                if (lack == 1)
                    mpl_internal_error(mpl, "one item missing in data group beginning with " + mpl_internal_format_symbol(mpl, tuple.sym));
                else
                    mpl_internal_error(mpl, lack + " items missing in data group beginning with " + mpl_internal_format_symbol(mpl, tuple.sym));
            }
            mpl_internal_read_value(mpl, col.sym, mpl_internal_copy_tuple(mpl, tuple));
            /* skip optional comma preceding the next value */
            if (col.next != null && mpl.token == T_COMMA)
                mpl_internal_get_token(mpl /* , */);
        }
        /* skip optional comma (only if there is next data group) */
        if (mpl.token == T_COMMA)
        {  mpl_internal_get_token(mpl /* , */);
            if (!mpl_internal_is_symbol(mpl)) mpl_internal_unget_token(mpl /* , */);
        }
    }
    /* delete the column list (it contains parameters, not symbols,
     so nullify it before) */
    for (col = list; col != null; col = col.next) col.sym = null;
    mpl_internal_delete_slice(mpl, list);
}

function mpl_internal_parameter_data(mpl){
    var par;
    var altval = null;
    var slice;
    var tr = 0;
    xassert(mpl_internal_is_literal(mpl, "param"));
    mpl_internal_get_token(mpl /* param */);
    /* read optional default value */
    if (mpl_internal_is_literal(mpl, "default"))
    {  mpl_internal_get_token(mpl /* default */);
        if (!mpl_internal_is_symbol(mpl))
            mpl_internal_error(mpl, "default value missing where expected");
        altval = mpl_internal_read_symbol(mpl);
        /* if the default value follows the keyword 'param', the next
         token must be only the colon */
        if (mpl.token != T_COLON)
            mpl_internal_error(mpl, "colon missing where expected");
    }
    /* being used after the keyword 'param' or the optional default
     value the colon begins data in the tabbing format */
    if (mpl.token == T_COLON)
    {  mpl_internal_get_token(mpl /* : */);
        /* skip optional comma */
        if (mpl.token == T_COMMA) mpl_internal_get_token(mpl /* , */);
        /* read parameter data in the tabbing format */
        mpl_internal_tabbing_format(mpl, altval);
        /* the next token must be only semicolon */
        if (mpl.token != T_SEMICOLON)
            mpl_internal_error(mpl, "symbol, number, or semicolon missing where expected");
        mpl_internal_get_token(mpl /* ; */);
        return;
    }
    /* in other cases there must be symbolic name of parameter, which
     follows the keyword 'param' */
    if (!mpl_internal_is_symbol(mpl))
        mpl_internal_error(mpl, "parameter name missing where expected");
    /* select the parameter to saturate it with data */
    par = mpl_internal_select_parameter(mpl, mpl.image);
    mpl_internal_get_token(mpl /* <symbol> */);
    /* read optional default value */
    if (mpl_internal_is_literal(mpl, "default"))
    {  mpl_internal_get_token(mpl /* default */);
        if (!mpl_internal_is_symbol(mpl))
            mpl_internal_error(mpl, "default value missing where expected");
        altval = mpl_internal_read_symbol(mpl);
        /* set default value for the parameter */
        mpl_internal_set_default(mpl, par, altval);
    }
    /* create initial fake slice of all asterisks */
    slice = mpl_internal_fake_slice(mpl, par.dim);
    /* read zero or more data assignments */

    function err1(){mpl_internal_error(mpl, par.name + " not a subscripted parameter")}
    function err2(){mpl_internal_error(mpl, "slice currently used must specify 2 asterisks, not " + mpl_internal_slice_arity(mpl, slice))}
    function err3(){mpl_internal_error(mpl, "transpose indicator (tr) incomplete")}

    for (;;)
    {  /* skip optional comma */
        if (mpl.token == T_COMMA) mpl_internal_get_token(mpl /* , */);
        /* process current assignment */
        if (mpl.token == T_ASSIGN)
        {  /* assignment ligature is non-significant element */
            mpl_internal_get_token(mpl /* := */);
        }
        else if (mpl.token == T_LBRACKET)
        {  /* left bracket begins new slice; delete the current slice
         and read new one */
            mpl_internal_delete_slice(mpl, slice);
            slice = mpl_internal_read_slice(mpl, par.name, par.dim);
            /* each new slice resets the "transpose" indicator */
            tr = 0;
        }
        else if (mpl_internal_is_symbol(mpl))
        {  /* number or symbol begins data in the plain format */
            mpl_internal_plain_format(mpl, par, slice);
        }
        else if (mpl.token == T_COLON)
        {  /* colon begins data in the tabular format */
            if (par.dim == 0)
                err1();
            if (mpl_internal_slice_arity(mpl, slice) != 2)
                err2();
            mpl_internal_get_token(mpl /* : */);
            /* read parameter data in the tabular format */
            mpl_internal_tabular_format(mpl, par, slice, tr);
        }
        else if (mpl.token == T_LEFT)
        {  /* left parenthesis begins the "transpose" indicator, which
         is followed by data in the tabular format */
            mpl_internal_get_token(mpl /* ( */);
            if (!mpl_internal_is_literal(mpl, "tr"))
                err3();
            if (par.dim == 0) err1();
            if (mpl_internal_slice_arity(mpl, slice) != 2) err2();
            mpl_internal_get_token(mpl /* tr */);
            if (mpl.token != T_RIGHT) err3();
            mpl_internal_get_token(mpl /* ) */);
            /* in this case the colon is optional */
            if (mpl.token == T_COLON) mpl_internal_get_token(mpl /* : */);
            /* set the "transpose" indicator */
            tr = 1;
            /* read parameter data in the tabular format */
            mpl_internal_tabular_format(mpl, par, slice, tr);
        }
        else if (mpl.token == T_SEMICOLON)
        {  /* semicolon terminates the data block */
            mpl_internal_get_token(mpl /* ; */);
            break;
        }
        else
            mpl_internal_error(mpl, "syntax error in parameter data block");
    }
    /* delete the current slice */
    mpl_internal_delete_slice(mpl, slice);
}

function mpl_internal_data_section(mpl){
    while (!(mpl.token == T_EOF || mpl_internal_is_literal(mpl, "end")))
    {   if (mpl_internal_is_literal(mpl, "set"))
        mpl_internal_set_data(mpl);
    else if (mpl_internal_is_literal(mpl, "param"))
        mpl_internal_parameter_data(mpl);
    else
        mpl_internal_error(mpl, "syntax error in data section");
    }
}
