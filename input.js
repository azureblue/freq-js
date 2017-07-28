function CyclicBuffer(size) {
    const buffer = new Float32Array(size);
    let position = 0;

    this.putData = function(data) {
        const len = data.length;

        for (let i = 0; i < len; i++)
            buffer[(i + position) % size] = data[i];

        position = (position + len) % size;
    };

    this.addElement = function(el) {
        buffer[position] = el;
        position = (position + 1) % size;
    };

    this.getFirst = function() {
        return buffer[position];
    };

    this.writeTo = function(dst) {
        let dstPos = 0;
        for (let p = position; p < size; p++)
            dst[dstPos++] = buffer[p];

        for (let i = 0; i < position; i++)
            dst[dstPos++] = buffer[i];
    }
}

function AverageTracker(length) {
    const cyclicBuffer = new CyclicBuffer(length);
    let acc = 0;
    let fill = 0;

    this.nextValue = function(value) {
        if (fill === length)
            acc = acc - cyclicBuffer.getFirst();
        else fill++;
        cyclicBuffer.addElement(value);
        acc = acc + value;
        return acc / fill;
    }

    this.reset = function() {
        acc = 0;
        fill = 0;
    }
}
