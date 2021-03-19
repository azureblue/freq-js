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

        const ctx = this.ctx;
        const measureWidth = text => ctx.measureText("" + text).width;
        //noinspection JSSuspiciousNameCombination

        this.style.textStyle.apply(ctx);

        const measure = measureText(ctx, "#");
        const textHeight = measure.height;
        const maxYLabelWidth = Math.max(...(yticks.labels).map(measureWidth));
        const maxXLabelWidth = Math.max(...(xticks.labels).map(measureWidth));
        const graphXPadding = maxYLabelWidth + this.style.tickLabelsMargin * 2;
        const graphYPadding = textHeight * 2 + this.style.tickLabelsMargin * 2;
        let graphRect = { x: 0, y: 0, width: 0, height: 0 };
        let xpos = xv => Math.round(xscale.normalize(xv) * graphRect.width);
        let ypos = yv => Math.round(graphRect.height - yscale.normalize(yv) * graphRect.height);
        const xKeyTicks = new Set();
        const yKeyTicks = new Set();
        xticks.keyValues.forEach(t => xKeyTicks.add(t));
        yticks.keyValues.forEach(t => yKeyTicks.add(t));

        let x = { value: 123, label: xticks.labels[2] };
        const xTicksWithLabel = xticks.values.map((v, i) => ({ value: v, label: xticks.labels[i] }));
        const yTicksWithLabel = xticks.values.map((v, i) => ({ value: v, label: xticks.labels[i] }));

        let updateGraphRect = () => {
            graphRect.x = this.style.margin + graphXPadding;
            graphRect.y = this.style.margin + this.style.tickLabelsMargin + textHeight / 2;
            graphRect.width = this.width - graphXPadding - this.style.margin * 2;
            graphRect.height = this.height - graphYPadding - this.style.margin * 2;
        };

        this.drawScales = function () {
            this.updateSizeAndClean();
            updateGraphRect();
            ctx.save();
            ctx.translate(graphRect.x, graphRect.y);

            ctx.save();
            //graph border
            ctx.beginPath();
            this.style.gridKeyStyle.apply(ctx);
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
                    this.style.gridKeyStyle.apply(ctx);
                } else {
                    this.style.gridStyle.apply(ctx);
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
                    this.style.gridKeyStyle.apply(ctx);
                } else {
                    this.style.gridStyle.apply(ctx);
                }
                ctx.moveTo(x, 0);
                ctx.lineTo(x, graphRect.height);
                ctx.stroke();
            });

            ctx.restore();
            this.style.textStyle.apply(ctx);
            yticks.values.forEach((v, idx) => {
                if (v < yscale.min || v > yscale.max)
                    return;
                ctx.beginPath();
                const label = yticks.labels[idx];
                let labWidth = measureWidth(label);
                let y = ypos(v);
                if (yKeyTicks.has(v)) {
                    this.style.gridKeyStyle.apply(ctx);
                } else {
                    this.style.gridStyle.apply(ctx);
                }
                ctx.fillText(label, -labWidth - this.style.tickLabelsMargin, y + textHeight / 2);
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
                    graphRect.height + textMeasure.height + this.style.tickLabelsMargin,
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

        /**
         *
         * @param {Array<Number>} xs - X coordinates
         * @param {Array<Number>} ys - Y coordinates
         * @param {Graph.LineStyle} lineStyle
         */
        this.plotData = function (xs, ys, lineStyle = Graph.defaultStyle.plotStyle) {
            let len = xs.length;
            ctx.save();
            lineStyle.apply(ctx);
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

        /**
         *
         * @param {number} xMid
         * @param {number} yTop
         * @param {Label} label
         * @returns {number}
         */
        this.drawLabel = function(xMid, yTop, label) {
            ctx.save();
            label.applyStyleAndUpdateMetrics(ctx);
            if (label.placement == Graph.Label.Placement.LEFT)
                xMid = xMid - label.metrics.halfWidth - this.style.labelSeparation;
            else if (label.placement == Graph.Label.Placement.RIGHT)
                xMid = xMid + label.metrics.halfWidth + this.style.labelSeparation;

            ctx.translate(xMid, yTop);

            if (label.vertical) {
                ctx.rotate(Math.PI / 2);
                ctx.fillText(label.text, 0, label.metrics.halfHeight);
                yTop += label.metrics.width;
            } else {
                ctx.fillText(label.text, -label.metrics.halfWidth, label.metrics.height);
                yTop += label.metrics.height;
            }
            ctx.restore();
            return yTop;
        }

        /**
         * @param {Graph.VerticalLine} verticalLine
         */
        this.plotVerticalLine = function (verticalLine) {
            let xp = xpos(verticalLine.x);
            if (xp < 0 || xp > graphRect.width)
                return;
            ctx.save();
            ctx.translate(graphRect.x, graphRect.y);

            let currentY = this.style.labelSeparation;
            verticalLine.topLabels.forEach(lab => {
                currentY = this.drawLabel(xp, currentY, lab) + this.style.labelSeparation;
            });

            verticalLine.lineStyle.apply(ctx);

            ctx.beginPath();
            ctx.moveTo(xp, currentY);
            ctx.lineTo(xp, graphRect.height);
            ctx.stroke();

            let currentYLR = currentY;
            verticalLine.leftLabels.forEach(lab => {
                currentYLR = this.drawLabel(xp, currentYLR, lab) + this.style.labelSeparation;
            });

            currentYLR = currentY;
            verticalLine.rightLabels.forEach(lab => {
                currentYLR = this.drawLabel(xp, currentYLR, lab) + this.style.labelSeparation;
            });
            ctx.restore();
        };
    }
}


Graph.VerticalLine = class {
    /**
     * @param {number} x
     * @param {Array<Graph.Label>} labels
     * @param {Graph.LineStyle} lineStyle
     */
    constructor(x, labels, lineStyle = Graph.defaultStyle.plotStyle) {
        this.x = x;
        this.lineStyle = lineStyle;
        this.topLabels = labels.filter(lab => lab.placement == Graph.Label.Placement.TOP);
        this.leftLabels = labels.filter(lab => lab.placement == Graph.Label.Placement.LEFT);
        this.rightLabels = labels.filter(lab => lab.placement == Graph.Label.Placement.RIGHT);
    }
}

/**
 * @typedef {Graph.Label} Label
 */

Graph.Label = class {
    constructor(
        text,
        vertical = false,
        placement = Graph.Label.Placement.TOP,
        textStyle = Graph.defaultStyle.textStyle) {

        this.text = text;
        this.vertical = vertical;
        this.placement = placement;
        this.textStyle = textStyle;
        this.metrics = null;
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {boolean} force
     */
    updateMetrics(ctx, force = false) {
        if (this.metrics == null || force) {
            ctx.save();
            this.textStyle.apply(ctx);
            this.metrics = measureText(ctx, this.text);
            ctx.restore();
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    applyStyleAndUpdateMetrics(ctx) {
        this.textStyle.apply(ctx);
        this.metrics = measureText(ctx, this.text);
    }
}

/**
 * @typedef {Graph.Label.Placement} Placement
 */

/**
* @enum {Symbol}
*/
Graph.Label.Placement = Object.freeze({
    TOP: Symbol(),
    LEFT: Symbol(),
    RIGHT: Symbol()
});

Graph.TextStyle = class {
    constructor(font, style) {
        this.font = font;
        this.style = style;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    apply(ctx) {
        ctx.fillStyle = this.style;
        ctx.font = this.font;
    }
}

Graph.LineStyle = class {
    constructor(width, style) {
        this.width = width;
        this.style = style;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    apply(ctx) {
        ctx.strokeStyle = this.style;
        ctx.lineWidth = this.width;
    }
}


/** *
 * @typedef {Object} GraphStyle
 * @property {Graph.TextStyle} textStyle
 * @property {Graph.LineStyle} gridStyle
 * @property {Graph.LineStyle} gridKeyStyle
 * @property {Graph.LineStyle} plotStyle
 * @property {number} margin
 * @property {number} tickLabelsMargin
 * @property {number} labelSeparation
 * @property {boolean} removeClippedTicks
 */


/**
 * @type {GraphStyle}
 */
Graph.defaultStyle = {
    textStyle: new Graph.TextStyle('1rem Oswald', "rgb(40, 40, 40)"),
    gridStyle: new Graph.LineStyle(1, 'rgb(200, 200, 200)'),
    gridKeyStyle: new Graph.LineStyle(1.5, 'rgb(150, 150, 150)'),
    plotStyle: new Graph.LineStyle(1.5, 'rgb(100, 100, 100)'),
    margin: 2,
    tickLabelsMargin: 8,
    labelSeparation: 4,
    removeClippedTicks: true
};

Object.freeze(Graph.defaultStyle);
