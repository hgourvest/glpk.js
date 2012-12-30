
function npp_clean_prob(npp){
    /* perform initial LP/MIP processing */
    var row, next_row;
    var col, next_col;
    var ret;
    xassert(npp == npp);
    /* process rows which originally are free */
    for (row = npp.r_head; row != null; row = next_row)
    {  next_row = row.next;
        if (row.lb == -DBL_MAX && row.ub == +DBL_MAX)
        {  /* process free row */
            if (GLP_DEBUG){xprintf("1")}
            npp_free_row(npp, row);
            /* row was deleted */
        }
    }
    /* process rows which originally are double-sided inequalities */
    for (row = npp.r_head; row != null; row = next_row)
    {  next_row = row.next;
        if (row.lb != -DBL_MAX && row.ub != +DBL_MAX &&
            row.lb < row.ub)
        {  ret = npp_make_equality(npp, row);
            if (ret == 0){

            } else
            if (ret == 1)
            {  /* row was replaced by equality constraint */
                if (GLP_DEBUG){xprintf("2")}
            }
            else
                xassert(ret != ret);
        }
    }
    /* process columns which are originally fixed */
    for (col = npp.c_head; col != null; col = next_col)
    {  next_col = col.next;
        if (col.lb == col.ub)
        {  /* process fixed column */
            if (GLP_DEBUG){xprintf("3")}
            npp_fixed_col(npp, col);
            /* column was deleted */
        }
    }
    /* process columns which are originally double-bounded */
    for (col = npp.c_head; col != null; col = next_col)
    {  next_col = col.next;
        if (col.lb != -DBL_MAX && col.ub != +DBL_MAX &&
            col.lb < col.ub)
        {  ret = npp_make_fixed(npp, col);
            if (ret == 0){

            }
            else if (ret == 1)
            {  /* column was replaced by fixed column; process it */
                if (GLP_DEBUG){xprintf("4")}
                npp_fixed_col(npp, col);
                /* column was deleted */
            }
        }
    }
}

