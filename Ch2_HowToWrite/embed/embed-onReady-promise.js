function onReadyPromise() {
    return new Promise((resolve) => {
        const readyState = document.readyState;
        if (readyState === "interactive" || readyState === "complete") {
            resolve();
        } else {
            window.addEventListener("DOMContentLoaded", resolve);
        }
    });
}

