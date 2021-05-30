const SQRT12 = 1.059463094359295264561825;

export class Note {

    /**
     * @param str
     * @returns {Note}
     */
    static parse(str) {
        if (!/^[a-h]\d?[b#]?$/.test(str.toLowerCase()))
            throw "invalid note name: " + str;
        let idx = 0;
        let halftones = Note.halftonesMap[str[idx++].toLowerCase()];
        let octave = /\d/.test(str[idx]) ? parseInt(str[idx++]) : Note.defaultOctave;

        let sharps = true;
        if (str[idx]) {
            if (str[idx] === "#")
                halftones++;
            else {
                sharps = false;
                halftones--;
            }
        }
        return new Note(octave, halftones, sharps);
    }

    static intervalInCents(freqA, freqB) {
        return 1200 * Math.log(freqB / freqA) / Math.log(2);
    }

    constructor(octave, halftones, sharps = true) {
        this._preferSharps = sharps;
        this._name = (this._preferSharps ? Note.noteNames.sharps : Note.noteNames.flats)[halftones];
        this._noteIdx = octave * 12 + halftones;
        this._frequency = Note.A4Freq * Math.pow(SQRT12, this._noteIdx - Note.A4IdxNumber);
    }

    get midiNumber() {
        return this._noteIdx;
    }

    get halftones() {
        return this._noteIdx % 12;
    }

    get octave() {
        return this._noteIdx / 12 | 0;
    }

    get preferSharps() {
        return this._preferSharps;
    }

    get name() {
        return this._name + this.octave;
    }

    get halftonesToC() {
        return 12 - this.halftones;
    }

    frequency(harmonic = 0) {
        return this._frequency * (harmonic + 1);
    }

    /**
     * @param halftones {number}
     * @param preferSharps {boolean}
     * @returns {Note}
     */
    add(halftones, preferSharps = this.preferSharps) {
        let ht = this.halftones + halftones;
        return new Note(this.octave + (ht / 12 | 0), ht % 12, preferSharps);
    }
}

Note.A4IdxNumber = 57;
Note.A4Freq = 440;
Note.centRatio = 1.0005777895065548;
Note.defaultOctave = 4;
Note.noteNames = {
    sharps: ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'h'],
    flats: ['c', 'db', 'd', 'ed', 'e', 'f', 'gd', 'g', 'ad', 'a', 'hd', 'h']
};
Note.halftonesMap = {
    c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, h: 11, b: 11
};
