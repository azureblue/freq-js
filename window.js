class Window extends Transform {

    get size() {
        return this._size;
    }

    constructor(size) {
        super();
        this._size = size;
    }

    apply(data) {
        const len = this.size;
        for (let i = 0; i < len; i++)
            data[i] = this.weightFunction(i) * data[i];
    }

    get sum() {
        let windowSum = 0;
        for (let i = 0; i < this.size; i++)
            windowSum += this.weightFunction(i);
        return windowSum;
    }

    weightFunction(n) {
    };
}

class HanningWindow extends Window {
    constructor(N) {
        super(N);
    }

    weightFunction(n) {
        return 1 - (0.54 + 0.46 * Math.cos((2 * Math.PI * n) / (this.size - 1)))
    };
}

class GaussianWindow extends Window {
    constructor(N, sigma) {
        super(N);
        this.N = N;
        this.sigma = sigma;
    }

    weightFunction(n) {
        const ex = ((n - (this.N - 1) / 2) / (this.sigma * (this.N - 1) / 2));
        return Math.exp(-0.5 * (ex * ex));
    };
}
