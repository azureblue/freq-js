import { DOMElementOwner, PositionableElement, RectBoundElement as RectBoundElement } from "../base.js";
import { CONFIG, convertToPx } from "../config.js";
import { Rect } from "../geom.js";
import { measureText } from "../utils.js";
import { GraphGrid, GridStyle } from "./grid.js";
import { LabelStyle, LineStyle, TextStyle, Spacing } from "./style.js";


export class RectContainer extends DOMElementOwner {
    constructor() {
        super("div");
        this.element.classList.add("rect-container");
    }
}

export class Label extends PositionableElement {
    /**
     * @param {string} text
     * @param {LabelStyle} labelStyle
     */
    constructor(text, labelStyle) {
        super();
        this.element.classList.add("label");
        this.text = text;
        this.style.font = labelStyle.textStyle.fontString();
        this.style.color = labelStyle.textStyle.color;
        labelStyle.spacing.applyToElement(this.element);

    }

    set text(text) {
        this.element.innerText = text;
        this.updateSize();
    }

    afterAddToDOM() {
        this.updateSize();
    }

    updateSize() {
        let metrics = measureText(this.element.innerText, Label._measureTextCtx);
        const computedStyle = window.getComputedStyle(this.element);
        Label._measureTextCtx.font = computedStyle.font;
        Label._measureTextCtx.fillStyle = computedStyle.color;
        // this.style.height = metrics.height + "px";
        this.style.lineHeight = metrics.height + "px";
    }
}

Label._measureTextCanvas = document.createElement("canvas");
Label._measureTextCtx = Label._measureTextCanvas.getContext("2d");

/** @property {HTMLCanvasElement} element */
export class CanvasElement extends RectBoundElement {
    constructor() {
        super("canvas");
        this.element.classList.add("graph-canvas");
        this.element.id = "" + CanvasElement.id++;
        /**@type {CanvasRenderingContext2D} */
        this.ctx = this.element.getContext("2d");
    }

    updateSize() {
        const scale = Math.min(window.devicePixelRatio, 2);
        this.element.width = this.width * scale;
        this.element.height = this.height * scale;
        this.ctx = this.element.getContext("2d");
        this.ctx.scale(scale, scale);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.element.width, this.element.height);
    }
}

CanvasElement.id = 0;

export class CanvasLayeredElement extends RectBoundElement {
    /**
     * @param {number} layers
     */
    constructor(layers, rounding = false) {
        super("div");
        this.element.classList.add("canvas-layered-element");
        this.layers = [];
        for (let i = 0; i < layers; i++) {
            let canvas = new CanvasElement();
            canvas.rounding = rounding;
            canvas.addToParentOrDOM(this.element);
            this.layers.push(canvas);
        }
    }

    updateSize() {
        this.layers.forEach(layer => {
            layer.x = 0
            layer.y = 0;
            layer.width = this.width;
            layer.height = this.height;
            layer.updateSize()
        });
    }
}

export class Graph extends RectContainer {
    /**
     * @param {GraphScale} xscale
     * @param {GraphScale} yscale
     * @param {AxisTicks} xticks
     * @param {AxisTicks} yticks
     * @param {GraphStyle} style
     */
    constructor(xscale, yscale, xticks, yticks, style = Graph.loadStyle()) {
        super();
        this.svgGrid = new GraphGrid(style.gridStyle);
        this.svgGrid.addToParentOrDOM(this.element);
        this.canvas = new CanvasLayeredElement(2);
        this.canvas.rounding = true;
        this.canvas.addToParentOrDOM(this.element);

        this._updateSizeListeners = [];
        this._xscale = xscale;
        this._yscale = yscale;
        this._xticks = xticks;
        this._yticks = yticks;
        this._style = style;
        this._scalesImageData = null;
        /**@type {Array<GraphLabel>} */
        this._xlabels = [];
        /**@type {Array<GraphLabel>} */
        this._ylabels = [];
        //this.updateSize();
    }

    _createLabel(text) {
        const label = new Label(text, this._style.labelStyle);
        // label.style.font = this._style.textStyle.font;
        // label.style.color = this._style.textStyle.style;
        return label;
    }

    updateSize() {
        super.updateSize();
        this.updateScales();
        this._updateSizeListeners.forEach(l => l());
    }

