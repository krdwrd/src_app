// get content element
function $(elem)
{
    return document.getElementById(elem);
};

// quit the application
function quit(forced)
{
    var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].
      getService(Components.interfaces.nsIAppStartup);
    
    var quitSeverity = forced ? Components.interfaces.nsIAppStartup.eForceQuit :
                                Components.interfaces.nsIAppStartup.eAttemptQuit;

    appStartup.quit(quitSeverity);
};

function print(msg)
{
    dump(msg + '\n');
};

// print error to stdout and quit
function error(msg)
{
    print("RES: ERR " + msg);
    quit(true);
};

function setPassword()
{
    if ("@mozilla.org/passwordmanager;1" in Components.classes) {
       // Password Manager exists so this is not Firefox 3
        var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"].getService(Components.interfaces.nsIPasswordManager);

        passwordManager.addUser('krdwrd.org:80 (WAC Proxy)', 'krdwrd.org', null);
    }
    else if ("@mozilla.org/login-manager;1" in Components.classes) {
       // Login Manager exists so this is Firefox 3
       var passwordManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
    
       var authLoginInfo = new nsLoginInfo('krdwrd.org:80', null, 'WAC Proxy', 'krdwrd.org', null, "", "");

    };
};

function saveCanvas(canvas, dest)
{
      // convert string filepath to an nsIFile
      var file = Components.classes["@mozilla.org/file/local;1"]
                           .createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(dest);

      // create a data url from the canvas and then create URIs of the source and targets  
      var io = Components.classes["@mozilla.org/network/io-service;1"]
                         .getService(Components.interfaces.nsIIOService);
      var source = io.newURI(canvas.toDataURL("image/png", ""), "UTF8", null);
      var target = io.newFileURI(file)
    
      // prepare to save the canvas data
      var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
                              .createInstance(Components.interfaces.nsIWebBrowserPersist);
  
      persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
      persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;

      // save the canvas data to the file
      persist.saveURI(source, null, null, null, null, file);
};

function saveText(text, dest)
{
      // convert string filepath to an nsIFile
      var file = Components.classes["@mozilla.org/file/local;1"]
                           .createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(dest);

      // create output stream
      var ost = Components.classes["@mozilla.org/network/file-output-stream;1"].
                    createInstance(Components.interfaces.nsIFileOutputStream);
      ost.init(file, -1, -1, null);

      // write data & close
      ost.write(text, text.length);

      ost.flush();
};


// progress listener implementing nsIWebProgressListener

const STATE_STOP =
  Components.interfaces.nsIWebProgressListener.STATE_STOP;
const STATE_IS_WINDOW = 
  Components.interfaces.nsIWebProgressListener.STATE_IS_WINDOW;

var pl = 
{
  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  }, 
  onStateChange:function(prog, req, flg, stat)
  {
      if ((flg & STATE_STOP) && (flg & STATE_IS_WINDOW)) 
          KrdWrdApp.onPageLoad();
  },
  onLocationChange:function(a,b,c)
  {
  },
  onProgressChange:function(a,b,c,d,e,f)
  {
  },
  onStatusChange:function(a,b,c,d)
  {
  },
  onSecurityChange:function(a,b,c)
  {
  },
};

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
      browser.addProgressListener(pl);

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
    try
    {
      // save source code
      var source = KrdWrdApp.grabSource();
      print("TXT: " + (source != null));
      if (source)
          saveText(source, KrdWrdApp.outbase + '.txt');

      // save page as png
      var grab = KrdWrdApp.grabScreen();
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

  grabSource: function()
  {
      return $('browse').contentDocument.documentElement.innerHTML;
  },

  grabRect: function(x, y, w, h)
  {
      // get references to the source browser and target canvas
      var doc = $('browse');
      var canvas = $('rendercanvas');

      canvas.width = w;
      canvas.height = h;

      // get a fresh drawing context
      var context = canvas.getContext('2d');

      // draw portion of window
      context.drawWindow(doc.contentWindow, x, y, w, h, 'rgb(128,128,128);');
      return canvas;
  },

  grabScreen: function()
  {
      var doc = $('browse').contentDocument;
      // grab whole document.
      var h = doc.height;
      // FIXME there are pages that wont give us any height info :/
      if (h < 10) h = 768;
      return KrdWrdApp.grabRect(0, 0, doc.width, h);
  },


};


// auto-kill after 60sec
setTimeout(function() { 
            error("timeout");
        }, 30000);

// run init after window is up
window.addEventListener("load", function() { KrdWrdApp.init(); }, false);

