function do_merge(docs, outp)
{
    // the first document is considered the master document.
    // the structure and textual content of the other documents is validated
    // against this one. its own annotations are ignored.
    var master = docs[0];
    var docs = docs.slice(1);

    // get text content of master document
    var text = [];
    traverse(master.body, function(tx, ta) { text[text.length] = tx.data; });

    var ct = count_tags(docs, text);

    var lt = collect_tags(ct);

    var w = wta(lt,ct);

    var ind = 0;
    traverse(master.body, function(node, kw) {
            var par = node.parentNode;
            var tag = w[ind] == null ? 'krdwrd-tag-null' : w[ind][1];
            par.className = (filterkw(par.className).trim() + " " + tag).trim();
            if (KrdWrdApp.param.victor)
            {
                par.id = 'krdwrd_an' + ind;
            }
            ind++;
            });
         
    saveText(master.documentElement.innerHTML, outp);

    if (KrdWrdApp.param.stats)
    {
        var stats = collect_stats(docs, ct, w, text);
        saveText(stats, outp + '.stats');
    }

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
            if (ind > text.length-1)
            {
                print(d + ' has different structure. rejecting.');
                if (KrdWrdApp.param.verbose)
                {
                    print(' >'+ txt.data);
                    print(' :' + tag);
                }
                // "null" will be considered 'bad'
                tag = null;
            }
            else if (txt.data != text[ind])
            {
                if (KrdWrdApp.param.verbose)
                {
                    print(d + ' has different text. ');

                    print(' <'+ text[ind]);
                    print(' >'+ txt.data);
                    print(' :' + tag);
                }
                if (KrdWrdApp.param.sloppy)
                {
                    if (KrdWrdApp.param.verbose) print(' ...but accepting.');
                } else {
                    if (KrdWrdApp.param.verbose) print(' ...rejecting.');
                    // other than strucdiff txtdiff is not that bad...
                    // ...hence we might want to use this later on
                    tag = 'krdwrd-tag-mrgerr';
                }
            }

            doctags[d][ind++] = tag;
        }

        traverse(docs[d].body, count);
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
			// skip emtpy tags
            var nnul = doctags[d].every(function(x) 
				       { return x !== null;});
			if (! nnul)
			{
                if (KrdWrdApp.param.verbose) print(' # skipping: ' + d);
                continue;
            }

			// init counter
			if (collect[elemc] === undefined)
                collect[elemc] = new Object();

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

function wta(collect, doctags)
{
    var win = new Array(collect.length);

    if (collect.length > 0 )
    {
        for (c in collect)
        {
            // get best
            var max_count = 0;
            var sum_count = 0;
            var max_elem = null;
            for (a in collect[c])
            {
                var cur_count = collect[c][a];
                sum_count += cur_count;
                
                if (cur_count > max_count)
                {
                    max_count = cur_count;
                    max_elem = a;
                }
                else if (cur_count == max_count)
                {
                    if (KrdWrdApp.param.finalmrg)
                    {
                        max_elem = doctags[doctags.length-1][c];
                    } else {
                        max_elem = 'krdwrd-tag-mrgtie';
                    }
                }
            }
           
            if (KrdWrdApp.param.stats) 
            {
                var fraction = max_count / sum_count;
                var tens = parseInt(fraction * 10);
                var ones = (fraction * 100) % 10;
                var bin = 0;

                if (ones - 4 > 0)
                    tens += 1;
                bin = tens * 10;
                win[c] = [max_count, max_elem != 'undefined' ? max_elem + '-' + bin : undefined];
            } else {
                win[c] = [max_count, max_elem];
            }
        }
    } 
    else 
    {
        print('# no results left for merging.');
    }

    return win;
}

function collect_stats(docs, ct, w, text)
{
    var out = '';
    out += '# submitted : ' +  docs.length + '\n';
    out += '# tokens' + '\t' + 'merged' + '\t';

    for (var v in docs)
    {
        var filename = new String(docs[v].URL);
        var user = filename.substring(filename.lastIndexOf('/')+1,filename.length); 
        out += user + '\t';
    }
    out = out.trim()+'\n';

    var coding_table = [];

    var cols = 0;
    var rows = 0;

    for (var c in ct)
    {
        cols += 1;
        var rows_tmp = 0;
        for (var r in ct[c])
        {
            rows_tmp += 1;
            coding_table[r] = []; 
        }
        if (rows_tmp > rows) rows = rows_tmp;
    }

    // write 1st and 2nd column: #BTE-like tokens, winning-tag
    for (var r=0; r < rows; r++)
    {
        chars = winner = undefined;

        try { chars = text[r].btelen(); } catch (err) {}
        try { winner = w[r][1]; } catch (err) {}

        coding_table[r][0] =  chars + '\t' + winner; 
    }

    for (var c=0; c < cols; c++)
    {   
        for (var r=0; r < rows; r++)
        {
            coding_table[r][c+1] = ct[c][r];
        }
    }

    // write columns 3 and bejond: tags of subms 
    for (var r=0; r < rows; r++)
    {
        var line = '';
        // make sure the merged results will be printed, too 
        for (var c=0; c < cols + 1; c++)
        {
            line += coding_table[r][c] + '\t';
        }
        out += line.trim() + '\n';
    }

    return out;
}
