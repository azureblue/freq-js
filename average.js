function AverageBuffer(length) {
    const cyclicBuffer = new CyclicBuffer(length);
    let acc = 0;
    let fill = 0;

    this.putValue = function(value) {
        if (fill === length)
            acc -= cyclicBuffer.removeFirst();
        else fill++;
        cyclicBuffer.add(value);
        acc += value;
    };

    this.currentSize = function() {
        return fill;
    };

    this.average = function () {
        if (fill === 0)
            throw "buffer is empty";
        return acc / fill;
    };

    this.removeFirst = function() {
        acc -= cyclicBuffer.removeFirst();
        fill--;
    };

    this.reset = function() {
        cyclicBuffer.reset();
        acc = 0;
        fill = 0;
    }
}

function MovingAverage(spread)  {
    const avgLength = spread * 2 + 1;
    const avgBuffer = new AverageBuffer(avgLength);

    this.apply = function(data) {
        avgBuffer.reset();
        const len = data.length;

        for (let i = 0; i < spread; i++)
            avgBuffer.putValue(data[i]);

        for (let i = 0; i < len - spread; i++) {
            avgBuffer.putValue(data[spread + i]);
            data[i] = avgBuffer.average();
        }

        for (let i = 0; i < spread; i++) {
            avgBuffer.removeFirst();
            data[len - spread + i] = avgBuffer.average();
        }
    }
}

