class Window extends Transform {

    get size() {
        return this._size;
    }

    constructor(size) {
        super();
        this._size = size;
    }

    apply(data) {
        const len = this.size;
        for (let i = 0; i < len; i++)
            data[i] = this.weightFunction(i) * data[i];
    }

    get sum() {
        var windowSum = 0;
        for (let i = 0; i < this.size; i++)
            windowSum += this.weightFunction(i);
        return windowSum;
    }

    weightFunction(n) {
    };
}

class HanningWindow extends Window {
    constructor(N) {
        super(N);
    }

    weightFunction(n) {
        return 1 - (0.54 + 0.46 * Math.cos((2 * Math.PI * n) / (this.size - 1)))
    };
}

class GaussianWindow extends Window {
    constructor(N, sigma) {
        super(N);
        this.N = N;
        this.sigma = sigma;
    }

    weightFunction(n) {
        const ex = ((n - (this.N - 1) / 2) / (this.sigma * (this.N - 1) / 2));
        return Math.exp(-0.5 * (ex * ex));
    };
}

class QuadraticPeekInterpolator {
    interpolatePeek(l, c, r) {
        return 0.5 * ((l - r) / (l - 2 * c + r));
    }
}

class PeekFinder {
    forEachPeek(data, peekHandler) {
        const len = data.length;
        for (let i = 1; i < len - 1; i++)
            if (data[i - 1] < data[i] && data[i] > data[i + 1]) {
                peekHandler(i, data[i]);
            }

    }
}

class Harmonics {
    constructor(note) {
        this.harmonics = [
            note.harmonicFrequency(0),
            note.harmonicFrequency(1),
            note.harmonicFrequency(2),
            note.harmonicFrequency(3),
            note.harmonicFrequency(4),
            note.harmonicFrequency(5),
            note.harmonicFrequency(6),
            note.harmonicFrequency(7),
            note.harmonicFrequency(8),
        ]
    }

    harmonic(i) {
        return this.harmonics[i];
    }
}

class NoteFinder {

    constructor(notes) {
        this.notes = notes;
        this.harmonics = notes.map(no => new Harmonics(no));
        this.harmonicWeights = [2, 1, 1, 1, 1, 1, 1, 1];
    }
    
    findIdxClosestByCents(arr, freq) {
        const len = arr.length;
        let best = undefined;
        let dist = Number.MAX_VALUE;
        for (let i = 0; i < len; i++) {
            const cents = Math.abs(Note.intervalInCents(freq, arr[i]));
            if (cents < dist) {
                dist = cents;
                best = i;
            }
        }
        return best;
    }

    findNote(peeks) {
        const len = peeks.length;
        peeks = peeks.sort();
        let bestNote = null;
        let bestDiff = 0;
        let bestScore = 0;
        this.notes.forEach((no, idx) => {
            const harmonicsPresent = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined];
            let harmonicsPresentNum = 0;
            let hs = this.harmonics[idx].harmonics;
            hs.forEach((h, hidx) => {
                const peekIdx = this.findIdxClosestByCents(peeks, h);
                const bestPeek = peeks[peekIdx];
                const centDiff = Note.intervalInCents(h, bestPeek);
                if (Math.abs(centDiff) < 50) {
                    harmonicsPresent[hidx] = {
                        diff: centDiff,
                        peekIdx: peekIdx
                    };
                    harmonicsPresentNum++;
                }
            });
            if (harmonicsPresentNum < 4)
                return;
            let adjHarmonicsPresent = 0;
            
            harms:
            for (let i = 1; i < harmonicsPresent.length; i++)
                if (harmonicsPresent[i] && harmonicsPresent[i - 1]) {
                    const peekA = harmonicsPresent[i - 1].peekIdx;
                    const peekB = harmonicsPresent[i].peekIdx;
                    const midFreq = (peeks[peekB] - peeks[peekA]) / 2 + peeks[peekA];
                    for (let peek = peekA; peek < peekB; peek++) {
                        if (Note.intervalInCents(peeks[peek], midFreq) < 20)
                            continue harms;
                    }
                    adjHarmonicsPresent++;
                }
            if (adjHarmonicsPresent < 3)
                return;
            
            const score = harmonicsPresentNum + adjHarmonicsPresent;
            if (score > bestScore) {
                harmonicsPresent
                let centDiffSum = 0;
                let presetHarmsCount = 0;
                for (let i = 0; i < harmonicsPresent.length; i++)
                    if (harmonicsPresent[i] !== undefined) {
                        centDiffSum += harmonicsPresent[i].diff;
                        presetHarmsCount++;
                    }
                bestDiff = centDiffSum / presetHarmsCount;
                bestScore = score;
                bestNote = no;
            }
        });
        // this.notes.forEach((no, idx) => {
        //     let score = this.harmonicWeights
        //         .map((w, hidx) => peeks.reduce((acc, current) => {
        //             let dist = Math.abs(Note.intervalInCents(this.harmonics[idx].harmonic(hidx), current));
        //             return dist < acc ? dist : acc;
        //         }, Number.MAX_VALUE) * w).reduce((a, b) => a + b);
        //     if (score < bestScore) {
        //         bestScore = score;
        //         bestNote = no;
        //     }
        // });

        return {note: bestNote, avgCentDiff: bestDiff} ;
    }
}
