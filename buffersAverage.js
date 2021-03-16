import { Transform } from "./transform.js";

/**
 * @param {number} bufferSize
 * @param {number} numberOfBuffers
 * @param {function (new:TypedArray,number)} TypedArrayClass
 */
export class BuffersAverage extends Transform {

    constructor(bufferSize, numberOfBuffers, TypedArrayClass = Float32Array) {
        super();
        /** @type {Array<TypedArray} */
        const buffers = new Array(numberOfBuffers);
        let currentBuffer = 0;
        buffers.map
        for (let i = 0; i < numberOfBuffers; i++)
            buffers[i] = new TypedArrayClass(bufferSize);

        /** @param {TypedArray} data */
        this.apply = function (data) {
            buffers[currentBuffer].set(data);
            currentBuffer = (currentBuffer + 1) % numberOfBuffers;
            data.set(buffers[0]);
            for (let buf = 1; buf < numberOfBuffers; buf++) {
                let buffer = buffers[buf];
                for (let i = 0; i < bufferSize; i++)
                    data[i] += buffer[i];
            }
            for (let i = 0; i < bufferSize; i++)
                data[i] /= numberOfBuffers;
        }
    }
}

BuffersAverage.create = function(n, params = {numberOfBuffers: 3}) {
    return new BuffersAverage(n, params.numberOfBuffers);
}
