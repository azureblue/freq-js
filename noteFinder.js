import { Note } from "./music.js";

export function NoteFinder() {
    this.minAdjacentHarmonicsNum = 3;
    this.minHarmonicsNum = 4;
    this.harmonicsToCheck = 7;

    function findClosestPeek(peeks, freq, from = 0, to = peeks.length) {
        let best = undefined;
        let dist = Number.MAX_VALUE;
        let a = from, b = to;
        while (b > a) {
            const mid = (a + b) / 2 | 0;
            const diff = Note.intervalInCents(freq, peeks[mid]);
            if (Math.abs(diff) < Math.abs(dist))
                [dist, best] = [diff, mid];
            if (diff < 0)
                a = mid + 1;
            else
                b = mid;
        }
        return best !== undefined ? {idx: best, value: peeks[best], dist: dist} : undefined;
    }

    this.findBestNote = function (peeks, notes) {
        const hLength = this.harmonicsToCheck;
        let bestNote = undefined;
        let bestDiff = 0;
        let bestScore = 0;
        if (peeks.length === 0)
            return undefined;
        notes.forEach(no => {
                const harmonicsPeeks = new Array(hLength);
                let harmonicsPresentNum = 0;
                for (let h = 0; h < hLength; h++) {
                    let hFreq = no.frequency(h);
                    const peek = findClosestPeek(peeks, hFreq);

                    if (Math.abs(peek.dist) < 50) {
                        harmonicsPeeks[h] = peek;
                        harmonicsPresentNum++;
                    }
                }
                if (harmonicsPresentNum < this.minHarmonicsNum)
                    return;

                let adjHarmonicsPresent = 0;

                for (let i = 1; i < harmonicsPeeks.length; i++)
                    if (harmonicsPeeks[i] && harmonicsPeeks[i - 1]) {
                        const peekA = harmonicsPeeks[i - 1];
                        const peekB = harmonicsPeeks[i];
                        const midFreq = (peekB.value + peekA.value) / 2;
                        const midPeek = findClosestPeek(peeks, midFreq, peekA.idx + 1, peekB.idx - 1);
                        if (midPeek && midPeek.dist < 20)
                            continue;
                        adjHarmonicsPresent++;
                    }

                if (adjHarmonicsPresent < this.minAdjacentHarmonicsNum)
                    return;

                const score = harmonicsPresentNum + adjHarmonicsPresent * 1.5;
                if (score > bestScore) {
                    let centDistSum = 0;
                    let presetHarmsCount = 0;
                    for (let i = 0; i < harmonicsPeeks.length; i++)
                        if (harmonicsPeeks[i] !== undefined) {
                            centDistSum += harmonicsPeeks[i].dist;
                            presetHarmsCount++;
                        }
                    bestDiff = centDistSum / presetHarmsCount;
                    bestScore = score;
                    bestNote = no;
                }
            }
        );

        return bestNote !== undefined ? {
            note: bestNote,
            avgCentDiff: bestDiff
        } : undefined;
    }
}
