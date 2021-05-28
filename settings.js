import { start } from "repl";
import { DOMElementOwner } from "./base.js";
import { CONFIG } from "./config.js";
//<script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js" integrity="sha512-GZ1RIgZaSc8rnco/8CXfRdCpDxRCphenIiZ2ztLy3XQfCbQUSCuk8IudvNHxkRA3oUg6q0qejgN/qqyG1duv5Q==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
export function showConfigEditor(after = () => { }) {
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

        // document.querySelector("#start-button").addEventListener("click", () => {
        //     document.querySelector("#start-overlay").remove();
        //     startCallback();
        // });

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