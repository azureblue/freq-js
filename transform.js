export class Transform {

    /** @param {TypedArray} data */
    apply(data) {
    };
}

/** @param {TypedArray} data */
Transform.transform = function(data, transform) {
    for (let i = 0; i < data.length; i++)
        data[i] = transform(data[i]);
};
