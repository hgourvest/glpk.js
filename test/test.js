

var glpk = require('../dist/glpk.min.js');
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

function readCplexFromFile(lp, filename){
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

function readMathprogFromFile(tran, filename, skip){
    var str = fs.readFileSync(filename).toString();
    var pos = 0;
    glpk.glp_mpl_read_model(tran, null,
        function(){
            if (pos < str.length){
                //console.log(str[pos+1]);
                return str[pos++];
            } else
                return -1;
        },
        skip
    )
}


cplex = function(file){
    var lp = glpk.glp_create_prob();
    readCplexFromFile(lp, __dirname + "/" + file);
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
};

mathprog = function (file){
    var lp = glpk.glp_create_prob();
    var tran = glpk.glp_mpl_alloc_wksp();
    glpk._glp_mpl_init_rand(tran, 1);
    readMathprogFromFile(tran, __dirname + "/" + file, false);

    glpk.glp_mpl_generate(tran, null, console.log);
    /* build the problem instance from the model */
    glpk.glp_mpl_build_prob(tran, lp);

    //saveToFile(lp, __dirname + '/todd.lpt');

    glpk.glp_scale_prob(lp);

    var smcp = {};
    glpk.glp_init_smcp(smcp);
    smcp.presolve = glpk.GLP_ON;
    glpk.glp_simplex(lp, smcp);

    var iocp = {};
    glpk.glp_init_iocp(iocp);
    iocp.presolve = glpk.GLP_ON;
    iocp.cb_func = function(tree){
        if (tree.reason == glpk.GLP_IBINGO){
           var objective = glpk.glp_mip_obj_val(tree.mip);
          // console.log("@@@" + objective);
       }
    };
    glpk.glp_intopt(lp, iocp);
    glpk.glp_mpl_postsolve(tran, lp, glpk.GLP_MIP);
    console.log("obj: " + glpk.glp_mip_obj_val(lp));
    /*for( var i = 1; i <= glpk.glp_get_num_cols(lp); i++){
        console.log(glpk.glp_get_col_name(lp, i)  + " = " + glpk.glp_mip_col_val(lp, i));
    }*/

};

require("repl").start("");
glpk.glp_set_print_func(console.log);
mathprog("todd.mod");
//cplex("todd.lpt");