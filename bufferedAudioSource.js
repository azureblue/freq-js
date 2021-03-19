const sourceSampleSize = 1024 * 4;

class BufferedAudioSource extends AudioWorkletProcessor {

    constructor() {
        super();
        console.log("creating BufferedAudioSource audio worklet");
        this._buffer = new Float32Array(sourceSampleSize);
        this._currentPos = 0;
    }

    /**
     * @param {Float32Array[][]} inputs
     * @param {Float32Array[][]} outputs
     * @param {Record<string, Float32Array>} parameters
     */
    process (inputs, outputs, parameters) {
        if (inputs[0] !== undefined && inputs[0][0] !== undefined) {
            const inputSize = inputs[0][0].length;
            this._buffer.set(inputs[0][0], this._currentPos);
            this._currentPos += inputSize;
            if (this._currentPos == sourceSampleSize) {
                this._currentPos = 0;
                this.port.postMessage(this._buffer, [this._buffer.buffer]);
                this._buffer = new Float32Array(sourceSampleSize);
            }
        }
      return true
    }
  }

  registerProcessor('BufferedAudioSource_0', BufferedAudioSource);