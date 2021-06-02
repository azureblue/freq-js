import { CONFIG } from "./config.js";
import { toggleFullScreen } from "./utils.js";

export function startWithOverlay(startCallback = () => { }, text = "START") {
    const overlay = document.createElement("div");
    overlay.setAttribute("id", "start-overlay");
    overlay.classList.add("overlay", "splash");
    const startButton = document.createElement("div");
    startButton.setAttribute("id", "start-button");
    startButton.classList.add("button", "center");
    startButton.innerText = text;

    overlay.appendChild(startButton);
    document.body.appendChild(overlay);

    document.querySelector("#start-button").addEventListener("click", () => {
        if (CONFIG.getOrDefault("ui.fullscreen", () => false).asBool())
            toggleFullScreen();

        document.querySelector("#start-overlay").remove();
        startCallback();
    });
}
