function Transform() {
}

Transform.prototype.apply = function(data) {
};

function BuffersAverage(bufferSize, numberOfBuffers) {
    Transform.call(this);
    const buffers = new Array(numberOfBuffers);
    let currentBuffer = 0;

    for (let i = 0; i < numberOfBuffers; i++)
        buffers[i] = new Float32Array(bufferSize);

    this.apply = function(data) {
        copyElements(data, buffers[currentBuffer]);
        currentBuffer = (currentBuffer + 1) % numberOfBuffers;
        copyElements(buffers[0], data);
        for (let buf = 1; buf < numberOfBuffers; buf++) {
            let buffer = buffers[buf];
            for (let i = 0; i < bufferSize; i++)
                data[i] += buffer[i];
        }
        for (let i = 0; i < bufferSize; i++)
            data[i] /= numberOfBuffers;
    }
}
