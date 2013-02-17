var fs = require("fs");
var walker = require("walker");
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

var options = function(args) {
  var opts = {};
  for (var i = 2; i < args.length; i++) {
    var arg = args[i];
    if (arg[0] === "-") {
      var o = arg.slice(1);
      opts[o] = {root: 1, output: 1}[o] ? args[++i] : true;
    } else {
      opts.source = arg;
    }
  }
  print(opts);
  return opts;
};

var concatJs = function(loader) {
  var blob = "";
  var len = loader.modules.length;
  var m;
  for (var i = 0; i < len; i++) {
    m = loader.modules[i];
    print("+ " + m);
    blob += "\n\n// @source: " + m + "\n\n" + compressJsFile(m) + "\n";
  }
  return blob;
};

var compress = function(inCode) {
  var ast = jsp.parse(inCode);
  ast = pro.ast_mangle(ast);
  ast = pro.ast_squeeze(ast);
  return pro.gen_code(ast, {indent_level: 0, beautify: !opt.aggro, ascii_only: true});
};

var compressJsFile = function(inPath) {
  var code = fs.readFileSync(inPath, "utf8");
  return compress(code);
};

var finish = function(loader) {
  var output = opt.output || "build";
  var js = concatJs(loader);
  if (js.length) {
    fs.writeFileSync(output, js, "utf8");
  }
  print("done.");
};

var print = console.log;

var opt = options(process.argv);

walker.init(opt.root);
walker.walk(opt.source, finish);
