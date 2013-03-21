var logs = {
    PRELOAD_NO_FILE: "指定的文件为空。",
    PRELOAD_MANIFEST_EMPTY: "提供的文件列表为空。",
    PRELOAD_MANIFEST_NULL: "manifest参数为空。",
    PRELOAD_TIMEOUT: "加载超时。"
}
var Log = xc.module.require("xc.createjs.Log");
Log.addKeys(logs);