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

function loadText(src)
{
      // convert string filepath to an nsIFile
      var file = Components.classes["@mozilla.org/file/local;1"]
                           .createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(src);

      // create input stream
      var ost = Components.classes["@mozilla.org/network/file-input-stream;1"].
                    createInstance(Components.interfaces.nsIFileInputStream);

      ost.init(file, 0x01, 00004, null);

      var os = Components.classes["@mozilla.org/scriptableinputstream;1"]
                    .createInstance( Components.interfaces.nsIScriptableInputStream );
      os.init( ost );
      var output = os.read( os.available() );

      os.close();
      return output;
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
    context.drawWindow(win, x, y, w, h, 'rgb(255,255,255);');
    return canvas;
};

function grabScreen(win, doc)
{
    function maxh(elem, h)
    // determine document height by max'ing over all nodes
    {
        // prevent js/iframe mess-up - make sure there is something to check
        if (elem != undefined)
        {
            if (elem.getBoundingClientRect)
            {
                cr = elem.getBoundingClientRect();
                mh = (cr.top || 0) + (cr.height || elem.clientHeight);
                h = Math.max(mh, h);
            }
            for (c in elem.childNodes)
            {
                ch = maxh(elem.childNodes[c], h);
                h = Math.max(ch, h);
            }
        }
        return h;
    }
    var h = Math.round(maxh(doc, doc.height));

    return grabRect(win, doc, 0, 0, doc.width, h);
};

// vim: et
