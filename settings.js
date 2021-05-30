import { DOMElementOwner } from "./base.js";
import { CONFIG } from "./config.js";

export function showConfigEditor() {
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet"
    cssLink.href = "css/config.css";
    cssLink.onload = function () {
        let overlay = new DOMElementOwner($(/*html*/`
            <div id="background-overlay" class="overlay splash">
                <div id="config-editor"></div>
            </div>
        `)[0]);

        overlay.addToParentOrDOM();
        var editor = ace.edit("config-editor");
        editor.session.setMode("ace/mode/json");
        editor.setValue(CONFIG.getAsJson())
        editor.setOptions({
            fontSize: "17pt"
        });

    }
    document.head.appendChild(cssLink);
}

export function start() {
    var editor = ace.edit("config-editor");
    editor.session.setMode("ace/mode/json");
    editor.setOptions({
        fontSize: "14pt"
    });
    editor.setValue(CONFIG.getAsJson());
    editor.clearSelection()
}