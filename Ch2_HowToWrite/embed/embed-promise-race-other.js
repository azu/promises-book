const winnerPromise = new Promise((resolve) => {
    setTimeout(() => {
        console.log("this is winner");
        resolve("this is winner");
    }, 4);
});
const loserPromise = new Promise((resolve) => {
    setTimeout(() => {
        console.log("this is loser");
        resolve("this is loser");
    }, 1000);
});

// 一番最初のものがresolveされた時点で終了
Promise.race([winnerPromise, loserPromise]).then((value) => {
    console.log(value); // => 'this is winner'
});
