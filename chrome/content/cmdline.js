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
       Read document from URL (use file:\/\/ *) and dump data for the processing\n\
       pipelines in PREFIX.{cl,dom,xy,png}\n\
\n\
Options:\n\
    -out PREFIX\n\
      Basepath for output files* (required by all commands)\n\
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
      Be more verbose about the ongoing processing\n\
    -follow\n\
      Stay around and wait for new execution\n\
      Note: you SHOULD wait for the output of 'APP: READY'\n\
            before re-execution\n\
    -proxyenv\n\
      Use the ENV proxy settings\n\
\n\n\
*Note: Always use absolute paths when specifying file names.\n\
";

// command line parameters
KrdWrdApp.param = { outbase: null, grab: null, merge: null, kwtags: null,
           dump: null, url: 'http://krdwrd.org/', files: [],
           text: false, sloppy: false, stats: false, verbose: false};

/*
 * from: https://developer.mozilla.org/en/XULRunner/CommandLine
 */

function CommandLineObserver()
{
    this.register();
}

CommandLineObserver.prototype = {
  observe: function(aSubject, aTopic, aData) {
     
     var cmdLine = aSubject.QueryInterface(Components.interfaces.nsICommandLine);
     
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
     param.outbase = cmdLine.handleFlagWithParam("out", true);
     // keep running, aka. tail -f 
     param.follow = cmdLine.handleFlag("follow", false);
     // use the system proxy settings from ENV
     param.proxyenv = cmdLine.handleFlag("proxyenv", false)

     if (! param.follow) 
     {
         // auto-kill after 60sec
         timeoutid = setTimeout(function() {
                 error("timeout");
                 }, 60000);
     }

     // grabbing
     if (param.grab)
         param.url = cmdLine.handleFlagWithParam("url", false) || KrdWrdApp.url;
     // merging annotations
     else if (param.merge)
         for (var i = 0; i<cmdLine.length; i++)
         {
             param.files[param.files.length] = cmdLine.getArgument(i);
         }
  },

  register: function() {
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                    .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(this, "commandline-args-changed", false);
  },

  unregister: function() {
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                    .getService(Components.interfaces.nsIObserverService);
    observerService.removeObserver(this, "commandline-args-changed");
    // print("# unregister.");
  }
}

var observer = new CommandLineObserver();

// Because we haven't yet registered a CommandLineObserver when the application is 
// launched the first time, we simulate a notification here.
var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
observerService.notifyObservers(window.arguments[0], "commandline-args-changed", null);

addEventListener("unload", observer.unregister(), false);


// vim: et
