import { DOMElementOwner } from "../base.js";


/**
 * @typedef {Object} TextStyle
 * @property {string} font
 * @property {string} fillStyle
 */

export const TextStyle = {
    /**
    * @param {string} font
    * @param {string} style
    * @returns {TextStyle}
    */
    make: function (font, style) {
        return {
            font: font,
            style: style
        }
    },

    /**
    * @param {TextStyle} textStyle
    * @param {CanvasRenderingContext2D} ctx
    */
    applyToCtx: function (textStyle, ctx) {
        if (textStyle.fillStyle != undefined) ctx.fillStyle = textStyle.fillStyle;
        if (textStyle.font != undefined) ctx.font = textStyle.font;
    },

    /**
    * @param {TextStyle} textStyle
    * @param {HTMLElement | DOMElementOwner} el
    */
    applyToElement: function (textStyle, el) {
        if (textStyle.fillStyle != undefined) el.style.color = textStyle.fillStyle;
        if (textStyle.font != undefined) el.style.font = textStyle.font;
    },
    /**
    * @param {TextStyle} textStyle
    */
    asStyle(textStyle) {
        return `${textStyle.font != undefined ? `font: ${textStyle.font};` : ""}
        ${textStyle.style != undefined ? `color: ${textStyle.style};` : ""}`;
    }
};
/**
 * @typedef {Array<number>} Spacing
 */

export const Spacing = {
    make: function (top, right = top, bottom = top, left = top) {
        return [top, right, bottom, left];
    },

    /**
     *
     * @param {Spacing} spacing
     * @param {string} cssName
     */
    asStyle: function (spacing, cssName = "border-width") {
        return `${cssName}: ${spacing[0]}px ${spacing[1]}px ${spacing[2]}px ${spacing[3]}px`;
    },

    /**
     * @param {Spacing} spacing
     * @param {HTMLElement | DOMElementOwner} el
     * @param {string} cssName
     */
    applyToElement(spacing, el, cssName = "border-width") {
        el.style[cssName] = `${spacing[0]}px ${spacing[1]}px ${spacing[2]}px ${spacing[3]}px`;
    }
}

/**
 * @typedef {Object} LabelStyle
 * @property {TextStyle} textStyle
 * @property {Spacing} spacing
 */

export const LabelStyle = {
    /**
     * @param {TextStyle} textStyle
     * @param {Spacing} spacing
     */
    make: function (textStyle, spacing) {
        this.textStyle = textStyle;
        this.spacing = spacing;
    },

    /**
     * @param {LabelStyle} labelStyle
     * @param {HTMLElement | DOMElementOwner} el
     */
    applyToElement: function (labelStyle, el) {
        TextStyle.applyToElement(labelStyle.textStyle, el);
        Spacing.applyToElement(this.spacing, el);
    },
    /**
    * @param {LabelStyle} labelStyle
    */
    asStyle: function (labelStyle) {
        return `${TextStyle.asStyle(labelStyle.textStyle)}; ${Spacing.asStyle(labelStyle.spacing)};`;
    }
}


// export class TextStyle {

//     /**
//      * @param {CanvasRenderingContext2D} ctx
//      */
//     apply(ctx) {
//         ctx.fillStyle = this.style;
//         ctx.font = this.font;
//     }

//     applyToElement(el) {
//         el.style.font = this.font;
//         el.style.color = this.style;
//     }

//     asStyle() {
//         return `font: ${ this.font }; color: ${ this.style }; `;
//     }

//     clone() {
//         return new TextStyle(this.font, this.style);
//     }
// }

/**
 * @typedef {Object} LineStyle
 * @property {number} width
 * @property {string} stroke
 */

export const LineStyle = {
    applyToCtx: function(/**@type {LineStyle} */lineStyle, /**@type {CanvasRenderingContext2D} */ctx)  {
        if (lineStyle.stroke != undefined) ctx.strokeStyle = lineStyle.stroke;
        if (lineStyle.width != undefined) ctx.lineWidth = lineStyle.width;
    },
    /**
     * @param {LineStyle} lineStyle
     */
    asStyle: function(lineStyle) {
        return `${ lineStyle.width == undefined ? "" : `stroke-width: ${lineStyle.width}px;` } ` +
        `${ lineStyle.stroke == undefined ? "" : `stroke: ${lineStyle.stroke};` } `;
    },

    /**
     *
     * @param {number} width
     * @param {string} stroke
     * @returns {LineStyle}
     */
    make: function(/**@type {number}*/width, /**@type {string}*/stroke) {
        return {
            width: width,
            stroke: stroke
        }
    }
}

/**
 *
 * @param {Object} style
 */
export function copyStyle(style) {
    return JSON.parse(JSON.stringify(style));
}

// export class LineStyle{

//     constructor(width, style) {
//         this.width = width;
//         this.stroke = style;
//     }

//     /**
//      * @param {CanvasRenderingContext2D} ctx
//      */
//     apply(ctx) {
//         ctx.strokeStyle = this.stroke;
//         ctx.lineWidth = this.width;
//     }

//     asStyle() {
//         return `${ this.width == undefined ? "" : `stroke-width: ${this.width}px;` } ` +
//          `${ this.stroke == undefined ? "" : `stroke: ${this.stroke};` } `;
//     }
// }
