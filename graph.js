function GraphBase(canvas) {
    Object.defineProperty(this, 'width', {get: () => canvas.width});
    Object.defineProperty(this, 'height', {get: () => canvas.height});
    Object.defineProperty(this, 'ctx', {value: canvas.getContext('2d')});
    this.updateSizeAndClean = function() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}

function GraphScale(min, max, tickInterval, tickPrecission) {
    this.min = min;
    this.max = max;
    this.tickInterval = tickInterval;
    this.tickPrecission = tickPrecission;
    this.ticks = function*() {
        for (let tick = this.min; tick <= this.max; tick += this.tickInterval)
            yield tick.toFixed(this.tickPrecission);
    };
    this.normalizeValue = value => (value - this.min) / (this.max - this.min);
}

function NoteIndicator(canvas) {
    GraphBase.call(this, canvas);

    this.drawNote = function(note, centDiff) {
        const ctx = this.ctx;
        this.updateSizeAndClean();
        let noteName = note.name.toUpperCase(), goalFrequency = note.frequency();
        goalFrequency = "" + goalFrequency.toFixed(2) + " Hz";
        let centDiffLabel = "" + centDiff.toFixed(2) + " cents";

        ctx.save();
        ctx.font = '20px sans-serif';
        ctx.tick = 1;
        ctx.strokeStyle = 'rgb(200, 200, 200)';
        ctx.fillStyle = 'rgb(100, 100, 100)';

        const textHeight = ctx.measureText("#").width + 5;
        const absCentDiff = Math.abs(centDiff);

        ctx.fillText(noteName, this.width / 2 - ctx.measureText(noteName).width / 2, textHeight);
        ctx.font = '15px sans-serif';
        ctx.fillText(goalFrequency, this.width / 2 - ctx.measureText(goalFrequency).width / 2, textHeight * 2);
        ctx.fillText(centDiffLabel, this.width / 2 - ctx.measureText(centDiffLabel).width / 2, textHeight * 3);
        ctx.fillRect(this.width / 2, textHeight * 4, centDiff / 50 * this.width / 2, this.height - textHeight * 5);
        ctx.restore();
    }
}

function Graph(canvas, xscale, yscale) {
    GraphBase.call(this, canvas);
    this.font = '8px sans-serif';
    this.gridWidth = 1;
    this.gridStyle = 'rgb(200, 200, 200)';
    this.plotStyle = 'rgb(100, 100, 100)';
    this.labelMargin = 4;
    this.margin = 2;

    const ctx = this.ctx;
    const measureWidth = text => ctx.measureText(text).width;
    //noinspection JSSuspiciousNameCombination
    const textHeight = ctx.measureText("#").width;
    const maxYLabelWidth = Math.max(...[...yscale.ticks()].map(measureWidth));
    const maxXLabelWidth = Math.max(...[...xscale.ticks()].map(measureWidth));
    const graphXPadding = maxYLabelWidth + this.labelMargin * 2;
    const graphYPadding = textHeight + this.labelMargin * 2;
    let graphRect = {x: 0, y: 0, width: 0, height: 0};
    let xpos = xv => Math.round(xscale.normalizeValue(xv) * graphRect.width);
    let ypos = yv => Math.round(graphRect.height - yscale.normalizeValue(yv) * graphRect.height);
    let prepareCtx = () => {
        ctx.tick = this.gridWidth;
        ctx.strokeStyle = this.gridStyle;
        ctx.font = this.font;
    };

    let updateGraphRect = () => {
        graphRect.x = this.margin + graphXPadding;
        graphRect.y = this.margin + this.labelMargin;
        graphRect.width = this.width - graphXPadding - this.margin * 2;
        graphRect.height = this.height - graphYPadding - this.margin * 2;
    };

    this.drawScales = function() {
        this.updateSizeAndClean();
        updateGraphRect();
        ctx.save();
        prepareCtx();
        ctx.translate(graphRect.x, graphRect.y);
        ctx.beginPath();
        for (tick of yscale.ticks()) {
            let labWidth = measureWidth(tick);
            let y = ypos(tick);
            ctx.moveTo(0, y);
            ctx.lineTo(graphRect.width, y);
            ctx.fillText(tick, -labWidth - this.labelMargin, y + textHeight / 2);
        }
        for (tick of xscale.ticks()) {
            let labWidth = measureWidth(tick);
            let x = xpos(tick);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, graphRect.height);
            ctx.fillText(tick, x -labWidth / 2, graphRect.height + textHeight + this.labelMargin);
        }
        ctx.stroke();
        ctx.restore();
    };

    this.plotData = function(xs, ys) {
        let len = xs.length;
        ctx.save();
        prepareCtx();
        ctx.strokeStyle = this.plotStyle;
        ctx.translate(graphRect.x, graphRect.y);
        ctx.beginPath();
        ctx.rect(0, 0, graphRect.width, graphRect.height);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(xpos(xs[0]), ypos(ys[0]));
        for (let i = 1; i < len; i++)
            ctx.lineTo(xpos(xs[i]), ypos(ys[i]));
        ctx.stroke();
        ctx.restore();
    };

    this.plotVerticalLine = function(x, label) {
        let xp = xpos(x);
        if (xp < 0 || xp > graphRect.width)
            return;
        ctx.save();
        prepareCtx();
        let lw = measureWidth(label);
        ctx.translate(graphRect.x, graphRect.y);
        ctx.beginPath();
        ctx.moveTo(xp, lw);
        ctx.lineTo(xp, graphRect.height);
        ctx.stroke();
        if (label !== undefined) {
            ctx.translate(xp, 0);
            ctx.rotate(Math.PI / 2);
            ctx.fillText(label, 1, textHeight / 2);
        }
        ctx.restore();
    };
}
