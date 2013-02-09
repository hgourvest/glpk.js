/* glpmpl01.c */

/**********************************************************************/
/* * *                  PROCESSING MODEL SECTION                  * * */
/**********************************************************************/

function mpl_internal_enter_context(mpl){
    var image;
    if (mpl.token == T_EOF)
        image = "_|_";
    else if (mpl.token == T_STRING)
        image = "'...'";
    else
        image = mpl.image;
    xassert(0 <= mpl.c_ptr && mpl.c_ptr < CONTEXT_SIZE);
    mpl.context[mpl.c_ptr++] = ' ';
    if (mpl.c_ptr == CONTEXT_SIZE) mpl.c_ptr = 0;
    for (var s = 0; s < image.length; s++)
    {   mpl.context[mpl.c_ptr++] = image[s];
        if (mpl.c_ptr == CONTEXT_SIZE) mpl.c_ptr = 0;
    }
}

function mpl_internal_print_context(mpl){
    var c;
    while (mpl.c_ptr > 0)
    {  mpl.c_ptr--;
        c = mpl.context[0];
        xcopyArr(mpl.context, 0, mpl.context, 1, CONTEXT_SIZE-1);
        mpl.context[CONTEXT_SIZE-1] = c;
    }
    xprintf("Context: " + mpl.line + " > " +  (mpl.context[0] == ' ' ? "" : "...") + mpl.context.join('').trim());
}

function mpl_internal_get_char(mpl){
    var c;
    if (mpl.c == MPL_EOF) return;
    if (mpl.c == '\n'){
        mpl.line++;
        mpl.column = 0;
    }
    c = mpl_internal_read_char(mpl);
    mpl.column++;
    if (c == MPL_EOF)
    {  if (mpl.c == '\n')
        mpl.line--;
    else
        mpl_internal_warning(mpl, "final NL missing before end of file");
    }
    else if (c == '\n'){

    }
    else if (isspace(c))
        c = ' ';
    else if (iscntrl(c))
    {  mpl_internal_enter_context(mpl);
        mpl_internal_error(mpl, "control character " + c + " not allowed");
    }
    mpl.c = c;
}

function mpl_internal_append_char(mpl){
    xassert(0 <= mpl.imlen /*&& mpl.imlen <= MAX_LENGTH*/);
/*
    if (mpl.imlen >= MAX_LENGTH)
    {  switch (mpl.token)
    {  case T_NAME:
            mpl_internal_enter_context(mpl);
            mpl_internal_error(mpl, "symbolic name " + mpl.image + "... too long");
            break;
        case T_SYMBOL:
            mpl_internal_enter_context(mpl);
            mpl_internal_error(mpl, "symbol " + mpl.image + "... too long");
            break;
        case T_NUMBER:
            mpl_internal_enter_context(mpl);
            mpl_internal_error(mpl, "numeric literal " + mpl.image + "... too long");
            break;

        case T_STRING:
            mpl_internal_enter_context(mpl);
            mpl_internal_error(mpl, "string literal too long");
            break;
        default:
            xassert(mpl != mpl);
    }
    }
*/
    mpl.image += mpl.c ;
    mpl.imlen++;
    mpl_internal_get_char(mpl);
}

function mpl_internal_get_token(mpl){

    function sptp(){
        mpl_internal_enter_context(mpl);
        mpl_internal_error(mpl, "keyword s.t. incomplete");
    }

    function err(){
        mpl_internal_enter_context(mpl);
        mpl_internal_error(mpl, "cannot convert numeric literal " + mpl.image + " to floating-point number");
    }

    function scanDecimal(){
        /* scan optional decimal exponent */
        if (mpl.c == 'e' || mpl.c == 'E')
        {   mpl_internal_append_char(mpl);
            if (mpl.c == '+' || mpl.c == '-') mpl_internal_append_char(mpl);
            if (!isdigit(mpl.c))
            {  mpl_internal_enter_context(mpl);
                mpl_internal_error(mpl, "numeric literal " + mpl.image + " incomplete");
            }
            while (isdigit(mpl.c)) mpl_internal_append_char(mpl);
        }
        /* there must be no letter following the numeric literal */
        if (isalpha(mpl.c) || mpl.c == '_')
        {   mpl_internal_enter_context(mpl);
            mpl_internal_error(mpl, "symbol " + mpl.image + mpl.c + "... should be enclosed in quotes");
        }
    }

    /* save the current token */
    mpl.b_token = mpl.token;
    mpl.b_imlen = mpl.imlen;
    mpl.b_image = mpl.image;
    mpl.b_value = mpl.value;
    /* if the next token is already scanned, make it current */
    if (mpl.f_scan)
    {   mpl.f_scan = 0;
        mpl.token = mpl.f_token;
        mpl.imlen = mpl.f_imlen;
        mpl.image = mpl.f_image;
        mpl.value = mpl.f_value;
        return;
    }
    /* nothing has been scanned so far */
    while (true){
        mpl.token = 0;
        mpl.imlen = 0;
        mpl.image = '';
        mpl.value = 0.0;
        /* skip any uninteresting characters */
        while (mpl.c == ' ' || mpl.c == '\n') mpl_internal_get_char(mpl);
        /* recognize and construct the token */
        if (mpl.c == MPL_EOF)
        {  /* end-of-file reached */
            mpl.token = T_EOF;
        }
        else if (mpl.c == '#')
        {  /* comment; skip anything until end-of-line */
            while (mpl.c != '\n' && mpl.c != MPL_EOF) mpl_internal_get_char(mpl);
            continue;
        }
        else if (!mpl.flag_d && (isalpha(mpl.c) || mpl.c == '_'))
        {  /* symbolic name or reserved keyword */
            mpl.token = T_NAME;
            while (isalnum(mpl.c) || mpl.c == '_') mpl_internal_append_char(mpl);
            if (mpl.image == "and")
                mpl.token = T_AND;
            else if (mpl.image == "by")
                mpl.token = T_BY;
            else if (mpl.image == "cross")
                mpl.token = T_CROSS;
            else if (mpl.image == "diff")
                mpl.token = T_DIFF;
            else if (mpl.image == "div")
                mpl.token = T_DIV;
            else if (mpl.image == "else")
                mpl.token = T_ELSE;
            else if (mpl.image == "if")
                mpl.token = T_IF;
            else if (mpl.image == "in")
                mpl.token = T_IN;
            else if (mpl.image == "Infinity")
                mpl.token = T_INFINITY;
            else if (mpl.image == "inter")
                mpl.token = T_INTER;
            else if (mpl.image == "less")
                mpl.token = T_LESS;
            else if (mpl.image == "mod")
                mpl.token = T_MOD;
            else if (mpl.image == "not")
                mpl.token = T_NOT;
            else if (mpl.image == "or")
                mpl.token = T_OR;
            else if (mpl.image == "s" && mpl.c == '.')
            {   mpl.token = T_SPTP;
                mpl_internal_append_char(mpl);
                if (mpl.c != 't') sptp();
                mpl_internal_append_char(mpl);
                if (mpl.c != '.') sptp();
                mpl_internal_append_char(mpl);
            }
            else if (mpl.image == "symdiff")
                mpl.token = T_SYMDIFF;
            else if (mpl.image == "then")
                mpl.token = T_THEN;
            else if (mpl.image == "union")
                mpl.token = T_UNION;
            else if (mpl.image == "within")
                mpl.token = T_WITHIN;
        }
        else if (!mpl.flag_d && isdigit(mpl.c))
        {   /* numeric literal */
            mpl.token = T_NUMBER;
            /* scan integer part */
            while (isdigit(mpl.c)) mpl_internal_append_char(mpl);
            /* scan optional fractional part */
            var skip = false;
            if (mpl.c == '.')
            {   mpl_internal_append_char(mpl);
                if (mpl.c == '.')
                {  /* hmm, it is not the fractional part, it is dots that
                 follow the integer part */
                    mpl.imlen--;
                    mpl.image = mpl.image.substr(0,mpl.image.length-1);
                    mpl.f_dots = 1;
                    skip = true;
                } else{
                    while (isdigit(mpl.c)) mpl_internal_append_char(mpl);
                }
            }
            if (!skip)
                scanDecimal();
            /* convert numeric literal to floating-point */
            if (str2num(mpl.image, function(v){mpl.value = v})) err();
        }
        else if (mpl.c == '\'' || mpl.c == '"')
        {   /* character string */
            var quote = mpl.c;
            var triple = false;
            mpl.token = T_STRING;
            mpl_internal_get_char(mpl);


            function eat(){
                for (;;)
                {   if ((mpl.c == '\n' && !triple) || mpl.c == MPL_EOF)
                    {   mpl_internal_enter_context(mpl);
                        mpl_internal_error(mpl, "unexpected end of line; string literal incomplete");
                    }
                    if (mpl.c == quote)
                    {   mpl_internal_get_char(mpl);
                        if (mpl.c == quote)
                        {   if (triple)
                            {   mpl_internal_get_char(mpl);
                                if (mpl.c == quote)
                                {
                                    mpl_internal_get_char(mpl);
                                    break;
                                } else {
                                    mpl.image += '""' ;
                                    mpl.imlen += 2;
                                }
                            }
                        } else {
                            if (triple)
                            {
                                mpl.image += '"' ;
                                mpl.imlen++;
                            } else
                                break;
                        }

                    }
                    mpl_internal_append_char(mpl);
                }
            }

            if (mpl.c == quote){
                mpl_internal_get_char(mpl);
                if (mpl.c == quote){
                    triple = true;
                    mpl_internal_get_char(mpl);
                    eat();
                } else {
                    // empty string
                }
            } else {
                eat()
            }
        }
        else if (!mpl.flag_d && mpl.c == '+'){
            mpl.token = T_PLUS; mpl_internal_append_char(mpl);
        }
        else if (!mpl.flag_d && mpl.c == '-'){
            mpl.token = T_MINUS; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == '*')
        {   mpl.token = T_ASTERISK; mpl_internal_append_char(mpl);
            if (mpl.c == '*'){
                mpl.token = T_POWER; mpl_internal_append_char(mpl);
            }
        }
        else if (mpl.c == '/')
        {   mpl.token = T_SLASH; mpl_internal_append_char(mpl);
            if (mpl.c == '*')
            {  /* comment sequence */
                mpl_internal_get_char(mpl);
                for (;;)
                {  if (mpl.c == MPL_EOF)
                {  /* do not call enter_context at this point */
                    mpl_internal_error(mpl, "unexpected end of file; comment sequence incomplete");
                }
                else if (mpl.c == '*')
                {  mpl_internal_get_char(mpl);
                    if (mpl.c == '/') break;
                }
                else
                    mpl_internal_get_char(mpl);
                }
                mpl_internal_get_char(mpl);
                continue;
            }
        }
        else if (mpl.c == '^'){
            mpl.token = T_POWER; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == '<')
        {   mpl.token = T_LT; mpl_internal_append_char(mpl);
            if (mpl.c == '='){
                mpl.token = T_LE; mpl_internal_append_char(mpl);
            }
            else if (mpl.c == '>'){
                mpl.token = T_NE; mpl_internal_append_char(mpl);
            }
            else if (mpl.c == '-'){
                mpl.token = T_INPUT; mpl_internal_append_char(mpl);
            }
        }
        else if (mpl.c == '=')
        {   mpl.token = T_EQ; mpl_internal_append_char(mpl);
            if (mpl.c == '=') mpl_internal_append_char(mpl);
        }
        else if (mpl.c == '>')
        {   mpl.token = T_GT; mpl_internal_append_char(mpl);
            if (mpl.c == '='){
                mpl.token = T_GE; mpl_internal_append_char(mpl);
            }
            else if (mpl.c == '>'){
                mpl.token = T_APPEND; mpl_internal_append_char(mpl);
            }
        }
        else if (mpl.c == '!')
        {   mpl.token = T_NOT; mpl_internal_append_char(mpl);
            if (mpl.c == '='){
                mpl.token = T_NE; mpl_internal_append_char(mpl);
            }
        }
        else if (mpl.c == '&')
        {   mpl.token = T_CONCAT; mpl_internal_append_char(mpl);
            if (mpl.c == '&'){
                mpl.token = T_AND; mpl_internal_append_char(mpl);
            }
        }
        else if (mpl.c == '|')
        {   mpl.token = T_BAR; mpl_internal_append_char(mpl);
            if (mpl.c == '|'){
                mpl.token = T_OR; mpl_internal_append_char(mpl);
            }
        }
        else if (!mpl.flag_d && mpl.c == '.')
        {   mpl.token = T_POINT; mpl_internal_append_char(mpl);
            if (mpl.f_dots)
            {  /* dots; the first dot was read on the previous call to the
             scanner, so the current character is the second dot */
                mpl.token = T_DOTS;
                mpl.imlen = 2;
                mpl.image = "..";
                mpl.f_dots = 0;
            }
            else if (mpl.c == '.'){
                mpl.token = T_DOTS; mpl_internal_append_char(mpl);
            }
            else if (isdigit(mpl.c))
            {  /* numeric literal that begins with the decimal point */
                mpl.token = T_NUMBER; mpl_internal_append_char(mpl);
                while (isdigit(mpl.c)) mpl_internal_append_char(mpl);
                scanDecimal();
                /* convert numeric literal to floating-point */
                if (str2num(mpl.image, function(v){mpl.value = v})) err();
            }
        }
        else if (mpl.c == ','){
            mpl.token = T_COMMA; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == ':')
        {  mpl.token = T_COLON; mpl_internal_append_char(mpl);
            if (mpl.c == '='){
                mpl.token = T_ASSIGN; mpl_internal_append_char(mpl);
            }
        }
        else if (mpl.c == ';'){
            mpl.token = T_SEMICOLON; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == '('){
            mpl.token = T_LEFT; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == ')'){
            mpl.token = T_RIGHT; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == '['){
            mpl.token = T_LBRACKET; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == ']'){
            mpl.token = T_RBRACKET; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == '{'){
            mpl.token = T_LBRACE; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == '}'){
            mpl.token = T_RBRACE; mpl_internal_append_char(mpl);
        }
        else if (mpl.c == '~'){
            mpl.token = T_TILDE; mpl_internal_append_char(mpl);
        }
        else if (isalnum(mpl.c) || strchr("+-._", mpl.c) >= 0)
        {   /* symbol */
            xassert(mpl.flag_d);
            mpl.token = T_SYMBOL;
            while (isalnum(mpl.c) || strchr("+-._", mpl.c) >= 0)
                mpl_internal_append_char(mpl);
            switch (str2num(mpl.image, function(v){mpl.value = v})){
                case 0:
                    mpl.token = T_NUMBER;
                    break;
                case 1:
                    err();
                    break;
                case 2:
                    break;
                default:
                    xassert(mpl != mpl);
            }
        }
        else
        {   mpl_internal_enter_context(mpl);
            mpl_internal_error(mpl, "character " + mpl.c + " not allowed");
        }

        break;
    }

    /* enter the current token into the context queue */
    mpl_internal_enter_context(mpl);
    /* reset the flag, which may be set by indexing_expression() and
     is used by expression_list() */
    mpl.flag_x = 0;
}

function mpl_internal_unget_token(mpl){
    /* save the current token, which becomes the next one */
    xassert(!mpl.f_scan);
    mpl.f_scan = 1;
    mpl.f_token = mpl.token;
    mpl.f_imlen = mpl.imlen;
    mpl.f_image = mpl.image;
    mpl.f_value = mpl.value;
    /* restore the previous token, which becomes the current one */
    mpl.token = mpl.b_token;
    mpl.imlen = mpl.b_imlen;
    mpl.image = mpl.b_image;
    mpl.value = mpl.b_value;
}

function mpl_internal_is_keyword(mpl, keyword){
    return mpl.token == T_NAME && mpl.image == keyword;
}

function mpl_internal_is_reserved(mpl){
    return mpl.token == T_AND && mpl.image[0] == 'a' ||
        mpl.token == T_BY ||
        mpl.token == T_CROSS ||
        mpl.token == T_DIFF ||
        mpl.token == T_DIV ||
        mpl.token == T_ELSE ||
        mpl.token == T_IF ||
        mpl.token == T_IN ||
        mpl.token == T_INTER ||
        mpl.token == T_LESS ||
        mpl.token == T_MOD ||
        mpl.token == T_NOT && mpl.image[0] == 'n' ||
        mpl.token == T_OR && mpl.image[0] == 'o' ||
        mpl.token == T_SYMDIFF ||
        mpl.token == T_THEN ||
        mpl.token == T_UNION ||
        mpl.token == T_WITHIN;
}

