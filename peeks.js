import {AvlOSTree, Node} from "./tree.js";

export class QuadraticPeekInterpolator {
    interpolatePeek(l, c, r) {
        return 0.5 * ((l - r) / (l - 2 * c + r));
    }
}

export class FrequencyPeeksFilter {
    constructor() {
        this._treeBuffer = new AvlOSTree();
        /**
         * @param {Node} root
         * @param {Set} output
         */
        this._treeBuffer._findPeeks = function (root, output, lowerBound, value, upperBound) {
            if (root == null)
                return true;
            const key = root.key;

            if (key >= lowerBound && key <= upperBound) {
                if (root.value >= value)
                    return false;

                output.add(key);
            }

            if (key >= lowerBound) {
                if (!this._findPeeks(root.left, output, lowerBound, value, upperBound))
                    return false;
            }

            if (key <= upperBound)
                if (!this._findPeeks(root.right, output, lowerBound, value, upperBound))
                    return false;

            return true;
        }


        this._treeBuffer.findPeeks = function (output, lowerBound, value, upperBound) {
            return this._findPeeks(this._root, output, lowerBound, value, upperBound);
        }

        this._treeBuffer.forEachOrdered = function(consumer) {
            this._forEachOrdered(this._root, consumer);
        }

        this._treeBuffer._forEachOrdered = function(root, consumer) {
            if (root == null)
                return;

            this._forEachOrdered(root.left, consumer);
            consumer(root.key, root.value);
            this._forEachOrdered(root.right, consumer);
        }

        this._tempBuffer = new Set();
    }

    reset() {
        this._treeBuffer.reset();
    }

    handlePeek(freq, value) {
        const freqDist = 20;
        this._tempBuffer.clear();
        if (!this._treeBuffer.findPeeks(this._tempBuffer, freq - freqDist, value, freq + freqDist))
            return;

        this._tempBuffer.forEach(key => this._treeBuffer.delete(key));
        this._treeBuffer.insert(freq, value);
    }

    forEachPeek(consumer)  {
        this._treeBuffer.forEachOrdered(consumer);
    }
}

export class PeekFinder {

    constructor(spread) {
        this.spread = spread;
    }

    forEachPeek(data, peekHandler) {
        const len = data.length;
        let last = data[0];
        let inc = false;
        let peekLeft = 0;
        let peekRight = 0;
        for (let i = 1; i < len; i++) {
            let el = data[i];
            if (el > last) {
                peekLeft = inc ? peekLeft + 1 : 1;
                inc = true;
            } else if (el < last) {
                peekRight = inc ? 1 : peekRight + 1;
                inc = false;
                if (peekLeft >= this.spread && peekRight === this.spread)
                    peekHandler(i - this.spread, data[i - this.spread])
            } else
                peekLeft = peekRight = 0;
            last = el;
        }
    }
}