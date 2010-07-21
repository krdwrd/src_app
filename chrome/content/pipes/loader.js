pipe = function(name, extract) 
{
    this.name = name;
    this.extract = extract;
}    

pipe.prototype = {
    name: "dummyName",
    extract: function ()
    {
        return "dummyExtract.";
    }
};

pipes = [];

var addPipe = function (name, extract) {
    var p = new pipe(name, extract);
    pipes[pipes.length] = p;
    dump(p.name + ' ');
    return p;
};

// we dynamically load scripts from within the chrome directory:
//
// get the chrome directory
var file = Components.classes["@mozilla.org/file/directory_service;1"].
    getService(Components.interfaces.nsIProperties).
    get("AChrom", Components.interfaces.nsIFile);
// descend into the apropriate location
file.append("content");file.append("pipes");

// get a script loader
var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Components.interfaces.mozIJSSubScriptLoader);

// load files ending in ".pipe" as scripts into pipes scope
var filesEnum = file.directoryEntries;

// give feed-back about DynJS loading...
dump("DJS: ");
while (filesEnum.hasMoreElements())
{
    var fileName = filesEnum.getNext()
        .QueryInterface(Components.interfaces.nsILocalFile).leafName;

    if (fileName.substring(fileName.lastIndexOf("."),fileName.length) == ".pipe")
    {
        var dynl = {};
        var name = fileName.substring(0,fileName.lastIndexOf("."))
        loader.loadSubScript("chrome://krdwrdapp/content/pipes/"+fileName, dynl);
        addPipe(name, dynl.extract);
    }
}
// ...and nicify feed-back. 
dump("\n");
