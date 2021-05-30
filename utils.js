import { TextStyle } from "./graph/style.js";

export function injectCSS(cssRule) {
/**@type {HTMLStyleElement} */
    let customStyles = document.getElementById("custom-style")
    customStyles.sheet.insertRule(cssRule);
}
const CANVAS = document.createElement("canvas");
CANVAS.width = 200;
CANVAS.height = 100;

const CTX = CANVAS.getContext("2d");
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 */
export function measureText(text, ctx = undefined) {
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

// /**
//  *
//  * @param {string} text
//  * @param {TextStyle} textStyle
//  */
// export function measureTextPixels(text, textStyle) {
//     CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
//     textStyle.apply(CTX);
//     CTX.fillText()
// }
/**
 *
 * @param {HTMLDivElement} div
 */
export function measureTextDiv(div) {
    CTX.font = window.getComputedStyle(div).font;
    return measureText(div.innerText, CTX);
}

/**
 * @param {string} text
 * @param {TextStyle} textStyle
 */
export function measureTextFont(text, textStyle) {
    textStyle.apply(CTX);
    return measureText(text, CTX);
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

export class FontSizeCache {
    constructor() {
        this._ctx = document.createElement("canvas").getContext("2d");
        this._widthSet = new Map();
    }
    /**
     * @param {string} cssFont
     * @param {string} letters
     */
    calculate(cssFont, letters) {
        // [as23rad1]
        this._ctx.font = cssFont;
        for (let i = 0; i < letters.length; i++) {
            const letter = letters.charAt(i);
            let measure = measureText(letter, this._ctx);
            this._widthSet.set(letter, measure.width);
        }
        for (let i = 0; i < letters.length; i++)
            for (let j = 0; j < letters.length; j++) {
                let letter2 = letters.charAt(i) + letters.charAt(j);
                let measure = measureText(letter2, this._ctx);
                this._widthSet.set(letter2, measure.width
                    - this._widthSet.get(letter2[0])
                    - this._widthSet.get(letter2[1]));
            }
    }

    /**
     * @param {string} text
     */
    calculateWidth(text) {
        let width = 0;
        for (let i = 0; i < text.length; i++) {
            width += this._widthSet.get(text.charAt(i));
            if (i > 0) {
                width += this._widthSet.get(text.substring(i - 1, i + 1));
            }
        }
        return width;
    }
}

export function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    }
    else {
        cancelFullScreen.call(doc);
    }
}
const isNumRegEx = /^-?(\d*\.)?\d+$/;

export function isNumeric(n, allowScientificNotation = false) {
    return allowScientificNotation ?
                !Number.isNaN(parseFloat(n)) && Number.isFinite(n) :
                isNumRegEx.test(n);
}

export function relativeTo(sourcePath, relativePath) {
    const splitPath = sourcePath.split("/");
    splitPath.pop();
    splitPath.push(relativePath);
    return splitPath.join("/");
}