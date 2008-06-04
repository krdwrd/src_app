

// open all urls in filelist in a browser window
// return list of document objects when fully loaded
function open_documents(filelist, callback)
{
    // initialize once, with filelist and callback
    if (filelist)
    {
        this.filelist = filelist;
        this.index = 0;
        this.doclist = [];
        this.callback = callback;
        this.docdone = false;
    }
    // otherwise increment the filelist pointer
    else
    {
        this.index++;
    }

    // collect documents for returning
    var ret = this.doclist;

    function handler(doc, win)
    {
        ret[ret.length] = doc;
        open_documents();
    }

    // have more files
    if (this.index < this.filelist.length)
    {
        mkBrowser(this.filelist[this.index], handler);
    }
    // done
    else if (! this.docdone)
    {
        this.docdone = true;
        this.callback(this.doclist);
    }
}


function do_merge(docs)
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

    print(w);
         
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
                print(docs[d].location + " has different structure. rejecting.");
                tag = null;
            }
            else if (txt.data != text[ind])
            {
                print(docs[d].location + " has different text. rejecting.");
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
            else if (! doctags[d][len])
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


// main application object

var KrdWrdApp = {

  // command line parameters
  param: { outbase: null, grab: null, merge: null, url: 'http://krdwrd.org/', files: []},

  once: false,

  init: function()
  {
      var param = KrdWrdApp.parseCmdLine();

      if (param.grab)
      {
          print("CMD: grab");

          mkBrowser(param.url, KrdWrdApp.onPageLoad);
      }
      else
      if (param.merge)
      {
          print("CMD: merge");

          open_documents(param.files, do_merge);
      }
      else
      {
          print("ERR: no command.");

          quit();
      };
  },

  parseCmdLine: function()
  {
      var cmdLine = window.arguments[0];
      cmdLine = cmdLine.QueryInterface(Components.interfaces.nsICommandLine);

      var param = KrdWrdApp.param;
      param.grab = cmdLine.handleFlag("grab", false);
      param.merge = cmdLine.handleFlag("merge", false);
      param.outbase = cmdLine.handleFlagWithParam("out", false);
      // grabbing
      if (param.grab)
          param.url = cmdLine.handleFlagWithParam("url", false) || KrdWrdApp.url;
      // merging annotations
      else if (param.merge)
          for (var i = 0; i<cmdLine.length; i++)
          {
              param.files[param.files.length] = cmdLine.getArgument(i);
          }

      return param;
  },

  onPageLoad: function(doc, win)
  {
      // execute only once
      if (KrdWrdApp.once)
      {
          print("WARN: dumper called again.");
          return;
      }
      KrdWrdApp.once = true;

      // wait a second for the engine to settle
      setTimeout(function() { KrdWrdApp.dumpPage(doc, win); }, 1000); 
  },

  dumpPage: function(doc, win)
  {
    print("URL: " + doc.location);

    try
    {
      // save source code
      var source = grabSource(doc);
      print("TXT: " + (source != null));
      if (source)
          saveText(source, KrdWrdApp.param.outbase + '.txt');

      // save page as png
      var grab = grabScreen(win, doc);
      print("PNG: " + (grab != null));
      if (grab)
          saveCanvas(grab, KrdWrdApp.param.outbase + '.png');
    }
    catch (e)
    {
      error(e);
    };
    print("RES: SUCCESS");
    quit();
  },

};


// auto-kill after 60sec
setTimeout(function() { 
            error("timeout");
        }, 60000);

// run init after window is up
window.addEventListener("load", function()
    { 
        try
        {
            setPassword();
            KrdWrdApp.init();
        }
        catch (e)
        {
            error(e);
        };
    }, false);

// vim: et
