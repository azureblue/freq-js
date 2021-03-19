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
     * @param {boolean} userAudioWorklets
     */
    constructor(sampleSize, userAudioWorklets = false) {
        /**@type AudioContext*/
        this._audioContext = new UserAudioDataSource.AudioContext();
        this._sampleSize = sampleSize;
        this._waveData = new Float32Array(sampleSize);
        this._consumer = null;
        this._processor = null;
        this._userWorklets = userAudioWorklets;
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
    async _init_processor(audioDataConsumer) {
        if (this._processor != null) {
            console.error("already started");
            return;
        }
        this._consumer = audioDataConsumer;

        if (this._userWorklets) {

            await this._audioContext.audioWorklet.addModule('./bufferedAudioSource.js');
            this._processor = new AudioWorkletNode(this._audioContext, 'BufferedAudioSource_0');

            /** @param {MessageEvent} msgEvent */
            this._processor.port.onmessage = msgEvent => {
                this._consumer.accept(msgEvent.data);
            }
        } else {
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
        this._audioContext.resume();
    }

    /**
     * @param {AudioDataConsumer} audioDataConsumer
     * @param {Array<number>} frequencies
     */
    async startTest(audioDataConsumer, frequencies) {
        await this._init_processor(audioDataConsumer);
        let gainNode = this._audioContext.createGain();
        gainNode.gain.value = 1 / frequencies.length;

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
     * @param {number} sourceSampleSize
     * @param {number} outputSampleSize
     */
    constructor(sampleRate, sourceSampleSize, outputSampleSize) {
        super();
        this._sampleRate = sampleRate;
        this._sampleSize = sourceSampleSize;
        this._outputSampleSize = outputSampleSize;
        this._consumer = null;
        this._outputBuffer = new CyclicBuffer(outputSampleSize);
        console.debug("overlapping window:" + this._outputSampleSize + " / " + this._sampleSize);
        this._outputBuffer.fill(0);
        this._output = new Float32Array(outputSampleSize);
    }
    /**
     *
     * @param {Float32Array} data
     */
    accept(data) {
        this._outputBuffer.addAll(data);
        if (this._outputBuffer.isFull()) {
            this._outputBuffer.output(this._output);
            this._consumer.accept(this._output);
        }
    }

    /**
     * @param {AudioDataConsumer} audioDataConsumer
     */
    setConsumer(audioDataConsumer) {
        this._consumer = audioDataConsumer;
    }
}
