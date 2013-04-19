var codes = document.querySelectorAll(".tutorialCode");
for(var i = codes.length - 1;i >= 0;i--) {
    var editor = CodeMirror.fromTextArea(codes[i], {
        lineNumbers: true,
        readOnly: true
    });
    editor.setOption("theme", "ambiance");
}