import { DOMElementOwner } from "../base.js";

export class Spacing {
    constructor(top, right = top, bottom = top, left = top) {
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left;
    }

    asStyle(cssName = "border-width") {
        return `${cssName}: ${this.top}px ${this.right}px ${this.bottom}px ${this.left}px`;
    }

    /**
     * @param {HTMLElement | DOMElementOwner} el
     */
    applyToElement(el, cssName = "border-width") {
        el.style[cssName] = `${this.top}px ${this.right}px ${this.bottom}px ${this.left}px`;
    }

    clone() {
        return new Spacing(this.top, this.right, this.bottom, this.left);
    }
}

export class LabelStyle {
    /**
     * @param {TextStyle} textStyle
     * @param {Spacing} spacing
     */
    constructor(textStyle, spacing) {
        this.textStyle = textStyle;
        this.spacing = spacing;
    }

    /**
     * @param {HTMLElement | DOMElementOwner} el
     */
    applyToElement(el) {
        this.textStyle.applyToElement(el);
        this.spacing.applyToElement(el);
    }

    asStyle() {
        return `${this.spacing.asStyle()}; ${this.textStyle.asStyle()};`
    }

    /**@returns {LabelStyle} */
    clone() {
        return new LabelStyle(this.textStyle.clone(), this.spacing.clone());
    }
}

export class TextStyle {
    /**
     * @param {string} font
     * @param {string} fontSize
     * @param {string} color
     */
    constructor(font, fontSize, color) {
        this.font = font;
        this.fontSize = fontSize;
        this.color = color;
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    apply(ctx) {
        ctx.fillStyle = this.color;
        ctx.font = this.fontString();
    }

    applyToElement(el) {
        el.style.font = this.font;
        el.style.color = this.color;
    }

    asStyle() {
        return `font: ${this.fontString()}; color: ${this.color};`;
    }

    fontString() {
        return `${this.fontSize} ${this.font}`;
    }

    clone() {
        return new TextStyle(this.font, this.fontSize, this.color);
    }
}

export class LineStyle {

    constructor(width, style) {
        this.width = width;
        this.stroke = style;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    apply(ctx) {
        ctx.strokeStyle = this.stroke;
        ctx.lineWidth = this.width;
    }

    asStyle() {
        return `${this.width == undefined ? "" : `stroke-width: ${this.width}px;`}` +
         `${this.stroke == undefined ? "" : `stroke: ${this.stroke};`}`;
    }

}