    addUpdateSizeListener(listenerFunction) {
        this._updateSizeListeners.push(listenerFunction);
    }

    calculateGraphScreenRect() {
        const containerRect = this.getScreenRect();
        return new Rect(containerRect.x + this._graphRect.x, containerRect.y + this._graphRect.y,
            this._graphRect.w, this._graphRect.h);
    }

    updateScales() {
        this._xlabels.forEach(lab => lab.remove());
        this._ylabels.forEach(lab => lab.remove());
        this._xlabels = [];
        this._ylabels = [];

        this._xticks.labels.forEach(labelText => {
            const label = this._createLabel(labelText);
            label.visible = false;
            label.addToParentOrDOM(this.element);
            this._xlabels.push(label);
        });

        this._yticks.labels.forEach(labelText => {
            const label = this._createLabel(labelText);
            label.visible = false;
            label.addToParentOrDOM(this.element);
            this._ylabels.push(label);
        })


        const labelHeight = this._ylabels[0].height;
        const maxYLabelWidth = Math.max(...(this._ylabels).map(label => label.width));
        const graphXPadding = maxYLabelWidth;
        const graphYPadding = labelHeight;// + this._style.tickLabelsMargin * 2;

        this._graphRect = new Rect(0, 0, 0, 0);

        const xKeyTicks = new Set();
        const yKeyTicks = new Set();
        this._xticks.keyValues.forEach(t => xKeyTicks.add(t));
        this._yticks.keyValues.forEach(t => yKeyTicks.add(t));

        this._graphRect.x = this._style.margin + graphXPadding;
        this._graphRect.y = this._style.margin + labelHeight / 2;
        this._graphRect.width = (this.width - this._graphRect.x - this._style.margin);
        this._graphRect.height = (this.height - this._graphRect.y - graphYPadding - this._style.margin);

        this.canvas.x = (this._graphRect.x);
        this.canvas.y = (this._graphRect.y);
        this.canvas.width = (this._graphRect.width);
        this.canvas.height = (this._graphRect.height);
        this.canvas.updateSize();

        this.svgGrid.position(this._graphRect.x, this._graphRect.y);
        this.svgGrid.width = this._graphRect.width;
        this.svgGrid.height = this._graphRect.height;
        let gridPath = [];
        let gridKeyPath = [];

        this.svgGrid.updateSize();

        const ctx = this.canvas.layers[0].ctx;

        gridKeyPath.push(`M 0 0`);
        gridKeyPath.push(`L 0 ${this._graphRect.height}`);
        gridKeyPath.push(`L ${this._graphRect.width} ${this._graphRect.height}`);
        gridKeyPath.push(`L ${this._graphRect.width} 0`);
        gridKeyPath.push(`L 0 0`);

        this._yticks.values.forEach((v) => {
            if (v < this._yscale.min || v > this._yscale.max)
                return;
            ctx.beginPath();
            let y = this.ypos(v);
            if (yKeyTicks.has(v)) {
                gridKeyPath.push(`M 0 ${y}`);
                gridKeyPath.push(`L ${this._graphRect.width} ${y}`);
                // this._style.gridKeyStyle.apply(ctx);
            } else {
                gridPath.push(`M 0 ${y}`);
                gridPath.push(`L ${this._graphRect.width} ${y}`);
                // this._style.gridStyle.apply(ctx);
            }
            // gridPath += "M 0 " + y + " ";
            // ctx.moveTo(0, y);
            // gridPath += "L " + this._graphRect.width + " " + y + " ";
            // ctx.lineTo(this._graphRect.width, y);
            // ctx.stroke();
        });

        this._xticks.values.forEach((v) => {
            if (v < this._xscale.min || v > this._xscale.max)
                return;
            ctx.beginPath();
            let x = this.xpos(v);
            if (xKeyTicks.has(v)) {
                // this._style.gridKeyStyle.apply(ctx);
                gridKeyPath.push(`M ${x} 0`);
                gridKeyPath.push(`L ${x} ${this._graphRect.height}`);
            } else {
                gridPath.push(`M ${x} 0`);
                gridPath.push(`L ${x} ${this._graphRect.height}`);
            }
        });

        this.svgGrid.gridKeyLinesPath.setAttributeNS(null, "d", gridKeyPath.join(" "));
        this.svgGrid.gridLinesPath.setAttributeNS(null, "d", gridPath.join(" "));

        this._yticks.values.forEach((v, idx) => {
            if (v < this._yscale.min || v > this._yscale.max)
                return;
            const label = this._ylabels[idx];
            let labWidth = label.width;
            let y = this.ypos(v);
            // if (yKeyTicks.has(v)) {
            //     this._style.gridKeyStyle.apply(ctx);
            // } else {
            //     this._style.gridStyle.apply(ctx);
            // }
            label.position(-labWidth + this._graphRect.x1, this._graphRect.y1 + y - labelHeight / 2);
            label.visible = true;
            // ctx.fillText(label, -labWidth - this._style.tickLabelsMargin, y + textHeight / 2);
            // ctx.stroke();
        });

        /** @type {Array<GraphLabel>} */
        let xLabels = [];


        /** @type {Array<{value: Number, label: GraphLabel}>} */
        let xTicksWithLabel = [];

        this._xticks.values.forEach((v, i) => {
            xTicksWithLabel.push({
                value: v,
                label: this._xlabels[i]
            })
        })

        const sortedXTicks = xTicksWithLabel.sort((a, b) => {
            if (xKeyTicks.has(a.value) && xKeyTicks.has(b.value))
                return a.value - b.value;
            if (xKeyTicks.has(a.value))
                return -1;
            if (xKeyTicks.has(b.value))
                return 1;
            return a - b;
        })

        sortedXTicks.forEach((tick) => {

            const x = this.xpos(tick.value);
            const lw = tick.label.width;


            tick.label.position(x - lw / 2 + this._graphRect.x1,
                this._graphRect.y2);

            if (xLabels.every(lab => !lab.getScreenRect().intersects(tick.label.getScreenRect(), 0))) {
                if (tick.label.x > -0.99 + this._graphRect.x1
                    && (tick.label.x + tick.label.width < this._graphRect.x2 + 0.01)) {
                    xLabels.push(tick.label);
                    tick.label.visible = true;
                } else
                    tick.label.remove();
            } else
                tick.label.remove();
        });

        ctx.restore();
    }

