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
