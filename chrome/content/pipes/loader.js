
function pipe()
{
    function extract(doc)
    {
        return ""; 
    }
}

var pipes = { };
psize = function (phash) {
    var len = 0; 
    for (var elems in phash) {
        len++;
    }
    return len;
}

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
filesEnum = file.directoryEntries;

while (filesEnum.hasMoreElements())
{
    fileName = filesEnum.getNext().QueryInterface(Components.interfaces.nsILocalFile).leafName;

    if (fileName.substring(fileName.lastIndexOf("."),fileName.length) == ".pipe")
    {
        loader.loadSubScript("chrome://krdwrdapp/content/pipes/"+fileName, pipes);

        if (psize(pipes) == 1) dump("DJS: "+fileName);
        else dump(", "+fileName);
    }
}
if (psize(pipes) > 0) dump("\n");