    xpos(xv) {
        return (this._xscale.normalize(xv) * this._graphRect.width);
    }

    ypos(yv) {
        return (this._graphRect.height - this._yscale.normalize(yv) * this._graphRect.height);
    }

    // xposPixels(xv) {
    //     return Math.round(this._xscale.normalize(xv) * this._graphRect.width * window.devicePixelRatio);
    // }

    // yposPixels(yv) {
    //     return Math.round(this._graphRect.height * window.devicePixelRatio - this._yscale.normalize(yv) * this._graphRect.height * window.devicePixelRatio);
    // }
}

/** *
 * @typedef {Object} GraphStyle
 * @property {LabelStyle} labelStyle
 * @property {GridStyle} gridStyle
 * @property {number} margin
 */

Graph.defaultStyle = {
    labelStyle: new LabelStyle(new TextStyle('1.2rem Oswald', "rgb(40, 40, 40)"), new Spacing(10)),
    gridStyle: new GridStyle(new LineStyle(2, 'rgb(200, 200, 200)'), new LineStyle(2, 'rgb(150, 150, 150)')),
    margin: 2
};

Graph.loadStyle = function () {
    return {
        labelStyle: new LabelStyle(
            new TextStyle(
                CONFIG.get("graph.style.labels.textStyle.font").asString(),
                CONFIG.get("graph.style.labels.textStyle.fontSize").toPxUIScaled() + "px",
                CONFIG.get("graph.style.labels.textStyle.color").asString()),
            new Spacing(...(CONFIG.get("graph.style.labels.spacing").asObject().map(val => convertToPx(val, true))))
        ),
        gridStyle: new GridStyle(
            new LineStyle(
                CONFIG.get("graph.style.grid.lines.width").toPxUIScaled(),
                CONFIG.get("graph.style.grid.lines.color").asString()),
            new LineStyle(
                CONFIG.get("graph.style.grid.keyLines.width").toPxUIScaled(),
                CONFIG.get("graph.style.grid.keyLines.color").asString()),
        ),
        margin: CONFIG.get("graph.style.margin").toPxUIScaled()
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

export class NoteIndicator extends CanvasElement {
    constructor() {
        super();
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
