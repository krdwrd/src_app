
function pipe()
{
    function extract(doc)
    {
        return ""; 
    }
}

var pipes = { };

// get the chrome directory
var file = Components.classes["@mozilla.org/file/directory_service;1"].
    getService(Components.interfaces.nsIProperties).
    get("AChrom", Components.interfaces.nsIFile);
// descend into the apropriate location
file.append("content");file.append("pipes");

// get a script loader
var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Components.interfaces.mozIJSSubScriptLoader);

// load files ending in ".pipe" as scripts into global scope
filesEnum = file.directoryEntries;
while (filesEnum.hasMoreElements())
{
    fileName = filesEnum.getNext().QueryInterface(Components.interfaces.nsILocalFile).leafName;
    if (fileName.substring(fileName.lastIndexOf("."),fileName.length) == ".pipe")
    {
        print("DJS: "+fileName);
        loader.loadSubScript("chrome://krdwrdapp/content/pipes/"+fileName, pipes);
    }
}
