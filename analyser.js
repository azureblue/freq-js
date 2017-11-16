function Analyser(sampleSize, sampleRate, waveGraph, logFFTGraph, noteIndicator) {
    const fftTransform = new FFT(sampleSize);
    const magData = new Float32Array(sampleSize);
    const windowTransform = new GaussianWindow(sampleSize, 0.4);
    const windowSum = windowTransform.sum;
    const magAverage = new BuffersAverage(sampleSize, 4);
    const logMag = new Float32Array(sampleSize / 2);
    const noiseFloor = new Float32Array(sampleSize / 2);

    const median = new RollingMedian(sampleSize / 512);
    const longAvg = new MovingAverage(Math.round(sampleSize / 512));
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

    this.update = function (waveData) {
        windowTransform.apply(waveData);
        copyElements(waveData, magData);
        fftTransform.apply(magData);
        magAverage.apply(magData);
        waveGraph.drawScales();
        waveGraph.plotData(wavexs, waveData);
        logFFTGraph.drawScales();
        for (let i = 0; i < sampleSize / 2; i++)
            logMag[i] = 20 * Math.log10(magData[i] / (windowSum / 2));
        logFFTGraph.plotData(wavefftxs, logMag);
        copyElements(logMag, noiseFloor);
        median.apply(noiseFloor);
        longAvg.apply(noiseFloor);
        transformInPlace(noiseFloor, v => v + 0.002);
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