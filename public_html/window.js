class Transform {
    apply(src, dst) {
    };
}


class BinaryTransform {
    apply(src1, src2, dst) {
    };
}

class ComparatorTransform extends BinaryTransform {
    constructor(nullValue) {
        super();
        this.nv = nullValue;
    }

    apply(src, threshold, dst) {
        const len = src.length;
        for (let i = 0; i < len; i++)
            dst[i] = src[i] < threshold[i] ? this.nv : src[i];
    }
}

class MovingAverage extends Transform {
    constructor(spread) {
        super();
        this.spread = spread;
    }

    apply(src, dst) {
        const len = src.length;
        const spread = this.spread;
        const n = spread * 2 + 1;

        var acc = 0;
        for (let i = 0; i < spread; i++)
            acc += src[i];

        for (let i = 0; i < spread + 1; i++) {
            acc += src[spread + i];
            dst[i] = acc / (spread + 1 + i);
        }

        for (let i = spread + 1; i < len - spread; i++) {
            acc = acc - src[i - spread - 1] + src[i + spread];
            dst[i] = acc / n;
        }

        for (let i = 0; i < spread; i++) {
            acc -= src[len - n + i];
            dst[len - spread + i] = acc / (n - (i + 1));
        }
    }
}


class Window extends Transform {

    get size() {
        return this._size;
    }

    constructor(size) {
        super();
        this._size = size;
    }

    apply(src, dst) {
        const len = this.size;
        for (let i = 0; i < len; i++)
            dst[i] = this.weightFunction(i) * src[i];
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
        return 1 - (0.54 + 0.46 * Math.cos((2 * Math.PI * n) / (N - 1)))
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
            note.harmonicFrequency(5)
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
        this.harmonicWeights = [2, 1, 1, 1, 1];
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
        var bestAvgCentDiff = null;
        let bestScore = 0;
        this.notes.forEach((no, idx) => {
            const harmonicsPresent = [undefined, undefined, undefined, undefined, undefined, undefined];
            let harmonicsPresentNum = 0;
            let hs = this.harmonics[idx].harmonics;
            hs.forEach((h, hidx) => {
                const bestPeek = peeks[this.findIdxClosestByCents(peeks, h)];
                const centDiff = Note.intervalInCents(h, bestPeek);
                if (Math.abs(centDiff) < 50)
                    harmonicsPresent[hidx] = centDiff, harmonicsPresentNum++;
            });
            // if (harmonicsPresentNum === 0)
            //     return;
            // if (harmonicsPresentNum === 1 && !harmonicsPresent[0])
            //     return;
            if (harmonicsPresentNum < 4)
                return;
            const score = harmonicsPresentNum;
            if (score > bestScore) {
                bestAvgCentDiff = 0;
                for (let i = 0; i < harmonicsPresent.length; i++)
                    if (harmonicsPresent[i] !== undefined)
                        bestAvgCentDiff += harmonicsPresent[i];
                bestAvgCentDiff /= harmonicsPresent.length;
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

        return {note: bestNote, avgCentDiff: bestAvgCentDiff} ;
    }
}
