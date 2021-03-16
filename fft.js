import { Transform } from "./transform.js";

const PI = Math.PI;
const SQRT1_2 = Math.SQRT1_2;

function FFTComplexBuffer(len) {
    this.length = len;
    this.real = new Float32Array(len);
    this.imag = new Float32Array(len);
    this.magnitude = (outputArray) => {
        let real = this.real;
        let imag = this.imag;
        for (let i = 0; i < len; i++) {
            let r = real[i];
            outputArray[i] = r * r;
        }
        for (let i = 0; i < len; i++) {
            let im = imag[i];
            outputArray[i] = Math.sqrt(outputArray[i] + im * im);
        }
    }
}

/*
fft based on https://github.com/dntj/jsfft

The MIT License

Copyright (c) 2012 Nick Jones

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
export class FFT extends Transform {
    constructor(inputSize) {
        super();
        const buffer = new FFTComplexBuffer(inputSize);
        const flipBuffer = new Int8Array(inputSize);
        const n = inputSize;
        this.magnitude = (outputMagnitudeArray) => buffer.magnitude(outputMagnitudeArray);
        this.fft = (input) => {
            buffer.real.set(input);
            buffer.imag.fill(0.0);
            flipBuffer.fill(0);
            bitReverseComplexArray(buffer);
            const output_r = buffer.real;
            const output_i = buffer.imag;
            let width = 1;
            while (width < n) {
                const del_f_r = Math.cos(PI / width);
                const del_f_i = Math.sin(PI / width);
                for (let i = 0; i < n / (2 * width); i++) {
                    let f_r = 1;
                    let f_i = 0;
                    for (let j = 0; j < width; j++) {
                        const l_index = 2 * i * width + j;
                        const r_index = l_index + width;

                        const left_r = output_r[l_index];
                        const left_i = output_i[l_index];
                        const right_r = f_r * output_r[r_index] - f_i * output_i[r_index];
                        const right_i = f_i * output_r[r_index] + f_r * output_i[r_index];

                        output_r[l_index] = SQRT1_2 * (left_r + right_r);
                        output_i[l_index] = SQRT1_2 * (left_i + right_i);
                        output_r[r_index] = SQRT1_2 * (left_r - right_r);
                        output_i[r_index] = SQRT1_2 * (left_i - right_i);

                        [f_r, f_i] = [
                            f_r * del_f_r - f_i * del_f_i,
                            f_r * del_f_i + f_i * del_f_r,
                        ];
                    }
                }
                width <<= 1;
            }
        };

        function bitReverseIndex(index, n) {
            let bitreversed_index = 0;

            while (n > 1) {
                bitreversed_index <<= 1;
                bitreversed_index += index & 1;
                index >>= 1;
                n >>= 1;
            }
            return bitreversed_index;
        }

        function bitReverseComplexArray(buffer) {
            const n = buffer.length;

            for (let i = 0; i < n; i++) {
                const r_i = bitReverseIndex(i, n);
                if (flipBuffer[i] === 1) continue;
                [buffer.real[i], buffer.real[r_i]] = [buffer.real[r_i], buffer.real[i]];
                [buffer.imag[i], buffer.imag[r_i]] = [buffer.imag[r_i], buffer.imag[i]];

                flipBuffer[r_i] = 1;
            }
        }
    }

    apply(data) {
        this.fft(data);
        this.magnitude(data);
    };
}

FFT.create = function(n, params = {}) {
    return new FFT(n);
}
