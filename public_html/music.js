SQRT12 = 1.059463094359295264561825;

class Note {
    static parse(s) {
        let halftonesFromC = 0;
        let sharped = false;
        let flatted = false;
        switch (s.substring(0, 1)) {
            case 'C':
                halftonesFromC = 0;
                break;
            case 'D':
                halftonesFromC = 2;
                break;
            case 'E':
                halftonesFromC = 4;
                break;
            case 'F':
                halftonesFromC = 5;
                break;
            case 'G':
                halftonesFromC = 7;
                break;
            case 'A':
                halftonesFromC = 9;
                break;
            case 'H':
                halftonesFromC = 11;
                break;
        }
        let octave = parseInt(s.substring(1, 2));
        if (s.length === 3) {
            if (s.substring(2, 3) === "#") halftonesFromC++, sharped = true;
            else halftonesFromC--, flatted = true;
        }
        return new Note(octave, halftonesFromC, flatted);
    }

    constructor(octave, halftonesFromC, preferFlatted) {
        this.octave = octave;
        this.halftonesFromC = halftonesFromC;
        this.sharped = false;
        this.flated = false;
        this.preferFlatted = preferFlatted;
        if (halftonesFromC === 1 ||
            halftonesFromC === 3 ||
            halftonesFromC === 6 ||
            halftonesFromC === 8 ||
            halftonesFromC === 10)
            if (preferFlatted) this.flated = true;
            else this.sharped = true;
        this.halftonesFromC = halftonesFromC;
        this._frequency = 440 * Math.pow(SQRT12, Note.distanceInHalftones(Note.A4O, Note.A4HFC, octave, halftonesFromC));
    }

    get midiNumber() {
        return (this.octave + 1) * 12 + this.halftonesFromC;
    }

    static intervalInCents(freq1, freq2) {
        return 1200 * Math.log(freq2 / freq1) / Math.log(2);
    }

    harmonicFrequency(harmonic) {
        return Note.harmonicFrequency(this.frequency, harmonic);
    }

    static harmonicFrequency(frequency, harmonic) {
        if (harmonic === 0) return frequency;
        switch (harmonic) {
            case 1:
                return frequency * 2;
            case 2:
                return (frequency * 2) * Math.pow(Note.centRatio, 702);
            case 3:
                return frequency * 4;
            case 4:
                return (frequency * 4) * Math.pow(Note.centRatio, 386.3);
            case 5:
                return (frequency * 4) * Math.pow(Note.centRatio, 702.3);
            case 6:
                return (frequency * 4) * Math.pow(Note.centRatio, 968.8);
            case 7:
                return (frequency * 8);
            default:
                return -1;
        }
    }

    distanceInHalftones(note) {
        return distanceInHalftones(this.octave, this.halftonesFromC, note.octave, note.halftonesFromC);
    }

    static distanceInHalftones(n1o, n1hfc, n2o, n2hfc) {
        return (n2o - n1o) * 12 + n2hfc - n1hfc;
    }


    get name() {
        let h = this.halftonesFromC;
        if (this.sharped) h--;
        if (this.flated) h++;
        let name = '';
        switch (h) {
            case 0:
                name = "C";
                break;
            case 2:
                name = "D";
                break;
            case 4:
                name = "E";
                break;
            case 5:
                name = "F";
                break;
            case 7:
                name = "G";
                break;
            case 9:
                name = "A";
                break;
            case 11:
                name = "H";
                break;
        }
        if (this.flated) return "" + name + this.octave + "b";
        if (this.sharped) return "" + name + this.octave + "#";
        return "" + name + this.octave;
    }

    get halftonesToC() {
        return 12 - this.halftonesFromC;
    }

    get frequency() {
        return this._frequency;
    }

    get pianoKey() {
        return this.midiNumber - 32;
    }

    note(halftonesDifference) {
        let hfc = this.halftonesFromC;
        let octave = this.octave;
        if (halftonesDifference > 0) {
            while (halftonesDifference > 0) {
                hfc++;
                if (hfc === 12) {
                    hfc = 0;
                    octave++;
                }
                halftonesDifference--;
            }
        } else {
            while (halftonesDifference !== 0) {
                hfc--;
                if (hfc === -1) {
                    hfc = 11;
                    octave--;
                }
                halftonesDifference++;
            }

        }
        return new Note(octave, hfc, this.preferFlatted);
    }

}

Note.A4O = 4;
Note.A4HFC = 9;
Note.centRatio = 1.0005777895065548;
