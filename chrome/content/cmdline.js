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
    -sweep URL\n\
       Read document from URL and sweep page according to silver tag from -sweepin\n\
\n\
Options:\n\
    -out PREFIX\n\
      Basepath for output files* (required by all commands)\n\
    -text\n\
      Write text content to PREFIX.txt (grab only)\n\
    -kwtags\n\
      Insert <kw> tags around all text blocks (grab and pipe only)\n\
    -sweepin file\n\
      Use file to get the silver tags for sweeping (sweep only)\n\
    -pic\n\
      Do NOT write Screenshot to PREFIX.png\n\
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
    -tmout\n\
      Timeout (in ms) for quitting the App (not follow mode) or\n\
      for loading a page (follow mode)\n\
      Note: the output will be 'APP: STOP'\n\
    -proxy URL\n\
      Use URL as proxy (default proxy.krdwrd.org:8080)\n\
    -js\n\
      Activate JavaScript\n\
   \n\n\
*Note: Always use absolute paths when specifying file names.\n\
";

// command line parameters
KrdWrdApp.param = {}; 

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
     param.merge = cmdLine.handleFlag("merge", false);
     param.pipe = cmdLine.handleFlagWithParam("pipe", false);
     param.sweep = cmdLine.handleFlagWithParam("sweep", false);
     param.outbase = cmdLine.handleFlagWithParam("out", true);
     param.text = cmdLine.handleFlag("text", false);
     param.kwtags = cmdLine.handleFlag("kwtags", false);
     param.sweepin = cmdLine.handleFlagWithParam("sweepin", false);
     param.pic = cmdLine.handleFlag("pic", false);
     param.sloppy = cmdLine.handleFlag("sloppy", false);
     param.stats = cmdLine.handleFlag("stats", false);
     param.victor = cmdLine.handleFlag("victor", false);
     param.verbose = cmdLine.handleFlag("verbose", false);
     // keep running, aka. tail -f 
     param.follow = cmdLine.handleFlag("follow", false);
     // the timeout for loading a page
     param.tmout = cmdLine.handleFlagWithParam("tmout", false) || 60000;
     // use the system proxy settings from ENV
     param.proxy = cmdLine.handleFlagWithParam("proxy", false)
     param.jayscript = cmdLine.handleFlag("js", false)

    
     var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefBranch);
     if (param.jayscript)
     {
        prefManager.setBoolPref("javascript.enabled", true);
        print("OPT: JS activated");
     }
     else
     {
        prefManager.setBoolPref("javascript.enabled", false);
        print("OPT: JS disabled");

     }

     param.pic = param.pic != null ? !param.pic : true ;

     if (! param.follow) 
     {
         // auto-kill after 60sec
         print("OPT: timeout for app is "+param.tmout+"ms");
         timeoutid = setTimeout(function() {
                 error("timeout");
                 }, param.tmout);
     }
     else
     {
        print("OPT: follow mode, timeout for page load is "+param.tmout+"ms");
     }


     // grabbing
     if (param.grab)
         param.url = cmdLine.handleFlagWithParam("url", false) || 'http://krdwrd.org';
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
