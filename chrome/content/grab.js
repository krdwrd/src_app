function saveCanvas(canvas, dest)
{
      // convert string filepath to an nsIFile
      var file = Components.classes["@mozilla.org/file/local;1"]
                           .createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(dest);

      // create a data url from the canvas and then use io service to create a URI for the source
      var io = Components.classes["@mozilla.org/network/io-service;1"]
                         .getService(Components.interfaces.nsIIOService);
      var source = io.newURI(canvas.toDataURL("image/png", ""), "UTF8", null);
    
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

      ost.init(file, 0x02 | 0x08 | 0x20, 0664, 0);

      var os = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
                   .createInstance(Components.interfaces.nsIConverterOutputStream);

      os.init(ost, "UTF-8", 0, '?'.charCodeAt(0));

      os.writeString(text);

      os.close();

};

function grabSource(doc)
{
    return doc.documentElement.innerHTML;
};

function grabRect(win, doc, x, y, w, h)
{
    // get references to the target canvas
    var canvas = doc.createElement('canvas');
    doc.documentElement.appendChild(canvas);

    canvas.width = w;
    canvas.height = h;

    // get a fresh drawing context
    var context = canvas.getContext('2d');

    // draw portion of window
    context.drawWindow(win, x, y, w, h, 'rgb(128,128,128);');
    return canvas;
};

function grabScreen(win, doc)
{
    // grab whole document
    return grabRect(win, doc, 0, 0, doc.width, doc.height);
};

// vim: et
