/* glpmpl03.c */

/**********************************************************************/
/* * *                   FLOATING-POINT NUMBERS                   * * */
/**********************************************************************/

function mpl_internal_fp_add(mpl, x, y){
    if (x > 0.0 && y > 0.0 && x > + 0.999 * DBL_MAX - y ||
        x < 0.0 && y < 0.0 && x < - 0.999 * DBL_MAX - y)
        mpl_internal_error(mpl, x + " + " + y + "; floating-point overflow");
    return x + y;
}

function mpl_internal_fp_sub(mpl, x, y){
    if (x > 0.0 && y < 0.0 && x > + 0.999 * DBL_MAX + y ||
        x < 0.0 && y > 0.0 && x < - 0.999 * DBL_MAX + y)
        mpl_internal_error(mpl, x + " - " + y + "; floating-point overflow");
    return x - y;
}

function mpl_internal_fp_less(mpl, x, y){
    if (x < y) return 0.0;
    if (x > 0.0 && y < 0.0 && x > + 0.999 * DBL_MAX + y)
        mpl_internal_error(mpl, x+ " less " + y + "; floating-point overflow");
    return x - y;
}

function mpl_internal_fp_mul(mpl, x, y){
    if (Math.abs(y) > 1.0 && Math.abs(x) > (0.999 * DBL_MAX) / Math.abs(y))
        mpl_internal_error(mpl, x + " * " + y + "; floating-point overflow");
    return x * y;
}

function mpl_internal_fp_div(mpl, x, y){
    if (Math.abs(y) < DBL_MIN)
        mpl_internal_error(mpl, x + " / " + y + "; floating-point zero divide");
    if (Math.abs(y) < 1.0 && Math.abs(x) > (0.999 * DBL_MAX) * Math.abs(y))
        mpl_internal_error(mpl, x + " / " + y + "; floating-point overflow");
    return x / y;
}

function mpl_internal_fp_idiv(mpl, x, y){
    if (Math.abs(y) < DBL_MIN)
        mpl_internal_error(mpl, x + " div " + y + "; floating-point zero divide");
    if (Math.abs(y) < 1.0 && Math.abs(x) > (0.999 * DBL_MAX) * Math.abs(y))
        mpl_internal_error(mpl, x + " div " + y + "; floating-point overflow");
    x /= y;
    return x > 0.0 ? Math.floor(x) : x < 0.0 ? Math.ceil(x) : 0.0;
}

function mpl_internal_fp_mod(mpl, x, y)
{
    var r;

    if (x == 0.0)
        r = 0.0;
    else if (y == 0.0)
        r = x;
    else
    {  r = Math.abs(x) % Math.abs(y);
        if (r != 0.0)
        {  if (x < 0.0) r = - r;
            if (x > 0.0 && y < 0.0 || x < 0.0 && y > 0.0) r += y;
        }
    }
    return r;
}

function mpl_internal_fp_power(mpl, x, y)
{
    var r;
    if (x == 0.0 && y <= 0.0 || x < 0.0 && y != Math.floor(y))
        mpl_internal_error(mpl, x + " ** " + y + "; result undefined");
    if (x == 0.0) {
        r = Math.pow(x, y);
    } else {
        if (Math.abs(x) > 1.0 && y > +1.0 &&
            +Math.log(Math.abs(x)) > (0.999 * Math.log(DBL_MAX)) / y ||
            Math.abs(x) < 1.0 && y < -1.0 &&
                +Math.log(Math.abs(x)) < (0.999 * Math.log(DBL_MAX)) / y)
            mpl_internal_error(mpl, x + " ** " + y + "; floating-point overflow");
        if (Math.abs(x) > 1.0 && y < -1.0 &&
            -Math.log(Math.abs(x)) < (0.999 * Math.log(DBL_MAX)) / y ||
            Math.abs(x) < 1.0 && y > +1.0 &&
                -Math.log(Math.abs(x)) > (0.999 * Math.log(DBL_MAX)) / y)
            r = 0.0;
        else
            r = Math.pow(x, y);
    }
    return r;
}

function mpl_internal_fp_exp(mpl, x)
{
    if (x > 0.999 * Math.log(DBL_MAX))
        mpl_internal_error(mpl, "exp(" + x + "); floating-point overflow");
    return Math.exp(x);
}

function mpl_internal_fp_log(mpl, x)
{     if (x <= 0.0)
    mpl_internal_error(mpl, "log(" + x + "); non-positive argument");
    return Math.log(x);
}

function mpl_internal_fp_log10(mpl, x)
{
    if (x <= 0.0)
        mpl_internal_error(mpl, "log10(" + x + "); non-positive argument");
    return Math.log(x) / Math.LN10;
}

function mpl_internal_fp_sqrt(mpl, x)
{
    if (x < 0.0)
        mpl_internal_error(mpl, "sqrt(" + x + "); negative argument");
    return Math.sqrt(x);
}

function mpl_internal_fp_sin(mpl, x)
{
    if (!(-1e6 <= x && x <= +1e6))
        mpl_internal_error(mpl, "sin(" + x + "); argument too large");
    return Math.sin(x);
}

function mpl_internal_fp_cos(mpl, x)
{
    if (!(-1e6 <= x && x <= +1e6))
        mpl_internal_error(mpl, "cos(" + x + "); argument too large");
    return Math.cos(x);
}

function mpl_internal_fp_atan(mpl, x)
{

    return Math.atan(x);
}

function mpl_internal_fp_atan2(mpl, y, x)
{

    return Math.atan2(y, x);
}

function mpl_internal_fp_round(mpl, x, n)
{     var ten_to_n;
    if (n != Math.floor(n))
        mpl_internal_error(mpl, "round(" + x + ", " + n + "); non-integer second argument");
    if (n <= DBL_DIG + 2)
    {  ten_to_n = Math.pow(10.0, n);
        if (Math.abs(x) < (0.999 * DBL_MAX) / ten_to_n)
        {  x = Math.floor(x * ten_to_n + 0.5);
            if (x != 0.0) x /= ten_to_n;
        }
    }
    return x;
}

function mpl_internal_fp_trunc(mpl, x, n)
{     var ten_to_n;
    if (n != Math.floor(n))
        mpl_internal_error(mpl, "trunc(" + x + ", " + n + "); non-integer second argument");
    if (n <= DBL_DIG + 2)
    {  ten_to_n = Math.pow(10.0, n);
        if (Math.abs(x) < (0.999 * DBL_MAX) / ten_to_n)
        {  x = (x >= 0.0 ? Math.floor(x * ten_to_n) : Math.ceil(x * ten_to_n));
            if (x != 0.0) x /= ten_to_n;
        }
    }
    return x;
}

/**********************************************************************/
/* * *              PSEUDO-RANDOM NUMBER GENERATORS               * * */
/**********************************************************************/

function mpl_internal_fp_irand224(mpl)
{
    var two_to_the_24 = 0x1000000;
    return rng_unif_rand(mpl.rand, two_to_the_24);
}

function mpl_internal_fp_uniform01(mpl)
{
    var two_to_the_31 = 0x80000000;
    return rng_next_rand(mpl.rand) / two_to_the_31;
}

function mpl_internal_fp_uniform(mpl, a, b){
    var x;
    if (a >= b)
        mpl_internal_error(mpl, "Uniform(" + a + ", " + b + "); invalid range");
    x = mpl_internal_fp_uniform01(mpl);
    x = mpl_internal_fp_add(mpl, a * (1.0 - x), b * x);
    return x;
}

function mpl_internal_fp_normal01(mpl){
    var x, y, r2;
    do
    {  /* choose x, y in uniform square (-1,-1) to (+1,+1) */
        x = -1.0 + 2.0 * mpl_internal_fp_uniform01(mpl);
        y = -1.0 + 2.0 * mpl_internal_fp_uniform01(mpl);
        /* see if it is in the unit circle */
        r2 = x * x + y * y;
    } while (r2 > 1.0 || r2 == 0.0);
    /* Box-Muller transform */
    return y * Math.sqrt(-2.0 * Math.log(r2) / r2);
}

function mpl_internal_fp_normal(mpl, mu, sigma){
    return mpl_internal_fp_add(mpl, mu, mpl_internal_fp_mul(mpl, sigma, mpl_internal_fp_normal01(mpl)));
}

/**********************************************************************/
/* * *                SEGMENTED CHARACTER STRINGS                 * * */
/**********************************************************************/

function mpl_internal_compare_strings(mpl, str1, str2)
{
    if (str1 == str2)
        return 0;
    else if (str1 > str2)
        return 1;
    else
        return -1;
}

/**********************************************************************/
/* * *                          SYMBOLS                           * * */
/**********************************************************************/

function mpl_internal_create_symbol_num(mpl, num){
    var sym = {};
    sym.num = num;
    sym.str = null;
    return sym;
}

function mpl_internal_create_symbol_str(mpl, str){
    xassert(str != null);
    var sym = {};
    sym.num = 0.0;
    sym.str = str;
    return sym;
}

function mpl_internal_copy_symbol(mpl, sym){
    xassert(sym != null);
    var copy = {};
    if (sym.str == null)
    {  copy.num = sym.num;
        copy.str = null;
    }
    else
    {  copy.num = 0.0;
        copy.str = sym.str;
    }
    return copy;
}

function mpl_internal_compare_symbols(mpl, sym1, sym2){
    xassert(sym1 != null);
    xassert(sym2 != null);
    /* let all numeric quantities precede all symbolic quantities */
    if (sym1.str == null && sym2.str == null)
    {  if (sym1.num < sym2.num) return -1;
        if (sym1.num > sym2.num) return +1;
        return 0;
    }
    if (sym1.str == null) return -1;
    if (sym2.str == null) return +1;
    return mpl_internal_compare_strings(mpl, sym1.str, sym2.str);
}

function mpl_internal_format_symbol(mpl, sym){
    xassert(sym != null);
    var buf;
    if (sym.str == null)
        buf = String(sym.num);
    else
    {
        var quoted, j, len;
        var str = sym.str;
        if (!(isalpha(str[0]) || str[0] == '_'))
            quoted = true;
        else
        {   quoted = false;
            for (j = 1; j < str.length; j++)
            {   if (!(isalnum(str[j]) || strchr("+-._", str[j]) >= 0))
            {   quoted = true;
                break;
            }
            }
        }

        buf = ''; len = 0;
        function safe_append(c){if (len < 255) {buf += c; len++}}

        if (quoted) safe_append('\'');
        for (j = 0; j < str.length; j++)
        {  if (quoted && str[j] == '\'') safe_append('\'');
            safe_append(str[j]);
        }
        if (quoted) safe_append('\'');
        if (len == 255) buf = buf.slice(0, 252) + "...";
    }
    xassert(buf.length <= 255);
    return buf;
}

function mpl_internal_concat_symbols
    (   mpl,
        sym1,           /* destroyed */
        sym2            /* destroyed */
        ){
    var str1, str2;
    xassert(MAX_LENGTH >= DBL_DIG + DBL_DIG);

    if (sym1.str == null)
        str1 = String(sym1.num);
    else
        str1 = sym1.str;

    if (sym2.str == null)
        str2 = String(sym2.num);
    else
        str2 = sym2.str;

    if (str1.length + str2.length > MAX_LENGTH)
    {   var buf = mpl_internal_format_symbol(mpl, sym1);
        xassert(buf.length < MAX_LENGTH);
        mpl_internal_error(mpl, buf + " & " + mpl_internal_format_symbol(mpl, sym2) + "; resultant symbol exceeds " + MAX_LENGTH + " characters");
    }
    return mpl_internal_create_symbol_str(mpl, str1 + str2);
}

/**********************************************************************/
/* * *                          N-TUPLES                          * * */
/**********************************************************************/

function mpl_internal_expand_tuple(mpl, tuple, sym){
    var temp;
    xassert(sym != null);
    /* create a new component */
    var tail = {};
    tail.sym = sym;
    tail.next = null;
    /* and append it to the component list */
    if (tuple == null)
        tuple = tail;
    else
    {  for (temp = tuple; temp.next != null; temp = temp.next){}
        temp.next = tail;
    }
    return tuple;
}

function mpl_internal_tuple_dimen(mpl, tuple){
    var dim = 0;
    for (var temp = tuple; temp != null; temp = temp.next) dim++;
    return dim;
}

function mpl_internal_copy_tuple(mpl, tuple){
    var head, tail;
    if (tuple == null)
        head = null;
    else
    {   head = tail = {};
        for (; tuple != null; tuple = tuple.next)
        {  xassert(tuple.sym != null);
            tail.sym = mpl_internal_copy_symbol(mpl, tuple.sym);
            if (tuple.next != null)
                tail = tail.next = {};
        }
        tail.next = null;
    }
    return head;
}

function mpl_internal_compare_tuples(mpl, tuple1, tuple2){
    var item1, item2;
    var ret;
    for (item1 = tuple1, item2 = tuple2; item1 != null;
         item1 = item1.next, item2 = item2.next)
    {  xassert(item2 != null);
        xassert(item1.sym != null);
        xassert(item2.sym != null);
        ret = mpl_internal_compare_symbols(mpl, item1.sym, item2.sym);
        if (ret != 0) return ret;
    }
    xassert(item2 == null);
    return 0;
}

function mpl_internal_build_subtuple(mpl, tuple, dim){
    var head = null;
    for (var j = 1, temp = tuple; j <= dim; j++, temp = temp.next)
    {  xassert(temp != null);
        head = mpl_internal_expand_tuple(mpl, head, mpl_internal_copy_symbol(mpl, temp.sym));
    }
    return head;
}

function mpl_internal_format_tuple(mpl, c, tuple){
    var temp;
    var j, len = 0;
    var buf = '', str = '', save;
    function safe_append(c){if (len < 255) buf += c; len++}
    var dim = mpl_internal_tuple_dimen(mpl, tuple);
    if (c == '[' && dim > 0) safe_append('[');
    if (c == '(' && dim > 1) safe_append('(');
    for (temp = tuple; temp != null; temp = temp.next)
    {  if (temp != tuple) safe_append(',');
        xassert(temp.sym != null);
        str = mpl_internal_format_symbol(mpl, temp.sym);
        xassert(str.length <= 255);
        for (j = 0; j < str.length; j++) safe_append(str[j]);
    }
    if (c == '[' && dim > 0) safe_append(']');
    if (c == '(' && dim > 1) safe_append(')');
    if (len == 255) buf = buf.slice(0,252) + "...";
    xassert(buf.length <= 255);
    return buf;
}

/**********************************************************************/
/* * *                       ELEMENTAL SETS                       * * */
/**********************************************************************/

function mpl_internal_create_elemset(mpl, dim){
    xassert(dim > 0);
    return mpl_internal_create_array(mpl, A_NONE, dim);
}

function mpl_internal_find_tuple(mpl, set, tuple){
    xassert(set != null);
    xassert(set.type == A_NONE);
    xassert(set.dim == mpl_internal_tuple_dimen(mpl, tuple));
    return mpl_internal_find_member(mpl, set, tuple);
}

function mpl_internal_add_tuple(mpl, set, tuple){
    var memb;
    xassert(set != null);
    xassert(set.type == A_NONE);
    xassert(set.dim == mpl_internal_tuple_dimen(mpl, tuple));
    memb = mpl_internal_add_member(mpl, set, tuple);
    memb.value.none = null;
    return memb;
}

function mpl_internal_check_then_add(mpl, set, tuple){
    if (mpl_internal_find_tuple(mpl, set, tuple) != null)
        mpl_internal_error(mpl, "duplicate tuple " + mpl_internal_format_tuple(mpl, '(', tuple) + " detected");
    return mpl_internal_add_tuple(mpl, set, tuple);
}

function mpl_internal_copy_elemset(mpl, set){
    var copy;
    var memb;
    xassert(set != null);
    xassert(set.type == A_NONE);
    xassert(set.dim > 0);
    copy = mpl_internal_create_elemset(mpl, set.dim);
    for (memb = set.head; memb != null; memb = memb.next)
        mpl_internal_add_tuple(mpl, copy, mpl_internal_copy_tuple(mpl, memb.tuple));
    return copy;
}

function mpl_internal_arelset_size(mpl, t0, tf, dt){
    var temp;
    if (dt == 0.0)
        mpl_internal_error(mpl, t0 + " .. " + tf + " by " + dt + "; zero stride not allowed");
    if (tf > 0.0 && t0 < 0.0 && tf > + 0.999 * DBL_MAX + t0)
        temp = +DBL_MAX;
    else if (tf < 0.0 && t0 > 0.0 && tf < - 0.999 * DBL_MAX + t0)
        temp = -DBL_MAX;
    else
        temp = tf - t0;
    if (Math.abs(dt) < 1.0 && Math.abs(temp) > (0.999 * DBL_MAX) * Math.abs(dt))
    {  if (temp > 0.0 && dt > 0.0 || temp < 0.0 && dt < 0.0)
        temp = +DBL_MAX;
    else
        temp = 0.0;
    }
    else
    {  temp = Math.floor(temp / dt) + 1.0;
        if (temp < 0.0) temp = 0.0;
    }
    xassert(temp >= 0.0);
    if (temp > (INT_MAX - 1))
        mpl_internal_error(mpl, t0 + " .. " + tf + " by " + dt + "; set too large");
    return (temp + 0.5)|0;
}

