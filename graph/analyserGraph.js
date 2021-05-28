import { MovingAverage } from "../average.js";
import { CONFIG } from "../config.js";
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
        // /** @type {GraphStyle} */
        // this.style = cloneObjectShallow(AnalyserGraph.defaultStyle);
        // overrideProperties(this.style, style);

        // this.smoothingWindow = new CurveWindowSmoother(new GaussianWindow(5));

        let ma = new MovingAverage(1);
        /**
         *
         * @param {Float32Array} xs - X coordinates
         * @param {Float32Array} ys - Y coordinates
         * @param {AnalyserGraph.LineStyle} lineStyle
         */
        this.plotData = function (xs, ys, stride = 1, lineStyle = AnalyserGraph.defaultStyle.plotStyle) {
            ys = new Float32Array(ys);
            //ma.apply(ys);
            const ctx = this.canvas.layers[1].ctx;
            let len = xs.length;
            ctx.save();
            // ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            ctx.translate(0.5, 0.5);
            // ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

            lineStyle.apply(ctx);
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(this.xpos(xs[0]), this.ypos(ys[0]));

            // let points = new Array(xs.length + ys.length);
            // for (let i = 0; i < xs.length; i++) {
            //     points[i * 2] = this.xpos(xs[i]);
            //     points[i * 2 + 1] = this.ypos(ys[i]);
            // }


            //curve(ctx, points, 0.5, 5);
            //ctx.stroke();

            let cu = {x: xs, y: ys};
            // let cu = subdivide({x: xs, y: ys});
            //  cu = subdivide(cu);
            // this.smoothingWindow.smooth(cu);
            // cu = subdivide(cu);
            // this.smoothingWindow.smooth(cu);
            // this.smoothingWindow.smooth(cu);


            // this.smoother.drawSmooth(ctx, xs, ys, (x) => this.xpos(x), (y) => this.ypos(y));
            ctx.beginPath();
            ctx.moveTo(this.xpos(cu.x[0]), this.ypos(cu.y[0]));
            for (let i = 1; i < cu.x.length; i += stride)
                ctx.lineTo(this.xpos(cu.x[i]), this.ypos(cu.y[i]));
            ctx.stroke();
            ctx.restore();
        };


        this.clearPlot = function() {
            this.canvas.layers[1].clear();
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
