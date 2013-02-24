/* glpmpl06.c */

/*****************************************
 Driver API
 *****************************************/

var MPL_DRIVERS = {};

function mpl_tab_drv_open(mpl, mode){
    var dca = mpl.dca;
    xassert(dca.id == 0);
    xassert(dca.link == null);
    xassert(dca.na >= 1);

    var Driver = MPL_DRIVERS[dca.arg[1]];
    if (Driver)
        dca.link = new Driver(dca, mode, mpl.tablecb);
    else
        mpl_internal_error(mpl, "Invalid table driver '" + dca.arg[1] + "'");
    if (dca.link == null)
        mpl_internal_error(mpl, "error on opening table " + mpl.stmt.u.tab.name);
}

function mpl_tab_drv_read(mpl){
    var dca = mpl.dca;
    var ret = dca.link["readRecord"](dca);
    if (ret > 0)
        mpl_internal_error(mpl, "error on reading data from table " + mpl.stmt.u.tab.name);
    return ret;
}

function mpl_tab_drv_write(mpl){
    var dca = mpl.dca;
    var ret = dca.link["writeRecord"](dca);
    if (ret)
        mpl_internal_error(mpl, "error on writing data to table " + mpl.stmt.u.tab.name);
}

function mpl_tab_drv_flush(mpl){
    var dca = mpl.dca;
    dca.link["flush"](dca);
}

var mpl_tab_drv_register = exports["mpl_tab_drv_register"] = function (name, driver){
    MPL_DRIVERS[name] = driver;
};

/*****************************************
    CSV Driver
 *****************************************/

function CSVDriver(dca, mode, tablecb){
    /* open csv data file */
    /* create control structure */
    this.mode = mode;
    this.fname = null;
    this.count = 0;
    this.c = '\n';
    this.what = 0;
    this.field = '';
    this.nf = 0;
    this.ref = [];
    this.tablecb = tablecb;

    this.CSV_EOF   = 0;  /* end-of-file */
    this.CSV_EOR   = 1;  /* end-of-record */
    this.CSV_NUM   = 2;  /* floating-point number */
    this.CSV_STR   = 3;  /* character string */


    /* try to open the csv data file */
    if (mpl_tab_num_args(dca) < 2)
        xerror("csv_driver: file name not specified\n");
    this.fname = mpl_tab_get_arg(dca, 2);
    var k;
    if (mode == 'R')
    {   /* open the file for reading */

        if (tablecb){
            this.data = tablecb(dca.arg, mode);
            this.cursor = 0;
        } else
            xerror("csv_driver: unable to open " + this.fname);
        this.nskip = 0;
        /* skip fake new-line */
        this.readField();
        xassert(this.what == this.CSV_EOR);
        /* read field names */
        xassert(this.nf == 0);
        for (;;)
        {  this.readField();
            if (this.what == this.CSV_EOR)
                break;
            if (this.what != this.CSV_STR)
                xerror(this.fname + ":" + this.count + ": invalid field name\n");
            this.nf++;
            /* find corresponding field in the table statement */
            for (k = mpl_tab_num_flds(dca); k >= 1; k--)
            {  if (mpl_tab_get_name(dca, k) == this.field)
                break;
            }
            this.ref[this.nf] = k;
        }
        /* find dummy RECNO field in the table statement */
        for (k = mpl_tab_num_flds(dca); k >= 1; k--)
            if (mpl_tab_get_name(dca, k) == "RECNO") break;
        this.ref[0] = k;
    }
    else if (mode == 'W')
    {   this.data = '';
        /* write field names */
        var nf = mpl_tab_num_flds(dca);
        for (k = 1; k <= nf; k++)
            this.data += mpl_tab_get_name(dca, k) + ((k < nf)?',':'\n');
        this.count++;
    }
    else
        xassert(mode != mode);
}