function mpl_internal_arelset_member(mpl, t0, tf, dt, j){
    xassert(1 <= j && j <= mpl_internal_arelset_size(mpl, t0, tf, dt));
    return t0 + (j - 1) * dt;
}

function mpl_internal_create_arelset(mpl, t0, tf, dt){
    var set = mpl_internal_create_elemset(mpl, 1);
    var n = mpl_internal_arelset_size(mpl, t0, tf, dt);
    for (var j = 1; j <= n; j++)
    {
        mpl_internal_add_tuple(mpl, set,
            mpl_internal_expand_tuple(mpl, null,
                mpl_internal_create_symbol_num(mpl,
                    mpl_internal_arelset_member(mpl, t0, tf, dt, j))));
    }
    return set;
}

function mpl_internal_set_union(mpl, X, Y){
    xassert(X != null);
    xassert(X.type == A_NONE);
    xassert(X.dim > 0);
    xassert(Y != null);
    xassert(Y.type == A_NONE);
    xassert(Y.dim > 0);
    xassert(X.dim == Y.dim);
    for (var memb = Y.head; memb != null; memb = memb.next)
    {  if (mpl_internal_find_tuple(mpl, X, memb.tuple) == null)
        mpl_internal_add_tuple(mpl, X, mpl_internal_copy_tuple(mpl, memb.tuple));
    }
    return X;
}

function mpl_internal_set_diff(mpl, X, Y){
    xassert(X != null);
    xassert(X.type == A_NONE);
    xassert(X.dim > 0);
    xassert(Y != null);
    xassert(Y.type == A_NONE);
    xassert(Y.dim > 0);
    xassert(X.dim == Y.dim);
    var Z = mpl_internal_create_elemset(mpl, X.dim);
    for (var memb = X.head; memb != null; memb = memb.next)
    {  if (mpl_internal_find_tuple(mpl, Y, memb.tuple) == null)
        mpl_internal_add_tuple(mpl, Z, mpl_internal_copy_tuple(mpl, memb.tuple));
    }
    return Z;
}

function mpl_internal_set_symdiff(mpl, X, Y){
    var memb;
    xassert(X != null);
    xassert(X.type == A_NONE);
    xassert(X.dim > 0);
    xassert(Y != null);
    xassert(Y.type == A_NONE);
    xassert(Y.dim > 0);
    xassert(X.dim == Y.dim);
    /* Z := X \ Y */
    var Z = mpl_internal_create_elemset(mpl, X.dim);
    for (memb = X.head; memb != null; memb = memb.next)
    {  if (mpl_internal_find_tuple(mpl, Y, memb.tuple) == null)
        mpl_internal_add_tuple(mpl, Z, mpl_internal_copy_tuple(mpl, memb.tuple));
    }
    /* Z := Z U (Y \ X) */
    for (memb = Y.head; memb != null; memb = memb.next)
    {  if (mpl_internal_find_tuple(mpl, X, memb.tuple) == null)
        mpl_internal_add_tuple(mpl, Z, mpl_internal_copy_tuple(mpl, memb.tuple));
    }
    return Z;
}

function mpl_internal_set_inter(mpl, X, Y){
    xassert(X != null);
    xassert(X.type == A_NONE);
    xassert(X.dim > 0);
    xassert(Y != null);
    xassert(Y.type == A_NONE);
    xassert(Y.dim > 0);
    xassert(X.dim == Y.dim);
    var Z = mpl_internal_create_elemset(mpl, X.dim);
    for (var memb = X.head; memb != null; memb = memb.next)
    {  if (mpl_internal_find_tuple(mpl, Y, memb.tuple) != null)
        mpl_internal_add_tuple(mpl, Z, mpl_internal_copy_tuple(mpl, memb.tuple));
    }
    return Z;
}

function mpl_internal_set_cross(mpl, X, Y){
    var memx, memy;
    var tuple, temp;
    xassert(X != null);
    xassert(X.type == A_NONE);
    xassert(X.dim > 0);
    xassert(Y != null);
    xassert(Y.type == A_NONE);
    xassert(Y.dim > 0);
    var Z = mpl_internal_create_elemset(mpl, X.dim + Y.dim);
    for (memx = X.head; memx != null; memx = memx.next)
    {  for (memy = Y.head; memy != null; memy = memy.next)
    {  tuple = mpl_internal_copy_tuple(mpl, memx.tuple);
        for (temp = memy.tuple; temp != null; temp = temp.next)
            tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_copy_symbol(mpl,
                temp.sym));
        mpl_internal_add_tuple(mpl, Z, tuple);
    }
    }
    return Z;
}

/**********************************************************************/
/* * *                        LINEAR FORMS                        * * */
/**********************************************************************/

function mpl_internal_constant_term(mpl, coef){
    var form;
    if (coef == 0.0)
        form = null;
    else
    {   form = {};
        form.coef = coef;
        form.var_ = null;
        form.next = null;
    }
    return form;
}

function mpl_internal_single_variable(mpl, var_){
    xassert(var_ != null);
    var form = {};
    form.coef = 1.0;
    form.var_ = var_;
    form.next = null;
    return form;
}

function mpl_internal_copy_formula(mpl, form){
    var head, tail;
    if (form == null)
        head = null;
    else
    {  head = tail = {};
        for (; form != null; form = form.next)
        {  tail.coef = form.coef;
            tail.var_ = form.var_;
            if (form.next != null)
                tail = tail.next = {};
        }
        tail.next = null;
    }
    return head;
}

function mpl_internal_linear_comb(mpl, a, fx, b, fy){
    var form = null, term, temp;
    var c0 = 0.0;
    for (term = fx; term != null; term = term.next)
    {  if (term.var_ == null)
        c0 = mpl_internal_fp_add(mpl, c0, mpl_internal_fp_mul(mpl, a, term.coef));
    else
        term.var_.temp =
            mpl_internal_fp_add(mpl, term.var_.temp, mpl_internal_fp_mul(mpl, a, term.coef));
    }
    for (term = fy; term != null; term = term.next)
    {  if (term.var_ == null)
        c0 = mpl_internal_fp_add(mpl, c0, mpl_internal_fp_mul(mpl, b, term.coef));
    else
        term.var_.temp =
            mpl_internal_fp_add(mpl, term.var_.temp, mpl_internal_fp_mul(mpl, b, term.coef));
    }
    for (term = fx; term != null; term = term.next)
    {  if (term.var_ != null && term.var_.temp != 0.0)
    {  temp = {};
        temp.coef = term.var_.temp; temp.var_ = term.var_;
        temp.next = form; form = temp;
        term.var_.temp = 0.0;
    }
    }
    for (term = fy; term != null; term = term.next)
    {  if (term.var_ != null && term.var_.temp != 0.0)
    {  temp = {};
        temp.coef = term.var_.temp; temp.var_ = term.var_;
        temp.next = form; form = temp;
        term.var_.temp = 0.0;
    }
    }
    if (c0 != 0.0)
    {  temp = {};
        temp.coef = c0; temp.var_ = null;
        temp.next = form; form = temp;
    }
    return form;
}

function mpl_internal_remove_constant(mpl, form, callback){
    var head = null, temp;
    var coef = 0.0;
    while (form != null)
    {  temp = form;
        form = form.next;
        if (temp.var_ == null)
        {  /* constant term */
            coef = mpl_internal_fp_add(mpl, coef, temp.coef);
        }
        else
        {  /* linear term */
            temp.next = head;
            head = temp;
        }
    }
    callback(coef);
    return head;
}

function mpl_internal_reduce_terms(mpl, form){
    var term, next_term;
    var c0 = 0.0;
    for (term = form; term != null; term = term.next)
    {  if (term.var_ == null)
        c0 = mpl_internal_fp_add(mpl, c0, term.coef);
    else
        term.var_.temp = mpl_internal_fp_add(mpl, term.var_.temp, term.coef);
    }
    next_term = form; form = null;
    for (term = next_term; term != null; term = next_term)
    {  next_term = term.next;
        if (term.var_ == null && c0 != 0.0)
        {  term.coef = c0; c0 = 0.0;
            term.next = form; form = term;
        }
        else if (term.var_ != null && term.var_.temp != 0.0)
        {  term.coef = term.var_.temp; term.var_.temp = 0.0;
            term.next = form; form = term;
        }
    }
    return form;
}

/**********************************************************************/
/* * *                       GENERIC VALUES                       * * */
/**********************************************************************/

function mpl_internal_delete_value(mpl, type, value){
    xassert(value != null);
    switch (type)
    {   case A_NONE:
        value.none = null;
        break;
        case A_NUMERIC:
            value.num = 0.0;
            break;
        case A_SYMBOLIC:
            value.sym = null;
            break;
        case A_LOGICAL:
            value.bit = 0;
            break;
        case A_TUPLE:
            value.tuple = null;
            break;
        case A_ELEMSET:
            value.set = null;
            break;
        case A_ELEMVAR:
            value.var_ = null;
            break;
        case A_FORMULA:
            value.form = null;
            break;
        case A_ELEMCON:
            value.con = null;
            break;
        default:
            xassert(type != type);
    }
}

/**********************************************************************/
/* * *                SYMBOLICALLY INDEXED ARRAYS                 * * */
/**********************************************************************/

function mpl_internal_create_array(mpl, type, dim){
    xassert(type == A_NONE || type == A_NUMERIC ||
        type == A_SYMBOLIC || type == A_ELEMSET ||
        type == A_ELEMVAR || type == A_ELEMCON);
    xassert(dim >= 0);
    var array = {};
    array.type = type;
    array.dim = dim;
    array.size = 0;
    array.head = null;
    array.tail = null;
    array.tree = false;
    array.prev = null;
    array.next = mpl.a_list;
    /* include the array in the global array list */
    if (array.next != null) array.next.prev = array;
    mpl.a_list = array;
    return array;
}

function mpl_internal_compare_member_tuples(info, key1, key2){
    /* this is an auxiliary routine used to compare keys, which are
     n-tuples assigned to array members */
    return mpl_internal_compare_tuples(info, key1, key2);
}

function mpl_internal_find_member(mpl, array, tuple){
    var memb;
    xassert(array != null);
    /* the n-tuple must have the same dimension as the array */
    xassert(mpl_internal_tuple_dimen(mpl, tuple) == array.dim);
    /* if the array is large enough, create the search tree and index
     all existing members of the array */
    if (array.size > 30 && !array.tree)
    {  //array.tree = {};
        for (memb = array.head; memb != null; memb = memb.next)
            memb.tuple.memb = memb;
        //array.tree[memb.tuple] = {link: memb};
    }
    /* find a member, which has the given tuple */
    if (!array.tree)
    {  /* the search tree doesn't exist; use the linear search */
        for (memb = array.head; memb != null; memb = memb.next)
            if (mpl_internal_compare_tuples(mpl, memb.tuple, tuple) == 0) break;
    }
    else
    {  /* the search tree exists; use the binary search */
        var node = tuple.memb;
        memb = (node == null ? null : node.link);
    }
    return memb;
}

function mpl_internal_add_member(mpl, array, tuple){
    xassert(array != null);
    /* the n-tuple must have the same dimension as the array */
    xassert(mpl_internal_tuple_dimen(mpl, tuple) == array.dim);
    /* create new member */
    var memb = {};
    memb.tuple = tuple;
    memb.next = null;
    memb.value = {};
    /* and append it to the member list */
    array.size++;
    if (array.head == null)
        array.head = memb;
    else
        array.tail.next = memb;
    array.tail = memb;
    /* if the search tree exists, index the new member */
    if (array.tree)
        memb.tuple.memb = memb;
    return memb;
}

/**********************************************************************/
/* * *                 DOMAINS AND DUMMY INDICES                  * * */
/**********************************************************************/

function mpl_internal_assign_dummy_index(mpl, slot, value){
    var leaf, code;
    xassert(slot != null);
    xassert(value != null);
    /* delete the current value assigned to the dummy index */
    if (slot.value != null)
    {  /* if the current value and the new one are identical, actual
     assignment is not needed */
        if (mpl_internal_compare_symbols(mpl, slot.value, value) == 0) return;
        /* delete a symbol, which is the current value */
        slot.value = null;
    }
    /* now walk through all the pseudo-codes with op = O_INDEX, which
     refer to the dummy index to be changed (these pseudo-codes are
     leaves in the forest of *all* expressions in the database) */
    for (leaf = slot.list; leaf != null; leaf = leaf.arg.index.
        next)
    {  xassert(leaf.op == O_INDEX);
        /* invalidate all resultant values, which depend on the dummy
         index, walking from the current leaf toward the root of the
         corresponding expression tree */
        for (code = leaf; code != null; code = code.up)
        {  if (code.valid)
        {  /* invalidate and delete resultant value */
            code.valid = 0;
            mpl_internal_delete_value(mpl, code.type, code.value);
        }
        }
    }
    /* assign new value to the dummy index */
    slot.value = mpl_internal_copy_symbol(mpl, value);
}

function mpl_internal_update_dummy_indices(mpl, block){
    var slot;
    var temp;
    if (block.backup != null)
    {  for (slot = block.list, temp = block.backup; slot != null;
            slot = slot.next, temp = temp.next)
    {   xassert(temp != null);
        xassert(temp.sym != null);
        mpl_internal_assign_dummy_index(mpl, slot, temp.sym);
    }
    }
}

function mpl_internal_enter_domain_block(mpl, block, tuple, info, func){
    var backup;
    var ret = 0;
    /* check if the given n-tuple is a member of the basic set */
    xassert(block.code != null);
    if (!mpl_internal_is_member(mpl, block.code, tuple))
    {  ret = 1;
        return ret;
    }
    /* save reference to "backup" n-tuple, which was used to assign
     current values of the dummy indices (it is sufficient to save
     reference, not value, because that n-tuple is defined in some
     outer level of recursion and therefore cannot be changed on
     this and deeper recursive calls) */
    backup = block.backup;
    /* set up new "backup" n-tuple, which defines new values of the
     dummy indices */
    block.backup = tuple;
    /* assign new values to the dummy indices */
    mpl_internal_update_dummy_indices(mpl, block);
    /* call the formal routine that does the rest part of the job */
    func(mpl, info);
    /* restore reference to the former "backup" n-tuple */
    block.backup = backup;
    /* restore former values of the dummy indices; note that if the
     domain block just escaped has no other active instances which
     may exist due to recursion (it is indicated by a null pointer
     to the former n-tuple), former values of the dummy indices are
     undefined; therefore in this case the routine keeps currently
     assigned values of the dummy indices that involves keeping all
     dependent temporary results and thereby, if this domain block
     is not used recursively, allows improving efficiency */
    mpl_internal_update_dummy_indices(mpl, block);
    return ret;
}

function mpl_internal_eval_domain_func(mpl, my_info)
{     /* this routine recursively enters into the domain scope and then
 calls the routine func */
    if (my_info.block != null)
    {  /* the current domain block to be entered exists */
        var block;
        var slot;
        var tuple = null, temp = null;
        /* save pointer to the current domain block */
        block = my_info.block;
        /* and get ready to enter the next block (if it exists) */
        my_info.block = block.next;
        /* construct temporary n-tuple, whose components correspond to
         dummy indices (slots) of the current domain; components of
         the temporary n-tuple that correspond to free dummy indices
         are assigned references (not values!) to symbols specified
         in the corresponding components of the given n-tuple, while
         other components that correspond to non-free dummy indices
         are assigned symbolic values computed here */
        for (slot = block.list; slot != null; slot = slot.next)
        {  /* create component that corresponds to the current slot */
            if (tuple == null)
                tuple = temp = {};
            else
                temp = temp.next = {};
            if (slot.code == null)
            {  /* dummy index is free; take reference to symbol, which
             is specified in the corresponding component of given
             n-tuple */
                xassert(my_info.tuple != null);
                temp.sym = my_info.tuple.sym;
                xassert(temp.sym != null);
                my_info.tuple = my_info.tuple.next;
            }
            else
            {  /* dummy index is non-free; compute symbolic value to be
             temporarily assigned to the dummy index */
                temp.sym = mpl_internal_eval_symbolic(mpl, slot.code);
            }
        }
        temp.next = null;
        /* enter the current domain block */
        if (mpl_internal_enter_domain_block(mpl, block, tuple, my_info,
            mpl_internal_eval_domain_func)) my_info.failure = 1;
        /* delete temporary n-tuple as well as symbols that correspond
         to non-free dummy indices (they were computed here) */
        for (slot = block.list; slot != null; slot = slot.next)
        {  xassert(tuple != null);
            temp = tuple;
            tuple = tuple.next;
        }
    }
    else
    {  /* there are no more domain blocks, i.e. we have reached the
     domain scope */
        xassert(my_info.tuple == null);
        /* check optional predicate specified for the domain */
        if (my_info.domain.code != null && !mpl_internal_eval_logical(mpl,
            my_info.domain.code))
        {  /* the predicate is false */
            my_info.failure = 2;
        }
        else
        {  /* the predicate is true; do the job */
            my_info.func(mpl, my_info.info);
        }
    }
}

