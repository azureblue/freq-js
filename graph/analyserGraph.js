import { MovingAverage } from "../average.js";
import { AxisTicks, Graph, GraphScale } from "./graph.js";
import { LineStyle } from "./style.js";


export class AnalyserGraph extends Graph {
    /**
     * @param {HTMLElement} container
     * @param {GraphScale} xscale
     * @param {GraphScale} yscale
     * @param {AxisTicks} xticks
     * @param {AxisTicks} yticks
     */
    constructor(xscale, yscale, xticks, yticks, style = AnalyserGraph.loadStyle()) {
        super(xscale, yscale, xticks, yticks, style.graphStyle);

        /**
         * @param {Float32Array} xs - X coordinates
         * @param {Float32Array} ys - Y coordinates
         * @param {AnalyserGraph.LineStyle} lineStyle
         */
        this.plotData = function (xs, ys, stride = 1, lineStyle = AnalyserGraph.defaultStyle.plotStyle) {
            const ctx = this.canvas.ctx;
            ctx.save();
            ctx.translate(0.5, 0.5);

            lineStyle.apply(ctx);
            ctx.lineJoin = "round";

            ctx.beginPath();
            ctx.moveTo(this.xpos(xs[0]), this.ypos(ys[0]));
            for (let i = 1; i < xs.length; i += stride)
                ctx.lineTo(this.xpos(xs[i]), this.ypos(ys[i]));
            ctx.stroke();
            ctx.restore();
        };

        this.clearPlot = function() {
            this.canvas.clear();
        }
    }
}

/** *
 * @typedef {Object} AnalyserGraphStyle
 * @property {GraphStyle} graphStyle
 * @property {LineStyle} plotStyle
 */

/**
 * @type {AnalyserGraphStyle}
 */
AnalyserGraph.loadStyle = function() {
    return {
        graphStyle: Graph.loadStyle(),
        plotStyle: new LineStyle(1.5, 'rgb(100, 100, 100)')
    }
};

Object.freeze(AnalyserGraph.defaultStyle);