function mpl_internal_make_code(mpl, op, arg, type, dim){
    var code = {};
    var domain;
    var block;
    var e;
    /* generate pseudo-code */
    code.op = op;
    code.vflag = 0; /* is inherited from operand(s) */
    /* copy operands and also make them referring to the pseudo-code
     being generated, because the latter becomes the parent for all
     its operands */
    code.arg = mpl_internal_create_operands();
    code.value = {};
    switch (op)
    {   case O_NUMBER:
        code.arg.num = arg.num;
        break;
        case O_STRING:
            code.arg.str = arg.str;
            break;
        case O_INDEX:
            code.arg.index.slot = arg.index.slot;
            code.arg.index.next = arg.index.next;
            break;
        case O_MEMNUM:
        case O_MEMSYM:
            for (e = arg.par.list; e != null; e = e.next)
            {  xassert(e.x != null);
                xassert(e.x.up == null);
                e.x.up = code;
                code.vflag |= e.x.vflag;
            }
            code.arg.par.par = arg.par.par;
            code.arg.par.list = arg.par.list;
            break;
        case O_MEMSET:
            for (e = arg.set.list; e != null; e = e.next)
            {  xassert(e.x != null);
                xassert(e.x.up == null);
                e.x.up = code;
                code.vflag |= e.x.vflag;
            }
            code.arg.set.set = arg.set.set;
            code.arg.set.list = arg.set.list;
            break;
        case O_MEMVAR:
            for (e = arg.var_.list; e != null; e = e.next)
            {  xassert(e.x != null);
                xassert(e.x.up == null);
                e.x.up = code;
                code.vflag |= e.x.vflag;
            }
            code.arg.var_.var_ = arg.var_.var_;
            code.arg.var_.list = arg.var_.list;
            code.arg.var_.suff = arg.var_.suff;
            break;
        case O_MEMCON:
            for (e = arg.con.list; e != null; e = e.next)
            {  xassert(e.x != null);
                xassert(e.x.up == null);
                e.x.up = code;
                code.vflag |= e.x.vflag;
            }
            code.arg.con.con = arg.con.con;
            code.arg.con.list = arg.con.list;
            code.arg.con.suff = arg.con.suff;
            break;
        case O_TUPLE:
        case O_MAKE:
            for (e = arg.list; e != null; e = e.next)
            {  xassert(e.x != null);
                xassert(e.x.up == null);
                e.x.up = code;
                code.vflag |= e.x.vflag;
            }
            code.arg.list = arg.list;
            break;
        case O_SLICE:
            xassert(arg.slice != null);
            code.arg.slice = arg.slice;
            break;
        case O_IRAND224:
        case O_UNIFORM01:
        case O_NORMAL01:
        case O_GMTIME:
            code.vflag = 1;
            break;
        case O_CVTNUM:
        case O_CVTSYM:
        case O_CVTLOG:
        case O_CVTTUP:
        case O_CVTLFM:
        case O_PLUS:
        case O_MINUS:
        case O_NOT:
        case O_ABS:
        case O_CEIL:
        case O_FLOOR:
        case O_EXP:
        case O_LOG:
        case O_LOG10:
        case O_SQRT:
        case O_SIN:
        case O_COS:
        case O_ATAN:
        case O_ROUND:
        case O_TRUNC:
        case O_CARD:
        case O_LENGTH:
            /* unary operation */
            xassert(arg.arg.x != null);
            xassert(arg.arg.x.up == null);
            arg.arg.x.up = code;
            code.vflag |= arg.arg.x.vflag;
            code.arg.arg.x = arg.arg.x;
            break;
        case O_ADD:
        case O_SUB:
        case O_LESS:
        case O_MUL:
        case O_DIV:
        case O_IDIV:
        case O_MOD:
        case O_POWER:
        case O_ATAN2:
        case O_ROUND2:
        case O_TRUNC2:
        case O_UNIFORM:
            if (op == O_UNIFORM) code.vflag = 1;
        case O_NORMAL:
            if (op == O_NORMAL) code.vflag = 1;
        case O_CONCAT:
        case O_LT:
        case O_LE:
        case O_EQ:
        case O_GE:
        case O_GT:
        case O_NE:
        case O_AND:
        case O_OR:
        case O_UNION:
        case O_DIFF:
        case O_SYMDIFF:
        case O_INTER:
        case O_CROSS:
        case O_IN:
        case O_NOTIN:
        case O_WITHIN:
        case O_NOTWITHIN:
        case O_SUBSTR:
        case O_STR2TIME:
        case O_TIME2STR:
            /* binary operation */
            xassert(arg.arg.x != null);
            xassert(arg.arg.x.up == null);
            arg.arg.x.up = code;
            code.vflag |= arg.arg.x.vflag;
            xassert(arg.arg.y != null);
            xassert(arg.arg.y.up == null);
            arg.arg.y.up = code;
            code.vflag |= arg.arg.y.vflag;
            code.arg.arg.x = arg.arg.x;
            code.arg.arg.y = arg.arg.y;
            break;
        case O_DOTS:
        case O_FORK:
        case O_SUBSTR3:
            /* ternary operation */
            xassert(arg.arg.x != null);
            xassert(arg.arg.x.up == null);
            arg.arg.x.up = code;
            code.vflag |= arg.arg.x.vflag;
            xassert(arg.arg.y != null);
            xassert(arg.arg.y.up == null);
            arg.arg.y.up = code;
            code.vflag |= arg.arg.y.vflag;
            if (arg.arg.z != null)
            {  xassert(arg.arg.z.up == null);
                arg.arg.z.up = code;
                code.vflag |= arg.arg.z.vflag;
            }
            code.arg.arg.x = arg.arg.x;
            code.arg.arg.y = arg.arg.y;
            code.arg.arg.z = arg.arg.z;
            break;
        case O_MIN:
        case O_MAX:
            /* n-ary operation */
            for (e = arg.list; e != null; e = e.next)
            {  xassert(e.x != null);
                xassert(e.x.up == null);
                e.x.up = code;
                code.vflag |= e.x.vflag;
            }
            code.arg.list = arg.list;
            break;
        case O_SUM:
        case O_PROD:
        case O_MINIMUM:
        case O_MAXIMUM:
        case O_FORALL:
        case O_EXISTS:
        case O_SETOF:
        case O_BUILD:
            /* iterated operation */
            domain = arg.loop.domain;
            xassert(domain != null);
            if (domain.code != null)
            {  xassert(domain.code.up == null);
                domain.code.up = code;
                code.vflag |= domain.code.vflag;
            }
            for (block = domain.list; block != null; block =
                block.next)
            {  xassert(block.code != null);
                xassert(block.code.up == null);
                block.code.up = code;
                code.vflag |= block.code.vflag;
            }
            if (arg.loop.x != null)
            {  xassert(arg.loop.x.up == null);
                arg.loop.x.up = code;
                code.vflag |= arg.loop.x.vflag;
            }
            code.arg.loop.domain = arg.loop.domain;
            code.arg.loop.x = arg.loop.x;
            break;
        default:
            xassert(op != op);
    }
    /* set other attributes of the pseudo-code */
    code.type = type;
    code.dim = dim;
    code.up = null;
    code.valid = 0;
    code.value = {};
    return code;
}

function mpl_internal_make_unary(mpl, op, x, type, dim){
    var code;
    var arg = mpl_internal_create_operands();
    xassert(x != null);
    arg.arg.x = x;
    code = mpl_internal_make_code(mpl, op, arg, type, dim);
    return code;
}

function mpl_internal_make_binary(mpl, op, x, y, type, dim){
    var code;
    var arg = mpl_internal_create_operands();
    xassert(x != null);
    xassert(y != null);
    arg.arg.x = x;
    arg.arg.y = y;
    code = mpl_internal_make_code(mpl, op, arg, type, dim);
    return code;
}

function mpl_internal_make_ternary(mpl, op, x, y, z, type, dim){
    var code;
    var arg = mpl_internal_create_operands();
    xassert(x != null);
    xassert(y != null);
    /* third operand can be null */
    arg.arg.x = x;
    arg.arg.y = y;
    arg.arg.z = z;
    code = mpl_internal_make_code(mpl, op, arg, type, dim);
    return code;
}

function mpl_internal_numeric_literal(mpl){
    var code;
    var arg = mpl_internal_create_operands();
    xassert(mpl.token == T_NUMBER);
    arg.num = mpl.value;
    code = mpl_internal_make_code(mpl, O_NUMBER, arg, A_NUMERIC, 0);
    mpl_internal_get_token(mpl /* <numeric literal> */);
    return code;
}

function mpl_internal_string_literal(mpl){
    var code;
    var arg = mpl_internal_create_operands();
    xassert(mpl.token == T_STRING);
    arg.str = mpl.image;
    code = mpl_internal_make_code(mpl, O_STRING, arg, A_SYMBOLIC, 0);
    mpl_internal_get_token(mpl /* <string literal> */);
    return code;
}

function mpl_internal_expand_arg_list(mpl, list, x){
    var tail = {}, temp;
    xassert(x != null);
    /* create new operands list entry */
    tail.x = x;
    tail.next = null;
    /* and append it to the operands list */
    if (list == null)
        list = tail;
    else
    {   for (temp = list; temp.next != null; temp = temp.next){}
        temp.next = tail;
    }
    return list;
}

function mpl_internal_arg_list_len(mpl, list){
    var temp;
    var len;

    len = 0;
    for (temp = list; temp != null; temp = temp.next) len++;
    return len;
}

function mpl_internal_subscript_list(mpl){
    var x;
    var list = null;
    for (;;)
    {   /* parse subscript expression */
        x = mpl_internal_expression_5(mpl);
        /* convert it to symbolic type, if necessary */
        if (x.type == A_NUMERIC)
            x = mpl_internal_make_unary(mpl, O_CVTSYM, x, A_SYMBOLIC, 0);
        /* check that now the expression is of symbolic type */
        if (x.type != A_SYMBOLIC)
            mpl_internal_error(mpl, "subscript expression has invalid type");
        xassert(x.dim == 0);
        /* and append it to the subscript list */
        list = mpl_internal_expand_arg_list(mpl, list, x);
        /* check a token that follows the subscript expression */
        if (mpl.token == T_COMMA)
            mpl_internal_get_token(mpl /* , */);
        else if (mpl.token == T_RBRACKET)
            break;
        else
            mpl_internal_error(mpl, "syntax error in subscript list");
    }
    return list;
}

function mpl_internal_object_reference(mpl){
    var slot, set, par, var_, con, list, code, name, dim, suff;
    var arg = mpl_internal_create_operands();
    /* find the object in the symbolic name table */
    xassert(mpl.token == T_NAME);
    var node = mpl.tree[mpl.image];
    if (node == null)
        mpl_internal_error(mpl, mpl.image + " not defined");
    /* check the object type and obtain its dimension */
    switch (node.type)
    {  case A_INDEX:
        /* dummy index */
        slot = node.link;
        name = slot.name;
        dim = 0;
        break;
        case A_SET:
            /* model set */
            set = node.link;
            name = set.name;
            dim = set.dim;
            /* if a set object is referenced in its own declaration and
             the dimen attribute is not specified yet, use dimen 1 by
             default */
            if (set.dimen == 0) set.dimen = 1;
            break;
        case A_PARAMETER:
            /* model parameter */
            par = node.link;
            name = par.name;
            dim = par.dim;
            break;
        case A_VARIABLE:
            /* model variable */
            var_ = node.link;
            name = var_.name;
            dim = var_.dim;
            break;
        case A_CONSTRAINT:
            /* model constraint or objective */
            con = node.link;
            name = con.name;
            dim = con.dim;
            break;
        default:
            xassert(node != node);
    }
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* parse optional subscript list */
    if (mpl.token == T_LBRACKET)
    {  /* subscript list is specified */
        if (dim == 0)
            mpl_internal_error(mpl, name + " cannot be subscripted");
        mpl_internal_get_token(mpl /* [ */);
        list = mpl_internal_subscript_list(mpl);
        if (dim != mpl_internal_arg_list_len(mpl, list))
            mpl_internal_error(mpl, name + " must have " + dim + " subscript" + (dim == 1 ? "" : "s") + " rather than " + mpl_internal_arg_list_len(mpl, list));
        xassert(mpl.token == T_RBRACKET);
        mpl_internal_get_token(mpl /* ] */);
    }
    else
    {  /* subscript list is not specified */
        if (dim != 0)
            mpl_internal_error(mpl, name + " must be subscripted");
        list = null;
    }
    /* parse optional suffix */
    if (!mpl.flag_s && node.type == A_VARIABLE)
        suff = DOT_NONE;
    else
        suff = DOT_VAL;
    if (mpl.token == T_POINT)
    {  mpl_internal_get_token(mpl /* . */);
        if (mpl.token != T_NAME)
            mpl_internal_error(mpl, "invalid use of period");
        if (!(node.type == A_VARIABLE ||
            node.type == A_CONSTRAINT))
            mpl_internal_error(mpl, name + " cannot have a suffix");
        if (mpl.image == "lb")
            suff = DOT_LB;
        else if (mpl.image == "ub")
            suff = DOT_UB;
        else if (mpl.image == "status")
            suff = DOT_STATUS;
        else if (mpl.image == "val")
            suff = DOT_VAL;
        else if (mpl.image == "dual")
            suff = DOT_DUAL;
        else
            mpl_internal_error(mpl, "suffix ." + mpl.image + " invalid");
        mpl_internal_get_token(mpl /* suffix */);
    }
    /* generate pseudo-code to take value of the object */
    switch (node.type)
    {  case A_INDEX:
        arg.index.slot = slot;
        arg.index.next = slot.list;
        code = mpl_internal_make_code(mpl, O_INDEX, arg, A_SYMBOLIC, 0);
        slot.list = code;
        break;
        case A_SET:
            arg.set.set = set;
            arg.set.list = list;
            code = mpl_internal_make_code(mpl, O_MEMSET, arg, A_ELEMSET, set.dimen);
            break;
        case A_PARAMETER:
            arg.par.par = par;
            arg.par.list = list;
            if (par.type == A_SYMBOLIC)
                code = mpl_internal_make_code(mpl, O_MEMSYM, arg, A_SYMBOLIC, 0);
            else
                code = mpl_internal_make_code(mpl, O_MEMNUM, arg, A_NUMERIC, 0);
            break;
        case A_VARIABLE:
            if (!mpl.flag_s && (suff == DOT_STATUS || suff == DOT_VAL
                || suff == DOT_DUAL))
                mpl_internal_error(mpl, "invalid reference to status, primal value, or dual value of variable " + var_.name + " above solve statement");
            arg.var_.var_ = var_;
            arg.var_.list = list;
            arg.var_.suff = suff;
            code = mpl_internal_make_code(mpl, O_MEMVAR, arg, suff == DOT_NONE ?
                A_FORMULA : A_NUMERIC, 0);
            break;
        case A_CONSTRAINT:
            if (!mpl.flag_s && (suff == DOT_STATUS || suff == DOT_VAL
                || suff == DOT_DUAL))
                mpl_internal_error(mpl, "invalid reference to status, primal value, o"+
                    "r dual value of " + (con.type == A_CONSTRAINT ? "constraint" : "objective") +
                    " " + con.name + " above solve statement");
            arg.con.con = con;
            arg.con.list = list;
            arg.con.suff = suff;
            code = mpl_internal_make_code(mpl, O_MEMCON, arg, A_NUMERIC, 0);
            break;
        default:
            xassert(node != node);
    }
    return code;
}

function mpl_internal_numeric_argument(mpl, func){
    var x = mpl_internal_expression_5(mpl);
    /* convert the argument to numeric type, if necessary */
    if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
    /* check that now the argument is of numeric type */
    if (x.type != A_NUMERIC)
        mpl_internal_error(mpl, "argument for " + func + " has invalid type");
    xassert(x.dim == 0);
    return x;
}

function mpl_internal_symbolic_argument(mpl, func){
    var x = mpl_internal_expression_5(mpl);
    /* convert the argument to symbolic type, if necessary */
    if (x.type == A_NUMERIC)
        x = mpl_internal_make_unary(mpl, O_CVTSYM, x, A_SYMBOLIC, 0);
    /* check that now the argument is of symbolic type */
    if (x.type != A_SYMBOLIC)
        mpl_internal_error(mpl, "argument for " + func + " has invalid type");
    xassert(x.dim == 0);
    return x;
}

function mpl_internal_elemset_argument(mpl, func){
    var x = mpl_internal_expression_9(mpl);
    if (x.type != A_ELEMSET)
        mpl_internal_error(mpl, "argument for " + func + " has invalid type");
    xassert(x.dim > 0);
    return x;
}

