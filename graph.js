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
}

export const AxisTicksGenerator = {
    sequence: function (from, to, interval) {
        return [...function* () {
            for (; from <= to; from += interval)
                yield from;
        }()];
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

export class Graph extends GraphBase {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {GraphScale} xscale
     * @param {GraphScale} yscale
     * @param {AxisTicks} xticks
     * @param {AxisTicks} yticks
     */
    constructor(canvas, xscale, yscale, xticks, yticks) {
        super(canvas);

        let prepareCtx = () => {
            ctx.strokeStyle = this.gridStyle;
            ctx.font = this.font;
        };

        this.font = '0.9rem sans-serif';
        this.gridWidth = 1;
        this.gridStyle = 'rgb(200, 200, 200)';
        this.gridKeyStyle = 'rgb(150, 150, 150)';
        this.plotStyle = 'rgb(100, 100, 100)';
        this.labelMargin = 4;
        this.margin = 2;

        const ctx = this.ctx;
        const measureWidth = text => ctx.measureText("" + text).width;
        //noinspection JSSuspiciousNameCombination
        prepareCtx();
        const textHeight = ctx.measureText("#").width;
        const maxYLabelWidth = Math.max(...(yticks.labels).map(measureWidth));
        const maxXLabelWidth = Math.max(...(xticks.labels).map(measureWidth));
        const graphXPadding = maxYLabelWidth + this.labelMargin * 2;
        const graphYPadding = textHeight * 2 + this.labelMargin * 2;
        let graphRect = { x: 0, y: 0, width: 0, height: 0 };
        let xpos = xv => Math.round(xscale.normalize(xv) * graphRect.width);
        let ypos = yv => Math.round(graphRect.height - yscale.normalize(yv) * graphRect.height);
        const xKeyTicks = new Set();
        const yKeyTicks = new Set();
        xticks.keyValues.forEach(t => xKeyTicks.add(t));
        yticks.keyValues.forEach(t => yKeyTicks.add(t));

        let updateGraphRect = () => {
            graphRect.x = this.margin + graphXPadding;
            graphRect.y = this.margin + this.labelMargin + textHeight / 2;
            graphRect.width = this.width - graphXPadding - this.margin * 2;
            graphRect.height = this.height - graphYPadding - this.margin * 2;
        };

        this.drawScales = function () {
            this.updateSizeAndClean();
            updateGraphRect();
            ctx.save();
            prepareCtx();
            ctx.translate(graphRect.x, graphRect.y);

            yticks.values.forEach((v, idx) => {
                ctx.beginPath();
                const label = yticks.labels[idx];
                let labWidth = measureWidth(label);
                let y = ypos(v);
                if (yKeyTicks.has(v)) {
                    ctx.strokeStyle = this.gridKeyStyle;
                } else {
                    ctx.strokeStyle = this.gridStyle;
                }
                ctx.moveTo(0, y);
                ctx.lineTo(graphRect.width, y);
                ctx.fillText(label, -labWidth - this.labelMargin, y + textHeight / 2);
                ctx.stroke();
            });

            let lastEnd = -1000;

            xticks.values.forEach((v, idx) => {
                ctx.beginPath();
                const label = xticks.labels[idx];
                let labWidth = measureWidth(label);
                let x = xpos(v);
                if (xKeyTicks.has(v)) {
                    ctx.strokeStyle = this.gridKeyStyle;
                } else {
                    ctx.strokeStyle = this.gridStyle;
                }
                ctx.moveTo(x, 0);
                ctx.lineTo(x, graphRect.height);
                let labelStartX = x - labWidth / 2;
                if (labelStartX - lastEnd > 5) {
                    ctx.fillText(label, labelStartX, graphRect.height + textHeight + this.labelMargin);
                    lastEnd = labelStartX + labWidth;
                }
                ctx.stroke();
            });

            ctx.restore();
        };

        this.plotData = function (xs, ys) {
            let len = xs.length;
            ctx.save();
            prepareCtx();
            ctx.strokeStyle = this.plotStyle;
            ctx.translate(graphRect.x, graphRect.y);
            ctx.beginPath();
            ctx.rect(0, 0, graphRect.width, graphRect.height);
            ctx.clip();
            ctx.beginPath();
            ctx.moveTo(xpos(xs[0]), ypos(ys[0]));
            for (let i = 1; i < len; i++)
                ctx.lineTo(xpos(xs[i]), ypos(ys[i]));
            ctx.stroke();
            ctx.restore();
        };

        this.plotVerticalLine = function (x, label) {
            let xp = xpos(x);
            if (xp < 0 || xp > graphRect.width)
                return;
            ctx.save();
            prepareCtx();
            let lw = measureWidth(label);
            ctx.translate(graphRect.x, graphRect.y);
            ctx.beginPath();
            ctx.moveTo(xp, lw);
            ctx.lineTo(xp, graphRect.height);
            ctx.stroke();
            if (label !== undefined) {
                ctx.translate(xp, 0);
                ctx.rotate(Math.PI / 2);
                ctx.fillText(label, 1, textHeight / 2);
            }
            ctx.restore();
        };
    }
}
