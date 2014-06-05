"use strict";
function BugReporter() {
    var highLightLevel = ["h1", "h2", "h3"];
    var sections = document.querySelectorAll(".sect2");
    var tocAList = document.querySelectorAll("#toc a");
    this.highlighterUtil = new TOCHighlighter(sections, tocAList, highLightLevel);
    this.github_issue_point = "https://github.com/azu/promises-book/issues/new";
    this.github_issue_title = "";
    this.github_issue_body = "";
    this.github_issue_labels = "フィードバック";
}
BugReporter.prototype.getSelectedText = function () {
    var sel, text = "";
    if (window.getSelection) {
        text = "" + window.getSelection();
    } else if ((sel = document.selection) && sel.type == "Text") {
        text = sel.createRange().text;
    }
    return text;
};
BugReporter.prototype.getURLs = function () {
    return this.highlighterUtil.currentTOCElements().map(function (tocElement) {
        return location.protocol + "//" + location.host + location.pathname + tocElement.hash;
    });
};
BugReporter.prototype.setTitle = function (title) {
    this.github_issue_title = title;
};
BugReporter.prototype.setBody = function (body) {
    this.github_issue_body = body;
};
BugReporter.prototype.report = function () {
    var url = this.github_issue_point + "?title=" + encodeURIComponent(this.github_issue_title)
        + "&body=" + encodeURIComponent(this.github_issue_body)
        + "&labels=" + encodeURIComponent(this.github_issue_labels);
    window.open(url, "_blank");
};
window.addEventListener("load", function (event) {

    function quoteText(text){
        return text.split("\n").map(function(line){
            return "> " + line;
        }).join("\n");
    }
    var reportElement = document.createElement("button");
    reportElement.textContent = "バグ報告";
    reportElement.setAttribute("style", "position:fixed; right:0;bottom:0;");
    reportElement.addEventListener("click", function (event) {
        var bug = new BugReporter();
        var selectedText = bug.getSelectedText().trim();
        console.log(selectedText);
        var body = 'URL : ' + bug.getURLs() + "\n";
        if (selectedText && selectedText.length > 0) {
            body += "\n" + quoteText(selectedText) + "\n";
        }
        bug.setBody(body);
        bug.report();
    });
    document.body.appendChild(reportElement);
});

