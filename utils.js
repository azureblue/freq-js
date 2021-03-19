/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 */
export function measureText(ctx, text) {
    let metrics = ctx.measureText(text);
    const width = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
    const height = Math.abs(metrics.actualBoundingBoxAscent);

    return {
        width: width,
        height: height,
        halfWidth: width / 2,
        halfHeight: height / 2
    };
}

/**
 * @param {Object} dst
 * @param {Object} from
 */
export function overrideProperties(dst, from = {}) {
    Object.getOwnPropertyNames(from).forEach(prop => dst[prop] = from[prop]);
}

export function cloneObjectShallow(src) {
    let res = {};
    Object.getOwnPropertyNames(src).forEach(prop => res[prop] = src[prop]);
    return res;
}

export function createGetParamsMap() {
    var map = new Map();
    var params = window.location.search.substr(1).split("&");
    params.forEach(par => {
        var kv = par.split("=");
        if (kv[0].length === 0)
            return;
        map.set(kv[0], kv[1]);
    });
    return map;
}
