// main application object
var KrdWrdApp = {
  param: { },
 
  init: function()
  {
      var param;
      try
      {
          param = KrdWrdApp.param;
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
      if (param.pipe)
      {
          print("CMD: pipe");

          mkBrowser(param.pipe, KrdWrdApp.pipeline);
      }
      else
      if (param.sweep && param.sweepin)
      {
          print("CMD: sweep");

          mkBrowser(param.sweep, KrdWrdApp.sweepPage);
      }
      else
      {
          print(USAGE);
          error("No command");
      }
  },

  pipeline: function(doc, win)
  {
      print("URL: " + doc.location);

      if (KrdWrdApp.param.jayscript)  
          filterNodes(doc.body, "NOSCRIPT");

      if (KrdWrdApp.param.kwtags)
          kwtext(doc, doc.body);

      for(var p in pipes)
      {
          dump("PYP: " + pipes[p].name + "...");
          var res = pipes[p].extract(doc.body);
          saveText(res,KrdWrdApp.param.outbase + '.' + pipes[p].name);
          print("done");
      }

      if (KrdWrdApp.param.pic)
      {
          // save page as png
          dump("PNG: ");
          var res = grabScreen(win, doc);
          print((res != null));
          saveCanvas(res, KrdWrdApp.param.outbase + '.png');
      }

      var res = extractTags(doc.body);
      saveText(res, KrdWrdApp.param.outbase + '.gold');

      observerService.notifyObservers(null, "KrdWrdApp", "done");
  },

  sweepPage: function(doc, win)
  {
      print("URL: " + doc.location);
      var lst = loadText(KrdWrdApp.param.sweepin).split("\n");
    
      if (KrdWrdApp.param.jayscript)  
          filterNodes(doc.body, "NOSCRIPT");

      var i=0;
      traverse(doc.body, function(node, kw)
        {
            node.parentNode.className = (filterkw(node.parentNode.className) +
                " krdwrd-tag-" + lst[i++]).trim();
        }
      );

      var css = doc.createElement('link');
      css.rel = "stylesheet";
      css.type = "text/css";
      // css.href = "chrome://krdwrdapp/content/krdwrd.css";
      css.href = "http://krdwrd.org/addon/krdwrd.css";
      doc.documentElement.childNodes[0].appendChild(css);

      var source = grabSource(doc);
      if (source)
        saveText(source, KrdWrdApp.param.outbase + '.html');

      setTimeout(function(){
              if (KrdWrdApp.param.pic)
              {
                  // save page as png
                  dump("PNG: ");
                  var res = grabScreen(win, doc);
                  print((res != null));
                  saveCanvas(res, KrdWrdApp.param.outbase + '.png');
              }

              observerService.notifyObservers(null, "KrdWrdApp", "done");
              },5000);

  },

  dumpPage: function(doc, win)
  {
    print("URL: " + doc.location);

    try
    {
      if (KrdWrdApp.param.jayscript)  
          filterNodes(doc.body, "NOSCRIPT");

      if (KrdWrdApp.param.kwtags)
          kwtext(doc, doc.body);

      // save html
      var source = grabSource(doc);
      print("HTML: " + (source != null));
      if (source)
          saveText(source, KrdWrdApp.param.outbase + '.html');

      if (KrdWrdApp.param.text && source && typeof(pipes['cl']) != "undefined")
      {
          var txt = pipes.cl.extract(doc.body);
          print("TXT: " + txt.length + " chars");
          saveText(txt, KrdWrdApp.param.outbase + '.txt');
      }

      if (KrdWrdApp.param.pic)
      {
          // save page as png
          var grab = grabScreen(win, doc);
          print("PNG: " + (grab != null));
          if (grab)
              saveCanvas(grab, KrdWrdApp.param.outbase + '.png');
      }
    }
    catch (e)
    {
      error(format_exception(e));
    };
    print("RES: SUCCESS");

    observerService.notifyObservers(null, "KrdWrdApp", "done");
  },

  observerService:  Components.classes["@mozilla.org/observer-service;1"]
                        .getService(Components.interfaces.nsIObserverService),
};


function KrdWrdAppOb() 
{
    this.register();
}

KrdWrdAppOb.prototype = {
    observe: function(subject, topic, data) {
      if (!KrdWrdApp.param.follow)
      {
          quit();
      }
      else
      {
          print("APP: READY");
      }
    },
    register: function() {
      var observerService = Components.classes["@mozilla.org/observer-service;1"]
                            .getService(Components.interfaces.nsIObserverService);
      observerService.addObserver(this, "KrdWrdApp", false);
    },
    unregister: function() {
      var observerService = Components.classes["@mozilla.org/observer-service;1"]
                              .getService(Components.interfaces.nsIObserverService);
      observerService.removeObserver(this, "KrdWrdApp");
    }
};


function runkrdwrd()
{ 
    try
    {
        kwProxy();
        var observer = new KrdWrdAppOb();
        KrdWrdApp.init();
    }
    catch (e)
    {
        error(format_exception(e));
    };
}


// close another - i.e. a different - open window; this happens
// when the app is being re-executed
var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator);
var wenum = wm.getEnumerator(null);
while(wenum.hasMoreElements()) {
   var win = wenum.getNext();
   if (win != this) win.close();
}

// run init after window is up
window.addEventListener("load", runkrdwrd, false);


// vim: et
