var glp_set_row_stat = exports["glp_set_row_stat"] = function(lp, i, stat){
    var row;
    if (!(1 <= i && i <= lp.m))
        xerror("glp_set_row_stat: i = " + i + "; row number out of range");
    if (!(stat == GLP_BS || stat == GLP_NL || stat == GLP_NU || stat == GLP_NF || stat == GLP_NS))
        xerror("glp_set_row_stat: i = " + i + "; stat = " + stat + "; invalid status");
    row = lp.row[i];
    if (stat != GLP_BS){
        switch (row.type){
            case GLP_FR: stat = GLP_NF; break;
            case GLP_LO: stat = GLP_NL; break;
            case GLP_UP: stat = GLP_NU; break;
            case GLP_DB: if (stat != GLP_NU) stat = GLP_NL; break;
            case GLP_FX: stat = GLP_NS; break;
            default: xassert(row != row);
        }
    }
    if (row.stat == GLP_BS && stat != GLP_BS || row.stat != GLP_BS && stat == GLP_BS){
        /* invalidate the basis factorization */
        lp.valid = 0;
    }
    row.stat = stat;
};

var glp_set_col_stat = exports["glp_set_col_stat"] = function(lp, j, stat){
    var col;
    if (!(1 <= j && j <= lp.n))
        xerror("glp_set_col_stat: j = " + j + "; column number out of range");
    if (!(stat == GLP_BS || stat == GLP_NL || stat == GLP_NU || stat == GLP_NF || stat == GLP_NS))
        xerror("glp_set_col_stat: j = " + j + "; stat = " + stat + "; invalid status");
    col = lp.col[j];
    if (stat != GLP_BS){
        switch (col.type){
            case GLP_FR: stat = GLP_NF; break;
            case GLP_LO: stat = GLP_NL; break;
            case GLP_UP: stat = GLP_NU; break;
            case GLP_DB: if (stat != GLP_NU) stat = GLP_NL; break;
            case GLP_FX: stat = GLP_NS; break;
            default: xassert(col != col);
        }
    }
    if (col.stat == GLP_BS && stat != GLP_BS || col.stat != GLP_BS && stat == GLP_BS){
        /* invalidate the basis factorization */
        lp.valid = 0;
    }
    col.stat = stat;
};

var glp_std_basis = exports["glp_std_basis"] = function(lp){
    var i, j;
    /* make all auxiliary variables basic */
    for (i = 1; i <= lp.m; i++)
        glp_set_row_stat(lp, i, GLP_BS);
    /* make all structural variables non-basic */
    for (j = 1; j <= lp.n; j++){
        var col = lp.col[j];
        if (col.type == GLP_DB && Math.abs(col.lb) > Math.abs(col.ub))
            glp_set_col_stat(lp, j, GLP_NU);
        else
            glp_set_col_stat(lp, j, GLP_NL);
    }
};