CSVDriver.prototype.readField = function(){
    /* read field from csv data file */
    /* check for end of file */
    if (this.c == XEOF)
    {   this.what = this.CSV_EOF;
        this.field = "EOF";
        return;
    }
    /* check for end of record */
    if (this.c == '\n')
    {   this.what = this.CSV_EOR;
        this.field = "EOR";
        this.readChar();
        if (this.c == ',')
            xerror(this.fname + ":" + this.count + ": empty field not allowed\n");
        if (this.c == '\n')
            xerror(this.fname + ":" + this.count + ": empty record not allowed\n");

        /* skip comment records; may appear only before the very first
         record containing field names */
        if (this.c == '#' && this.count == 1)
        {  while (this.c == '#')
        {  while (this.c != '\n')
            this.readChar();
            this.readChar();
            this.nskip++;
        }
        }

        return;
    }
    /* skip comma before next field */
    if (this.c == ',')
        this.readChar();
    /* read field */
    if (this.c == '\'' || this.c == '"')
    {  /* read a field enclosed in quotes */
        var quote = this.c;
        this.field = '';
        this.what = this.CSV_STR;
        /* skip opening quote */
        this.readChar();
        /* read field characters within quotes */
        for (;;)
        {  /* check for closing quote and read it */
            if (this.c == quote)
            {  this.readChar();
                if (this.c == quote){

                }
                else if (this.c == ',' || this.c == '\n')
                    break;
                else
                    xerror(this.fname + ":" + this.count + ": invalid field");
            }
            /* add the current character to the field */
            this.field += this.c;
            /* read the next character */
            this.readChar();
        }
        /* the field has been read */
        if (this.field.length == 0)
            xerror(this.fname + ":" + this.count + ": empty field not allowed");
    }
    else
    {  /* read a field not enclosed in quotes */
        this.field = '';
        var temp;
        this.what = this.CSV_NUM;
        while (!(this.c == ',' || this.c == '\n'))
        {  /* quotes within the field are not allowed */
            if (this.c == '\'' || this.c == '"')
                xerror(this.fname + ":" + this.count + ": invalid use of single or double quote within field");
            /* add the current character to the field */
            this.field += this.c;
            /* read the next character */
            this.readChar();
        }
        /* the field has been read */
        if (this.field.length == 0)
            xerror(this.fname + ":" + this.count + ": empty field not allowed");
        /* check the field type */
        if (str2num(this.field, function(v){temp=v})) this.what = this.CSV_STR;
    }
};

CSVDriver.prototype.readChar = function (){
    /* read character from csv data file */
    var c;
    xassert(this.c != XEOF);
    if (this.c == '\n') this.count++;
    while (true){
        if (this.cursor < this.data.length)
            c = this.data[this.cursor++];
        else
            c = XEOF;
        if (c == '\r')
            continue;
        else if (c == '\n'){

        }
        else if (iscntrl(c))
        {   xerror(this.fname +":" + this.count +": invalid control character " + c);
        }
        break;
    }
    this.c = c;
};

CSVDriver.prototype["readRecord"] = function(dca){
    /* read next record from csv data file */
    var k, ret = 0;
    xassert(this.mode == 'R');

    /* read dummy RECNO field */
    if (this.ref[0] > 0)
        mpl_tab_set_num(dca, this.ref[0], this.count-this.nskip-1);
    /* read fields */
    for (k = 1; k <= this.nf; k++)
    {  this.readField();
        if (this.what == this.CSV_EOF)
        {  /* end-of-file reached */
            xassert(k == 1);
            return XEOF;
        }
        else if (this.what == this.CSV_EOR)
        {  /* end-of-record reached */
            var lack = this.nf - k + 1;
            if (lack == 1)
                xerror(this.fname + ":" + this.count + ": one field missing");
            else
                xerror(this.fname + ":" + this.count + ": " + lack + " fields missing");
        }
        else if (this.what == this.CSV_NUM)
        {  /* floating-point number */
            if (this.ref[k] > 0)
            {   var num = 0;
                xassert(str2num(this.field, function(v){num=v}) == 0);
                mpl_tab_set_num(dca, this.ref[k], num);
            }
        }
        else if (this.what == this.CSV_STR)
        {  /* character string */
            if (this.ref[k] > 0)
                mpl_tab_set_str(dca, this.ref[k], this.field);
        }
        else
            xassert(this != this);
    }
    /* now there must be NL */
    this.readField();
    xassert(this.what != this.CSV_EOF);
    if (this.what != this.CSV_EOR)
        xerror(this.fname + ":" + this.count + ": too many fields");
    return ret;
};

