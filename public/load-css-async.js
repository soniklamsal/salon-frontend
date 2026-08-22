/**
 * Async CSS Loading Script
 * Prevents render-blocking by loading non-critical CSS asynchronously
 * This script runs inline in the <head> before any CSS loads
 */
(function() {
  // Load CSS asynchronously
  function loadCSS(href, before, media, attributes) {
    var doc = window.document;
    var ss = doc.createElement("link");
    var ref;
    if (before) {
      ref = before;
    } else {
      var refs = (doc.body || doc.getElementsByTagName("head")[0]).childNodes;
      ref = refs[refs.length - 1];
    }

    var sheets = doc.styleSheets;
    
    // Set attributes
    if (attributes) {
      for (var attributeName in attributes) {
        if (attributes.hasOwnProperty(attributeName)) {
          ss.setAttribute(attributeName, attributes[attributeName]);
        }
      }
    }
    
    ss.rel = "stylesheet";
    ss.href = href;
    ss.media = "only x"; // Temporarily set media to prevent blocking

    // Wait until body is defined before injecting link
    function ready(cb) {
      if (doc.body) {
        return cb();
      }
      setTimeout(function() {
        ready(cb);
      });
    }

    // Inject link
    ready(function() {
      ref.parentNode.insertBefore(ss, before ? ref : ref.nextSibling);
    });

    // Once loaded, set media back to `all` or the given media
    var onloadcssdefined = function(cb) {
      var resolvedHref = ss.href;
      var i = sheets.length;
      while (i--) {
        if (sheets[i].href === resolvedHref) {
          return cb();
        }
      }
      setTimeout(function() {
        onloadcssdefined(cb);
      });
    };

    function loadCB() {
      if (ss.addEventListener) {
        ss.removeEventListener("load", loadCB);
      }
      ss.media = media || "all";
    }

    // Once loaded, set link's media back to `all`
    if (ss.addEventListener) {
      ss.addEventListener("load", loadCB);
    }
    ss.onloadcssdefined = onloadcssdefined;
    onloadcssdefined(loadCB);

    return ss;
  }

  // Load non-critical stylesheets
  if (typeof window !== "undefined") {
    // Mark that async CSS loading is supported
    document.documentElement.classList.add("async-css-loading");
  }
})();
