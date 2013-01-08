importScripts('glpk.min.js');

var lp;

self.addEventListener('message', function(e) {
    function log(value){
        self.postMessage({action: 'log', message: value});
    }

    glp_set_print_func(log);

    var obj = e.data;
    switch (obj.action){
        case 'load':
            var result = {}, objective, i;
            try {
                lp = glp_create_prob();
                glp_read_lp_from_string(lp, null, obj.data);
            
                glp_scale_prob(lp, GLP_SF_AUTO);
            
                var smcp = new SMCP({presolve: GLP_ON});
                glp_simplex(lp, smcp);

                if (obj.mip){
                    glp_intopt(lp);
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

                lp = null;
            
            } catch(err) {
                log(err.message);
            } finally {
                self.postMessage({action: 'done', result: result, objective: objective});
            }            
            break;
    }
}, false);