function mpl_internal_function_reference(mpl){
    var code;
    var arg = mpl_internal_create_operands();
    var op;
    var func;
    /* determine operation code */
    xassert(mpl.token == T_NAME);
    if (mpl.image == "abs")
        op = O_ABS;
    else if (mpl.image == "ceil")
        op = O_CEIL;
    else if (mpl.image == "floor")
        op = O_FLOOR;
    else if (mpl.image == "exp")
        op = O_EXP;
    else if (mpl.image == "log")
        op = O_LOG;
    else if (mpl.image == "log10")
        op = O_LOG10;
    else if (mpl.image == "sqrt")
        op = O_SQRT;
    else if (mpl.image == "sin")
        op = O_SIN;
    else if (mpl.image == "cos")
        op = O_COS;
    else if (mpl.image == "atan")
        op = O_ATAN;
    else if (mpl.image == "min")
        op = O_MIN;
    else if (mpl.image == "max")
        op = O_MAX;
    else if (mpl.image == "round")
        op = O_ROUND;
    else if (mpl.image == "trunc")
        op = O_TRUNC;
    else if (mpl.image == "Irand224")
        op = O_IRAND224;
    else if (mpl.image == "Uniform01")
        op = O_UNIFORM01;
    else if (mpl.image == "Uniform")
        op = O_UNIFORM;
    else if (mpl.image == "Normal01")
        op = O_NORMAL01;
    else if (mpl.image == "Normal")
        op = O_NORMAL;
    else if (mpl.image == "card")
        op = O_CARD;
    else if (mpl.image == "length")
        op = O_LENGTH;
    else if (mpl.image == "substr")
        op = O_SUBSTR;
    else if (mpl.image == "str2time")
        op = O_STR2TIME;
    else if (mpl.image == "time2str")
        op = O_TIME2STR;
    else if (mpl.image == "gmtime")
        op = O_GMTIME;
    else
        mpl_internal_error(mpl, "function " + mpl.image + " unknown");
    /* save symbolic name of the function */
    func = mpl.image;
    xassert(func.length < 16);
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* check the left parenthesis that follows the function name */
    xassert(mpl.token == T_LEFT);
    mpl_internal_get_token(mpl /* ( */);
    /* parse argument list */
    if (op == O_MIN || op == O_MAX)
    {  /* min and max allow arbitrary number of arguments */
        arg.list = null;
        /* parse argument list */
        for (;;)
        {  /* parse argument and append it to the operands list */
            arg.list = mpl_internal_expand_arg_list(mpl, arg.list,
                mpl_internal_numeric_argument(mpl, func));
            /* check a token that follows the argument */
            if (mpl.token == T_COMMA)
                mpl_internal_get_token(mpl /* , */);
            else if (mpl.token == T_RIGHT)
                break;
            else
                mpl_internal_error(mpl, "syntax error in argument list for " + func);
        }
    }
    else if (op == O_IRAND224 || op == O_UNIFORM01 || op ==
        O_NORMAL01 || op == O_GMTIME)
    {  /* Irand224, Uniform01, Normal01, gmtime need no arguments */
        if (mpl.token != T_RIGHT)
            mpl_internal_error(mpl, func + " needs no arguments");
    }
    else if (op == O_UNIFORM || op == O_NORMAL)
    {  /* Uniform and Normal need two arguments */
        /* parse the first argument */
        arg.arg.x = mpl_internal_numeric_argument(mpl, func);
        /* check a token that follows the first argument */
        if (mpl.token == T_COMMA){

        }
        else if (mpl.token == T_RIGHT)
            mpl_internal_error(mpl, func + " needs two arguments");
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
        mpl_internal_get_token(mpl /* , */);
        /* parse the second argument */
        arg.arg.y = mpl_internal_numeric_argument(mpl, func);
        /* check a token that follows the second argument */
        if (mpl.token == T_COMMA)
            mpl_internal_error(mpl, func + " needs two argument");
        else if (mpl.token == T_RIGHT){

        }
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
    }
    else if (op == O_ATAN || op == O_ROUND || op == O_TRUNC)
    {  /* atan, round, and trunc need one or two arguments */
        /* parse the first argument */
        arg.arg.x = mpl_internal_numeric_argument(mpl, func);
        /* parse the second argument, if specified */
        if (mpl.token == T_COMMA)
        {  switch (op)
        {  case O_ATAN:  op = O_ATAN2;  break;
            case O_ROUND: op = O_ROUND2; break;
            case O_TRUNC: op = O_TRUNC2; break;
            default: xassert(op != op);
        }
            mpl_internal_get_token(mpl /* , */);
            arg.arg.y = mpl_internal_numeric_argument(mpl, func);
        }
        /* check a token that follows the last argument */
        if (mpl.token == T_COMMA)
            mpl_internal_error(mpl, func + " needs one or two arguments");
        else if (mpl.token == T_RIGHT){

        }
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
    }
    else if (op == O_SUBSTR)
    {  /* substr needs two or three arguments */
        /* parse the first argument */
        arg.arg.x = mpl_internal_symbolic_argument(mpl, func);
        /* check a token that follows the first argument */
        if (mpl.token == T_COMMA){

        }
        else if (mpl.token == T_RIGHT)
            mpl_internal_error(mpl, func + " needs two or three arguments");
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
        mpl_internal_get_token(mpl /* , */);
        /* parse the second argument */
        arg.arg.y = mpl_internal_numeric_argument(mpl, func);
        /* parse the third argument, if specified */
        if (mpl.token == T_COMMA)
        {  op = O_SUBSTR3;
            mpl_internal_get_token(mpl /* , */);
            arg.arg.z = mpl_internal_numeric_argument(mpl, func);
        }
        /* check a token that follows the last argument */
        if (mpl.token == T_COMMA)
            mpl_internal_error(mpl, func + " needs two or three arguments");
        else if (mpl.token == T_RIGHT){

        }
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
    }
    else if (op == O_STR2TIME)
    {  /* str2time needs two arguments, both symbolic */
        /* parse the first argument */
        arg.arg.x = mpl_internal_symbolic_argument(mpl, func);
        /* check a token that follows the first argument */
        if (mpl.token == T_COMMA){

        }
        else if (mpl.token == T_RIGHT)
            mpl_internal_error(mpl, func + " needs two arguments");
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
        mpl_internal_get_token(mpl /* , */);
        /* parse the second argument */
        arg.arg.y = mpl_internal_symbolic_argument(mpl, func);
        /* check a token that follows the second argument */
        if (mpl.token == T_COMMA)
            mpl_internal_error(mpl, func + " needs two argument");
        else if (mpl.token == T_RIGHT){

        }
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
    }
    else if (op == O_TIME2STR)
    {  /* time2str needs two arguments, numeric and symbolic */
        /* parse the first argument */
        arg.arg.x = mpl_internal_numeric_argument(mpl, func);
        /* check a token that follows the first argument */
        if (mpl.token == T_COMMA){

        }
        else if (mpl.token == T_RIGHT)
            mpl_internal_error(mpl, func + " needs two arguments");
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
        mpl_internal_get_token(mpl /* , */);
        /* parse the second argument */
        arg.arg.y = mpl_internal_symbolic_argument(mpl, func);
        /* check a token that follows the second argument */
        if (mpl.token == T_COMMA)
            mpl_internal_error(mpl, func + " needs two argument");
        else if (mpl.token == T_RIGHT){

        }
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
    }
    else
    {  /* other functions need one argument */
        if (op == O_CARD)
            arg.arg.x = mpl_internal_elemset_argument(mpl, func);
        else if (op == O_LENGTH)
            arg.arg.x = mpl_internal_symbolic_argument(mpl, func);
        else
            arg.arg.x = mpl_internal_numeric_argument(mpl, func);
        /* check a token that follows the argument */
        if (mpl.token == T_COMMA)
            mpl_internal_error(mpl, func + " needs one argument");
        else if (mpl.token == T_RIGHT){

        }
        else
            mpl_internal_error(mpl, "syntax error in argument for " + func);
    }
    /* make pseudo-code to call the built-in function */
    if (op == O_SUBSTR || op == O_SUBSTR3 || op == O_TIME2STR)
        code = mpl_internal_make_code(mpl, op, arg, A_SYMBOLIC, 0);
    else
        code = mpl_internal_make_code(mpl, op, arg, A_NUMERIC, 0);
    /* the reference ends with the right parenthesis */
    xassert(mpl.token == T_RIGHT);
    mpl_internal_get_token(mpl /* ) */);
    return code;
}

function mpl_internal_append_block(mpl, domain, block){
    var temp;

    xassert(domain != null);
    xassert(block != null);
    xassert(block.next == null);
    if (domain.list == null)
        domain.list = block;
    else
    {   for (temp = domain.list; temp.next != null; temp = temp.next){}
        temp.next = block;
    }
}

function mpl_internal_append_slot(mpl, block, name, code){
    var slot = {}, temp;
    xassert(block != null);
    slot.name = name;
    slot.code = code;
    slot.value = null;
    slot.list = null;
    slot.next = null;
    if (block.list == null)
        block.list = slot;
    else
    {  for (temp = block.list; temp.next != null; temp = temp.next){}
        temp.next = slot;
    }
    return slot;
}

function mpl_internal_expression_list(mpl){
    var code;
    var arg = mpl_internal_create_operands();
    var max_dim = 20;
    /* maximal number of components allowed within parentheses */
    var list = new Array(max_dim + 1);
    xfillObjArr(list, 0, max_dim + 1);
    var flag_x, next_token, dim, j, slice = 0;
    xassert(mpl.token == T_LEFT);
    /* the flag, which allows recognizing undeclared symbolic names
     as dummy indices, will be automatically reset by get_token(),
     so save it before scanning the next token */
    flag_x = mpl.flag_x;
    mpl_internal_get_token(mpl /* ( */);
    /* parse <expression list> */
    for (dim = 1; ; dim++)
    {   if (dim > max_dim)
        mpl_internal_error(mpl, "too many components within parentheses");

        function expr(){
            /* current component of <expression list> is expression */
            code = mpl_internal_expression_13(mpl);
            /* if the current expression is followed by comma or it is
             not the very first expression, entire <expression list>
             is n-tuple or slice, in which case the current expression
             should be converted to symbolic type, if necessary */
            if (mpl.token == T_COMMA || dim > 1)
            {  if (code.type == A_NUMERIC)
                code = mpl_internal_make_unary(mpl, O_CVTSYM, code, A_SYMBOLIC, 0);
                /* now the expression must be of symbolic type */
                if (code.type != A_SYMBOLIC)
                    mpl_internal_error(mpl, "component expression has invalid type");
                xassert(code.dim == 0);
            }
            list[dim].name = null;
            list[dim].code = code;
        }

        /* current component of <expression list> can be either dummy
         index or expression */
        if (mpl.token == T_NAME)
        {  /* symbolic name is recognized as dummy index only if:
         the flag, which allows that, is set, and
         the name is followed by comma or right parenthesis, and
         the name is undeclared */
            mpl_internal_get_token(mpl /* <symbolic name> */);
            next_token = mpl.token;
            mpl_internal_unget_token(mpl);
            if (!(flag_x &&
                (next_token == T_COMMA || next_token == T_RIGHT) &&
                mpl.tree[mpl.image] == null))
            {  /* this is not dummy index */
                expr();
            } else {
                /* all dummy indices within the same slice must have unique
                 symbolic names */
                for (j = 1; j < dim; j++)
                {  if (list[j].name != null && list[j].name == mpl.image)
                    mpl_internal_error(mpl, "duplicate dummy index " + mpl.image + " not allowed");
                }
                /* current component of <expression list> is dummy index */
                list[dim].name = mpl.image;
                list[dim].code = null;
                mpl_internal_get_token(mpl /* <symbolic name> */);
                /* <expression list> is a slice, because at least one dummy
                 index has appeared */
                slice = 1;
                /* note that the context ( <dummy index> ) is not allowed,
                 i.e. in this case <primary expression> is considered as
                 a parenthesized expression */
                if (dim == 1 && mpl.token == T_RIGHT)
                    mpl_internal_error(mpl, list[dim].name + " not defined");
            }
        }
        else
            expr();

        /* check a token that follows the current component */
        if (mpl.token == T_COMMA)
            mpl_internal_get_token(mpl /* , */);
        else if (mpl.token == T_RIGHT)
            break;
        else
            mpl_internal_error(mpl, "right parenthesis missing where expected");
    }
    /* generate pseudo-code for <primary expression> */
    if (dim == 1 && !slice)
    {  /* <primary expression> is a parenthesized expression */
        code = list[1].code;
    }
    else if (!slice)
    {  /* <primary expression> is a n-tuple */
        arg.list = null;
        for (j = 1; j <= dim; j++)
            arg.list = mpl_internal_expand_arg_list(mpl, arg.list, list[j].code);
        code = mpl_internal_make_code(mpl, O_TUPLE, arg, A_TUPLE, dim);
    }
    else
    {  /* <primary expression> is a slice */
        arg.slice = {};
        for (j = 1; j <= dim; j++)
            mpl_internal_append_slot(mpl, arg.slice, list[j].name, list[j].code);
        /* note that actually pseudo-codes with op = O_SLICE are never
         evaluated */
        code = mpl_internal_make_code(mpl, O_SLICE, arg, A_TUPLE, dim);
    }
    mpl_internal_get_token(mpl /* ) */);
    /* if <primary expression> is a slice, there must be the keyword
     'in', which follows the right parenthesis */
    if (slice && mpl.token != T_IN)
        mpl_internal_error(mpl, "keyword in missing where expected");
    /* if the slice flag is set and there is the keyword 'in', which
     follows <primary expression>, the latter must be a slice */
    if (flag_x && mpl.token == T_IN && !slice)
    {  if (dim == 1)
        mpl_internal_error(mpl, "syntax error in indexing expression");
    else
        mpl_internal_error(mpl, "0-ary slice not allowed");
    }
    return code;
}

function mpl_internal_literal_set(mpl, code){
    var arg = mpl_internal_create_operands();
    var j;
    xassert(code != null);
    arg.list = null;
    /* parse <member list> */
    for (j = 1; ; j++)
    {  /* all member expressions must be n-tuples; so, if the current
     expression is not n-tuple, convert it to 1-tuple */
        if (code.type == A_NUMERIC)
            code = mpl_internal_make_unary(mpl, O_CVTSYM, code, A_SYMBOLIC, 0);
        if (code.type == A_SYMBOLIC)
            code = mpl_internal_make_unary(mpl, O_CVTTUP, code, A_TUPLE, 1);
        /* now the expression must be n-tuple */
        if (code.type != A_TUPLE)
            mpl_internal_error(mpl, "member expression has invalid type");
        /* all member expressions must have identical dimension */
        if (arg.list != null && arg.list.x.dim != code.dim)
            mpl_internal_error(mpl, "member " + (j-1) + " has " + arg.list.x.dim + " component"
                + (arg.list.x.dim == 1 ? "" : "s") + " while member " + j + " has "
                + code.dim + " component" + (code.dim == 1 ? "" : "s"));
        /* append the current expression to the member list */
        arg.list = mpl_internal_expand_arg_list(mpl, arg.list, code);
        /* check a token that follows the current expression */
        if (mpl.token == T_COMMA)
            mpl_internal_get_token(mpl /* , */);
        else if (mpl.token == T_RBRACE)
            break;
        else
            mpl_internal_error(mpl, "syntax error in literal set");
        /* parse the next expression that follows the comma */
        code = mpl_internal_expression_5(mpl);
    }
    /* generate pseudo-code for <literal set> */
    code = mpl_internal_make_code(mpl, O_MAKE, arg, A_ELEMSET, arg.list.x.dim);
    return code;
}

function mpl_internal_indexing_expression(mpl){
    var domain;
    var block;
    var slot;
    var code;
    xassert(mpl.token == T_LBRACE);
    mpl_internal_get_token(mpl /* { */);
    if (mpl.token == T_RBRACE)
        mpl_internal_error(mpl, "empty indexing expression not allowed");
    /* create domain to be constructed */
    domain = {};
    /* parse either <member list> or <indexing list> that follows the
     left brace */
    for (;;)
    {  /* domain block for <indexing element> is not created yet */
        block = null;
        /* pseudo-code for <basic expression> is not generated yet */
        code = null;
        /* check a token, which <indexing element> begins with */
        if (mpl.token == T_NAME)
        {  /* it is a symbolic name */
            var next_token;
            var name;
            /* symbolic name is recognized as dummy index only if it is
             followed by the keyword 'in' and not declared */
            mpl_internal_get_token(mpl /* <symbolic name> */);
            next_token = mpl.token;
            mpl_internal_unget_token(mpl);
            if (next_token == T_IN &&
                mpl.tree[mpl.image] == null)
            {
                /* create domain block with one slot, which is assigned the
                 dummy index */
                block = {};
                name = mpl.image;
                mpl_internal_append_slot(mpl, block, name, null);
                mpl_internal_get_token(mpl /* <symbolic name> */);
                /* the keyword 'in' is already checked above */
                xassert(mpl.token == T_IN);
                mpl_internal_get_token(mpl /* in */);
                /* <basic expression> that follows the keyword 'in' will be
                 parsed below */
            }

        }
        else if (mpl.token == T_LEFT)
        {  /* it is the left parenthesis; parse expression that begins
         with this parenthesis (the flag is set in order to allow
         recognizing slices; see the routine expression_list) */
            mpl.flag_x = 1;
            code = mpl_internal_expression_9(mpl);
            if (code.op == O_SLICE)
            {
                /* this is a slice; besides the corresponding domain block
                 is already created by expression_list() */
                block = code.arg.slice;
                code = null; /* <basic expression> is not parsed yet */
                /* the keyword 'in' following the slice is already checked
                 by expression_list() */
                xassert(mpl.token == T_IN);
                mpl_internal_get_token(mpl /* in */);
                /* <basic expression> that follows the keyword 'in' will be
                 parsed below */
            }
        }

        /* parse expression that follows either the keyword 'in' (in
         which case it can be <basic expression) or the left brace
         (in which case it can be <basic expression> as well as the
         very first <member expression> in <literal set>); note that
         this expression can be already parsed above */
        if (code == null) code = mpl_internal_expression_9(mpl);
        /* check the type of the expression just parsed */
        if (code.type != A_ELEMSET)
        {  /* it is not <basic expression> and therefore it can only
         be the very first <member expression> in <literal set>;
         however, then there must be no dummy index neither slice
         between the left brace and this expression */
            if (block != null)
                mpl_internal_error(mpl, "domain expression has invalid type");
            /* parse the rest part of <literal set> and make this set
             be <basic expression>, i.e. the construction {a, b, c}
             is parsed as it were written as {A}, where A = {a, b, c}
             is a temporary elemental set */
            code = mpl_internal_literal_set(mpl, code);
        }
        /* now pseudo-code for <basic set> has been built */
        xassert(code != null);
        xassert(code.type == A_ELEMSET);
        xassert(code.dim > 0);
        /* if domain block for the current <indexing element> is still
         not created, create it for fake slice of the same dimension
         as <basic set> */
        if (block == null)
        {  var j;
            block = {};
            for (j = 1; j <= code.dim; j++)
                mpl_internal_append_slot(mpl, block, null, null);
        }
        /* number of indexing positions in <indexing element> must be
         the same as dimension of n-tuples in basic set */
        {  var dim = 0;
            for (slot = block.list; slot != null; slot = slot.next)
                dim++;
            if (dim != code.dim)
                mpl_internal_error(mpl, dim + " " + (dim == 1 ? "index" : "indices") + " specified for set of dimension " + code.dim);
        }
        /* store pseudo-code for <basic set> in the domain block */
        xassert(block.code == null);
        block.code = code;
        /* and append the domain block to the domain */
        mpl_internal_append_block(mpl, domain, block);
        /* the current <indexing element> has been completely parsed;
         include all its dummy indices into the symbolic name table
         to make them available for referencing from expressions;
         implicit declarations of dummy indices remain valid while
         the corresponding domain scope is valid */
        for (slot = block.list; slot != null; slot = slot.next)
            if (slot.name != null)
            {  var node;
                xassert(mpl.tree[slot.name] == null);
                mpl.tree[slot.name] = node = {type: A_INDEX, link: slot};
            }
        /* check a token that follows <indexing element> */
        if (mpl.token == T_COMMA)
            mpl_internal_get_token(mpl /* , */);
        else if (mpl.token == T_COLON || mpl.token == T_RBRACE)
            break;
        else
            mpl_internal_error(mpl, "syntax error in indexing expression");
    }
    /* parse <logical expression> that follows the colon */
    if (mpl.token == T_COLON)
    {  mpl_internal_get_token(mpl /* : */);
        code = mpl_internal_expression_13(mpl);
        /* convert the expression to logical type, if necessary */
        if (code.type == A_SYMBOLIC)
            code = mpl_internal_make_unary(mpl, O_CVTNUM, code, A_NUMERIC, 0);
        if (code.type == A_NUMERIC)
            code = mpl_internal_make_unary(mpl, O_CVTLOG, code, A_LOGICAL, 0);
        /* now the expression must be of logical type */
        if (code.type != A_LOGICAL)
            mpl_internal_error(mpl, "expression following colon has invalid type");
        xassert(code.dim == 0);
        domain.code = code;
        /* the right brace must follow the logical expression */
        if (mpl.token != T_RBRACE)
            mpl_internal_error(mpl, "syntax error in indexing expression");
    }
    mpl_internal_get_token(mpl /* } */);
    return domain;
}

