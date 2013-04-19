var createjs = {};
var ids = xc.module.getIds(), match = [];
for(var i = ids.length - 1; i >= 0; i--) {
    // createjs的各个模块
    if(null !== (match = ids[i].match(/xc\.createjs\.(\w+)/))) {
        createjs[match[1]] = xc.module.require(ids[i]);
    }
}

HTMLCanvasElement = HTMLCanvasElement ? HTMLCanvasElement : Canvas;
HTMLAudioElement = HTMLAudioElement ? HTMLAudioElement : Audio;