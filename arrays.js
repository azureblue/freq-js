function transformInPlace(array, transformFunction) {
    for (let i = 0; i < array.length; i++)
        array[i] = transformFunction(array[i]);
}

function copyElements(from, to) {
    const len = from.length;
    for (let i = 0; i < len; i++)
        to[i] = from[i];
}

