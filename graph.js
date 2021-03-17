export class GraphBase {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this._canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }

    get width() {
        return this._canvas.width;
    }

    get height() {
        return this._canvas.height;
    }

    updateSizeAndClean() {
        this._canvas.width = this._canvas.clientWidth;
        this._canvas.height = this._canvas.clientHeight;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}

export class GraphScale {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    normalize(value) {

    }
}

export class AxisTicks {
    /**
     * @param {Array<number>} value
     * @param {Array<string>} label
     * @param {Array<number>} keyValues
     */
    constructor(values, labels, keyValues) {
        /** @type {Array<number>} */
        this.values = values;
        /** @type {Array<string>} */
        this.labels = labels;
        /** @type {Array<number>} */
        this.keyValues = keyValues;
    }

    add(value, label) {
        this.values.push(value);
        this.labels.push(label);
        return this;
    }
}

export const AxisTicksGenerator = {
    sequence: function (from, to, interval) {
        return [...function* () {
            for (; from <= to; from += interval)
                yield from;
        }()];
    },

    useKPrefix: /**@param {number} value*/ value =>
        value < 1000 ? "" + value : "" + (value / 1000).toFixed(1) + "k",

    /**
     *
     * @param {number} from
     * @param {number} to
     * @param {number} interval
     * @param {Array<number>} keyValues
     * @param {function} valueToLabelMapping
     * @param {number} decimalPlaces
     */
    generateLinearTicks: function (from, to, interval, keyValues, valueToLabelMapping = (v) => "" + v) {
        const values = this.sequence(from, to, interval);
        return new AxisTicks(values, values.map(valueToLabelMapping), keyValues);
    },

    /**
     *
     * @param {number} from
     * @param {number} to
     * @param {number} interval
     * @param {Array<number>} keyValues
     * @param {function} valueToLabelMapping
     * @param {number} decimalPlaces
     */
    generateLog10ScaleTicks: function (min, max, valueToLabelMapping = (/** @type {Number}*/ v) => "" + v) {
        const values = [...function* () {
            for (let tick = 1; tick < 9; tick++) {
                if (tick >= min && tick <= max)
                    yield tick;
            }

            for (let exp = 10; exp <= 10000; exp = exp * 10) {
                let tick = exp;
                for (let i = 0; i < 9; i++) {
                    if (tick >= min && tick <= max)
                        yield tick;
                    tick += exp;
                }
            }
        }()];
        const keyValues = [1, 10, 100, 1000, 10000, 100000]
        return new AxisTicks(values, values.map(valueToLabelMapping), keyValues);
    }

};

export class LinearScale extends GraphScale {
    constructor(min, max) {
        super(min, max);
    }

    normalize(value) {
        return (value - this.min) / (this.max - this.min)
    }
}

export class LogarithmicScale extends GraphScale {
    constructor(min, max) {
        super(min, max);
        this._minLog = Math.log10(this.min);
        this._logDiff = Math.log10(this.max) - this._minLog;
    }

    normalize(value) {
        let logValue = Math.log10(value);
        return (logValue - this._minLog) / this._logDiff;
    }
}

export class NoteIndicator extends GraphBase {
    constructor(canvas) {
        super(canvas);
    }

    drawNote(note, centDiff) {
        const ctx = this.ctx;
        this.updateSizeAndClean();
        let noteName = note.name.toUpperCase(), goalFrequency = note.frequency();
        goalFrequency = "" + goalFrequency.toFixed(2) + " Hz";
        let centDiffLabel = "" + centDiff.toFixed(2) + " cents";

        ctx.save();
        ctx.font = '20px sans-serif';
        ctx.tick = 1;
        ctx.strokeStyle = 'rgb(200, 200, 200)';
        ctx.fillStyle = 'rgb(100, 100, 100)';

        const textHeight = ctx.measureText("#").width + 5;
        const absCentDiff = Math.abs(centDiff);

        ctx.fillText(noteName, this.width / 2 - ctx.measureText(noteName).width / 2, textHeight);
        ctx.font = '15px sans-serif';
        ctx.fillText(goalFrequency, this.width / 2 - ctx.measureText(goalFrequency).width / 2, textHeight * 2);
        ctx.fillText(centDiffLabel, this.width / 2 - ctx.measureText(centDiffLabel).width / 2, textHeight * 3);
        ctx.fillRect(this.width / 2, textHeight * 4, centDiff / 50 * this.width / 2, this.height - textHeight * 5);
        ctx.restore();
    }
}
