function Vec(x, y) {
    this.x = x === undefined ? 0 : x;
    this.y = y === undefined ? 0 : y;
}

Vec.prototype.vector_to = function (vec) {
    return new Vec(vec.x - this.x, vec.y - this.y);
};

Vec.prototype.set = function (x, y) {
    this.x = x;
    this.y = y;
    return this;
};

Vec.prototype.same_position = function (vec) {
    return (this.x === vec.x) && (this.y === vec.y);
};

Vec.prototype.copy = function() {
    return new Vec(this.x, this.y);
};

Vec.prototype.move = function (point) {
    this.x += point.x;
    this.y += point.y;
    return this;
};

Vec.prototype.inverse = function () {
    this.x *= -1;
    this.y *= -1;
    return this;
};

Vec.prototype[Symbol.iterator] = function*() {
    yield this.x;
    yield this.y;
};

Vec.dist = function(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    
    return Math.sqrt(dx * dx + dy * dy);
};

Vec.from_event = function (event) {
    return new Vec(event.offsetX, event.offsetY);
};

function Rect(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

Rect.prototype.set = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
};
