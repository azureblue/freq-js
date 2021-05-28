import { Analyser } from "./analyser.js";
import { AnalyserGraph } from "/graph/analyserGraph.js";
import { OverlappingDataSource, UserAudioDataSource } from "/audioSource.js";
import { AxisTicks, AxisTicksGenerator, LinearScale, LogarithmicScale } from "../graph/graph.js";
import { startWithOverlay } from "/startOverlay.js";
import { createGetParamsMap } from "/utils.js";
import { CONFIG } from "../config.js";
import { toggleFullScreen } from "../utils.js";


class WindowResizeHandler {
    constructor(action, timout = 500) {
        this.action = action;
        this.timeout = timout;
        this.timeoutId = 0;
    }

    handle() {
        window.clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => this.action(), this.timeout);
    }
}

function start() {
        CONFIG.loadConfig("config.json").then(config => {
        const getParams = createGetParamsMap();

        const sampleSize = CONFIG.get("source.sampleSize").asNumber();
        const sourceSampleSize = CONFIG.get("source.windowStep").asNumber();

        let audioSource = new UserAudioDataSource(sourceSampleSize);
        const sampleRate = audioSource.sampleRate;
        let overlapper = new OverlappingDataSource(sampleRate, sourceSampleSize, sampleSize);

        console.debug("sample rate: " + sampleRate);
        console.debug("frame time: " + (sourceSampleSize / sampleRate));
        const freqRange = CONFIG.get("analyser.frequencyRange").asObject();
        const xScaleRange = CONFIG.get("graph.scales.x.range").asObject();
        const yScaleRange = CONFIG.get("graph.scales.y.range").asObject();

        /**@type {string} */const xScaleType = CONFIG.get("graph.scales.x.type").asString();
        /**@type {string} */const yScaleType = CONFIG.get("graph.scales.y.type").asString();

        const logFftScales = [
            xScaleType.startsWith("log") ? new LogarithmicScale(...xScaleRange) : new LinearScale(...xScaleRange),
            yScaleType.startsWith("log") ? new LogarithmicScale(...yScaleRange) : new LinearScale(...yScaleRange)
        ]
        // const logFftScales = [new LinearScale(40, 5000), new LinearScale(-140, 0)];

        AxisTicksGenerator.generateLinearTicks()
        const xTicks = xScaleType.startsWith("log")
            ? AxisTicksGenerator.generateLog10ScaleTicks(xScaleRange[0], xScaleRange[1], AxisTicksGenerator.useKPrefix)
            : AxisTicksGenerator.generateLinearTicks(xScaleRange[0], xScaleRange[1], 100, AxisTicksGenerator.sequence(1000, xScaleRange[1], 1000), AxisTicksGenerator.useKPrefix);

        if (yScaleType.startsWith("log")) {
            throw "logarithmic scale not supported for magnitude y-axis";
        }
        const yTicks = AxisTicksGenerator.generateLinearTicks(yScaleRange[0], yScaleRange[1], 20, []);
        const graph = new AnalyserGraph(logFftScales[0], logFftScales[1], xTicks, yTicks);

        graph.addToParentOrDOM(document.getElementById("analyser"));

        let resizeHandler = new WindowResizeHandler(() => {
            graph.updateSize();
            graph.updateScales();
        }, 500);

        window.addEventListener("resize", () => resizeHandler.handle());

        graph.updateScales();

        const analyser = new Analyser(sampleSize, sampleRate, freqRange, graph);

        startWithOverlay(() => {
            if (CONFIG.get("ui.fullscreen").asBool())
                toggleFullScreen();
            let requestedFrame = -1;
            overlapper.setConsumer({
                accept: data => {
                    if (requestedFrame != -1) {
                        window.cancelAnimationFrame(requestedFrame);
                        console.debug("overrun");
                    }
                    requestedFrame = window.requestAnimationFrame(
                        () => {
                            analyser.update(data);
                            requestedFrame = -1;
                        });
                }
            });
            if (getParams.has("test")) {
                audioSource.startTest(overlapper, [45, 74, 100, 150.4, 220, 502, 915.5]);
            } else {
                audioSource.start(overlapper);
            }
        });
    });
};

start();
