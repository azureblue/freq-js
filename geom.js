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

}