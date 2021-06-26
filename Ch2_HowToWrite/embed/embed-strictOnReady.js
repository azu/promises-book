function onReady(fn) {
    const readyState = document.readyState;
    if (readyState === "interactive" || readyState === "complete") {
        setTimeout(fn, 0);
    } else {
        window.addEventListener("DOMContentLoaded", fn);
    }
}