function npp_process_row(npp, row, hard){
    /* perform basic row processing */
    var col;
    var aij, next_aij, aaa;
    var ret;
    /* row must not be free */
    xassert(!(row.lb == -DBL_MAX && row.ub == +DBL_MAX));
    /* start processing row */
    if (row.ptr == null)
    {  /* empty row */
        ret = npp_empty_row(npp, row);
        if (ret == 0)
        {  /* row was deleted */
            if (GLP_DEBUG){xprintf("A")}
            return 0;
        }
        else if (ret == 1)
        {  /* primal infeasibility */
            return GLP_ENOPFS;
        }
        else
            xassert(ret != ret);
    }
    if (row.ptr.r_next == null)
    {  /* row singleton */
        col = row.ptr.col;
        if (row.lb == row.ub)
        {  /* equality constraint */
            ret = npp_eq_singlet(npp, row);
            if (ret == 0)
            {  /* column was fixed, row was deleted */
                if (GLP_DEBUG){xprintf("B")}
                /* activate rows affected by column */
                for (aij = col.ptr; aij != null; aij = aij.c_next)
                    npp_activate_row(npp, aij.row);
                /* process fixed column */
                npp_fixed_col(npp, col);
                /* column was deleted */
                return 0;
            }
            else if (ret == 1 || ret == 2)
            {  /* primal/integer infeasibility */
                return GLP_ENOPFS;
            }
            else
                xassert(ret != ret);
        }
        else
        {  /* inequality constraint */
            ret = npp_ineq_singlet(npp, row);
            if (0 <= ret && ret <= 3)
            {  /* row was deleted */
                if (GLP_DEBUG){xprintf("C")}
                /* activate column, since its length was changed due to
                 row deletion */
                npp_activate_col(npp, col);
                if (ret >= 2)
                {  /* column bounds changed significantly or column was
                 fixed */
                    /* activate rows affected by column */
                    for (aij = col.ptr; aij != null; aij = aij.c_next)
                        npp_activate_row(npp, aij.row);
                }
                if (ret == 3)
                {  /* column was fixed; process it */
                    if (GLP_DEBUG){xprintf("D")}
                    npp_fixed_col(npp, col);
                    /* column was deleted */
                }
                return 0;
            }
            else if (ret == 4)
            {  /* primal infeasibility */
                return GLP_ENOPFS;
            }
            else
                xassert(ret != ret);
        }
    }
    /* general row analysis */
    ret = npp_analyze_row(npp, row);
    xassert(0x00 <= ret && ret <= 0xFF);
    if (ret == 0x33)
    {  /* row bounds are inconsistent with column bounds */
        return GLP_ENOPFS;
    }
    if ((ret & 0x0F) == 0x00)
    {  /* row lower bound does not exist or redundant */
        if (row.lb != -DBL_MAX)
        {  /* remove redundant row lower bound */
            if (GLP_DEBUG){xprintf("F")}
            npp_inactive_bound(npp, row, 0);
        }
    }
    else if ((ret & 0x0F) == 0x01)
    {  /* row lower bound can be active */
        /* see below */
    }
    else if ((ret & 0x0F) == 0x02)
    {  /* row lower bound is a forcing bound */
        if (GLP_DEBUG){xprintf("G")}
        /* process forcing row */
        if (npp_forcing_row(npp, row, 0) == 0)
            return fixup();
    }
    else
        xassert(ret != ret);
    if ((ret & 0xF0) == 0x00)
    {  /* row upper bound does not exist or redundant */
        if (row.ub != +DBL_MAX)
        {  /* remove redundant row upper bound */
            if (GLP_DEBUG){xprintf("I")}
            npp_inactive_bound(npp, row, 1);
        }
    }
    else if ((ret & 0xF0) == 0x10)
    {  /* row upper bound can be active */
        /* see below */
    }
    else if ((ret & 0xF0) == 0x20)
    {  /* row upper bound is a forcing bound */
        if (GLP_DEBUG) {xprintf("J")}
        /* process forcing row */
        if (npp_forcing_row(npp, row, 1) == 0) return fixup();
    }
    else
        xassert(ret != ret);
    if (row.lb == -DBL_MAX && row.ub == +DBL_MAX)
    {  /* row became free due to redundant bounds removal */
        if (GLP_DEBUG) {xprintf("K")}
        /* activate its columns, since their length will change due
         to row deletion */
        for (aij = row.ptr; aij != null; aij = aij.r_next)
            npp_activate_col(npp, aij.col);
        /* process free row */
        npp_free_row(npp, row);
        /* row was deleted */
        return 0;
    }
    /* row lower and/or upper bounds can be active */
    if (npp.sol == GLP_MIP && hard)
    {  /* improve current column bounds (optional) */
        if (npp_improve_bounds(npp, row, 1) < 0)
            return GLP_ENOPFS;
    }
    function fixup()   {  /* columns were fixed, row was made free */
        for (aij = row.ptr; aij != null; aij = next_aij)
        {  /* process column fixed by forcing row */
            if (GLP_DEBUG){xprintf("H")}
            col = aij.col;
            next_aij = aij.r_next;
            /* activate rows affected by column */
            for (aaa = col.ptr; aaa != null; aaa = aaa.c_next)
                npp_activate_row(npp, aaa.row);
            /* process fixed column */
            npp_fixed_col(npp, col);
            /* column was deleted */
        }
        /* process free row (which now is empty due to deletion of
         all its columns) */
        npp_free_row(npp, row);
        /* row was deleted */
        return 0;
    }
    return 0;
}