function mpl_internal_eval_within_domain(mpl, domain, tuple, info, func){
    /* this routine performs evaluation within domain scope */
    var my_info = {};
    if (domain == null)
    {   xassert(tuple == null);
        func(mpl, info);
        my_info.failure = 0;
    }
    else
    {   xassert(tuple != null);
        my_info.domain = domain;
        my_info.block = domain.list;
        my_info.tuple = tuple;
        my_info.info = info;
        my_info.func = func;
        my_info.failure = 0;
        /* enter the very first domain block */
        mpl_internal_eval_domain_func(mpl, my_info);
    }
    return my_info.failure;
}

function mpl_internal_loop_domain_func(mpl, my_info){
    /* this routine enumerates all n-tuples in the basic set of the
     current domain block, enters recursively into the domain scope
     for every n-tuple, and then calls the routine func */
    if (my_info.block != null)
    {  /* the current domain block to be entered exists */
        var block;
        var slot;
        var bound;
        /* save pointer to the current domain block */
        block = my_info.block;
        /* and get ready to enter the next block (if it exists) */
        my_info.block = block.next;
        /* compute symbolic values, at which non-free dummy indices of
         the current domain block are bound; since that values don't
         depend on free dummy indices of the current block, they can
         be computed once out of the enumeration loop */
        bound = null;
        for (slot = block.list; slot != null; slot = slot.next)
        {  if (slot.code != null)
            bound = mpl_internal_expand_tuple(mpl, bound, mpl_internal_eval_symbolic(mpl,
                slot.code));
        }
        /* start enumeration */
        xassert(block.code != null);
        if (block.code.op == O_DOTS)
        {  /* the basic set is "arithmetic", in which case it doesn't
         need to be computed explicitly */
            var tuple;
            var n, j;
            var t0, tf, dt;
            /* compute "parameters" of the basic set */
            t0 = mpl_internal_eval_numeric(mpl, block.code.arg.arg.x);
            tf = mpl_internal_eval_numeric(mpl, block.code.arg.arg.y);
            if (block.code.arg.arg.z == null)
                dt = 1.0;
            else
                dt = mpl_internal_eval_numeric(mpl, block.code.arg.arg.z);
            /* determine cardinality of the basic set */
            n = mpl_internal_arelset_size(mpl, t0, tf, dt);
            /* create dummy 1-tuple for members of the basic set */
            tuple = mpl_internal_expand_tuple(mpl, null,
                mpl_internal_create_symbol_num(mpl, 0.0));
            /* in case of "arithmetic" set there is exactly one dummy
             index, which cannot be non-free */
            xassert(bound == null);
            /* walk through 1-tuples of the basic set */
            for (j = 1; j <= n && my_info.looping; j++)
            {  /* construct dummy 1-tuple for the current member */
                tuple.sym.num = mpl_internal_arelset_member(mpl, t0, tf, dt, j);
                /* enter the current domain block */
                mpl_internal_enter_domain_block(mpl, block, tuple, my_info,
                    mpl_internal_loop_domain_func);
            }
        }
        else
        {  /* the basic set is of general kind, in which case it needs
         to be explicitly computed */
            var set;
            var memb;
            var temp1, temp2;
            /* compute the basic set */
            set = mpl_internal_eval_elemset(mpl, block.code);
            /* walk through all n-tuples of the basic set */
            for (memb = set.head; memb != null && my_info.looping;
                 memb = memb.next)
            {  /* all components of the current n-tuple that correspond
             to non-free dummy indices must be feasible; otherwise
             the n-tuple is not in the basic set */
                temp1 = memb.tuple;
                temp2 = bound;
                var found = false;
                for (slot = block.list; slot != null; slot = slot.next)
                {  xassert(temp1 != null);
                    if (slot.code != null)
                    {  /* non-free dummy index */
                        xassert(temp2 != null);
                        if (mpl_internal_compare_symbols(mpl, temp1.sym, temp2.sym)
                            != 0)
                        {  /* the n-tuple is not in the basic set */
                            found = true;
                            break;
                        }
                        temp2 = temp2.next;
                    }
                    temp1 = temp1.next;
                }
                if (!found){
                    xassert(temp1 == null);
                    xassert(temp2 == null);
                    /* enter the current domain block */
                    mpl_internal_enter_domain_block(mpl, block, memb.tuple, my_info,
                        mpl_internal_loop_domain_func);
                }
            }
        }
        /* restore pointer to the current domain block */
        my_info.block = block;
    }
    else
    {  /* there are no more domain blocks, i.e. we have reached the
     domain scope */
        /* check optional predicate specified for the domain */
        if (my_info.domain.code != null && !mpl_internal_eval_logical(mpl,
            my_info.domain.code))
        {  /* the predicate is false */
            /* nop */
        }
        else
        {  /* the predicate is true; do the job */
            my_info.looping = !my_info.func(mpl, my_info.info);
        }
    }
}

function mpl_internal_loop_within_domain(mpl, domain, info, func){
    /* this routine performs iterations within domain scope */
    var my_info = {};
    if (domain == null)
        func(mpl, info);
    else
    {   my_info.domain = domain;
        my_info.block = domain.list;
        my_info.looping = 1;
        my_info.info = info;
        my_info.func = func;
        /* enter the very first domain block */
        mpl_internal_loop_domain_func(mpl, my_info);
    }
}

function mpl_internal_out_of_domain(mpl, name, tuple){
    xassert(name != null);
    xassert(tuple != null);
    mpl_internal_error(mpl, name + mpl_internal_format_tuple(mpl, '[', tuple) + " out of domain");
}

function mpl_internal_get_domain_tuple(mpl, domain){
    var tuple = null;
    if (domain != null)
    {  for (var block = domain.list; block != null; block = block.next)
    {  for (var slot = block.list; slot != null; slot = slot.next)
    {  if (slot.code == null)
    {  xassert(slot.value != null);
        tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_copy_symbol(mpl,
            slot.value));
    }
    }
    }
    }
    return tuple;
}

/**********************************************************************/
/* * *                         MODEL SETS                         * * */
/**********************************************************************/

function mpl_internal_check_elem_set(mpl, set, tuple, refer){
    /* elemental set must be within all specified supersets */
    for (var within = set.within, eqno = 1; within != null; within =
        within.next, eqno++)
    {  xassert(within.code != null);
        for (var memb = refer.head; memb != null; memb = memb.next)
        {  if (!mpl_internal_is_member(mpl, within.code, memb.tuple))
        {   var buf = mpl_internal_format_tuple(mpl, '(', memb.tuple);
            xassert(buf.length < 255);
            mpl_internal_error(mpl, set.name + mpl_internal_format_tuple(mpl, '[', tuple) +
                " contains " + buf + " which not within specified set; see (" + eqno + ")");
        }
        }
    }
}

function mpl_internal_take_member_set(mpl, set, tuple){
    var refer;
    /* find member in the set array */
    var memb = mpl_internal_find_member(mpl, set.array, tuple);

    function add(){
        /* check that the elemental set satisfies to all restrictions,
         assign it to new member, and add the member to the array */
        mpl_internal_check_elem_set(mpl, set, tuple, refer);
        memb = mpl_internal_add_member(mpl, set.array, mpl_internal_copy_tuple(mpl, tuple));
        memb.value.set = refer;
    }


    if (memb != null)
    {  /* member exists, so just take the reference */
        refer = memb.value.set;
    }
    else if (set.assign != null)
    {  /* compute value using assignment expression */
        refer = mpl_internal_eval_elemset(mpl, set.assign);
        add();
    }
    else if (set.option != null)
    {  /* compute default elemental set */
        refer = mpl_internal_eval_elemset(mpl, set.option);
        add();
    }
    else
    {  /* no value (elemental set) is provided */
        mpl_internal_error(mpl, "no value for " + set.name + mpl_internal_format_tuple(mpl, '[', tuple));
    }
    return refer;
}

function mpl_internal_eval_set_func(mpl, info){
    /* this is auxiliary routine to work within domain scope */
    if (info.memb != null)
    {  /* checking call; check elemental set being assigned */
        mpl_internal_check_elem_set(mpl, info.set, info.memb.tuple,
            info.memb.value.set);
    }
    else
    {  /* normal call; evaluate member, which has given n-tuple */
        info.refer = mpl_internal_take_member_set(mpl, info.set, info.tuple);
    }
}

function mpl_internal_saturate_set(mpl, set){
    var gadget = set.gadget;
    var data;
    var elem, memb;
    var tuple, work = new Array(20);
    var i;
    xprintf("Generating " + set.name + "...");
    mpl_internal_eval_whole_set(mpl, gadget.set);
    /* gadget set must have exactly one member */
    xassert(gadget.set.array != null);
    xassert(gadget.set.array.head != null);
    xassert(gadget.set.array.head == gadget.set.array.tail);
    data = gadget.set.array.head.value.set;
    xassert(data.type == A_NONE);
    xassert(data.dim == gadget.set.dimen);
    /* walk thru all elements of the plain set */
    for (elem = data.head; elem != null; elem = elem.next)
    {  /* create a copy of n-tuple */
        tuple = mpl_internal_copy_tuple(mpl, elem.tuple);
        /* rearrange component of the n-tuple */
        for (i = 0; i < gadget.set.dimen; i++)
            work[i] = null;
        for (i = 0; tuple != null; tuple = tuple.next)
            work[gadget.ind[i++]-1] = tuple;
        xassert(i == gadget.set.dimen);
        for (i = 0; i < gadget.set.dimen; i++)
        {  xassert(work[i] != null);
            work[i].next = work[i+1];
        }
        /* construct subscript list from first set.dim components */
        if (set.dim == 0)
            tuple = null;
        else {
            tuple = work[0]; work[set.dim-1].next = null;
        }
        /* find corresponding member of the set to be initialized */
        memb = mpl_internal_find_member(mpl, set.array, tuple);
        if (memb == null)
        {  /* not found; add new member to the set and assign it empty
         elemental set */
            memb = mpl_internal_add_member(mpl, set.array, tuple);
            memb.value.set = mpl_internal_create_elemset(mpl, set.dimen);
        }
        /* construct new n-tuple from rest set.dimen components */
        tuple = work[set.dim];
        xassert(set.dim + set.dimen == gadget.set.dimen);
        work[gadget.set.dimen-1].next = null;
        /* and add it to the elemental set assigned to the member
         (no check for duplicates is needed) */
        mpl_internal_add_tuple(mpl, memb.value.set, tuple);
    }
    /* the set has been saturated with data */
    set.data = 1;
}

function mpl_internal_eval_member_set(mpl, set, tuple){
    /* this routine evaluates set member */
    var info = {};
    xassert(set.dim == mpl_internal_tuple_dimen(mpl, tuple));
    info.set = set;
    info.tuple = tuple;
    if (set.gadget != null && set.data == 0)
    {  /* initialize the set with data from a plain set */
        mpl_internal_saturate_set(mpl, set);
    }
    if (set.data == 1)
    {  /* check data, which are provided in the data section, but not
     checked yet */
        /* save pointer to the last array member; note that during the
         check new members may be added beyond the last member due to
         references to the same parameter from default expression as
         well as from expressions that define restricting supersets;
         however, values assigned to the new members will be checked
         by other routine, so we don't need to check them here */
        var tail = set.array.tail;
        /* change the data status to prevent infinite recursive loop
         due to references to the same set during the check */
        set.data = 2;
        /* check elemental sets assigned to array members in the data
         section until the marked member has been reached */
        for (info.memb = set.array.head; info.memb != null;
             info.memb = info.memb.next)
        {  if (mpl_internal_eval_within_domain(mpl, set.domain, info.memb.tuple,
            info, mpl_internal_eval_set_func))
            mpl_internal_out_of_domain(mpl, set.name, info.memb.tuple);
            if (info.memb == tail) break;
        }
        /* the check has been finished */
    }
    /* evaluate member, which has given n-tuple */
    info.memb = null;
    if (mpl_internal_eval_within_domain(mpl, info.set.domain, info.tuple, info,
        mpl_internal_eval_set_func))
        mpl_internal_out_of_domain(mpl, set.name, info.tuple);
    /* bring evaluated reference to the calling program */
    return info.refer;
}

function mpl_internal_whole_set_func(mpl, info){
    /* this is auxiliary routine to work within domain scope */
    var tuple = mpl_internal_get_domain_tuple(mpl, info.domain);
    mpl_internal_eval_member_set(mpl, info, tuple);
    return 0;
}

function mpl_internal_eval_whole_set(mpl, set){
    mpl_internal_loop_within_domain(mpl, set.domain, set, mpl_internal_whole_set_func);
}

/**********************************************************************/
/* * *                      MODEL PARAMETERS                      * * */
/**********************************************************************/

function mpl_internal_check_value_num(mpl, par, tuple, value){
    var cond;
    var eqno;
    /* the value must satisfy to the parameter type */
    switch (par.type)
    {   case A_NUMERIC:
        break;
        case A_INTEGER:
            if (value != Math.floor(value))
                mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " = " + value + " not integer");
            break;
        case A_BINARY:
            if (!(value == 0.0 || value == 1.0))
                mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " = " + value + " not binary");
            break;
        default:
            xassert(par != par);
    }
    /* the value must satisfy to all specified conditions */
    for (cond = par.cond, eqno = 1; cond != null; cond = cond.next,
        eqno++)
    {   var bound;
        //var rho;
        xassert(cond.code != null);
        bound = mpl_internal_eval_numeric(mpl, cond.code);

        function err(rho){mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " = " + value + " not " + rho + " " + bound + "; see (" + eqno + ")")}

        switch (cond.rho)
        {   case O_LT:
            if (!(value < bound))
                err("<");
            break;
            case O_LE:
                if (!(value <= bound)) err("<=");
                break;
            case O_EQ:
                if (!(value == bound)) err("=");
                break;
            case O_GE:
                if (!(value >= bound)) err(">=");
                break;
            case O_GT:
                if (!(value > bound)) err(">");
                break;
            case O_NE:
                if (!(value != bound)) err("<>");
                break;
            default:
                xassert(cond != cond);
        }
    }
    /* the value must be in_ all specified supersets */
    eqno = 1;
    for (var in_ = par.in_; in_ != null; in_ = in_.next, eqno++)
    {
        xassert(in_.code != null);
        xassert(in_.code.dim == 1);
        var dummy = mpl_internal_expand_tuple(mpl, null,
            mpl_internal_create_symbol_num(mpl, value));
        if (!mpl_internal_is_member(mpl, in_.code, dummy))
            mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " = " + value + " not in specified set; see (" + eqno + ")");
    }
}

function mpl_internal_take_member_num(mpl, par, tuple){
    /* find member in the parameter array */
    var memb = mpl_internal_find_member(mpl, par.array, tuple);

    function add(value){
        /* check that the value satisfies to all restrictions, assign
         it to new member, and add the member to the array */
        mpl_internal_check_value_num(mpl, par, tuple, value);
        memb = mpl_internal_add_member(mpl, par.array, mpl_internal_copy_tuple(mpl, tuple));
        memb.value.num = value;
        return value;
    }

    if (memb != null)
    /* member exists, so just take its value */
        return memb.value.num;
    else if (par.assign != null)
    /* compute value using assignment expression */
        return add(mpl_internal_eval_numeric(mpl, par.assign));
    else if (par.option != null)
    /* compute default value */
        return add(mpl_internal_eval_numeric(mpl, par.option));
    else if (par.defval != null)
    {   /* take default value provided in the data section */
        if (par.defval.str != null)
            mpl_internal_error(mpl, "cannot convert " + mpl_internal_format_symbol(mpl, par.defval) + " to floating-point number");
        return add(par.defval.num);
    }
    else
    /* no value is provided */
        return mpl_internal_error(mpl, "no value for " + par.name + mpl_internal_format_tuple(mpl, '[', tuple));
}

