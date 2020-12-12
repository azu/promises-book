function onReady(fn) {
    const readyState = document.readyState;
    if (readyState === "interactive" || readyState === "complete") {
        fn();
    } else {
        window.addEventListener("DOMContentLoaded", fn);
    }
}
