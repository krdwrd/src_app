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
      {
          print(USAGE);
          error("No command");
      }
  },

  pipeline: function(doc, win)
  {
      print("URL: " + doc.location);

      for(var propName in pipes)
      {
          if(typeof(pipes[propName]) != "undefined")
          {
              dump("PYP: " + propName + "...");

              var res = eval("pipes."+propName+".extract(doc.body)");
              saveText(res,KrdWrdApp.param.outbase + '.' + propName);
              dump("done" + "\n");
          }
      }

      if (KrdWrdApp.param.pic)
      {
          // save page as png
          dump("PNG: ");
          var res = grabScreen(win, doc);
          dump((res != null) + "\n");
          saveCanvas(res, KrdWrdApp.param.outbase + '.png');
      }

      var res = extractTags(doc.body);
      saveText(res, KrdWrdApp.param.outbase + '.gold');

      observerService.notifyObservers(null, "KrdWrdApp", "done");
  },

  dumpPage: function(doc, win)
  {
    print("URL: " + doc.location);

    try
    {
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
