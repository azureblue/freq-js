import { CyclicBuffer } from "./cyclicBuffer.js";

export class AudioDataConsumer {
    /**
     * @param {Float32Array} data
     */
    accept(data) {
    }
}

export class UserAudioDataSource {
    /**
     * @param {number} sampleSize - Needs to be a power of 2.
     */
    constructor(sampleSize) {
        /**@type AudioContext*/
        this._audioContext = new UserAudioDataSource.AudioContext();
        this._sampleSize = sampleSize;
        this._waveData = new Float32Array(sampleSize);
        this._consumer = null;
        this._processor = null;
    }

    get sampleSize() {
        return this.sampleSize
    }

    get sampleRate() {
        return this._audioContext.sampleRate;
    }

    /**
     * @param {AudioDataConsumer} audioDataConsumer
     */
    _init_processor(audioDataConsumer) {
        this._consumer = audioDataConsumer;
        if (this._processor != null) {
            console.error("already started");
        } else {
            this._audioContext.resume();
            this._processor = this._audioContext.createScriptProcessor(this._sampleSize, 1, 1);
            this._processor.onaudioprocess = (/**@type AudioProcessingEvent */audioProcessEvent) => {
                const inputBuffer = audioProcessEvent.inputBuffer;

                if (inputBuffer.copyFromChannel !== undefined)
                    audioProcessEvent.inputBuffer.copyFromChannel(this._waveData, 0);
                else
                    this._waveData.set(audioProcessEvent.inputBuffer.getChannelData(0));

                this._consumer.accept(this._waveData);
            };
        }
    }

    /**
     * @param {AudioDataConsumer} audioDataConsumer
     * @param {Array<number>} frequencies
     */
    startTest(audioDataConsumer, frequencies) {
        this._init_processor(audioDataConsumer);
        let gainNode = this._audioContext.createGain();
        gainNode.gain.value = 0.3;

        frequencies.map(fr => {
            let oscillator = this._audioContext.createOscillator();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(fr, this._audioContext.currentTime);
            oscillator.connect(gainNode);
            oscillator.start();
        })
        gainNode.connect(this._processor);
        this._processor.connect(this._audioContext.destination);

    }

    /**
     * @param {AudioDataConsumer} audioDataConsumer
     */
    start(audioDataConsumer) {
        this._init_processor(audioDataConsumer);

        // console.log("sample rate: " + sampleRate);
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                const streamSource = this._audioContext.createMediaStreamSource(stream);
                streamSource.connect(this._processor);
                this._processor.connect(this._audioContext.destination);
            }, () => console.error("couldn't open audio input"))
            .catch(ex => console.error(ex));
    }
}

UserAudioDataSource.AudioContext = window.AudioContext || window.webkitAudioContext;

export class OverlappingDataSource extends AudioDataConsumer {

    /**
     * @param {number} sampleRate
     * @param {number} sampleSize
     * @param {number} windowStep
     */
    constructor(sampleRate, sampleSize, windowStep) {
        super();
        this._sampleRate = sampleRate;
        this._sampleSize = sampleSize;
        this._windowStep = windowStep;
        this._consumer = null;
        this._outputBuffer = new CyclicBuffer(sampleSize);
        this._inputBuffer = new CyclicBuffer(sampleSize * 2);
        this._outputFrameTime = windowStep * 1000 / sampleRate;
        console.debug("moving window step: " + windowStep + " samples");
        console.debug("moving window frame time: " + this._outputFrameTime + "ms");
        this._lastInputTime = 0;
        this._lastOutputTime = 0;
        this._outputBuffer.fill(0);
        this._output = new Float32Array(sampleSize);
        this._overlapBuffer = new Float32Array(this._windowStep);
    }
    _update() {
        let lastFrame = this._lastOutputTime;
        const outputFrameTimeAdjusted = this._outputFrameTime * 0.9;
        let currentTime = Date.now();
        if (lastFrame == 0)
            lastFrame = currentTime - outputFrameTimeAdjusted * 2;
        if (currentTime - lastFrame >= outputFrameTimeAdjusted) {
            this._lastOutputTime = currentTime;
            if (this._inputBuffer.getSize() < this._windowStep) {
            } else {
                let skip = -1;
                while (Date.now() - lastFrame >= outputFrameTimeAdjusted && this._inputBuffer.getSize() >= this._windowStep) {
                    lastFrame += outputFrameTimeAdjusted;
                    skip++;
                    this._outputBuffer.remove(this._windowStep);
                    this._inputBuffer.remove(this._windowStep, this._overlapBuffer);
                    this._outputBuffer.addAll(this._overlapBuffer);
                }
                // if (skip > 0) {
                //     console.debug("skipped " + skip + " frames")
                // }
                this._outputBuffer.output(this._output);
                this._consumer.accept(this._output);
            }
        }
        window.requestAnimationFrame(this._update.bind(this));
    }


    /**
     *
     * @param {Float32Array} data
     */
    accept(data) {
        if (this._inputBuffer.addAll(data)) {
            console.warn("overflow");
        }

        if (this._inputBuffer.getCapacity() - this._inputBuffer.getSize() < (this._sampleSize)) {
            this._lastOutputTime = 0;
        }
    }

    /**
     * @param {AudioDataConsumer} audioDataConsumer
     */
    start(audioDataConsumer) {
        this._consumer = audioDataConsumer;
        window.requestAnimationFrame(this._update.bind(this));
    }

}