function npp_improve_bounds(npp, row, flag){
    /* improve current column bounds */
    var col;
    var aij, next_aij, aaa;
    var kase, ret, count = 0;
    var lb, ub;
    xassert(npp.sol == GLP_MIP);
    /* row must not be free */
    xassert(!(row.lb == -DBL_MAX && row.ub == +DBL_MAX));
    /* determine implied column bounds */
    npp_implied_bounds(npp, row);
    /* and use these bounds to strengthen current column bounds */
    for (aij = row.ptr; aij != null; aij = next_aij)
    {  col = aij.col;
        next_aij = aij.r_next;
        for (kase = 0; kase <= 1; kase++)
        {  /* save current column bounds */
            lb = col.lb; ub = col.ub;
            if (kase == 0)
            {  /* process implied column lower bound */
                if (col.ll.ll == -DBL_MAX) continue;
                ret = npp_implied_lower(npp, col, col.ll.ll);
            }
            else
            {  /* process implied column upper bound */
                if (col.uu.uu == +DBL_MAX) continue;
                ret = npp_implied_upper(npp, col, col.uu.uu);
            }
            if (ret == 0 || ret == 1)
            {  /* current column bounds did not change or changed, but
             not significantly; restore current column bounds */
                col.lb = lb; col.ub = ub;
            }
            else if (ret == 2 || ret == 3)
            {  /* current column bounds changed significantly or column
             was fixed */
                if (GLP_DEBUG){xprintf("L")}
                count++;
                /* activate other rows affected by column, if required */
                if (flag)
                {  for (aaa = col.ptr; aaa != null; aaa = aaa.c_next)
                {  if (aaa.row != row)
                    npp_activate_row(npp, aaa.row);
                }
                }
                if (ret == 3)
                {  /* process fixed column */
                    if (GLP_DEBUG){xprintf("M")}
                    npp_fixed_col(npp, col);
                    /* column was deleted */
                    break; /* for kase */
                }
            }
            else if (ret == 4)
            {  /* primal/integer infeasibility */
                return -1;
            }
            else
                xassert(ret != ret);
        }
    }
    return count;
}

function npp_process_col(npp, col)
{     /* perform basic column processing */
    var row;
    var aij;
    var ret;
    /* column must not be fixed */
    xassert(col.lb < col.ub);
    /* start processing column */
    if (col.ptr == null)
    {  /* empty column */
        ret = npp_empty_col(npp, col);
        if (ret == 0)
        {  /* column was fixed and deleted */
            if (GLP_DEBUG){xprintf("N")}
            return 0;
        }
        else if (ret == 1)
        {  /* dual infeasibility */
            return GLP_ENODFS;
        }
        else
            xassert(ret != ret);
    }
    if (col.ptr.c_next == null)
    {  /* column singleton */
        row = col.ptr.row;


        function slack(){  /* implied slack variable */
            if (GLP_DEBUG) {xprintf("O")}
            npp_implied_slack(npp, col);
            /* column was deleted */
            if (row.lb == -DBL_MAX && row.ub == +DBL_MAX)
            {  /* row became free due to implied slack variable */
                if (GLP_DEBUG){xprintf("P")}
                /* activate columns affected by row */
                for (aij = row.ptr; aij != null; aij = aij.r_next)
                    npp_activate_col(npp, aij.col);
                /* process free row */
                npp_free_row(npp, row);
                /* row was deleted */
            }
            else
            {  /* row became inequality constraint; activate it
             since its length changed due to column deletion */
                npp_activate_row(npp, row);
            }
            return 0;
        }

        if (row.lb == row.ub)
        {  /* equality constraint */
            if (!col.is_int)
                return slack();
        }
        else
        {  /* inequality constraint */
            if (!col.is_int)
            {  ret = npp_implied_free(npp, col);
                if (ret == 0)
                {  /* implied free variable */
                    if (GLP_DEBUG){xprintf("Q")}
                    /* column bounds were removed, row was replaced by
                     equality constraint */
                    return slack();
                }
                else if (ret == 1)
                {  /* column is not implied free variable, because its
                 lower and/or upper bounds can be active */
                }
                else if (ret == 2)
                {  /* dual infeasibility */
                    return GLP_ENODFS;
                }
            }
        }
    }
    /* column still exists */
    return 0;
}

