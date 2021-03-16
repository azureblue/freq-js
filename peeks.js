export class QuadraticPeekInterpolator {
    interpolatePeek(l, c, r) {
        return 0.5 * ((l - r) / (l - 2 * c + r));
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