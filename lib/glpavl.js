function avl_create_tree(fcmp, info)
{     /* create AVL tree */
    var tree = {};
    //tree.pool = dmp_create_pool();
    tree.root = null;
    tree.fcmp = fcmp;
    tree.info = info;
    tree.size = 0;
    tree.height = 0;
    return tree;
}

function avl_strcmp(info, key1, key2)
{   /* compare character string keys */
    if (key1 == key2)
        return 0;
    else if (key1 > key2)
        return 1;
    else
        return -1;
}

function avl_insert_node(tree, key)
{   /* insert new node into AVL tree */
    var p, q, r, flag;
    /* find an appropriate point for insertion */
    p = null; q = tree.root;
    while (q != null)
    {  p = q;
        if (tree.fcmp(tree.info, key, p.key) <= 0)
        {  flag = 0;
            q = p.left;
            p.rank++;
        }
        else
        {  flag = 1;
            q = p.right;
        }
    }
    /* create new node and insert it into the tree */
    r = {};
    r.key = key; r.type = 0; r.link = null;
    r.rank = 1; r.up = p;
    r.flag = (p == null ? 0 : flag);
    r.bal = 0; r.left = null; r.right = null;
    tree.size++;
    if (p == null)
        tree.root = r;
    else
    if (flag == 0) p.left = r; else p.right = r;
    /* go upstairs to the root and correct all subtrees affected by
     insertion */
    while (p != null)
    {  if (flag == 0)
    {  /* the height of the left subtree of [p] is increased */
        if (p.bal > 0)
        {  p.bal = 0;
            break;
        }
        if (p.bal < 0)
        {  rotate_subtree(tree, p);
            break;
        }
        p.bal = -1; flag = p.flag; p = p.up;
    }
    else
    {  /* the height of the right subtree of [p] is increased */
        if (p.bal < 0)
        {  p.bal = 0;
            break;
        }
        if (p.bal > 0)
        {  rotate_subtree(tree, p);
            break;
        }
        p.bal = +1; flag = p.flag; p = p.up;
    }
    }
    /* if the root has been reached, the height of the entire tree is
     increased */
    if (p == null) tree.height++;
    return r;
}

function avl_set_node_type(node, type)
{     /* assign the type field of specified node */
    node.type = type;
}

function avl_set_node_link(node, link)
{     /* assign the link field of specified node */
    node.link = link;
}

function avl_find_node(tree, key)
{     /* find node in AVL tree */
    var p, c;
    p = tree.root;
    while (p != null)
    {  c = tree.fcmp(tree.info, key, p.key);
        if (c == 0) break;
        p = (c < 0 ? p.left : p.right);
    }
    return p;
}

function avl_get_node_type(node)
{     /* retrieve the type field of specified node */
    return node.type;
}

function avl_get_node_link(node)
{     /* retrieve the link field of specified node */
    return node.link;
}

function find_next_node(tree, node)
{   /* find next node in AVL tree */
    var p, q;
    if (tree.root == null) return null;
    p = node;
    q = (p == null ? tree.root : p.right);
    if (q == null)
    {  /* go upstairs from the left subtree */
        for (;;)
        {  q = p.up;
            if (q == null) break;
            if (p.flag == 0) break;
            p = q;
        }
    }
    else
    {  /* go downstairs into the right subtree */
        for (;;)
        {  p = q.left;
            if (p == null) break;
            q = p;
        }
    }
    return q;
}

