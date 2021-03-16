import { Analyser } from "./analyser.js";
import { UserAudioDataSource } from "./audioSource.js";
import { AxisTicksGenerator, Graph, LinearScale, LogarithmicScale, NoteIndicator } from "./graph.js";

const sampleSize = 1024 * 4;
let audioSource = new UserAudioDataSource(sampleSize);
const sampleRate = audioSource.sampleRate;

console.debug("sample rate: " + sampleRate);
console.debug("frame time: " + (sampleSize / sampleRate));

const waveScales = [new LinearScale(0, sampleSize), new LinearScale(-1, 1)];
// const logFftScales = [new LogarithmicScale(40, 10000), new LinearScale(-140, 0)];
const logFftScales = [new LinearScale(40, 5000), new LinearScale(-140, 0)];
const waveGraph = new Graph(document.getElementById('ul'), waveScales[0], waveScales[1],
    AxisTicksGenerator.generateLinearTicks(0, sampleSize, 512, AxisTicksGenerator.sequence(0, sampleSize, 1024)),
    AxisTicksGenerator.generateLinearTicks(-1, 1, 0.2, [-1, 0, 1], v => v.toFixed(1)));
const logFftGraph = new Graph(document.getElementById('lr'), logFftScales[0], logFftScales[1],
    // AxisTicksGenerator.generateLog10ScaleTicks(40, 10000),
    AxisTicksGenerator.generateLinearTicks(0, 5000, 100, []),
    AxisTicksGenerator.generateLinearTicks(-140, 0, 20, []),
    );
const noteIndicator = new NoteIndicator(document.getElementById('ur'));
const analyser = new Analyser(sampleSize, sampleRate, waveGraph, logFftGraph, noteIndicator);

function start() {
    audioSource.start({accept: data => analyser.update(data)});
}

document.querySelector("#start").addEventListener("click", () => {
    document.querySelector("#start-overlay").remove();
    start();
});
