import { CONFIG } from "../../config.js";
import { createGetParamsMap } from "../../utils.js";

export function start(configName, defaultConfigFile) {
    const getMap = createGetParamsMap();
    CONFIG.loadConfig(configName, defaultConfigFile, getMap.has("reset")).then(() => {
        const storage = window.localStorage;
        const editor = ace.edit("config-editor");
        editor.session.setMode("ace/mode/json");
        let fontSize = storage.getItem("configEditorFontSize");
        if (fontSize == null)
            fontSize = 12;
        editor.setOptions({
            fontSize: fontSize + "pt"
        });
        editor.setValue(CONFIG.getJson(2));
        editor.clearSelection()
        document.getElementById("zoom-in").addEventListener("click", () => {
            fontSize++;
            storage.setItem("configEditorFontSize", fontSize);
            editor.setOptions({
                fontSize: fontSize + "pt"
            });
        });
        document.getElementById("zoom-out").addEventListener("click", () => {
            fontSize--;
            storage.setItem("configEditorFontSize", fontSize);
            editor.setOptions({
                fontSize: fontSize + "pt"
            });
        });

        document.getElementById("save").addEventListener("click", () => {
            CONFIG.save(configName, editor.getValue());
        });
    });
}