function mpl_internal_close_scope(mpl, domain){
    var block;
    var slot;
    var node;
    xassert(domain != null);
    /* remove all dummy indices from the symbolic names table */
    for (block = domain.list; block != null; block = block.next)
    {  for (slot = block.list; slot != null; slot = slot.next)
    {  if (slot.name != null)
    {   node = mpl.tree[slot.name];
        xassert(node != null);
        xassert(node.type == A_INDEX);
        delete mpl.tree[slot.name];
    }
    }
    }
}

function mpl_internal_link_up(code)
{     /* if we have something like sum{(i+1,j,k-1) in E} x[i,j,k],
 where i and k are dummy indices defined out of the iterated
 expression, we should link up pseudo-code for computing i+1
 and k-1 to pseudo-code for computing the iterated expression;
 this is needed to invalidate current value of the iterated
 expression once i or k have been changed */
    var block;
    var slot;
    for (block = code.arg.loop.domain.list; block != null;
         block = block.next)
    {  for (slot = block.list; slot != null; slot = slot.next)
    {  if (slot.code != null)
    {  xassert(slot.code.up == null);
        slot.code.up = code;
    }
    }
    }
}

function mpl_internal_iterated_expression(mpl){
    var code;
    var arg = mpl_internal_create_operands();
    var op;
    var opstr; // 8
    /* determine operation code */
    xassert(mpl.token == T_NAME);
    if (mpl.image == "sum")
        op = O_SUM;
    else if (mpl.image == "prod")
        op = O_PROD;
    else if (mpl.image == "min")
        op = O_MINIMUM;
    else if (mpl.image == "max")
        op = O_MAXIMUM;
    else if (mpl.image == "forall")
        op = O_FORALL;
    else if (mpl.image == "exists")
        op = O_EXISTS;
    else if (mpl.image == "setof")
        op = O_SETOF;
    else
        mpl_internal_error(mpl, "operator " + mpl.image + " unknown");
    opstr = mpl.image;
    xassert(opstr.length < 8);
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* check the left brace that follows the operator name */
    xassert(mpl.token == T_LBRACE);
    /* parse indexing expression that controls iterating */
    arg.loop.domain = mpl_internal_indexing_expression(mpl);

    function err(){
        mpl_internal_error(mpl, "integrand following " + opstr + "{...} has invalid type");
    }

    /* parse "integrand" expression and generate pseudo-code */
    switch (op)
    {  case O_SUM:
        case O_PROD:
        case O_MINIMUM:
        case O_MAXIMUM:
            arg.loop.x = mpl_internal_expression_3(mpl);
            /* convert the integrand to numeric type, if necessary */
            if (arg.loop.x.type == A_SYMBOLIC)
                arg.loop.x = mpl_internal_make_unary(mpl, O_CVTNUM, arg.loop.x,
                    A_NUMERIC, 0);
            /* now the integrand must be of numeric type or linear form
             (the latter is only allowed for the sum operator) */
            if (!(arg.loop.x.type == A_NUMERIC ||
                op == O_SUM && arg.loop.x.type == A_FORMULA))
                err();
            xassert(arg.loop.x.dim == 0);
            /* generate pseudo-code */
            code = mpl_internal_make_code(mpl, op, arg, arg.loop.x.type, 0);
            break;
        case O_FORALL:
        case O_EXISTS:
            arg.loop.x = mpl_internal_expression_12(mpl);
            /* convert the integrand to logical type, if necessary */
            if (arg.loop.x.type == A_SYMBOLIC)
                arg.loop.x = mpl_internal_make_unary(mpl, O_CVTNUM, arg.loop.x,
                    A_NUMERIC, 0);
            if (arg.loop.x.type == A_NUMERIC)
                arg.loop.x = mpl_internal_make_unary(mpl, O_CVTLOG, arg.loop.x,
                    A_LOGICAL, 0);
            /* now the integrand must be of logical type */
            if (arg.loop.x.type != A_LOGICAL) err();
            xassert(arg.loop.x.dim == 0);
            /* generate pseudo-code */
            code = mpl_internal_make_code(mpl, op, arg, A_LOGICAL, 0);
            break;
        case O_SETOF:
            arg.loop.x = mpl_internal_expression_5(mpl);
            /* convert the integrand to 1-tuple, if necessary */
            if (arg.loop.x.type == A_NUMERIC)
                arg.loop.x = mpl_internal_make_unary(mpl, O_CVTSYM, arg.loop.x,
                    A_SYMBOLIC, 0);
            if (arg.loop.x.type == A_SYMBOLIC)
                arg.loop.x = mpl_internal_make_unary(mpl, O_CVTTUP, arg.loop.x,
                    A_TUPLE, 1);
            /* now the integrand must be n-tuple */
            if (arg.loop.x.type != A_TUPLE) err();
            xassert(arg.loop.x.dim > 0);
            /* generate pseudo-code */
            code = mpl_internal_make_code(mpl, op, arg, A_ELEMSET, arg.loop.x.dim);
            break;
        default:
            xassert(op != op);
    }
    /* close the scope of the indexing expression */
    mpl_internal_close_scope(mpl, arg.loop.domain);
    mpl_internal_link_up(code);
    return code;
}

function mpl_internal_domain_arity(mpl, domain){
    var arity = 0;

    for (var block = domain.list; block != null; block = block.next)
        for (var slot = block.list; slot != null; slot = slot.next)
            if (slot.code == null) arity++;
    return arity;
}

function mpl_internal_set_expression(mpl){
    var code;
    var arg = mpl_internal_create_operands();
    xassert(mpl.token == T_LBRACE);
    mpl_internal_get_token(mpl /* { */);
    /* check a token that follows the left brace */
    if (mpl.token == T_RBRACE)
    {  /* it is the right brace, so the resultant is an empty set of
     dimension 1 */
        arg.list = null;
        /* generate pseudo-code to build the resultant set */
        code = mpl_internal_make_code(mpl, O_MAKE, arg, A_ELEMSET, 1);
        mpl_internal_get_token(mpl /* } */);
    }
    else
    {  /* the next token begins an indexing expression */
        mpl_internal_unget_token(mpl);
        arg.loop.domain = mpl_internal_indexing_expression(mpl);
        arg.loop.x = null; /* integrand is not used */
        /* close the scope of the indexing expression */
        mpl_internal_close_scope(mpl, arg.loop.domain);
        /* generate pseudo-code to build the resultant set */
        code = mpl_internal_make_code(mpl, O_BUILD, arg, A_ELEMSET,
            mpl_internal_domain_arity(mpl, arg.loop.domain));
        mpl_internal_link_up(code);
    }
    return code;
}

function mpl_internal_branched_expression(mpl){
    var x, y, z;
    xassert(mpl.token == T_IF);
    mpl_internal_get_token(mpl /* if */);
    /* parse <logical expression> that follows 'if' */
    x = mpl_internal_expression_13(mpl);
    /* convert the expression to logical type, if necessary */
    if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
    if (x.type == A_NUMERIC)
        x = mpl_internal_make_unary(mpl, O_CVTLOG, x, A_LOGICAL, 0);
    /* now the expression must be of logical type */
    if (x.type != A_LOGICAL)
        mpl_internal_error(mpl, "expression following if has invalid type");
    xassert(x.dim == 0);
    /* the keyword 'then' must follow the logical expression */
    if (mpl.token != T_THEN)
        mpl_internal_error(mpl, "keyword then missing where expected");
    mpl_internal_get_token(mpl /* then */);
    /* parse <expression> that follows 'then' and check its type */
    y = mpl_internal_expression_9(mpl);
    if (!(y.type == A_NUMERIC || y.type == A_SYMBOLIC ||
        y.type == A_ELEMSET || y.type == A_FORMULA))
        mpl_internal_error(mpl, "expression following then has invalid type");
    /* if the expression that follows the keyword 'then' is elemental
     set, the keyword 'else' cannot be omitted; otherwise else-part
     is optional */
    if (mpl.token != T_ELSE)
    {  if (y.type == A_ELEMSET)
        mpl_internal_error(mpl, "keyword else missing where expected");
        z = null;
    } else {
        mpl_internal_get_token(mpl /* else */);
        /* parse <expression> that follow 'else' and check its type */
        z = mpl_internal_expression_9(mpl);
        if (!(z.type == A_NUMERIC || z.type == A_SYMBOLIC ||
            z.type == A_ELEMSET || z.type == A_FORMULA))
            mpl_internal_error(mpl, "expression following else has invalid type");
        /* convert to identical types, if necessary */
        if (y.type == A_FORMULA || z.type == A_FORMULA)
        {  if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
            if (y.type == A_NUMERIC)
                y = mpl_internal_make_unary(mpl, O_CVTLFM, y, A_FORMULA, 0);
            if (z.type == A_SYMBOLIC)
                z = mpl_internal_make_unary(mpl, O_CVTNUM, z, A_NUMERIC, 0);
            if (z.type == A_NUMERIC)
                z = mpl_internal_make_unary(mpl, O_CVTLFM, z, A_FORMULA, 0);
        }
        if (y.type == A_SYMBOLIC || z.type == A_SYMBOLIC)
        {  if (y.type == A_NUMERIC)
            y = mpl_internal_make_unary(mpl, O_CVTSYM, y, A_SYMBOLIC, 0);
            if (z.type == A_NUMERIC)
                z = mpl_internal_make_unary(mpl, O_CVTSYM, z, A_SYMBOLIC, 0);
        }
        /* now both expressions must have identical types */
        if (y.type != z.type)
            mpl_internal_error(mpl, "expressions following then and else have incompatible types");
        /* and identical dimensions */
        if (y.dim != z.dim)
            mpl_internal_error(mpl, "expressions following then and else have different" +
                " dimensions " + y.dim + " and " + z.dim + ", respectively");
    }

    /* generate pseudo-code to perform branching */
    return mpl_internal_make_ternary(mpl, O_FORK, x, y, z, y.type, y.dim);
}

function mpl_internal_primary_expression(mpl){
    var code;
    if (mpl.token == T_NUMBER)
    {  /* parse numeric literal */
        code = mpl_internal_numeric_literal(mpl);
    }
    else if (mpl.token == T_INFINITY)
    {  /* parse "infinity" */
        var arg = mpl_internal_create_operands();
        arg.num = DBL_MAX;
        code = mpl_internal_make_code(mpl, O_NUMBER, arg, A_NUMERIC, 0);
        mpl_internal_get_token(mpl /* Infinity */);
    }
    else if (mpl.token == T_STRING)
    {  /* parse string literal */
        code = mpl_internal_string_literal(mpl);
    }
    else if (mpl.token == T_NAME)
    {   var next_token;
        mpl_internal_get_token(mpl /* <symbolic name> */);
        next_token = mpl.token;
        mpl_internal_unget_token(mpl);
        /* check a token that follows <symbolic name> */
        switch (next_token)
        {  case T_LBRACKET:
            /* parse reference to subscripted object */
            code = mpl_internal_object_reference(mpl);
            break;
            case T_LEFT:
                /* parse reference to built-in function */
                code = mpl_internal_function_reference(mpl);
                break;
            case T_LBRACE:
                /* parse iterated expression */
                code = mpl_internal_iterated_expression(mpl);
                break;
            default:
                /* parse reference to unsubscripted object */
                code = mpl_internal_object_reference(mpl);
                break;
        }
    }
    else if (mpl.token == T_LEFT)
    {  /* parse parenthesized expression */
        code = mpl_internal_expression_list(mpl);
    }
    else if (mpl.token == T_LBRACE)
    {  /* parse set expression */
        code = mpl_internal_set_expression(mpl);
    }
    else if (mpl.token == T_IF)
    {  /* parse conditional expression */
        code = mpl_internal_branched_expression(mpl);
    }
    else if (mpl_internal_is_reserved(mpl))
    {  /* other reserved keywords cannot be used here */
        mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
    }
    else
        mpl_internal_error(mpl, "syntax error in expression");
    return code;
}

function mpl_internal_error_preceding(mpl, opstr){
    mpl_internal_error(mpl, "operand preceding " + opstr + " has invalid type");
    /* no return */
}

function mpl_internal_error_following(mpl, opstr)
{     mpl_internal_error(mpl, "operand following " + opstr + " has invalid type");
    /* no return */
}

function mpl_internal_error_dimension(mpl, opstr, dim1, dim2)
{     mpl_internal_error(mpl, "operands preceding and following " + opstr + " have different di"+
    "mensions " + dim1 + " and " + dim2 + ", respectively");
    /* no return */
}

function mpl_internal_expression_0(mpl){
    return mpl_internal_primary_expression(mpl);
}

