import { Transform } from "./transform.js";
import { AvlOSTree } from "./tree.js";

function CyclicBuffer(size, ArrayType = Array) {
    const buffer = new ArrayType(size);
    let position = 0;

    this.add = function (el) {
        buffer[position] = el;
        position = (position + 1) % size;
    };

    this.getFirst = function () {
        return buffer[position];
    };
}

export class RollingMedian extends Transform {

    constructor(spread) {
        super();
        this._spread = spread;
        this._medianLength = spread * 2 + 1;
        this._buffer = new CyclicBuffer(this._medianLength);
    }

    apply(data) {
        const tree = new AvlOSTree();

        for (let i = 0; i < this._medianLength - 1; i++) {
            const el = data[i];
            this._buffer.add(el);
            tree.insert(el);
            if (i < this._spread)
                data[i] = tree.selectKey(Math.floor(i / 2));
        }
        for (let i = this._spread; i < data.length - this._spread; i++) {
            const el = data[i + this._spread];
            this._buffer.add(el);
            tree.insert(data[i + this._spread]);
            data[i] = tree.selectKey(this._spread);
            tree.delete(this._buffer.getFirst());
        }

        for (let i = data.length - this._spread; i < data.length; i++) {
            this._buffer.add(0);
            data[i] = tree.selectKey(Math.floor(tree.size() / 2));
            tree.delete(this._buffer.getFirst());
        }
    }
}

RollingMedian.create = function(n, params = {spread: 4}) {
    return new RollingMedian(params.spread);
}
