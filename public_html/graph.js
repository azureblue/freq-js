function GraphScale(min, max, ticks) {
    this.min = min;
    this.max = max;
    this.ticks = ticks;
    this.length = max - min;
}

function Graph(canvas, rect, xScale, yScale) {
    const ctx = canvas.getContext("2d");
    const yMargin = 10;
    const xMargin = 50;
    const textHeight = ctx.measureText("#").width + 2;

    let w = rect.width;
    let h = rect.height;
    let graphsH = h - yMargin;
    let graphsW = w - xMargin;

    function xpos(xv) {
        return Math.round(xMargin + (xv - xScale.min) / xScale.length  * graphsW);
    }

    function ypos(yv) {
        return Math.round(graphsH - (yv - yScale.min) / yScale.length  * graphsH);
    }

    this.drawScales = function() {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgb(200, 200, 200)';
        ctx.font = 'sans-serif';
        ctx.save();
        ctx.translate(rect.x, rect.y);
        ctx.beginPath();
        for (let y = yScale.min; y <= yScale.max; y += yScale.ticks) {
            let labWidth = ctx.measureText("" + y.toFixed(1)).width;
            let pt = new Vec(xMargin, ypos(y));
            ctx.moveTo(pt.x, pt.y + 0.5);
            ctx.lineTo(pt.x + graphsW, pt.y + 0.5);
            pt.move(new Vec(-labWidth - 4, textHeight / 2));
            ctx.fillText(y.toFixed(1), ...pt);
        }

        for (let x = xScale.min; x <= xScale.max; x += xScale.ticks) {
            let labWidth = ctx.measureText("" + x.toFixed(1)).width;
            let pt = new Vec(xpos(x), graphsH);
            ctx.moveTo(pt.x + 0.5, pt.y);
            ctx.lineTo(pt.x + 0.5, 0);
            pt.move(new Vec(-labWidth / 2, textHeight + 4));
            ctx.fillText(x.toFixed(1), ...pt);
        }
        ctx.stroke();
        ctx.restore();
    };

    this.plotData = function(x, y) {
        let len = x.length;
        ctx.strokeStyle = 'rgb(100, 100, 100)';
        ctx.save();
        ctx.translate(rect.x, rect.y);
        ctx.beginPath();
        ctx.rect(xMargin, 0, graphsW, graphsH);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(xpos(x[0]), ypos(y[0]));
        for (let i = 1; i < len; i++)
            ctx.lineTo(xpos(x[i]), ypos(y[i]));
        ctx.stroke();
        ctx.restore();
    }
}
