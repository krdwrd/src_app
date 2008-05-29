// main application object

var KrdWrdApp = {

  outbase: './output',

  url: 'http://krdwrd.org/',

  once: false,

  init: function()
  {
      KrdWrdApp.parseCmdLine();

      // hook into the browser control
      var browser = $('browse');
      browser.addProgressListener(progress_listener(KrdWrdApp.onPageLoad));

      // set target url
      browser.setAttribute('src', KrdWrdApp.url);
  },

  parseCmdLine: function()
  {
      var cmdLine = window.arguments[0];
      cmdLine = cmdLine.QueryInterface(Components.interfaces.nsICommandLine);

      KrdWrdApp.outbase = cmdLine.handleFlagWithParam("out", false) || KrdWrdApp.outfile;
      KrdWrdApp.url = cmdLine.handleFlagWithParam("url", false) || KrdWrdApp.url;
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

      print("URL: " + KrdWrdApp.url);

      // wait a second for the engine to settle
      setTimeout(KrdWrdApp.dumpPage, 1000); 
  },

  dumpPage: function()
  {
	var doc = $('browse').contentDocument;
    try
    {
      // save source code
      var source = grabSource(doc);
      print("TXT: " + (source != null));
      if (source)
          saveText(source, KrdWrdApp.outbase + '.txt');

      // save page as png
      var grab = grabScreen(doc);
      print("PNG: " + (grab != null));
      if (grab)
          saveCanvas(grab, KrdWrdApp.outbase + '.png');
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
        }, 30000);

// run init after window is up
window.addEventListener("load", function() { KrdWrdApp.init(); }, false);

