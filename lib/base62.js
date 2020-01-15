function toBase62(n, digits, digitsLen) {
    if (n === 0) {
        return '0';
    }

    let result = '';

    while (n > 0) {
        result = digits[n % digitsLen] + result;
        n = parseInt(n / digitsLen, 10);
    }

    return result;
}

module.exports = {
    toBase62,
};
