import { CyclicBuffer } from "./cyclicBuffer.js";
import { Transform } from "./transform.js";

export function AverageBuffer(length) {
    const cyclicBuffer = new CyclicBuffer(length);
    let acc = 0;
    let fill = 0;

    this.putValue = function(value) {
        if (fill === length)
            acc -= cyclicBuffer.removeFirst();
        else fill++;
        cyclicBuffer.add(value);
        acc += value;
    };

    this.currentSize = function() {
        return fill;
    };

    this.average = function () {
        if (fill === 0)
            throw "buffer is empty";
        return acc / fill;
    };

    this.removeFirst = function() {
        acc -= cyclicBuffer.removeFirst();
        fill--;
    };

    this.reset = function() {
        cyclicBuffer.reset();
        acc = 0;
        fill = 0;
    }
}

export class MovingAverage extends Transform {

    constructor(spread) {
        super();
        this._spread = spread;
        this._avgBuffer = new AverageBuffer(spread * 2 + 1);
    }

    apply(data) {
        this._avgBuffer.reset();
        const len = data.length;

        for (let i = 0; i < this._spread; i++)
        this._avgBuffer.putValue(data[i]);

        for (let i = 0; i < len - this._spread; i++) {
            this._avgBuffer.putValue(data[this._spread + i]);
            data[i] = this._avgBuffer.average();
        }

        for (let i = 0; i < this._spread; i++) {
            this._avgBuffer.removeFirst();
            data[len - this._spread + i] = this._avgBuffer.average();
        }
    }
}

MovingAverage.create = function(n, params = {spread: 4}) {
    return new MovingAverage(params.spread);
}
