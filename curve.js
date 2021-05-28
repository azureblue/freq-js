import { Window } from "./window.js";

/**
  * @typedef  {Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array} TypedArray
  */

/**
 * @template {TypedArray} T
 * @typedef {Object} curve
 * @property {T} x - x coordinates
 * @property {T} y - y coordinates
 */

 /**
  * @template {TypedArray} T
  * @param {curve<T>} curve
  * @returns {curve<T>}
  */
export function subdivide(curve, from = 0, to = curve.x.length) {
    const TypedArrayType = curve.x.constructor;
    const newLen = curve.x.length + (to - from - 1);
    /**
     * @type {curve<T>}
     */
    let res = {
        x: new TypedArrayType(newLen),
        y: new TypedArrayType(newLen)
    };

    for (let i = 0; i <= from; i++)
        res.x[i] = curve.x[i];

    for (let i = 0; i <= from; i++)
        res.y[i] = curve.y[i];

    let pos = from + 1;
    for (let i = from + 1; i < to; i++) {
        res.x[pos++] = (curve.x[i] + curve.x[i - 1]) / 2;
        res.x[pos++] = curve.x[i];
    }

    pos = from + 1;
    for (let i = from + 1; i < to; i++) {
        res.y[pos++] = (curve.y[i] + curve.y[i - 1]) / 2;
        res.y[pos++] = curve.y[i];
    }

    for (let i = to; i < curve.x.length; i++) {
        res.x[pos] = curve.x[i];
        res.y[pos++] = curve.y[i];
    }

    return res;
}

export class CurveWindowSmoother {
    /**
     *
     * @param {Window} window
     */
    constructor(window) {
        this.window = window;
        this._buffer = new Float32Array(0);
    }

    /**
     * @template {TypedArray} T
     * @param {curve<T>} curve
     */
    smooth(curve) {
        let n = this.window.size;
        if (this._buffer.length < curve.y.length)
            this._buffer = new Float32Array(curve.y.length);
        this._buffer.set(curve.y);

        const spreadLeft = Math.floor(n / 2);
        const spreadRight = n - spreadLeft - 1;
        for (let i = spreadLeft; i < curve.x.length - spreadRight; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                sum += this._buffer[i - spreadLeft + j] * this.window.weightFunction(j);
            }
            curve.y[i] = sum / this.window.sum;
        }
    }
}