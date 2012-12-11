importScripts('glpk.min.js');

var lp;

self.addEventListener('message', function(e) {
    var log = glp_print_func = function(value){
        self.postMessage({action: 'log', message: value});
    };



    var obj = e.data;
    switch (obj.action){
        case 'load':
            lp = glp_create_prob();
            glp_read_lp_from_string(lp, null, obj.data);
            var smcp = {};
            glp_init_smcp(smcp);
            smcp.presolve = GLP_ON;
            glp_simplex(lp, smcp);

            var result = {}, objective, i;
            if (obj.mip){
                glp_intopt(lp, null);
                objective = glp_mip_obj_val(lp);
                for(i = 1; i <= glp_get_num_cols(lp); i++){
                    result[glp_get_col_name(lp, i)] = glp_mip_col_val(lp, i);
                }
            } else {
                objective = glp_get_obj_val(lp);
                for(i = 1; i <= glp_get_num_cols(lp); i++){
                    result[glp_get_col_name(lp, i)] = glp_get_col_prim (lp, i);
                }
            }

            glp_delete_prob(lp);
            lp = null;
            self.postMessage({action: 'done', result: result, objective: objective});
            break;
    }
}, false);