function mpl_internal_eval_num_func(mpl, info){
    /* this is auxiliary routine to work within domain scope */
    if (info.memb != null)
    {  /* checking call; check numeric value being assigned */
        mpl_internal_check_value_num(mpl, info.par, info.memb.tuple,
            info.memb.value.num);
    }
    else
    {  /* normal call; evaluate member, which has given n-tuple */
        info.value = mpl_internal_take_member_num(mpl, info.par, info.tuple);
    }
}

function mpl_internal_eval_member_num(mpl, par, tuple){
    /* this routine evaluates numeric parameter member */
    var info = {};
    xassert(par.type == A_NUMERIC || par.type == A_INTEGER ||
        par.type == A_BINARY);
    xassert(par.dim == mpl_internal_tuple_dimen(mpl, tuple));
    info.par = par;
    info.tuple = tuple;
    if (par.data == 1)
    {  /* check data, which are provided in the data section, but not
     checked yet */
        /* save pointer to the last array member; note that during the
         check new members may be added beyond the last member due to
         references to the same parameter from default expression as
         well as from expressions that define restricting conditions;
         however, values assigned to the new members will be checked
         by other routine, so we don't need to check them here */
        var tail = par.array.tail;
        /* change the data status to prevent infinite recursive loop
         due to references to the same parameter during the check */
        par.data = 2;
        /* check values assigned to array members in the data section
         until the marked member has been reached */
        for (info.memb = par.array.head; info.memb != null;
             info.memb = info.memb.next)
        {  if (mpl_internal_eval_within_domain(mpl, par.domain, info.memb.tuple,
            info, mpl_internal_eval_num_func))
            mpl_internal_out_of_domain(mpl, par.name, info.memb.tuple);
            if (info.memb == tail) break;
        }
        /* the check has been finished */
    }
    /* evaluate member, which has given n-tuple */
    info.memb = null;
    if (mpl_internal_eval_within_domain(mpl, info.par.domain, info.tuple, info,
        mpl_internal_eval_num_func))
        mpl_internal_out_of_domain(mpl, par.name, info.tuple);
    /* bring evaluated value to the calling program */
    return info.value;
}

function mpl_internal_check_value_sym(mpl, par, tuple, value){
    var in_;
    var eqno = 1;
    /* the value must satisfy to all specified conditions */
    for (var cond = par.cond; cond != null; cond = cond.next,
        eqno++)
    {
        var buf; // 255
        xassert(cond.code != null);
        var bound = mpl_internal_eval_symbolic(mpl, cond.code);
        switch (cond.rho)
        {
            case O_LT:
                if (!(mpl_internal_compare_symbols(mpl, value, bound) < 0))
                {   buf = mpl_internal_format_symbol(mpl, bound);
                    xassert(buf.length <= 255);
                    mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " = " +
                        mpl_internal_format_symbol(mpl, value) + " not < " + buf);
                }
                break;
            case O_LE:
                if (!(mpl_internal_compare_symbols(mpl, value, bound) <= 0))
                {   buf = mpl_internal_format_symbol(mpl, bound);
                    xassert(buf.length <= 255);
                    mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " = " +
                        mpl_internal_format_symbol(mpl, value) + " not <= " + buf);
                }
                break;
            case O_EQ:
                if (!(mpl_internal_compare_symbols(mpl, value, bound) == 0))
                {   buf = mpl_internal_format_symbol(mpl, bound);
                    xassert(buf.length <= 255);
                    mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " = " +
                        mpl_internal_format_symbol(mpl, value) + " not = " + buf);
                }
                break;
            case O_GE:
                if (!(mpl_internal_compare_symbols(mpl, value, bound) >= 0))
                {   buf = mpl_internal_format_symbol(mpl, bound);
                    xassert(buf.length <= 255);
                    mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " = " +
                        mpl_internal_format_symbol(mpl, value) + " not >= " + buf);
                }
                break;
            case O_GT:
                if (!(mpl_internal_compare_symbols(mpl, value, bound) > 0))
                {   buf = mpl_internal_format_symbol(mpl, bound);
                    xassert(buf.length <= 255);
                    mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " = " +
                        mpl_internal_format_symbol(mpl, value) + " not > " + buf);
                }
                break;
            case O_NE:
                if (!(mpl_internal_compare_symbols(mpl, value, bound) != 0))
                {   buf = mpl_internal_format_symbol(mpl, bound);
                    xassert(buf.length <= 255);
                    mpl_internal_error(mpl, par.name + mpl_internal_format_tuple(mpl, '[', tuple) + " <> " +
                        mpl_internal_format_symbol(mpl, value) + " not > " + buf);
                }
                break;
            default:
                xassert(cond != cond);
        }
    }
    /* the value must be in all specified supersets */
    eqno = 1;
    for (in_ = par.in_; in_ != null; in_ = in_.next, eqno++)
    {
        xassert(in_.code != null);
        xassert(in_.code.dim == 1);
        var dummy = mpl_internal_expand_tuple(mpl, null, mpl_internal_copy_symbol(mpl,
            value));
        if (!mpl_internal_is_member(mpl, in_.code, dummy))
            mpl_internal_error(mpl, par.name, mpl_internal_format_tuple(mpl, '[', tuple) + " = " + mpl_internal_format_symbol(mpl, value) + " not in specified set; see (" + eqno + ")");
    }
}

function mpl_internal_take_member_sym(mpl, par, tuple){
    /* find member in the parameter array */
    var memb = mpl_internal_find_member(mpl, par.array, tuple);

    function add(value){
        /* check that the value satisfies to all restrictions, assign
         it to new member, and add the member to the array */
        mpl_internal_check_value_sym(mpl, par, tuple, value);
        memb = mpl_internal_add_member(mpl, par.array, mpl_internal_copy_tuple(mpl, tuple));
        memb.value.sym = mpl_internal_copy_symbol(mpl, value);
        return value;
    }

    if (memb != null)
    {  /* member exists, so just take its value */
        return mpl_internal_copy_symbol(mpl, memb.value.sym);
    }
    else if (par.assign != null)
    /* compute value using assignment expression */
        return add(mpl_internal_eval_symbolic(mpl, par.assign));
    else if (par.option != null)
    /* compute default value */
        return add(mpl_internal_eval_symbolic(mpl, par.option));
    else if (par.defval != null)
    /* take default value provided in the data section */
        return(mpl_internal_copy_symbol(mpl, par.defval));
    else
    /* no value is provided */
        return mpl_internal_error(mpl, "no value for " + par.name + mpl_internal_format_tuple(mpl, '[', tuple));
}

function mpl_internal_eval_sym_func(mpl, info)
{     /* this is auxiliary routine to work within domain scope */
    if (info.memb != null)
    {  /* checking call; check symbolic value being assigned */
        mpl_internal_check_value_sym(mpl, info.par, info.memb.tuple,
            info.memb.value.sym);
    }
    else
    {  /* normal call; evaluate member, which has given n-tuple */
        info.value = mpl_internal_take_member_sym(mpl, info.par, info.tuple);
    }
}

function mpl_internal_eval_member_sym(mpl, par, tuple){
    /* this routine evaluates symbolic parameter member */
    var info = {};
    xassert(par.type == A_SYMBOLIC);
    xassert(par.dim == mpl_internal_tuple_dimen(mpl, tuple));
    info.par = par;
    info.tuple = tuple;
    if (par.data == 1)
    {  /* check data, which are provided in the data section, but not
     checked yet */
        /* save pointer to the last array member; note that during the
         check new members may be added beyond the last member due to
         references to the same parameter from default expression as
         well as from expressions that define restricting conditions;
         however, values assigned to the new members will be checked
         by other routine, so we don't need to check them here */
        var tail = par.array.tail;
        /* change the data status to prevent infinite recursive loop
         due to references to the same parameter during the check */
        par.data = 2;
        /* check values assigned to array members in the data section
         until the marked member has been reached */
        for (info.memb = par.array.head; info.memb != null;
             info.memb = info.memb.next)
        {  if (mpl_internal_eval_within_domain(mpl, par.domain, info.memb.tuple,
            info, mpl_internal_eval_sym_func))
            mpl_internal_out_of_domain(mpl, par.name, info.memb.tuple);
            if (info.memb == tail) break;
        }
        /* the check has been finished */
    }
    /* evaluate member, which has given n-tuple */
    info.memb = null;
    if (mpl_internal_eval_within_domain(mpl, info.par.domain, info.tuple, info,
        mpl_internal_eval_sym_func))
        mpl_internal_out_of_domain(mpl, par.name, info.tuple);
    /* bring evaluated value to the calling program */
    return info.value;
}

function mpl_internal_whole_par_func(mpl, par){
    /* this is auxiliary routine to work within domain scope */
    var tuple = mpl_internal_get_domain_tuple(mpl, par.domain);
    switch (par.type)
    {   case A_NUMERIC:
        case A_INTEGER:
        case A_BINARY:
            mpl_internal_eval_member_num(mpl, par, tuple);
            break;
        case A_SYMBOLIC:
            mpl_internal_eval_member_sym(mpl, par, tuple);
            break;
        default:
            xassert(par != par);
    }
    return 0;
}

function mpl_internal_eval_whole_par(mpl, par){
    mpl_internal_loop_within_domain(mpl, par.domain, par, mpl_internal_whole_par_func);
}

/**********************************************************************/
/* * *                      MODEL VARIABLES                       * * */
/**********************************************************************/

function mpl_internal_take_member_var(mpl, var_, tuple){
    var refer;
    /* find member in the variable array */
    var memb = mpl_internal_find_member(mpl, var_.array, tuple);
    if (memb != null)
    {  /* member exists, so just take the reference */
        refer = memb.value.var_;
    }
    else
    {  /* member is referenced for the first time and therefore does
     not exist; create new elemental variable, assign it to new
     member, and add the member to the variable array */
        memb = mpl_internal_add_member(mpl, var_.array, mpl_internal_copy_tuple(mpl, tuple));
        refer = memb.value.var_ = {};
        refer.j = 0;
        refer.var_ = var_;
        refer.memb = memb;
        /* compute lower bound */
        if (var_.lbnd == null)
            refer.lbnd = 0.0;
        else
            refer.lbnd = mpl_internal_eval_numeric(mpl, var_.lbnd);
        /* compute upper bound */
        if (var_.ubnd == null)
            refer.ubnd = 0.0;
        else if (var_.ubnd == var_.lbnd)
            refer.ubnd = refer.lbnd;
        else
            refer.ubnd = mpl_internal_eval_numeric(mpl, var_.ubnd);
        /* nullify working quantity */
        refer.temp = 0.0;
        /* solution has not been obtained by the solver yet */
        refer.stat = 0;
        refer.prim = refer.dual = 0.0;
    }
    return refer;
}

function mpl_internal_eval_var_func(mpl, info)
{
    /* this is auxiliary routine to work within domain scope */
    info.refer = mpl_internal_take_member_var(mpl, info.var_, info.tuple);
}

function mpl_internal_eval_member_var(mpl, var_, tuple){
    /* this routine evaluates variable member */
    var info = {};
    xassert(var_.dim == mpl_internal_tuple_dimen(mpl, tuple));
    info.var_ = var_;
    info.tuple = tuple;
    /* evaluate member, which has given n-tuple */
    if (mpl_internal_eval_within_domain(mpl, info.var_.domain, info.tuple, info, mpl_internal_eval_var_func))
        mpl_internal_out_of_domain(mpl, var_.name, info.tuple);
    /* bring evaluated reference to the calling program */
    return info.refer;
}

function mpl_internal_whole_var_func(mpl, var_){
    /* this is auxiliary routine to work within domain scope */
    var tuple = mpl_internal_get_domain_tuple(mpl, var_.domain);
    mpl_internal_eval_member_var(mpl, var_, tuple);
    return 0;
}

function mpl_internal_eval_whole_var(mpl, var_){
    mpl_internal_loop_within_domain(mpl, var_.domain, var_, mpl_internal_whole_var_func);
}

/**********************************************************************/
/* * *              MODEL CONSTRAINTS AND OBJECTIVES              * * */
/**********************************************************************/

function mpl_internal_take_member_con(mpl, con, tuple){
    var refer, temp = null;
    /* find member in the constraint array */
    var memb = mpl_internal_find_member(mpl, con.array, tuple);
    if (memb != null)
    {  /* member exists, so just take the reference */
        refer = memb.value.con;
    }
    else
    {  /* member is referenced for the first time and therefore does
     not exist; create new elemental constraint, assign it to new
     member, and add the member to the constraint array */
        memb = mpl_internal_add_member(mpl, con.array, mpl_internal_copy_tuple(mpl, tuple));
        refer = memb.value.con = {};
        refer.i = 0;
        refer.con = con;
        refer.memb = memb;
        /* compute linear form */
        xassert(con.code != null);
        refer.form = mpl_internal_eval_formula(mpl, con.code);
        /* compute lower and upper bounds */
        if (con.lbnd == null && con.ubnd == null)
        {  /* objective has no bounds */

            xassert(con.type == A_MINIMIZE || con.type == A_MAXIMIZE);
            /* carry the constant term to the right-hand side */
            refer.form = mpl_internal_remove_constant(mpl, refer.form, function(v){temp = v});
            refer.lbnd = refer.ubnd = - temp;
        }
        else if (con.lbnd != null && con.ubnd == null)
        {  /* constraint a * x + b >= c * y + d is transformed to the
         standard form a * x - c * y >= d - b */

            xassert(con.type == A_CONSTRAINT);
            refer.form = mpl_internal_linear_comb(mpl,
                +1.0, refer.form,
                -1.0, mpl_internal_eval_formula(mpl, con.lbnd));
            refer.form = mpl_internal_remove_constant(mpl, refer.form, function(v){temp = v});
            refer.lbnd = - temp;
            refer.ubnd = 0.0;
        }
        else if (con.lbnd == null && con.ubnd != null)
        {  /* constraint a * x + b <= c * y + d is transformed to the
         standard form a * x - c * y <= d - b */

            xassert(con.type == A_CONSTRAINT);
            refer.form = mpl_internal_linear_comb(mpl,
                +1.0, refer.form,
                -1.0, mpl_internal_eval_formula(mpl, con.ubnd));
            refer.form = mpl_internal_remove_constant(mpl, refer.form, function(v){temp = v});
            refer.lbnd = 0.0;
            refer.ubnd = - temp;
        }
        else if (con.lbnd == con.ubnd)
        {  /* constraint a * x + b = c * y + d is transformed to the
         standard form a * x - c * y = d - b */

            xassert(con.type == A_CONSTRAINT);
            refer.form = mpl_internal_linear_comb(mpl,
                +1.0, refer.form,
                -1.0, mpl_internal_eval_formula(mpl, con.lbnd));
            refer.form = mpl_internal_remove_constant(mpl, refer.form, function(v){temp = v});
            refer.lbnd = refer.ubnd = - temp;
        }
        else
        {  /* ranged constraint c <= a * x + b <= d is transformed to
         the standard form c - b <= a * x <= d - b */
            var temp1 = null, temp2 = null;
            xassert(con.type == A_CONSTRAINT);
            refer.form = mpl_internal_remove_constant(mpl, refer.form, function(v){temp = v});
            xassert(mpl_internal_remove_constant(mpl, mpl_internal_eval_formula(mpl, con.lbnd), function(v){temp1 = v}) == null);
            xassert(mpl_internal_remove_constant(mpl, mpl_internal_eval_formula(mpl, con.ubnd), function(v){temp2 = v}) == null);
            refer.lbnd = mpl_internal_fp_sub(mpl, temp1, temp);
            refer.ubnd = mpl_internal_fp_sub(mpl, temp2, temp);
        }
        /* solution has not been obtained by the solver yet */
        refer.stat = 0;
        refer.prim = refer.dual = 0.0;
    }
    return refer;
}

function mpl_internal_eval_con_func(mpl, info)
{     /* this is auxiliary routine to work within domain scope */
    info.refer = mpl_internal_take_member_con(mpl, info.con, info.tuple);
}

function mpl_internal_eval_member_con(mpl, con, tuple){
    /* this routine evaluates constraint member */
    var info = {};
    xassert(con.dim == mpl_internal_tuple_dimen(mpl, tuple));
    info.con = con;
    info.tuple = tuple;
    /* evaluate member, which has given n-tuple */
    if (mpl_internal_eval_within_domain(mpl, info.con.domain, info.tuple, info,
        mpl_internal_eval_con_func))
        mpl_internal_out_of_domain(mpl, con.name, info.tuple);
    /* bring evaluated reference to the calling program */
    return info.refer;
}

function mpl_internal_whole_con_func(mpl, con){
    /* this is auxiliary routine to work within domain scope */
    var tuple = mpl_internal_get_domain_tuple(mpl, con.domain);
    mpl_internal_eval_member_con(mpl, con, tuple);
    return 0;
}

function mpl_internal_eval_whole_con(mpl, con){
    mpl_internal_loop_within_domain(mpl, con.domain, con, mpl_internal_whole_con_func);
}

