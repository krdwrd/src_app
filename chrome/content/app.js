// main application object

var USAGE = "\
KrdWrd XUL Application \n\
\n\
Usage: ./krdwrd COMMAND [OPTIONS]\n\
\n\
Main Commands:\n\
    -grab -url URL\n\
    -merge MASTERFILE FILELIST\n\
    -dump FILE\n\
Options:\n\
    -out PREFIX\n\
\n\
Note: Always use absolute paths when specifying file names\n\
";

var KrdWrdApp = {

  // command line parameters
  param: { outbase: null, grab: null, merge: null, 
           dump: null, url: 'http://krdwrd.org/', files: []},

  init: function()
  {
      var param;
      try
      {
          param = KrdWrdApp.parseCmdLine();
      }
      catch (e)
      {
          print(USAGE);
          error(e);
      }

      if (param.grab)
      {
          print("CMD: grab");

          mkBrowser(param.url, KrdWrdApp.dumpPage);
      }
      else
      if (param.merge)
      {
          print("CMD: merge");

          open_documents(param.files, function (docs) { do_merge(docs, param.outbase); });
      }
      else
      if (param.dump)
      {
          print("CMD: dump");

          open_documents(param.dump, function(docs) { error("Not implemented"); });
      }
      else
      {
          print(USAGE);
          error("No command");
      };
  },

  parseCmdLine: function()
  {
      var cmdLine = window.arguments[0];
      cmdLine = cmdLine.QueryInterface(Components.interfaces.nsICommandLine);

      var param = KrdWrdApp.param;
      param.grab = cmdLine.handleFlag("grab", false);
      param.merge = cmdLine.handleFlag("merge", false);
      param.dump = cmdLine.handleFlagWithParam("dump", false);
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
      error(format_exception(e));
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
            kwProxy();
            KrdWrdApp.init();
        }
        catch (e)
        {
            error(format_exception(e));
        };
    }, false);

// vim: et
