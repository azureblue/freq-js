function CyclicBuffer(size, arrayType = Float32Array) {
    const buffer = new arrayType(size);
    let start = 0;
    let currentSize = 0;

    this.add = function(el) {
        if (currentSize === size) {
            buffer[start] = el;
            start = (start + 1) % size;
        }
        else
            buffer[(start + currentSize++) % size] = el;
    };

    this.getFirst = function() {
        if (currentSize === 0)
            throw "CyclicBuffer: buffer is empty";
        return buffer[start];
    };

    this.removeFirst = function() {
        if (currentSize === 0)
            throw "CyclicBuffer: buffer is empty";
        currentSize--;
        let el = buffer[start];
        start = (start + 1) % size;
        return el;
    };

    this.reset = function() {
        start = 0;
        currentSize = 0;
    };

    this.writeTo = function(dst) {
        let dstPos = 0;
        for (let p = end; p < size; p++)
            dst[dstPos++] = buffer[p];

        for (let i = 0; i < end; i++)
            dst[dstPos++] = buffer[i];
    }
}