function mpl_internal_expression_1(mpl){
    var y;
    var x = mpl_internal_expression_0(mpl);
    if (mpl.token == T_POWER)
    {   var opstr = mpl.image;
        xassert(opstr.length < 8);
        if (x.type == A_SYMBOLIC)
            x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (x.type != A_NUMERIC)
            mpl_internal_error_preceding(mpl, opstr);
        mpl_internal_get_token(mpl /* ^ | ** */);
        if (mpl.token == T_PLUS || mpl.token == T_MINUS)
            y = mpl_internal_expression_2(mpl);
        else
            y = mpl_internal_expression_1(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (y.type != A_NUMERIC)
            mpl_internal_error_following(mpl, opstr);
        x = mpl_internal_make_binary(mpl, O_POWER, x, y, A_NUMERIC, 0);
    }
    return x;
}

function mpl_internal_expression_2(mpl){
    var x;
    if (mpl.token == T_PLUS)
    {  mpl_internal_get_token(mpl /* + */);
        x = mpl_internal_expression_1(mpl);
        if (x.type == A_SYMBOLIC)
            x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (!(x.type == A_NUMERIC || x.type == A_FORMULA))
            mpl_internal_error_following(mpl, "+");
        x = mpl_internal_make_unary(mpl, O_PLUS, x, x.type, 0);
    }
    else if (mpl.token == T_MINUS)
    {  mpl_internal_get_token(mpl /* - */);
        x = mpl_internal_expression_1(mpl);
        if (x.type == A_SYMBOLIC)
            x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (!(x.type == A_NUMERIC || x.type == A_FORMULA))
            mpl_internal_error_following(mpl, "-");
        x = mpl_internal_make_unary(mpl, O_MINUS, x, x.type, 0);
    }
    else
        x = mpl_internal_expression_1(mpl);
    return x;
}

function mpl_internal_expression_3(mpl){
    var y;
    var x = mpl_internal_expression_2(mpl);
    for (;;)
    {  if (mpl.token == T_ASTERISK)
    {  if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (!(x.type == A_NUMERIC || x.type == A_FORMULA))
            mpl_internal_error_preceding(mpl, "*");
        mpl_internal_get_token(mpl /* * */);
        y = mpl_internal_expression_2(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (!(y.type == A_NUMERIC || y.type == A_FORMULA))
            mpl_internal_error_following(mpl, "*");
        if (x.type == A_FORMULA && y.type == A_FORMULA)
            mpl_internal_error(mpl, "multiplication of linear forms not allowed");
        if (x.type == A_NUMERIC && y.type == A_NUMERIC)
            x = mpl_internal_make_binary(mpl, O_MUL, x, y, A_NUMERIC, 0);
        else
            x = mpl_internal_make_binary(mpl, O_MUL, x, y, A_FORMULA, 0);
    }
    else if (mpl.token == T_SLASH)
    {  if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (!(x.type == A_NUMERIC || x.type == A_FORMULA))
            mpl_internal_error_preceding(mpl, "/");
        mpl_internal_get_token(mpl /* / */);
        y = mpl_internal_expression_2(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (y.type != A_NUMERIC)
            mpl_internal_error_following(mpl, "/");
        if (x.type == A_NUMERIC)
            x = mpl_internal_make_binary(mpl, O_DIV, x, y, A_NUMERIC, 0);
        else
            x = mpl_internal_make_binary(mpl, O_DIV, x, y, A_FORMULA, 0);
    }
    else if (mpl.token == T_DIV)
    {  if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (x.type != A_NUMERIC)
            mpl_internal_error_preceding(mpl, "div");
        mpl_internal_get_token(mpl /* div */);
        y = mpl_internal_expression_2(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (y.type != A_NUMERIC)
            mpl_internal_error_following(mpl, "div");
        x = mpl_internal_make_binary(mpl, O_IDIV, x, y, A_NUMERIC, 0);
    }
    else if (mpl.token == T_MOD)
    {  if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (x.type != A_NUMERIC)
            mpl_internal_error_preceding(mpl, "mod");
        mpl_internal_get_token(mpl /* mod */);
        y = mpl_internal_expression_2(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (y.type != A_NUMERIC)
            mpl_internal_error_following(mpl, "mod");
        x = mpl_internal_make_binary(mpl, O_MOD, x, y, A_NUMERIC, 0);
    }
    else
        break;
    }
    return x;
}

function mpl_internal_expression_4(mpl){
    var y;
    var x = mpl_internal_expression_3(mpl);
    for (;;)
    {  if (mpl.token == T_PLUS)
    {  if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (!(x.type == A_NUMERIC || x.type == A_FORMULA))
            mpl_internal_error_preceding(mpl, "+");
        mpl_internal_get_token(mpl /* + */);
        y = mpl_internal_expression_3(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (!(y.type == A_NUMERIC || y.type == A_FORMULA))
            mpl_internal_error_following(mpl, "+");
        if (x.type == A_NUMERIC && y.type == A_FORMULA)
            x = mpl_internal_make_unary(mpl, O_CVTLFM, x, A_FORMULA, 0);
        if (x.type == A_FORMULA && y.type == A_NUMERIC)
            y = mpl_internal_make_unary(mpl, O_CVTLFM, y, A_FORMULA, 0);
        x = mpl_internal_make_binary(mpl, O_ADD, x, y, x.type, 0);
    }
    else if (mpl.token == T_MINUS)
    {  if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (!(x.type == A_NUMERIC || x.type == A_FORMULA))
            mpl_internal_error_preceding(mpl, "-");
        mpl_internal_get_token(mpl /* - */);
        y = mpl_internal_expression_3(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (!(y.type == A_NUMERIC || y.type == A_FORMULA))
            mpl_internal_error_following(mpl, "-");
        if (x.type == A_NUMERIC && y.type == A_FORMULA)
            x = mpl_internal_make_unary(mpl, O_CVTLFM, x, A_FORMULA, 0);
        if (x.type == A_FORMULA && y.type == A_NUMERIC)
            y = mpl_internal_make_unary(mpl, O_CVTLFM, y, A_FORMULA, 0);
        x = mpl_internal_make_binary(mpl, O_SUB, x, y, x.type, 0);
    }
    else if (mpl.token == T_LESS)
    {  if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (x.type != A_NUMERIC)
            mpl_internal_error_preceding(mpl, "less");
        mpl_internal_get_token(mpl /* less */);
        y = mpl_internal_expression_3(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (y.type != A_NUMERIC)
            mpl_internal_error_following(mpl, "less");
        x = mpl_internal_make_binary(mpl, O_LESS, x, y, A_NUMERIC, 0);
    }
    else
        break;
    }
    return x;
}

function mpl_internal_expression_5(mpl){
    var y;
    var x = mpl_internal_expression_4(mpl);
    for (;;)
    {  if (mpl.token == T_CONCAT)
    {  if (x.type == A_NUMERIC)
        x = mpl_internal_make_unary(mpl, O_CVTSYM, x, A_SYMBOLIC, 0);
        if (x.type != A_SYMBOLIC)
            mpl_internal_error_preceding(mpl, "&");
        mpl_internal_get_token(mpl /* & */);
        y = mpl_internal_expression_4(mpl);
        if (y.type == A_NUMERIC)
            y = mpl_internal_make_unary(mpl, O_CVTSYM, y, A_SYMBOLIC, 0);
        if (y.type != A_SYMBOLIC)
            mpl_internal_error_following(mpl, "&");
        x = mpl_internal_make_binary(mpl, O_CONCAT, x, y, A_SYMBOLIC, 0);
    }
    else
        break;
    }
    return x;
}

function mpl_internal_expression_6(mpl){
    var y, z;
    var x = mpl_internal_expression_5(mpl);
    if (mpl.token == T_DOTS)
    {  if (x.type == A_SYMBOLIC)
        x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (x.type != A_NUMERIC)
            mpl_internal_error_preceding(mpl, "..");
        mpl_internal_get_token(mpl /* .. */);
        y = mpl_internal_expression_5(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (y.type != A_NUMERIC)
            mpl_internal_error_following(mpl, "..");
        if (mpl.token == T_BY)
        {  mpl_internal_get_token(mpl /* by */);
            z = mpl_internal_expression_5(mpl);
            if (z.type == A_SYMBOLIC)
                z = mpl_internal_make_unary(mpl, O_CVTNUM, z, A_NUMERIC, 0);
            if (z.type != A_NUMERIC)
                mpl_internal_error_following(mpl, "by");
        }
        else
            z = null;
        x = mpl_internal_make_ternary(mpl, O_DOTS, x, y, z, A_ELEMSET, 1);
    }
    return x;
}

function mpl_internal_expression_7(mpl){
    var y;
    var x = mpl_internal_expression_6(mpl);
    for (;;)
    {  if (mpl.token == T_CROSS)
    {  if (x.type != A_ELEMSET)
        mpl_internal_error_preceding(mpl, "cross");
        mpl_internal_get_token(mpl /* cross */);
        y = mpl_internal_expression_6(mpl);
        if (y.type != A_ELEMSET)
            mpl_internal_error_following(mpl, "cross");
        x = mpl_internal_make_binary(mpl, O_CROSS, x, y, A_ELEMSET,
            x.dim + y.dim);
    }
    else
        break;
    }
    return x;
}

function mpl_internal_expression_8(mpl){
    var y;
    var x = mpl_internal_expression_7(mpl);
    for (;;)
    {  if (mpl.token == T_INTER)
    {  if (x.type != A_ELEMSET)
        mpl_internal_error_preceding(mpl, "inter");
        mpl_internal_get_token(mpl /* inter */);
        y = mpl_internal_expression_7(mpl);
        if (y.type != A_ELEMSET)
            mpl_internal_error_following(mpl, "inter");
        if (x.dim != y.dim)
            mpl_internal_error_dimension(mpl, "inter", x.dim, y.dim);
        x = mpl_internal_make_binary(mpl, O_INTER, x, y, A_ELEMSET, x.dim);
    }
    else
        break;
    }
    return x;
}

function mpl_internal_expression_9(mpl){
    var y;
    var x = mpl_internal_expression_8(mpl);
    for (;;)
    {  if (mpl.token == T_UNION)
    {  if (x.type != A_ELEMSET)
        mpl_internal_error_preceding(mpl, "union");
        mpl_internal_get_token(mpl /* union */);
        y = mpl_internal_expression_8(mpl);
        if (y.type != A_ELEMSET)
            mpl_internal_error_following(mpl, "union");
        if (x.dim != y.dim)
            mpl_internal_error_dimension(mpl, "union", x.dim, y.dim);
        x = mpl_internal_make_binary(mpl, O_UNION, x, y, A_ELEMSET, x.dim);
    }
    else if (mpl.token == T_DIFF)
    {  if (x.type != A_ELEMSET)
        mpl_internal_error_preceding(mpl, "diff");
        mpl_internal_get_token(mpl /* diff */);
        y = mpl_internal_expression_8(mpl);
        if (y.type != A_ELEMSET)
            mpl_internal_error_following(mpl, "diff");
        if (x.dim != y.dim)
            mpl_internal_error_dimension(mpl, "diff", x.dim, y.dim);
        x = mpl_internal_make_binary(mpl, O_DIFF, x, y, A_ELEMSET, x.dim);
    }
    else if (mpl.token == T_SYMDIFF)
    {  if (x.type != A_ELEMSET)
        mpl_internal_error_preceding(mpl, "symdiff");
        mpl_internal_get_token(mpl /* symdiff */);
        y = mpl_internal_expression_8(mpl);
        if (y.type != A_ELEMSET)
            mpl_internal_error_following(mpl, "symdiff");
        if (x.dim != y.dim)
            mpl_internal_error_dimension(mpl, "symdiff", x.dim, y.dim);
        x = mpl_internal_make_binary(mpl, O_SYMDIFF, x, y, A_ELEMSET, x.dim);
    }
    else
        break;
    }
    return x;
}

function mpl_internal_expression_10(mpl){
    var y;
    var op = -1;
    var opstr = ""; // [16];
    var x = mpl_internal_expression_9(mpl);
    switch (mpl.token)
    {  case T_LT:
        op = O_LT; break;
        case T_LE:
            op = O_LE; break;
        case T_EQ:
            op = O_EQ; break;
        case T_GE:
            op = O_GE; break;
        case T_GT:
            op = O_GT; break;
        case T_NE:
            op = O_NE; break;
        case T_IN:
            op = O_IN; break;
        case T_WITHIN:
            op = O_WITHIN; break;
        case T_NOT:
            opstr = mpl.image;
            mpl_internal_get_token(mpl /* not | ! */);
            if (mpl.token == T_IN)
                op = O_NOTIN;
            else if (mpl.token == T_WITHIN)
                op = O_NOTWITHIN;
            else
                mpl_internal_error(mpl, "invalid use of " + opstr);
            opstr += " ";
            break;
        default:
            return x;
    }
    opstr += mpl.image;
    xassert(opstr.length < 16);
    switch (op)
    {  case O_EQ:
        case O_NE:
        case O_LT:
        case O_LE:
        case O_GT:
        case O_GE:
            if (!(x.type == A_NUMERIC || x.type == A_SYMBOLIC))
                mpl_internal_error_preceding(mpl, opstr);
            mpl_internal_get_token(mpl /* <rho> */);
            y = mpl_internal_expression_9(mpl);
            if (!(y.type == A_NUMERIC || y.type == A_SYMBOLIC))
                mpl_internal_error_following(mpl, opstr);
            if (x.type == A_NUMERIC && y.type == A_SYMBOLIC)
                x = mpl_internal_make_unary(mpl, O_CVTSYM, x, A_SYMBOLIC, 0);
            if (x.type == A_SYMBOLIC && y.type == A_NUMERIC)
                y = mpl_internal_make_unary(mpl, O_CVTSYM, y, A_SYMBOLIC, 0);
            x = mpl_internal_make_binary(mpl, op, x, y, A_LOGICAL, 0);
            break;
        case O_IN:
        case O_NOTIN:
            if (x.type == A_NUMERIC)
                x = mpl_internal_make_unary(mpl, O_CVTSYM, x, A_SYMBOLIC, 0);
            if (x.type == A_SYMBOLIC)
                x = mpl_internal_make_unary(mpl, O_CVTTUP, x, A_TUPLE, 1);
            if (x.type != A_TUPLE)
                mpl_internal_error_preceding(mpl, opstr);
            mpl_internal_get_token(mpl /* <rho> */);
            y = mpl_internal_expression_9(mpl);
            if (y.type != A_ELEMSET)
                mpl_internal_error_following(mpl, opstr);
            if (x.dim != y.dim)
                mpl_internal_error_dimension(mpl, opstr, x.dim, y.dim);
            x = mpl_internal_make_binary(mpl, op, x, y, A_LOGICAL, 0);
            break;
        case O_WITHIN:
        case O_NOTWITHIN:
            if (x.type != A_ELEMSET)
                mpl_internal_error_preceding(mpl, opstr);
            mpl_internal_get_token(mpl /* <rho> */);
            y = mpl_internal_expression_9(mpl);
            if (y.type != A_ELEMSET)
                mpl_internal_error_following(mpl, opstr);
            if (x.dim != y.dim)
                mpl_internal_error_dimension(mpl, opstr, x.dim, y.dim);
            x = mpl_internal_make_binary(mpl, op, x, y, A_LOGICAL, 0);
            break;
        default:
            xassert(op != op);
    }
    return x;
}

function mpl_internal_expression_11(mpl){
    var x;
    var opstr; //[8];
    if (mpl.token == T_NOT)
    {   opstr = mpl.image;
        xassert(opstr.length < 8);
        mpl_internal_get_token(mpl /* not | ! */);
        x = mpl_internal_expression_10(mpl);
        if (x.type == A_SYMBOLIC)
            x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (x.type == A_NUMERIC)
            x = mpl_internal_make_unary(mpl, O_CVTLOG, x, A_LOGICAL, 0);
        if (x.type != A_LOGICAL)
            mpl_internal_error_following(mpl, opstr);
        x = mpl_internal_make_unary(mpl, O_NOT, x, A_LOGICAL, 0);
    }
    else
        x = mpl_internal_expression_10(mpl);
    return x;
}

function mpl_internal_expression_12(mpl){
    var y;
    var opstr = ""; //[8];
    var x = mpl_internal_expression_11(mpl);
    for (;;)
    {  if (mpl.token == T_AND)
    {   opstr = mpl.image;
        xassert(opstr.length < 8);
        if (x.type == A_SYMBOLIC)
            x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (x.type == A_NUMERIC)
            x = mpl_internal_make_unary(mpl, O_CVTLOG, x, A_LOGICAL, 0);
        if (x.type != A_LOGICAL)
            mpl_internal_error_preceding(mpl, opstr);
        mpl_internal_get_token(mpl /* and | && */);
        y = mpl_internal_expression_11(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (y.type == A_NUMERIC)
            y = mpl_internal_make_unary(mpl, O_CVTLOG, y, A_LOGICAL, 0);
        if (y.type != A_LOGICAL)
            mpl_internal_error_following(mpl, opstr);
        x = mpl_internal_make_binary(mpl, O_AND, x, y, A_LOGICAL, 0);
    }
    else
        break;
    }
    return x;
}

function mpl_internal_expression_13(mpl){
    var y;
    var x = mpl_internal_expression_12(mpl);
    for (;;)
    {   if (mpl.token == T_OR)
    {   var opstr = mpl.image;
        xassert(opstr.length < 8);
        if (x.type == A_SYMBOLIC)
            x = mpl_internal_make_unary(mpl, O_CVTNUM, x, A_NUMERIC, 0);
        if (x.type == A_NUMERIC)
            x = mpl_internal_make_unary(mpl, O_CVTLOG, x, A_LOGICAL, 0);
        if (x.type != A_LOGICAL)
            mpl_internal_error_preceding(mpl, opstr);
        mpl_internal_get_token(mpl /* or | || */);
        y = mpl_internal_expression_12(mpl);
        if (y.type == A_SYMBOLIC)
            y = mpl_internal_make_unary(mpl, O_CVTNUM, y, A_NUMERIC, 0);
        if (y.type == A_NUMERIC)
            y = mpl_internal_make_unary(mpl, O_CVTLOG, y, A_LOGICAL, 0);
        if (y.type != A_LOGICAL)
            mpl_internal_error_following(mpl, opstr);
        x = mpl_internal_make_binary(mpl, O_OR, x, y, A_LOGICAL, 0);
    }
    else
        break;
    }
    return x;
}

function mpl_internal_set_statement(mpl){
    var set, node;
    var dimen_used = 0;
    var gadget;

    function err(){mpl_internal_error(mpl, "at most one := or default/data allowed")}
    function err1(){mpl_internal_error(mpl, mpl.image + " not a plain set")}
    function err2(){mpl_internal_error(mpl, "dimension of " + mpl.image + " too small")}
    function err3(){mpl_internal_error(mpl, "component number must be integer between 1 and " + gadget.set.dimen)};

    xassert(mpl_internal_is_keyword(mpl, "set"));
    mpl_internal_get_token(mpl /* set */);
    /* symbolic name must follow the keyword 'set' */
    if (mpl.token == T_NAME){

    }
    else if (mpl_internal_is_reserved(mpl))
        mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
    else
        mpl_internal_error(mpl, "symbolic name missing where expected");
    /* there must be no other object with the same name */
    if (mpl.tree[mpl.image] != null)
        mpl_internal_error(mpl, mpl.image + " multiply declared");
    /* create model set */
    set = {};
    set.name = mpl.image;
    set.alias = null;
    set.dim = 0;
    set.domain = null;
    set.dimen = 0;
    set.within = null;
    set.assign = null;
    set.option = null;
    set.gadget = null;
    set.data = 0;
    set.array = null;
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* parse optional alias */
    if (mpl.token == T_STRING)
    {   set.alias = mpl.image;
        mpl_internal_get_token(mpl /* <string literal> */);
    }
    /* parse optional indexing expression */
    if (mpl.token == T_LBRACE)
    {  set.domain = mpl_internal_indexing_expression(mpl);
        set.dim = mpl_internal_domain_arity(mpl, set.domain);
    }
    /* include the set name in the symbolic names table */
    {
        node = mpl.tree[set.name] = {};
        node.type = A_SET;
        node.link = set;
    }
    /* parse the list of optional attributes */
    for (;;)
    {  if (mpl.token == T_COMMA)
        mpl_internal_get_token(mpl /* , */);
    else if (mpl.token == T_SEMICOLON)
        break;
        if (mpl_internal_is_keyword(mpl, "dimen"))
        {  /* dimension of set members */
            var dimen;
            mpl_internal_get_token(mpl /* dimen */);
            if (!(mpl.token == T_NUMBER &&
                1.0 <= mpl.value && mpl.value <= 20.0 &&
                Math.floor(mpl.value) == mpl.value))
                mpl_internal_error(mpl, "dimension must be integer between 1 and 20");
            dimen = (mpl.value + 0.5)|0;
            if (dimen_used)
                mpl_internal_error(mpl, "at most one dimension attribute allowed");
            if (set.dimen > 0)
                mpl_internal_error(mpl, "dimension " + dimen + " conflicts with dimension " + set.dimen + " already determined");
            set.dimen = dimen;
            dimen_used = 1;
            mpl_internal_get_token(mpl /* <numeric literal> */);
        }
        else if (mpl.token == T_WITHIN || mpl.token == T_IN)
        {  /* restricting superset */
            var within, temp;
            if (mpl.token == T_IN && !mpl.as_within)
            {   mpl_internal_warning(mpl, "keyword in understood as within");
                mpl.as_within = 1;
            }
            mpl_internal_get_token(mpl /* within */);
            /* create new restricting superset list entry and append it
             to the within-list */
            within = {};
            within.code = null;
            within.next = null;
            if (set.within == null)
                set.within = within;
            else
            {   for (temp = set.within; temp.next != null; temp = temp.next){}
                temp.next = within;
            }
            /* parse an expression that follows 'within' */
            within.code = mpl_internal_expression_9(mpl);
            if (within.code.type != A_ELEMSET)
                mpl_internal_error(mpl, "expression following within has invalid type");
            xassert(within.code.dim > 0);
            /* check/set dimension of set members */
            if (set.dimen == 0) set.dimen = within.code.dim;
            if (set.dimen != within.code.dim)
                mpl_internal_error(mpl, "set expression following within must have di"+
                    "mension " + set.dimen + " rather than " + within.code.dim);
        }
        else if (mpl.token == T_ASSIGN)
        {  /* assignment expression */
            if (!(set.assign == null && set.option == null &&
                set.gadget == null))
                err();
            mpl_internal_get_token(mpl /* := */);
            /* parse an expression that follows ':=' */
            set.assign = mpl_internal_expression_9(mpl);
            if (set.assign.type != A_ELEMSET)
                mpl_internal_error(mpl, "expression following := has invalid type");
            xassert(set.assign.dim > 0);
            /* check/set dimension of set members */
            if (set.dimen == 0) set.dimen = set.assign.dim;
            if (set.dimen != set.assign.dim)
                mpl_internal_error(mpl, "set expression following := must have dimens" +
                    "ion " + set.dimen + " rather than " + set.assign.dim);
        }
        else if (mpl_internal_is_keyword(mpl, "default"))
        {  /* expression for default value */
            if (!(set.assign == null && set.option == null)) err();
            mpl_internal_get_token(mpl /* := */);
            /* parse an expression that follows 'default' */
            set.option = mpl_internal_expression_9(mpl);
            if (set.option.type != A_ELEMSET)
                mpl_internal_error(mpl, "expression following default has invalid type");
            xassert(set.option.dim > 0);
            /* check/set dimension of set members */
            if (set.dimen == 0) set.dimen = set.option.dim;
            if (set.dimen != set.option.dim)
                mpl_internal_error(mpl, "set expression following default must have d" +
                    "imension " + set.dimen + " rather than " + set.option.dim);
        }
        else if (mpl_internal_is_keyword(mpl, "data"))
        {  /* gadget to initialize the set by data from plain set */
            var i = 0, k, fff = new Array(20); //[20];
            if (!(set.assign == null && set.gadget == null)) err();
            mpl_internal_get_token(mpl /* data */);
            set.gadget = gadget = {};
            /* set name must follow the keyword 'data' */
            if (mpl.token == T_NAME){

            }
            else if (mpl_internal_is_reserved(mpl))
                mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
            else
                mpl_internal_error(mpl, "set name missing where expected");
            /* find the set in the symbolic name table */
            node = mpl.tree[mpl.image];
            if (node == null)
                mpl_internal_error(mpl, mpl.image + " not defined");
            if (node.type != A_SET)
                err1();
            gadget.set = node.link;
            if (gadget.set.dim != 0) err1();
            if (gadget.set == set)
                mpl_internal_error(mpl, "set cannot be initialized by itself");
            /* check and set dimensions */
            if (set.dim >= gadget.set.dimen)
                err2();
            if (set.dimen == 0)
                set.dimen = gadget.set.dimen - set.dim;
            if (set.dim + set.dimen > gadget.set.dimen)
                err2();
            else if (set.dim + set.dimen < gadget.set.dimen)
                mpl_internal_error(mpl, "dimension of " + mpl.image + " too big");
            mpl_internal_get_token(mpl /* set name */);
            /* left parenthesis must follow the set name */
            if (mpl.token == T_LEFT)
                mpl_internal_get_token(mpl /* ( */);
            else
                mpl_internal_error(mpl, "left parenthesis missing where expected");
            /* parse permutation of component numbers */
            for (k = 0; k < gadget.set.dimen; k++) fff[k] = 0;
            k = 0;
            for (;;)
            {  if (mpl.token != T_NUMBER)
                mpl_internal_error(mpl, "component number missing where expected");
                if (str2int(mpl.image, function(v){i = v}) != 0)
                    err3();
                if (!(1 <= i && i <= gadget.set.dimen)) err3();
                if (fff[i-1] != 0)
                    mpl_internal_error(mpl, "component " + i + " multiply specified");
                gadget.ind[k++] = i; fff[i-1] = 1;
                xassert(k <= gadget.set.dimen);
                mpl_internal_get_token(mpl /* number */);
                if (mpl.token == T_COMMA)
                    mpl_internal_get_token(mpl /* , */);
                else if (mpl.token == T_RIGHT)
                    break;
                else
                    mpl_internal_error(mpl, "syntax error in data attribute");
            }
            if (k < gadget.set.dimen)
                mpl_internal_error(mpl, "there are must be " + gadget.set.dimen + " components rather than " + k);
            mpl_internal_get_token(mpl /* ) */);
        }
        else
            mpl_internal_error(mpl, "syntax error in set statement");
    }
    /* close the domain scope */
    if (set.domain != null) mpl_internal_close_scope(mpl, set.domain);
    /* if dimension of set members is still unknown, set it to 1 */
    if (set.dimen == 0) set.dimen = 1;
    /* the set statement has been completely parsed */
    xassert(mpl.token == T_SEMICOLON);
    mpl_internal_get_token(mpl /* ; */);
    return set;
}

function mpl_internal_parameter_statement(mpl){
    var par, temp;
    var integer_used = 0, binary_used = 0, symbolic_used = 0;

    function process_binary(){
        if (binary_used)
            mpl_internal_error(mpl, "at most one binary allowed");
        if (par.type == A_SYMBOLIC)
            mpl_internal_error(mpl, "symbolic parameter cannot be binary");
        par.type = A_BINARY;
        binary_used = 1;
        mpl_internal_get_token(mpl /* binary */);
    }

    function err(){mpl_internal_error(mpl, "at most one := or default allowed")}

    xassert(mpl_internal_is_keyword(mpl, "param"));
    mpl_internal_get_token(mpl /* param */);
    /* symbolic name must follow the keyword 'param' */
    if (mpl.token == T_NAME){

    }
    else if (mpl_internal_is_reserved(mpl))
        mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
    else
        mpl_internal_error(mpl, "symbolic name missing where expected");
    /* there must be no other object with the same name */
    if (mpl.tree[mpl.image] != null)
        mpl_internal_error(mpl, mpl.image + " multiply declared");
    /* create model parameter */
    par = {};
    par.name = mpl.image;
    par.alias = null;
    par.dim = 0;
    par.domain = null;
    par.type = A_NUMERIC;
    par.cond = null;
    par.in_ = null;
    par.assign = null;
    par.option = null;
    par.data = 0;
    par.defval = null;
    par.array = null;
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* parse optional alias */
    if (mpl.token == T_STRING)
    {
        par.alias = mpl.image;
        mpl_internal_get_token(mpl /* <string literal> */);
    }
    /* parse optional indexing expression */
    if (mpl.token == T_LBRACE)
    {  par.domain = mpl_internal_indexing_expression(mpl);
        par.dim = mpl_internal_domain_arity(mpl, par.domain);
    }
    /* include the parameter name in the symbolic names table */
    {   var node = mpl.tree[par.name] = {};
        node.type = A_PARAMETER;
        node.link = par;
    }
    /* parse the list of optional attributes */
    for (;;)
    {  if (mpl.token == T_COMMA)
        mpl_internal_get_token(mpl /* , */);
    else if (mpl.token == T_SEMICOLON)
        break;
        if (mpl_internal_is_keyword(mpl, "integer"))
        {  if (integer_used)
            mpl_internal_error(mpl, "at most one integer allowed");
            if (par.type == A_SYMBOLIC)
                mpl_internal_error(mpl, "symbolic parameter cannot be integer");
            if (par.type != A_BINARY) par.type = A_INTEGER;
            integer_used = 1;
            mpl_internal_get_token(mpl /* integer */);
        }
        else if (mpl_internal_is_keyword(mpl, "binary"))
            process_binary();
        else if (mpl_internal_is_keyword(mpl, "logical"))
        {  if (!mpl.as_binary)
        {   mpl_internal_warning(mpl, "keyword logical understood as binary");
            mpl.as_binary = 1;
        }
            process_binary();
        }
        else if (mpl_internal_is_keyword(mpl, "symbolic"))
        {  if (symbolic_used)
            mpl_internal_error(mpl, "at most one symbolic allowed");
            if (par.type != A_NUMERIC)
                mpl_internal_error(mpl, "integer or binary parameter cannot be symbolic");
            /* the parameter may be referenced from expressions given
             in the same parameter declaration, so its type must be
             completed before parsing that expressions */
            if (!(par.cond == null && par.in_ == null &&
                par.assign == null && par.option == null))
                mpl_internal_error(mpl, "keyword symbolic must precede any other parameter attributes");
            par.type = A_SYMBOLIC;
            symbolic_used = 1;
            mpl_internal_get_token(mpl /* symbolic */);
        }
        else if (mpl.token == T_LT || mpl.token == T_LE ||
            mpl.token == T_EQ || mpl.token == T_GE ||
            mpl.token == T_GT || mpl.token == T_NE)
        {  /* restricting condition */
            var opstr; // [8];
            /* create new restricting condition list entry and append
             it to the conditions list */
            var cond = {};
            switch (mpl.token)
            {  case T_LT:
                cond.rho = O_LT; opstr = mpl.image; break;
                case T_LE:
                    cond.rho = O_LE; opstr = mpl.image; break;
                case T_EQ:
                    cond.rho = O_EQ; opstr = mpl.image; break;
                case T_GE:
                    cond.rho = O_GE; opstr = mpl.image; break;
                case T_GT:
                    cond.rho = O_GT; opstr = mpl.image; break;
                case T_NE:
                    cond.rho = O_NE; opstr = mpl.image; break;
                default:
                    xassert(mpl.token != mpl.token);
            }
            xassert(opstr.length < 8);
            cond.code = null;
            cond.next = null;
            if (par.cond == null)
                par.cond = cond;
            else
            {  for (temp = par.cond; temp.next != null; temp = temp.next){}
                temp.next = cond;
            }
            mpl_internal_get_token(mpl /* rho */);
            /* parse an expression that follows relational operator */
            cond.code = mpl_internal_expression_5(mpl);
            if (!(cond.code.type == A_NUMERIC ||
                cond.code.type == A_SYMBOLIC))
                mpl_internal_error(mpl, "expression following " + opstr + " has invalid type");
            xassert(cond.code.dim == 0);
            /* convert to the parameter type, if necessary */
            if (par.type != A_SYMBOLIC && cond.code.type ==
                A_SYMBOLIC)
                cond.code = mpl_internal_make_unary(mpl, O_CVTNUM, cond.code,
                    A_NUMERIC, 0);
            if (par.type == A_SYMBOLIC && cond.code.type !=
                A_SYMBOLIC)
                cond.code = mpl_internal_make_unary(mpl, O_CVTSYM, cond.code,
                    A_SYMBOLIC, 0);
        }
        else if (mpl.token == T_IN || mpl.token == T_WITHIN)
        {  /* restricting superset */
            var in_;
            if (mpl.token == T_WITHIN && !mpl.as_in)
            {   mpl_internal_warning(mpl, "keyword within understood as in");
                mpl.as_in = 1;
            }
            mpl_internal_get_token(mpl /* in */);
            /* create new restricting superset list entry and append it
             to the in-list */
            in_ = {};
            in_.code = null;
            in_.next = null;
            if (par.in_ == null)
                par.in_ = in_;
            else
            {  for (temp = par.in_; temp.next != null; temp = temp.next){}
                temp.next = in_;
            }
            /* parse an expression that follows 'in' */
            in_.code = mpl_internal_expression_9(mpl);
            if (in_.code.type != A_ELEMSET)
                mpl_internal_error(mpl, "expression following in has invalid type");
            xassert(in_.code.dim > 0);
            if (in_.code.dim != 1)
                mpl_internal_error(mpl, "set expression following in must have dimens"+
                    "ion 1 rather than " + in_.code.dim);
        }
        else if (mpl.token == T_ASSIGN)
        {   /* assignment expression */
            if (!(par.assign == null && par.option == null))
                err();
            mpl_internal_get_token(mpl /* := */);
            /* parse an expression that follows ':=' */
            par.assign = mpl_internal_expression_5(mpl);
            /* the expression must be of numeric/symbolic type */
            if (!(par.assign.type == A_NUMERIC ||
                par.assign.type == A_SYMBOLIC))
                mpl_internal_error(mpl, "expression following := has invalid type");
            xassert(par.assign.dim == 0);
            /* convert to the parameter type, if necessary */
            if (par.type != A_SYMBOLIC && par.assign.type ==
                A_SYMBOLIC)
                par.assign = mpl_internal_make_unary(mpl, O_CVTNUM, par.assign,
                    A_NUMERIC, 0);
            if (par.type == A_SYMBOLIC && par.assign.type !=
                A_SYMBOLIC)
                par.assign = mpl_internal_make_unary(mpl, O_CVTSYM, par.assign,
                    A_SYMBOLIC, 0);
        }
        else if (mpl_internal_is_keyword(mpl, "default"))
        {  /* expression for default value */
            if (!(par.assign == null && par.option == null)) err();
            mpl_internal_get_token(mpl /* default */);
            /* parse an expression that follows 'default' */
            par.option = mpl_internal_expression_5(mpl);
            if (!(par.option.type == A_NUMERIC ||
                par.option.type == A_SYMBOLIC))
                mpl_internal_error(mpl, "expression following default has invalid type");
            xassert(par.option.dim == 0);
            /* convert to the parameter type, if necessary */
            if (par.type != A_SYMBOLIC && par.option.type ==
                A_SYMBOLIC)
                par.option = mpl_internal_make_unary(mpl, O_CVTNUM, par.option,
                    A_NUMERIC, 0);
            if (par.type == A_SYMBOLIC && par.option.type !=
                A_SYMBOLIC)
                par.option = mpl_internal_make_unary(mpl, O_CVTSYM, par.option,
                    A_SYMBOLIC, 0);
        }
        else
            mpl_internal_error(mpl, "syntax error in parameter statement");
    }
    /* close the domain scope */
    if (par.domain != null) mpl_internal_close_scope(mpl, par.domain);
    /* the parameter statement has been completely parsed */
    xassert(mpl.token == T_SEMICOLON);
    mpl_internal_get_token(mpl /* ; */);
    return par;
}

function mpl_internal_variable_statement(mpl){
    var integer_used = 0, binary_used = 0;

    function process_binary(){
        if (binary_used)
            mpl_internal_error(mpl, "at most one binary allowed");
        var_.type = A_BINARY;
        binary_used = 1;
        mpl_internal_get_token(mpl /* binary */);
    }

    xassert(mpl_internal_is_keyword(mpl, "var"));
    if (mpl.flag_s)
        mpl_internal_error(mpl, "variable statement must precede solve statement");
    mpl_internal_get_token(mpl /* var */);
    /* symbolic name must follow the keyword 'var' */
    if (mpl.token == T_NAME){

    }
    else if (mpl_internal_is_reserved(mpl))
        mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
    else
        mpl_internal_error(mpl, "symbolic name missing where expected");
    /* there must be no other object with the same name */
    if (mpl.tree[mpl.image] != null)
        mpl_internal_error(mpl, mpl.image + " multiply declared");
    /* create model variable */
    var var_ = {};
    var_.name = mpl.image;
    var_.alias = null;
    var_.dim = 0;
    var_.domain = null;
    var_.type = A_NUMERIC;
    var_.lbnd = null;
    var_.ubnd = null;
    var_.array = null;
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* parse optional alias */
    if (mpl.token == T_STRING)
    {
        var_.alias = mpl.image;
        mpl_internal_get_token(mpl /* <string literal> */);
    }
    /* parse optional indexing expression */
    if (mpl.token == T_LBRACE)
    {  var_.domain = mpl_internal_indexing_expression(mpl);
        var_.dim = mpl_internal_domain_arity(mpl, var_.domain);
    }
    /* include the variable name in the symbolic names table */
    {
        var node = mpl.tree[var_.name] = {};
        node.type = A_VARIABLE;
        node.link = var_;
    }
    /* parse the list of optional attributes */
    for (;;)
    {  if (mpl.token == T_COMMA)
        mpl_internal_get_token(mpl /* , */);
    else if (mpl.token == T_SEMICOLON)
        break;
        if (mpl_internal_is_keyword(mpl, "integer"))
        {  if (integer_used)
            mpl_internal_error(mpl, "at most one integer allowed");
            if (var_.type != A_BINARY) var_.type = A_INTEGER;
            integer_used = 1;
            mpl_internal_get_token(mpl /* integer */);
        }
        else if (mpl_internal_is_keyword(mpl, "binary"))
            process_binary();
        else if (mpl_internal_is_keyword(mpl, "logical"))
        {  if (!mpl.as_binary)
        {  mpl_internal_warning(mpl, "keyword logical understood as binary");
            mpl.as_binary = 1;
        }
            process_binary();
        }
        else if (mpl_internal_is_keyword(mpl, "symbolic"))
            mpl_internal_error(mpl, "variable cannot be symbolic");
        else if (mpl.token == T_GE)
        {  /* lower bound */
            if (var_.lbnd != null)
            {  if (var_.lbnd == var_.ubnd)
                mpl_internal_error(mpl, "both fixed value and lower bound not allowed");
            else
                mpl_internal_error(mpl, "at most one lower bound allowed");
            }
            mpl_internal_get_token(mpl /* >= */);
            /* parse an expression that specifies the lower bound */
            var_.lbnd = mpl_internal_expression_5(mpl);
            if (var_.lbnd.type == A_SYMBOLIC)
                var_.lbnd = mpl_internal_make_unary(mpl, O_CVTNUM, var_.lbnd,
                    A_NUMERIC, 0);
            if (var_.lbnd.type != A_NUMERIC)
                mpl_internal_error(mpl, "expression following >= has invalid type");
            xassert(var_.lbnd.dim == 0);
        }
        else if (mpl.token == T_LE)
        {  /* upper bound */
            if (var_.ubnd != null)
            {  if (var_.ubnd == var_.lbnd)
                mpl_internal_error(mpl, "both fixed value and upper bound not allowed");
            else
                mpl_internal_error(mpl, "at most one upper bound allowed");
            }
            mpl_internal_get_token(mpl /* <= */);
            /* parse an expression that specifies the upper bound */
            var_.ubnd = mpl_internal_expression_5(mpl);
            if (var_.ubnd.type == A_SYMBOLIC)
                var_.ubnd = mpl_internal_make_unary(mpl, O_CVTNUM, var_.ubnd,
                    A_NUMERIC, 0);
            if (var_.ubnd.type != A_NUMERIC)
                mpl_internal_error(mpl, "expression following <= has invalid type");
            xassert(var_.ubnd.dim == 0);
        }
        else if (mpl.token == T_EQ)
        {  /* fixed value */
            var opstr; //[8]
            if (!(var_.lbnd == null && var_.ubnd == null))
            {  if (var_.lbnd == var_.ubnd)
                mpl_internal_error(mpl, "at most one fixed value allowed");
            else if (var_.lbnd != null)
                mpl_internal_error(mpl, "both lower bound and fixed value not allowed");
            else
                mpl_internal_error(mpl, "both upper bound and fixed value not allowed");
            }
            opstr = mpl.image;
            xassert(opstr.length < 8);
            mpl_internal_get_token(mpl /* = | == */);
            /* parse an expression that specifies the fixed value */
            var_.lbnd = mpl_internal_expression_5(mpl);
            if (var_.lbnd.type == A_SYMBOLIC)
                var_.lbnd = mpl_internal_make_unary(mpl, O_CVTNUM, var_.lbnd,
                    A_NUMERIC, 0);
            if (var_.lbnd.type != A_NUMERIC)
                mpl_internal_error(mpl, "expression following " + opstr + " has invalid type");
            xassert(var_.lbnd.dim == 0);
            /* indicate that the variable is fixed, not bounded */
            var_.ubnd = var_.lbnd;
        }
        else if (mpl.token == T_LT || mpl.token == T_GT ||
            mpl.token == T_NE)
            mpl_internal_error(mpl, "strict bound not allowed");
        else
            mpl_internal_error(mpl, "syntax error in variable statement");
    }
    /* close the domain scope */
    if (var_.domain != null) mpl_internal_close_scope(mpl, var_.domain);
    /* the variable statement has been completely parsed */
    xassert(mpl.token == T_SEMICOLON);
    mpl_internal_get_token(mpl /* ; */);
    return var_;
}

function mpl_internal_constraint_statement(mpl){
    var first, second, third;
    var rho;
    var opstr; //[8];

    function err(){mpl_internal_error(mpl, "syntax error in constraint statement")}

    if (mpl.flag_s)
        mpl_internal_error(mpl, "constraint statement must precede solve statement");
    if (mpl_internal_is_keyword(mpl, "subject"))
    {  mpl_internal_get_token(mpl /* subject */);
        if (!mpl_internal_is_keyword(mpl, "to"))
            mpl_internal_error(mpl, "keyword subject to incomplete");
        mpl_internal_get_token(mpl /* to */);
    }
    else if (mpl_internal_is_keyword(mpl, "subj"))
    {  mpl_internal_get_token(mpl /* subj */);
        if (!mpl_internal_is_keyword(mpl, "to"))
            mpl_internal_error(mpl, "keyword subj to incomplete");
        mpl_internal_get_token(mpl /* to */);
    }
    else if (mpl.token == T_SPTP)
        mpl_internal_get_token(mpl /* s.t. */);
    /* the current token must be symbolic name of constraint */
    if (mpl.token == T_NAME){

    }
    else if (mpl_internal_is_reserved(mpl))
        mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
    else
        mpl_internal_error(mpl, "symbolic name missing where expected");
    /* there must be no other object with the same name */
    if (mpl.tree[mpl.image] != null)
        mpl_internal_error(mpl, mpl.image + " multiply declared");
    /* create model constraint */
    var con = {};
    con.name = mpl.image;
    con.alias = null;
    con.dim = 0;
    con.domain = null;
    con.type = A_CONSTRAINT;
    con.code = null;
    con.lbnd = null;
    con.ubnd = null;
    con.array = null;
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* parse optional alias */
    if (mpl.token == T_STRING)
    {
        con.alias = mpl.image;
        mpl_internal_get_token(mpl /* <string literal> */);
    }
    /* parse optional indexing expression */
    if (mpl.token == T_LBRACE)
    {  con.domain = mpl_internal_indexing_expression(mpl);
        con.dim = mpl_internal_domain_arity(mpl, con.domain);
    }
    /* include the constraint name in the symbolic names table */
    {
        var node = mpl.tree[con.name] = {};
        node.type = A_CONSTRAINT;
        node.link = con;
    }
    /* the colon must precede the first expression */
    if (mpl.token != T_COLON)
        mpl_internal_error(mpl, "colon missing where expected");
    mpl_internal_get_token(mpl /* : */);
    /* parse the first expression */
    first = mpl_internal_expression_5(mpl);
    if (first.type == A_SYMBOLIC)
        first = mpl_internal_make_unary(mpl, O_CVTNUM, first, A_NUMERIC, 0);
    if (!(first.type == A_NUMERIC || first.type == A_FORMULA))
        mpl_internal_error(mpl, "expression following colon has invalid type");
    xassert(first.dim == 0);
    /* relational operator must follow the first expression */
    if (mpl.token == T_COMMA) mpl_internal_get_token(mpl /* , */);
    switch (mpl.token)
    {  case T_LE:
        case T_GE:
        case T_EQ:
            break;
        case T_LT:
        case T_GT:
        case T_NE:
            mpl_internal_error(mpl, "strict inequality not allowed");
            break;
        case T_SEMICOLON:
            mpl_internal_error(mpl, "constraint must be equality or inequality");
            break;
        default:
            err();
    }
    rho = mpl.token;
    opstr = mpl.image;
    xassert(opstr.length < 8);
    mpl_internal_get_token(mpl /* rho */);
    /* parse the second expression */
    second = mpl_internal_expression_5(mpl);
    if (second.type == A_SYMBOLIC)
        second = mpl_internal_make_unary(mpl, O_CVTNUM, second, A_NUMERIC, 0);
    if (!(second.type == A_NUMERIC || second.type == A_FORMULA))
        mpl_internal_error(mpl, "expression following " + opstr + " has invalid type");
    xassert(second.dim == 0);
    /* check a token that follow the second expression */
    if (mpl.token == T_COMMA)
    {  mpl_internal_get_token(mpl /* , */);
        if (mpl.token == T_SEMICOLON) err();
    }
    if (mpl.token == T_LT || mpl.token == T_LE ||
        mpl.token == T_EQ || mpl.token == T_GE ||
        mpl.token == T_GT || mpl.token == T_NE)
    {  /* it is another relational operator, therefore the constraint
     is double inequality */
        if (rho == T_EQ || mpl.token != rho)
            mpl_internal_error(mpl, "double inequality must be ... <= ... <= ... or " +
                "... >= ... >= ...");
        /* the first expression cannot be linear form */
        if (first.type == A_FORMULA)
            mpl_internal_error(mpl, "leftmost expression in double inequality cannot" +
                " be linear form");
        mpl_internal_get_token(mpl /* rho */);
        /* parse the third expression */
        third = mpl_internal_expression_5(mpl);
        if (third.type == A_SYMBOLIC)
            third = mpl_internal_make_unary(mpl, O_CVTNUM, second, A_NUMERIC, 0);
        if (!(third.type == A_NUMERIC || third.type == A_FORMULA))
            mpl_internal_error(mpl, "rightmost expression in double inequality const" +
                "raint has invalid type");
        xassert(third.dim == 0);
        /* the third expression also cannot be linear form */
        if (third.type == A_FORMULA)
            mpl_internal_error(mpl, "rightmost expression in double inequality canno" +
                "t be linear form");
    }
    else
    {  /* the constraint is equality or single inequality */
        third = null;
    }
    /* close the domain scope */
    if (con.domain != null) mpl_internal_close_scope(mpl, con.domain);
    /* convert all expressions to linear form, if necessary */
    if (first.type != A_FORMULA)
        first = mpl_internal_make_unary(mpl, O_CVTLFM, first, A_FORMULA, 0);
    if (second.type != A_FORMULA)
        second = mpl_internal_make_unary(mpl, O_CVTLFM, second, A_FORMULA, 0);
    if (third != null)
        third = mpl_internal_make_unary(mpl, O_CVTLFM, third, A_FORMULA, 0);
    /* arrange expressions in the constraint */
    if (third == null)
    {  /* the constraint is equality or single inequality */
        switch (rho)
        {  case T_LE:
            /* first <= second */
            con.code = first;
            con.lbnd = null;
            con.ubnd = second;
            break;
            case T_GE:
                /* first >= second */
                con.code = first;
                con.lbnd = second;
                con.ubnd = null;
                break;
            case T_EQ:
                /* first = second */
                con.code = first;
                con.lbnd = second;
                con.ubnd = second;
                break;
            default:
                xassert(rho != rho);
        }
    }
    else
    {  /* the constraint is double inequality */
        switch (rho)
        {  case T_LE:
            /* first <= second <= third */
            con.code = second;
            con.lbnd = first;
            con.ubnd = third;
            break;
            case T_GE:
                /* first >= second >= third */
                con.code = second;
                con.lbnd = third;
                con.ubnd = first;
                break;
            default:
                xassert(rho != rho);
        }
    }
    /* the constraint statement has been completely parsed */
    if (mpl.token != T_SEMICOLON)
        err();
    mpl_internal_get_token(mpl /* ; */);
    return con;
}

function mpl_internal_objective_statement(mpl){
    var obj;
    var type;
    if (mpl_internal_is_keyword(mpl, "minimize"))
        type = A_MINIMIZE;
    else if (mpl_internal_is_keyword(mpl, "maximize"))
        type = A_MAXIMIZE;
    else
        xassert(mpl != mpl);
    if (mpl.flag_s)
        mpl_internal_error(mpl, "objective statement must precede solve statement");
    mpl_internal_get_token(mpl /* minimize | maximize */);
    /* symbolic name must follow the verb 'minimize' or 'maximize' */
    if (mpl.token == T_NAME){

    }
    else if (mpl_internal_is_reserved(mpl))
        mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
    else
        mpl_internal_error(mpl, "symbolic name missing where expected");
    /* there must be no other object with the same name */
    if (mpl.tree[mpl.image] != null)
        mpl_internal_error(mpl, mpl.image + " multiply declared");
    /* create model objective */
    obj = {};
    obj.name = mpl.image;
    obj.alias = null;
    obj.dim = 0;
    obj.domain = null;
    obj.type = type;
    obj.code = null;
    obj.lbnd = null;
    obj.ubnd = null;
    obj.array = null;
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* parse optional alias */
    if (mpl.token == T_STRING)
    {
        obj.alias = mpl.image;
        mpl_internal_get_token(mpl /* <string literal> */);
    }
    /* parse optional indexing expression */
    if (mpl.token == T_LBRACE)
    {   obj.domain = mpl_internal_indexing_expression(mpl);
        obj.dim = mpl_internal_domain_arity(mpl, obj.domain);
    }
    /* include the constraint name in the symbolic names table */
    {
        var node = mpl.tree[obj.name] = {};
        node.type = A_CONSTRAINT;
        node.link = obj;
    }
    /* the colon must precede the objective expression */
    if (mpl.token != T_COLON)
        mpl_internal_error(mpl, "colon missing where expected");
    mpl_internal_get_token(mpl /* : */);
    /* parse the objective expression */
    obj.code = mpl_internal_expression_5(mpl);
    if (obj.code.type == A_SYMBOLIC)
        obj.code = mpl_internal_make_unary(mpl, O_CVTNUM, obj.code, A_NUMERIC, 0);
    if (obj.code.type == A_NUMERIC)
        obj.code = mpl_internal_make_unary(mpl, O_CVTLFM, obj.code, A_FORMULA, 0);
    if (obj.code.type != A_FORMULA)
        mpl_internal_error(mpl, "expression following colon has invalid type");
    xassert(obj.code.dim == 0);
    /* close the domain scope */
    if (obj.domain != null) mpl_internal_close_scope(mpl, obj.domain);
    /* the objective statement has been completely parsed */
    if (mpl.token != T_SEMICOLON)
        mpl_internal_error(mpl, "syntax error in objective statement");
    mpl_internal_get_token(mpl /* ; */);
    return obj;
}

function mpl_internal_table_statement(mpl){
    var last_arg, arg;
    var last_fld, fld;
    var last_in, in_;
    var last_out, out;
    var node;
    var nflds;
    var name; // [MAX_LENGTH+1];
    xassert(mpl_internal_is_keyword(mpl, "table"));
    mpl_internal_get_token(mpl /* solve */);
    /* symbolic name must follow the keyword table */
    if (mpl.token == T_NAME){

    }
    else if (mpl_internal_is_reserved(mpl))
        mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
    else
        mpl_internal_error(mpl, "symbolic name missing where expected");
    /* there must be no other object with the same name */
    if (mpl.tree[mpl.image] != null)
        mpl_internal_error(mpl, mpl.image + " multiply declared");
    /* create data table */
    var tab = {u: {in_: {}, out: {}}};
    tab.name = mpl.image;
    mpl_internal_get_token(mpl /* <symbolic name> */);
    /* parse optional alias */
    if (mpl.token == T_STRING)
    {
        tab.alias = mpl.image;
        mpl_internal_get_token(mpl /* <string literal> */);
    }
    else
        tab.alias = null;
    /* parse optional indexing expression */
    if (mpl.token == T_LBRACE)
    {  /* this is output table */
        tab.type = A_OUTPUT;
        tab.u.out.domain = mpl_internal_indexing_expression(mpl);
        if (!mpl_internal_is_keyword(mpl, "OUT"))
            mpl_internal_error(mpl, "keyword OUT missing where expected");
        mpl_internal_get_token(mpl /* OUT */);
    }
    else
    {  /* this is input table */
        tab.type = A_INPUT;
        if (!mpl_internal_is_keyword(mpl, "IN"))
            mpl_internal_error(mpl, "keyword IN missing where expected");
        mpl_internal_get_token(mpl /* IN */);
    }
    /* parse argument list */
    tab.arg = last_arg = null;
    for (;;)
    {  /* create argument list entry */
        arg = {};
        /* parse argument expression */
        if (mpl.token == T_COMMA || mpl.token == T_COLON ||
            mpl.token == T_SEMICOLON)
            mpl_internal_error(mpl, "argument expression missing where expected");
        arg.code = mpl_internal_expression_5(mpl);
        /* convert the result to symbolic type, if necessary */
        if (arg.code.type == A_NUMERIC)
            arg.code =
                mpl_internal_make_unary(mpl, O_CVTSYM, arg.code, A_SYMBOLIC, 0);
        /* check that now the result is of symbolic type */
        if (arg.code.type != A_SYMBOLIC)
            mpl_internal_error(mpl, "argument expression has invalid type");
        /* add the entry to the end of the list */
        arg.next = null;
        if (last_arg == null)
            tab.arg = arg;
        else
            last_arg.next = arg;
        last_arg = arg;
        /* argument expression has been parsed */
        if (mpl.token == T_COMMA)
            mpl_internal_get_token(mpl /* , */);
        else if (mpl.token == T_COLON || mpl.token == T_SEMICOLON)
            break;
    }
    xassert(tab.arg != null);
    /* argument list must end with colon */
    if (mpl.token == T_COLON)
        mpl_internal_get_token(mpl /* : */);
    else
        mpl_internal_error(mpl, "colon missing where expected");
    /* parse specific part of the table statement */
    switch (tab.type)
    {   case A_INPUT:
        /* parse optional set name */
        if (mpl.token == T_NAME)
        {   node = mpl.tree[mpl.image];
            if (node == null)
                mpl_internal_error(mpl, mpl.image + " not defined");
            if (node.type != A_SET)
                mpl_internal_error(mpl, mpl.image + " not a set");
            tab.u.in_.set = node.link;
            if (tab.u.in_.set.assign != null)
                mpl_internal_error(mpl, mpl.image + " needs no data");
            if (tab.u.in_.set.dim != 0)
                mpl_internal_error(mpl, mpl.image + " must be a simple set");
            mpl_internal_get_token(mpl /* <symbolic name> */);
            if (mpl.token == T_INPUT)
                mpl_internal_get_token(mpl /* <- */);
            else
                mpl_internal_error(mpl, "delimiter <- missing where expected");
        }
        else if (mpl_internal_is_reserved(mpl))
            mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
        else
            tab.u.in_.set = null;
        /* parse field list */
        tab.u.in_.fld = last_fld = null;
        nflds = 0;
        if (mpl.token == T_LBRACKET)
            mpl_internal_get_token(mpl /* [ */);
        else
            mpl_internal_error(mpl, "field list missing where expected");
        for (;;)
        {  /* create field list entry */
            fld = {};
            /* parse field name */
            if (mpl.token == T_NAME){

            }
            else if (mpl_internal_is_reserved(mpl))
                mpl_internal_error(mpl,
                    "invalid use of reserved keyword " + mpl.image);
            else
                mpl_internal_error(mpl, "field name missing where expected");
            fld.name = mpl.image;
            mpl_internal_get_token(mpl /* <symbolic name> */);
            /* add the entry to the end of the list */
            fld.next = null;
            if (last_fld == null)
                tab.u.in_.fld = fld;
            else
                last_fld.next = fld;
            last_fld = fld;
            nflds++;
            /* field name has been parsed */
            if (mpl.token == T_COMMA)
                mpl_internal_get_token(mpl /* , */);
            else if (mpl.token == T_RBRACKET)
                break;
            else
                mpl_internal_error(mpl, "syntax error in field list");
        }
        /* check that the set dimen is equal to the number of fields */
        if (tab.u.in_.set != null && tab.u.in_.set.dimen != nflds)
            mpl_internal_error(mpl, "there must be " + tab.u.in_.set.dimen + " field" +
                (tab.u.in_.set.dimen == 1 ? "" : "s") + " rather than " + nflds);
        mpl_internal_get_token(mpl /* ] */);
        /* parse optional input list */
        tab.u.in_.list = last_in = null;
        while (mpl.token == T_COMMA)
        {  mpl_internal_get_token(mpl /* , */);
            /* create input list entry */
            in_ = {};
            /* parse parameter name */
            if (mpl.token == T_NAME){

            }
            else if (mpl_internal_is_reserved(mpl))
                mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
            else
                mpl_internal_error(mpl, "parameter name missing where expected");
            node = mpl.tree[mpl.image];
            if (node == null)
                mpl_internal_error(mpl, mpl.image + " not defined");
            if (node.type != A_PARAMETER)
                mpl_internal_error(mpl, mpl.image + " not a parameter");
            in_.par = node.link;
            if (in_.par.dim != nflds)
                mpl_internal_error(mpl, mpl.image + " must have " + nflds + " subscript" + (nflds == 1 ? "" : "s") + " rather than " + in_.par.dim);
            if (in_.par.assign != null)
                mpl_internal_error(mpl, mpl.image + " needs no data");
            mpl_internal_get_token(mpl /* <symbolic name> */);
            /* parse optional field name */
            if (mpl.token == T_TILDE)
            {  mpl_internal_get_token(mpl /* ~ */);
                /* parse field name */
                if (mpl.token == T_NAME){

                }
                else if (mpl_internal_is_reserved(mpl))
                    mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
                else
                    mpl_internal_error(mpl, "field name missing where expected");
                //xassert(mpl.image.length < MAX_LENGTH+1);
                name = mpl.image;
                mpl_internal_get_token(mpl /* <symbolic name> */);
            }
            else
            {  /* field name is the same as the parameter name */
                //xassert(in_.par.name.length < MAX_LENGTH+1);
                name = in_.par.name;
            }
            /* assign field name */
            in_.name = name;
            /* add the entry to the end of the list */
            in_.next = null;
            if (last_in == null)
                tab.u.in_.list = in_;
            else
                last_in.next = in_;
            last_in = in_;
        }
        break;
        case A_OUTPUT:
            /* parse output list */
            tab.u.out.list = last_out = null;
            for (;;)
            {  /* create output list entry */
                out = {};
                /* parse expression */
                if (mpl.token == T_COMMA || mpl.token == T_SEMICOLON)
                    mpl_internal_error(mpl, "expression missing where expected");
                if (mpl.token == T_NAME)
                {  //xassert(mpl.image.length < MAX_LENGTH+1);
                    name = mpl.image;
                }
                else
                    name = '';
                out.code = mpl_internal_expression_5(mpl);
                /* parse optional field name */
                if (mpl.token == T_TILDE)
                {  mpl_internal_get_token(mpl /* ~ */);
                    /* parse field name */
                    if (mpl.token == T_NAME){

                    }
                    else if (mpl_internal_is_reserved(mpl))
                        mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
                    else
                        mpl_internal_error(mpl, "field name missing where expected");
                    //xassert(mpl.image.length < MAX_LENGTH+1);
                    name = mpl.image;
                    mpl_internal_get_token(mpl /* <symbolic name> */);
                }
                /* assign field name */
                if (name == '')
                    mpl_internal_error(mpl, "field name required");
                out.name = name;
                /* add the entry to the end of the list */
                out.next = null;
                if (last_out == null)
                    tab.u.out.list = out;
                else
                    last_out.next = out;
                last_out = out;
                /* output item has been parsed */
                if (mpl.token == T_COMMA)
                    mpl_internal_get_token(mpl /* , */);
                else if (mpl.token == T_SEMICOLON)
                    break;
                else
                    mpl_internal_error(mpl, "syntax error in output list");
            }
            /* close the domain scope */
            mpl_internal_close_scope(mpl,tab.u.out.domain);
            break;
        default:
            xassert(tab != tab);
    }

    /* the table statement must end with semicolon */
    if (mpl.token != T_SEMICOLON)
        mpl_internal_error(mpl, "syntax error in table statement");
    mpl_internal_get_token(mpl /* ; */);
    return tab;
}

function mpl_internal_solve_statement(mpl){
    xassert(mpl_internal_is_keyword(mpl, "solve"));
    if (mpl.flag_s)
        mpl_internal_error(mpl, "at most one solve statement allowed");
    mpl.flag_s = 1;
    mpl_internal_get_token(mpl /* solve */);
    /* semicolon must follow solve statement */
    if (mpl.token != T_SEMICOLON)
        mpl_internal_error(mpl, "syntax error in solve statement");
    mpl_internal_get_token(mpl /* ; */);
    return null;
}

function mpl_internal_check_statement(mpl){
    xassert(mpl_internal_is_keyword(mpl, "check"));
    /* create check descriptor */
    var chk = {};
    chk.domain = null;
    chk.code = null;
    mpl_internal_get_token(mpl /* check */);
    /* parse optional indexing expression */
    if (mpl.token == T_LBRACE)
    {  chk.domain = mpl_internal_indexing_expression(mpl);
    }
    /* skip optional colon */
    if (mpl.token == T_COLON) mpl_internal_get_token(mpl /* : */);
    /* parse logical expression */
    chk.code = mpl_internal_expression_13(mpl);
    if (chk.code.type != A_LOGICAL)
        mpl_internal_error(mpl, "expression has invalid type");
    xassert(chk.code.dim == 0);
    /* close the domain scope */
    if (chk.domain != null) mpl_internal_close_scope(mpl, chk.domain);
    /* the check statement has been completely parsed */
    if (mpl.token != T_SEMICOLON)
        mpl_internal_error(mpl, "syntax error in check statement");
    mpl_internal_get_token(mpl /* ; */);
    return chk;
}

function mpl_internal_display_statement(mpl){
    var last_entry;

    xassert(mpl_internal_is_keyword(mpl, "display"));
    /* create display descriptor */
    var dpy = {};
    dpy.domain = null;
    dpy.list = last_entry = null;
    mpl_internal_get_token(mpl /* display */);
    /* parse optional indexing expression */
    if (mpl.token == T_LBRACE)
        dpy.domain = mpl_internal_indexing_expression(mpl);
    /* skip optional colon */
    if (mpl.token == T_COLON) mpl_internal_get_token(mpl /* : */);
    /* parse display list */
    for (;;)
    {  /* create new display entry */
        var entry = {u: {}};

        function expr(){
            /* display entry is expression */
            entry.type = A_EXPRESSION;
            entry.u.code = mpl_internal_expression_13(mpl);
        }

        entry.type = 0;
        entry.next = null;
        /* and append it to the display list */
        if (dpy.list == null)
            dpy.list = entry;
        else
            last_entry.next = entry;
        last_entry = entry;
        /* parse display entry */
        if (mpl.token == T_NAME)
        {   var node;
            var next_token;
            mpl_internal_get_token(mpl /* <symbolic name> */);
            next_token = mpl.token;
            mpl_internal_unget_token(mpl);
            if (!(next_token == T_COMMA || next_token == T_SEMICOLON))
            {  /* symbolic name begins expression */
                expr();
            } else {
                /* display entry is dummy index or model object */
                node = mpl.tree[mpl.image];
                if (node == null)
                    mpl_internal_error(mpl, mpl.image + " not defined");
                entry.type = node.type;
                switch (node.type)
                {  case A_INDEX:
                    entry.u.slot = node.link;
                    break;
                    case A_SET:
                        entry.u.set = node.link;
                        break;
                    case A_PARAMETER:
                        entry.u.par = node.link;
                        break;
                    case A_VARIABLE:
                        entry.u.var_ = node.link;
                        if (!mpl.flag_s)
                            mpl_internal_error(mpl, "invalid reference to variable " + entry.u.var_.name +  " above solve statement");
                        break;
                    case A_CONSTRAINT:
                        entry.u.con = node.link;
                        if (!mpl.flag_s)
                            mpl_internal_error(mpl, "invalid reference to " + (entry.u.con.type == A_CONSTRAINT ?"constraint" : "objective") +
                                " " + entry.u.con.name + " above solve statement");
                        break;
                    default:
                        xassert(node != node);
                }
                mpl_internal_get_token(mpl /* <symbolic name> */);
            }
        }
        else
            expr();
        /* check a token that follows the entry parsed */
        if (mpl.token == T_COMMA)
            mpl_internal_get_token(mpl /* , */);
        else
            break;
    }
    /* close the domain scope */
    if (dpy.domain != null) mpl_internal_close_scope(mpl, dpy.domain);
    /* the display statement has been completely parsed */
    if (mpl.token != T_SEMICOLON)
        mpl_internal_error(mpl, "syntax error in display statement");
    mpl_internal_get_token(mpl /* ; */);
    return dpy;
}

function mpl_internal_printf_statement(mpl){
    var entry, last_entry;
    xassert(mpl_internal_is_keyword(mpl, "printf"));
    /* create printf descriptor */
    var prt = {};
    prt.domain = null;
    prt.fmt = null;
    prt.list = last_entry = null;
    mpl_internal_get_token(mpl /* printf */);
    /* parse optional indexing expression */
    if (mpl.token == T_LBRACE)
    {  prt.domain = mpl_internal_indexing_expression(mpl);
    }
    /* skip optional colon */
    if (mpl.token == T_COLON) mpl_internal_get_token(mpl /* : */);
    /* parse expression for format string */
    prt.fmt = mpl_internal_expression_5(mpl);
    /* convert it to symbolic type, if necessary */
    if (prt.fmt.type == A_NUMERIC)
        prt.fmt = mpl_internal_make_unary(mpl, O_CVTSYM, prt.fmt, A_SYMBOLIC, 0);
    /* check that now the expression is of symbolic type */
    if (prt.fmt.type != A_SYMBOLIC)
        mpl_internal_error(mpl, "format expression has invalid type");
    /* parse printf list */
    while (mpl.token == T_COMMA)
    {  mpl_internal_get_token(mpl /* , */);
        /* create new printf entry */
        entry = {};
        entry.code = null;
        entry.next = null;
        /* and append it to the printf list */
        if (prt.list == null)
            prt.list = entry;
        else
            last_entry.next = entry;
        last_entry = entry;
        /* parse printf entry */
        entry.code = mpl_internal_expression_9(mpl);
        if (!(entry.code.type == A_NUMERIC ||
            entry.code.type == A_SYMBOLIC ||
            entry.code.type == A_LOGICAL))
            mpl_internal_error(mpl, "only numeric, symbolic, or logical expression allowed");
    }
    /* close the domain scope */
    if (prt.domain != null) mpl_internal_close_scope(mpl, prt.domain);
    /* parse optional redirection */
    prt.fname = null; prt.app = 0;
    if (mpl.token == T_GT || mpl.token == T_APPEND)
    {  prt.app = (mpl.token == T_APPEND);
        mpl_internal_get_token(mpl /* > or >> */);
        /* parse expression for file name string */
        prt.fname = mpl_internal_expression_5(mpl);
        /* convert it to symbolic type, if necessary */
        if (prt.fname.type == A_NUMERIC)
            prt.fname = mpl_internal_make_unary(mpl, O_CVTSYM, prt.fname,
                A_SYMBOLIC, 0);
        /* check that now the expression is of symbolic type */
        if (prt.fname.type != A_SYMBOLIC)
            mpl_internal_error(mpl, "file name expression has invalid type");
    }
    /* the printf statement has been completely parsed */
    if (mpl.token != T_SEMICOLON)
        mpl_internal_error(mpl, "syntax error in printf statement");
    mpl_internal_get_token(mpl /* ; */);
    return prt;
}

function mpl_internal_for_statement(mpl){
    var stmt, last_stmt;
    xassert(mpl_internal_is_keyword(mpl, "for"));
    /* create for descriptor */
    var fur = {};
    fur.domain = null;
    fur.list = last_stmt = null;
    mpl_internal_get_token(mpl /* for */);
    /* parse indexing expression */
    if (mpl.token != T_LBRACE)
        mpl_internal_error(mpl, "indexing expression missing where expected");
    fur.domain = mpl_internal_indexing_expression(mpl);
    /* skip optional colon */
    if (mpl.token == T_COLON) mpl_internal_get_token(mpl /* : */);
    /* parse for statement body */
    if (mpl.token != T_LBRACE)
    {  /* parse simple statement */
        fur.list = mpl_internal_simple_statement(mpl, 1);
    }
    else
    {  /* parse compound statement */
        mpl_internal_get_token(mpl /* { */);
        while (mpl.token != T_RBRACE)
        {  /* parse statement */
            stmt = mpl_internal_simple_statement(mpl, 1);
            /* and append it to the end of the statement list */
            if (last_stmt == null)
                fur.list = stmt;
            else
                last_stmt.next = stmt;
            last_stmt = stmt;
        }
        mpl_internal_get_token(mpl /* } */);
    }
    /* close the domain scope */
    xassert(fur.domain != null);
    mpl_internal_close_scope(mpl, fur.domain);
    /* the for statement has been completely parsed */
    return fur;
}

function mpl_internal_end_statement(mpl){
    if (!mpl.flag_d && mpl_internal_is_keyword(mpl, "end") ||
        mpl.flag_d && mpl_internal_is_literal(mpl, "end"))
    {
        mpl_internal_get_token(mpl /* end */);
        if (mpl.token == T_SEMICOLON)
            mpl_internal_get_token(mpl /* ; */);
        else
            mpl_internal_warning(mpl, "no semicolon following end statement; missing" +
                " semicolon inserted");
    }
    else
        mpl_internal_warning(mpl, "unexpected end of file; missing end statement inserted");
    if (mpl.token != T_EOF)
        mpl_internal_warning(mpl, "some text detected beyond end statement; text ignored");
}

function mpl_internal_simple_statement(mpl, spec){
    var stmt = {u: {}};
    stmt.line = mpl.line;
    stmt.column = mpl.column;
    stmt.next = null;
    if (mpl_internal_is_keyword(mpl, "set"))
    {  if (spec)
        mpl_internal_error(mpl, "set statement not allowed here");
        stmt.type = A_SET;
        stmt.u.set = mpl_internal_set_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "param"))
    {  if (spec)
        mpl_internal_error(mpl, "parameter statement not allowed here");
        stmt.type = A_PARAMETER;
        stmt.u.par = mpl_internal_parameter_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "var"))
    {  if (spec)
        mpl_internal_error(mpl, "variable statement not allowed here");
        stmt.type = A_VARIABLE;
        stmt.u.var_ = mpl_internal_variable_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "subject") ||
        mpl_internal_is_keyword(mpl, "subj") ||
        mpl.token == T_SPTP)
    {  if (spec)
        mpl_internal_error(mpl, "constraint statement not allowed here");
        stmt.type = A_CONSTRAINT;
        stmt.u.con = mpl_internal_constraint_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "minimize") ||
        mpl_internal_is_keyword(mpl, "maximize"))
    {  if (spec)
        mpl_internal_error(mpl, "objective statement not allowed here");
        stmt.type = A_CONSTRAINT;
        stmt.u.con = mpl_internal_objective_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "table"))
    {  if (spec)
        mpl_internal_error(mpl, "table statement not allowed here");
        stmt.type = A_TABLE;
        stmt.u.tab = mpl_internal_table_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "solve"))
    {  if (spec)
        mpl_internal_error(mpl, "solve statement not allowed here");
        stmt.type = A_SOLVE;
        stmt.u.slv = mpl_internal_solve_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "check"))
    {  stmt.type = A_CHECK;
        stmt.u.chk = mpl_internal_check_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "display"))
    {  stmt.type = A_DISPLAY;
        stmt.u.dpy = mpl_internal_display_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "printf"))
    {  stmt.type = A_PRINTF;
        stmt.u.prt = mpl_internal_printf_statement(mpl);
    }
    else if (mpl_internal_is_keyword(mpl, "for"))
    {  stmt.type = A_FOR;
        stmt.u.fur = mpl_internal_for_statement(mpl);
    }
    else if (mpl.token == T_NAME)
    {  if (spec)
        mpl_internal_error(mpl, "constraint statement not allowed here");
        stmt.type = A_CONSTRAINT;
        stmt.u.con = mpl_internal_constraint_statement(mpl);
    }
    else if (mpl_internal_is_reserved(mpl))
        mpl_internal_error(mpl, "invalid use of reserved keyword " + mpl.image);
    else
        mpl_internal_error(mpl, "syntax error in model section");
    return stmt;
}

function mpl_internal_model_section(mpl){
    var stmt, last_stmt;
    xassert(mpl.model == null);
    last_stmt = null;
    while (!(mpl.token == T_EOF || mpl_internal_is_keyword(mpl, "data") ||
        mpl_internal_is_keyword(mpl, "end")))
    {  /* parse statement */
        stmt = mpl_internal_simple_statement(mpl, 0);
        /* and append it to the end of the statement list */
        if (last_stmt == null)
            mpl.model = stmt;
        else
            last_stmt.next = stmt;
        last_stmt = stmt;
    }
}

