function GraphScale(min, max, ticks) {
    this.min = min;
    this.max = max;
    this.ticks = ticks;
    this.length = max - min;
    this.tickPrecission = 1;
    this.generateTicks = function*() {
        for (let tick = this.min; tick <= this.max; tick += this.ticks)
            yield tick.toFixed(this.tickPrecission);
    }
}

function NoteIndicator(canvas, rect) {
    const ctx = canvas.getContext("2d");

    this.drawNote = function(noteName, goalFrequency, centDiff) {
        goalFrequency = goalFrequency.toFixed(2);
        centDiff = centDiff.toFixed(2);
        ctx.save();
        ctx.font = '20px sans-serif';
        const textHeight = ctx.measureText("#").width + 2;
        ctx.tick = 1;
        ctx.strokeStyle = 'rgb(200, 200, 200)';
        const absCentDiff = Math.abs(centDiff);
        ctx.fillStyle = 'rgb(200, 200, 200)';

        ctx.translate(rect.x, rect.y);
        ctx.fillText(noteName, rect.width / 2 - ctx.measureText(noteName).width / 2, textHeight);
        ctx.font = '15px sans-serif';
        ctx.fillText(goalFrequency, rect.width / 2 - ctx.measureText(goalFrequency).width / 2, textHeight * 2);
        ctx.fillText(centDiff, rect.width / 2 - ctx.measureText(centDiff).width / 2, textHeight * 3);
        ctx.fillRect(rect.width / 2, textHeight * 4, centDiff / 50 * rect.width / 2, textHeight * 8);
        ctx.restore();
    }
}
function Graph(canvas, rect, xScale, yScale) {
    const ctx = canvas.getContext("2d");
    let textHeight, maxYLabelWidth, maxXLabelWidth, graphXPadding, graphYPadding, graphRect;
    this.rect = rect;
    this.font = '8px sans-serif';
    this.gridWidth = 1;
    this.gridStyle = 'rgb(200, 200, 200)';
    this.labelMargin = 2;

    function xpos(xv) {
        return Math.round((xv - xScale.min) / xScale.length  * graphRect.width);
    }

    function ypos(yv) {
        return graphRect.height - Math.round((yv - yScale.min) / yScale.length  * graphRect.height);
    }

    let measureWidth = text => ctx.measureText(text).width;

    this.updateSize = function() {
        textHeight = ctx.measureText("#").width + 2;
        maxYLabelWidth = Math.max(...[...yScale.generateTicks()].map(measureWidth));
        maxXLabelWidth = Math.max(...[...xScale.generateTicks()].map(measureWidth));
        graphXPadding = maxYLabelWidth + this.labelMargin * 2;
        graphYPadding = textHeight + this.labelMargin * 2;
        graphRect = new Rect(rect.x + graphXPadding, rect.y + this.labelMargin, rect.width - graphXPadding, rect.height - graphYPadding);
    };

    this.updateSize();

    let setupCtx = () => {
        ctx.tick = this.gridWidth;
        ctx.strokeStyle = this.gridStyle;
        ctx.font = this.font;
    };

    this.drawScales = function() {
        ctx.save();
        setupCtx();
        ctx.translate(graphRect.x, graphRect.y);
        ctx.beginPath();
        for (tick of yScale.generateTicks()) {
            let labWidth = measureWidth(tick);
            let pt = new Vec(0, ypos(tick));
            ctx.moveTo(...pt);
            ctx.lineTo(pt.x + graphRect.width, pt.y);
            pt.move(new Vec(-labWidth - this.labelMargin , textHeight / 2));
            ctx.fillText(tick, ...pt);
        }

        for (tick of xScale.generateTicks()) {
            let labWidth = measureWidth(tick);
            let pt = new Vec(xpos(tick), 0);
            ctx.moveTo(...pt);
            ctx.lineTo(pt.x, pt.y = graphRect.height);
            pt.move(new Vec(-labWidth / 2 - this.labelMargin, textHeight + this.labelMargin));
            ctx.fillText(tick, ...pt);
        }

        ctx.stroke();
        ctx.restore();
    };

    this.plotData = function(x, y) {
        let len = x.length;
        ctx.save();
        setupCtx();
        ctx.strokeStyle = 'rgb(100, 100, 100)';
        ctx.translate(graphRect.x, graphRect.y);
        ctx.beginPath();
        ctx.rect(0, 0, graphRect.width, graphRect.height);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(xpos(x[0]), ypos(y[0]));
        for (let i = 1; i < len; i++)
            ctx.lineTo(xpos(x[i]), ypos(y[i]));
        ctx.stroke();
        ctx.restore();
    };

    this.plotVerticalLine = function(x, label) {
        let pt = new Vec(xpos(x), 0);
        if (pt.x < 0 || pt.x > graphRect.width)
            return;
        ctx.save();
        setupCtx();
        ctx.translate(graphRect.x, graphRect.y);
        ctx.beginPath();
        ctx.moveTo(...pt);
        ctx.lineTo(pt.x, graphRect.height);
        ctx.stroke();
        if (label !== undefined)
            ctx.fillText(label, pt.x - measureWidth(label) / 2, textHeight);

        ctx.restore();
    };
}
