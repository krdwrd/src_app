// main application object

var KrdWrdApp = {

  // command line parameters
  param: { outbase: null, grab: null, merge: null, url: 'http://krdwrd.org/', },

  once: false,

  init: function()
  {
      var param = KrdWrdApp.parseCmdLine();

      if (param.grab)
      {
          print("CMD: grab");

          // hook into the browser control
          var browser = $('browse');
          browser.addProgressListener(progress_listener(KrdWrdApp.onPageLoad));

          // set target url
          browser.setAttribute('src', param.url);
      }
      else
      if (param.merge)
      {
          print("CMD: merge");
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
      param.url = cmdLine.handleFlagWithParam("url", false) || KrdWrdApp.url;

      return param;
  },

  onPageLoad: function()
  {
      // execute only once
      if (KrdWrdApp.once)
      {
          print("WARN: dumper called again.");
          return;
      }
      KrdWrdApp.once = true;

      // wait a second for the engine to settle
      setTimeout(KrdWrdApp.dumpPage, 1000); 
  },

  dumpPage: function()
  {
    var doc = $('browse').contentDocument;

    print("URL: " + doc.location);

    try
    {
      // save source code
      var source = grabSource(doc);
      print("TXT: " + (source != null));
      if (source)
          saveText(source, KrdWrdApp.param.outbase + '.txt');

      // save page as png
      var grab = grabScreen(doc);
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