function npp_process_prob(npp, hard){
    /* perform basic LP/MIP processing */
    var row;
    var col;
    var processing, ret;
    /* perform initial LP/MIP processing */
    npp_clean_prob(npp);
    /* activate all remaining rows and columns */
    for (row = npp.r_head; row != null; row = row.next)
        row.temp = 1;
    for (col = npp.c_head; col != null; col = col.next)
        col.temp = 1;
    /* main processing loop */
    processing = 1;
    while (processing)
    {  processing = 0;
        /* process all active rows */
        for (;;)
        {  row = npp.r_head;
            if (row == null || !row.temp) break;
            npp_deactivate_row(npp, row);
            ret = npp_process_row(npp, row, hard);
            if (ret != 0) return done();
            processing = 1;
        }
        /* process all active columns */
        for (;;)
        {  col = npp.c_head;
            if (col == null || !col.temp) break;
            npp_deactivate_col(npp, col);
            ret = npp_process_col(npp, col);
            if (ret != 0) return done();
            processing = 1;
        }
    }
    if (npp.sol == GLP_MIP && !hard)
    {  /* improve current column bounds (optional) */
        for (row = npp.r_head; row != null; row = row.next)
        {  if (npp_improve_bounds(npp, row, 0) < 0)
        {  ret = GLP_ENOPFS;
            return done();
        }
        }
    }
    /* all seems ok */
    ret = 0;
    function done(){
        xassert(ret == 0 || ret == GLP_ENOPFS || ret == GLP_ENODFS);
        if (GLP_DEBUG){xprintf("")}
        return ret;
    }
    return done();
}

function npp_simplex(npp, parm){
    /* process LP prior to applying primal/dual simplex method */
    xassert(npp.sol == GLP_SOL);
    xassert(parm == parm);
    return npp_process_prob(npp, 0);
}

function npp_integer(npp, parm){
    /* process MIP prior to applying branch-and-bound method */
    var row, prev_row;
    var col;
    var aij;
    var count, ret;
    xassert(npp.sol == GLP_MIP);
    xassert(parm == parm);
    /*==============================================================*/
    /* perform basic MIP processing */
    ret = npp_process_prob(npp, 1);
    if (ret != 0) return ret;
    /*==============================================================*/
    /* binarize problem, if required */
    if (parm.binarize)
        npp_binarize_prob(npp);
    /*==============================================================*/
    /* identify hidden packing inequalities */
    count = 0;
    /* new rows will be added to the end of the row list, so we go
     from the end to beginning of the row list */
    for (row = npp.r_tail; row != null; row = prev_row)
    {  prev_row = row.prev;
        /* skip free row */
        if (row.lb == -DBL_MAX && row.ub == +DBL_MAX) continue;
        /* skip equality constraint */
        if (row.lb == row.ub) continue;
        /* skip row having less than two variables */
        if (row.ptr == null || row.ptr.r_next == null) continue;
        /* skip row having non-binary variables */
        for (aij = row.ptr; aij != null; aij = aij.r_next)
        {  col = aij.col;
            if (!(col.is_int && col.lb == 0.0 && col.ub == 1.0))
                break;
        }
        if (aij != null) continue;
        count += npp_hidden_packing(npp, row);
    }
    if (count > 0)
        xprintf(count + " hidden packing inequaliti(es) were detected");
    /*==============================================================*/
    /* identify hidden covering inequalities */
    count = 0;
    /* new rows will be added to the end of the row list, so we go
     from the end to beginning of the row list */
    for (row = npp.r_tail; row != null; row = prev_row)
    {  prev_row = row.prev;
        /* skip free row */
        if (row.lb == -DBL_MAX && row.ub == +DBL_MAX) continue;
        /* skip equality constraint */
        if (row.lb == row.ub) continue;
        /* skip row having less than three variables */
        if (row.ptr == null || row.ptr.r_next == null ||
            row.ptr.r_next.r_next == null) continue;
        /* skip row having non-binary variables */
        for (aij = row.ptr; aij != null; aij = aij.r_next)
        {  col = aij.col;
            if (!(col.is_int && col.lb == 0.0 && col.ub == 1.0))
                break;
        }
        if (aij != null) continue;
        count += npp_hidden_covering(npp, row);
    }
    if (count > 0)
        xprintf(count + " hidden covering inequaliti(es) were detected");
    /*==============================================================*/
    /* reduce inequality constraint coefficients */
    count = 0;
    /* new rows will be added to the end of the row list, so we go
     from the end to beginning of the row list */
    for (row = npp.r_tail; row != null; row = prev_row)
    {  prev_row = row.prev;
        /* skip equality constraint */
        if (row.lb == row.ub) continue;
        count += npp_reduce_ineq_coef(npp, row);
    }
    if (count > 0)
        xprintf(count + " constraint coefficient(s) were reduced");
    /*==============================================================*/
    //if (GLP_DEBUG){routine(npp)}
    /*==============================================================*/
    /* all seems ok */
    ret = 0;
    return ret;
}

