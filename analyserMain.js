import { Analyser } from "./analyser.js";
import { Graph } from "./analyserGraph.js";
import { OverlappingDataSource, UserAudioDataSource } from "./audioSource.js";
import { AxisTicksGenerator, LinearScale, LogarithmicScale } from "./graph.js";
import { startWithOverlay } from "./startOverlay.js";
import { createGetParamsMap } from "./utils.js";

const sampleSize = 1024 * 8;
const sourceSampleSize = 1024 * 4;

let audioSource = new UserAudioDataSource(sourceSampleSize);
const sampleRate = audioSource.sampleRate;
let overlapper = new OverlappingDataSource(sampleRate, sourceSampleSize, sampleSize);

console.debug("sample rate: " + sampleRate);
console.debug("frame time: " + (sourceSampleSize / sampleRate));

const logFftScales = [new LogarithmicScale(40, 8000), new LinearScale(-140, 0)];
// const logFftScales = [new LinearScale(40, 5000), new LinearScale(-140, 0)];

const graph = new Graph(document.getElementById("analyser"), logFftScales[0], logFftScales[1],
AxisTicksGenerator.generateLog10ScaleTicks(40, 8000, AxisTicksGenerator.useKPrefix)
    // .add(25, "25")
    // .add(150, "150")
    // .add(250, "250")
    // .add(350, "350")
    // .add(1500, "1.5k")
    // .add(2500, "2.5k")
    // .add(3500, "3.5k"),
    ,
// AxisTicksGenerator.generateLinearTicks(0, 5000, 100, [1000, 2000, 3000, 4000, 5000], AxisTicksGenerator.useKPrefix),
AxisTicksGenerator.generateLinearTicks(-140, 0, 20, []));

const analyser = new Analyser(sampleSize, sampleRate, [40, 8000], graph);

startWithOverlay(() => {
    let getParams = createGetParamsMap();
    let requestedFrame = -1;
    overlapper.setConsumer({accept: data => {
        window.cancelAnimationFrame(requestedFrame);
        requestedFrame = window.requestAnimationFrame(() => analyser.update(data))
    }});
    if (getParams.has("test")) {
        audioSource.startTest(overlapper, [45, 74, 100, 150.4, 220, 502, 915.5]);
    } else {
         audioSource.start(overlapper);
    }
});
