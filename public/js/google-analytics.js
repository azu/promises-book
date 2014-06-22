(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-2184335-14', 'azu.github.io');
ga('send', 'pageview');

window.onload = function () {
    var downloadButton = document.getElementById("download-pdf");
    downloadButton.onclick = function (event) {
        ga('send', 'event', 'button', 'click', '/javascript-promise-book.pdf', {
            hitCallback: function () {
                location.href = downloadButton.href;
            }
        });
        event.preventDefault();
    }
};
window.addEventListener("hashchange", function hashChange() {
    var hash = location.hash;
    var header = document.querySelector(hash);
    var title = header.textContent || header.innerText;
    ga('send', 'pageview', {
        'page': location.pathname + location.search + location.hash,
        'title': title
    });
}, false);
