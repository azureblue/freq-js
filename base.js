import {Rect} from "./geom.js"

export class DOMElementOwner {

    /**
     * @param {string | HTMLElement} element
     */
    constructor(element = "div", classList = []) {
        this.invisibleClass = "invisible";
        if (typeof element == "string") {
            this.element = document.createElement(element);
        } else
            this.element = element;

        classList.forEach(cl => this.element.classList.add(cl));
    }

    get style() {
        return this.element.style;
    }

    /**
     * @param {HTMLElement} parent
     */
    addToParentOrDOM(parent = undefined) {
        let element = this.getElement();

        if (parent != undefined)
            parent.appendChild(element);
        else
            document.body.appendChild(element);
        this.afterAddToDOM();
    }

    remove() {
        this.element.remove();
    }

    getScreenRect() {
        return Rect.fromRect(this.getElement().getBoundingClientRect());
    }

    afterAddToDOM() {

    }

    get width() {
        return this.getScreenRect().width;
    }

    get height() {
        return this.getScreenRect().height;
    }

    get visible() {
        return !this.getElement().classList.contains(this.invisibleClass);
    }

    /**
     * @param {boolean} val
     */
    set visible(val) {
        if (val == false)
            this.getElement().classList.add(this.invisibleClass);
        else
            this.getElement().classList.remove(this.invisibleClass);
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.element;
    }

    updateSize() {

    }
}

export class PositionableElement extends DOMElementOwner {

    constructor(element = "div", classList = []) {
        super(element, classList);
        this.element.classList.add("positionable-element");
        this.rounding = false;
        this.rect = new Rect(0, 0, 0, 0);
    }

    get height() {
        return super.height;
    }

    get width() {
        return super.width;
    }

    set x(x) {
        this.style.left = (this.rect.x = this.rounding ? Math.round(x) : x) + "px";
    }

    get x() {
        return this.rect.x;
    }

    set y(y) {
        this.style.top = (this.rect.y = this.rounding ? Math.round(y) : y) + "px";
    }

    get y() {
        return this.rect.y;
    }

    position(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class RectBoundElement extends PositionableElement {

    constructor(element = "div") {
        super(element);
        this.element.classList.add("rect-bound-element");
    }

    get height() {
        return this.rect.height;
    }

    get width() {
        return this.rect.width;
    }

    set height(h) {
        this.style.height = (this.rect.h = this.rounding ? Math.round(h) : h) + "px";
    }

    set width(w) {
        this.style.width = (this.rect.w = this.rounding ? Math.round(w) : w) + "px";
    }
}

/**
 * @enum {Symbol}
 */
export const ResizeMethod = Object.freeze({
    NONE: Symbol(),
    RESIZE: Symbol(),
    RESIZE_TO_SQUARE: Symbol(),
    SCALE_WIDTH_BASED: Symbol(),
    SCALE_HEIGHT_BASED: Symbol()
});
