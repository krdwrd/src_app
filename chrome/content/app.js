// main application object

var USAGE = "\
KrdWrd XUL Application \n\
\n\
Usage: ./krdwrd COMMAND [OPTIONS]\n\
\n\
Main Commands:\n\
    -grab -url URL\n\
       Grab document from URL, write html body to PREFIX.html, save Screenshot\n\
       in PREFIX.png.\n\
    -merge MASTERFILE FILELIST\n\
       Using MASTERFILE as the basis, merge all annotation from FILELIST into\n\
       one single file PREFIX using a simple voting scheme.\n\
    -pipe URL\n\
       Read document from URL (use file:\/\/) and dump data for the processing\n\
       pipelines in PREFIX.{cl,dom,xy,png}\n\
Options:\n\
    -out PREFIX\n\
      Basepath for output files (required by all commands)\n\
    -kwtags\n\
      Insert <kw> tags around all text blocks (grab only)\n\
    -text\n\
      Write text content to PREFIX.txt (grab only)\n\
    -sloppy\n\
      Ignore differences in text content during merge (merge only)\n\
    -stats\n\
      Output statistics (merge only)\n\
    -victor\n\
      victor export\n\
    -verbose\n\
      Verbose (merge only)\n\
\n\
Note: Always use absolute paths when specifying file names.\n\
";

var KrdWrdApp = {

  // command line parameters
  param: { outbase: null, grab: null, merge: null, kwtags: null,
           dump: null, url: 'http://krdwrd.org/', files: [],
           text: false, sloppy: false, stats: false, victor: false, verbose: false},

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
      if (param.pipe)
      {
          print("CMD: pipe");

          mkBrowser(param.pipe, KrdWrdApp.pipeline);
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
      param.text = cmdLine.handleFlag("text", false);
      param.sloppy = cmdLine.handleFlag("sloppy", false);
      param.stats = cmdLine.handleFlag("stats", false);
      param.victor = cmdLine.handleFlag("victor", false);
      param.verbose = cmdLine.handleFlag("verbose", false);
      param.merge = cmdLine.handleFlag("merge", false);
      param.kwtags = cmdLine.handleFlag("kwtags", false);
      param.pipe = cmdLine.handleFlagWithParam("pipe", false);
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

  pipeline: function(doc, win)
  {
      print("URL: " + doc.location);

      var res = extractDom(doc.body);
      saveText(res, KrdWrdApp.param.outbase + '.dom');

      var res = extractCoord(doc.body);
      saveText(res, KrdWrdApp.param.outbase + '.xy');

      var res = extractText(doc.body);
      saveText(res, KrdWrdApp.param.outbase + '.cl');

      var res = grabScreen(win, doc);
      saveCanvas(res, KrdWrdApp.param.outbase + '.png');

      var res = extractTags(doc.body);
      saveText(res, KrdWrdApp.param.outbase + '.gold');

      quit();
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

      // save page as png
      var grab = grabScreen(win, doc);
      print("PNG: " + (grab != null));
      if (grab)
          saveCanvas(grab, KrdWrdApp.param.outbase + '.png');

      if (KrdWrdApp.param.text && source)
      {
          var txt = extractText(doc, false);
          print("TXT: " + txt.length + " chars");
          saveText(txt, KrdWrdApp.param.outbase + '.txt');
      }
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
        }, 120000);

function runkrdwrd()
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
}

// run init after window is up
window.addEventListener("load", runkrdwrd, false);


// vim: et
