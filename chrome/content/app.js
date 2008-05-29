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

function setPassword()
{
    if ("@mozilla.org/passwordmanager;1" in Components.classes) {
       // Password Manager exists so this is not Firefox 3
        var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"].getService(Components.interfaces.nsIPasswordManager);

        passwordManager.addUser('krdwrd.org:80 (WAC Proxy)', 'krdwrd.org', null);
    }
    else if ("@mozilla.org/login-manager;1" in Components.classes) {
       alert("ff3");
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

var KrdWrdApp = {

  outbase: './output',

  url: 'http://krdwrd.org/',

  init: function()
  {
      KrdWrdApp.parseCmdLine();

      // hook into the browser control
      var browser = $('browse');
      browser.addEventListener("DOMContentLoaded", this.onPageLoad, true);

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

  onPageLoad: function(aEvent)
  {
      // wait a second for the engine to settle
      setTimeout(KrdWrdApp.dump, 1000); 
  },

  dump: function()
  {
    try
    {
      // save source code
      var source = KrdWrdApp.grabSource();
      if (source)
          saveText(source, KrdWrdApp.outbase + '.txt');

      // save page as png
      var grab = KrdWrdApp.grabScreen();
      saveCanvas(grab, KrdWrdApp.outbase + '.png');
    }
    finally
    {
      quit();
    };
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
setTimeout(function() { quit(true); }, 60000);

// run init after window is up
window.addEventListener("load", function() { KrdWrdApp.init(); }, false);

