import { Transform } from "../transform.js"
import { AverageBuffer, MovingAverage } from "../average.js";
import { FFT } from "../fft.js";
import { Note } from "../music.js";
import { NoteFinder } from "../noteFinder.js";
import { FrequencyPeeksFilter, PeekFinder, QuadraticPeekInterpolator } from "../peeks.js";
import { RollingMedian } from "../rollingMedian.js";
import { BuffersAverage } from "../buffersAverage.js";
import { GaussianWindow } from "../window.js";
import { Pipeline } from "../pipeline.js";
import { LogMagnitude } from "../logMagnitude.js";
import { AnalyserGraph } from "../graph/analyserGraph.js";
import { Graph } from "../graph/graph.js";
import { NoteCentsFreqLabelManager, NoteCentsFreqLabelStyle } from "../graph/labels.js";
import { LineStyle, TextStyle } from "../graph/style.js";
import { CONFIG } from "../config.js";

/**
 * @param {number} sampleSize
 * @param {number} sampleRate
 * @param {Array<number>} frequencyRange
 * @param {AnalyserGraph} logFFTGraph
 */
export function Analyser(sampleSize, sampleRate, frequencyRange, logFFTGraph) {
    function binToFreq(bin) {
        return bin * sampleRate / sampleSize;
    }

    function freqToBin(freq) {
        return Math.ceil(freq * sampleSize / sampleRate);
    }

    const labelStyle = new NoteCentsFreqLabelStyle(
        new TextStyle(
            CONFIG.get("graph.peeks.noteStyle.font").asString(),
            CONFIG.get("graph.peeks.noteStyle.fontSize").toPxUIScaled() + "px",
            CONFIG.get("graph.peeks.noteStyle.color").asString()),
        new TextStyle(
            CONFIG.get("graph.peeks.centsStyle.font").asString(),
            CONFIG.get("graph.peeks.centsStyle.fontSize").toPxUIScaled() + "px",
            CONFIG.get("graph.peeks.centsStyle.color").asString()),
        new TextStyle(
            CONFIG.get("graph.peeks.freqStyle.font").asString(),
            CONFIG.get("graph.peeks.freqStyle.fontSize").toPxUIScaled() + "px",
            CONFIG.get("graph.peeks.freqStyle.color").asString()),

        CONFIG.get("graph.peeks.spacing").toPxUIScaled(),
        CONFIG.get("graph.peeks.line.color").asString(),
        CONFIG.get("graph.peeks.line.width").toPxUIScaled()
    )
    //NoteCentsFreqLabelStyle.defaultStyle.clone();

    // labelStyle.spacing = [5, 7, 7, 7];
    // labelStyle.freq.font = "0.9rem Oswald";
    const labels = new NoteCentsFreqLabelManager(logFFTGraph, labelStyle, "analyser-label");
    const noiseFloorStyle = new LineStyle(
        CONFIG.get("graph.style.plot.noiseFloor.width").toPxUIScaled(),
        CONFIG.get("graph.style.plot.noiseFloor.color").asString());
    // const noiseFloorStyle = new LineStyle(2.5, "rgba(50, 84, 200, 0.5)");
    // const pickLineStyle = new LineStyle(2.5, "rgba(150, 4, 90, 0.5)");
    const pickLineStyle = new LineStyle(
        CONFIG.get("graph.style.plot.peeksFloor.width").toPxUIScaled(),
        CONFIG.get("graph.style.plot.peeksFloor.color").asString());
    const magStyle = new LineStyle(
        CONFIG.get("graph.style.plot.magnitude.width").toPxUIScaled(),
        CONFIG.get("graph.style.plot.magnitude.color").asString());

    const processingSize = freqToBin(frequencyRange[1]);
    const fftData = new Float32Array(sampleSize);
    const noiseFloor = new Float32Array(processingSize);
    const peekFloor = new Float32Array(processingSize);
    const logMag = new Float32Array(processingSize);

    const windowTransform = new GaussianWindow(sampleSize, 0.35);
    const fftPipeline = new Pipeline([windowTransform, new FFT(sampleSize)]);
    const logMagPipeline = new Pipeline([new BuffersAverage(processingSize, 3), new LogMagnitude(20, windowTransform.sum / 2)]);
    const noiseFloorPipeline = new Pipeline([new RollingMedian(sampleSize / 512), new MovingAverage(Math.round(sampleSize / 512))]);

    const wavefftxs = new Float32Array(processingSize);

    for (let i = 0; i < processingSize; i++)
        wavefftxs[i] = binToFreq(i);

    const peekFinder = new PeekFinder(1);
    const peekFreqFilter = new FrequencyPeeksFilter();
    const peekInterpolator = new QuadraticPeekInterpolator();
    const notes = [];
    Note.A4Freq = CONFIG.getOrDefault("music.a4", () => 440).asNumber();
    for (let note = Note.parse('C1'), limit = Note.parse('C8'); note.midiNumber <= limit.midiNumber; note = note.add(1))
        notes.push(note);

    let peekHeight = CONFIG.get("analyser.peeks.minHeight").asNumber();
    let plotNoiseFloor = CONFIG.get("graph.plotNoiseFloor").asBool();
    let plotPeeksMinHeight = CONFIG.get("graph.plotPeeksMinHeight").asBool();
    /**
     * @param {numer} freq
     * @returns {Note}
     */
    function findClosestNote(freq) {
        return notes.reduce((/**@type {Note}*/a, /**@type {Note}*/b) => (Math.abs(a.frequency() - freq) < Math.abs(b.frequency() - freq)
            ? a : b));
    }
    /**
     * @param {Float32Array} waveData
     */
    this.update = function (waveData) {
        fftData.set(waveData);
        fftPipeline.apply(fftData);
        logMag.set(fftData.subarray(0, processingSize));
        logMagPipeline.apply(logMag);
        logFFTGraph.clearPlot();
        labels.reuseAll();
        noiseFloor.set(logMag);
        noiseFloorPipeline.apply(noiseFloor);
        Transform.transform(noiseFloor, v => v + 0.002);
        peekFloor.set(noiseFloor);
        Transform.transform(peekFloor, v => v + peekHeight);

        const peeks = [];
        peekFreqFilter.reset();

        logFFTGraph.plotData(wavefftxs, logMag, 1, magStyle);

        if (plotNoiseFloor)
            logFFTGraph.plotData(wavefftxs, noiseFloor, 1, noiseFloorStyle);
        if (plotPeeksMinHeight)
            logFFTGraph.plotData(wavefftxs, peekFloor, 1, pickLineStyle);

        peekFinder.forEachPeek(logMag, (bin, value) => {
            if (logMag[bin] - peekFloor[bin] < 0)
                return;

            const ip = peekInterpolator.interpolatePeek(logMag[bin - 1], logMag[bin], logMag[bin + 1]);
            const peekFreq = binToFreq(bin + ip);

            peekFreqFilter.handlePeek(peekFreq, value);
        });

        peekFreqFilter.forEachPeek((peekFreq) => {
            if (peekFreq > frequencyRange[1] || peekFreq < frequencyRange[0])
                return;

            let note = findClosestNote(peekFreq);
            let centInterval = Math.round(Note.intervalInCents(note.frequency(), peekFreq.toFixed(1)));
            if (centInterval >= 100)
                return;

            labels.addLabel(peekFreq, {
                note: note._name.toLowerCase() + note.octave,
                cents: (centInterval < 0 ? "" : "+") + centInterval,
                freq: peekFreq.toFixed(1)
            });

            peeks.push(peekFreq);
        });
        labels.cleanNotUsed();
    }
}
