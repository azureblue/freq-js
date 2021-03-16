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

export function Analyser(sampleSize, sampleRate, waveGraph, logFFTGraph, noteIndicator) {
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
    for (let note = Note.parse('C1'), limit = Note.parse('C7'); note.midiNumber < limit.midiNumber; note = note.add(1))
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
        waveGraph.drawScales();
        waveGraph.plotData(wavexs, waveData);
        logFFTGraph.drawScales();
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
            logFFTGraph.plotVerticalLine(peekFreq, peekFreq.toFixed(1));
            peeks.push(peekFreq);
        });
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
    }
}