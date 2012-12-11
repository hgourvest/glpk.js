require("repl").start("");

var glpk = require('../dist/glpk.js');
var fs = require('fs');


function saveToFile(lp, filename){
    var fd = fs.openSync(filename, 'w');
    if (fd){
        glpk.glp_write_lp(lp, null,
            function(str){
                var buf = new Buffer(str + '\n');
                fs.writeSync(fd, buf, 0, buf.length, null);
            }
        );
        fs.closeSync(fd);
    }
}

function readFromFile(lp, filename){
    var str = fs.readFileSync(filename).toString();
    var pos = 0;
    glpk.glp_read_lp(lp, null,
        function(){
            if (pos < str.length){
                return str[pos++];
            } else
                return -1;
        }
    )
}


test1 = function (){
    var lp = glpk.glp_create_prob();
    readFromFile(lp, __dirname + "/gap.lpt");
    var smcp = {};
    glpk.glp_init_smcp(smcp);
    smcp.presolve = glpk.GLP_ON;
    glpk.glp_simplex(lp, smcp);

    var iocp = {};
    glpk.glp_init_iocp(iocp);
    iocp.presolve = glpk.GLP_ON;


    glpk.glp_intopt(lp, iocp);
    console.log("obj: " + glpk.glp_mip_obj_val(lp));
    for( var i = 1; i <= glpk.glp_get_num_cols(lp); i++){
        console.log(glpk.glp_get_col_name(lp, i)  + " = " + glpk.glp_mip_col_val(lp, i));
    }
    glpk.glp_delete_prob(lp);
}

test1();