/**********************************************************************/
/* * *                        PSEUDO-CODE                         * * */
/**********************************************************************/

function mpl_internal_iter_num_func(mpl, info){
    /* this is auxiliary routine used to perform iterated operation
     on numeric "integrand" within domain scope */
    var temp = mpl_internal_eval_numeric(mpl, info.code.arg.loop.x);
    switch (info.code.op)
    {  case O_SUM:
        /* summation over domain */
        info.value = mpl_internal_fp_add(mpl, info.value, temp);
        break;
        case O_PROD:
            /* multiplication over domain */
            info.value = mpl_internal_fp_mul(mpl, info.value, temp);
            break;
        case O_MINIMUM:
            /* minimum over domain */
            if (info.value > temp) info.value = temp;
            break;
        case O_MAXIMUM:
            /* maximum over domain */
            if (info.value < temp) info.value = temp;
            break;
        default:
            xassert(info != info);
    }
    return 0;
}

function mpl_internal_eval_numeric(mpl, code){
    var value, tuple, e, sym, str, temp, info;
    xassert(code != null);
    xassert(code.type == A_NUMERIC);
    xassert(code.dim == 0);
    /* if the operation has a side effect, invalidate and delete the
     resultant value */
    if (code.vflag && code.valid)
    {  code.valid = 0;
        mpl_internal_delete_value(mpl, code.type, code.value);
    }
    /* if resultant value is valid, no evaluation is needed */
    if (code.valid)
    {  return code.value.num;
    }
    /* evaluate pseudo-code recursively */
    switch (code.op)
    {  case O_NUMBER:
        /* take floating-point number */
        value = code.arg.num;
        break;
        case O_MEMNUM:
            /* take member of numeric parameter */
        {
            tuple = null;
            for (e = code.arg.par.list; e != null; e = e.next)
                tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_eval_symbolic(mpl,
                    e.x));
            value = mpl_internal_eval_member_num(mpl, code.arg.par.par, tuple);
        }
            break;
        case O_MEMVAR:
            /* take computed value of elemental variable */
        {
            var var_;
            tuple = null;
            for (e = code.arg.var_.list; e != null; e = e.next)
                tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_eval_symbolic(mpl,
                    e.x));
            var_ = mpl_internal_eval_member_var(mpl, code.arg.var_.var_, tuple);
            switch (code.arg.var_.suff)
            {  case DOT_LB:
                if (var_.var_.lbnd == null)
                    value = -DBL_MAX;
                else
                    value = var_.lbnd;
                break;
                case DOT_UB:
                    if (var_.var_.ubnd == null)
                        value = +DBL_MAX;
                    else
                        value = var_.ubnd;
                    break;
                case DOT_STATUS:
                    value = var_.stat;
                    break;
                case DOT_VAL:
                    value = var_.prim;
                    break;
                case DOT_DUAL:
                    value = var_.dual;
                    break;
                default:
                    xassert(code != code);
            }
        }
            break;
        case O_MEMCON:
            /* take computed value of elemental constraint */
        {
            var con;
            tuple = null;
            for (e = code.arg.con.list; e != null; e = e.next)
                tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_eval_symbolic(mpl,
                    e.x));
            con = mpl_internal_eval_member_con(mpl, code.arg.con.con, tuple);
            switch (code.arg.con.suff)
            {  case DOT_LB:
                if (con.con.lbnd == null)
                    value = -DBL_MAX;
                else
                    value = con.lbnd;
                break;
                case DOT_UB:
                    if (con.con.ubnd == null)
                        value = +DBL_MAX;
                    else
                        value = con.ubnd;
                    break;
                case DOT_STATUS:
                    value = con.stat;
                    break;
                case DOT_VAL:
                    value = con.prim;
                    break;
                case DOT_DUAL:
                    value = con.dual;
                    break;
                default:
                    xassert(code != code);
            }
        }
            break;
        case O_IRAND224:
            /* pseudo-random in [0, 2^24-1] */
            value = mpl_internal_fp_irand224(mpl);
            break;
        case O_UNIFORM01:
            /* pseudo-random in [0, 1) */
            value = mpl_internal_fp_uniform01(mpl);
            break;
        case O_NORMAL01:
            /* gaussian random, mu = 0, sigma = 1 */
            value = mpl_internal_fp_normal01(mpl);
            break;
        case O_GMTIME:
            /* current calendar time */
            value = mpl_internal_fn_gmtime(mpl);
            break;
        case O_CVTNUM:
            /* conversion to numeric */
        {
            sym = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
            if (sym.str == null)
                value = sym.num;
            else
            {  if (str2num(sym.str, function(v){value= v}))
                mpl_internal_error(mpl, "cannot convert " + mpl_internal_format_symbol(mpl, sym) + " to floating-point number");
            }
        }
            break;
        case O_PLUS:
            /* unary plus */
            value = + mpl_internal_eval_numeric(mpl, code.arg.arg.x);
            break;
        case O_MINUS:
            /* unary minus */
            value = - mpl_internal_eval_numeric(mpl, code.arg.arg.x);
            break;
        case O_ABS:
            /* absolute value */
            value = Math.abs(mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_CEIL:
            /* round upward ("ceiling of x") */
            value = Math.ceil(mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_FLOOR:
            /* round downward ("floor of x") */
            value = Math.floor(mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_EXP:
            /* base-e exponential */
            value = mpl_internal_fp_exp(mpl, mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_LOG:
            /* natural logarithm */
            value = mpl_internal_fp_log(mpl, mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_LOG10:
            /* common (decimal) logarithm */
            value = mpl_internal_fp_log10(mpl, mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_SQRT:
            /* square root */
            value = mpl_internal_fp_sqrt(mpl, mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_SIN:
            /* trigonometric sine */
            value = mpl_internal_fp_sin(mpl, mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_COS:
            /* trigonometric cosine */
            value = mpl_internal_fp_cos(mpl, mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_ATAN:
            /* trigonometric arctangent (one argument) */
            value = mpl_internal_fp_atan(mpl, mpl_internal_eval_numeric(mpl, code.arg.arg.x));
            break;
        case O_ATAN2:
            /* trigonometric arctangent (two arguments) */
            value = mpl_internal_fp_atan2(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_ROUND:
            /* round to nearest integer */
            value = mpl_internal_fp_round(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x), 0.0);
            break;
        case O_ROUND2:
            /* round to n fractional digits */
            value = mpl_internal_fp_round(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_TRUNC:
            /* truncate to nearest integer */
            value = mpl_internal_fp_trunc(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x), 0.0);
            break;
        case O_TRUNC2:
            /* truncate to n fractional digits */
            value = mpl_internal_fp_trunc(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_ADD:
            /* addition */
            value = mpl_internal_fp_add(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_SUB:
            /* subtraction */
            value = mpl_internal_fp_sub(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_LESS:
            /* non-negative subtraction */
            value = mpl_internal_fp_less(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_MUL:
            /* multiplication */
            value = mpl_internal_fp_mul(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_DIV:
            /* division */
            value = mpl_internal_fp_div(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_IDIV:
            /* quotient of exact division */
            value = mpl_internal_fp_idiv(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_MOD:
            /* remainder of exact division */
            value = mpl_internal_fp_mod(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_POWER:
            /* exponentiation (raise to power) */
            value = mpl_internal_fp_power(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_UNIFORM:
            /* pseudo-random in [a, b) */
            value = mpl_internal_fp_uniform(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_NORMAL:
            /* gaussian random, given mu and sigma */
            value = mpl_internal_fp_normal(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            break;
        case O_CARD:
        {
            var set = mpl_internal_eval_elemset(mpl, code.arg.arg.x);
            value = set.size;
        }
            break;
        case O_LENGTH:
        {
            sym = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
            if (sym.str == null)
                str = String(sym.num);
            else
                str = sym.str;
            value = str.length;
        }
            break;
        case O_STR2TIME:
        {
            var fmt;
            sym = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
            if (sym.str == null)
                str = String(sym.num);
            else
                str = sym.str;
            sym = mpl_internal_eval_symbolic(mpl, code.arg.arg.y);
            if (sym.str == null)
                fmt = String(sym.num);
            else
                fmt = sym.str;
            value = mpl_internal_fn_str2time(mpl, str, fmt);
        }
            break;
        case O_FORK:
            /* if-then-else */
            if (mpl_internal_eval_logical(mpl, code.arg.arg.x))
                value = mpl_internal_eval_numeric(mpl, code.arg.arg.y);
            else if (code.arg.arg.z == null)
                value = 0.0;
            else
                value = mpl_internal_eval_numeric(mpl, code.arg.arg.z);
            break;
        case O_MIN:
            /* minimal value (n-ary) */
        {
            value = +DBL_MAX;
            for (e = code.arg.list; e != null; e = e.next)
            {  temp = mpl_internal_eval_numeric(mpl, e.x);
                if (value > temp) value = temp;
            }
        }
            break;
        case O_MAX:
            /* maximal value (n-ary) */
        {
            value = -DBL_MAX;
            for (e = code.arg.list; e != null; e = e.next)
            {  temp = mpl_internal_eval_numeric(mpl, e.x);
                if (value < temp) value = temp;
            }
        }
            break;
        case O_SUM:
            /* summation over domain */
        {   info = {};
            info.code = code;
            info.value = 0.0;
            mpl_internal_loop_within_domain(mpl, code.arg.loop.domain, info,
                mpl_internal_iter_num_func);
            value = info.value;
        }
            break;
        case O_PROD:
            /* multiplication over domain */
        {   info = {};
            info.code = code;
            info.value = 1.0;
            mpl_internal_loop_within_domain(mpl, code.arg.loop.domain, info,
                mpl_internal_iter_num_func);
            value = info.value;
        }
            break;
        case O_MINIMUM:
            /* minimum over domain */
        {   info = {};
            info.code = code;
            info.value = +DBL_MAX;
            mpl_internal_loop_within_domain(mpl, code.arg.loop.domain, info,
                mpl_internal_iter_num_func);
            if (info.value == +DBL_MAX)
                mpl_internal_error(mpl, "min{} over empty set; result undefined");
            value = info.value;
        }
            break;
        case O_MAXIMUM:
            /* maximum over domain */
        {   info = {};
            info.code = code;
            info.value = -DBL_MAX;
            mpl_internal_loop_within_domain(mpl, code.arg.loop.domain, info,
                mpl_internal_iter_num_func);
            if (info.value == -DBL_MAX)
                mpl_internal_error(mpl, "max{} over empty set; result undefined");
            value = info.value;
        }
            break;
        default:
            xassert(code != code);
    }
    /* save resultant value */
    xassert(!code.valid);
    code.valid = 1;
    code.value.num = value;
    return value;
}

function mpl_internal_eval_symbolic(mpl, code){
    var value, str;
    xassert(code != null);
    xassert(code.type == A_SYMBOLIC);
    xassert(code.dim == 0);
    /* if the operation has a side effect, invalidate and delete the
     resultant value */
    if (code.vflag && code.valid)
    {  code.valid = 0;
        mpl_internal_delete_value(mpl, code.type, code.value);
    }
    /* if resultant value is valid, no evaluation is needed */
    if (code.valid)
    {  return mpl_internal_copy_symbol(mpl, code.value.sym);
    }
    /* evaluate pseudo-code recursively */
    switch (code.op)
    {  case O_STRING:
        /* take character string */
        value = mpl_internal_create_symbol_str(mpl, code.arg.str);
        break;
        case O_INDEX:
            /* take dummy index */
            xassert(code.arg.index.slot.value != null);
            value = mpl_internal_copy_symbol(mpl, code.arg.index.slot.value);
            break;
        case O_MEMSYM:
            /* take member of symbolic parameter */
        {   var tuple;
            var e;
            tuple = null;
            for (e = code.arg.par.list; e != null; e = e.next)
                tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_eval_symbolic(mpl,
                    e.x));
            value = mpl_internal_eval_member_sym(mpl, code.arg.par.par, tuple);
        }
            break;
        case O_CVTSYM:
            /* conversion to symbolic */
            value = mpl_internal_create_symbol_num(mpl, mpl_internal_eval_numeric(mpl,
                code.arg.arg.x));
            break;
        case O_CONCAT:
            /* concatenation */
            value = mpl_internal_concat_symbols(mpl,
                mpl_internal_eval_symbolic(mpl, code.arg.arg.x),
                mpl_internal_eval_symbolic(mpl, code.arg.arg.y));
            break;
        case O_FORK:
            /* if-then-else */
            if (mpl_internal_eval_logical(mpl, code.arg.arg.x))
                value = mpl_internal_eval_symbolic(mpl, code.arg.arg.y);
            else if (code.arg.arg.z == null)
                value = mpl_internal_create_symbol_num(mpl, 0.0);
            else
                value = mpl_internal_eval_symbolic(mpl, code.arg.arg.z);
            break;
        case O_SUBSTR:
        case O_SUBSTR3:
        {  var pos, len;
            value = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
            if (value.str == null)
                str = String(value.num);
            else
                str = value.str;
            if (code.op == O_SUBSTR)
            {  pos = mpl_internal_eval_numeric(mpl, code.arg.arg.y);
                if (pos != Math.floor(pos))
                    mpl_internal_error(mpl, "substr('...', " + pos + "); non-integer second argument");
                if (pos < 1 || pos > str.length + 1)
                    mpl_internal_error(mpl, "substr('...', " + pos + "); substring out of range");
            }
            else
            {   pos = mpl_internal_eval_numeric(mpl, code.arg.arg.y);
                len = mpl_internal_eval_numeric(mpl, code.arg.arg.z);
                if (pos != Math.floor(pos) || len != Math.floor(len))
                    mpl_internal_error(mpl, "substr('...', " + pos + ", " + len + "); non-integer second and/or third argument");
                if (pos < 1 || len < 0 || pos + len > str.length + 1)
                    mpl_internal_error(mpl, "substr('...', " + pos + ", " + len + "); substring out of range");
                //str[pos + len - 1] = '\0';
            }
            value = mpl_internal_create_symbol_str(mpl, str.slice(pos-1, pos+len-1));
        }
            break;
        case O_TIME2STR:
        {   var num;
            var sym;
            var fmt; //[MAX_LENGTH+1], fmt[MAX_LENGTH+1];
            num = mpl_internal_eval_numeric(mpl, code.arg.arg.x);
            sym = mpl_internal_eval_symbolic(mpl, code.arg.arg.y);
            if (sym.str == null)
                fmt = String(sym.num);
            else
                fmt = sym.str;
            str = mpl_internal_fn_time2str(mpl, num, fmt);
            value = mpl_internal_create_symbol_str(mpl, str);
        }
            break;
        default:
            xassert(code != code);
    }
    /* save resultant value */
    xassert(!code.valid);
    code.valid = 1;
    code.value.sym = mpl_internal_copy_symbol(mpl, value);
    return value;
}

function mpl_internal_iter_log_func(mpl, info){
    /* this is auxiliary routine used to perform iterated operation
     on logical "integrand" within domain scope */
    var ret = 0;
    switch (info.code.op)
    {  case O_FORALL:
        /* conjunction over domain */
        info.value &= mpl_internal_eval_logical(mpl, info.code.arg.loop.x);
        if (!info.value) ret = 1;
        break;
        case O_EXISTS:
            /* disjunction over domain */
            info.value |= mpl_internal_eval_logical(mpl, info.code.arg.loop.x);
            if (info.value) ret = 1;
            break;
        default:
            xassert(info != info);
    }
    return ret;
}

function mpl_internal_eval_logical(mpl, code){
    var value, sym1, sym2, tuple, set, memb, info;
    xassert(code.type == A_LOGICAL);
    xassert(code.dim == 0);
    /* if the operation has a side effect, invalidate and delete the
     resultant value */
    if (code.vflag && code.valid)
    {  code.valid = 0;
        mpl_internal_delete_value(mpl, code.type, code.value);
    }
    /* if resultant value is valid, no evaluation is needed */
    if (code.valid)
    {  return code.value.bit;
    }
    /* evaluate pseudo-code recursively */
    switch (code.op)
    {  case O_CVTLOG:
        /* conversion to logical */
        value = (mpl_internal_eval_numeric(mpl, code.arg.arg.x) != 0.0);
        break;
        case O_NOT:
            /* negation (logical "not") */
            value = !mpl_internal_eval_logical(mpl, code.arg.arg.x);
            break;
        case O_LT:
            /* comparison on 'less than' */
            xassert(code.arg.arg.x != null);
            if (code.arg.arg.x.type == A_NUMERIC)
                value = (mpl_internal_eval_numeric(mpl, code.arg.arg.x) <
                    mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            else
            {   sym1 = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
                sym2 = mpl_internal_eval_symbolic(mpl, code.arg.arg.y);
                value = (mpl_internal_compare_symbols(mpl, sym1, sym2) < 0);
            }
            break;
        case O_LE:
            /* comparison on 'not greater than' */
            xassert(code.arg.arg.x != null);
            if (code.arg.arg.x.type == A_NUMERIC)
                value = (mpl_internal_eval_numeric(mpl, code.arg.arg.x) <=
                    mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            else
            {   sym1 = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
                sym2 = mpl_internal_eval_symbolic(mpl, code.arg.arg.y);
                value = (mpl_internal_compare_symbols(mpl, sym1, sym2) <= 0);
            }
            break;
        case O_EQ:
            /* comparison on 'equal to' */
            xassert(code.arg.arg.x != null);
            if (code.arg.arg.x.type == A_NUMERIC)
                value = (mpl_internal_eval_numeric(mpl, code.arg.arg.x) ==
                    mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            else
            {   sym1 = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
                sym2 = mpl_internal_eval_symbolic(mpl, code.arg.arg.y);
                value = (mpl_internal_compare_symbols(mpl, sym1, sym2) == 0);
            }
            break;
        case O_GE:
            /* comparison on 'not less than' */
            xassert(code.arg.arg.x != null);
            if (code.arg.arg.x.type == A_NUMERIC)
                value = (mpl_internal_eval_numeric(mpl, code.arg.arg.x) >=
                    mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            else
            {   sym1 = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
                sym2 = mpl_internal_eval_symbolic(mpl, code.arg.arg.y);
                value = (mpl_internal_compare_symbols(mpl, sym1, sym2) >= 0);
            }
            break;
        case O_GT:
            /* comparison on 'greater than' */
            xassert(code.arg.arg.x != null);
            if (code.arg.arg.x.type == A_NUMERIC)
                value = (mpl_internal_eval_numeric(mpl, code.arg.arg.x) >
                    mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            else
            {   sym1 = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
                sym2 = mpl_internal_eval_symbolic(mpl, code.arg.arg.y);
                value = (mpl_internal_compare_symbols(mpl, sym1, sym2) > 0);
            }
            break;
        case O_NE:
            /* comparison on 'not equal to' */
            xassert(code.arg.arg.x != null);
            if (code.arg.arg.x.type == A_NUMERIC)
                value = (mpl_internal_eval_numeric(mpl, code.arg.arg.x) !=
                    mpl_internal_eval_numeric(mpl, code.arg.arg.y));
            else
            {   sym1 = mpl_internal_eval_symbolic(mpl, code.arg.arg.x);
                sym2 = mpl_internal_eval_symbolic(mpl, code.arg.arg.y);
                value = (mpl_internal_compare_symbols(mpl, sym1, sym2) != 0);
            }
            break;
        case O_AND:
            /* conjunction (logical "and") */
            value = mpl_internal_eval_logical(mpl, code.arg.arg.x) &&
                mpl_internal_eval_logical(mpl, code.arg.arg.y);
            break;
        case O_OR:
            /* disjunction (logical "or") */
            value = mpl_internal_eval_logical(mpl, code.arg.arg.x) ||
                mpl_internal_eval_logical(mpl, code.arg.arg.y);
            break;
        case O_IN:
            /* test on 'x in Y' */
        {
            tuple = mpl_internal_eval_tuple(mpl, code.arg.arg.x);
            value = mpl_internal_is_member(mpl, code.arg.arg.y, tuple);
        }
            break;
        case O_NOTIN:
            /* test on 'x not in Y' */
        {
            tuple = mpl_internal_eval_tuple(mpl, code.arg.arg.x);
            value = !mpl_internal_is_member(mpl, code.arg.arg.y, tuple);
        }
            break;
        case O_WITHIN:
            /* test on 'X within Y' */
        {
            set = mpl_internal_eval_elemset(mpl, code.arg.arg.x);
            value = 1;
            for (memb = set.head; memb != null; memb = memb.next)
            {  if (!mpl_internal_is_member(mpl, code.arg.arg.y, memb.tuple))
            {  value = 0;
                break;
            }
            }
        }
            break;
        case O_NOTWITHIN:
            /* test on 'X not within Y' */
        {
            set = mpl_internal_eval_elemset(mpl, code.arg.arg.x);
            value = 1;
            for (memb = set.head; memb != null; memb = memb.next)
            {  if (mpl_internal_is_member(mpl, code.arg.arg.y, memb.tuple))
            {  value = 0;
                break;
            }
            }
        }
            break;
        case O_FORALL:
            /* conjunction (A-quantification) */
        {   info = {};
            info.code = code;
            info.value = 1;
            mpl_internal_loop_within_domain(mpl, code.arg.loop.domain, info,
                mpl_internal_iter_log_func);
            value = info.value;
        }
            break;
        case O_EXISTS:
            /* disjunction (E-quantification) */
        {   info = {};
            info.code = code;
            info.value = 0;
            mpl_internal_loop_within_domain(mpl, code.arg.loop.domain, info,
                mpl_internal_iter_log_func);
            value = info.value;
        }
            break;
        default:
            xassert(code != code);
    }
    /* save resultant value */
    xassert(!code.valid);
    code.valid = 1;
    code.value.bit = value;
    return value;
}

function mpl_internal_eval_tuple(mpl, code){
    var value;
    xassert(code != null);
    xassert(code.type == A_TUPLE);
    xassert(code.dim > 0);
    /* if the operation has a side effect, invalidate and delete the
     resultant value */
    if (code.vflag && code.valid)
    {  code.valid = 0;
        mpl_internal_delete_value(mpl, code.type, code.value);
    }
    /* if resultant value is valid, no evaluation is needed */
    if (code.valid)
    {  return mpl_internal_copy_tuple(mpl, code.value.tuple);
    }
    /* evaluate pseudo-code recursively */
    switch (code.op)
    {  case O_TUPLE:
        /* make n-tuple */
    {
        value = null;
        for (var e = code.arg.list; e != null; e = e.next)
            value = mpl_internal_expand_tuple(mpl, value, mpl_internal_eval_symbolic(mpl,
                e.x));
    }
        break;
        case O_CVTTUP:
            /* convert to 1-tuple */
            value = mpl_internal_expand_tuple(mpl, null,
                mpl_internal_eval_symbolic(mpl, code.arg.arg.x));
            break;
        default:
            xassert(code != code);
    }
    /* save resultant value */
    xassert(!code.valid);
    code.valid = 1;
    code.value.tuple = mpl_internal_copy_tuple(mpl, value);
    return value;
}

function mpl_internal_iter_set_func(mpl, info)
{     /* this is auxiliary routine used to perform iterated operation
 on n-tuple "integrand" within domain scope */
    var tuple;
    switch (info.code.op)
    {  case O_SETOF:
        /* compute next n-tuple and add it to the set; in this case
         duplicate n-tuples are silently ignored */
        tuple = mpl_internal_eval_tuple(mpl, info.code.arg.loop.x);
        if (mpl_internal_find_tuple(mpl, info.value, tuple) == null)
            mpl_internal_add_tuple(mpl, info.value, tuple);
        break;
        case O_BUILD:
            /* construct next n-tuple using current values assigned to
             *free* dummy indices as its components and add it to the
             set; in this case duplicate n-tuples cannot appear */
            mpl_internal_add_tuple(mpl, info.value, mpl_internal_get_domain_tuple(mpl,
                info.code.arg.loop.domain));
            break;
        default:
            xassert(info != info);
    }
    return 0;
}

function mpl_internal_eval_elemset(mpl, code){
    var value, e, info;
    xassert(code != null);
    xassert(code.type == A_ELEMSET);
    xassert(code.dim > 0);
    /* if the operation has a side effect, invalidate and delete the
     resultant value */
    if (code.vflag && code.valid)
    {  code.valid = 0;
        mpl_internal_delete_value(mpl, code.type, code.value);
    }
    /* if resultant value is valid, no evaluation is needed */
    if (code.valid)
    {  return mpl_internal_copy_elemset(mpl, code.value.set);

    }
    /* evaluate pseudo-code recursively */
    switch (code.op)
    {  case O_MEMSET:
        /* take member of set */
    {   var tuple;
        tuple = null;
        for (e = code.arg.set.list; e != null; e = e.next)
            tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_eval_symbolic(mpl,
                e.x));
        value = mpl_internal_copy_elemset(mpl,
            mpl_internal_eval_member_set(mpl, code.arg.set.set, tuple));
    }
        break;
        case O_MAKE:
            /* make elemental set of n-tuples */
        {
            value = mpl_internal_create_elemset(mpl, code.dim);
            for (e = code.arg.list; e != null; e = e.next)
                mpl_internal_check_then_add(mpl, value, mpl_internal_eval_tuple(mpl, e.x));
        }
            break;
        case O_UNION:
            /* union of two elemental sets */
            value = mpl_internal_set_union(mpl,
                mpl_internal_eval_elemset(mpl, code.arg.arg.x),
                mpl_internal_eval_elemset(mpl, code.arg.arg.y));
            break;
        case O_DIFF:
            /* difference between two elemental sets */
            value = mpl_internal_set_diff(mpl,
                mpl_internal_eval_elemset(mpl, code.arg.arg.x),
                mpl_internal_eval_elemset(mpl, code.arg.arg.y));
            break;
        case O_SYMDIFF:
            /* symmetric difference between two elemental sets */
            value = mpl_internal_set_symdiff(mpl,
                mpl_internal_eval_elemset(mpl, code.arg.arg.x),
                mpl_internal_eval_elemset(mpl, code.arg.arg.y));
            break;
        case O_INTER:
            /* intersection of two elemental sets */
            value = mpl_internal_set_inter(mpl,
                mpl_internal_eval_elemset(mpl, code.arg.arg.x),
                mpl_internal_eval_elemset(mpl, code.arg.arg.y));
            break;
        case O_CROSS:
            /* cross (Cartesian) product of two elemental sets */
            value = mpl_internal_set_cross(mpl,
                mpl_internal_eval_elemset(mpl, code.arg.arg.x),
                mpl_internal_eval_elemset(mpl, code.arg.arg.y));
            break;
        case O_DOTS:
            /* build "arithmetic" elemental set */
            value = mpl_internal_create_arelset(mpl,
                mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                mpl_internal_eval_numeric(mpl, code.arg.arg.y),
                code.arg.arg.z == null ? 1.0 : mpl_internal_eval_numeric(mpl,
                    code.arg.arg.z));
            break;
        case O_FORK:
            /* if-then-else */
            if (mpl_internal_eval_logical(mpl, code.arg.arg.x))
                value = mpl_internal_eval_elemset(mpl, code.arg.arg.y);
            else
                value = mpl_internal_eval_elemset(mpl, code.arg.arg.z);
            break;
        case O_SETOF:
            /* compute elemental set */
        {   info ={};
            info.code = code;
            info.value = mpl_internal_create_elemset(mpl, code.dim);
            mpl_internal_loop_within_domain(mpl, code.arg.loop.domain, info,
                mpl_internal_iter_set_func);
            value = info.value;
        }
            break;
        case O_BUILD:
            /* build elemental set identical to domain set */
        {   info = {};
            info.code = code;
            info.value = mpl_internal_create_elemset(mpl, code.dim);
            mpl_internal_loop_within_domain(mpl, code.arg.loop.domain, info,
                mpl_internal_iter_set_func);
            value = info.value;
        }
            break;
        default:
            xassert(code != code);
    }
    /* save resultant value */
    xassert(!code.valid);
    code.valid = 1;
    code.value.set = mpl_internal_copy_elemset(mpl, value);
    return value;
}

function mpl_internal_null_func(mpl, info){
    /* this is dummy routine used to enter the domain scope */

    xassert(info == null);
}

function mpl_internal_is_member(mpl, code, tuple){
    var value, e, temp, j;
    xassert(code != null);
    xassert(code.type == A_ELEMSET);
    xassert(code.dim > 0);
    xassert(tuple != null);
    switch (code.op)
    {  case O_MEMSET:
        /* check if given n-tuple is member of elemental set, which
         is assigned to member of model set */
    {
        var set;
        /* evaluate reference to elemental set */
        temp = null;
        for (e = code.arg.set.list; e != null; e = e.next)
            temp = mpl_internal_expand_tuple(mpl, temp, mpl_internal_eval_symbolic(mpl,
                e.x));
        set = mpl_internal_eval_member_set(mpl, code.arg.set.set, temp);
        /* check if the n-tuple is contained in the set array */
        temp = mpl_internal_build_subtuple(mpl, tuple, set.dim);
        value = (mpl_internal_find_tuple(mpl, set, temp) != null);
    }
        break;
        case O_MAKE:
            /* check if given n-tuple is member of literal set */
        {
            var that;
            value = 0;
            temp = mpl_internal_build_subtuple(mpl, tuple, code.dim);
            for (e = code.arg.list; e != null; e = e.next)
            {  that = mpl_internal_eval_tuple(mpl, e.x);
                value = (mpl_internal_compare_tuples(mpl, temp, that) == 0);
                if (value) break;
            }
        }
            break;
        case O_UNION:
            value = mpl_internal_is_member(mpl, code.arg.arg.x, tuple) ||
                mpl_internal_is_member(mpl, code.arg.arg.y, tuple);
            break;
        case O_DIFF:
            value = mpl_internal_is_member(mpl, code.arg.arg.x, tuple) &&
                !mpl_internal_is_member(mpl, code.arg.arg.y, tuple);
            break;
        case O_SYMDIFF:
        {   var in1 = mpl_internal_is_member(mpl, code.arg.arg.x, tuple);
            var in2 = mpl_internal_is_member(mpl, code.arg.arg.y, tuple);
            value = (in1 && !in2) || (!in1 && in2);
        }
            break;
        case O_INTER:
            value = mpl_internal_is_member(mpl, code.arg.arg.x, tuple) &&
                mpl_internal_is_member(mpl, code.arg.arg.y, tuple);
            break;
        case O_CROSS:
        {
            value = mpl_internal_is_member(mpl, code.arg.arg.x, tuple);
            if (value)
            {  for (j = 1; j <= code.arg.arg.x.dim; j++)
            {  xassert(tuple != null);
                tuple = tuple.next;
            }
                value = mpl_internal_is_member(mpl, code.arg.arg.y, tuple);
            }
        }
            break;
        case O_DOTS:
            /* check if given 1-tuple is member of "arithmetic" set */
        {
            var x, t0, tf, dt;
            xassert(code.dim == 1);
            /* compute "parameters" of the "arithmetic" set */
            t0 = mpl_internal_eval_numeric(mpl, code.arg.arg.x);
            tf = mpl_internal_eval_numeric(mpl, code.arg.arg.y);
            if (code.arg.arg.z == null)
                dt = 1.0;
            else
                dt = mpl_internal_eval_numeric(mpl, code.arg.arg.z);
            /* make sure the parameters are correct */
            mpl_internal_arelset_size(mpl, t0, tf, dt);
            /* if component of 1-tuple is symbolic, not numeric, the
             1-tuple cannot be member of "arithmetic" set */
            xassert(tuple.sym != null);
            if (tuple.sym.str != null)
            {  value = 0;
                break;
            }
            /* determine numeric value of the component */
            x = tuple.sym.num;
            /* if the component value is out of the set range, the
             1-tuple is not in the set */
            if (dt > 0.0 && !(t0 <= x && x <= tf) ||
                dt < 0.0 && !(tf <= x && x <= t0))
            {  value = 0;
                break;
            }
            /* estimate ordinal number of the 1-tuple in the set */
            j = ((((x - t0) / dt) + 0.5)|0) + 1;
            /* perform the main check */
            value = (mpl_internal_arelset_member(mpl, t0, tf, dt, j) == x);
        }
            break;
        case O_FORK:
            /* check if given n-tuple is member of conditional set */
            if (mpl_internal_eval_logical(mpl, code.arg.arg.x))
                value = mpl_internal_is_member(mpl, code.arg.arg.y, tuple);
            else
                value = mpl_internal_is_member(mpl, code.arg.arg.z, tuple);
            break;
        case O_SETOF:
            /* check if given n-tuple is member of computed set */
            /* it is not clear how to efficiently perform the check not
             computing the entire elemental set :+( */
            mpl_internal_error(mpl, "implementation restriction; in/within setof{} not allowed");
            break;
        case O_BUILD:
            /* check if given n-tuple is member of domain set */
        {
            temp = mpl_internal_build_subtuple(mpl, tuple, code.dim);
            /* try to enter the domain scope; if it is successful,
             the n-tuple is in the domain set */
            value = (mpl_internal_eval_within_domain(mpl, code.arg.loop.domain,
                temp, null, mpl_internal_null_func) == 0);
        }
            break;
        default:
            xassert(code != code);
    }
    return value;
}

function mpl_internal_iter_form_func(mpl, info)
{     /* this is auxiliary routine used to perform iterated operation
 on linear form "integrand" within domain scope */
    switch (info.code.op)
    {  case O_SUM:
        /* summation over domain */
        /* the routine linear_comb needs to look through all terms
         of both linear forms to reduce identical terms, so using
         it here is not a good idea (for example, evaluation of
         sum{i in 1..n} x[i] required quadratic time); the better
         idea is to gather all terms of the integrand in one list
         and reduce identical terms only once after all terms of
         the resultant linear form have been evaluated */
    {   var term;
        var form = mpl_internal_eval_formula(mpl, info.code.arg.loop.x);
        if (info.value == null)
        {  xassert(info.tail == null);
            info.value = form;
        }
        else
        {  xassert(info.tail != null);
            info.tail.next = form;
        }
        for (term = form; term != null; term = term.next)
            info.tail = term;
    }
        break;
        default:
            xassert(info != info);
    }
    return 0;
}

function mpl_internal_eval_formula(mpl, code){
    var value;
    xassert(code != null);
    xassert(code.type == A_FORMULA);
    xassert(code.dim == 0);
    /* if the operation has a side effect, invalidate and delete the
     resultant value */
    if (code.vflag && code.valid)
    {  code.valid = 0;
        mpl_internal_delete_value(mpl, code.type, code.value);
    }
    /* if resultant value is valid, no evaluation is needed */
    if (code.valid)
    {  return mpl_internal_copy_formula(mpl, code.value.form);

    }
    /* evaluate pseudo-code recursively */
    switch (code.op)
    {  case O_MEMVAR:
        /* take member of variable */
    {
        var e;
        var tuple = null;
        for (e = code.arg.var_.list; e != null; e = e.next)
            tuple = mpl_internal_expand_tuple(mpl, tuple, mpl_internal_eval_symbolic(mpl,
                e.x));
        xassert(code.arg.var_.suff == DOT_NONE);
        value = mpl_internal_single_variable(mpl,
            mpl_internal_eval_member_var(mpl, code.arg.var_.var_, tuple));
    }
        break;
        case O_CVTLFM:
            /* convert to linear form */
            value = mpl_internal_constant_term(mpl, mpl_internal_eval_numeric(mpl,
                code.arg.arg.x));
            break;
        case O_PLUS:
            /* unary plus */
            value = mpl_internal_linear_comb(mpl,
                0.0, mpl_internal_constant_term(mpl, 0.0),
                +1.0, mpl_internal_eval_formula(mpl, code.arg.arg.x));
            break;
        case O_MINUS:
            /* unary minus */
            value = mpl_internal_linear_comb(mpl,
                0.0, mpl_internal_constant_term(mpl, 0.0),
                -1.0, mpl_internal_eval_formula(mpl, code.arg.arg.x));
            break;
        case O_ADD:
            /* addition */
            value = mpl_internal_linear_comb(mpl,
                +1.0, mpl_internal_eval_formula(mpl, code.arg.arg.x),
                +1.0, mpl_internal_eval_formula(mpl, code.arg.arg.y));
            break;
        case O_SUB:
            /* subtraction */
            value = mpl_internal_linear_comb(mpl,
                +1.0, mpl_internal_eval_formula(mpl, code.arg.arg.x),
                -1.0, mpl_internal_eval_formula(mpl, code.arg.arg.y));
            break;
        case O_MUL:
            /* multiplication */
            xassert(code.arg.arg.x != null);
            xassert(code.arg.arg.y != null);
            if (code.arg.arg.x.type == A_NUMERIC)
            {  xassert(code.arg.arg.y.type == A_FORMULA);
                value = mpl_internal_linear_comb(mpl,
                    mpl_internal_eval_numeric(mpl, code.arg.arg.x),
                    mpl_internal_eval_formula(mpl, code.arg.arg.y),
                    0.0, mpl_internal_constant_term(mpl, 0.0));
            }
            else
            {  xassert(code.arg.arg.x.type == A_FORMULA);
                xassert(code.arg.arg.y.type == A_NUMERIC);
                value = mpl_internal_linear_comb(mpl,
                    mpl_internal_eval_numeric(mpl, code.arg.arg.y),
                    mpl_internal_eval_formula(mpl, code.arg.arg.x),
                    0.0, mpl_internal_constant_term(mpl, 0.0));
            }
            break;
        case O_DIV:
            /* division */
            value = mpl_internal_linear_comb(mpl,
                mpl_internal_fp_div(mpl, 1.0, mpl_internal_eval_numeric(mpl, code.arg.arg.y)),
                mpl_internal_eval_formula(mpl, code.arg.arg.x),
                0.0, mpl_internal_constant_term(mpl, 0.0));
            break;
        case O_FORK:
            /* if-then-else */
            if (mpl_internal_eval_logical(mpl, code.arg.arg.x))
                value = mpl_internal_eval_formula(mpl, code.arg.arg.y);
            else if (code.arg.arg.z == null)
                value = mpl_internal_constant_term(mpl, 0.0);
            else
                value = mpl_internal_eval_formula(mpl, code.arg.arg.z);
            break;
        case O_SUM:
            /* summation over domain */
        {   var info = {};
            info.code = code;
            info.value = mpl_internal_constant_term(mpl, 0.0);
            info.tail = null;
            mpl_internal_loop_within_domain(mpl, code.arg.loop.domain, info,
                mpl_internal_iter_form_func);
            value = mpl_internal_reduce_terms(mpl, info.value);
        }
            break;
        default:
            xassert(code != code);
    }
    /* save resultant value */
    xassert(!code.valid);
    code.valid = 1;
    code.value.form = mpl_internal_copy_formula(mpl, value);
    return value;
}

/**********************************************************************/
/* * *                        DATA TABLES                         * * */
/**********************************************************************/

var mpl_tab_num_args = exports["mpl_tab_num_args"] = function(dca){
    /* returns the number of arguments */
    return dca.na;
};

var mpl_tab_get_arg = exports["mpl_tab_get_arg"] = function(dca, k){
    /* returns pointer to k-th argument */
    xassert(1 <= k && k <= dca.na);
    return dca.arg[k];
};

var mpl_tab_num_flds = exports["mpl_tab_num_flds"] = function (dca){
    /* returns the number of fields */
    return dca.nf;
};

var mpl_tab_get_name = exports["mpl_tab_get_name"] = function(dca, k)
{     /* returns pointer to name of k-th field */
    xassert(1 <= k && k <= dca.nf);
    return dca.name[k];
};

var mpl_tab_get_type = exports["mpl_tab_get_type"] = function(dca, k)
{     /* returns type of k-th field */
    xassert(1 <= k && k <= dca.nf);
    return dca.type[k];
};

var mpl_tab_get_num = exports["mpl_tab_get_num"] = function(dca, k){
    /* returns numeric value of k-th field */
    xassert(1 <= k && k <= dca.nf);
    xassert(dca.type[k] == 'N');
    return dca.num[k];
};

var mpl_tab_get_str = exports["mpl_tab_get_str"] = function(dca, k){
    /* returns pointer to string value of k-th field */
    xassert(1 <= k && k <= dca.nf);
    xassert(dca.type[k] == 'S');
    xassert(dca.str[k] != null);
    return dca.str[k];
};

var mpl_tab_set_num = exports["mpl_tab_set_num"] = function(dca, k, num){
    /* assign numeric value to k-th field */
    xassert(1 <= k && k <= dca.nf);
    xassert(dca.type[k] == '?');
    dca.type[k] = 'N';
    dca.num[k] = num;
};

var mpl_tab_set_str = exports["mpl_tab_set_str"] = function(dca, k, str){
    /* assign string value to k-th field */
    xassert(1 <= k && k <= dca.nf);
    xassert(dca.type[k] == '?');
    xassert(str.length <= MAX_LENGTH);
    xassert(dca.str[k] != null);
    dca.type[k] = 'S';
    dca.str[k] = str;
};

function mpl_internal_write_func(mpl, tab){
    /* this is auxiliary routine to work within domain scope */
    var dca = mpl.dca;
    var out;
    var sym;
    var k;
    /* evaluate field values */
    k = 0;
    for (out = tab.u.out.list; out != null; out = out.next)
    {  k++;
        switch (out.code.type)
        {  case A_NUMERIC:
            dca.type[k] = 'N';
            dca.num[k] = mpl_internal_eval_numeric(mpl, out.code);
            dca.str[k][0] = '\0';
            break;
            case A_SYMBOLIC:
                sym = mpl_internal_eval_symbolic(mpl, out.code);
                if (sym.str == null)
                {  dca.type[k] = 'N';
                    dca.num[k] = sym.num;
                    dca.str[k][0] = '\0';
                }
                else
                {  dca.type[k] = 'S';
                    dca.num[k] = 0.0;
                    dca.str[k] = sym.str;
                }
                break;
            default:
                xassert(out != out);
        }
    }
    /* write record to output table */
    mpl_tab_drv_write(mpl);
    return 0;
}

function mpl_internal_execute_table(mpl, tab){
    /* execute table statement */
    var arg;
    var fld;
    var in_;
    var out;
    var dca;
    var set;
    var k;
    var buf; // [MAX_LENGTH+1];
    /* allocate table driver communication area */
    xassert(mpl.dca == null);
    mpl.dca = dca = {};
    dca.id = 0;
    dca.link = null;
    dca.na = 0;
    dca.arg = null;
    dca.nf = 0;
    dca.name = null;
    dca.type = null;
    dca.num = null;
    dca.str = null;
    /* allocate arguments */
    xassert(dca.na == 0);
    for (arg = tab.arg; arg != null; arg = arg.next)
        dca.na++;
    dca.arg = new Array(1+dca.na);
    for (k = 1; k <= dca.na; k++) dca.arg[k] = null;
    /* evaluate argument values */
    k = 0;
    for (arg = tab.arg; arg != null; arg = arg.next)
    {
        k++;
        xassert(arg.code.type == A_SYMBOLIC);
        var sym = mpl_internal_eval_symbolic(mpl, arg.code);
        if (sym.str == null)
            buf = String(sym.num);
        else
            buf = sym.str;
        dca.arg[k] = buf;
    }
    /* perform table input/output */
    switch (tab.type)    {
        case A_INPUT:
            /* read data from input table */
            /* add the only member to the control set and assign it empty
             elemental set */
            set = tab.u.in_.set;
            if (set != null)
            {  if (set.data)
                mpl_internal_error(mpl, set.name + " already provided with data");
                xassert(set.array.head == null);
                mpl_internal_add_member(mpl, set.array, null).value.set =
                    mpl_internal_create_elemset(mpl, set.dimen);
                set.data = 1;
            }
            /* check parameters specified in the input list */
            for (in_ = tab.u.in_.list; in_ != null; in_ = in_.next)
            {  if (in_.par.data)
                mpl_internal_error(mpl, in_.par.name + " already provided with data");
                in_.par.data = 1;
            }
            /* allocate and initialize fields */
            xassert(dca.nf == 0);
            for (fld = tab.u.in_.fld; fld != null; fld = fld.next)
                dca.nf++;
            for (in_ = tab.u.in_.list; in_ != null; in_ = in_.next)
                dca.nf++;
            dca.name = new Array(1+dca.nf);
            dca.type = new Array(1+dca.nf);
            dca.num = new Float64Array(1+dca.nf);
            dca.str = new Array(1+dca.nf);
            k = 0;
            for (fld = tab.u.in_.fld; fld != null; fld = fld.next)
            {   k++;
                dca.name[k] = fld.name;
                dca.type[k] = '?';
                dca.num[k] = 0.0;
                dca.str[k] = '';
            }
            for (in_ = tab.u.in_.list; in_ != null; in_ = in_.next)
            {   k++;
                dca.name[k] = in_.name;
                dca.type[k] = '?';
                dca.num[k] = 0.0;
                dca.str[k] = '';
            }
            /* open input table */
            mpl_tab_drv_open(mpl, 'R');
            /* read and process records */
            for (;;)
            {   var tup;
                /* reset field types */
                for (k = 1; k <= dca.nf; k++)
                    dca.type[k] = '?';
                /* read next record */
                if (mpl_tab_drv_read(mpl)) break;
                /* all fields must be set by the driver */
                for (k = 1; k <= dca.nf; k++)
                {  if (dca.type[k] == '?')
                    mpl_internal_error(mpl, "field " + dca.name[k] + " missing in input table");
                }
                /* construct n-tuple */
                tup = null;
                k = 0;
                for (fld = tab.u.in_.fld; fld != null; fld = fld.next)
                {  k++;
                    xassert(k <= dca.nf);
                    switch (dca.type[k])
                    {  case 'N':
                        tup = mpl_internal_expand_tuple(mpl, tup, mpl_internal_create_symbol_num(mpl,
                            dca.num[k]));
                        break;
                        case 'S':
                            xassert(dca.str[k].length <= MAX_LENGTH);
                            tup = mpl_internal_expand_tuple(mpl, tup, mpl_internal_create_symbol_str(mpl, dca.str[k]));
                            break;
                        default:
                            xassert(dca != dca);
                    }
                }
                /* add n-tuple just read to the control set */
                if (tab.u.in_.set != null)
                    mpl_internal_check_then_add(mpl, tab.u.in_.set.array.head.value.set,
                        mpl_internal_copy_tuple(mpl, tup));
                /* assign values to the parameters in the input list */
                for (in_ = tab.u.in_.list; in_ != null; in_ = in_.next)
                {   var memb;
                    k++;
                    xassert(k <= dca.nf);
                    /* there must be no member with the same n-tuple */
                    if (mpl_internal_find_member(mpl, in_.par.array, tup) != null)
                        mpl_internal_error(mpl, in_.par.name + mpl_internal_format_tuple(mpl, '[', tup) + " already defined");
                    /* create new parameter member with given n-tuple */
                    memb = mpl_internal_add_member(mpl, in_.par.array, mpl_internal_copy_tuple(mpl, tup))
                    ;
                    /* assign value to the parameter member */
                    switch (in_.par.type)
                    {  case A_NUMERIC:
                        case A_INTEGER:
                        case A_BINARY:
                            if (dca.type[k] != 'N')
                                mpl_internal_error(mpl, in_.par.name + " requires numeric data");
                            memb.value.num = dca.num[k];
                            break;
                        case A_SYMBOLIC:
                            switch (dca.type[k])
                            {  case 'N':
                                memb.value.sym = mpl_internal_create_symbol_num(mpl,
                                    dca.num[k]);
                                break;
                                case 'S':
                                    xassert(dca.str[k].length <= MAX_LENGTH);
                                    memb.value.sym = mpl_internal_create_symbol_str(mpl, dca.str[k]);
                                    break;
                                default:
                                    xassert(dca != dca);
                            }
                            break;
                        default:
                            xassert(in_ != in_);
                    }
                }
            }
            break;
        case A_OUTPUT:
            /* write data to output table */
            /* allocate and initialize fields */
            xassert(dca.nf == 0);
            for (out = tab.u.out.list; out != null; out = out.next)
                dca.nf++;
            dca.name = new Array(1+dca.nf);
            dca.type = new Array(1+dca.nf);
            dca.num = new Float64Array(1+dca.nf);
            dca.str = new Array(1+dca.nf);
            k = 0;
            for (out = tab.u.out.list; out != null; out = out.next)
            {  k++;
                dca.name[k] = out.name;
                dca.type[k] = '?';
                dca.num[k] = 0.0;
                dca.str[k] = '';
            }
            /* open output table */
            mpl_tab_drv_open(mpl, 'W');
            /* evaluate fields and write records */
            mpl_internal_loop_within_domain(mpl, tab.u.out.domain, tab, mpl_internal_write_func);
            break;
        default:
            xassert(tab != tab);
    }
}

/**********************************************************************/
/* * *                      MODEL STATEMENTS                      * * */
/**********************************************************************/

function mpl_internal_check_func(mpl, chk){
    /* this is auxiliary routine to work within domain scope */
    if (!mpl_internal_eval_logical(mpl, chk.code))
        mpl_internal_error(mpl, "check" + mpl_internal_format_tuple(mpl, '[', mpl_internal_get_domain_tuple(mpl, chk.domain)) + " failed");
    return 0;
}

function mpl_internal_execute_check(mpl, chk){
    mpl_internal_loop_within_domain(mpl, chk.domain, chk, mpl_internal_check_func);

}

function mpl_internal_display_set(mpl, set, memb){
    /* display member of model set */
    var s = memb.value.set;
    var m;
    mpl_internal_write_text(mpl, set.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + (s.head == null ? " is empty" : ":"));
    for (m = s.head; m != null; m = m.next)
        mpl_internal_write_text(mpl, "   " + mpl_internal_format_tuple(mpl, '(', m.tuple));
}

function mpl_internal_display_par(mpl, par, memb){
    /* display member of model parameter */
    switch (par.type)
    {   case A_NUMERIC:
        case A_INTEGER:
        case A_BINARY:
            mpl_internal_write_text(mpl, par.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + " = " + memb.value.num);
            break;
        case A_SYMBOLIC:
            mpl_internal_write_text(mpl, par.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + " = " + mpl_internal_format_symbol(mpl, memb.value.sym));
            break;
        default:
            xassert(par != par);
    }
}

function mpl_internal_display_var(mpl, var_, memb, suff){
    /* display member of model variable */
    if (suff == DOT_NONE || suff == DOT_VAL)
        mpl_internal_write_text(mpl, var_.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".val = " +
            memb.value.var_.prim);
    else if (suff == DOT_LB)
        mpl_internal_write_text(mpl, var_.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".lb = " +
            (memb.value.var_.var_.lbnd == null ? -DBL_MAX : memb.value.var_.lbnd));
    else if (suff == DOT_UB)
        mpl_internal_write_text(mpl, var_.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".ub = " +
            (memb.value.var_.var_.ubnd == null ? +DBL_MAX : memb.value.var_.ubnd));
    else if (suff == DOT_STATUS)
        mpl_internal_write_text(mpl, var_.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".status = " +
            memb.value.var_.stat);
    else if (suff == DOT_DUAL)
        mpl_internal_write_text(mpl, var_.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".dual = " +
            memb.value.var_.dual);
    else
        xassert(suff != suff);
}

function mpl_internal_display_con(mpl, con, memb, suff){
    /* display member of model constraint */
    if (suff == DOT_NONE || suff == DOT_VAL)
        mpl_internal_write_text(mpl, con.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".val = " +
            memb.value.con.prim);
    else if (suff == DOT_LB)
        mpl_internal_write_text(mpl, con.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".lb = " +
            (memb.value.con.con.lbnd == null ? -DBL_MAX : memb.value.con.lbnd));
    else if (suff == DOT_UB)
        mpl_internal_write_text(mpl, con.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".ub = " +
            (memb.value.con.con.ubnd == null ? +DBL_MAX : memb.value.con.ubnd));
    else if (suff == DOT_STATUS)
        mpl_internal_write_text(mpl, con.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".status = " +
            memb.value.con.stat);
    else if (suff == DOT_DUAL)
        mpl_internal_write_text(mpl, con.name + mpl_internal_format_tuple(mpl, '[', memb.tuple) + ".dual = " +
            memb.value.con.dual);
    else
        xassert(suff != suff);
}

function mpl_internal_display_memb(mpl, code){
    /* display member specified by pseudo-code */
    var memb = {};
    var e;
    xassert(code.op == O_MEMNUM || code.op == O_MEMSYM
        || code.op == O_MEMSET || code.op == O_MEMVAR
        || code.op == O_MEMCON);
    memb.tuple = null;
    for (e = code.arg.par.list; e != null; e = e.next)
        memb.tuple = mpl_internal_expand_tuple(mpl, memb.tuple, mpl_internal_eval_symbolic(mpl,
            e.x));
    switch (code.op)
    {  case O_MEMNUM:
        memb.value.num = mpl_internal_eval_member_num(mpl, code.arg.par.par,
            memb.tuple);
        mpl_internal_display_par(mpl, code.arg.par.par, memb);
        break;
        case O_MEMSYM:
            memb.value.sym = mpl_internal_eval_member_sym(mpl, code.arg.par.par,
                memb.tuple);
            mpl_internal_display_par(mpl, code.arg.par.par, memb);
            break;
        case O_MEMSET:
            memb.value.set = mpl_internal_eval_member_set(mpl, code.arg.set.set,
                memb.tuple);
            mpl_internal_display_set(mpl, code.arg.set.set, memb);
            break;
        case O_MEMVAR:
            memb.value.var_ = mpl_internal_eval_member_var(mpl, code.arg.var_.var_,
                memb.tuple);
            mpl_internal_display_var
                (mpl, code.arg.var_.var_, memb, code.arg.var_.suff);
            break;
        case O_MEMCON:
            memb.value.con = mpl_internal_eval_member_con(mpl, code.arg.con.con,
                memb.tuple);
            mpl_internal_display_con
                (mpl, code.arg.con.con, memb, code.arg.con.suff);
            break;
        default:
            xassert(code != code);
    }
}

function mpl_internal_display_code(mpl, code){
    /* display value of expression */
    switch (code.type)
    {  case A_NUMERIC:
        /* numeric value */
    {
        var num = mpl_internal_eval_numeric(mpl, code);
        mpl_internal_write_text(mpl, String(num));
    }
        break;
        case A_SYMBOLIC:
            /* symbolic value */
        {
            var sym = mpl_internal_eval_symbolic(mpl, code);
            mpl_internal_write_text(mpl, mpl_internal_format_symbol(mpl, sym));
        }
            break;
        case A_LOGICAL:
            /* logical value */
        {
            var bit = mpl_internal_eval_logical(mpl, code);
            mpl_internal_write_text(mpl, bit ? "true" : "false");
        }
            break;
        case A_TUPLE:
            /* n-tuple */
        {
            var tuple = mpl_internal_eval_tuple(mpl, code);
            mpl_internal_write_text(mpl, mpl_internal_format_tuple(mpl, '(', tuple));
        }
            break;
        case A_ELEMSET:
            /* elemental set */
        {   var set = mpl_internal_eval_elemset(mpl, code);
            if (set.head == 0)
                mpl_internal_write_text(mpl, "set is empty");
            for (var memb = set.head; memb != null; memb = memb.next)
                mpl_internal_write_text(mpl, "   " + mpl_internal_format_tuple(mpl, '(', memb.tuple));
        }
            break;
        case A_FORMULA:
            /* linear form */
        {   var term;
            var form = mpl_internal_eval_formula(mpl, code);
            if (form == null)
                mpl_internal_write_text(mpl, "linear form is empty");
            for (term = form; term != null; term = term.next)
            {  if (term.var_ == null)
                mpl_internal_write_text(mpl, "   " + term.coef);
            else
                mpl_internal_write_text(mpl, "   " + term.coef + " " + term.var_.var_.name + mpl_internal_format_tuple(mpl, '[', term.var_.memb.tuple));
            }
        }
            break;
        default:
            xassert(code != code);
    }
}

function mpl_internal_display_func(mpl, dpy){
    var memb;
    /* this is auxiliary routine to work within domain scope */
    for (var entry = dpy.list; entry != null; entry = entry.next)
    {  if (entry.type == A_INDEX)
    {  /* dummy index */
        var slot = entry.u.slot;
        mpl_internal_write_text(mpl, slot.name + " = " + mpl_internal_format_symbol(mpl, slot.value));
    }
    else if (entry.type == A_SET)
    {  /* model set */
        var set = entry.u.set;
        if (set.assign != null)
        {  /* the set has assignment expression; evaluate all its
         members over entire domain */
            mpl_internal_eval_whole_set(mpl, set);
        }
        else
        {  /* the set has no assignment expression; refer to its
         any existing member ignoring resultant value to check
         the data provided the data section */
            if (set.gadget != null && set.data == 0)
            {  /* initialize the set with data from a plain set */
                mpl_internal_saturate_set(mpl, set);
            }
            if (set.array.head != null)
                mpl_internal_eval_member_set(mpl, set, set.array.head.tuple);
        }
        /* display all members of the set array */
        if (set.array.head == null)
            mpl_internal_write_text(mpl, set.name + " has empty content");
        for (memb = set.array.head; memb != null; memb =
            memb.next) mpl_internal_display_set(mpl, set, memb);
    }
    else if (entry.type == A_PARAMETER)
    {  /* model parameter */
        var par = entry.u.par;
        if (par.assign != null)
        {  /* the parameter has an assignment expression; evaluate
         all its member over entire domain */
            mpl_internal_eval_whole_par(mpl, par);
        }
        else
        {  /* the parameter has no assignment expression; refer to
         its any existing member ignoring resultant value to
         check the data provided in the data section */
            if (par.array.head != null)
            {  if (par.type != A_SYMBOLIC)
                mpl_internal_eval_member_num(mpl, par, par.array.head.tuple);
            else
                mpl_internal_eval_member_sym(mpl, par, par.array.head.tuple);
            }
        }
        /* display all members of the parameter array */
        if (par.array.head == null)
            mpl_internal_write_text(mpl, par.name + " has empty content");
        for (memb = par.array.head; memb != null; memb =
            memb.next) mpl_internal_display_par(mpl, par, memb);
    }
    else if (entry.type == A_VARIABLE)
    {  /* model variable */
        var var_ = entry.u.var_;
        xassert(mpl.flag_p);
        /* display all members of the variable array */
        if (var_.array.head == null)
            mpl_internal_write_text(mpl, var_.name + " has empty content");
        for (memb = var_.array.head; memb != null; memb = memb.next)
            mpl_internal_display_var(mpl, var_, memb, DOT_NONE);
    }
    else if (entry.type == A_CONSTRAINT)
    {  /* model constraint */
        var con = entry.u.con;
        xassert(mpl.flag_p);
        /* display all members of the constraint array */
        if (con.array.head == null)
            mpl_internal_write_text(mpl, con.name + " has empty content");
        for (memb = con.array.head; memb != null; memb = memb.next)
            mpl_internal_display_con(mpl, con, memb, DOT_NONE);
    }
    else if (entry.type == A_EXPRESSION)
    {  /* expression */
        var code = entry.u.code;
        if (code.op == O_MEMNUM || code.op == O_MEMSYM ||
            code.op == O_MEMSET || code.op == O_MEMVAR ||
            code.op == O_MEMCON)
            mpl_internal_display_memb(mpl, code);
        else
            mpl_internal_display_code(mpl, code);
    }
    else
        xassert(entry != entry);
    }
    return 0;
}

function mpl_internal_execute_display(mpl, dpy){
    mpl_internal_loop_within_domain(mpl, dpy.domain, dpy, mpl_internal_display_func);
}

function mpl_internal_print_char(mpl, c){
    if (mpl.prt_fp == null)
        mpl_internal_write_char(mpl, c);
    else
        mpl.prt_fp(c);
}

function mpl_internal_print_text(mpl, buf){
    xassert(buf.length < OUTBUF_SIZE);
    for (var c = 0; c < buf.length; c++) mpl_internal_print_char(mpl, buf[c]);
}

function mpl_internal_printf_func(mpl, prt){
    /* this is auxiliary routine to work within domain scope */
    var entry;
    var fmt;
    var from;
    var c;
    var value;
    /* evaluate format control string */
    var sym = mpl_internal_eval_symbolic(mpl, prt.fmt);
    if (sym.str == null)
        fmt = String(sym.num);
    else
        fmt = sym.str;
    /* scan format control string and perform formatting output */
    entry = prt.list;
    for (c = 0; c < fmt.length; c++)
    {  if (fmt[c] == '%')
    {  /* scan format specifier */
        from = c++;
        if (fmt[c] == '%')
        {  mpl_internal_print_char(mpl, '%');
            continue;
        }
        if (entry == null) break;
        /* scan optional flags */
        while (fmt[c] == '-' || fmt[c] == '+' || fmt[c] == ' ' || fmt[c] == '#' || fmt[c] == '0') c++;
        /* scan optional minimum field width */
        while (isdigit(fmt[c])) c++;
        /* scan optional precision */
        if (fmt[c] == '.')
        {  c++;
            while (isdigit(fmt[c])) c++;
        }
        /* scan conversion specifier and perform formatting */
        // save = (c+1);  *(c+1) = '\0';
        if (fmt[c] == 'd' || fmt[c] == 'i' || fmt[c] == 'e' || fmt[c] == 'E' ||
            fmt[c] == 'f' || fmt[c] == 'F' || fmt[c] == 'g' || fmt[c] == 'G')
        {  /* the specifier requires numeric value */
            xassert(entry != null);
            switch (entry.code.type)
            {  case A_NUMERIC:
                value = mpl_internal_eval_numeric(mpl, entry.code);
                break;
                case A_SYMBOLIC:
                    sym = mpl_internal_eval_symbolic(mpl, entry.code);
                    if (sym.str != null)
                        mpl_internal_error(mpl, "cannot convert " + mpl_internal_format_symbol(mpl, sym) + " to floating-point number");
                    value = sym.num;
                    break;
                case A_LOGICAL:
                    if (mpl_internal_eval_logical(mpl, entry.code))
                        value = 1.0;
                    else
                        value = 0.0;
                    break;
                default:
                    xassert(entry != entry);
            }
            if (fmt[c] == 'd' || fmt[c] == 'i')
            {  var int_max = INT_MAX;
                if (!(-int_max <= value && value <= +int_max))
                    mpl_internal_error(mpl, "cannot convert " + value + " to integer");
                mpl_internal_print_text(mpl, sprintf(fmt.slice(from, c+1), Math.floor(value + 0.5)|0));
            }
            else
                mpl_internal_print_text(mpl, sprintf(fmt.slice(from, c+1), value));
        }
        else if (fmt[c] == 's')
        {  /* the specifier requires symbolic value */
            switch (entry.code.type)
            {   case A_NUMERIC:
                value = String(mpl_internal_eval_numeric(mpl, entry.code));
                break;
                case A_LOGICAL:
                    if (mpl_internal_eval_logical(mpl, entry.code))
                        value = "T";
                    else
                        value = "F";
                    break;
                case A_SYMBOLIC:
                    sym = mpl_internal_eval_symbolic(mpl, entry.code);
                    if (sym.str == null)
                        value = String(sym.num);
                    else
                        value = sym.str;
                    break;
                default:
                    xassert(entry != entry);
            }
            mpl_internal_print_text(mpl, sprintf(fmt.slice(from, c+1), value));
        }
        else
            mpl_internal_error(mpl, "format specifier missing or invalid");
        //*(c+1) = save;
        entry = entry.next;
    }
    else if (fmt[c] == '\\')
    {  /* write some control character */
        c++;
        if (fmt[c] == 't')
            mpl_internal_print_char(mpl, '\t');
        else if (fmt[c] == 'n')
            mpl_internal_print_char(mpl, '\n');
        else if (fmt[c] == '\0')
        {  /* format string ends with backslash */
            mpl_internal_error(mpl, "invalid use of escape character \\ in format control string");
        }
        else
            mpl_internal_print_char(mpl, fmt[c]);
    }
    else
    {  /* write character without formatting */
        mpl_internal_print_char(mpl, fmt[c]);
    }
    }
    return 0;
}

function mpl_internal_execute_printf(mpl, prt){
    if (prt.fname == null)
    {
        mpl.prt_file = null;
    }
    else
    {   /* evaluate file name string */
        var sym = mpl_internal_eval_symbolic(mpl, prt.fname);
        if (sym.str == null)
            mpl.prt_file = sym.num;
        else
            mpl.prt_file = sym.str;
    }
    mpl_internal_loop_within_domain(mpl, prt.domain, prt, mpl_internal_printf_func);
}

function mpl_internal_for_func(mpl, fur){
    /* this is auxiliary routine to work within domain scope */
    var save = mpl.stmt;
    for (var stmt = fur.list; stmt != null; stmt = stmt.next)
        mpl_internal_execute_statement(mpl, stmt);
    mpl.stmt = save;
    return 0;
}

function mpl_internal_execute_for(mpl, fur){
    mpl_internal_loop_within_domain(mpl, fur.domain, fur, mpl_internal_for_func);
}

function mpl_internal_execute_statement(mpl, stmt){
    mpl.stmt = stmt;
    switch (stmt.type)
    {   case A_SET:
        case A_PARAMETER:
        case A_VARIABLE:
            break;
        case A_CONSTRAINT:
            xprintf("Generating " + stmt.u.con.name + "...");
            mpl_internal_eval_whole_con(mpl, stmt.u.con);
            break;
        case A_TABLE:
            switch (stmt.u.tab.type)
            {  case A_INPUT:
                xprintf("Reading " + stmt.u.tab.name + "...");
                break;
                case A_OUTPUT:
                    xprintf("Writing " + stmt.u.tab.name + "...");
                    break;
                default:
                    xassert(stmt != stmt);
            }
            mpl_internal_execute_table(mpl, stmt.u.tab);
            break;
        case A_SOLVE:
            break;
        case A_CHECK:
            xprintf("Checking (line " + stmt.line + ")...");
            mpl_internal_execute_check(mpl, stmt.u.chk);
            break;
        case A_DISPLAY:
            mpl_internal_write_text(mpl, "Display statement at line " + stmt.line);
            mpl_internal_execute_display(mpl, stmt.u.dpy);
            break;
        case A_PRINTF:
            mpl_internal_execute_printf(mpl, stmt.u.prt);
            break;
        case A_FOR:
            mpl_internal_execute_for(mpl, stmt.u.fur);
            break;
        default:
            xassert(stmt != stmt);
    }
}

