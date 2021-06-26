function JSONPromise(value) {
    return new Promise((resolve) => {
        resolve(JSON.parse(value));
    });
}

