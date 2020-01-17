function toBase62(n, symbols, len) {
    let inputCounter = +n;
    if (inputCounter === 0) {
        return '0';
    }

    let result = '';

    while (inputCounter > 0) {
        result = symbols[inputCounter % len] + result;
        inputCounter = parseInt(inputCounter/len, 10);
    }

    return result;
}

module.exports = {
    toBase62,
};
