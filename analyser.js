import { Transform } from "./transform.js"
import { AverageBuffer, MovingAverage } from "./average.js";
import { FFT } from "./fft.js";
import { Note } from "./music.js";
import { NoteFinder } from "./noteFinder.js";
import { FrequencyPeeksFilter, PeekFinder, QuadraticPeekInterpolator } from "./peeks.js";
import { RollingMedian } from "./rollingMedian.js";
import { BuffersAverage } from "./buffersAverage.js";
import { GaussianWindow } from "./window.js";
import { Pipeline } from "./pipeline.js";
import { LogMagnitude } from "./logMagnitude.js";
import { Graph } from "./analyserGraph.js";

/**
 * @param {number} sampleSize
 * @param {number} sampleRate
 * @param {Array<number>} frequencyRange
 * @param {Graph} logFFTGraph
 */
export function Analyser(sampleSize, sampleRate, frequencyRange, logFFTGraph) {
    function binToFreq(bin) {
        return bin * sampleRate / sampleSize;
    }

    function freqToBin(freq) {
        return Math.ceil(freq * sampleSize / sampleRate);
    }

    const processingSize = freqToBin(frequencyRange[1]);
    const fftData = new Float32Array(sampleSize);
    const noiseFloor = new Float32Array(processingSize);
    const logMag = new Float32Array(processingSize);

    const windowTransform = new GaussianWindow(sampleSize, 0.35);
    const fftPipeline = new Pipeline([windowTransform, new FFT(sampleSize)]);
    const logMagPipeline = new Pipeline([new BuffersAverage(processingSize, 2), new LogMagnitude(20, windowTransform.sum / 2)]);
    const noiseFloorPipeline = new Pipeline([new RollingMedian(sampleSize / 512), new MovingAverage(Math.round(sampleSize / 512))]);

    const wavefftxs = new Float32Array(processingSize);

    for (let i = 0; i < processingSize; i++)
        wavefftxs[i] = binToFreq(i);

    const peekFinder = new PeekFinder(1);
    const peekFreqFilter = new FrequencyPeeksFilter();
    const peekInterpolator = new QuadraticPeekInterpolator();
    const notes = [];
    for (let note = Note.parse('C1'), limit = Note.parse('C8'); note.midiNumber <= limit.midiNumber; note = note.add(1))
        notes.push(note);

    const noteFinder = new NoteFinder();
    const noteFinderSmoother = new AverageBuffer(5);
    const peekHeight = 15;

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
        logFFTGraph.drawScales();
        logFFTGraph.plotData(wavefftxs, logMag);
        noiseFloor.set(logMag);
        noiseFloorPipeline.apply(noiseFloor);
        Transform.transform(noiseFloor, v => v + 0.002);
        logFFTGraph.plotData(wavefftxs, noiseFloor, new Graph.LineStyle(2.5, "rgba(50, 84, 200, 0.5)"));
        const peeks = [];
        peekFreqFilter.reset();

        peekFinder.forEachPeek(logMag, (bin, value) => {
            if (logMag[bin] - noiseFloor[bin] - peekHeight < 0)
                return;

            const ip = peekInterpolator.interpolatePeek(logMag[bin - 1], logMag[bin], logMag[bin + 1]);
            const peekFreq = binToFreq(bin + ip);

            peekFreqFilter.handlePeek(peekFreq, value);
        });

        peekFreqFilter.forEachPeek((peekFreq) => {
            if (peekFreq > frequencyRange[1] || peekFreq < frequencyRange[0])
                return;
            // logFFTGraph.plotVerticalLine(peekFreq, peekFreq.toFixed(1));
            let note = findClosestNote(peekFreq);
            let centInterval = Math.round(Note.intervalInCents(note.frequency(), peekFreq.toFixed(1)));
            if (centInterval >= 100)
                return;
            logFFTGraph.plotVerticalLine(new Graph.VerticalLine(peekFreq,
                [
                    new Graph.Label("" + note.name, false),
                    new Graph.Label(centInterval > 0 ? "+" + centInterval : centInterval, false),
                    new Graph.Label(" " + peekFreq.toFixed(1), true, Graph.Label.Placement.TOP,
                        new Graph.TextStyle('0.9rem Oswald', "rgb(100, 100, 100)")
                    )
                ], new Graph.LineStyle(Graph.defaultStyle.plotStyle.width, "#5432a8") ));
            peeks.push(peekFreq);
        });
    }
}