function avl_delete_node(tree, node)
{   /* delete specified node from AVL tree */
    var f, p, q, r, s, x, y, flag;
    p = node;
    /* if both subtrees of the specified node are non-empty, the node
     should be interchanged with the next one, at least one subtree
     of which is always empty */
    if (p.left != null && p.right != null){
        f = p.up; q = p.left;
        r = find_next_node(tree, p); s = r.right;
        if (p.right == r)
        {  if (f == null)
            tree.root = r;
        else
        if (p.flag == 0) f.left = r; else f.right = r;
            r.rank = p.rank; r.up = f;
            r.flag = p.flag; r.bal = p.bal;
            r.left = q; r.right = p;
            q.up = r;
            p.rank = 1; p.up = r; p.flag = 1;
            p.bal = (s == null ? 0 : +1);
            p.left = null; p.right = s;
            if (s != null) s.up = p;
        }
        else
        {  x = p.right; y = r.up;
            if (f == null)
                tree.root = r;
            else
            if (p.flag == 0) f.left = r; else f.right = r;
            r.rank = p.rank; r.up = f;
            r.flag = p.flag; r.bal = p.bal;
            r.left = q; r.right = x;
            q.up = r; x.up = r; y.left = p;
            p.rank = 1; p.up = y; p.flag = 0;
            p.bal = (s == null ? 0 : +1);
            p.left = null; p.right = s;
            if (s != null) s.up = p;
        }
    }
    /* now the specified node [p] has at least one empty subtree;
     go upstairs to the root and adjust the rank field of all nodes
     affected by deletion */
        q = p; f = q.up;
    while (f != null)
    {  if (q.flag == 0) f.rank--;
        q = f; f = q.up;
    }
    /* delete the specified node from the tree */
    f = p.up; flag = p.flag;
    q = p.left != null ? p.left : p.right;
    if (f == null)
        tree.root = q;
    else
    if (flag == 0) f.left = q; else f.right = q;
    if (q != null){q.up = f; q.flag = flag}
    tree.size--;
    /* go upstairs to the root and correct all subtrees affected by
     deletion */
    while (f != null)
    {  if (flag == 0)
    {  /* the height of the left subtree of [f] is decreased */
        if (f.bal == 0)
        {  f.bal = +1;
            break;
        }
        if (f.bal < 0)
            f.bal = 0;
        else
        {  f = rotate_subtree(tree, f);
            if (f.bal < 0) break;
        }
        flag = f.flag; f = f.up;
    }
    else
    {  /* the height of the right subtree of [f] is decreased */
        if (f.bal == 0)
        {  f.bal = -1;
            break;
        }
        if (f.bal > 0)
            f.bal = 0;
        else
        {  f = rotate_subtree(tree, f);
            if (f.bal > 0) break;
        }
        flag = f.flag; f = f.up;
    }
    }
    /* if the root has been reached, the height of the entire tree is
     decreased */
    if (f == null) tree.height--;
}

function rotate_subtree(tree, node)
{     /* restore balance of AVL subtree */
    var f, p, q, r, x, y;
    xassert(node != null);
    p = node;
    if (p.bal < 0)
    {  /* perform negative (left) rotation */
        f = p.up; q = p.left; r = q.right;
        if (q.bal <= 0)
        {  /* perform single negative rotation */
            if (f == null)
                tree.root = q;
            else
            if (p.flag == 0) f.left = q; else f.right = q;
            p.rank -= q.rank;
            q.up = f; q.flag = p.flag; q.bal++; q.right = p;
            p.up = q; p.flag = 1;
            p.bal = -q.bal; p.left = r;
            if (r != null){r.up = p; r.flag = 0}
            node = q;
        }
        else
        {  /* perform double negative rotation */
            x = r.left; y = r.right;
            if (f == null)
                tree.root = r;
            else
            if (p.flag == 0) f.left = r; else f.right = r;
            p.rank -= (q.rank + r.rank);
            r.rank += q.rank;
            p.bal = (r.bal >= 0 ? 0 : +1);
            q.bal = (r.bal <= 0 ? 0 : -1);
            r.up = f; r.flag = p.flag; r.bal = 0;
            r.left = q; r.right = p;
            p.up = r; p.flag = 1; p.left = y;
            q.up = r; q.flag = 0; q.right = x;
            if (x != null){x.up = q; x.flag = 1}
            if (y != null){y.up = p; y.flag = 0};
            node = r;
        }
    }
    else
    {  /* perform positive (right) rotation */
        f = p.up; q = p.right; r = q.left;
        if (q.bal >= 0)
        {  /* perform single positive rotation */
            if (f == null)
                tree.root = q;
            else
            if (p.flag == 0) f.left = q; else f.right = q;
            q.rank += p.rank;
            q.up = f; q.flag = p.flag; q.bal--; q.left = p;
            p.up = q; p.flag = 0;
            p.bal = -q.bal; p.right = r;
            if (r != null){r.up = p; r.flag = 1}
            node = q;
        }
        else
        {  /* perform double positive rotation */
            x = r.left; y = r.right;
            if (f == null)
                tree.root = r;
            else
            if (p.flag == 0) f.left = r; else f.right = r;
            q.rank -= r.rank;
            r.rank += p.rank;
            p.bal = (r.bal <= 0 ? 0 : -1);
            q.bal = (r.bal >= 0 ? 0 : +1);
            r.up = f; r.flag = p.flag; r.bal = 0;
            r.left = p; r.right = q;
            p.up = r; p.flag = 0; p.right = x;
            q.up = r; q.flag = 1; q.left = y;
            if (x != null){x.up = p; x.flag = 1}
            if (y != null){y.up = q; y.flag = 0}
            node = r;
        }
    }
    return node;
}