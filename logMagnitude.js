import { Transform } from "./transform.js";

export class LogMagnitude extends Transform {
    constructor(m, s) {
        super();
        this._m = m;
        this._s = s;
    }

    apply(data) {
        const n = data.length;
        for (let i = 0; i < n; i++)
            data[i] = this._m * Math.log10(data[i] / this._s);
    }
}