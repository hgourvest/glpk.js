var glp_set_rii = exports["glp_set_rii"] = function(lp, i, rii){
    if (!(1 <= i && i <= lp.m))
        xerror("glp_set_rii: i = " + i + "; row number out of range");
    if (rii <= 0.0)
        xerror("glp_set_rii: i = " + i + "; rii = " + rii + "; invalid scale factor");
    if (lp.valid && lp.row[i].rii != rii){
        for (var aij = lp.row[i].ptr; aij != null; aij = aij.r_next){
            if (aij.col.stat == GLP_BS){
                /* invalidate the basis factorization */
                lp.valid = 0;
                break;
            }
        }
    }
    lp.row[i].rii = rii;
};

var glp_set_sjj = exports["glp_set_sjj"] = function(lp, j, sjj){
    if (!(1 <= j && j <= lp.n))
        xerror("glp_set_sjj: j = " + j + "; column number out of range");
    if (sjj <= 0.0)
        xerror("glp_set_sjj: j = " + j + "; sjj = " + sjj + "; invalid scale factor");
    if (lp.valid && lp.col[j].sjj != sjj && lp.col[j].stat == GLP_BS){
        /* invalidate the basis factorization */
        lp.valid = 0;
    }
    lp.col[j].sjj = sjj;
};

var glp_get_rii = exports["glp_get_rii"] = function(lp, i){
    if (!(1 <= i && i <= lp.m))
        xerror("glp_get_rii: i = " + i + "; row number out of range");
    return lp.row[i].rii;
};

var glp_get_sjj = exports["glp_get_sjj"] = function(lp, j){
    if (!(1 <= j && j <= lp.n))
        xerror("glp_get_sjj: j = " + j + "; column number out of range");
    return lp.col[j].sjj;
};

var glp_unscale_prob = exports["glp_unscale_prob"] = function(lp){
    var m = glp_get_num_rows(lp);
    var n = glp_get_num_cols(lp);
    var i, j;
    for (i = 1; i <= m; i++) glp_set_rii(lp, i, 1.0);
    for (j = 1; j <= n; j++) glp_set_sjj(lp, j, 1.0);
};

