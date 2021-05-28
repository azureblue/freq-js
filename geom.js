export class Rect {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    get width() {
        return this.w;
    }

    get height() {
        return this.h;
    }

    set width(w) {
        return this.w = w;
    }

    set height(h) {
        return this.h = h;
    }

    /**
     * @param {Rect} rect
     */
    intersects(rect, margin = 0) {
        if (this.x - margin > rect.x + rect.w)
            return false;
        if (this.y + margin > rect.y + rect.y)
            return false;
        if (rect.x - margin > this.x + this.w)
            return false;
        if (rect.y + margin> this.y + this.y)
            return false;

        return true;
    }

    get x1() {
        return this.x;
    }

    get x2() {
        return this.x + this.width;
    }

    get y1() {
        return this.y;
    }

    get y2() {
        return this.y + this.height;
    }
}


/**
 * @param {Rect | DOMRect} rect
 * @returns {Rect}
 */
Rect.fromRect = function(rect) {
    return new Rect(rect.x, rect.y, rect.width, rect.height)
}