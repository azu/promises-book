function asyncFunction() {
    // <1>
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("Async Hello world");
        }, 16);
    });
}
// <2>
asyncFunction().then((value) => {
    console.log(value); // => 'Async Hello world'
}).catch((error) => {
    console.error(error);
});