CSVDriver.prototype["writeRecord"] = function(dca){
    /* write next record to csv data file */
    var k, nf, ret = 0;
    var c, n;
    xassert(this.mode == 'W');
    nf = mpl_tab_num_flds(dca);
    for (k = 1; k <= nf; k++)
    {  switch (mpl_tab_get_type(dca, k))
    {  case 'N':
            this.data += mpl_tab_get_num(dca, k);
            break;
        case 'S':
            this.data += '"';
            for (c = mpl_tab_get_str(dca, k), n = 0; c.length > n; n++){
                if (c[n] == '"')
                    this.data += '""';
                else
                    this.data += c[n];
            }
            this.data += '"';
            break;
        default:
            xassert(dca != dca);
    }
        this.data += (k < nf)?',':'\n';
    }
    this.count++;
    return ret;
};

CSVDriver.prototype["flush"] = function(dca){
    this.tablecb(dca.arg, this.mode, this.data);
};

mpl_tab_drv_register("CSV", CSVDriver);

/*****************************************
 JSON Driver
 *****************************************/

function JSONDriver(dca, mode, tablecb){
    this.mode = mode;
    this.fname = null;

    if (mpl_tab_num_args(dca) < 2)
        xerror("json driver: file name not specified");
    this.fname = mpl_tab_get_arg(dca, 2);
    var k;
    if (mode == 'R')
    {
        this.ref = {};
        if (tablecb){
            this.data = tablecb(dca.arg, mode);
            if (typeof this.data == 'string')
                this.data = JSON.parse(this.data);
            this.cursor = 1;
        } else
            xerror("json driver: unable to open " + this.fname);

        for (var i = 0, meta = this.data[0]; i < meta.length; i++)
            this.ref[meta[i]] = i;
    }
    else if (mode == 'W')
    {   this.tablecb = tablecb;
        var names = [];
        this.data = [names];
        var nf = mpl_tab_num_flds(dca);
        for (k = 1; k <= nf; k++)
            names.push(mpl_tab_get_name(dca, k));
    }
    else
        xassert(mode != mode);
}

JSONDriver.prototype["writeRecord"] = function(dca){
    var k;
    xassert(this.mode == 'W');
    var nf = mpl_tab_num_flds(dca);
    var line = [];
    for (k = 1; k <= nf; k++){
        switch (mpl_tab_get_type(dca, k)){
            case 'N':
                line.push(mpl_tab_get_num(dca, k));
                break;
            case 'S':
                line.push(mpl_tab_get_str(dca, k));
                break;
            default:
                xassert(dca != dca);
        }
    }
    this.data.push(line);
    return 0;
};

JSONDriver.prototype["readRecord"] = function(dca){
    /* read next record from csv data file */
    var ret = 0;
    xassert(this.mode == 'R');

    /* read fields */
    var line = this.data[this.cursor++];
    if (line == null) return XEOF;

    for (var k = 1; k <= mpl_tab_num_flds(dca); k++){
        var index = this.ref[mpl_tab_get_name(dca, k)];
        if (index != null){
            var value = line[index];
            switch (typeof value){
                case 'number':
                    mpl_tab_set_num(dca, k, value);
                    break;
                case 'boolean':
                    mpl_tab_set_num(dca, k, Number(value));
                    break;
                case 'string':
                    mpl_tab_set_str(dca, k, value);
                    break;
                default:
                    xerror('Unexpected data type ' + value + " in " + this.fname);
            }
        }
    }
    return 0;
};

JSONDriver.prototype["flush"] = function(dca){
    this.tablecb(dca.arg, this.mode, this.data);
};

mpl_tab_drv_register("JSON", JSONDriver);