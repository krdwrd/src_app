// main application object


function loadnext(filelist, callback)
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
        loadnext();
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
    var ann = new Array(docs.length);
    // store krdwrd tags in dom order in ann[document][order]
    for (var d in docs)
    {
        var res = [];
        traverse(docs[d].documentElement, function (txt, tag) { res[res.length] = tag; });
        ann[d] = res;
    }
    // count tag occurance per element
    for (var i in ann[0])
    {
        var b = new Object();
        // count in elements
        for (var d in docs)
        {
            if (b[ann[d][i]])
                b[ann[d][i]] ++;
            else
                b[ann[d][i]] = 1;
        }
        // TODO determine winner, write results back
        for (a in b)
            print(a + " " + b[a]);
    }

    quit();
}

function merge(filelist)
{
    loadnext(filelist, do_merge);
}

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

          merge(param.files);
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
