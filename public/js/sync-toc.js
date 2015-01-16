"use strict";

function TOCHighlighter(sections, tocAList, headerNames, highlightClassName) {
    var toArray = Function.prototype.call.bind(Array.prototype.slice);
    this.sections = toArray(sections);
    this.tocAList = toArray(tocAList);
    this.headerNames = headerNames;
    this.highlightClassName = highlightClassName || "sc-current-element";
}
TOCHighlighter.prototype.updateCurrentTOC = function () {
    var currentTOCElements = this.currentTOCElements();
    var isCurrentTOC = function (element) {
        return currentTOCElements.some(function (toc) {
            return toc === element;
        });
    };

    this.tocAList.forEach(function (element) {
        if (isCurrentTOC(element)) {
            element.classList.add(this.highlightClassName);
        } else {
            element.classList.remove(this.highlightClassName);
        }
    }, this);
};
TOCHighlighter.prototype.currentTOCElements = function () {
    var headerIDs = this.currentHeaders().map(function (element) {
        return element.getAttribute("id");
    });
    return this.tocAList.filter(function (element) {
        return headerIDs.indexOf(element.hash.split("#")[1]) !== -1;
    });

};
TOCHighlighter.prototype.currentHeaders = function () {
    var wScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    var isHeaderElement = function (element) {
        return element != null && element.hasAttribute("id");
    };
    var elements = this.sections.map(function (element) {
        return this.contentInElement(element, wScrollTop)
    }, this);
    return Array.prototype.concat.apply([], elements).filter(isHeaderElement);
};
TOCHighlighter.prototype.contentInElement = function (element, wScrollTop) {
    var originY = element.offsetTop,
        sectionHeight = element.offsetHeight;
    if (originY <= wScrollTop && wScrollTop <= originY + sectionHeight) {
        return this.findAllChildHeader(element);
    }
    return [];
};
TOCHighlighter.prototype.findAllChildHeader = function (parent) {
    var children = parent.children;
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (this.headerNames.indexOf(child.nodeName.toLowerCase()) !== -1) {
            return [child];
        }
    }
    return [];
};
module.exports = TOCHighlighter;
module.exports.initialize = function initialize() {
    var highLightLevel = ["h1", "h2", "h3"];
    var chapters = document.querySelectorAll(".sect1");
    var sections = document.querySelectorAll(".sect2");
    var tocAList = document.querySelectorAll("#toc a");
    var sectionHighlighter = new TOCHighlighter(sections, tocAList, highLightLevel);
    var chapterHighlighter = new TOCHighlighter(chapters, tocAList, highLightLevel, "ch-current-element");

    function updateTOC() {
        sectionHighlighter.updateCurrentTOC();
        chapterHighlighter.updateCurrentTOC();
    }

    function onScroll() {
        requestAnimationFrame && requestAnimationFrame(updateTOC);
    }

    window.addEventListener("scroll", onScroll);
};
