import { OverlappingDataSource, UserAudioDataSource} from "./audioSource.js"
import { Transform } from "./transform.js"
import { AverageBuffer, MovingAverage } from "./average.js";
import { FFT } from "./fft.js";
import { Note } from "./music.js";
import { NoteFinder } from "./noteFinder.js";
import { PeekFinder, QuadraticPeekInterpolator } from "./peeks.js";
import { RollingMedian } from "./rollingMedian.js";
import { BuffersAverage } from "./buffersAverage.js";
import { GaussianWindow } from "./window.js";
import { Pipeline } from "./pipeline.js";
import { LogMagnitude } from "./logMagnitude.js";
import { AxisTicksGenerator, LinearScale, NoteIndicator } from "./graph/graph.js";
import { AnalyserGraph } from "./graph/analyserGraph.js";
import { startWithOverlay } from "./startOverlay.js";
import { createGetParamsMap, injectCSS } from "./utils.js";
import { NoteCentsFreqLabelManager, NoteCentsFreqLabelStyle } from "./graph/labels.js";
import { CONFIG } from "./config.js";

CONFIG.loadConfig()
const getParams = createGetParamsMap();

const sampleSize = 1024 * 4;
let audioSource = new UserAudioDataSource(sampleSize , getParams.has("useAudioWorklets"));
const sampleRate = audioSource.sampleRate;
let overlapper = new OverlappingDataSource(sampleRate, sampleSize , sampleSize);

console.debug("sample rate: " + sampleRate);
console.debug("frame time: " + (sampleSize / sampleRate));

const waveScales = [new LinearScale(0, sampleSize), new LinearScale(-1, 1)];
// const logFftScales = [new LogarithmicScale(40, 10000), new LinearScale(-140, 0)];
const logFftScales = [new LinearScale(40, 5000), new LinearScale(-140, 0)];
const waveGraph = new AnalyserGraph(waveScales[0], waveScales[1],
    AxisTicksGenerator.generateLinearTicks(0, sampleSize, 512, AxisTicksGenerator.sequence(0, sampleSize, 1024)),
    AxisTicksGenerator.generateLinearTicks(-1, 1, 0.2, [-1, 0, 1], v => v.toFixed(1)));
const logFFTGraph = new AnalyserGraph(logFftScales[0], logFftScales[1],
    // AxisTicksGenerator.generateLog10ScaleTicks(40, 10000, AxisTicksGenerator.useKPrefix),
    AxisTicksGenerator.generateLinearTicks(0, 5000, 100, [1000, 2000, 3000, 4000, 5000], AxisTicksGenerator.useKPrefix),
    AxisTicksGenerator.generateLinearTicks(-140, 0, 20, []),
    );

const noteIndicator = new NoteIndicator(document.getElementById('ur'));
const analyser = new Analyser(sampleSize, sampleRate, waveGraph, logFFTGraph, noteIndicator);
waveGraph.addToParentOrDOM(document.getElementById("ul"));
waveGraph.updateSize();
logFFTGraph.addToParentOrDOM(document.getElementById("lr"));
logFFTGraph.updateSize();
let labelStyle = NoteCentsFreqLabelStyle.defaultStyle.clone();
labelStyle.spacing[1] = 0;
labelStyle.spacing[2] = 0;
const labels = new NoteCentsFreqLabelManager(logFFTGraph, labelStyle, "analyser-label");

injectCSS(".analyser-label.note {display: none;}");
injectCSS(".analyser-label.cents {display: none;}");
function start() {
    overlapper.setConsumer({accept: data => analyser.update(data)});
    audioSource.startTest({accept: data => overlapper.accept(data)}, [70, 100, 220, 502]);
    // audioSource.start({accept: data => analyser.update(data)});
}

startWithOverlay(start);


function Analyser(sampleSize, sampleRate, waveGraph, logFFTGraph, noteIndicator) {
    const fftData = new Float32Array(sampleSize);
    const noiseFloor = new Float32Array(sampleSize / 2);
    const logMag = new Float32Array(sampleSize / 2);

    const windowTransform = new GaussianWindow(sampleSize, 0.3);
    const fftPipeline = new Pipeline([windowTransform, new FFT(sampleSize)]);
    const logMagPipeline = new Pipeline([new BuffersAverage(sampleSize / 2, 2), new LogMagnitude(20, windowTransform.sum / 2)]);
    const noiseFloorPipeline = new Pipeline([new RollingMedian(sampleSize / 512), new MovingAverage(Math.round(sampleSize / 512))]);

    const peekFinder = new PeekFinder(1);
    const peekInterpolator = new QuadraticPeekInterpolator();
    const notes = [];
    for (let note = Note.parse('C1'), limit = Note.parse('C8'); note.midiNumber <= limit.midiNumber; note = note.add(1))
        notes.push(note);
    const noteFinder = new NoteFinder();
    const noteFinderSmoother = new AverageBuffer(5);
    const peekHeight = 15;
    const wavexs = new Float32Array(sampleSize);
    const wavefftxs = new Float32Array(sampleSize / 2);

    for (let i = 0; i < sampleSize; i++)
        wavexs[i] = i;
    for (let i = 0; i < sampleSize / 2; i++)
        wavefftxs[i] = i * sampleRate / sampleSize;


    let lastFoundNoteRes;

    function binToFreq(i) {
        return i * sampleRate / sampleSize;
    }

    /**
     *
     * @param {Float32Array} waveData
     */
    this.update = function (waveData) {
        fftData.set(waveData);
        windowTransform.apply(waveData);
        fftPipeline.apply(fftData);
        logMag.set(fftData.subarray(0, sampleSize / 2));
        logMagPipeline.apply(logMag);
        waveGraph.clearPlot();
        labels.reuseAll();
        waveGraph.plotData(wavexs, waveData, 10);
        // logFFTGraph.drawScales();
        logFFTGraph.clearPlot();
        logFFTGraph.plotData(wavefftxs, logMag);
        noiseFloor.set(logMag);
        noiseFloorPipeline.apply(noiseFloor);
        Transform.transform(noiseFloor, v => v + 0.002);
        logFFTGraph.plotData(wavefftxs, noiseFloor);
        const peeks = [];
        peekFinder.forEachPeek(logMag, peek => {
            if (logMag[peek] - noiseFloor[peek] - peekHeight < 0)
                return;

            const ip = peekInterpolator.interpolatePeek(logMag[peek - 1], logMag[peek], logMag[peek + 1]);
            const peekFreq = binToFreq(peek + ip);
            labels.addLabel(peekFreq, {
                note: "#",
                cents: "#",
                freq: peekFreq.toFixed(1)
            });
            // logFFTGraph.plotVerticalLine(new AnalyserGraph.VerticalLine(peekFreq, [new AnalyserGraph.Label(peekFreq.toFixed(1), true)]));
            peeks.push(peekFreq);
        });

        for (let i = 80; i < 5000; i += 105.129)  {
            labels.addLabel(i, {
                note: "#",
                cents: "#",
                freq: i.toFixed(1)
            });
        }
        let res = noteFinder.findBestNote(peeks, notes);
        if (!res)
            res = lastFoundNoteRes;
        if (res) {
            if (!lastFoundNoteRes || (res.note.midiNumber !== lastFoundNoteRes.note.midiNumber))
                noteFinderSmoother.reset();
            lastFoundNoteRes = res;
            noteFinderSmoother.putValue(res.avgCentDiff);
            noteIndicator.drawNote(res.note, noteFinderSmoother.average());
        }
        labels.cleanNotUsed();
    }
}