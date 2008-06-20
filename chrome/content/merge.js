function do_merge(docs, outp)
{
    // the first document is considered the master document.
    // the structure and textual content of the other documents is validated
    // against this one. its own annotations are ignored.
    var master = docs[0];
    var docs = docs.slice(1);

    // get text content of master document
    var text = [];
    traverse(master.documentElement, function(tx, ta) { text[text.length] = tx.data; });

    var ct = count_tags(docs, text);

    var lt = collect_tags(ct);

    var w = wta(lt);

    var ind = 0;
    traverse(master.documentElement, function(node, kw) {
            var par = node.parentNode;
            par.className = filterkw(par.className) + " " + w[ind][1];
            ind++;
            });
         
    saveText(master.documentElement.innerHTML, outp);

    quit();
}

// get per-document tag list
function count_tags(docs, text)
{
    var doctags = new Array(docs.length);
    for (var d in docs)
    {
        doctags[d] = new Array(text.length);
        var ind = 0;

        function count(txt, tag)
        {
            if (ind > text.length)
            {
                print(d + " has different structure. rejecting.");
                tag = null;
            }
            else if (txt.data != text[ind])
            {
                print(d + " has different text. rejecting.");
                tag = null;
            }
            doctags[d][ind++] = tag;
        }

        traverse(docs[d].documentElement, count);
    }
    return doctags;
}

// merge tags per-element
function collect_tags(doctags)
{
    var collect = [];
    var len = doctags[0].length;

    for (var elemc = 0; elemc < len; elemc++)
    {
        for (var d in doctags)
        {
            // init counter object
            if (d == 0)
                collect[elemc] = new Object();
            // skip invalid docs
            else if (! doctags[d][len-1])
                continue;

            var tag = doctags[d][elemc];
            // increment counter for tag if exists
            if (collect[elemc][tag])
                collect[elemc][tag] = collect[elemc][tag] + 1;
            // create entry otherwise
            else
                collect[elemc][tag] = 1;
        }
    }

    return collect;
}

function wta(collect)
{
    var win = new Array(collect.length);

    for (c in collect)
    {
        // get best
        var max_count = 0;
        var max_elem = null;
        for (a in collect[c])
        {
            var cur_count = collect[c][a];
            if (cur_count > max_count)
            {
                max_count = cur_count;
                max_elem = a;
            }
            // tie - return null if there is no winner
            else if (cur_count == max_count)
            {
                max_elem = null;
            }
        }
        win[c] = [max_count, max_elem];
    }

    return win;
}
