function Transform() {
}

Transform.prototype.apply = function(data) {
};

class BinaryTransform {
    apply(data, data2) {}
}

class ComparatorTransform extends BinaryTransform {
    constructor(nullValue) {
        super();
        this.nv = nullValue;
    }

    apply(data, threshold) {
        const len = data.length;
        for (let i = 0; i < len; i++)
            data[i] = data[i] < threshold[i] ? this.nv : data[i];
    }
}

function MovingAverage(spread)  {
    Transform.call(this);
    const avgLength = spread * 2 + 1;
    const queue = new CyclicBuffer(avgLength);

    this.apply = function(data) {
        const len = data.length;

        var acc = 0;
        for (let i = 0; i < spread; i++) {
            queue.addElement(data[i]);
            acc += data[i];
        }

        for (let i = 0; i < spread + 1; i++) {
            const idx = spread + i;
            acc += data[idx];
            queue.addElement(data[idx]);
            data[i] = acc / (idx + 1);
        }

        queuePos = 0;

        for (let i = spread + 1; i < len - spread; i++) {
            acc = acc - queue.getFirst() + data[i + spread];
            queue.addElement(data[i + spread]);
            data[i] = acc / avgLength;
        }

        for (let i = 0; i < spread; i++) {
            acc -= queue.getFirst();
            queue.addElement(0);
            data[len - spread + i] = acc / (avgLength - (i + 1));
        }
    }
}

function AverageBuffer(bufferSize, averageBuffers) {
    Transform.call(this);
    const buffers = new Array(averageBuffers);
    let currentBuffer = 0;

    for (let i = 0; i < averageBuffers; i++)
        buffers[i] = new Float32Array(bufferSize);

    this.apply = function(data) {
        copyElements(data, buffers[currentBuffer]);
        currentBuffer = (currentBuffer + 1) % averageBuffers;
        copyElements(buffers[0], data);
        for (let buf = 1; buf < averageBuffers; buf++) {
            let buffer = buffers[buf];
            for (let i = 0; i < bufferSize; i++)
                data[i] += buffer[i];
        }
        for (let i = 0; i < bufferSize; i++)
            data[i] /= averageBuffers;
    }
}
