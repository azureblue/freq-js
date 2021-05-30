import { Transform } from "./transform.js";

export class Pipeline extends Transform {

    /**
     * @param {Array<Transform>} initialPipeline
     */
    constructor(initialPipeline = []) {
        super();
        this._pipeline = initialPipeline;
    }

    /**
     * @param {Transform} transform
     */
    add(transform) {
        this._pipeline.push(transform);
    }

    apply(data) {
        const pipelineLength = this._pipeline.length;
        for(let i = 0; i < pipelineLength; i++) {
            this._pipeline[i].apply(data);
        }
    }
}
