var glp_create_index = exports["glp_create_index"] = function(lp){
    var row;
    var col;
    var i, j;
    /* create row name index */
    if (lp.r_tree == null){
        lp.r_tree = {};
        for (i = 1; i <= lp.m; i++){
            row = lp.row[i];
            if (row.name != null){
                lp.r_tree[row.name] = row;
            }
        }
    }
    /* create column name index */
    if (lp.c_tree == null)
    {  lp.c_tree = {};
        for (j = 1; j <= lp.n; j++){
            col = lp.col[j];
            if (col.name != null){
                lp.c_tree[col.name] = col;
            }
        }
    }
};

var glp_find_row = exports["glp_find_row"] = function(lp, name){
    var i = 0;
    if (lp.r_tree == null)
        xerror("glp_find_row: row name index does not exist");
    var row = lp.r_tree[name];
    if (row) i = row.i;
    return i;
};

var glp_find_col = exports["glp_find_col"] = function(lp, name){
    var j = 0;
    if (lp.c_tree == null)
        xerror("glp_find_col: column name index does not exist");
    var col = lp.c_tree[name];
    if (col) j = col.j;
    return j;
};

var glp_delete_index = exports["glp_delete_index"] = function(lp){
    lp.r_tree = null;
    lp.r_tree = null;
};

