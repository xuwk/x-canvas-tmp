/**
 * @module xc
 */
(function() {
  this.xc = { version: "0.1.0" };
  xc.ld = {};
  xc.ld.path = {
    paths: {},
    addPath: function(name, path) {
      return this.paths[name] = path;
    },
    addPaths: function(paths) {
      for (var n in paths) {
        this.addPath(n, paths[n]);
      }
    },
    rewrite: function(prefix, path) {
      var paths = this.paths;
      var n, nc;
      for (n in paths) {
        nc = path.slice(n.length, 1) || "/";
        if (path.slice(0, n.length) === n && nc === "/") {
          return paths[n] + path.slice(n.length);
        }
        nc = prefix.slice(n.length, 1) || "/";
        if (prefix.slice(0, n.length) === n && nc === "/") {
          return paths[n] + prefix.slice(n.length) + path;
        }
      }
      return prefix + path;
    },
    canonicalize: function(path) {
      var paths = this.paths;
      var n, p, nc;
      for (n in paths) {
        p = paths[n];
        nc = path.slice(p.length, 1) || "/";
        if (path.slice(0, p.length) === p && nc == "/") {
          return n + path.slice(p.length);
        }
      }
      return path;
    },
    splitPath: function(path) {
      return path.replace(/\\/g, "/").replace(/\/\//g, "/").replace(/:\//, "://").split("/");
    },
    stripPath: function(path) {
      var parts = this.splitPath(path);
      var i, p;
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i];
        if (p === ".") {
          parts.splice(i, 1);
        }
      }
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i];
        if (p === "..") {
          if (i > 0 && parts[i - 1] !== "..") {
            parts.splice(i - 1, 2);
            i -= 1;
          }
        }
      }
      return parts.join("/");
    }
  };
  xc.ld.Loader = function(machine) {
    this.machine = machine;
    this.stack = [];
    this.scripts = {};
  };
  xc.ld.Loader.prototype = {
    scriptFolder: "",
    scriptPath: "",
    verbose: false,
    load: function(depends, callback) {
      this.stack.push({
        index: 0,
        depends: depends || [],
        folder: this.scriptFolder,
        path: this.scriptPath,
        callback: callback
      });
      if (this.verbose) {
        console.group("* load [" + depends + "]");
      }
      if (!this.scriptPath) {
        this.more();
      }
    },
    more: function() {
      var block;
      if (this.stack.length) {
        block = this.stack[this.stack.length - 1];
        if (block.index < block.depends.length) {
          this.scriptFolder = block.folder;
          this.scriptPath = block.path;
          this.continueBlock(block);
          return;
        }
      }
      block = this.stack.pop();
      if (block) {
        if (this.verbose) {
          console.groupEnd("* done");
        }
        if (block.callback) {
          block.callback();
        }
      }
      if (this.stack.length) {
        this.more();
      }
    },
    continueBlock: function(block) {
      var depend = block.depends[block.index++];
      this.require(depend);
    },
    getPathPrefix: function(path) {
      if (path.slice(0, 5) !== "http:") {
        return this.scriptFolder;
      }
      return "";
    },
    require: function(depend) {
      var delim = depend.slice(0, 1);
      if (delim === "/" || delim === "\\") {
        depend = depend.slice(1);
      }
      var prefix = this.getPathPrefix(depend);
      path = xc.ld.path.rewrite(prefix, depend);
      path = xc.ld.path.stripPath(path);
      if (path.slice(-3) === ".js" && path.slice(-10) !== "package.js") {
        this.requireScript(path);
      } else {
        this.requirePackage(path);
      }
    },
    decodeScriptPath: function(path) {
      var folder = "", name = "";
      var parts = xc.ld.path.splitPath(path);
      if (parts.length) {
        name = parts.pop();
        folder = parts.join("/");
        folder = (folder ? folder + "/" : "");
      }
      return {
        folder: folder,
        name: name
      };
    },
    requireScript: function(path) {
      if (this.scripts[path]) {
        this.more();
        return;
      }
      this.scripts[path] = true;
      var parts = this.decodeScriptPath(path);
      this.scriptFolder = xc.ld.path.canonicalize(parts.folder);
      this.scriptPath = xc.ld.path.canonicalize(path);
      if (this.verbose) {
        console.log("+ module: [" + path + "]");
      }
      this.machine.loadScript(path);
    },
    decodePackagePath: function(path) {
      var folder = "", manifest = "package.js";
      var parts = xc.ld.path.splitPath(path);
      if (parts.length) {
        var name = parts.pop() || parts.pop() || "";
        if (name.slice(-manifest.length) !== manifest) {
          parts.push(name);
        } else {
          manifest = name;
        }
        folder = parts.join("/");
        folder = (folder ? folder + "/" : "");
        manifest = folder + manifest;
      }
      return {
        folder: folder,
        manifest: manifest
      };
    },
    requirePackage: function(path) {
      var parts = this.decodePackagePath(path);
      if (this.scripts[parts.manifest]) {
        this.more();
        return;
      }
      this.scripts[parts.manifest] = true;
      this.scriptFolder = xc.ld.path.canonicalize(parts.folder);
      this.scriptPath = xc.ld.path.canonicalize(parts.manifest);
      this.machine.loadPackage(parts.manifest);
    }
  };
  var ldr;
  var machine = {
    loadScript: function(src) {
      var script = document.createElement("SCRIPT");
      script.onload = script.onerror = script.onreadystatechange = function() {
        if (!script.readyState || script.readyState === "loaded" || script.readyState === "complete") {
          ldr.more();
        }
      };
      script.src = src;
      document.getElementsByTagName("HEAD")[0].appendChild(script);
    },
    loadPackage: function(src) {
      this.loadScript(src);
    }
  };
  ldr = new xc.ld.Loader(machine);
  xc.depends = function(depends, callback) {
    ldr.load(depends, callback);
  };
  //ldr.verbose = true;
}).call(this);
