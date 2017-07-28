function transformInPlace(array, transformFunction) {
    for (let i = 0; i < array.length; i++)
        array[i] = transformFunction(array[i]);
}

function copyElements(src, dst, dstOffset = 0) {
    const len = src.length;
    for (let i = 0; i < len; i++)
        dst[dstOffset + i] = src[i];
}

