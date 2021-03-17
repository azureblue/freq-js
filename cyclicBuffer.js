export function CyclicBuffer(size, ArrayType = Float32Array) {
    const buffer = new ArrayType(size);
    this.buffer = buffer;
    let start = 0;
    let currentSize = 0;

    this.add = function(el) {
        if (currentSize === size) {
            buffer[start] = el;
            start = (start + 1) % size;
            return true;
        }

        buffer[(start + currentSize++) % size] = el;
        return false;

    };

    this.fill = function(value) {
        while(currentSize < size)
            this.add(value);
    }

    /**
     * @param {TypedArray} data
     */
    this.addAll = function(data) {
        let overflow = false;
        for (let i = 0; i < data.length; i++)
            overflow |= this.add(data[i]);
        return overflow;
    }

    this.getFirst = function() {
        if (currentSize === 0)
            throw "CyclicBuffer: buffer is empty";
        return buffer[start];
    };

    this.removeFirst = function() {
        if (currentSize === 0)
            throw "CyclicBuffer: buffer is empty";
        currentSize--;
        let el = buffer[start];
        start = (start + 1) % size;
        return el;
    };

    this.reset = function() {
        start = 0;
        currentSize = 0;
    };

    /**
     * @param {TypedArray} outputArray
     * @param {number} n
     */
    this.remove = function(n, outputArray) {
        if (outputArray != undefined) {
            for (let i = 0; i < n; i++)
                outputArray[i] = this.removeFirst();
        } else {
            for (let i = 0; i < n; i++)
                this.removeFirst();
        }
    }

    this.output = function(outputArray) {
        for (let i = 0; i < currentSize; i++) {
            outputArray[i] = buffer[(start + i) % size];
        }
    }

    this.getSize = function() {
        return currentSize;
    }

    this.isFull = function() {
        return currentSize == size;
    }

    this.getCapacity = function() {
        return size;
    }
}
