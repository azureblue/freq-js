class BufferedAudioSource extends AudioWorkletProcessor {

    /**
     * @param {AudioWorkletNodeOptions} options
     */
    constructor(options) {
        super();
        this._bufferSize = options.processorOptions.sampleSize;
        console.log("creating BufferedAudioSource audio worklet with bufferSize: " + this._bufferSize);
        this._buffer = new Float32Array(this._bufferSize);
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
            if (this._currentPos == this._bufferSize) {
                this._currentPos = 0;
                this.port.postMessage(this._buffer, [this._buffer.buffer]);
                this._buffer = new Float32Array(this._bufferSize);
            }
        }
      return true
    }
  }

  registerProcessor('BufferedAudioSource_0', BufferedAudioSource);
