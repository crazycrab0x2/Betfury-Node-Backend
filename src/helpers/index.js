exports.hideUsername = (login) => {
    const firstTwoLetters = login.substr(0, 2);
    const lastTwoLetters = login.substr(-2);
    const middleStars = '*'.repeat(login.length - 4);
    return firstTwoLetters + middleStars + lastTwoLetters;
};