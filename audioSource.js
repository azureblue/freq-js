import { CyclicBuffer } from "./cyclicBuffer.js";
import { relativeTo } from "./utils.js";

const audioWorklet = './bufferedAudioSource.js';

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
    constructor(sampleSize) {
        /**@type AudioContext*/
        this._audioContext = new UserAudioDataSource.AudioContext();
        this._sampleSize = sampleSize;
        this._waveData = new Float32Array(sampleSize);
        this._consumer = null;
        this._processor = null;
    }

    get sampleSize() {
        return this._sampleSize
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

        if (this.supportsAudioWorklets()) {
            await this._audioContext.audioWorklet.addModule(relativeTo(import.meta.url, audioWorklet));
            this._processor = new AudioWorkletNode(this._audioContext, 'BufferedAudioSource_0', {
                /**@type {BufferedAudioSourceOptions} */
                processorOptions: {
                    sampleSize: this.sampleSize
                }
            });

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
        this.streamSource = this._audioContext.createGain();
        this.streamSource.gain.value = 1 / frequencies.length;

        frequencies.map(fr => {
            let oscillator = this._audioContext.createOscillator();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(fr, this._audioContext.currentTime);
            oscillator.connect(this.streamSource);
            oscillator.start();
        })
        this.streamSource.connect(this._processor);
        this._processor.connect(this._audioContext.destination);
    }

    supportsAudioWorklets() {
        if (window.AudioWorkletNode == undefined)
            return false;

        if (this._audioContext.audioWorklet == undefined)
            return false;

        if (this._audioContext.audioWorklet.addModule == undefined)
            return false;

        return true;
    }

    /**
     * @param {AudioDataConsumer} audioDataConsumer
     */
    start(audioDataConsumer) {
        this._init_processor(audioDataConsumer);

        // console.log("sample rate: " + sampleRate);
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                this.streamSource = this._audioContext.createMediaStreamSource(stream);
                this.streamSource.connect(this._processor);
                this._processor.connect(this._audioContext.destination);
            }, () => console.error("couldn't open audio input"))
            .catch(ex => console.error(ex));
    }

    stop() {
        this.streamSource.disconnect();
        this._processor.disconnect();
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
