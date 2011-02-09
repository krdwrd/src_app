pref("toolkit.defaultChromeURI", "chrome://krdwrdapp/content/main.xul");
// pref("toolkit.singletonWindowType", "KrdWrdApp");

pref("browser.dom.window.dump.enabled", true);

pref("javascript.enabled", false);

pref("dom.max_chrome_script_run_time", 180); 
pref("dom.max_script_run_time", 180);

// for auto-adding of passwords:

pref("signon.rememberSignons", true);
pref("signon.expireMasterPassword", false);
pref("signon.SignonFileName3", "signons3.txt");
//pref("nglayout.debug.disable_xul_cache", true);
//pref("nglayout.debug.disable_xul_fastload", true);
pref("nglayout.initialpaint.delay", 2000);
//pref("javascript.options.showInConsole", true);
//pref("javascript.options.strict", true);

// allow cookies - 0:yes* 1:from originating server 2:no
//pref("network.cookie.cookieBehavior", 2);

// display images - 1:yes* 2:block all imgs 3:block 3rd prty imgs
//pref("permissions.default.image", 2);

pref("security.warn_entering_secure", false);
pref("security.warn_entering_secure.show_once", false);
pref("security.warn_entering_weak", false);
pref("security.warn_entering_weak.show_once", false);
pref("security.warn_leaving_secure", false);
pref("security.warn_leaving_secure.show_once", false);
pref("security.warn_submit_insecure", false);
pref("security.warn_submit_insecure.show_once", false);
pref("security.warn_viewing_mixed", false);
pref("security.warn_viewing_mixed.show_once", false);

// Show an error page for pages that couldn't be loaded - instead of an alert
pref("browser.xul.error_pages.enabled", true);

// Disable all plugins
// for flash alone this: http://flashblock.mozdev.org/ might also work
pref("plugin.disable", true);
