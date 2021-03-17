import { Rect } from "./geom.js";
import { AxisTicks, GraphBase, GraphScale } from "./graph.js";
import { measureText, cloneObjectShallow, overrideProperties } from "./utils.js";

export class Graph extends GraphBase {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {GraphScale} xscale
     * @param {GraphScale} yscale
     * @param {AxisTicks} xticks
     * @param {AxisTicks} yticks
     */
    constructor(canvas, xscale, yscale, xticks, yticks, style = {}) {
        super(canvas);
        /** @type {GraphStyle} */
        this.style = cloneObjectShallow(Graph.defaultStyle);
        overrideProperties(this.style, style);

        let prepareCtx = () => {
            ctx.strokeStyle = this.style.gridStyle;
            ctx.font = this.style.font;
        };

        const ctx = this.ctx;
        const measureWidth = text => ctx.measureText("" + text).width;
        //noinspection JSSuspiciousNameCombination
        prepareCtx();

        const measure = measureText(ctx, "#");
        const textHeight = measure.height;
        const maxYLabelWidth = Math.max(...(yticks.labels).map(measureWidth));
        const maxXLabelWidth = Math.max(...(xticks.labels).map(measureWidth));
        const graphXPadding = maxYLabelWidth + this.style.labelMargin * 2;
        const graphYPadding = textHeight * 2 + this.style.labelMargin * 2;
        let graphRect = { x: 0, y: 0, width: 0, height: 0 };
        let xpos = xv => Math.round(xscale.normalize(xv) * graphRect.width);
        let ypos = yv => Math.round(graphRect.height - yscale.normalize(yv) * graphRect.height);
        const xKeyTicks = new Set();
        const yKeyTicks = new Set();
        xticks.keyValues.forEach(t => xKeyTicks.add(t));
        yticks.keyValues.forEach(t => yKeyTicks.add(t));

        let x = {value: 123, label: xticks.labels[2]};
        const xTicksWithLabel = xticks.values.map((v, i) => ({value: v, label: xticks.labels[i]}));
        const yTicksWithLabel = xticks.values.map((v, i) => ({value: v, label: xticks.labels[i]}));

        let updateGraphRect = () => {
            graphRect.x = this.style.margin + graphXPadding;
            graphRect.y = this.style.margin + this.style.labelMargin + textHeight / 2;
            graphRect.width = this.width - graphXPadding - this.style.margin * 2;
            graphRect.height = this.height - graphYPadding - this.style.margin * 2;
        };

        this.drawScales = function () {
            this.updateSizeAndClean();
            updateGraphRect();
            ctx.save();
            prepareCtx();
            ctx.translate(graphRect.x, graphRect.y);

            ctx.save();
            //graph border
            ctx.beginPath();
            ctx.strokeStyle = this.style.gridKeyStyle;
            ctx.rect(0, 0, graphRect.width, graphRect.height);
            ctx.stroke();


            ctx.beginPath();
            ctx.rect(0, 0, graphRect.width, graphRect.height);
            ctx.clip();


            yticks.values.forEach((v) => {
                if (v < yscale.min || v > yscale.max)
                    return;
                ctx.beginPath();
                let y = ypos(v);
                if (yKeyTicks.has(v)) {
                    ctx.strokeStyle = this.style.gridKeyStyle;
                    ctx.lineWidth = this.style.gridKeyWidth;
                } else {
                    ctx.strokeStyle = this.style.gridStyle;
                    ctx.lineWidth = this.style.gridWidth;
                }
                ctx.moveTo(0, y);
                ctx.lineTo(graphRect.width, y);
                ctx.stroke();
            });

            xticks.values.forEach((v) => {
                if (v < xscale.min || v > xscale.max)
                    return;
                ctx.beginPath();
                let x = xpos(v);
                if (xKeyTicks.has(v)) {
                    ctx.strokeStyle = this.style.gridKeyStyle;
                    ctx.lineWidth = this.style.gridKeyWidth;
                } else {
                    ctx.strokeStyle = this.style.gridStyle;
                    ctx.lineWidth = this.style.gridWidth;
                }
                ctx.moveTo(x, 0);
                ctx.lineTo(x, graphRect.height);
                ctx.stroke();
            });

            ctx.restore();

            yticks.values.forEach((v, idx) => {
                if (v < yscale.min || v > yscale.max)
                    return;
                ctx.beginPath();
                const label = yticks.labels[idx];
                let labWidth = measureWidth(label);
                let y = ypos(v);
                if (yKeyTicks.has(v)) {
                    ctx.strokeStyle = this.style.gridKeyStyle;
                } else {
                    ctx.strokeStyle = this.style.gridStyle;
                }
                ctx.fillText(label, -labWidth - this.style.labelMargin, y + textHeight / 2);
                ctx.stroke();
            });

            /** @type {Array<Rect>} */
            let xLabels = [];

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
                const x = xpos(tick.value);
                let textMeasure = measureText(ctx, tick.label);
                // textMeasure.cssH = textHeight;
                // textMeasure.cssW = measureWidth(tick.label)

                let labelRect = new Rect(
                    x - textMeasure.width / 2,
                    graphRect.height + textMeasure.height + this.style.labelMargin,
                    textMeasure.width,
                    textMeasure.height
                );

                if (xLabels.every(rect => !rect.intersects(labelRect, 5))) {
                    if (labelRect.x > -0.99 && (labelRect.x + labelRect.w) < graphRect.width + 0.01) {
                        ctx.fillText(tick.label, labelRect.x, labelRect.y);
                        xLabels.push(labelRect);
                    }
                }
            });

            ctx.restore();
        };

        this.plotData = function (xs, ys) {
            let len = xs.length;
            ctx.save();
            prepareCtx();
            ctx.strokeStyle = this.style.defaultPlotStyle;
            ctx.lineWidth = this.style.defaultPlotLineWidth;
            ctx.lineJoin = "round";
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

/** *
 * @typedef {Object} GraphStyle
 * @property {string} font
 * @property {number} gridWidth
 * @property {string} gridStyle
 * @property {number} gridKeyWidth
 * @property {string} gridKeyStyle
 * @property {number} defaultPlotLineWidth
 * @property {string} defaultPlotStyle
 * @property {number} margin
 * @property {number} labelMargin
 */

/**
 * @type {GraphStyle}
 */
Graph.defaultStyle = {
    font: '1rem Oswald',
    gridWidth: 1,
    gridStyle: 'rgb(200, 200, 200)',
    gridKeyWidth: 1.5,
    gridKeyStyle: 'rgb(150, 150, 150)',
    defaultPlotLineWidth: 1.5,
    defaultPlotStyle: 'rgb(100, 100, 100)',
    margin: 2,
    labelMargin: 8,
    removeClippedTicks: true
};

Object.freeze(Graph.defaultStyle);
