(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.ConsoleUI=e():t.ConsoleUI=e()}(window,function(){return function(t){var e={};function r(n){if(e[n])return e[n].exports;var i=e[n]={i:n,l:!1,exports:{}};return t[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}return r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)r.d(n,i,function(e){return t[e]}.bind(null,i));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=4)}([function(t,e,r){t.exports=function(){"use strict";var t=navigator.userAgent,e=navigator.platform,r=/gecko\/\d/i.test(t),n=/MSIE \d/.test(t),i=/Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(t),o=/Edge\/(\d+)/.exec(t),l=n||i||o,a=l&&(n?document.documentMode||6:+(o||i)[1]),s=!o&&/WebKit\//.test(t),u=s&&/Qt\/\d+\.\d+/.test(t),c=!o&&/Chrome\//.test(t),f=/Opera\//.test(t),h=/Apple Computer/.test(navigator.vendor),d=/Mac OS X 1\d\D([8-9]|\d\d)\D/.test(t),p=/PhantomJS/.test(t),v=!o&&/AppleWebKit/.test(t)&&/Mobile\/\w+/.test(t),g=/Android/.test(t),m=v||g||/webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(t),y=v||/Mac/.test(e),b=/\bCrOS\b/.test(t),w=/win/i.test(e),x=f&&t.match(/Version\/(\d*\.\d*)/);x&&(x=Number(x[1])),x&&x>=15&&(f=!1,s=!0);var C=y&&(u||f&&(null==x||x<12.11)),k=r||l&&a>=9;function M(t){return new RegExp("(^|\\s)"+t+"(?:$|\\s)\\s*")}var L,T=function(t,e){var r=t.className,n=M(e).exec(r);if(n){var i=r.slice(n.index+n[0].length);t.className=r.slice(0,n.index)+(i?n[1]+i:"")}};function O(t){for(var e=t.childNodes.length;e>0;--e)t.removeChild(t.firstChild);return t}function N(t,e){return O(t).appendChild(e)}function S(t,e,r,n){var i=document.createElement(t);if(r&&(i.className=r),n&&(i.style.cssText=n),"string"==typeof e)i.appendChild(document.createTextNode(e));else if(e)for(var o=0;o<e.length;++o)i.appendChild(e[o]);return i}function A(t,e,r,n){var i=S(t,e,r,n);return i.setAttribute("role","presentation"),i}function D(t,e){if(3==e.nodeType&&(e=e.parentNode),t.contains)return t.contains(e);do{if(11==e.nodeType&&(e=e.host),e==t)return!0}while(e=e.parentNode)}function E(){var t;try{t=document.activeElement}catch(e){t=document.body||null}for(;t&&t.shadowRoot&&t.shadowRoot.activeElement;)t=t.shadowRoot.activeElement;return t}function W(t,e){var r=t.className;M(e).test(r)||(t.className+=(r?" ":"")+e)}function H(t,e){for(var r=t.split(" "),n=0;n<r.length;n++)r[n]&&!M(r[n]).test(e)&&(e+=" "+r[n]);return e}L=document.createRange?function(t,e,r,n){var i=document.createRange();return i.setEnd(n||t,r),i.setStart(t,e),i}:function(t,e,r){var n=document.body.createTextRange();try{n.moveToElementText(t.parentNode)}catch(t){return n}return n.collapse(!0),n.moveEnd("character",r),n.moveStart("character",e),n};var z=function(t){t.select()};function I(t){var e=Array.prototype.slice.call(arguments,1);return function(){return t.apply(null,e)}}function _(t,e,r){for(var n in e||(e={}),t)!t.hasOwnProperty(n)||!1===r&&e.hasOwnProperty(n)||(e[n]=t[n]);return e}function F(t,e,r,n,i){null==e&&-1==(e=t.search(/[^\s\u00a0]/))&&(e=t.length);for(var o=n||0,l=i||0;;){var a=t.indexOf("\t",o);if(a<0||a>=e)return l+(e-o);l+=a-o,l+=r-l%r,o=a+1}}v?z=function(t){t.selectionStart=0,t.selectionEnd=t.value.length}:l&&(z=function(t){try{t.select()}catch(t){}});var R=function(){this.id=null};function P(t,e){for(var r=0;r<t.length;++r)if(t[r]==e)return r;return-1}R.prototype.set=function(t,e){clearTimeout(this.id),this.id=setTimeout(e,t)};var U=30,B={toString:function(){return"CodeMirror.Pass"}},G={scroll:!1},K={origin:"*mouse"},q={origin:"+move"};function X(t,e,r){for(var n=0,i=0;;){var o=t.indexOf("\t",n);-1==o&&(o=t.length);var l=o-n;if(o==t.length||i+l>=e)return n+Math.min(l,e-i);if(i+=o-n,n=o+1,(i+=r-i%r)>=e)return n}}var Y=[""];function J(t){for(;Y.length<=t;)Y.push(Z(Y)+" ");return Y[t]}function Z(t){return t[t.length-1]}function Q(t,e){for(var r=[],n=0;n<t.length;n++)r[n]=e(t[n],n);return r}function j(){}function V(t,e){var r;return Object.create?r=Object.create(t):(j.prototype=t,r=new j),e&&_(e,r),r}var $=/[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;function tt(t){return/\w/.test(t)||t>""&&(t.toUpperCase()!=t.toLowerCase()||$.test(t))}function et(t,e){return e?!!(e.source.indexOf("\\w")>-1&&tt(t))||e.test(t):tt(t)}function rt(t){for(var e in t)if(t.hasOwnProperty(e)&&t[e])return!1;return!0}var nt=/[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;function it(t){return t.charCodeAt(0)>=768&&nt.test(t)}function ot(t,e,r){for(;(r<0?e>0:e<t.length)&&it(t.charAt(e));)e+=r;return e}function lt(t,e,r){for(var n=e>r?-1:1;;){if(e==r)return e;var i=(e+r)/2,o=n<0?Math.ceil(i):Math.floor(i);if(o==e)return t(o)?e:r;t(o)?r=o:e=o+n}}function at(t,e,n){var i=this;this.input=n,i.scrollbarFiller=S("div",null,"CodeMirror-scrollbar-filler"),i.scrollbarFiller.setAttribute("cm-not-content","true"),i.gutterFiller=S("div",null,"CodeMirror-gutter-filler"),i.gutterFiller.setAttribute("cm-not-content","true"),i.lineDiv=A("div",null,"CodeMirror-code"),i.selectionDiv=S("div",null,null,"position: relative; z-index: 1"),i.cursorDiv=S("div",null,"CodeMirror-cursors"),i.measure=S("div",null,"CodeMirror-measure"),i.lineMeasure=S("div",null,"CodeMirror-measure"),i.lineSpace=A("div",[i.measure,i.lineMeasure,i.selectionDiv,i.cursorDiv,i.lineDiv],null,"position: relative; outline: none");var o=A("div",[i.lineSpace],"CodeMirror-lines");i.mover=S("div",[o],null,"position: relative"),i.sizer=S("div",[i.mover],"CodeMirror-sizer"),i.sizerWidth=null,i.heightForcer=S("div",null,null,"position: absolute; height: "+U+"px; width: 1px;"),i.gutters=S("div",null,"CodeMirror-gutters"),i.lineGutter=null,i.scroller=S("div",[i.sizer,i.heightForcer,i.gutters],"CodeMirror-scroll"),i.scroller.setAttribute("tabIndex","-1"),i.wrapper=S("div",[i.scrollbarFiller,i.gutterFiller,i.scroller],"CodeMirror"),l&&a<8&&(i.gutters.style.zIndex=-1,i.scroller.style.paddingRight=0),s||r&&m||(i.scroller.draggable=!0),t&&(t.appendChild?t.appendChild(i.wrapper):t(i.wrapper)),i.viewFrom=i.viewTo=e.first,i.reportedViewFrom=i.reportedViewTo=e.first,i.view=[],i.renderedView=null,i.externalMeasured=null,i.viewOffset=0,i.lastWrapHeight=i.lastWrapWidth=0,i.updateLineNumbers=null,i.nativeBarWidth=i.barHeight=i.barWidth=0,i.scrollbarsClipped=!1,i.lineNumWidth=i.lineNumInnerWidth=i.lineNumChars=null,i.alignWidgets=!1,i.cachedCharWidth=i.cachedTextHeight=i.cachedPaddingH=null,i.maxLine=null,i.maxLineLength=0,i.maxLineChanged=!1,i.wheelDX=i.wheelDY=i.wheelStartX=i.wheelStartY=null,i.shift=!1,i.selForContextMenu=null,i.activeTouch=null,n.init(i)}function st(t,e){if((e-=t.first)<0||e>=t.size)throw new Error("There is no line "+(e+t.first)+" in the document.");for(var r=t;!r.lines;)for(var n=0;;++n){var i=r.children[n],o=i.chunkSize();if(e<o){r=i;break}e-=o}return r.lines[e]}function ut(t,e,r){var n=[],i=e.line;return t.iter(e.line,r.line+1,function(t){var o=t.text;i==r.line&&(o=o.slice(0,r.ch)),i==e.line&&(o=o.slice(e.ch)),n.push(o),++i}),n}function ct(t,e,r){var n=[];return t.iter(e,r,function(t){n.push(t.text)}),n}function ft(t,e){var r=e-t.height;if(r)for(var n=t;n;n=n.parent)n.height+=r}function ht(t){if(null==t.parent)return null;for(var e=t.parent,r=P(e.lines,t),n=e.parent;n;e=n,n=n.parent)for(var i=0;n.children[i]!=e;++i)r+=n.children[i].chunkSize();return r+e.first}function dt(t,e){var r=t.first;t:do{for(var n=0;n<t.children.length;++n){var i=t.children[n],o=i.height;if(e<o){t=i;continue t}e-=o,r+=i.chunkSize()}return r}while(!t.lines);for(var l=0;l<t.lines.length;++l){var a=t.lines[l],s=a.height;if(e<s)break;e-=s}return r+l}function pt(t,e){return e>=t.first&&e<t.first+t.size}function vt(t,e){return String(t.lineNumberFormatter(e+t.firstLineNumber))}function gt(t,e,r){if(void 0===r&&(r=null),!(this instanceof gt))return new gt(t,e,r);this.line=t,this.ch=e,this.sticky=r}function mt(t,e){return t.line-e.line||t.ch-e.ch}function yt(t,e){return t.sticky==e.sticky&&0==mt(t,e)}function bt(t){return gt(t.line,t.ch)}function wt(t,e){return mt(t,e)<0?e:t}function xt(t,e){return mt(t,e)<0?t:e}function Ct(t,e){return Math.max(t.first,Math.min(e,t.first+t.size-1))}function kt(t,e){if(e.line<t.first)return gt(t.first,0);var r=t.first+t.size-1;return e.line>r?gt(r,st(t,r).text.length):function(t,e){var r=t.ch;return null==r||r>e?gt(t.line,e):r<0?gt(t.line,0):t}(e,st(t,e.line).text.length)}function Mt(t,e){for(var r=[],n=0;n<e.length;n++)r[n]=kt(t,e[n]);return r}var Lt=!1,Tt=!1;function Ot(t,e,r){this.marker=t,this.from=e,this.to=r}function Nt(t,e){if(t)for(var r=0;r<t.length;++r){var n=t[r];if(n.marker==e)return n}}function St(t,e){for(var r,n=0;n<t.length;++n)t[n]!=e&&(r||(r=[])).push(t[n]);return r}function At(t,e){if(e.full)return null;var r=pt(t,e.from.line)&&st(t,e.from.line).markedSpans,n=pt(t,e.to.line)&&st(t,e.to.line).markedSpans;if(!r&&!n)return null;var i=e.from.ch,o=e.to.ch,l=0==mt(e.from,e.to),a=function(t,e,r){var n;if(t)for(var i=0;i<t.length;++i){var o=t[i],l=o.marker,a=null==o.from||(l.inclusiveLeft?o.from<=e:o.from<e);if(a||o.from==e&&"bookmark"==l.type&&(!r||!o.marker.insertLeft)){var s=null==o.to||(l.inclusiveRight?o.to>=e:o.to>e);(n||(n=[])).push(new Ot(l,o.from,s?null:o.to))}}return n}(r,i,l),s=function(t,e,r){var n;if(t)for(var i=0;i<t.length;++i){var o=t[i],l=o.marker,a=null==o.to||(l.inclusiveRight?o.to>=e:o.to>e);if(a||o.from==e&&"bookmark"==l.type&&(!r||o.marker.insertLeft)){var s=null==o.from||(l.inclusiveLeft?o.from<=e:o.from<e);(n||(n=[])).push(new Ot(l,s?null:o.from-e,null==o.to?null:o.to-e))}}return n}(n,o,l),u=1==e.text.length,c=Z(e.text).length+(u?i:0);if(a)for(var f=0;f<a.length;++f){var h=a[f];if(null==h.to){var d=Nt(s,h.marker);d?u&&(h.to=null==d.to?null:d.to+c):h.to=i}}if(s)for(var p=0;p<s.length;++p){var v=s[p];if(null!=v.to&&(v.to+=c),null==v.from){var g=Nt(a,v.marker);g||(v.from=c,u&&(a||(a=[])).push(v))}else v.from+=c,u&&(a||(a=[])).push(v)}a&&(a=Dt(a)),s&&s!=a&&(s=Dt(s));var m=[a];if(!u){var y,b=e.text.length-2;if(b>0&&a)for(var w=0;w<a.length;++w)null==a[w].to&&(y||(y=[])).push(new Ot(a[w].marker,null,null));for(var x=0;x<b;++x)m.push(y);m.push(s)}return m}function Dt(t){for(var e=0;e<t.length;++e){var r=t[e];null!=r.from&&r.from==r.to&&!1!==r.marker.clearWhenEmpty&&t.splice(e--,1)}return t.length?t:null}function Et(t){var e=t.markedSpans;if(e){for(var r=0;r<e.length;++r)e[r].marker.detachLine(t);t.markedSpans=null}}function Wt(t,e){if(e){for(var r=0;r<e.length;++r)e[r].marker.attachLine(t);t.markedSpans=e}}function Ht(t){return t.inclusiveLeft?-1:0}function zt(t){return t.inclusiveRight?1:0}function It(t,e){var r=t.lines.length-e.lines.length;if(0!=r)return r;var n=t.find(),i=e.find(),o=mt(n.from,i.from)||Ht(t)-Ht(e);if(o)return-o;var l=mt(n.to,i.to)||zt(t)-zt(e);return l||e.id-t.id}function _t(t,e){var r,n=Tt&&t.markedSpans;if(n)for(var i=void 0,o=0;o<n.length;++o)(i=n[o]).marker.collapsed&&null==(e?i.from:i.to)&&(!r||It(r,i.marker)<0)&&(r=i.marker);return r}function Ft(t){return _t(t,!0)}function Rt(t){return _t(t,!1)}function Pt(t,e){var r,n=Tt&&t.markedSpans;if(n)for(var i=0;i<n.length;++i){var o=n[i];o.marker.collapsed&&(null==o.from||o.from<e)&&(null==o.to||o.to>e)&&(!r||It(r,o.marker)<0)&&(r=o.marker)}return r}function Ut(t,e,r,n,i){var o=st(t,e),l=Tt&&o.markedSpans;if(l)for(var a=0;a<l.length;++a){var s=l[a];if(s.marker.collapsed){var u=s.marker.find(0),c=mt(u.from,r)||Ht(s.marker)-Ht(i),f=mt(u.to,n)||zt(s.marker)-zt(i);if(!(c>=0&&f<=0||c<=0&&f>=0)&&(c<=0&&(s.marker.inclusiveRight&&i.inclusiveLeft?mt(u.to,r)>=0:mt(u.to,r)>0)||c>=0&&(s.marker.inclusiveRight&&i.inclusiveLeft?mt(u.from,n)<=0:mt(u.from,n)<0)))return!0}}}function Bt(t){for(var e;e=Ft(t);)t=e.find(-1,!0).line;return t}function Gt(t,e){var r=st(t,e),n=Bt(r);return r==n?e:ht(n)}function Kt(t,e){if(e>t.lastLine())return e;var r,n=st(t,e);if(!qt(t,n))return e;for(;r=Rt(n);)n=r.find(1,!0).line;return ht(n)+1}function qt(t,e){var r=Tt&&e.markedSpans;if(r)for(var n=void 0,i=0;i<r.length;++i)if((n=r[i]).marker.collapsed){if(null==n.from)return!0;if(!n.marker.widgetNode&&0==n.from&&n.marker.inclusiveLeft&&Xt(t,e,n))return!0}}function Xt(t,e,r){if(null==r.to){var n=r.marker.find(1,!0);return Xt(t,n.line,Nt(n.line.markedSpans,r.marker))}if(r.marker.inclusiveRight&&r.to==e.text.length)return!0;for(var i=void 0,o=0;o<e.markedSpans.length;++o)if((i=e.markedSpans[o]).marker.collapsed&&!i.marker.widgetNode&&i.from==r.to&&(null==i.to||i.to!=r.from)&&(i.marker.inclusiveLeft||r.marker.inclusiveRight)&&Xt(t,e,i))return!0}function Yt(t){t=Bt(t);for(var e=0,r=t.parent,n=0;n<r.lines.length;++n){var i=r.lines[n];if(i==t)break;e+=i.height}for(var o=r.parent;o;o=(r=o).parent)for(var l=0;l<o.children.length;++l){var a=o.children[l];if(a==r)break;e+=a.height}return e}function Jt(t){if(0==t.height)return 0;for(var e,r=t.text.length,n=t;e=Ft(n);){var i=e.find(0,!0);n=i.from.line,r+=i.from.ch-i.to.ch}for(n=t;e=Rt(n);){var o=e.find(0,!0);r-=n.text.length-o.from.ch,n=o.to.line,r+=n.text.length-o.to.ch}return r}function Zt(t){var e=t.display,r=t.doc;e.maxLine=st(r,r.first),e.maxLineLength=Jt(e.maxLine),e.maxLineChanged=!0,r.iter(function(t){var r=Jt(t);r>e.maxLineLength&&(e.maxLineLength=r,e.maxLine=t)})}var Qt=null;function jt(t,e,r){var n;Qt=null;for(var i=0;i<t.length;++i){var o=t[i];if(o.from<e&&o.to>e)return i;o.to==e&&(o.from!=o.to&&"before"==r?n=i:Qt=i),o.from==e&&(o.from!=o.to&&"before"!=r?n=i:Qt=i)}return null!=n?n:Qt}var Vt=function(){var t="bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN",e="nnnnnnNNr%%r,rNNmmmmmmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmnNmmmmmmrrmmNmmmmrr1111111111";var r=/[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/,n=/[stwN]/,i=/[LRr]/,o=/[Lb1n]/,l=/[1n]/;function a(t,e,r){this.level=t,this.from=e,this.to=r}return function(s,u){var c,f="ltr"==u?"L":"R";if(0==s.length||"ltr"==u&&!r.test(s))return!1;for(var h=s.length,d=[],p=0;p<h;++p)d.push((c=s.charCodeAt(p))<=247?t.charAt(c):1424<=c&&c<=1524?"R":1536<=c&&c<=1785?e.charAt(c-1536):1774<=c&&c<=2220?"r":8192<=c&&c<=8203?"w":8204==c?"b":"L");for(var v=0,g=f;v<h;++v){var m=d[v];"m"==m?d[v]=g:g=m}for(var y=0,b=f;y<h;++y){var w=d[y];"1"==w&&"r"==b?d[y]="n":i.test(w)&&(b=w,"r"==w&&(d[y]="R"))}for(var x=1,C=d[0];x<h-1;++x){var k=d[x];"+"==k&&"1"==C&&"1"==d[x+1]?d[x]="1":","!=k||C!=d[x+1]||"1"!=C&&"n"!=C||(d[x]=C),C=k}for(var M=0;M<h;++M){var L=d[M];if(","==L)d[M]="N";else if("%"==L){var T=void 0;for(T=M+1;T<h&&"%"==d[T];++T);for(var O=M&&"!"==d[M-1]||T<h&&"1"==d[T]?"1":"N",N=M;N<T;++N)d[N]=O;M=T-1}}for(var S=0,A=f;S<h;++S){var D=d[S];"L"==A&&"1"==D?d[S]="L":i.test(D)&&(A=D)}for(var E=0;E<h;++E)if(n.test(d[E])){var W=void 0;for(W=E+1;W<h&&n.test(d[W]);++W);for(var H="L"==(E?d[E-1]:f),z="L"==(W<h?d[W]:f),I=H==z?H?"L":"R":f,_=E;_<W;++_)d[_]=I;E=W-1}for(var F,R=[],P=0;P<h;)if(o.test(d[P])){var U=P;for(++P;P<h&&o.test(d[P]);++P);R.push(new a(0,U,P))}else{var B=P,G=R.length;for(++P;P<h&&"L"!=d[P];++P);for(var K=B;K<P;)if(l.test(d[K])){B<K&&R.splice(G,0,new a(1,B,K));var q=K;for(++K;K<P&&l.test(d[K]);++K);R.splice(G,0,new a(2,q,K)),B=K}else++K;B<P&&R.splice(G,0,new a(1,B,P))}return"ltr"==u&&(1==R[0].level&&(F=s.match(/^\s+/))&&(R[0].from=F[0].length,R.unshift(new a(0,0,F[0].length))),1==Z(R).level&&(F=s.match(/\s+$/))&&(Z(R).to-=F[0].length,R.push(new a(0,h-F[0].length,h)))),"rtl"==u?R.reverse():R}}();function $t(t,e){var r=t.order;return null==r&&(r=t.order=Vt(t.text,e)),r}var te=[],ee=function(t,e,r){if(t.addEventListener)t.addEventListener(e,r,!1);else if(t.attachEvent)t.attachEvent("on"+e,r);else{var n=t._handlers||(t._handlers={});n[e]=(n[e]||te).concat(r)}};function re(t,e){return t._handlers&&t._handlers[e]||te}function ne(t,e,r){if(t.removeEventListener)t.removeEventListener(e,r,!1);else if(t.detachEvent)t.detachEvent("on"+e,r);else{var n=t._handlers,i=n&&n[e];if(i){var o=P(i,r);o>-1&&(n[e]=i.slice(0,o).concat(i.slice(o+1)))}}}function ie(t,e){var r=re(t,e);if(r.length)for(var n=Array.prototype.slice.call(arguments,2),i=0;i<r.length;++i)r[i].apply(null,n)}function oe(t,e,r){return"string"==typeof e&&(e={type:e,preventDefault:function(){this.defaultPrevented=!0}}),ie(t,r||e.type,t,e),fe(e)||e.codemirrorIgnore}function le(t){var e=t._handlers&&t._handlers.cursorActivity;if(e)for(var r=t.curOp.cursorActivityHandlers||(t.curOp.cursorActivityHandlers=[]),n=0;n<e.length;++n)-1==P(r,e[n])&&r.push(e[n])}function ae(t,e){return re(t,e).length>0}function se(t){t.prototype.on=function(t,e){ee(this,t,e)},t.prototype.off=function(t,e){ne(this,t,e)}}function ue(t){t.preventDefault?t.preventDefault():t.returnValue=!1}function ce(t){t.stopPropagation?t.stopPropagation():t.cancelBubble=!0}function fe(t){return null!=t.defaultPrevented?t.defaultPrevented:0==t.returnValue}function he(t){ue(t),ce(t)}function de(t){return t.target||t.srcElement}function pe(t){var e=t.which;return null==e&&(1&t.button?e=1:2&t.button?e=3:4&t.button&&(e=2)),y&&t.ctrlKey&&1==e&&(e=3),e}var ve,ge,me=function(){if(l&&a<9)return!1;var t=S("div");return"draggable"in t||"dragDrop"in t}();function ye(t){if(null==ve){var e=S("span","​");N(t,S("span",[e,document.createTextNode("x")])),0!=t.firstChild.offsetHeight&&(ve=e.offsetWidth<=1&&e.offsetHeight>2&&!(l&&a<8))}var r=ve?S("span","​"):S("span"," ",null,"display: inline-block; width: 1px; margin-right: -1px");return r.setAttribute("cm-text",""),r}function be(t){if(null!=ge)return ge;var e=N(t,document.createTextNode("AخA")),r=L(e,0,1).getBoundingClientRect(),n=L(e,1,2).getBoundingClientRect();return O(t),!(!r||r.left==r.right)&&(ge=n.right-r.right<3)}var we,xe=3!="\n\nb".split(/\n/).length?function(t){for(var e=0,r=[],n=t.length;e<=n;){var i=t.indexOf("\n",e);-1==i&&(i=t.length);var o=t.slice(e,"\r"==t.charAt(i-1)?i-1:i),l=o.indexOf("\r");-1!=l?(r.push(o.slice(0,l)),e+=l+1):(r.push(o),e=i+1)}return r}:function(t){return t.split(/\r\n?|\n/)},Ce=window.getSelection?function(t){try{return t.selectionStart!=t.selectionEnd}catch(t){return!1}}:function(t){var e;try{e=t.ownerDocument.selection.createRange()}catch(t){}return!(!e||e.parentElement()!=t)&&0!=e.compareEndPoints("StartToEnd",e)},ke="oncopy"in(we=S("div"))||(we.setAttribute("oncopy","return;"),"function"==typeof we.oncopy),Me=null,Le={},Te={};function Oe(t){if("string"==typeof t&&Te.hasOwnProperty(t))t=Te[t];else if(t&&"string"==typeof t.name&&Te.hasOwnProperty(t.name)){var e=Te[t.name];"string"==typeof e&&(e={name:e}),(t=V(e,t)).name=e.name}else{if("string"==typeof t&&/^[\w\-]+\/[\w\-]+\+xml$/.test(t))return Oe("application/xml");if("string"==typeof t&&/^[\w\-]+\/[\w\-]+\+json$/.test(t))return Oe("application/json")}return"string"==typeof t?{name:t}:t||{name:"null"}}function Ne(t,e){e=Oe(e);var r=Le[e.name];if(!r)return Ne(t,"text/plain");var n=r(t,e);if(Se.hasOwnProperty(e.name)){var i=Se[e.name];for(var o in i)i.hasOwnProperty(o)&&(n.hasOwnProperty(o)&&(n["_"+o]=n[o]),n[o]=i[o])}if(n.name=e.name,e.helperType&&(n.helperType=e.helperType),e.modeProps)for(var l in e.modeProps)n[l]=e.modeProps[l];return n}var Se={};function Ae(t,e){var r=Se.hasOwnProperty(t)?Se[t]:Se[t]={};_(e,r)}function De(t,e){if(!0===e)return e;if(t.copyState)return t.copyState(e);var r={};for(var n in e){var i=e[n];i instanceof Array&&(i=i.concat([])),r[n]=i}return r}function Ee(t,e){for(var r;t.innerMode&&(r=t.innerMode(e))&&r.mode!=t;)e=r.state,t=r.mode;return r||{mode:t,state:e}}function We(t,e,r){return!t.startState||t.startState(e,r)}var He=function(t,e,r){this.pos=this.start=0,this.string=t,this.tabSize=e||8,this.lastColumnPos=this.lastColumnValue=0,this.lineStart=0,this.lineOracle=r};He.prototype.eol=function(){return this.pos>=this.string.length},He.prototype.sol=function(){return this.pos==this.lineStart},He.prototype.peek=function(){return this.string.charAt(this.pos)||void 0},He.prototype.next=function(){if(this.pos<this.string.length)return this.string.charAt(this.pos++)},He.prototype.eat=function(t){var e=this.string.charAt(this.pos);if("string"==typeof t?e==t:e&&(t.test?t.test(e):t(e)))return++this.pos,e},He.prototype.eatWhile=function(t){for(var e=this.pos;this.eat(t););return this.pos>e},He.prototype.eatSpace=function(){for(var t=this.pos;/[\s\u00a0]/.test(this.string.charAt(this.pos));)++this.pos;return this.pos>t},He.prototype.skipToEnd=function(){this.pos=this.string.length},He.prototype.skipTo=function(t){var e=this.string.indexOf(t,this.pos);if(e>-1)return this.pos=e,!0},He.prototype.backUp=function(t){this.pos-=t},He.prototype.column=function(){return this.lastColumnPos<this.start&&(this.lastColumnValue=F(this.string,this.start,this.tabSize,this.lastColumnPos,this.lastColumnValue),this.lastColumnPos=this.start),this.lastColumnValue-(this.lineStart?F(this.string,this.lineStart,this.tabSize):0)},He.prototype.indentation=function(){return F(this.string,null,this.tabSize)-(this.lineStart?F(this.string,this.lineStart,this.tabSize):0)},He.prototype.match=function(t,e,r){if("string"!=typeof t){var n=this.string.slice(this.pos).match(t);return n&&n.index>0?null:(n&&!1!==e&&(this.pos+=n[0].length),n)}var i=function(t){return r?t.toLowerCase():t},o=this.string.substr(this.pos,t.length);if(i(o)==i(t))return!1!==e&&(this.pos+=t.length),!0},He.prototype.current=function(){return this.string.slice(this.start,this.pos)},He.prototype.hideFirstChars=function(t,e){this.lineStart+=t;try{return e()}finally{this.lineStart-=t}},He.prototype.lookAhead=function(t){var e=this.lineOracle;return e&&e.lookAhead(t)},He.prototype.baseToken=function(){var t=this.lineOracle;return t&&t.baseToken(this.pos)};var ze=function(t,e){this.state=t,this.lookAhead=e},Ie=function(t,e,r,n){this.state=e,this.doc=t,this.line=r,this.maxLookAhead=n||0,this.baseTokens=null,this.baseTokenPos=1};function _e(t,e,r,n){var i=[t.state.modeGen],o={};Xe(t,e.text,t.doc.mode,r,function(t,e){return i.push(t,e)},o,n);for(var l=r.state,a=function(n){r.baseTokens=i;var a=t.state.overlays[n],s=1,u=0;r.state=!0,Xe(t,e.text,a.mode,r,function(t,e){for(var r=s;u<t;){var n=i[s];n>t&&i.splice(s,1,t,i[s+1],n),s+=2,u=Math.min(t,n)}if(e)if(a.opaque)i.splice(r,s-r,t,"overlay "+e),s=r+2;else for(;r<s;r+=2){var o=i[r+1];i[r+1]=(o?o+" ":"")+"overlay "+e}},o),r.state=l,r.baseTokens=null,r.baseTokenPos=1},s=0;s<t.state.overlays.length;++s)a(s);return{styles:i,classes:o.bgClass||o.textClass?o:null}}function Fe(t,e,r){if(!e.styles||e.styles[0]!=t.state.modeGen){var n=Re(t,ht(e)),i=e.text.length>t.options.maxHighlightLength&&De(t.doc.mode,n.state),o=_e(t,e,n);i&&(n.state=i),e.stateAfter=n.save(!i),e.styles=o.styles,o.classes?e.styleClasses=o.classes:e.styleClasses&&(e.styleClasses=null),r===t.doc.highlightFrontier&&(t.doc.modeFrontier=Math.max(t.doc.modeFrontier,++t.doc.highlightFrontier))}return e.styles}function Re(t,e,r){var n=t.doc,i=t.display;if(!n.mode.startState)return new Ie(n,!0,e);var o=function(t,e,r){for(var n,i,o=t.doc,l=r?-1:e-(t.doc.mode.innerMode?1e3:100),a=e;a>l;--a){if(a<=o.first)return o.first;var s=st(o,a-1),u=s.stateAfter;if(u&&(!r||a+(u instanceof ze?u.lookAhead:0)<=o.modeFrontier))return a;var c=F(s.text,null,t.options.tabSize);(null==i||n>c)&&(i=a-1,n=c)}return i}(t,e,r),l=o>n.first&&st(n,o-1).stateAfter,a=l?Ie.fromSaved(n,l,o):new Ie(n,We(n.mode),o);return n.iter(o,e,function(r){Pe(t,r.text,a);var n=a.line;r.stateAfter=n==e-1||n%5==0||n>=i.viewFrom&&n<i.viewTo?a.save():null,a.nextLine()}),r&&(n.modeFrontier=a.line),a}function Pe(t,e,r,n){var i=t.doc.mode,o=new He(e,t.options.tabSize,r);for(o.start=o.pos=n||0,""==e&&Ue(i,r.state);!o.eol();)Be(i,o,r.state),o.start=o.pos}function Ue(t,e){if(t.blankLine)return t.blankLine(e);if(t.innerMode){var r=Ee(t,e);return r.mode.blankLine?r.mode.blankLine(r.state):void 0}}function Be(t,e,r,n){for(var i=0;i<10;i++){n&&(n[0]=Ee(t,r).mode);var o=t.token(e,r);if(e.pos>e.start)return o}throw new Error("Mode "+t.name+" failed to advance stream.")}Ie.prototype.lookAhead=function(t){var e=this.doc.getLine(this.line+t);return null!=e&&t>this.maxLookAhead&&(this.maxLookAhead=t),e},Ie.prototype.baseToken=function(t){if(!this.baseTokens)return null;for(;this.baseTokens[this.baseTokenPos]<=t;)this.baseTokenPos+=2;var e=this.baseTokens[this.baseTokenPos+1];return{type:e&&e.replace(/( |^)overlay .*/,""),size:this.baseTokens[this.baseTokenPos]-t}},Ie.prototype.nextLine=function(){this.line++,this.maxLookAhead>0&&this.maxLookAhead--},Ie.fromSaved=function(t,e,r){return e instanceof ze?new Ie(t,De(t.mode,e.state),r,e.lookAhead):new Ie(t,De(t.mode,e),r)},Ie.prototype.save=function(t){var e=!1!==t?De(this.doc.mode,this.state):this.state;return this.maxLookAhead>0?new ze(e,this.maxLookAhead):e};var Ge=function(t,e,r){this.start=t.start,this.end=t.pos,this.string=t.current(),this.type=e||null,this.state=r};function Ke(t,e,r,n){var i,o=t.doc,l=o.mode;e=kt(o,e);var a,s=st(o,e.line),u=Re(t,e.line,r),c=new He(s.text,t.options.tabSize,u);for(n&&(a=[]);(n||c.pos<e.ch)&&!c.eol();)c.start=c.pos,i=Be(l,c,u.state),n&&a.push(new Ge(c,i,De(o.mode,u.state)));return n?a:new Ge(c,i,u.state)}function qe(t,e){if(t)for(;;){var r=t.match(/(?:^|\s+)line-(background-)?(\S+)/);if(!r)break;t=t.slice(0,r.index)+t.slice(r.index+r[0].length);var n=r[1]?"bgClass":"textClass";null==e[n]?e[n]=r[2]:new RegExp("(?:^|s)"+r[2]+"(?:$|s)").test(e[n])||(e[n]+=" "+r[2])}return t}function Xe(t,e,r,n,i,o,l){var a=r.flattenSpans;null==a&&(a=t.options.flattenSpans);var s,u=0,c=null,f=new He(e,t.options.tabSize,n),h=t.options.addModeClass&&[null];for(""==e&&qe(Ue(r,n.state),o);!f.eol();){if(f.pos>t.options.maxHighlightLength?(a=!1,l&&Pe(t,e,n,f.pos),f.pos=e.length,s=null):s=qe(Be(r,f,n.state,h),o),h){var d=h[0].name;d&&(s="m-"+(s?d+" "+s:d))}if(!a||c!=s){for(;u<f.start;)u=Math.min(f.start,u+5e3),i(u,c);c=s}f.start=f.pos}for(;u<f.pos;){var p=Math.min(f.pos,u+5e3);i(p,c),u=p}}var Ye=function(t,e,r){this.text=t,Wt(this,e),this.height=r?r(this):1};function Je(t){t.parent=null,Et(t)}Ye.prototype.lineNo=function(){return ht(this)},se(Ye);var Ze={},Qe={};function je(t,e){if(!t||/^\s*$/.test(t))return null;var r=e.addModeClass?Qe:Ze;return r[t]||(r[t]=t.replace(/\S+/g,"cm-$&"))}function Ve(t,e){var r=A("span",null,null,s?"padding-right: .1px":null),n={pre:A("pre",[r],"CodeMirror-line"),content:r,col:0,pos:0,cm:t,trailingSpace:!1,splitSpaces:t.getOption("lineWrapping")};e.measure={};for(var i=0;i<=(e.rest?e.rest.length:0);i++){var o=i?e.rest[i-1]:e.line,l=void 0;n.pos=0,n.addToken=tr,be(t.display.measure)&&(l=$t(o,t.doc.direction))&&(n.addToken=er(n.addToken,l)),n.map=[];var a=e!=t.display.externalMeasured&&ht(o);nr(o,n,Fe(t,o,a)),o.styleClasses&&(o.styleClasses.bgClass&&(n.bgClass=H(o.styleClasses.bgClass,n.bgClass||"")),o.styleClasses.textClass&&(n.textClass=H(o.styleClasses.textClass,n.textClass||""))),0==n.map.length&&n.map.push(0,0,n.content.appendChild(ye(t.display.measure))),0==i?(e.measure.map=n.map,e.measure.cache={}):((e.measure.maps||(e.measure.maps=[])).push(n.map),(e.measure.caches||(e.measure.caches=[])).push({}))}if(s){var u=n.content.lastChild;(/\bcm-tab\b/.test(u.className)||u.querySelector&&u.querySelector(".cm-tab"))&&(n.content.className="cm-tab-wrap-hack")}return ie(t,"renderLine",t,e.line,n.pre),n.pre.className&&(n.textClass=H(n.pre.className,n.textClass||"")),n}function $e(t){var e=S("span","•","cm-invalidchar");return e.title="\\u"+t.charCodeAt(0).toString(16),e.setAttribute("aria-label",e.title),e}function tr(t,e,r,n,i,o,s){if(e){var u,c=t.splitSpaces?function(t,e){if(t.length>1&&!/  /.test(t))return t;for(var r=e,n="",i=0;i<t.length;i++){var o=t.charAt(i);" "!=o||!r||i!=t.length-1&&32!=t.charCodeAt(i+1)||(o=" "),n+=o,r=" "==o}return n}(e,t.trailingSpace):e,f=t.cm.state.specialChars,h=!1;if(f.test(e)){u=document.createDocumentFragment();for(var d=0;;){f.lastIndex=d;var p=f.exec(e),v=p?p.index-d:e.length-d;if(v){var g=document.createTextNode(c.slice(d,d+v));l&&a<9?u.appendChild(S("span",[g])):u.appendChild(g),t.map.push(t.pos,t.pos+v,g),t.col+=v,t.pos+=v}if(!p)break;d+=v+1;var m=void 0;if("\t"==p[0]){var y=t.cm.options.tabSize,b=y-t.col%y;(m=u.appendChild(S("span",J(b),"cm-tab"))).setAttribute("role","presentation"),m.setAttribute("cm-text","\t"),t.col+=b}else"\r"==p[0]||"\n"==p[0]?((m=u.appendChild(S("span","\r"==p[0]?"␍":"␤","cm-invalidchar"))).setAttribute("cm-text",p[0]),t.col+=1):((m=t.cm.options.specialCharPlaceholder(p[0])).setAttribute("cm-text",p[0]),l&&a<9?u.appendChild(S("span",[m])):u.appendChild(m),t.col+=1);t.map.push(t.pos,t.pos+1,m),t.pos++}}else t.col+=e.length,u=document.createTextNode(c),t.map.push(t.pos,t.pos+e.length,u),l&&a<9&&(h=!0),t.pos+=e.length;if(t.trailingSpace=32==c.charCodeAt(e.length-1),r||n||i||h||o){var w=r||"";n&&(w+=n),i&&(w+=i);var x=S("span",[u],w,o);if(s)for(var C in s)s.hasOwnProperty(C)&&"style"!=C&&"class"!=C&&x.setAttribute(C,s[C]);return t.content.appendChild(x)}t.content.appendChild(u)}}function er(t,e){return function(r,n,i,o,l,a,s){i=i?i+" cm-force-border":"cm-force-border";for(var u=r.pos,c=u+n.length;;){for(var f=void 0,h=0;h<e.length&&!((f=e[h]).to>u&&f.from<=u);h++);if(f.to>=c)return t(r,n,i,o,l,a,s);t(r,n.slice(0,f.to-u),i,o,null,a,s),o=null,n=n.slice(f.to-u),u=f.to}}}function rr(t,e,r,n){var i=!n&&r.widgetNode;i&&t.map.push(t.pos,t.pos+e,i),!n&&t.cm.display.input.needsContentAttribute&&(i||(i=t.content.appendChild(document.createElement("span"))),i.setAttribute("cm-marker",r.id)),i&&(t.cm.display.input.setUneditable(i),t.content.appendChild(i)),t.pos+=e,t.trailingSpace=!1}function nr(t,e,r){var n=t.markedSpans,i=t.text,o=0;if(n)for(var l,a,s,u,c,f,h,d=i.length,p=0,v=1,g="",m=0;;){if(m==p){s=u=c=a="",h=null,f=null,m=1/0;for(var y=[],b=void 0,w=0;w<n.length;++w){var x=n[w],C=x.marker;if("bookmark"==C.type&&x.from==p&&C.widgetNode)y.push(C);else if(x.from<=p&&(null==x.to||x.to>p||C.collapsed&&x.to==p&&x.from==p)){if(null!=x.to&&x.to!=p&&m>x.to&&(m=x.to,u=""),C.className&&(s+=" "+C.className),C.css&&(a=(a?a+";":"")+C.css),C.startStyle&&x.from==p&&(c+=" "+C.startStyle),C.endStyle&&x.to==m&&(b||(b=[])).push(C.endStyle,x.to),C.title&&((h||(h={})).title=C.title),C.attributes)for(var k in C.attributes)(h||(h={}))[k]=C.attributes[k];C.collapsed&&(!f||It(f.marker,C)<0)&&(f=x)}else x.from>p&&m>x.from&&(m=x.from)}if(b)for(var M=0;M<b.length;M+=2)b[M+1]==m&&(u+=" "+b[M]);if(!f||f.from==p)for(var L=0;L<y.length;++L)rr(e,0,y[L]);if(f&&(f.from||0)==p){if(rr(e,(null==f.to?d+1:f.to)-p,f.marker,null==f.from),null==f.to)return;f.to==p&&(f=!1)}}if(p>=d)break;for(var T=Math.min(d,m);;){if(g){var O=p+g.length;if(!f){var N=O>T?g.slice(0,T-p):g;e.addToken(e,N,l?l+s:s,c,p+N.length==m?u:"",a,h)}if(O>=T){g=g.slice(T-p),p=T;break}p=O,c=""}g=i.slice(o,o=r[v++]),l=je(r[v++],e.cm.options)}}else for(var S=1;S<r.length;S+=2)e.addToken(e,i.slice(o,o=r[S]),je(r[S+1],e.cm.options))}function ir(t,e,r){this.line=e,this.rest=function(t){for(var e,r;e=Rt(t);)t=e.find(1,!0).line,(r||(r=[])).push(t);return r}(e),this.size=this.rest?ht(Z(this.rest))-r+1:1,this.node=this.text=null,this.hidden=qt(t,e)}function or(t,e,r){for(var n,i=[],o=e;o<r;o=n){var l=new ir(t.doc,st(t.doc,o),o);n=o+l.size,i.push(l)}return i}var lr=null,ar=null;function sr(t,e){var r=re(t,e);if(r.length){var n,i=Array.prototype.slice.call(arguments,2);lr?n=lr.delayedCallbacks:ar?n=ar:(n=ar=[],setTimeout(ur,0));for(var o=function(t){n.push(function(){return r[t].apply(null,i)})},l=0;l<r.length;++l)o(l)}}function ur(){var t=ar;ar=null;for(var e=0;e<t.length;++e)t[e]()}function cr(t,e,r,n){for(var i=0;i<e.changes.length;i++){var o=e.changes[i];"text"==o?dr(t,e):"gutter"==o?vr(t,e,r,n):"class"==o?pr(t,e):"widget"==o&&gr(t,e,n)}e.changes=null}function fr(t){return t.node==t.text&&(t.node=S("div",null,null,"position: relative"),t.text.parentNode&&t.text.parentNode.replaceChild(t.node,t.text),t.node.appendChild(t.text),l&&a<8&&(t.node.style.zIndex=2)),t.node}function hr(t,e){var r=t.display.externalMeasured;return r&&r.line==e.line?(t.display.externalMeasured=null,e.measure=r.measure,r.built):Ve(t,e)}function dr(t,e){var r=e.text.className,n=hr(t,e);e.text==e.node&&(e.node=n.pre),e.text.parentNode.replaceChild(n.pre,e.text),e.text=n.pre,n.bgClass!=e.bgClass||n.textClass!=e.textClass?(e.bgClass=n.bgClass,e.textClass=n.textClass,pr(t,e)):r&&(e.text.className=r)}function pr(t,e){!function(t,e){var r=e.bgClass?e.bgClass+" "+(e.line.bgClass||""):e.line.bgClass;if(r&&(r+=" CodeMirror-linebackground"),e.background)r?e.background.className=r:(e.background.parentNode.removeChild(e.background),e.background=null);else if(r){var n=fr(e);e.background=n.insertBefore(S("div",null,r),n.firstChild),t.display.input.setUneditable(e.background)}}(t,e),e.line.wrapClass?fr(e).className=e.line.wrapClass:e.node!=e.text&&(e.node.className="");var r=e.textClass?e.textClass+" "+(e.line.textClass||""):e.line.textClass;e.text.className=r||""}function vr(t,e,r,n){if(e.gutter&&(e.node.removeChild(e.gutter),e.gutter=null),e.gutterBackground&&(e.node.removeChild(e.gutterBackground),e.gutterBackground=null),e.line.gutterClass){var i=fr(e);e.gutterBackground=S("div",null,"CodeMirror-gutter-background "+e.line.gutterClass,"left: "+(t.options.fixedGutter?n.fixedPos:-n.gutterTotalWidth)+"px; width: "+n.gutterTotalWidth+"px"),t.display.input.setUneditable(e.gutterBackground),i.insertBefore(e.gutterBackground,e.text)}var o=e.line.gutterMarkers;if(t.options.lineNumbers||o){var l=fr(e),a=e.gutter=S("div",null,"CodeMirror-gutter-wrapper","left: "+(t.options.fixedGutter?n.fixedPos:-n.gutterTotalWidth)+"px");if(t.display.input.setUneditable(a),l.insertBefore(a,e.text),e.line.gutterClass&&(a.className+=" "+e.line.gutterClass),!t.options.lineNumbers||o&&o["CodeMirror-linenumbers"]||(e.lineNumber=a.appendChild(S("div",vt(t.options,r),"CodeMirror-linenumber CodeMirror-gutter-elt","left: "+n.gutterLeft["CodeMirror-linenumbers"]+"px; width: "+t.display.lineNumInnerWidth+"px"))),o)for(var s=0;s<t.options.gutters.length;++s){var u=t.options.gutters[s],c=o.hasOwnProperty(u)&&o[u];c&&a.appendChild(S("div",[c],"CodeMirror-gutter-elt","left: "+n.gutterLeft[u]+"px; width: "+n.gutterWidth[u]+"px"))}}}function gr(t,e,r){e.alignable&&(e.alignable=null);for(var n=e.node.firstChild,i=void 0;n;n=i)i=n.nextSibling,"CodeMirror-linewidget"==n.className&&e.node.removeChild(n);yr(t,e,r)}function mr(t,e,r,n){var i=hr(t,e);return e.text=e.node=i.pre,i.bgClass&&(e.bgClass=i.bgClass),i.textClass&&(e.textClass=i.textClass),pr(t,e),vr(t,e,r,n),yr(t,e,n),e.node}function yr(t,e,r){if(br(t,e.line,e,r,!0),e.rest)for(var n=0;n<e.rest.length;n++)br(t,e.rest[n],e,r,!1)}function br(t,e,r,n,i){if(e.widgets)for(var o=fr(r),l=0,a=e.widgets;l<a.length;++l){var s=a[l],u=S("div",[s.node],"CodeMirror-linewidget");s.handleMouseEvents||u.setAttribute("cm-ignore-events","true"),wr(s,u,r,n),t.display.input.setUneditable(u),i&&s.above?o.insertBefore(u,r.gutter||r.text):o.appendChild(u),sr(s,"redraw")}}function wr(t,e,r,n){if(t.noHScroll){(r.alignable||(r.alignable=[])).push(e);var i=n.wrapperWidth;e.style.left=n.fixedPos+"px",t.coverGutter||(i-=n.gutterTotalWidth,e.style.paddingLeft=n.gutterTotalWidth+"px"),e.style.width=i+"px"}t.coverGutter&&(e.style.zIndex=5,e.style.position="relative",t.noHScroll||(e.style.marginLeft=-n.gutterTotalWidth+"px"))}function xr(t){if(null!=t.height)return t.height;var e=t.doc.cm;if(!e)return 0;if(!D(document.body,t.node)){var r="position: relative;";t.coverGutter&&(r+="margin-left: -"+e.display.gutters.offsetWidth+"px;"),t.noHScroll&&(r+="width: "+e.display.wrapper.clientWidth+"px;"),N(e.display.measure,S("div",[t.node],null,r))}return t.height=t.node.parentNode.offsetHeight}function Cr(t,e){for(var r=de(e);r!=t.wrapper;r=r.parentNode)if(!r||1==r.nodeType&&"true"==r.getAttribute("cm-ignore-events")||r.parentNode==t.sizer&&r!=t.mover)return!0}function kr(t){return t.lineSpace.offsetTop}function Mr(t){return t.mover.offsetHeight-t.lineSpace.offsetHeight}function Lr(t){if(t.cachedPaddingH)return t.cachedPaddingH;var e=N(t.measure,S("pre","x")),r=window.getComputedStyle?window.getComputedStyle(e):e.currentStyle,n={left:parseInt(r.paddingLeft),right:parseInt(r.paddingRight)};return isNaN(n.left)||isNaN(n.right)||(t.cachedPaddingH=n),n}function Tr(t){return U-t.display.nativeBarWidth}function Or(t){return t.display.scroller.clientWidth-Tr(t)-t.display.barWidth}function Nr(t){return t.display.scroller.clientHeight-Tr(t)-t.display.barHeight}function Sr(t,e,r){if(t.line==e)return{map:t.measure.map,cache:t.measure.cache};for(var n=0;n<t.rest.length;n++)if(t.rest[n]==e)return{map:t.measure.maps[n],cache:t.measure.caches[n]};for(var i=0;i<t.rest.length;i++)if(ht(t.rest[i])>r)return{map:t.measure.maps[i],cache:t.measure.caches[i],before:!0}}function Ar(t,e,r,n){return Wr(t,Er(t,e),r,n)}function Dr(t,e){if(e>=t.display.viewFrom&&e<t.display.viewTo)return t.display.view[un(t,e)];var r=t.display.externalMeasured;return r&&e>=r.lineN&&e<r.lineN+r.size?r:void 0}function Er(t,e){var r=ht(e),n=Dr(t,r);n&&!n.text?n=null:n&&n.changes&&(cr(t,n,r,nn(t)),t.curOp.forceUpdate=!0),n||(n=function(t,e){var r=ht(e=Bt(e)),n=t.display.externalMeasured=new ir(t.doc,e,r);n.lineN=r;var i=n.built=Ve(t,n);return n.text=i.pre,N(t.display.lineMeasure,i.pre),n}(t,e));var i=Sr(n,e,r);return{line:e,view:n,rect:null,map:i.map,cache:i.cache,before:i.before,hasHeights:!1}}function Wr(t,e,r,n,i){e.before&&(r=-1);var o,s=r+(n||"");return e.cache.hasOwnProperty(s)?o=e.cache[s]:(e.rect||(e.rect=e.view.text.getBoundingClientRect()),e.hasHeights||(function(t,e,r){var n=t.options.lineWrapping,i=n&&Or(t);if(!e.measure.heights||n&&e.measure.width!=i){var o=e.measure.heights=[];if(n){e.measure.width=i;for(var l=e.text.firstChild.getClientRects(),a=0;a<l.length-1;a++){var s=l[a],u=l[a+1];Math.abs(s.bottom-u.bottom)>2&&o.push((s.bottom+u.top)/2-r.top)}}o.push(r.bottom-r.top)}}(t,e.view,e.rect),e.hasHeights=!0),(o=function(t,e,r,n){var i,o=Ir(e.map,r,n),s=o.node,u=o.start,c=o.end,f=o.collapse;if(3==s.nodeType){for(var h=0;h<4;h++){for(;u&&it(e.line.text.charAt(o.coverStart+u));)--u;for(;o.coverStart+c<o.coverEnd&&it(e.line.text.charAt(o.coverStart+c));)++c;if((i=l&&a<9&&0==u&&c==o.coverEnd-o.coverStart?s.parentNode.getBoundingClientRect():_r(L(s,u,c).getClientRects(),n)).left||i.right||0==u)break;c=u,u-=1,f="right"}l&&a<11&&(i=function(t,e){if(!window.screen||null==screen.logicalXDPI||screen.logicalXDPI==screen.deviceXDPI||!function(t){if(null!=Me)return Me;var e=N(t,S("span","x")),r=e.getBoundingClientRect(),n=L(e,0,1).getBoundingClientRect();return Me=Math.abs(r.left-n.left)>1}(t))return e;var r=screen.logicalXDPI/screen.deviceXDPI,n=screen.logicalYDPI/screen.deviceYDPI;return{left:e.left*r,right:e.right*r,top:e.top*n,bottom:e.bottom*n}}(t.display.measure,i))}else{var d;u>0&&(f=n="right"),i=t.options.lineWrapping&&(d=s.getClientRects()).length>1?d["right"==n?d.length-1:0]:s.getBoundingClientRect()}if(l&&a<9&&!u&&(!i||!i.left&&!i.right)){var p=s.parentNode.getClientRects()[0];i=p?{left:p.left,right:p.left+rn(t.display),top:p.top,bottom:p.bottom}:zr}for(var v=i.top-e.rect.top,g=i.bottom-e.rect.top,m=(v+g)/2,y=e.view.measure.heights,b=0;b<y.length-1&&!(m<y[b]);b++);var w=b?y[b-1]:0,x=y[b],C={left:("right"==f?i.right:i.left)-e.rect.left,right:("left"==f?i.left:i.right)-e.rect.left,top:w,bottom:x};return i.left||i.right||(C.bogus=!0),t.options.singleCursorHeightPerLine||(C.rtop=v,C.rbottom=g),C}(t,e,r,n)).bogus||(e.cache[s]=o)),{left:o.left,right:o.right,top:i?o.rtop:o.top,bottom:i?o.rbottom:o.bottom}}var Hr,zr={left:0,right:0,top:0,bottom:0};function Ir(t,e,r){for(var n,i,o,l,a,s,u=0;u<t.length;u+=3)if(a=t[u],s=t[u+1],e<a?(i=0,o=1,l="left"):e<s?o=1+(i=e-a):(u==t.length-3||e==s&&t[u+3]>e)&&(i=(o=s-a)-1,e>=s&&(l="right")),null!=i){if(n=t[u+2],a==s&&r==(n.insertLeft?"left":"right")&&(l=r),"left"==r&&0==i)for(;u&&t[u-2]==t[u-3]&&t[u-1].insertLeft;)n=t[2+(u-=3)],l="left";if("right"==r&&i==s-a)for(;u<t.length-3&&t[u+3]==t[u+4]&&!t[u+5].insertLeft;)n=t[(u+=3)+2],l="right";break}return{node:n,start:i,end:o,collapse:l,coverStart:a,coverEnd:s}}function _r(t,e){var r=zr;if("left"==e)for(var n=0;n<t.length&&(r=t[n]).left==r.right;n++);else for(var i=t.length-1;i>=0&&(r=t[i]).left==r.right;i--);return r}function Fr(t){if(t.measure&&(t.measure.cache={},t.measure.heights=null,t.rest))for(var e=0;e<t.rest.length;e++)t.measure.caches[e]={}}function Rr(t){t.display.externalMeasure=null,O(t.display.lineMeasure);for(var e=0;e<t.display.view.length;e++)Fr(t.display.view[e])}function Pr(t){Rr(t),t.display.cachedCharWidth=t.display.cachedTextHeight=t.display.cachedPaddingH=null,t.options.lineWrapping||(t.display.maxLineChanged=!0),t.display.lineNumChars=null}function Ur(){return c&&g?-(document.body.getBoundingClientRect().left-parseInt(getComputedStyle(document.body).marginLeft)):window.pageXOffset||(document.documentElement||document.body).scrollLeft}function Br(){return c&&g?-(document.body.getBoundingClientRect().top-parseInt(getComputedStyle(document.body).marginTop)):window.pageYOffset||(document.documentElement||document.body).scrollTop}function Gr(t){var e=0;if(t.widgets)for(var r=0;r<t.widgets.length;++r)t.widgets[r].above&&(e+=xr(t.widgets[r]));return e}function Kr(t,e,r,n,i){if(!i){var o=Gr(e);r.top+=o,r.bottom+=o}if("line"==n)return r;n||(n="local");var l=Yt(e);if("local"==n?l+=kr(t.display):l-=t.display.viewOffset,"page"==n||"window"==n){var a=t.display.lineSpace.getBoundingClientRect();l+=a.top+("window"==n?0:Br());var s=a.left+("window"==n?0:Ur());r.left+=s,r.right+=s}return r.top+=l,r.bottom+=l,r}function qr(t,e,r){if("div"==r)return e;var n=e.left,i=e.top;if("page"==r)n-=Ur(),i-=Br();else if("local"==r||!r){var o=t.display.sizer.getBoundingClientRect();n+=o.left,i+=o.top}var l=t.display.lineSpace.getBoundingClientRect();return{left:n-l.left,top:i-l.top}}function Xr(t,e,r,n,i){return n||(n=st(t.doc,e.line)),Kr(t,n,Ar(t,n,e.ch,i),r)}function Yr(t,e,r,n,i,o){function l(e,l){var a=Wr(t,i,e,l?"right":"left",o);return l?a.left=a.right:a.right=a.left,Kr(t,n,a,r)}n=n||st(t.doc,e.line),i||(i=Er(t,n));var a=$t(n,t.doc.direction),s=e.ch,u=e.sticky;if(s>=n.text.length?(s=n.text.length,u="before"):s<=0&&(s=0,u="after"),!a)return l("before"==u?s-1:s,"before"==u);function c(t,e,r){var n=a[e],i=1==n.level;return l(r?t-1:t,i!=r)}var f=jt(a,s,u),h=Qt,d=c(s,f,"before"==u);return null!=h&&(d.other=c(s,h,"before"!=u)),d}function Jr(t,e){var r=0;e=kt(t.doc,e),t.options.lineWrapping||(r=rn(t.display)*e.ch);var n=st(t.doc,e.line),i=Yt(n)+kr(t.display);return{left:r,right:r,top:i,bottom:i+n.height}}function Zr(t,e,r,n,i){var o=gt(t,e,r);return o.xRel=i,n&&(o.outside=!0),o}function Qr(t,e,r){var n=t.doc;if((r+=t.display.viewOffset)<0)return Zr(n.first,0,null,!0,-1);var i=dt(n,r),o=n.first+n.size-1;if(i>o)return Zr(n.first+n.size-1,st(n,o).text.length,null,!0,1);e<0&&(e=0);for(var l=st(n,i);;){var a=tn(t,l,i,e,r),s=Pt(l,a.ch+(a.xRel>0?1:0));if(!s)return a;var u=s.find(1);if(u.line==i)return u;l=st(n,i=u.line)}}function jr(t,e,r,n){n-=Gr(e);var i=e.text.length,o=lt(function(e){return Wr(t,r,e-1).bottom<=n},i,0);return i=lt(function(e){return Wr(t,r,e).top>n},o,i),{begin:o,end:i}}function Vr(t,e,r,n){r||(r=Er(t,e));var i=Kr(t,e,Wr(t,r,n),"line").top;return jr(t,e,r,i)}function $r(t,e,r,n){return!(t.bottom<=r)&&(t.top>r||(n?t.left:t.right)>e)}function tn(t,e,r,n,i){i-=Yt(e);var o=Er(t,e),l=Gr(e),a=0,s=e.text.length,u=!0,c=$t(e,t.doc.direction);if(c){var f=(t.options.lineWrapping?function(t,e,r,n,i,o,l){var a=jr(t,e,n,l),s=a.begin,u=a.end;/\s/.test(e.text.charAt(u-1))&&u--;for(var c=null,f=null,h=0;h<i.length;h++){var d=i[h];if(!(d.from>=u||d.to<=s)){var p=1!=d.level,v=Wr(t,n,p?Math.min(u,d.to)-1:Math.max(s,d.from)).right,g=v<o?o-v+1e9:v-o;(!c||f>g)&&(c=d,f=g)}}return c||(c=i[i.length-1]),c.from<s&&(c={from:s,to:c.to,level:c.level}),c.to>u&&(c={from:c.from,to:u,level:c.level}),c}:function(t,e,r,n,i,o,l){var a=lt(function(a){var s=i[a],u=1!=s.level;return $r(Yr(t,gt(r,u?s.to:s.from,u?"before":"after"),"line",e,n),o,l,!0)},0,i.length-1),s=i[a];if(a>0){var u=1!=s.level,c=Yr(t,gt(r,u?s.from:s.to,u?"after":"before"),"line",e,n);$r(c,o,l,!0)&&c.top>l&&(s=i[a-1])}return s})(t,e,r,o,c,n,i);u=1!=f.level,a=u?f.from:f.to-1,s=u?f.to:f.from-1}var h,d,p=null,v=null,g=lt(function(e){var r=Wr(t,o,e);return r.top+=l,r.bottom+=l,!!$r(r,n,i,!1)&&(r.top<=i&&r.left<=n&&(p=e,v=r),!0)},a,s),m=!1;if(v){var y=n-v.left<v.right-n,b=y==u;g=p+(b?0:1),d=b?"after":"before",h=y?v.left:v.right}else{u||g!=s&&g!=a||g++,d=0==g?"after":g==e.text.length?"before":Wr(t,o,g-(u?1:0)).bottom+l<=i==u?"after":"before";var w=Yr(t,gt(r,g,d),"line",e,o);h=w.left,m=i<w.top||i>=w.bottom}return g=ot(e.text,g,1),Zr(r,g,d,m,n-h)}function en(t){if(null!=t.cachedTextHeight)return t.cachedTextHeight;if(null==Hr){Hr=S("pre");for(var e=0;e<49;++e)Hr.appendChild(document.createTextNode("x")),Hr.appendChild(S("br"));Hr.appendChild(document.createTextNode("x"))}N(t.measure,Hr);var r=Hr.offsetHeight/50;return r>3&&(t.cachedTextHeight=r),O(t.measure),r||1}function rn(t){if(null!=t.cachedCharWidth)return t.cachedCharWidth;var e=S("span","xxxxxxxxxx"),r=S("pre",[e]);N(t.measure,r);var n=e.getBoundingClientRect(),i=(n.right-n.left)/10;return i>2&&(t.cachedCharWidth=i),i||10}function nn(t){for(var e=t.display,r={},n={},i=e.gutters.clientLeft,o=e.gutters.firstChild,l=0;o;o=o.nextSibling,++l)r[t.options.gutters[l]]=o.offsetLeft+o.clientLeft+i,n[t.options.gutters[l]]=o.clientWidth;return{fixedPos:on(e),gutterTotalWidth:e.gutters.offsetWidth,gutterLeft:r,gutterWidth:n,wrapperWidth:e.wrapper.clientWidth}}function on(t){return t.scroller.getBoundingClientRect().left-t.sizer.getBoundingClientRect().left}function ln(t){var e=en(t.display),r=t.options.lineWrapping,n=r&&Math.max(5,t.display.scroller.clientWidth/rn(t.display)-3);return function(i){if(qt(t.doc,i))return 0;var o=0;if(i.widgets)for(var l=0;l<i.widgets.length;l++)i.widgets[l].height&&(o+=i.widgets[l].height);return r?o+(Math.ceil(i.text.length/n)||1)*e:o+e}}function an(t){var e=t.doc,r=ln(t);e.iter(function(t){var e=r(t);e!=t.height&&ft(t,e)})}function sn(t,e,r,n){var i=t.display;if(!r&&"true"==de(e).getAttribute("cm-not-content"))return null;var o,l,a=i.lineSpace.getBoundingClientRect();try{o=e.clientX-a.left,l=e.clientY-a.top}catch(e){return null}var s,u=Qr(t,o,l);if(n&&1==u.xRel&&(s=st(t.doc,u.line).text).length==u.ch){var c=F(s,s.length,t.options.tabSize)-s.length;u=gt(u.line,Math.max(0,Math.round((o-Lr(t.display).left)/rn(t.display))-c))}return u}function un(t,e){if(e>=t.display.viewTo)return null;if((e-=t.display.viewFrom)<0)return null;for(var r=t.display.view,n=0;n<r.length;n++)if((e-=r[n].size)<0)return n}function cn(t){t.display.input.showSelection(t.display.input.prepareSelection())}function fn(t,e){void 0===e&&(e=!0);for(var r=t.doc,n={},i=n.cursors=document.createDocumentFragment(),o=n.selection=document.createDocumentFragment(),l=0;l<r.sel.ranges.length;l++)if(e||l!=r.sel.primIndex){var a=r.sel.ranges[l];if(!(a.from().line>=t.display.viewTo||a.to().line<t.display.viewFrom)){var s=a.empty();(s||t.options.showCursorWhenSelecting)&&hn(t,a.head,i),s||pn(t,a,o)}}return n}function hn(t,e,r){var n=Yr(t,e,"div",null,null,!t.options.singleCursorHeightPerLine),i=r.appendChild(S("div"," ","CodeMirror-cursor"));if(i.style.left=n.left+"px",i.style.top=n.top+"px",i.style.height=Math.max(0,n.bottom-n.top)*t.options.cursorHeight+"px",n.other){var o=r.appendChild(S("div"," ","CodeMirror-cursor CodeMirror-secondarycursor"));o.style.display="",o.style.left=n.other.left+"px",o.style.top=n.other.top+"px",o.style.height=.85*(n.other.bottom-n.other.top)+"px"}}function dn(t,e){return t.top-e.top||t.left-e.left}function pn(t,e,r){var n=t.display,i=t.doc,o=document.createDocumentFragment(),l=Lr(t.display),a=l.left,s=Math.max(n.sizerWidth,Or(t)-n.sizer.offsetLeft)-l.right,u="ltr"==i.direction;function c(t,e,r,n){e<0&&(e=0),e=Math.round(e),n=Math.round(n),o.appendChild(S("div",null,"CodeMirror-selected","position: absolute; left: "+t+"px;\n                             top: "+e+"px; width: "+(null==r?s-t:r)+"px;\n                             height: "+(n-e)+"px"))}function f(e,r,n){var o,l,f=st(i,e),h=f.text.length;function d(r,n){return Xr(t,gt(e,r),"div",f,n)}function p(e,r,n){var i=Vr(t,f,null,e),o="ltr"==r==("after"==n)?"left":"right",l="after"==n?i.begin:i.end-(/\s/.test(f.text.charAt(i.end-1))?2:1);return d(l,o)[o]}var v=$t(f,i.direction);return function(t,e,r,n){if(!t)return n(e,r,"ltr",0);for(var i=!1,o=0;o<t.length;++o){var l=t[o];(l.from<r&&l.to>e||e==r&&l.to==e)&&(n(Math.max(l.from,e),Math.min(l.to,r),1==l.level?"rtl":"ltr",o),i=!0)}i||n(e,r,"ltr")}(v,r||0,null==n?h:n,function(t,e,i,f){var g="ltr"==i,m=d(t,g?"left":"right"),y=d(e-1,g?"right":"left"),b=null==r&&0==t,w=null==n&&e==h,x=0==f,C=!v||f==v.length-1;if(y.top-m.top<=3){var k=(u?b:w)&&x,M=(u?w:b)&&C,L=k?a:(g?m:y).left,T=M?s:(g?y:m).right;c(L,m.top,T-L,m.bottom)}else{var O,N,S,A;g?(O=u&&b&&x?a:m.left,N=u?s:p(t,i,"before"),S=u?a:p(e,i,"after"),A=u&&w&&C?s:y.right):(O=u?p(t,i,"before"):a,N=!u&&b&&x?s:m.right,S=!u&&w&&C?a:y.left,A=u?p(e,i,"after"):s),c(O,m.top,N-O,m.bottom),m.bottom<y.top&&c(a,m.bottom,null,y.top),c(S,y.top,A-S,y.bottom)}(!o||dn(m,o)<0)&&(o=m),dn(y,o)<0&&(o=y),(!l||dn(m,l)<0)&&(l=m),dn(y,l)<0&&(l=y)}),{start:o,end:l}}var h=e.from(),d=e.to();if(h.line==d.line)f(h.line,h.ch,d.ch);else{var p=st(i,h.line),v=st(i,d.line),g=Bt(p)==Bt(v),m=f(h.line,h.ch,g?p.text.length+1:null).end,y=f(d.line,g?0:null,d.ch).start;g&&(m.top<y.top-2?(c(m.right,m.top,null,m.bottom),c(a,y.top,y.left,y.bottom)):c(m.right,m.top,y.left-m.right,m.bottom)),m.bottom<y.top&&c(a,m.bottom,null,y.top)}r.appendChild(o)}function vn(t){if(t.state.focused){var e=t.display;clearInterval(e.blinker);var r=!0;e.cursorDiv.style.visibility="",t.options.cursorBlinkRate>0?e.blinker=setInterval(function(){return e.cursorDiv.style.visibility=(r=!r)?"":"hidden"},t.options.cursorBlinkRate):t.options.cursorBlinkRate<0&&(e.cursorDiv.style.visibility="hidden")}}function gn(t){t.state.focused||(t.display.input.focus(),yn(t))}function mn(t){t.state.delayingBlurEvent=!0,setTimeout(function(){t.state.delayingBlurEvent&&(t.state.delayingBlurEvent=!1,bn(t))},100)}function yn(t,e){t.state.delayingBlurEvent&&(t.state.delayingBlurEvent=!1),"nocursor"!=t.options.readOnly&&(t.state.focused||(ie(t,"focus",t,e),t.state.focused=!0,W(t.display.wrapper,"CodeMirror-focused"),t.curOp||t.display.selForContextMenu==t.doc.sel||(t.display.input.reset(),s&&setTimeout(function(){return t.display.input.reset(!0)},20)),t.display.input.receivedFocus()),vn(t))}function bn(t,e){t.state.delayingBlurEvent||(t.state.focused&&(ie(t,"blur",t,e),t.state.focused=!1,T(t.display.wrapper,"CodeMirror-focused")),clearInterval(t.display.blinker),setTimeout(function(){t.state.focused||(t.display.shift=!1)},150))}function wn(t){for(var e=t.display,r=e.lineDiv.offsetTop,n=0;n<e.view.length;n++){var i=e.view[n],o=t.options.lineWrapping,s=void 0,u=0;if(!i.hidden){if(l&&a<8){var c=i.node.offsetTop+i.node.offsetHeight;s=c-r,r=c}else{var f=i.node.getBoundingClientRect();s=f.bottom-f.top,!o&&i.text.firstChild&&(u=i.text.firstChild.getBoundingClientRect().right-f.left-1)}var h=i.line.height-s;if(s<2&&(s=en(e)),(h>.005||h<-.005)&&(ft(i.line,s),xn(i.line),i.rest))for(var d=0;d<i.rest.length;d++)xn(i.rest[d]);if(u>t.display.sizerWidth){var p=Math.ceil(u/rn(t.display));p>t.display.maxLineLength&&(t.display.maxLineLength=p,t.display.maxLine=i.line,t.display.maxLineChanged=!0)}}}}function xn(t){if(t.widgets)for(var e=0;e<t.widgets.length;++e){var r=t.widgets[e],n=r.node.parentNode;n&&(r.height=n.offsetHeight)}}function Cn(t,e,r){var n=r&&null!=r.top?Math.max(0,r.top):t.scroller.scrollTop;n=Math.floor(n-kr(t));var i=r&&null!=r.bottom?r.bottom:n+t.wrapper.clientHeight,o=dt(e,n),l=dt(e,i);if(r&&r.ensure){var a=r.ensure.from.line,s=r.ensure.to.line;a<o?(o=a,l=dt(e,Yt(st(e,a))+t.wrapper.clientHeight)):Math.min(s,e.lastLine())>=l&&(o=dt(e,Yt(st(e,s))-t.wrapper.clientHeight),l=s)}return{from:o,to:Math.max(l,o+1)}}function kn(t){var e=t.display,r=e.view;if(e.alignWidgets||e.gutters.firstChild&&t.options.fixedGutter){for(var n=on(e)-e.scroller.scrollLeft+t.doc.scrollLeft,i=e.gutters.offsetWidth,o=n+"px",l=0;l<r.length;l++)if(!r[l].hidden){t.options.fixedGutter&&(r[l].gutter&&(r[l].gutter.style.left=o),r[l].gutterBackground&&(r[l].gutterBackground.style.left=o));var a=r[l].alignable;if(a)for(var s=0;s<a.length;s++)a[s].style.left=o}t.options.fixedGutter&&(e.gutters.style.left=n+i+"px")}}function Mn(t){if(!t.options.lineNumbers)return!1;var e=t.doc,r=vt(t.options,e.first+e.size-1),n=t.display;if(r.length!=n.lineNumChars){var i=n.measure.appendChild(S("div",[S("div",r)],"CodeMirror-linenumber CodeMirror-gutter-elt")),o=i.firstChild.offsetWidth,l=i.offsetWidth-o;return n.lineGutter.style.width="",n.lineNumInnerWidth=Math.max(o,n.lineGutter.offsetWidth-l)+1,n.lineNumWidth=n.lineNumInnerWidth+l,n.lineNumChars=n.lineNumInnerWidth?r.length:-1,n.lineGutter.style.width=n.lineNumWidth+"px",ui(t),!0}return!1}function Ln(t,e){var r=t.display,n=en(t.display);e.top<0&&(e.top=0);var i=t.curOp&&null!=t.curOp.scrollTop?t.curOp.scrollTop:r.scroller.scrollTop,o=Nr(t),l={};e.bottom-e.top>o&&(e.bottom=e.top+o);var a=t.doc.height+Mr(r),s=e.top<n,u=e.bottom>a-n;if(e.top<i)l.scrollTop=s?0:e.top;else if(e.bottom>i+o){var c=Math.min(e.top,(u?a:e.bottom)-o);c!=i&&(l.scrollTop=c)}var f=t.curOp&&null!=t.curOp.scrollLeft?t.curOp.scrollLeft:r.scroller.scrollLeft,h=Or(t)-(t.options.fixedGutter?r.gutters.offsetWidth:0),d=e.right-e.left>h;return d&&(e.right=e.left+h),e.left<10?l.scrollLeft=0:e.left<f?l.scrollLeft=Math.max(0,e.left-(d?0:10)):e.right>h+f-3&&(l.scrollLeft=e.right+(d?0:10)-h),l}function Tn(t,e){null!=e&&(Sn(t),t.curOp.scrollTop=(null==t.curOp.scrollTop?t.doc.scrollTop:t.curOp.scrollTop)+e)}function On(t){Sn(t);var e=t.getCursor();t.curOp.scrollToPos={from:e,to:e,margin:t.options.cursorScrollMargin}}function Nn(t,e,r){null==e&&null==r||Sn(t),null!=e&&(t.curOp.scrollLeft=e),null!=r&&(t.curOp.scrollTop=r)}function Sn(t){var e=t.curOp.scrollToPos;if(e){t.curOp.scrollToPos=null;var r=Jr(t,e.from),n=Jr(t,e.to);An(t,r,n,e.margin)}}function An(t,e,r,n){var i=Ln(t,{left:Math.min(e.left,r.left),top:Math.min(e.top,r.top)-n,right:Math.max(e.right,r.right),bottom:Math.max(e.bottom,r.bottom)+n});Nn(t,i.scrollLeft,i.scrollTop)}function Dn(t,e){Math.abs(t.doc.scrollTop-e)<2||(r||si(t,{top:e}),En(t,e,!0),r&&si(t),ni(t,100))}function En(t,e,r){e=Math.min(t.display.scroller.scrollHeight-t.display.scroller.clientHeight,e),(t.display.scroller.scrollTop!=e||r)&&(t.doc.scrollTop=e,t.display.scrollbars.setScrollTop(e),t.display.scroller.scrollTop!=e&&(t.display.scroller.scrollTop=e))}function Wn(t,e,r,n){e=Math.min(e,t.display.scroller.scrollWidth-t.display.scroller.clientWidth),(r?e==t.doc.scrollLeft:Math.abs(t.doc.scrollLeft-e)<2)&&!n||(t.doc.scrollLeft=e,kn(t),t.display.scroller.scrollLeft!=e&&(t.display.scroller.scrollLeft=e),t.display.scrollbars.setScrollLeft(e))}function Hn(t){var e=t.display,r=e.gutters.offsetWidth,n=Math.round(t.doc.height+Mr(t.display));return{clientHeight:e.scroller.clientHeight,viewHeight:e.wrapper.clientHeight,scrollWidth:e.scroller.scrollWidth,clientWidth:e.scroller.clientWidth,viewWidth:e.wrapper.clientWidth,barLeft:t.options.fixedGutter?r:0,docHeight:n,scrollHeight:n+Tr(t)+e.barHeight,nativeBarWidth:e.nativeBarWidth,gutterWidth:r}}var zn=function(t,e,r){this.cm=r;var n=this.vert=S("div",[S("div",null,null,"min-width: 1px")],"CodeMirror-vscrollbar"),i=this.horiz=S("div",[S("div",null,null,"height: 100%; min-height: 1px")],"CodeMirror-hscrollbar");n.tabIndex=i.tabIndex=-1,t(n),t(i),ee(n,"scroll",function(){n.clientHeight&&e(n.scrollTop,"vertical")}),ee(i,"scroll",function(){i.clientWidth&&e(i.scrollLeft,"horizontal")}),this.checkedZeroWidth=!1,l&&a<8&&(this.horiz.style.minHeight=this.vert.style.minWidth="18px")};zn.prototype.update=function(t){var e=t.scrollWidth>t.clientWidth+1,r=t.scrollHeight>t.clientHeight+1,n=t.nativeBarWidth;if(r){this.vert.style.display="block",this.vert.style.bottom=e?n+"px":"0";var i=t.viewHeight-(e?n:0);this.vert.firstChild.style.height=Math.max(0,t.scrollHeight-t.clientHeight+i)+"px"}else this.vert.style.display="",this.vert.firstChild.style.height="0";if(e){this.horiz.style.display="block",this.horiz.style.right=r?n+"px":"0",this.horiz.style.left=t.barLeft+"px";var o=t.viewWidth-t.barLeft-(r?n:0);this.horiz.firstChild.style.width=Math.max(0,t.scrollWidth-t.clientWidth+o)+"px"}else this.horiz.style.display="",this.horiz.firstChild.style.width="0";return!this.checkedZeroWidth&&t.clientHeight>0&&(0==n&&this.zeroWidthHack(),this.checkedZeroWidth=!0),{right:r?n:0,bottom:e?n:0}},zn.prototype.setScrollLeft=function(t){this.horiz.scrollLeft!=t&&(this.horiz.scrollLeft=t),this.disableHoriz&&this.enableZeroWidthBar(this.horiz,this.disableHoriz,"horiz")},zn.prototype.setScrollTop=function(t){this.vert.scrollTop!=t&&(this.vert.scrollTop=t),this.disableVert&&this.enableZeroWidthBar(this.vert,this.disableVert,"vert")},zn.prototype.zeroWidthHack=function(){var t=y&&!d?"12px":"18px";this.horiz.style.height=this.vert.style.width=t,this.horiz.style.pointerEvents=this.vert.style.pointerEvents="none",this.disableHoriz=new R,this.disableVert=new R},zn.prototype.enableZeroWidthBar=function(t,e,r){t.style.pointerEvents="auto",e.set(1e3,function n(){var i=t.getBoundingClientRect(),o="vert"==r?document.elementFromPoint(i.right-1,(i.top+i.bottom)/2):document.elementFromPoint((i.right+i.left)/2,i.bottom-1);o!=t?t.style.pointerEvents="none":e.set(1e3,n)})},zn.prototype.clear=function(){var t=this.horiz.parentNode;t.removeChild(this.horiz),t.removeChild(this.vert)};var In=function(){};function _n(t,e){e||(e=Hn(t));var r=t.display.barWidth,n=t.display.barHeight;Fn(t,e);for(var i=0;i<4&&r!=t.display.barWidth||n!=t.display.barHeight;i++)r!=t.display.barWidth&&t.options.lineWrapping&&wn(t),Fn(t,Hn(t)),r=t.display.barWidth,n=t.display.barHeight}function Fn(t,e){var r=t.display,n=r.scrollbars.update(e);r.sizer.style.paddingRight=(r.barWidth=n.right)+"px",r.sizer.style.paddingBottom=(r.barHeight=n.bottom)+"px",r.heightForcer.style.borderBottom=n.bottom+"px solid transparent",n.right&&n.bottom?(r.scrollbarFiller.style.display="block",r.scrollbarFiller.style.height=n.bottom+"px",r.scrollbarFiller.style.width=n.right+"px"):r.scrollbarFiller.style.display="",n.bottom&&t.options.coverGutterNextToScrollbar&&t.options.fixedGutter?(r.gutterFiller.style.display="block",r.gutterFiller.style.height=n.bottom+"px",r.gutterFiller.style.width=e.gutterWidth+"px"):r.gutterFiller.style.display=""}In.prototype.update=function(){return{bottom:0,right:0}},In.prototype.setScrollLeft=function(){},In.prototype.setScrollTop=function(){},In.prototype.clear=function(){};var Rn={native:zn,null:In};function Pn(t){t.display.scrollbars&&(t.display.scrollbars.clear(),t.display.scrollbars.addClass&&T(t.display.wrapper,t.display.scrollbars.addClass)),t.display.scrollbars=new Rn[t.options.scrollbarStyle](function(e){t.display.wrapper.insertBefore(e,t.display.scrollbarFiller),ee(e,"mousedown",function(){t.state.focused&&setTimeout(function(){return t.display.input.focus()},0)}),e.setAttribute("cm-not-content","true")},function(e,r){"horizontal"==r?Wn(t,e):Dn(t,e)},t),t.display.scrollbars.addClass&&W(t.display.wrapper,t.display.scrollbars.addClass)}var Un=0;function Bn(t){var e;t.curOp={cm:t,viewChanged:!1,startHeight:t.doc.height,forceUpdate:!1,updateInput:0,typing:!1,changeObjs:null,cursorActivityHandlers:null,cursorActivityCalled:0,selectionChanged:!1,updateMaxLine:!1,scrollLeft:null,scrollTop:null,scrollToPos:null,focus:!1,id:++Un},e=t.curOp,lr?lr.ops.push(e):e.ownsGroup=lr={ops:[e],delayedCallbacks:[]}}function Gn(t){var e=t.curOp;e&&function(t,e){var r=t.ownsGroup;if(r)try{!function(t){var e=t.delayedCallbacks,r=0;do{for(;r<e.length;r++)e[r].call(null);for(var n=0;n<t.ops.length;n++){var i=t.ops[n];if(i.cursorActivityHandlers)for(;i.cursorActivityCalled<i.cursorActivityHandlers.length;)i.cursorActivityHandlers[i.cursorActivityCalled++].call(null,i.cm)}}while(r<e.length)}(r)}finally{lr=null,e(r)}}(e,function(t){for(var e=0;e<t.ops.length;e++)t.ops[e].cm.curOp=null;!function(t){for(var e=t.ops,r=0;r<e.length;r++)Kn(e[r]);for(var n=0;n<e.length;n++)(i=e[n]).updatedDisplay=i.mustUpdate&&li(i.cm,i.update);for(var i,o=0;o<e.length;o++)qn(e[o]);for(var l=0;l<e.length;l++)Xn(e[l]);for(var a=0;a<e.length;a++)Yn(e[a])}(t)})}function Kn(t){var e=t.cm,r=e.display;!function(t){var e=t.display;!e.scrollbarsClipped&&e.scroller.offsetWidth&&(e.nativeBarWidth=e.scroller.offsetWidth-e.scroller.clientWidth,e.heightForcer.style.height=Tr(t)+"px",e.sizer.style.marginBottom=-e.nativeBarWidth+"px",e.sizer.style.borderRightWidth=Tr(t)+"px",e.scrollbarsClipped=!0)}(e),t.updateMaxLine&&Zt(e),t.mustUpdate=t.viewChanged||t.forceUpdate||null!=t.scrollTop||t.scrollToPos&&(t.scrollToPos.from.line<r.viewFrom||t.scrollToPos.to.line>=r.viewTo)||r.maxLineChanged&&e.options.lineWrapping,t.update=t.mustUpdate&&new oi(e,t.mustUpdate&&{top:t.scrollTop,ensure:t.scrollToPos},t.forceUpdate)}function qn(t){var e=t.cm,r=e.display;t.updatedDisplay&&wn(e),t.barMeasure=Hn(e),r.maxLineChanged&&!e.options.lineWrapping&&(t.adjustWidthTo=Ar(e,r.maxLine,r.maxLine.text.length).left+3,e.display.sizerWidth=t.adjustWidthTo,t.barMeasure.scrollWidth=Math.max(r.scroller.clientWidth,r.sizer.offsetLeft+t.adjustWidthTo+Tr(e)+e.display.barWidth),t.maxScrollLeft=Math.max(0,r.sizer.offsetLeft+t.adjustWidthTo-Or(e))),(t.updatedDisplay||t.selectionChanged)&&(t.preparedSelection=r.input.prepareSelection())}function Xn(t){var e=t.cm;null!=t.adjustWidthTo&&(e.display.sizer.style.minWidth=t.adjustWidthTo+"px",t.maxScrollLeft<e.doc.scrollLeft&&Wn(e,Math.min(e.display.scroller.scrollLeft,t.maxScrollLeft),!0),e.display.maxLineChanged=!1);var r=t.focus&&t.focus==E();t.preparedSelection&&e.display.input.showSelection(t.preparedSelection,r),(t.updatedDisplay||t.startHeight!=e.doc.height)&&_n(e,t.barMeasure),t.updatedDisplay&&ci(e,t.barMeasure),t.selectionChanged&&vn(e),e.state.focused&&t.updateInput&&e.display.input.reset(t.typing),r&&gn(t.cm)}function Yn(t){var e=t.cm,r=e.display,n=e.doc;if(t.updatedDisplay&&ai(e,t.update),null==r.wheelStartX||null==t.scrollTop&&null==t.scrollLeft&&!t.scrollToPos||(r.wheelStartX=r.wheelStartY=null),null!=t.scrollTop&&En(e,t.scrollTop,t.forceScroll),null!=t.scrollLeft&&Wn(e,t.scrollLeft,!0,!0),t.scrollToPos){var i=function(t,e,r,n){var i;null==n&&(n=0),t.options.lineWrapping||e!=r||(e=e.ch?gt(e.line,"before"==e.sticky?e.ch-1:e.ch,"after"):e,r="before"==e.sticky?gt(e.line,e.ch+1,"before"):e);for(var o=0;o<5;o++){var l=!1,a=Yr(t,e),s=r&&r!=e?Yr(t,r):a;i={left:Math.min(a.left,s.left),top:Math.min(a.top,s.top)-n,right:Math.max(a.left,s.left),bottom:Math.max(a.bottom,s.bottom)+n};var u=Ln(t,i),c=t.doc.scrollTop,f=t.doc.scrollLeft;if(null!=u.scrollTop&&(Dn(t,u.scrollTop),Math.abs(t.doc.scrollTop-c)>1&&(l=!0)),null!=u.scrollLeft&&(Wn(t,u.scrollLeft),Math.abs(t.doc.scrollLeft-f)>1&&(l=!0)),!l)break}return i}(e,kt(n,t.scrollToPos.from),kt(n,t.scrollToPos.to),t.scrollToPos.margin);!function(t,e){if(!oe(t,"scrollCursorIntoView")){var r=t.display,n=r.sizer.getBoundingClientRect(),i=null;if(e.top+n.top<0?i=!0:e.bottom+n.top>(window.innerHeight||document.documentElement.clientHeight)&&(i=!1),null!=i&&!p){var o=S("div","​",null,"position: absolute;\n                         top: "+(e.top-r.viewOffset-kr(t.display))+"px;\n                         height: "+(e.bottom-e.top+Tr(t)+r.barHeight)+"px;\n                         left: "+e.left+"px; width: "+Math.max(2,e.right-e.left)+"px;");t.display.lineSpace.appendChild(o),o.scrollIntoView(i),t.display.lineSpace.removeChild(o)}}}(e,i)}var o=t.maybeHiddenMarkers,l=t.maybeUnhiddenMarkers;if(o)for(var a=0;a<o.length;++a)o[a].lines.length||ie(o[a],"hide");if(l)for(var s=0;s<l.length;++s)l[s].lines.length&&ie(l[s],"unhide");r.wrapper.offsetHeight&&(n.scrollTop=e.display.scroller.scrollTop),t.changeObjs&&ie(e,"changes",e,t.changeObjs),t.update&&t.update.finish()}function Jn(t,e){if(t.curOp)return e();Bn(t);try{return e()}finally{Gn(t)}}function Zn(t,e){return function(){if(t.curOp)return e.apply(t,arguments);Bn(t);try{return e.apply(t,arguments)}finally{Gn(t)}}}function Qn(t){return function(){if(this.curOp)return t.apply(this,arguments);Bn(this);try{return t.apply(this,arguments)}finally{Gn(this)}}}function jn(t){return function(){var e=this.cm;if(!e||e.curOp)return t.apply(this,arguments);Bn(e);try{return t.apply(this,arguments)}finally{Gn(e)}}}function Vn(t,e,r,n){null==e&&(e=t.doc.first),null==r&&(r=t.doc.first+t.doc.size),n||(n=0);var i=t.display;if(n&&r<i.viewTo&&(null==i.updateLineNumbers||i.updateLineNumbers>e)&&(i.updateLineNumbers=e),t.curOp.viewChanged=!0,e>=i.viewTo)Tt&&Gt(t.doc,e)<i.viewTo&&ti(t);else if(r<=i.viewFrom)Tt&&Kt(t.doc,r+n)>i.viewFrom?ti(t):(i.viewFrom+=n,i.viewTo+=n);else if(e<=i.viewFrom&&r>=i.viewTo)ti(t);else if(e<=i.viewFrom){var o=ei(t,r,r+n,1);o?(i.view=i.view.slice(o.index),i.viewFrom=o.lineN,i.viewTo+=n):ti(t)}else if(r>=i.viewTo){var l=ei(t,e,e,-1);l?(i.view=i.view.slice(0,l.index),i.viewTo=l.lineN):ti(t)}else{var a=ei(t,e,e,-1),s=ei(t,r,r+n,1);a&&s?(i.view=i.view.slice(0,a.index).concat(or(t,a.lineN,s.lineN)).concat(i.view.slice(s.index)),i.viewTo+=n):ti(t)}var u=i.externalMeasured;u&&(r<u.lineN?u.lineN+=n:e<u.lineN+u.size&&(i.externalMeasured=null))}function $n(t,e,r){t.curOp.viewChanged=!0;var n=t.display,i=t.display.externalMeasured;if(i&&e>=i.lineN&&e<i.lineN+i.size&&(n.externalMeasured=null),!(e<n.viewFrom||e>=n.viewTo)){var o=n.view[un(t,e)];if(null!=o.node){var l=o.changes||(o.changes=[]);-1==P(l,r)&&l.push(r)}}}function ti(t){t.display.viewFrom=t.display.viewTo=t.doc.first,t.display.view=[],t.display.viewOffset=0}function ei(t,e,r,n){var i,o=un(t,e),l=t.display.view;if(!Tt||r==t.doc.first+t.doc.size)return{index:o,lineN:r};for(var a=t.display.viewFrom,s=0;s<o;s++)a+=l[s].size;if(a!=e){if(n>0){if(o==l.length-1)return null;i=a+l[o].size-e,o++}else i=a-e;e+=i,r+=i}for(;Gt(t.doc,r)!=r;){if(o==(n<0?0:l.length-1))return null;r+=n*l[o-(n<0?1:0)].size,o+=n}return{index:o,lineN:r}}function ri(t){for(var e=t.display.view,r=0,n=0;n<e.length;n++){var i=e[n];i.hidden||i.node&&!i.changes||++r}return r}function ni(t,e){t.doc.highlightFrontier<t.display.viewTo&&t.state.highlight.set(e,I(ii,t))}function ii(t){var e=t.doc;if(!(e.highlightFrontier>=t.display.viewTo)){var r=+new Date+t.options.workTime,n=Re(t,e.highlightFrontier),i=[];e.iter(n.line,Math.min(e.first+e.size,t.display.viewTo+500),function(o){if(n.line>=t.display.viewFrom){var l=o.styles,a=o.text.length>t.options.maxHighlightLength?De(e.mode,n.state):null,s=_e(t,o,n,!0);a&&(n.state=a),o.styles=s.styles;var u=o.styleClasses,c=s.classes;c?o.styleClasses=c:u&&(o.styleClasses=null);for(var f=!l||l.length!=o.styles.length||u!=c&&(!u||!c||u.bgClass!=c.bgClass||u.textClass!=c.textClass),h=0;!f&&h<l.length;++h)f=l[h]!=o.styles[h];f&&i.push(n.line),o.stateAfter=n.save(),n.nextLine()}else o.text.length<=t.options.maxHighlightLength&&Pe(t,o.text,n),o.stateAfter=n.line%5==0?n.save():null,n.nextLine();if(+new Date>r)return ni(t,t.options.workDelay),!0}),e.highlightFrontier=n.line,e.modeFrontier=Math.max(e.modeFrontier,n.line),i.length&&Jn(t,function(){for(var e=0;e<i.length;e++)$n(t,i[e],"text")})}}var oi=function(t,e,r){var n=t.display;this.viewport=e,this.visible=Cn(n,t.doc,e),this.editorIsHidden=!n.wrapper.offsetWidth,this.wrapperHeight=n.wrapper.clientHeight,this.wrapperWidth=n.wrapper.clientWidth,this.oldDisplayWidth=Or(t),this.force=r,this.dims=nn(t),this.events=[]};function li(t,e){var r=t.display,n=t.doc;if(e.editorIsHidden)return ti(t),!1;if(!e.force&&e.visible.from>=r.viewFrom&&e.visible.to<=r.viewTo&&(null==r.updateLineNumbers||r.updateLineNumbers>=r.viewTo)&&r.renderedView==r.view&&0==ri(t))return!1;Mn(t)&&(ti(t),e.dims=nn(t));var i=n.first+n.size,o=Math.max(e.visible.from-t.options.viewportMargin,n.first),l=Math.min(i,e.visible.to+t.options.viewportMargin);r.viewFrom<o&&o-r.viewFrom<20&&(o=Math.max(n.first,r.viewFrom)),r.viewTo>l&&r.viewTo-l<20&&(l=Math.min(i,r.viewTo)),Tt&&(o=Gt(t.doc,o),l=Kt(t.doc,l));var a=o!=r.viewFrom||l!=r.viewTo||r.lastWrapHeight!=e.wrapperHeight||r.lastWrapWidth!=e.wrapperWidth;!function(t,e,r){var n=t.display;0==n.view.length||e>=n.viewTo||r<=n.viewFrom?(n.view=or(t,e,r),n.viewFrom=e):(n.viewFrom>e?n.view=or(t,e,n.viewFrom).concat(n.view):n.viewFrom<e&&(n.view=n.view.slice(un(t,e))),n.viewFrom=e,n.viewTo<r?n.view=n.view.concat(or(t,n.viewTo,r)):n.viewTo>r&&(n.view=n.view.slice(0,un(t,r)))),n.viewTo=r}(t,o,l),r.viewOffset=Yt(st(t.doc,r.viewFrom)),t.display.mover.style.top=r.viewOffset+"px";var u=ri(t);if(!a&&0==u&&!e.force&&r.renderedView==r.view&&(null==r.updateLineNumbers||r.updateLineNumbers>=r.viewTo))return!1;var c=function(t){if(t.hasFocus())return null;var e=E();if(!e||!D(t.display.lineDiv,e))return null;var r={activeElt:e};if(window.getSelection){var n=window.getSelection();n.anchorNode&&n.extend&&D(t.display.lineDiv,n.anchorNode)&&(r.anchorNode=n.anchorNode,r.anchorOffset=n.anchorOffset,r.focusNode=n.focusNode,r.focusOffset=n.focusOffset)}return r}(t);return u>4&&(r.lineDiv.style.display="none"),function(t,e,r){var n=t.display,i=t.options.lineNumbers,o=n.lineDiv,l=o.firstChild;function a(e){var r=e.nextSibling;return s&&y&&t.display.currentWheelTarget==e?e.style.display="none":e.parentNode.removeChild(e),r}for(var u=n.view,c=n.viewFrom,f=0;f<u.length;f++){var h=u[f];if(h.hidden)   ;else if(h.node&&h.node.parentNode==o){for(;l!=h.node;)l=a(l);var d=i&&null!=e&&e<=c&&h.lineNumber;h.changes&&(P(h.changes,"gutter")>-1&&(d=!1),cr(t,h,c,r)),d&&(O(h.lineNumber),h.lineNumber.appendChild(document.createTextNode(vt(t.options,c)))),l=h.node.nextSibling}else{var p=mr(t,h,c,r);o.insertBefore(p,l)}c+=h.size}for(;l;)l=a(l)}(t,r.updateLineNumbers,e.dims),u>4&&(r.lineDiv.style.display=""),r.renderedView=r.view,function(t){if(t&&t.activeElt&&t.activeElt!=E()&&(t.activeElt.focus(),t.anchorNode&&D(document.body,t.anchorNode)&&D(document.body,t.focusNode))){var e=window.getSelection(),r=document.createRange();r.setEnd(t.anchorNode,t.anchorOffset),r.collapse(!1),e.removeAllRanges(),e.addRange(r),e.extend(t.focusNode,t.focusOffset)}}(c),O(r.cursorDiv),O(r.selectionDiv),r.gutters.style.height=r.sizer.style.minHeight=0,a&&(r.lastWrapHeight=e.wrapperHeight,r.lastWrapWidth=e.wrapperWidth,ni(t,400)),r.updateLineNumbers=null,!0}function ai(t,e){for(var r=e.viewport,n=!0;(n&&t.options.lineWrapping&&e.oldDisplayWidth!=Or(t)||(r&&null!=r.top&&(r={top:Math.min(t.doc.height+Mr(t.display)-Nr(t),r.top)}),e.visible=Cn(t.display,t.doc,r),!(e.visible.from>=t.display.viewFrom&&e.visible.to<=t.display.viewTo)))&&li(t,e);n=!1){wn(t);var i=Hn(t);cn(t),_n(t,i),ci(t,i),e.force=!1}e.signal(t,"update",t),t.display.viewFrom==t.display.reportedViewFrom&&t.display.viewTo==t.display.reportedViewTo||(e.signal(t,"viewportChange",t,t.display.viewFrom,t.display.viewTo),t.display.reportedViewFrom=t.display.viewFrom,t.display.reportedViewTo=t.display.viewTo)}function si(t,e){var r=new oi(t,e);if(li(t,r)){wn(t),ai(t,r);var n=Hn(t);cn(t),_n(t,n),ci(t,n),r.finish()}}function ui(t){var e=t.display.gutters.offsetWidth;t.display.sizer.style.marginLeft=e+"px"}function ci(t,e){t.display.sizer.style.minHeight=e.docHeight+"px",t.display.heightForcer.style.top=e.docHeight+"px",t.display.gutters.style.height=e.docHeight+t.display.barHeight+Tr(t)+"px"}function fi(t){var e=t.display.gutters,r=t.options.gutters;O(e);for(var n=0;n<r.length;++n){var i=r[n],o=e.appendChild(S("div",null,"CodeMirror-gutter "+i));"CodeMirror-linenumbers"==i&&(t.display.lineGutter=o,o.style.width=(t.display.lineNumWidth||1)+"px")}e.style.display=n?"":"none",ui(t)}function hi(t){var e=P(t.gutters,"CodeMirror-linenumbers");-1==e&&t.lineNumbers?t.gutters=t.gutters.concat(["CodeMirror-linenumbers"]):e>-1&&!t.lineNumbers&&(t.gutters=t.gutters.slice(0),t.gutters.splice(e,1))}oi.prototype.signal=function(t,e){ae(t,e)&&this.events.push(arguments)},oi.prototype.finish=function(){for(var t=0;t<this.events.length;t++)ie.apply(null,this.events[t])};var di=0,pi=null;function vi(t){var e=t.wheelDeltaX,r=t.wheelDeltaY;return null==e&&t.detail&&t.axis==t.HORIZONTAL_AXIS&&(e=t.detail),null==r&&t.detail&&t.axis==t.VERTICAL_AXIS?r=t.detail:null==r&&(r=t.wheelDelta),{x:e,y:r}}function gi(t){var e=vi(t);return e.x*=pi,e.y*=pi,e}function mi(t,e){var n=vi(e),i=n.x,o=n.y,l=t.display,a=l.scroller,u=a.scrollWidth>a.clientWidth,c=a.scrollHeight>a.clientHeight;if(i&&u||o&&c){if(o&&y&&s)t:for(var h=e.target,d=l.view;h!=a;h=h.parentNode)for(var p=0;p<d.length;p++)if(d[p].node==h){t.display.currentWheelTarget=h;break t}if(i&&!r&&!f&&null!=pi)return o&&c&&Dn(t,Math.max(0,a.scrollTop+o*pi)),Wn(t,Math.max(0,a.scrollLeft+i*pi)),(!o||o&&c)&&ue(e),void(l.wheelStartX=null);if(o&&null!=pi){var v=o*pi,g=t.doc.scrollTop,m=g+l.wrapper.clientHeight;v<0?g=Math.max(0,g+v-50):m=Math.min(t.doc.height,m+v+50),si(t,{top:g,bottom:m})}di<20&&(null==l.wheelStartX?(l.wheelStartX=a.scrollLeft,l.wheelStartY=a.scrollTop,l.wheelDX=i,l.wheelDY=o,setTimeout(function(){if(null!=l.wheelStartX){var t=a.scrollLeft-l.wheelStartX,e=a.scrollTop-l.wheelStartY,r=e&&l.wheelDY&&e/l.wheelDY||t&&l.wheelDX&&t/l.wheelDX;l.wheelStartX=l.wheelStartY=null,r&&(pi=(pi*di+r)/(di+1),++di)}},200)):(l.wheelDX+=i,l.wheelDY+=o))}}l?pi=-.53:r?pi=15:c?pi=-.7:h&&(pi=-1/3);var yi=function(t,e){this.ranges=t,this.primIndex=e};yi.prototype.primary=function(){return this.ranges[this.primIndex]},yi.prototype.equals=function(t){if(t==this)return!0;if(t.primIndex!=this.primIndex||t.ranges.length!=this.ranges.length)return!1;for(var e=0;e<this.ranges.length;e++){var r=this.ranges[e],n=t.ranges[e];if(!yt(r.anchor,n.anchor)||!yt(r.head,n.head))return!1}return!0},yi.prototype.deepCopy=function(){for(var t=[],e=0;e<this.ranges.length;e++)t[e]=new bi(bt(this.ranges[e].anchor),bt(this.ranges[e].head));return new yi(t,this.primIndex)},yi.prototype.somethingSelected=function(){for(var t=0;t<this.ranges.length;t++)if(!this.ranges[t].empty())return!0;return!1},yi.prototype.contains=function(t,e){e||(e=t);for(var r=0;r<this.ranges.length;r++){var n=this.ranges[r];if(mt(e,n.from())>=0&&mt(t,n.to())<=0)return r}return-1};var bi=function(t,e){this.anchor=t,this.head=e};function wi(t,e,r){var n=t&&t.options.selectionsMayTouch,i=e[r];e.sort(function(t,e){return mt(t.from(),e.from())}),r=P(e,i);for(var o=1;o<e.length;o++){var l=e[o],a=e[o-1],s=mt(a.to(),l.from());if(n&&!l.empty()?s>0:s>=0){var u=xt(a.from(),l.from()),c=wt(a.to(),l.to()),f=a.empty()?l.from()==l.head:a.from()==a.head;o<=r&&--r,e.splice(--o,2,new bi(f?c:u,f?u:c))}}return new yi(e,r)}function xi(t,e){return new yi([new bi(t,e||t)],0)}function Ci(t){return t.text?gt(t.from.line+t.text.length-1,Z(t.text).length+(1==t.text.length?t.from.ch:0)):t.to}function ki(t,e){if(mt(t,e.from)<0)return t;if(mt(t,e.to)<=0)return Ci(e);var r=t.line+e.text.length-(e.to.line-e.from.line)-1,n=t.ch;return t.line==e.to.line&&(n+=Ci(e).ch-e.to.ch),gt(r,n)}function Mi(t,e){for(var r=[],n=0;n<t.sel.ranges.length;n++){var i=t.sel.ranges[n];r.push(new bi(ki(i.anchor,e),ki(i.head,e)))}return wi(t.cm,r,t.sel.primIndex)}function Li(t,e,r){return t.line==e.line?gt(r.line,t.ch-e.ch+r.ch):gt(r.line+(t.line-e.line),t.ch)}function Ti(t){t.doc.mode=Ne(t.options,t.doc.modeOption),Oi(t)}function Oi(t){t.doc.iter(function(t){t.stateAfter&&(t.stateAfter=null),t.styles&&(t.styles=null)}),t.doc.modeFrontier=t.doc.highlightFrontier=t.doc.first,ni(t,100),t.state.modeGen++,t.curOp&&Vn(t)}function Ni(t,e){return 0==e.from.ch&&0==e.to.ch&&""==Z(e.text)&&(!t.cm||t.cm.options.wholeLineUpdateBefore)}function Si(t,e,r,n){function i(t){return r?r[t]:null}function o(t,r,i){!function(t,e,r,n){t.text=e,t.stateAfter&&(t.stateAfter=null),t.styles&&(t.styles=null),null!=t.order&&(t.order=null),Et(t),Wt(t,r);var i=n?n(t):1;i!=t.height&&ft(t,i)}(t,r,i,n),sr(t,"change",t,e)}function l(t,e){for(var r=[],o=t;o<e;++o)r.push(new Ye(u[o],i(o),n));return r}var a=e.from,s=e.to,u=e.text,c=st(t,a.line),f=st(t,s.line),h=Z(u),d=i(u.length-1),p=s.line-a.line;if(e.full)t.insert(0,l(0,u.length)),t.remove(u.length,t.size-u.length);else if(Ni(t,e)){var v=l(0,u.length-1);o(f,f.text,d),p&&t.remove(a.line,p),v.length&&t.insert(a.line,v)}else if(c==f)if(1==u.length)o(c,c.text.slice(0,a.ch)+h+c.text.slice(s.ch),d);else{var g=l(1,u.length-1);g.push(new Ye(h+c.text.slice(s.ch),d,n)),o(c,c.text.slice(0,a.ch)+u[0],i(0)),t.insert(a.line+1,g)}else if(1==u.length)o(c,c.text.slice(0,a.ch)+u[0]+f.text.slice(s.ch),i(0)),t.remove(a.line+1,p);else{o(c,c.text.slice(0,a.ch)+u[0],i(0)),o(f,h+f.text.slice(s.ch),d);var m=l(1,u.length-1);p>1&&t.remove(a.line+1,p-1),t.insert(a.line+1,m)}sr(t,"change",t,e)}function Ai(t,e,r){!function t(n,i,o){if(n.linked)for(var l=0;l<n.linked.length;++l){var a=n.linked[l];if(a.doc!=i){var s=o&&a.sharedHist;r&&!s||(e(a.doc,s),t(a.doc,n,s))}}}(t,null,!0)}function Di(t,e){if(e.cm)throw new Error("This document is already in use.");t.doc=e,e.cm=t,an(t),Ti(t),Ei(t),t.options.lineWrapping||Zt(t),t.options.mode=e.modeOption,Vn(t)}function Ei(t){("rtl"==t.doc.direction?W:T)(t.display.lineDiv,"CodeMirror-rtl")}function Wi(t){this.done=[],this.undone=[],this.undoDepth=1/0,this.lastModTime=this.lastSelTime=0,this.lastOp=this.lastSelOp=null,this.lastOrigin=this.lastSelOrigin=null,this.generation=this.maxGeneration=t||1}function Hi(t,e){var r={from:bt(e.from),to:Ci(e),text:ut(t,e.from,e.to)};return Ri(t,r,e.from.line,e.to.line+1),Ai(t,function(t){return Ri(t,r,e.from.line,e.to.line+1)},!0),r}function zi(t){for(;t.length;){var e=Z(t);if(!e.ranges)break;t.pop()}}function Ii(t,e,r,n){var i=t.history;i.undone.length=0;var o,l,a=+new Date;if((i.lastOp==n||i.lastOrigin==e.origin&&e.origin&&("+"==e.origin.charAt(0)&&i.lastModTime>a-(t.cm?t.cm.options.historyEventDelay:500)||"*"==e.origin.charAt(0)))&&(o=function(t,e){return e?(zi(t.done),Z(t.done)):t.done.length&&!Z(t.done).ranges?Z(t.done):t.done.length>1&&!t.done[t.done.length-2].ranges?(t.done.pop(),Z(t.done)):void 0}(i,i.lastOp==n)))l=Z(o.changes),0==mt(e.from,e.to)&&0==mt(e.from,l.to)?l.to=Ci(e):o.changes.push(Hi(t,e));else{var s=Z(i.done);for(s&&s.ranges||Fi(t.sel,i.done),o={changes:[Hi(t,e)],generation:i.generation},i.done.push(o);i.done.length>i.undoDepth;)i.done.shift(),i.done[0].ranges||i.done.shift()}i.done.push(r),i.generation=++i.maxGeneration,i.lastModTime=i.lastSelTime=a,i.lastOp=i.lastSelOp=n,i.lastOrigin=i.lastSelOrigin=e.origin,l||ie(t,"historyAdded")}function _i(t,e,r,n){var i=t.history,o=n&&n.origin;r==i.lastSelOp||o&&i.lastSelOrigin==o&&(i.lastModTime==i.lastSelTime&&i.lastOrigin==o||function(t,e,r,n){var i=e.charAt(0);return"*"==i||"+"==i&&r.ranges.length==n.ranges.length&&r.somethingSelected()==n.somethingSelected()&&new Date-t.history.lastSelTime<=(t.cm?t.cm.options.historyEventDelay:500)}(t,o,Z(i.done),e))?i.done[i.done.length-1]=e:Fi(e,i.done),i.lastSelTime=+new Date,i.lastSelOrigin=o,i.lastSelOp=r,n&&!1!==n.clearRedo&&zi(i.undone)}function Fi(t,e){var r=Z(e);r&&r.ranges&&r.equals(t)||e.push(t)}function Ri(t,e,r,n){var i=e["spans_"+t.id],o=0;t.iter(Math.max(t.first,r),Math.min(t.first+t.size,n),function(r){r.markedSpans&&((i||(i=e["spans_"+t.id]={}))[o]=r.markedSpans),++o})}function Pi(t){if(!t)return null;for(var e,r=0;r<t.length;++r)t[r].marker.explicitlyCleared?e||(e=t.slice(0,r)):e&&e.push(t[r]);return e?e.length?e:null:t}function Ui(t,e){var r=function(t,e){var r=e["spans_"+t.id];if(!r)return null;for(var n=[],i=0;i<e.text.length;++i)n.push(Pi(r[i]));return n}(t,e),n=At(t,e);if(!r)return n;if(!n)return r;for(var i=0;i<r.length;++i){var o=r[i],l=n[i];if(o&&l)t:for(var a=0;a<l.length;++a){for(var s=l[a],u=0;u<o.length;++u)if(o[u].marker==s.marker)continue t;o.push(s)}else l&&(r[i]=l)}return r}function Bi(t,e,r){for(var n=[],i=0;i<t.length;++i){var o=t[i];if(o.ranges)n.push(r?yi.prototype.deepCopy.call(o):o);else{var l=o.changes,a=[];n.push({changes:a});for(var s=0;s<l.length;++s){var u=l[s],c=void 0;if(a.push({from:u.from,to:u.to,text:u.text}),e)for(var f in u)(c=f.match(/^spans_(\d+)$/))&&P(e,Number(c[1]))>-1&&(Z(a)[f]=u[f],delete u[f])}}}return n}function Gi(t,e,r,n){if(n){var i=t.anchor;if(r){var o=mt(e,i)<0;o!=mt(r,i)<0?(i=e,e=r):o!=mt(e,r)<0&&(e=r)}return new bi(i,e)}return new bi(r||e,e)}function Ki(t,e,r,n,i){null==i&&(i=t.cm&&(t.cm.display.shift||t.extend)),Zi(t,new yi([Gi(t.sel.primary(),e,r,i)],0),n)}function qi(t,e,r){for(var n=[],i=t.cm&&(t.cm.display.shift||t.extend),o=0;o<t.sel.ranges.length;o++)n[o]=Gi(t.sel.ranges[o],e[o],null,i);var l=wi(t.cm,n,t.sel.primIndex);Zi(t,l,r)}function Xi(t,e,r,n){var i=t.sel.ranges.slice(0);i[e]=r,Zi(t,wi(t.cm,i,t.sel.primIndex),n)}function Yi(t,e,r,n){Zi(t,xi(e,r),n)}function Ji(t,e,r){var n=t.history.done,i=Z(n);i&&i.ranges?(n[n.length-1]=e,Qi(t,e,r)):Zi(t,e,r)}function Zi(t,e,r){Qi(t,e,r),_i(t,t.sel,t.cm?t.cm.curOp.id:NaN,r)}function Qi(t,e,r){(ae(t,"beforeSelectionChange")||t.cm&&ae(t.cm,"beforeSelectionChange"))&&(e=function(t,e,r){var n={ranges:e.ranges,update:function(e){this.ranges=[];for(var r=0;r<e.length;r++)this.ranges[r]=new bi(kt(t,e[r].anchor),kt(t,e[r].head))},origin:r&&r.origin};return ie(t,"beforeSelectionChange",t,n),t.cm&&ie(t.cm,"beforeSelectionChange",t.cm,n),n.ranges!=e.ranges?wi(t.cm,n.ranges,n.ranges.length-1):e}(t,e,r));var n=r&&r.bias||(mt(e.primary().head,t.sel.primary().head)<0?-1:1);ji(t,$i(t,e,n,!0)),r&&!1===r.scroll||!t.cm||On(t.cm)}function ji(t,e){e.equals(t.sel)||(t.sel=e,t.cm&&(t.cm.curOp.updateInput=1,t.cm.curOp.selectionChanged=!0,le(t.cm)),sr(t,"cursorActivity",t))}function Vi(t){ji(t,$i(t,t.sel,null,!1))}function $i(t,e,r,n){for(var i,o=0;o<e.ranges.length;o++){var l=e.ranges[o],a=e.ranges.length==t.sel.ranges.length&&t.sel.ranges[o],s=eo(t,l.anchor,a&&a.anchor,r,n),u=eo(t,l.head,a&&a.head,r,n);(i||s!=l.anchor||u!=l.head)&&(i||(i=e.ranges.slice(0,o)),i[o]=new bi(s,u))}return i?wi(t.cm,i,e.primIndex):e}function to(t,e,r,n,i){var o=st(t,e.line);if(o.markedSpans)for(var l=0;l<o.markedSpans.length;++l){var a=o.markedSpans[l],s=a.marker;if((null==a.from||(s.inclusiveLeft?a.from<=e.ch:a.from<e.ch))&&(null==a.to||(s.inclusiveRight?a.to>=e.ch:a.to>e.ch))){if(i&&(ie(s,"beforeCursorEnter"),s.explicitlyCleared)){if(o.markedSpans){--l;continue}break}if(!s.atomic)continue;if(r){var u=s.find(n<0?1:-1),c=void 0;if((n<0?s.inclusiveRight:s.inclusiveLeft)&&(u=ro(t,u,-n,u&&u.line==e.line?o:null)),u&&u.line==e.line&&(c=mt(u,r))&&(n<0?c<0:c>0))return to(t,u,e,n,i)}var f=s.find(n<0?-1:1);return(n<0?s.inclusiveLeft:s.inclusiveRight)&&(f=ro(t,f,n,f.line==e.line?o:null)),f?to(t,f,e,n,i):null}}return e}function eo(t,e,r,n,i){var o=n||1,l=to(t,e,r,o,i)||!i&&to(t,e,r,o,!0)||to(t,e,r,-o,i)||!i&&to(t,e,r,-o,!0);return l||(t.cantEdit=!0,gt(t.first,0))}function ro(t,e,r,n){return r<0&&0==e.ch?e.line>t.first?kt(t,gt(e.line-1)):null:r>0&&e.ch==(n||st(t,e.line)).text.length?e.line<t.first+t.size-1?gt(e.line+1,0):null:new gt(e.line,e.ch+r)}function no(t){t.setSelection(gt(t.firstLine(),0),gt(t.lastLine()),G)}function io(t,e,r){var n={canceled:!1,from:e.from,to:e.to,text:e.text,origin:e.origin,cancel:function(){return n.canceled=!0}};return r&&(n.update=function(e,r,i,o){e&&(n.from=kt(t,e)),r&&(n.to=kt(t,r)),i&&(n.text=i),void 0!==o&&(n.origin=o)}),ie(t,"beforeChange",t,n),t.cm&&ie(t.cm,"beforeChange",t.cm,n),n.canceled?(t.cm&&(t.cm.curOp.updateInput=2),null):{from:n.from,to:n.to,text:n.text,origin:n.origin}}function oo(t,e,r){if(t.cm){if(!t.cm.curOp)return Zn(t.cm,oo)(t,e,r);if(t.cm.state.suppressEdits)return}if(!(ae(t,"beforeChange")||t.cm&&ae(t.cm,"beforeChange"))||(e=io(t,e,!0))){var n=Lt&&!r&&function(t,e,r){var n=null;if(t.iter(e.line,r.line+1,function(t){if(t.markedSpans)for(var e=0;e<t.markedSpans.length;++e){var r=t.markedSpans[e].marker;!r.readOnly||n&&-1!=P(n,r)||(n||(n=[])).push(r)}}),!n)return null;for(var i=[{from:e,to:r}],o=0;o<n.length;++o)for(var l=n[o],a=l.find(0),s=0;s<i.length;++s){var u=i[s];if(!(mt(u.to,a.from)<0||mt(u.from,a.to)>0)){var c=[s,1],f=mt(u.from,a.from),h=mt(u.to,a.to);(f<0||!l.inclusiveLeft&&!f)&&c.push({from:u.from,to:a.from}),(h>0||!l.inclusiveRight&&!h)&&c.push({from:a.to,to:u.to}),i.splice.apply(i,c),s+=c.length-3}}return i}(t,e.from,e.to);if(n)for(var i=n.length-1;i>=0;--i)lo(t,{from:n[i].from,to:n[i].to,text:i?[""]:e.text,origin:e.origin});else lo(t,e)}}function lo(t,e){if(1!=e.text.length||""!=e.text[0]||0!=mt(e.from,e.to)){var r=Mi(t,e);Ii(t,e,r,t.cm?t.cm.curOp.id:NaN),uo(t,e,r,At(t,e));var n=[];Ai(t,function(t,r){r||-1!=P(n,t.history)||(po(t.history,e),n.push(t.history)),uo(t,e,null,At(t,e))})}}function ao(t,e,r){var n=t.cm&&t.cm.state.suppressEdits;if(!n||r){for(var i,o=t.history,l=t.sel,a="undo"==e?o.done:o.undone,s="undo"==e?o.undone:o.done,u=0;u<a.length&&(i=a[u],r?!i.ranges||i.equals(t.sel):i.ranges);u++);if(u!=a.length){for(o.lastOrigin=o.lastSelOrigin=null;;){if(!(i=a.pop()).ranges){if(n)return void a.push(i);break}if(Fi(i,s),r&&!i.equals(t.sel))return void Zi(t,i,{clearRedo:!1});l=i}var c=[];Fi(l,s),s.push({changes:c,generation:o.generation}),o.generation=i.generation||++o.maxGeneration;for(var f=ae(t,"beforeChange")||t.cm&&ae(t.cm,"beforeChange"),h=function(r){var n=i.changes[r];if(n.origin=e,f&&!io(t,n,!1))return a.length=0,{};c.push(Hi(t,n));var o=r?Mi(t,n):Z(a);uo(t,n,o,Ui(t,n)),!r&&t.cm&&t.cm.scrollIntoView({from:n.from,to:Ci(n)});var l=[];Ai(t,function(t,e){e||-1!=P(l,t.history)||(po(t.history,n),l.push(t.history)),uo(t,n,null,Ui(t,n))})},d=i.changes.length-1;d>=0;--d){var p=h(d);if(p)return p.v}}}}function so(t,e){if(0!=e&&(t.first+=e,t.sel=new yi(Q(t.sel.ranges,function(t){return new bi(gt(t.anchor.line+e,t.anchor.ch),gt(t.head.line+e,t.head.ch))}),t.sel.primIndex),t.cm)){Vn(t.cm,t.first,t.first-e,e);for(var r=t.cm.display,n=r.viewFrom;n<r.viewTo;n++)$n(t.cm,n,"gutter")}}function uo(t,e,r,n){if(t.cm&&!t.cm.curOp)return Zn(t.cm,uo)(t,e,r,n);if(e.to.line<t.first)so(t,e.text.length-1-(e.to.line-e.from.line));else if(!(e.from.line>t.lastLine())){if(e.from.line<t.first){var i=e.text.length-1-(t.first-e.from.line);so(t,i),e={from:gt(t.first,0),to:gt(e.to.line+i,e.to.ch),text:[Z(e.text)],origin:e.origin}}var o=t.lastLine();e.to.line>o&&(e={from:e.from,to:gt(o,st(t,o).text.length),text:[e.text[0]],origin:e.origin}),e.removed=ut(t,e.from,e.to),r||(r=Mi(t,e)),t.cm?function(t,e,r){var n=t.doc,i=t.display,o=e.from,l=e.to,a=!1,s=o.line;t.options.lineWrapping||(s=ht(Bt(st(n,o.line))),n.iter(s,l.line+1,function(t){if(t==i.maxLine)return a=!0,!0})),n.sel.contains(e.from,e.to)>-1&&le(t),Si(n,e,r,ln(t)),t.options.lineWrapping||(n.iter(s,o.line+e.text.length,function(t){var e=Jt(t);e>i.maxLineLength&&(i.maxLine=t,i.maxLineLength=e,i.maxLineChanged=!0,a=!1)}),a&&(t.curOp.updateMaxLine=!0)),function(t,e){if(t.modeFrontier=Math.min(t.modeFrontier,e),!(t.highlightFrontier<e-10)){for(var r=t.first,n=e-1;n>r;n--){var i=st(t,n).stateAfter;if(i&&(!(i instanceof ze)||n+i.lookAhead<e)){r=n+1;break}}t.highlightFrontier=Math.min(t.highlightFrontier,r)}}(n,o.line),ni(t,400);var u=e.text.length-(l.line-o.line)-1;e.full?Vn(t):o.line!=l.line||1!=e.text.length||Ni(t.doc,e)?Vn(t,o.line,l.line+1,u):$n(t,o.line,"text");var c=ae(t,"changes"),f=ae(t,"change");if(f||c){var h={from:o,to:l,text:e.text,removed:e.removed,origin:e.origin};f&&sr(t,"change",t,h),c&&(t.curOp.changeObjs||(t.curOp.changeObjs=[])).push(h)}t.display.selForContextMenu=null}(t.cm,e,n):Si(t,e,n),Qi(t,r,G)}}function co(t,e,r,n,i){var o;n||(n=r),mt(n,r)<0&&(r=(o=[n,r])[0],n=o[1]),"string"==typeof e&&(e=t.splitLines(e)),oo(t,{from:r,to:n,text:e,origin:i})}function fo(t,e,r,n){r<t.line?t.line+=n:e<t.line&&(t.line=e,t.ch=0)}function ho(t,e,r,n){for(var i=0;i<t.length;++i){var o=t[i],l=!0;if(o.ranges){o.copied||((o=t[i]=o.deepCopy()).copied=!0);for(var a=0;a<o.ranges.length;a++)fo(o.ranges[a].anchor,e,r,n),fo(o.ranges[a].head,e,r,n)}else{for(var s=0;s<o.changes.length;++s){var u=o.changes[s];if(r<u.from.line)u.from=gt(u.from.line+n,u.from.ch),u.to=gt(u.to.line+n,u.to.ch);else if(e<=u.to.line){l=!1;break}}l||(t.splice(0,i+1),i=0)}}}function po(t,e){var r=e.from.line,n=e.to.line,i=e.text.length-(n-r)-1;ho(t.done,r,n,i),ho(t.undone,r,n,i)}function vo(t,e,r,n){var i=e,o=e;return"number"==typeof e?o=st(t,Ct(t,e)):i=ht(e),null==i?null:(n(o,i)&&t.cm&&$n(t.cm,i,r),o)}function go(t){this.lines=t,this.parent=null;for(var e=0,r=0;r<t.length;++r)t[r].parent=this,e+=t[r].height;this.height=e}function mo(t){this.children=t;for(var e=0,r=0,n=0;n<t.length;++n){var i=t[n];e+=i.chunkSize(),r+=i.height,i.parent=this}this.size=e,this.height=r,this.parent=null}bi.prototype.from=function(){return xt(this.anchor,this.head)},bi.prototype.to=function(){return wt(this.anchor,this.head)},bi.prototype.empty=function(){return this.head.line==this.anchor.line&&this.head.ch==this.anchor.ch},go.prototype={chunkSize:function(){return this.lines.length},removeInner:function(t,e){for(var r=t,n=t+e;r<n;++r){var i=this.lines[r];this.height-=i.height,Je(i),sr(i,"delete")}this.lines.splice(t,e)},collapse:function(t){t.push.apply(t,this.lines)},insertInner:function(t,e,r){this.height+=r,this.lines=this.lines.slice(0,t).concat(e).concat(this.lines.slice(t));for(var n=0;n<e.length;++n)e[n].parent=this},iterN:function(t,e,r){for(var n=t+e;t<n;++t)if(r(this.lines[t]))return!0}},mo.prototype={chunkSize:function(){return this.size},removeInner:function(t,e){this.size-=e;for(var r=0;r<this.children.length;++r){var n=this.children[r],i=n.chunkSize();if(t<i){var o=Math.min(e,i-t),l=n.height;if(n.removeInner(t,o),this.height-=l-n.height,i==o&&(this.children.splice(r--,1),n.parent=null),0==(e-=o))break;t=0}else t-=i}if(this.size-e<25&&(this.children.length>1||!(this.children[0]instanceof go))){var a=[];this.collapse(a),this.children=[new go(a)],this.children[0].parent=this}},collapse:function(t){for(var e=0;e<this.children.length;++e)this.children[e].collapse(t)},insertInner:function(t,e,r){this.size+=e.length,this.height+=r;for(var n=0;n<this.children.length;++n){var i=this.children[n],o=i.chunkSize();if(t<=o){if(i.insertInner(t,e,r),i.lines&&i.lines.length>50){for(var l=i.lines.length%25+25,a=l;a<i.lines.length;){var s=new go(i.lines.slice(a,a+=25));i.height-=s.height,this.children.splice(++n,0,s),s.parent=this}i.lines=i.lines.slice(0,l),this.maybeSpill()}break}t-=o}},maybeSpill:function(){if(!(this.children.length<=10)){var t=this;do{var e=t.children.splice(t.children.length-5,5),r=new mo(e);if(t.parent){t.size-=r.size,t.height-=r.height;var n=P(t.parent.children,t);t.parent.children.splice(n+1,0,r)}else{var i=new mo(t.children);i.parent=t,t.children=[i,r],t=i}r.parent=t.parent}while(t.children.length>10);t.parent.maybeSpill()}},iterN:function(t,e,r){for(var n=0;n<this.children.length;++n){var i=this.children[n],o=i.chunkSize();if(t<o){var l=Math.min(e,o-t);if(i.iterN(t,l,r))return!0;if(0==(e-=l))break;t=0}else t-=o}}};var yo=function(t,e,r){if(r)for(var n in r)r.hasOwnProperty(n)&&(this[n]=r[n]);this.doc=t,this.node=e};function bo(t,e,r){Yt(e)<(t.curOp&&t.curOp.scrollTop||t.doc.scrollTop)&&Tn(t,r)}yo.prototype.clear=function(){var t=this.doc.cm,e=this.line.widgets,r=this.line,n=ht(r);if(null!=n&&e){for(var i=0;i<e.length;++i)e[i]==this&&e.splice(i--,1);e.length||(r.widgets=null);var o=xr(this);ft(r,Math.max(0,r.height-o)),t&&(Jn(t,function(){bo(t,r,-o),$n(t,n,"widget")}),sr(t,"lineWidgetCleared",t,this,n))}},yo.prototype.changed=function(){var t=this,e=this.height,r=this.doc.cm,n=this.line;this.height=null;var i=xr(this)-e;i&&(qt(this.doc,n)||ft(n,n.height+i),r&&Jn(r,function(){r.curOp.forceUpdate=!0,bo(r,n,i),sr(r,"lineWidgetChanged",r,t,ht(n))}))},se(yo);var wo=0,xo=function(t,e){this.lines=[],this.type=e,this.doc=t,this.id=++wo};function Co(t,e,r,n,i){if(n&&n.shared)return function(t,e,r,n,i){(n=_(n)).shared=!1;var o=[Co(t,e,r,n,i)],l=o[0],a=n.widgetNode;return Ai(t,function(t){a&&(n.widgetNode=a.cloneNode(!0)),o.push(Co(t,kt(t,e),kt(t,r),n,i));for(var s=0;s<t.linked.length;++s)if(t.linked[s].isParent)return;l=Z(o)}),new ko(o,l)}(t,e,r,n,i);if(t.cm&&!t.cm.curOp)return Zn(t.cm,Co)(t,e,r,n,i);var o=new xo(t,i),l=mt(e,r);if(n&&_(n,o,!1),l>0||0==l&&!1!==o.clearWhenEmpty)return o;if(o.replacedWith&&(o.collapsed=!0,o.widgetNode=A("span",[o.replacedWith],"CodeMirror-widget"),n.handleMouseEvents||o.widgetNode.setAttribute("cm-ignore-events","true"),n.insertLeft&&(o.widgetNode.insertLeft=!0)),o.collapsed){if(Ut(t,e.line,e,r,o)||e.line!=r.line&&Ut(t,r.line,e,r,o))throw new Error("Inserting collapsed marker partially overlapping an existing one");Tt=!0}o.addToHistory&&Ii(t,{from:e,to:r,origin:"markText"},t.sel,NaN);var a,s=e.line,u=t.cm;if(t.iter(s,r.line+1,function(t){u&&o.collapsed&&!u.options.lineWrapping&&Bt(t)==u.display.maxLine&&(a=!0),o.collapsed&&s!=e.line&&ft(t,0),function(t,e){t.markedSpans=t.markedSpans?t.markedSpans.concat([e]):[e],e.marker.attachLine(t)}(t,new Ot(o,s==e.line?e.ch:null,s==r.line?r.ch:null)),++s}),o.collapsed&&t.iter(e.line,r.line+1,function(e){qt(t,e)&&ft(e,0)}),o.clearOnEnter&&ee(o,"beforeCursorEnter",function(){return o.clear()}),o.readOnly&&(Lt=!0,(t.history.done.length||t.history.undone.length)&&t.clearHistory()),o.collapsed&&(o.id=++wo,o.atomic=!0),u){if(a&&(u.curOp.updateMaxLine=!0),o.collapsed)Vn(u,e.line,r.line+1);else if(o.className||o.startStyle||o.endStyle||o.css||o.attributes||o.title)for(var c=e.line;c<=r.line;c++)$n(u,c,"text");o.atomic&&Vi(u.doc),sr(u,"markerAdded",u,o)}return o}xo.prototype.clear=function(){if(!this.explicitlyCleared){var t=this.doc.cm,e=t&&!t.curOp;if(e&&Bn(t),ae(this,"clear")){var r=this.find();r&&sr(this,"clear",r.from,r.to)}for(var n=null,i=null,o=0;o<this.lines.length;++o){var l=this.lines[o],a=Nt(l.markedSpans,this);t&&!this.collapsed?$n(t,ht(l),"text"):t&&(null!=a.to&&(i=ht(l)),null!=a.from&&(n=ht(l))),l.markedSpans=St(l.markedSpans,a),null==a.from&&this.collapsed&&!qt(this.doc,l)&&t&&ft(l,en(t.display))}if(t&&this.collapsed&&!t.options.lineWrapping)for(var s=0;s<this.lines.length;++s){var u=Bt(this.lines[s]),c=Jt(u);c>t.display.maxLineLength&&(t.display.maxLine=u,t.display.maxLineLength=c,t.display.maxLineChanged=!0)}null!=n&&t&&this.collapsed&&Vn(t,n,i+1),this.lines.length=0,this.explicitlyCleared=!0,this.atomic&&this.doc.cantEdit&&(this.doc.cantEdit=!1,t&&Vi(t.doc)),t&&sr(t,"markerCleared",t,this,n,i),e&&Gn(t),this.parent&&this.parent.clear()}},xo.prototype.find=function(t,e){var r,n;null==t&&"bookmark"==this.type&&(t=1);for(var i=0;i<this.lines.length;++i){var o=this.lines[i],l=Nt(o.markedSpans,this);if(null!=l.from&&(r=gt(e?o:ht(o),l.from),-1==t))return r;if(null!=l.to&&(n=gt(e?o:ht(o),l.to),1==t))return n}return r&&{from:r,to:n}},xo.prototype.changed=function(){var t=this,e=this.find(-1,!0),r=this,n=this.doc.cm;e&&n&&Jn(n,function(){var i=e.line,o=ht(e.line),l=Dr(n,o);if(l&&(Fr(l),n.curOp.selectionChanged=n.curOp.forceUpdate=!0),n.curOp.updateMaxLine=!0,!qt(r.doc,i)&&null!=r.height){var a=r.height;r.height=null;var s=xr(r)-a;s&&ft(i,i.height+s)}sr(n,"markerChanged",n,t)})},xo.prototype.attachLine=function(t){if(!this.lines.length&&this.doc.cm){var e=this.doc.cm.curOp;e.maybeHiddenMarkers&&-1!=P(e.maybeHiddenMarkers,this)||(e.maybeUnhiddenMarkers||(e.maybeUnhiddenMarkers=[])).push(this)}this.lines.push(t)},xo.prototype.detachLine=function(t){if(this.lines.splice(P(this.lines,t),1),!this.lines.length&&this.doc.cm){var e=this.doc.cm.curOp;(e.maybeHiddenMarkers||(e.maybeHiddenMarkers=[])).push(this)}},se(xo);var ko=function(t,e){this.markers=t,this.primary=e;for(var r=0;r<t.length;++r)t[r].parent=this};function Mo(t){return t.findMarks(gt(t.first,0),t.clipPos(gt(t.lastLine())),function(t){return t.parent})}function Lo(t){for(var e=function(e){var r=t[e],n=[r.primary.doc];Ai(r.primary.doc,function(t){return n.push(t)});for(var i=0;i<r.markers.length;i++){var o=r.markers[i];-1==P(n,o.doc)&&(o.parent=null,r.markers.splice(i--,1))}},r=0;r<t.length;r++)e(r)}ko.prototype.clear=function(){if(!this.explicitlyCleared){this.explicitlyCleared=!0;for(var t=0;t<this.markers.length;++t)this.markers[t].clear();sr(this,"clear")}},ko.prototype.find=function(t,e){return this.primary.find(t,e)},se(ko);var To=0,Oo=function(t,e,r,n,i){if(!(this instanceof Oo))return new Oo(t,e,r,n,i);null==r&&(r=0),mo.call(this,[new go([new Ye("",null)])]),this.first=r,this.scrollTop=this.scrollLeft=0,this.cantEdit=!1,this.cleanGeneration=1,this.modeFrontier=this.highlightFrontier=r;var o=gt(r,0);this.sel=xi(o),this.history=new Wi(null),this.id=++To,this.modeOption=e,this.lineSep=n,this.direction="rtl"==i?"rtl":"ltr",this.extend=!1,"string"==typeof t&&(t=this.splitLines(t)),Si(this,{from:o,to:o,text:t}),Zi(this,xi(o),G)};Oo.prototype=V(mo.prototype,{constructor:Oo,iter:function(t,e,r){r?this.iterN(t-this.first,e-t,r):this.iterN(this.first,this.first+this.size,t)},insert:function(t,e){for(var r=0,n=0;n<e.length;++n)r+=e[n].height;this.insertInner(t-this.first,e,r)},remove:function(t,e){this.removeInner(t-this.first,e)},getValue:function(t){var e=ct(this,this.first,this.first+this.size);return!1===t?e:e.join(t||this.lineSeparator())},setValue:jn(function(t){var e=gt(this.first,0),r=this.first+this.size-1;oo(this,{from:e,to:gt(r,st(this,r).text.length),text:this.splitLines(t),origin:"setValue",full:!0},!0),this.cm&&Nn(this.cm,0,0),Zi(this,xi(e),G)}),replaceRange:function(t,e,r,n){e=kt(this,e),r=r?kt(this,r):e,co(this,t,e,r,n)},getRange:function(t,e,r){var n=ut(this,kt(this,t),kt(this,e));return!1===r?n:n.join(r||this.lineSeparator())},getLine:function(t){var e=this.getLineHandle(t);return e&&e.text},getLineHandle:function(t){if(pt(this,t))return st(this,t)},getLineNumber:function(t){return ht(t)},getLineHandleVisualStart:function(t){return"number"==typeof t&&(t=st(this,t)),Bt(t)},lineCount:function(){return this.size},firstLine:function(){return this.first},lastLine:function(){return this.first+this.size-1},clipPos:function(t){return kt(this,t)},getCursor:function(t){var e=this.sel.primary();return null==t||"head"==t?e.head:"anchor"==t?e.anchor:"end"==t||"to"==t||!1===t?e.to():e.from()},listSelections:function(){return this.sel.ranges},somethingSelected:function(){return this.sel.somethingSelected()},setCursor:jn(function(t,e,r){Yi(this,kt(this,"number"==typeof t?gt(t,e||0):t),null,r)}),setSelection:jn(function(t,e,r){Yi(this,kt(this,t),kt(this,e||t),r)}),extendSelection:jn(function(t,e,r){Ki(this,kt(this,t),e&&kt(this,e),r)}),extendSelections:jn(function(t,e){qi(this,Mt(this,t),e)}),extendSelectionsBy:jn(function(t,e){var r=Q(this.sel.ranges,t);qi(this,Mt(this,r),e)}),setSelections:jn(function(t,e,r){if(t.length){for(var n=[],i=0;i<t.length;i++)n[i]=new bi(kt(this,t[i].anchor),kt(this,t[i].head));null==e&&(e=Math.min(t.length-1,this.sel.primIndex)),Zi(this,wi(this.cm,n,e),r)}}),addSelection:jn(function(t,e,r){var n=this.sel.ranges.slice(0);n.push(new bi(kt(this,t),kt(this,e||t))),Zi(this,wi(this.cm,n,n.length-1),r)}),getSelection:function(t){for(var e,r=this.sel.ranges,n=0;n<r.length;n++){var i=ut(this,r[n].from(),r[n].to());e=e?e.concat(i):i}return!1===t?e:e.join(t||this.lineSeparator())},getSelections:function(t){for(var e=[],r=this.sel.ranges,n=0;n<r.length;n++){var i=ut(this,r[n].from(),r[n].to());!1!==t&&(i=i.join(t||this.lineSeparator())),e[n]=i}return e},replaceSelection:function(t,e,r){for(var n=[],i=0;i<this.sel.ranges.length;i++)n[i]=t;this.replaceSelections(n,e,r||"+input")},replaceSelections:jn(function(t,e,r){for(var n=[],i=this.sel,o=0;o<i.ranges.length;o++){var l=i.ranges[o];n[o]={from:l.from(),to:l.to(),text:this.splitLines(t[o]),origin:r}}for(var a=e&&"end"!=e&&function(t,e,r){for(var n=[],i=gt(t.first,0),o=i,l=0;l<e.length;l++){var a=e[l],s=Li(a.from,i,o),u=Li(Ci(a),i,o);if(i=a.to,o=u,"around"==r){var c=t.sel.ranges[l],f=mt(c.head,c.anchor)<0;n[l]=new bi(f?u:s,f?s:u)}else n[l]=new bi(s,s)}return new yi(n,t.sel.primIndex)}(this,n,e),s=n.length-1;s>=0;s--)oo(this,n[s]);a?Ji(this,a):this.cm&&On(this.cm)}),undo:jn(function(){ao(this,"undo")}),redo:jn(function(){ao(this,"redo")}),undoSelection:jn(function(){ao(this,"undo",!0)}),redoSelection:jn(function(){ao(this,"redo",!0)}),setExtending:function(t){this.extend=t},getExtending:function(){return this.extend},historySize:function(){for(var t=this.history,e=0,r=0,n=0;n<t.done.length;n++)t.done[n].ranges||++e;for(var i=0;i<t.undone.length;i++)t.undone[i].ranges||++r;return{undo:e,redo:r}},clearHistory:function(){this.history=new Wi(this.history.maxGeneration)},markClean:function(){this.cleanGeneration=this.changeGeneration(!0)},changeGeneration:function(t){return t&&(this.history.lastOp=this.history.lastSelOp=this.history.lastOrigin=null),this.history.generation},isClean:function(t){return this.history.generation==(t||this.cleanGeneration)},getHistory:function(){return{done:Bi(this.history.done),undone:Bi(this.history.undone)}},setHistory:function(t){var e=this.history=new Wi(this.history.maxGeneration);e.done=Bi(t.done.slice(0),null,!0),e.undone=Bi(t.undone.slice(0),null,!0)},setGutterMarker:jn(function(t,e,r){return vo(this,t,"gutter",function(t){var n=t.gutterMarkers||(t.gutterMarkers={});return n[e]=r,!r&&rt(n)&&(t.gutterMarkers=null),!0})}),clearGutter:jn(function(t){var e=this;this.iter(function(r){r.gutterMarkers&&r.gutterMarkers[t]&&vo(e,r,"gutter",function(){return r.gutterMarkers[t]=null,rt(r.gutterMarkers)&&(r.gutterMarkers=null),!0})})}),lineInfo:function(t){var e;if("number"==typeof t){if(!pt(this,t))return null;if(e=t,!(t=st(this,t)))return null}else if(null==(e=ht(t)))return null;return{line:e,handle:t,text:t.text,gutterMarkers:t.gutterMarkers,textClass:t.textClass,bgClass:t.bgClass,wrapClass:t.wrapClass,widgets:t.widgets}},addLineClass:jn(function(t,e,r){return vo(this,t,"gutter"==e?"gutter":"class",function(t){var n="text"==e?"textClass":"background"==e?"bgClass":"gutter"==e?"gutterClass":"wrapClass";if(t[n]){if(M(r).test(t[n]))return!1;t[n]+=" "+r}else t[n]=r;return!0})}),removeLineClass:jn(function(t,e,r){return vo(this,t,"gutter"==e?"gutter":"class",function(t){var n="text"==e?"textClass":"background"==e?"bgClass":"gutter"==e?"gutterClass":"wrapClass",i=t[n];if(!i)return!1;if(null==r)t[n]=null;else{var o=i.match(M(r));if(!o)return!1;var l=o.index+o[0].length;t[n]=i.slice(0,o.index)+(o.index&&l!=i.length?" ":"")+i.slice(l)||null}return!0})}),addLineWidget:jn(function(t,e,r){return function(t,e,r,n){var i=new yo(t,r,n),o=t.cm;return o&&i.noHScroll&&(o.display.alignWidgets=!0),vo(t,e,"widget",function(e){var r=e.widgets||(e.widgets=[]);if(null==i.insertAt?r.push(i):r.splice(Math.min(r.length-1,Math.max(0,i.insertAt)),0,i),i.line=e,o&&!qt(t,e)){var n=Yt(e)<t.scrollTop;ft(e,e.height+xr(i)),n&&Tn(o,i.height),o.curOp.forceUpdate=!0}return!0}),o&&sr(o,"lineWidgetAdded",o,i,"number"==typeof e?e:ht(e)),i}(this,t,e,r)}),removeLineWidget:function(t){t.clear()},markText:function(t,e,r){return Co(this,kt(this,t),kt(this,e),r,r&&r.type||"range")},setBookmark:function(t,e){var r={replacedWith:e&&(null==e.nodeType?e.widget:e),insertLeft:e&&e.insertLeft,clearWhenEmpty:!1,shared:e&&e.shared,handleMouseEvents:e&&e.handleMouseEvents};return Co(this,t=kt(this,t),t,r,"bookmark")},findMarksAt:function(t){t=kt(this,t);var e=[],r=st(this,t.line).markedSpans;if(r)for(var n=0;n<r.length;++n){var i=r[n];(null==i.from||i.from<=t.ch)&&(null==i.to||i.to>=t.ch)&&e.push(i.marker.parent||i.marker)}return e},findMarks:function(t,e,r){t=kt(this,t),e=kt(this,e);var n=[],i=t.line;return this.iter(t.line,e.line+1,function(o){var l=o.markedSpans;if(l)for(var a=0;a<l.length;a++){var s=l[a];null!=s.to&&i==t.line&&t.ch>=s.to||null==s.from&&i!=t.line||null!=s.from&&i==e.line&&s.from>=e.ch||r&&!r(s.marker)||n.push(s.marker.parent||s.marker)}++i}),n},getAllMarks:function(){var t=[];return this.iter(function(e){var r=e.markedSpans;if(r)for(var n=0;n<r.length;++n)null!=r[n].from&&t.push(r[n].marker)}),t},posFromIndex:function(t){var e,r=this.first,n=this.lineSeparator().length;return this.iter(function(i){var o=i.text.length+n;if(o>t)return e=t,!0;t-=o,++r}),kt(this,gt(r,e))},indexFromPos:function(t){var e=(t=kt(this,t)).ch;if(t.line<this.first||t.ch<0)return 0;var r=this.lineSeparator().length;return this.iter(this.first,t.line,function(t){e+=t.text.length+r}),e},copy:function(t){var e=new Oo(ct(this,this.first,this.first+this.size),this.modeOption,this.first,this.lineSep,this.direction);return e.scrollTop=this.scrollTop,e.scrollLeft=this.scrollLeft,e.sel=this.sel,e.extend=!1,t&&(e.history.undoDepth=this.history.undoDepth,e.setHistory(this.getHistory())),e},linkedDoc:function(t){t||(t={});var e=this.first,r=this.first+this.size;null!=t.from&&t.from>e&&(e=t.from),null!=t.to&&t.to<r&&(r=t.to);var n=new Oo(ct(this,e,r),t.mode||this.modeOption,e,this.lineSep,this.direction);return t.sharedHist&&(n.history=this.history),(this.linked||(this.linked=[])).push({doc:n,sharedHist:t.sharedHist}),n.linked=[{doc:this,isParent:!0,sharedHist:t.sharedHist}],function(t,e){for(var r=0;r<e.length;r++){var n=e[r],i=n.find(),o=t.clipPos(i.from),l=t.clipPos(i.to);if(mt(o,l)){var a=Co(t,o,l,n.primary,n.primary.type);n.markers.push(a),a.parent=n}}}(n,Mo(this)),n},unlinkDoc:function(t){if(t instanceof Ml&&(t=t.doc),this.linked)for(var e=0;e<this.linked.length;++e){var r=this.linked[e];if(r.doc==t){this.linked.splice(e,1),t.unlinkDoc(this),Lo(Mo(this));break}}if(t.history==this.history){var n=[t.id];Ai(t,function(t){return n.push(t.id)},!0),t.history=new Wi(null),t.history.done=Bi(this.history.done,n),t.history.undone=Bi(this.history.undone,n)}},iterLinkedDocs:function(t){Ai(this,t)},getMode:function(){return this.mode},getEditor:function(){return this.cm},splitLines:function(t){return this.lineSep?t.split(this.lineSep):xe(t)},lineSeparator:function(){return this.lineSep||"\n"},setDirection:jn(function(t){var e;"rtl"!=t&&(t="ltr"),t!=this.direction&&(this.direction=t,this.iter(function(t){return t.order=null}),this.cm&&Jn(e=this.cm,function(){Ei(e),Vn(e)}))})}),Oo.prototype.eachLine=Oo.prototype.iter;var No=0;function So(t){var e=this;if(Ao(e),!oe(e,t)&&!Cr(e.display,t)){ue(t),l&&(No=+new Date);var r=sn(e,t,!0),n=t.dataTransfer.files;if(r&&!e.isReadOnly())if(n&&n.length&&window.FileReader&&window.File)for(var i=n.length,o=Array(i),a=0,s=function(t,n){if(!e.options.allowDropFileTypes||-1!=P(e.options.allowDropFileTypes,t.type)){var l=new FileReader;l.onload=Zn(e,function(){var t=l.result;if(/[\x00-\x08\x0e-\x1f]{2}/.test(t)&&(t=""),o[n]=t,++a==i){var s={from:r=kt(e.doc,r),to:r,text:e.doc.splitLines(o.join(e.doc.lineSeparator())),origin:"paste"};oo(e.doc,s),Ji(e.doc,xi(r,Ci(s)))}}),l.readAsText(t)}},u=0;u<i;++u)s(n[u],u);else{if(e.state.draggingText&&e.doc.sel.contains(r)>-1)return e.state.draggingText(t),void setTimeout(function(){return e.display.input.focus()},20);try{var c=t.dataTransfer.getData("Text");if(c){var f;if(e.state.draggingText&&!e.state.draggingText.copy&&(f=e.listSelections()),Qi(e.doc,xi(r,r)),f)for(var h=0;h<f.length;++h)co(e.doc,"",f[h].anchor,f[h].head,"drag");e.replaceSelection(c,"around","paste"),e.display.input.focus()}}catch(t){}}}}function Ao(t){t.display.dragCursor&&(t.display.lineSpace.removeChild(t.display.dragCursor),t.display.dragCursor=null)}function Do(t){if(document.getElementsByClassName){for(var e=document.getElementsByClassName("CodeMirror"),r=[],n=0;n<e.length;n++){var i=e[n].CodeMirror;i&&r.push(i)}r.length&&r[0].operation(function(){for(var e=0;e<r.length;e++)t(r[e])})}}var Eo=!1;function Wo(){var t;Eo||(ee(window,"resize",function(){null==t&&(t=setTimeout(function(){t=null,Do(Ho)},100))}),ee(window,"blur",function(){return Do(bn)}),Eo=!0)}function Ho(t){var e=t.display;e.cachedCharWidth=e.cachedTextHeight=e.cachedPaddingH=null,e.scrollbarsClipped=!1,t.setSize()}for(var zo={3:"Pause",8:"Backspace",9:"Tab",13:"Enter",16:"Shift",17:"Ctrl",18:"Alt",19:"Pause",20:"CapsLock",27:"Esc",32:"Space",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"Left",38:"Up",39:"Right",40:"Down",44:"PrintScrn",45:"Insert",46:"Delete",59:";",61:"=",91:"Mod",92:"Mod",93:"Mod",106:"*",107:"=",109:"-",110:".",111:"/",127:"Delete",145:"ScrollLock",173:"-",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'",63232:"Up",63233:"Down",63234:"Left",63235:"Right",63272:"Delete",63273:"Home",63275:"End",63276:"PageUp",63277:"PageDown",63302:"Insert"},Io=0;Io<10;Io++)zo[Io+48]=zo[Io+96]=String(Io);for(var _o=65;_o<=90;_o++)zo[_o]=String.fromCharCode(_o);for(var Fo=1;Fo<=12;Fo++)zo[Fo+111]=zo[Fo+63235]="F"+Fo;var Ro={};function Po(t){var e,r,n,i,o=t.split(/-(?!$)/);t=o[o.length-1];for(var l=0;l<o.length-1;l++){var a=o[l];if(/^(cmd|meta|m)$/i.test(a))i=!0;else if(/^a(lt)?$/i.test(a))e=!0;else if(/^(c|ctrl|control)$/i.test(a))r=!0;else{if(!/^s(hift)?$/i.test(a))throw new Error("Unrecognized modifier name: "+a);n=!0}}return e&&(t="Alt-"+t),r&&(t="Ctrl-"+t),i&&(t="Cmd-"+t),n&&(t="Shift-"+t),t}function Uo(t){var e={};for(var r in t)if(t.hasOwnProperty(r)){var n=t[r];if(/^(name|fallthrough|(de|at)tach)$/.test(r))continue;if("..."==n){delete t[r];continue}for(var i=Q(r.split(" "),Po),o=0;o<i.length;o++){var l=void 0,a=void 0;o==i.length-1?(a=i.join(" "),l=n):(a=i.slice(0,o+1).join(" "),l="...");var s=e[a];if(s){if(s!=l)throw new Error("Inconsistent bindings for "+a)}else e[a]=l}delete t[r]}for(var u in e)t[u]=e[u];return t}function Bo(t,e,r,n){var i=(e=Xo(e)).call?e.call(t,n):e[t];if(!1===i)return"nothing";if("..."===i)return"multi";if(null!=i&&r(i))return"handled";if(e.fallthrough){if("[object Array]"!=Object.prototype.toString.call(e.fallthrough))return Bo(t,e.fallthrough,r,n);for(var o=0;o<e.fallthrough.length;o++){var l=Bo(t,e.fallthrough[o],r,n);if(l)return l}}}function Go(t){var e="string"==typeof t?t:zo[t.keyCode];return"Ctrl"==e||"Alt"==e||"Shift"==e||"Mod"==e}function Ko(t,e,r){var n=t;return e.altKey&&"Alt"!=n&&(t="Alt-"+t),(C?e.metaKey:e.ctrlKey)&&"Ctrl"!=n&&(t="Ctrl-"+t),(C?e.ctrlKey:e.metaKey)&&"Cmd"!=n&&(t="Cmd-"+t),!r&&e.shiftKey&&"Shift"!=n&&(t="Shift-"+t),t}function qo(t,e){if(f&&34==t.keyCode&&t.char)return!1;var r=zo[t.keyCode];return null!=r&&!t.altGraphKey&&(3==t.keyCode&&t.code&&(r=t.code),Ko(r,t,e))}function Xo(t){return"string"==typeof t?Ro[t]:t}function Yo(t,e){for(var r=t.doc.sel.ranges,n=[],i=0;i<r.length;i++){for(var o=e(r[i]);n.length&&mt(o.from,Z(n).to)<=0;){var l=n.pop();if(mt(l.from,o.from)<0){o.from=l.from;break}}n.push(o)}Jn(t,function(){for(var e=n.length-1;e>=0;e--)co(t.doc,"",n[e].from,n[e].to,"+delete");On(t)})}function Jo(t,e,r){var n=ot(t.text,e+r,r);return n<0||n>t.text.length?null:n}function Zo(t,e,r){var n=Jo(t,e.ch,r);return null==n?null:new gt(e.line,n,r<0?"after":"before")}function Qo(t,e,r,n,i){if(t){var o=$t(r,e.doc.direction);if(o){var l,a=i<0?Z(o):o[0],s=i<0==(1==a.level),u=s?"after":"before";if(a.level>0||"rtl"==e.doc.direction){var c=Er(e,r);l=i<0?r.text.length-1:0;var f=Wr(e,c,l).top;l=lt(function(t){return Wr(e,c,t).top==f},i<0==(1==a.level)?a.from:a.to-1,l),"before"==u&&(l=Jo(r,l,1))}else l=i<0?a.to:a.from;return new gt(n,l,u)}}return new gt(n,i<0?r.text.length:0,i<0?"before":"after")}Ro.basic={Left:"goCharLeft",Right:"goCharRight",Up:"goLineUp",Down:"goLineDown",End:"goLineEnd",Home:"goLineStartSmart",PageUp:"goPageUp",PageDown:"goPageDown",Delete:"delCharAfter",Backspace:"delCharBefore","Shift-Backspace":"delCharBefore",Tab:"defaultTab","Shift-Tab":"indentAuto",Enter:"newlineAndIndent",Insert:"toggleOverwrite",Esc:"singleSelection"},Ro.pcDefault={"Ctrl-A":"selectAll","Ctrl-D":"deleteLine","Ctrl-Z":"undo","Shift-Ctrl-Z":"redo","Ctrl-Y":"redo","Ctrl-Home":"goDocStart","Ctrl-End":"goDocEnd","Ctrl-Up":"goLineUp","Ctrl-Down":"goLineDown","Ctrl-Left":"goGroupLeft","Ctrl-Right":"goGroupRight","Alt-Left":"goLineStart","Alt-Right":"goLineEnd","Ctrl-Backspace":"delGroupBefore","Ctrl-Delete":"delGroupAfter","Ctrl-S":"save","Ctrl-F":"find","Ctrl-G":"findNext","Shift-Ctrl-G":"findPrev","Shift-Ctrl-F":"replace","Shift-Ctrl-R":"replaceAll","Ctrl-[":"indentLess","Ctrl-]":"indentMore","Ctrl-U":"undoSelection","Shift-Ctrl-U":"redoSelection","Alt-U":"redoSelection",fallthrough:"basic"},Ro.emacsy={"Ctrl-F":"goCharRight","Ctrl-B":"goCharLeft","Ctrl-P":"goLineUp","Ctrl-N":"goLineDown","Alt-F":"goWordRight","Alt-B":"goWordLeft","Ctrl-A":"goLineStart","Ctrl-E":"goLineEnd","Ctrl-V":"goPageDown","Shift-Ctrl-V":"goPageUp","Ctrl-D":"delCharAfter","Ctrl-H":"delCharBefore","Alt-D":"delWordAfter","Alt-Backspace":"delWordBefore","Ctrl-K":"killLine","Ctrl-T":"transposeChars","Ctrl-O":"openLine"},Ro.macDefault={"Cmd-A":"selectAll","Cmd-D":"deleteLine","Cmd-Z":"undo","Shift-Cmd-Z":"redo","Cmd-Y":"redo","Cmd-Home":"goDocStart","Cmd-Up":"goDocStart","Cmd-End":"goDocEnd","Cmd-Down":"goDocEnd","Alt-Left":"goGroupLeft","Alt-Right":"goGroupRight","Cmd-Left":"goLineLeft","Cmd-Right":"goLineRight","Alt-Backspace":"delGroupBefore","Ctrl-Alt-Backspace":"delGroupAfter","Alt-Delete":"delGroupAfter","Cmd-S":"save","Cmd-F":"find","Cmd-G":"findNext","Shift-Cmd-G":"findPrev","Cmd-Alt-F":"replace","Shift-Cmd-Alt-F":"replaceAll","Cmd-[":"indentLess","Cmd-]":"indentMore","Cmd-Backspace":"delWrappedLineLeft","Cmd-Delete":"delWrappedLineRight","Cmd-U":"undoSelection","Shift-Cmd-U":"redoSelection","Ctrl-Up":"goDocStart","Ctrl-Down":"goDocEnd",fallthrough:["basic","emacsy"]},Ro.default=y?Ro.macDefault:Ro.pcDefault;var jo={selectAll:no,singleSelection:function(t){return t.setSelection(t.getCursor("anchor"),t.getCursor("head"),G)},killLine:function(t){return Yo(t,function(e){if(e.empty()){var r=st(t.doc,e.head.line).text.length;return e.head.ch==r&&e.head.line<t.lastLine()?{from:e.head,to:gt(e.head.line+1,0)}:{from:e.head,to:gt(e.head.line,r)}}return{from:e.from(),to:e.to()}})},deleteLine:function(t){return Yo(t,function(e){return{from:gt(e.from().line,0),to:kt(t.doc,gt(e.to().line+1,0))}})},delLineLeft:function(t){return Yo(t,function(t){return{from:gt(t.from().line,0),to:t.from()}})},delWrappedLineLeft:function(t){return Yo(t,function(e){var r=t.charCoords(e.head,"div").top+5,n=t.coordsChar({left:0,top:r},"div");return{from:n,to:e.from()}})},delWrappedLineRight:function(t){return Yo(t,function(e){var r=t.charCoords(e.head,"div").top+5,n=t.coordsChar({left:t.display.lineDiv.offsetWidth+100,top:r},"div");return{from:e.from(),to:n}})},undo:function(t){return t.undo()},redo:function(t){return t.redo()},undoSelection:function(t){return t.undoSelection()},redoSelection:function(t){return t.redoSelection()},goDocStart:function(t){return t.extendSelection(gt(t.firstLine(),0))},goDocEnd:function(t){return t.extendSelection(gt(t.lastLine()))},goLineStart:function(t){return t.extendSelectionsBy(function(e){return Vo(t,e.head.line)},{origin:"+move",bias:1})},goLineStartSmart:function(t){return t.extendSelectionsBy(function(e){return $o(t,e.head)},{origin:"+move",bias:1})},goLineEnd:function(t){return t.extendSelectionsBy(function(e){return function(t,e){var r=st(t.doc,e),n=function(t){for(var e;e=Rt(t);)t=e.find(1,!0).line;return t}(r);return n!=r&&(e=ht(n)),Qo(!0,t,r,e,-1)}(t,e.head.line)},{origin:"+move",bias:-1})},goLineRight:function(t){return t.extendSelectionsBy(function(e){var r=t.cursorCoords(e.head,"div").top+5;return t.coordsChar({left:t.display.lineDiv.offsetWidth+100,top:r},"div")},q)},goLineLeft:function(t){return t.extendSelectionsBy(function(e){var r=t.cursorCoords(e.head,"div").top+5;return t.coordsChar({left:0,top:r},"div")},q)},goLineLeftSmart:function(t){return t.extendSelectionsBy(function(e){var r=t.cursorCoords(e.head,"div").top+5,n=t.coordsChar({left:0,top:r},"div");return n.ch<t.getLine(n.line).search(/\S/)?$o(t,e.head):n},q)},goLineUp:function(t){return t.moveV(-1,"line")},goLineDown:function(t){return t.moveV(1,"line")},goPageUp:function(t){return t.moveV(-1,"page")},goPageDown:function(t){return t.moveV(1,"page")},goCharLeft:function(t){return t.moveH(-1,"char")},goCharRight:function(t){return t.moveH(1,"char")},goColumnLeft:function(t){return t.moveH(-1,"column")},goColumnRight:function(t){return t.moveH(1,"column")},goWordLeft:function(t){return t.moveH(-1,"word")},goGroupRight:function(t){return t.moveH(1,"group")},goGroupLeft:function(t){return t.moveH(-1,"group")},goWordRight:function(t){return t.moveH(1,"word")},delCharBefore:function(t){return t.deleteH(-1,"char")},delCharAfter:function(t){return t.deleteH(1,"char")},delWordBefore:function(t){return t.deleteH(-1,"word")},delWordAfter:function(t){return t.deleteH(1,"word")},delGroupBefore:function(t){return t.deleteH(-1,"group")},delGroupAfter:function(t){return t.deleteH(1,"group")},indentAuto:function(t){return t.indentSelection("smart")},indentMore:function(t){return t.indentSelection("add")},indentLess:function(t){return t.indentSelection("subtract")},insertTab:function(t){return t.replaceSelection("\t")},insertSoftTab:function(t){for(var e=[],r=t.listSelections(),n=t.options.tabSize,i=0;i<r.length;i++){var o=r[i].from(),l=F(t.getLine(o.line),o.ch,n);e.push(J(n-l%n))}t.replaceSelections(e)},defaultTab:function(t){t.somethingSelected()?t.indentSelection("add"):t.execCommand("insertTab")},transposeChars:function(t){return Jn(t,function(){for(var e=t.listSelections(),r=[],n=0;n<e.length;n++)if(e[n].empty()){var i=e[n].head,o=st(t.doc,i.line).text;if(o)if(i.ch==o.length&&(i=new gt(i.line,i.ch-1)),i.ch>0)i=new gt(i.line,i.ch+1),t.replaceRange(o.charAt(i.ch-1)+o.charAt(i.ch-2),gt(i.line,i.ch-2),i,"+transpose");else if(i.line>t.doc.first){var l=st(t.doc,i.line-1).text;l&&(i=new gt(i.line,1),t.replaceRange(o.charAt(0)+t.doc.lineSeparator()+l.charAt(l.length-1),gt(i.line-1,l.length-1),i,"+transpose"))}r.push(new bi(i,i))}t.setSelections(r)})},newlineAndIndent:function(t){return Jn(t,function(){for(var e=t.listSelections(),r=e.length-1;r>=0;r--)t.replaceRange(t.doc.lineSeparator(),e[r].anchor,e[r].head,"+input");e=t.listSelections();for(var n=0;n<e.length;n++)t.indentLine(e[n].from().line,null,!0);On(t)})},openLine:function(t){return t.replaceSelection("\n","start")},toggleOverwrite:function(t){return t.toggleOverwrite()}};function Vo(t,e){var r=st(t.doc,e),n=Bt(r);return n!=r&&(e=ht(n)),Qo(!0,t,n,e,1)}function $o(t,e){var r=Vo(t,e.line),n=st(t.doc,r.line),i=$t(n,t.doc.direction);if(!i||0==i[0].level){var o=Math.max(0,n.text.search(/\S/)),l=e.line==r.line&&e.ch<=o&&e.ch;return gt(r.line,l?0:o,r.sticky)}return r}function tl(t,e,r){if("string"==typeof e&&!(e=jo[e]))return!1;t.display.input.ensurePolled();var n=t.display.shift,i=!1;try{t.isReadOnly()&&(t.state.suppressEdits=!0),r&&(t.display.shift=!1),i=e(t)!=B}finally{t.display.shift=n,t.state.suppressEdits=!1}return i}var el=new R;function rl(t,e,r,n){var i=t.state.keySeq;if(i){if(Go(e))return"handled";if(/\'$/.test(e)?t.state.keySeq=null:el.set(50,function(){t.state.keySeq==i&&(t.state.keySeq=null,t.display.input.reset())}),nl(t,i+" "+e,r,n))return!0}return nl(t,e,r,n)}function nl(t,e,r,n){var i=function(t,e,r){for(var n=0;n<t.state.keyMaps.length;n++){var i=Bo(e,t.state.keyMaps[n],r,t);if(i)return i}return t.options.extraKeys&&Bo(e,t.options.extraKeys,r,t)||Bo(e,t.options.keyMap,r,t)}(t,e,n);return"multi"==i&&(t.state.keySeq=e),"handled"==i&&sr(t,"keyHandled",t,e,r),"handled"!=i&&"multi"!=i||(ue(r),vn(t)),!!i}function il(t,e){var r=qo(e,!0);return!!r&&(e.shiftKey&&!t.state.keySeq?rl(t,"Shift-"+r,e,function(e){return tl(t,e,!0)})||rl(t,r,e,function(e){if("string"==typeof e?/^go[A-Z]/.test(e):e.motion)return tl(t,e)}):rl(t,r,e,function(e){return tl(t,e)}))}var ol=null;function ll(t){var e=this;if(e.curOp.focus=E(),!oe(e,t)){l&&a<11&&27==t.keyCode&&(t.returnValue=!1);var r=t.keyCode;e.display.shift=16==r||t.shiftKey;var n=il(e,t);f&&(ol=n?r:null,!n&&88==r&&!ke&&(y?t.metaKey:t.ctrlKey)&&e.replaceSelection("",null,"cut")),18!=r||/\bCodeMirror-crosshair\b/.test(e.display.lineDiv.className)||function(t){var e=t.display.lineDiv;function r(t){18!=t.keyCode&&t.altKey||(T(e,"CodeMirror-crosshair"),ne(document,"keyup",r),ne(document,"mouseover",r))}W(e,"CodeMirror-crosshair"),ee(document,"keyup",r),ee(document,"mouseover",r)}(e)}}function al(t){16==t.keyCode&&(this.doc.sel.shift=!1),oe(this,t)}function sl(t){var e=this;if(!(Cr(e.display,t)||oe(e,t)||t.ctrlKey&&!t.altKey||y&&t.metaKey)){var r=t.keyCode,n=t.charCode;if(f&&r==ol)return ol=null,void ue(t);if(!f||t.which&&!(t.which<10)||!il(e,t)){var i=String.fromCharCode(null==n?r:n);"\b"!=i&&(function(t,e,r){return rl(t,"'"+r+"'",e,function(e){return tl(t,e,!0)})}(e,t,i)||e.display.input.onKeyPress(t))}}}var ul,cl,fl=function(t,e,r){this.time=t,this.pos=e,this.button=r};function hl(t){var e=this,r=e.display;if(!(oe(e,t)||r.activeTouch&&r.input.supportsTouch()))if(r.input.ensurePolled(),r.shift=t.shiftKey,Cr(r,t))s||(r.scroller.draggable=!1,setTimeout(function(){return r.scroller.draggable=!0},100));else if(!vl(e,t)){var n=sn(e,t),i=pe(t),o=n?function(t,e){var r=+new Date;return cl&&cl.compare(r,t,e)?(ul=cl=null,"triple"):ul&&ul.compare(r,t,e)?(cl=new fl(r,t,e),ul=null,"double"):(ul=new fl(r,t,e),cl=null,"single")}(n,i):"single";window.focus(),1==i&&e.state.selectingText&&e.state.selectingText(t),n&&function(t,e,r,n,i){var o="Click";return"double"==n?o="Double"+o:"triple"==n&&(o="Triple"+o),rl(t,Ko(o=(1==e?"Left":2==e?"Middle":"Right")+o,i),i,function(e){if("string"==typeof e&&(e=jo[e]),!e)return!1;var n=!1;try{t.isReadOnly()&&(t.state.suppressEdits=!0),n=e(t,r)!=B}finally{t.state.suppressEdits=!1}return n})}(e,i,n,o,t)||(1==i?n?function(t,e,r,n){l?setTimeout(I(gn,t),0):t.curOp.focus=E();var i,o=function(t,e,r){var n=t.getOption("configureMouse"),i=n?n(t,e,r):{};if(null==i.unit){var o=b?r.shiftKey&&r.metaKey:r.altKey;i.unit=o?"rectangle":"single"==e?"char":"double"==e?"word":"line"}return(null==i.extend||t.doc.extend)&&(i.extend=t.doc.extend||r.shiftKey),null==i.addNew&&(i.addNew=y?r.metaKey:r.ctrlKey),null==i.moveOnDrag&&(i.moveOnDrag=!(y?r.altKey:r.ctrlKey)),i}(t,r,n),u=t.doc.sel;t.options.dragDrop&&me&&!t.isReadOnly()&&"single"==r&&(i=u.contains(e))>-1&&(mt((i=u.ranges[i]).from(),e)<0||e.xRel>0)&&(mt(i.to(),e)>0||e.xRel<0)?function(t,e,r,n){var i=t.display,o=!1,u=Zn(t,function(e){s&&(i.scroller.draggable=!1),t.state.draggingText=!1,ne(i.wrapper.ownerDocument,"mouseup",u),ne(i.wrapper.ownerDocument,"mousemove",c),ne(i.scroller,"dragstart",f),ne(i.scroller,"drop",u),o||(ue(e),n.addNew||Ki(t.doc,r,null,null,n.extend),s||l&&9==a?setTimeout(function(){i.wrapper.ownerDocument.body.focus(),i.input.focus()},20):i.input.focus())}),c=function(t){o=o||Math.abs(e.clientX-t.clientX)+Math.abs(e.clientY-t.clientY)>=10},f=function(){return o=!0};s&&(i.scroller.draggable=!0),t.state.draggingText=u,u.copy=!n.moveOnDrag,i.scroller.dragDrop&&i.scroller.dragDrop(),ee(i.wrapper.ownerDocument,"mouseup",u),ee(i.wrapper.ownerDocument,"mousemove",c),ee(i.scroller,"dragstart",f),ee(i.scroller,"drop",u),mn(t),setTimeout(function(){return i.input.focus()},20)}(t,n,e,o):function(t,e,r,n){var i=t.display,o=t.doc;ue(e);var l,a,s=o.sel,u=s.ranges;if(n.addNew&&!n.extend?(a=o.sel.contains(r),l=a>-1?u[a]:new bi(r,r)):(l=o.sel.primary(),a=o.sel.primIndex),"rectangle"==n.unit)n.addNew||(l=new bi(r,r)),r=sn(t,e,!0,!0),a=-1;else{var c=dl(t,r,n.unit);l=n.extend?Gi(l,c.anchor,c.head,n.extend):c}n.addNew?-1==a?(a=u.length,Zi(o,wi(t,u.concat([l]),a),{scroll:!1,origin:"*mouse"})):u.length>1&&u[a].empty()&&"char"==n.unit&&!n.extend?(Zi(o,wi(t,u.slice(0,a).concat(u.slice(a+1)),0),{scroll:!1,origin:"*mouse"}),s=o.sel):Xi(o,a,l,K):(a=0,Zi(o,new yi([l],0),K),s=o.sel);var f=r;function h(e){if(0!=mt(f,e))if(f=e,"rectangle"==n.unit){for(var i=[],u=t.options.tabSize,c=F(st(o,r.line).text,r.ch,u),h=F(st(o,e.line).text,e.ch,u),d=Math.min(c,h),p=Math.max(c,h),v=Math.min(r.line,e.line),g=Math.min(t.lastLine(),Math.max(r.line,e.line));v<=g;v++){var m=st(o,v).text,y=X(m,d,u);d==p?i.push(new bi(gt(v,y),gt(v,y))):m.length>y&&i.push(new bi(gt(v,y),gt(v,X(m,p,u))))}i.length||i.push(new bi(r,r)),Zi(o,wi(t,s.ranges.slice(0,a).concat(i),a),{origin:"*mouse",scroll:!1}),t.scrollIntoView(e)}else{var b,w=l,x=dl(t,e,n.unit),C=w.anchor;mt(x.anchor,C)>0?(b=x.head,C=xt(w.from(),x.anchor)):(b=x.anchor,C=wt(w.to(),x.head));var k=s.ranges.slice(0);k[a]=function(t,e){var r=e.anchor,n=e.head,i=st(t.doc,r.line);if(0==mt(r,n)&&r.sticky==n.sticky)return e;var o=$t(i);if(!o)return e;var l=jt(o,r.ch,r.sticky),a=o[l];if(a.from!=r.ch&&a.to!=r.ch)return e;var s,u=l+(a.from==r.ch==(1!=a.level)?0:1);if(0==u||u==o.length)return e;if(n.line!=r.line)s=(n.line-r.line)*("ltr"==t.doc.direction?1:-1)>0;else{var c=jt(o,n.ch,n.sticky),f=c-l||(n.ch-r.ch)*(1==a.level?-1:1);s=c==u-1||c==u?f<0:f>0}var h=o[u+(s?-1:0)],d=s==(1==h.level),p=d?h.from:h.to,v=d?"after":"before";return r.ch==p&&r.sticky==v?e:new bi(new gt(r.line,p,v),n)}(t,new bi(kt(o,C),b)),Zi(o,wi(t,k,a),K)}}var d=i.wrapper.getBoundingClientRect(),p=0;function v(e){t.state.selectingText=!1,p=1/0,ue(e),i.input.focus(),ne(i.wrapper.ownerDocument,"mousemove",g),ne(i.wrapper.ownerDocument,"mouseup",m),o.history.lastSelOrigin=null}var g=Zn(t,function(e){0!==e.buttons&&pe(e)?function e(r){var l=++p,a=sn(t,r,!0,"rectangle"==n.unit);if(a)if(0!=mt(a,f)){t.curOp.focus=E(),h(a);var s=Cn(i,o);(a.line>=s.to||a.line<s.from)&&setTimeout(Zn(t,function(){p==l&&e(r)}),150)}else{var u=r.clientY<d.top?-20:r.clientY>d.bottom?20:0;u&&setTimeout(Zn(t,function(){p==l&&(i.scroller.scrollTop+=u,e(r))}),50)}}(e):v(e)}),m=Zn(t,v);t.state.selectingText=m,ee(i.wrapper.ownerDocument,"mousemove",g),ee(i.wrapper.ownerDocument,"mouseup",m)}(t,n,e,o)}(e,n,o,t):de(t)==r.scroller&&ue(t):2==i?(n&&Ki(e.doc,n),setTimeout(function(){return r.input.focus()},20)):3==i&&(k?e.display.input.onContextMenu(t):mn(e)))}}function dl(t,e,r){if("char"==r)return new bi(e,e);if("word"==r)return t.findWordAt(e);if("line"==r)return new bi(gt(e.line,0),kt(t.doc,gt(e.line+1,0)));var n=r(t,e);return new bi(n.from,n.to)}function pl(t,e,r,n){var i,o;if(e.touches)i=e.touches[0].clientX,o=e.touches[0].clientY;else try{i=e.clientX,o=e.clientY}catch(e){return!1}if(i>=Math.floor(t.display.gutters.getBoundingClientRect().right))return!1;n&&ue(e);var l=t.display,a=l.lineDiv.getBoundingClientRect();if(o>a.bottom||!ae(t,r))return fe(e);o-=a.top-l.viewOffset;for(var s=0;s<t.options.gutters.length;++s){var u=l.gutters.childNodes[s];if(u&&u.getBoundingClientRect().right>=i){var c=dt(t.doc,o),f=t.options.gutters[s];return ie(t,r,t,c,f,e),fe(e)}}}function vl(t,e){return pl(t,e,"gutterClick",!0)}function gl(t,e){Cr(t.display,e)||function(t,e){return!!ae(t,"gutterContextMenu")&&pl(t,e,"gutterContextMenu",!1)}(t,e)||oe(t,e,"contextmenu")||k||t.display.input.onContextMenu(e)}function ml(t){t.display.wrapper.className=t.display.wrapper.className.replace(/\s*cm-s-\S+/g,"")+t.options.theme.replace(/(^|\s)\s*/g," cm-s-"),Pr(t)}fl.prototype.compare=function(t,e,r){return this.time+400>t&&0==mt(e,this.pos)&&r==this.button};var yl={toString:function(){return"CodeMirror.Init"}},bl={},wl={};function xl(t){fi(t),Vn(t),kn(t)}function Cl(t,e,r){var n=r&&r!=yl;if(!e!=!n){var i=t.display.dragFunctions,o=e?ee:ne;o(t.display.scroller,"dragstart",i.start),o(t.display.scroller,"dragenter",i.enter),o(t.display.scroller,"dragover",i.over),o(t.display.scroller,"dragleave",i.leave),o(t.display.scroller,"drop",i.drop)}}function kl(t){t.options.lineWrapping?(W(t.display.wrapper,"CodeMirror-wrap"),t.display.sizer.style.minWidth="",t.display.sizerWidth=null):(T(t.display.wrapper,"CodeMirror-wrap"),Zt(t)),an(t),Vn(t),Pr(t),setTimeout(function(){return _n(t)},100)}function Ml(t,e){var r=this;if(!(this instanceof Ml))return new Ml(t,e);this.options=e=e?_(e):{},_(bl,e,!1),hi(e);var n=e.value;"string"==typeof n?n=new Oo(n,e.mode,null,e.lineSeparator,e.direction):e.mode&&(n.modeOption=e.mode),this.doc=n;var i=new Ml.inputStyles[e.inputStyle](this),o=this.display=new at(t,n,i);for(var u in o.wrapper.CodeMirror=this,fi(this),ml(this),e.lineWrapping&&(this.display.wrapper.className+=" CodeMirror-wrap"),Pn(this),this.state={keyMaps:[],overlays:[],modeGen:0,overwrite:!1,delayingBlurEvent:!1,focused:!1,suppressEdits:!1,pasteIncoming:!1,cutIncoming:!1,selectingText:!1,draggingText:!1,highlight:new R,keySeq:null,specialChars:null},e.autofocus&&!m&&o.input.focus(),l&&a<11&&setTimeout(function(){return r.display.input.reset(!0)},20),function(t){var e=t.display;ee(e.scroller,"mousedown",Zn(t,hl)),ee(e.scroller,"dblclick",l&&a<11?Zn(t,function(e){if(!oe(t,e)){var r=sn(t,e);if(r&&!vl(t,e)&&!Cr(t.display,e)){ue(e);var n=t.findWordAt(r);Ki(t.doc,n.anchor,n.head)}}}):function(e){return oe(t,e)||ue(e)}),ee(e.scroller,"contextmenu",function(e){return gl(t,e)});var r,n={end:0};function i(){e.activeTouch&&(r=setTimeout(function(){return e.activeTouch=null},1e3),(n=e.activeTouch).end=+new Date)}function o(t,e){if(null==e.left)return!0;var r=e.left-t.left,n=e.top-t.top;return r*r+n*n>400}ee(e.scroller,"touchstart",function(i){if(!oe(t,i)&&!function(t){if(1!=t.touches.length)return!1;var e=t.touches[0];return e.radiusX<=1&&e.radiusY<=1}(i)&&!vl(t,i)){e.input.ensurePolled(),clearTimeout(r);var o=+new Date;e.activeTouch={start:o,moved:!1,prev:o-n.end<=300?n:null},1==i.touches.length&&(e.activeTouch.left=i.touches[0].pageX,e.activeTouch.top=i.touches[0].pageY)}}),ee(e.scroller,"touchmove",function(){e.activeTouch&&(e.activeTouch.moved=!0)}),ee(e.scroller,"touchend",function(r){var n=e.activeTouch;if(n&&!Cr(e,r)&&null!=n.left&&!n.moved&&new Date-n.start<300){var l,a=t.coordsChar(e.activeTouch,"page");l=!n.prev||o(n,n.prev)?new bi(a,a):!n.prev.prev||o(n,n.prev.prev)?t.findWordAt(a):new bi(gt(a.line,0),kt(t.doc,gt(a.line+1,0))),t.setSelection(l.anchor,l.head),t.focus(),ue(r)}i()}),ee(e.scroller,"touchcancel",i),ee(e.scroller,"scroll",function(){e.scroller.clientHeight&&(Dn(t,e.scroller.scrollTop),Wn(t,e.scroller.scrollLeft,!0),ie(t,"scroll",t))}),ee(e.scroller,"mousewheel",function(e){return mi(t,e)}),ee(e.scroller,"DOMMouseScroll",function(e){return mi(t,e)}),ee(e.wrapper,"scroll",function(){return e.wrapper.scrollTop=e.wrapper.scrollLeft=0}),e.dragFunctions={enter:function(e){oe(t,e)||he(e)},over:function(e){oe(t,e)||(function(t,e){var r=sn(t,e);if(r){var n=document.createDocumentFragment();hn(t,r,n),t.display.dragCursor||(t.display.dragCursor=S("div",null,"CodeMirror-cursors CodeMirror-dragcursors"),t.display.lineSpace.insertBefore(t.display.dragCursor,t.display.cursorDiv)),N(t.display.dragCursor,n)}}(t,e),he(e))},start:function(e){return function(t,e){if(l&&(!t.state.draggingText||+new Date-No<100))he(e);else if(!oe(t,e)&&!Cr(t.display,e)&&(e.dataTransfer.setData("Text",t.getSelection()),e.dataTransfer.effectAllowed="copyMove",e.dataTransfer.setDragImage&&!h)){var r=S("img",null,null,"position: fixed; left: 0; top: 0;");r.src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",f&&(r.width=r.height=1,t.display.wrapper.appendChild(r),r._top=r.offsetTop),e.dataTransfer.setDragImage(r,0,0),f&&r.parentNode.removeChild(r)}}(t,e)},drop:Zn(t,So),leave:function(e){oe(t,e)||Ao(t)}};var s=e.input.getField();ee(s,"keyup",function(e){return al.call(t,e)}),ee(s,"keydown",Zn(t,ll)),ee(s,"keypress",Zn(t,sl)),ee(s,"focus",function(e){return yn(t,e)}),ee(s,"blur",function(e){return bn(t,e)})}(this),Wo(),Bn(this),this.curOp.forceUpdate=!0,Di(this,n),e.autofocus&&!m||this.hasFocus()?setTimeout(I(yn,this),20):bn(this),wl)wl.hasOwnProperty(u)&&wl[u](r,e[u],yl);Mn(this),e.finishInit&&e.finishInit(this);for(var c=0;c<Ll.length;++c)Ll[c](r);Gn(this),s&&e.lineWrapping&&"optimizelegibility"==getComputedStyle(o.lineDiv).textRendering&&(o.lineDiv.style.textRendering="auto")}Ml.defaults=bl,Ml.optionHandlers=wl;var Ll=[];function Tl(t,e,r,n){var i,o=t.doc;null==r&&(r="add"),"smart"==r&&(o.mode.indent?i=Re(t,e).state:r="prev");var l=t.options.tabSize,a=st(o,e),s=F(a.text,null,l);a.stateAfter&&(a.stateAfter=null);var u,c=a.text.match(/^\s*/)[0];if(n||/\S/.test(a.text)){if("smart"==r&&((u=o.mode.indent(i,a.text.slice(c.length),a.text))==B||u>150)){if(!n)return;r="prev"}}else u=0,r="not";"prev"==r?u=e>o.first?F(st(o,e-1).text,null,l):0:"add"==r?u=s+t.options.indentUnit:"subtract"==r?u=s-t.options.indentUnit:"number"==typeof r&&(u=s+r),u=Math.max(0,u);var f="",h=0;if(t.options.indentWithTabs)for(var d=Math.floor(u/l);d;--d)h+=l,f+="\t";if(h<u&&(f+=J(u-h)),f!=c)return co(o,f,gt(e,0),gt(e,c.length),"+input"),a.stateAfter=null,!0;for(var p=0;p<o.sel.ranges.length;p++){var v=o.sel.ranges[p];if(v.head.line==e&&v.head.ch<c.length){var g=gt(e,c.length);Xi(o,p,new bi(g,g));break}}}Ml.defineInitHook=function(t){return Ll.push(t)};var Ol=null;function Nl(t){Ol=t}function Sl(t,e,r,n,i){var o=t.doc;t.display.shift=!1,n||(n=o.sel);var l=t.state.pasteIncoming||"paste"==i,a=xe(e),s=null;if(l&&n.ranges.length>1)if(Ol&&Ol.text.join("\n")==e){if(n.ranges.length%Ol.text.length==0){s=[];for(var u=0;u<Ol.text.length;u++)s.push(o.splitLines(Ol.text[u]))}}else a.length==n.ranges.length&&t.options.pasteLinesPerSelection&&(s=Q(a,function(t){return[t]}));for(var c=t.curOp.updateInput,f=n.ranges.length-1;f>=0;f--){var h=n.ranges[f],d=h.from(),p=h.to();h.empty()&&(r&&r>0?d=gt(d.line,d.ch-r):t.state.overwrite&&!l?p=gt(p.line,Math.min(st(o,p.line).text.length,p.ch+Z(a).length)):l&&Ol&&Ol.lineWise&&Ol.text.join("\n")==e&&(d=p=gt(d.line,0)));var v={from:d,to:p,text:s?s[f%s.length]:a,origin:i||(l?"paste":t.state.cutIncoming?"cut":"+input")};oo(t.doc,v),sr(t,"inputRead",t,v)}e&&!l&&Dl(t,e),On(t),t.curOp.updateInput<2&&(t.curOp.updateInput=c),t.curOp.typing=!0,t.state.pasteIncoming=t.state.cutIncoming=!1}function Al(t,e){var r=t.clipboardData&&t.clipboardData.getData("Text");if(r)return t.preventDefault(),e.isReadOnly()||e.options.disableInput||Jn(e,function(){return Sl(e,r,0,null,"paste")}),!0}function Dl(t,e){if(t.options.electricChars&&t.options.smartIndent)for(var r=t.doc.sel,n=r.ranges.length-1;n>=0;n--){var i=r.ranges[n];if(!(i.head.ch>100||n&&r.ranges[n-1].head.line==i.head.line)){var o=t.getModeAt(i.head),l=!1;if(o.electricChars){for(var a=0;a<o.electricChars.length;a++)if(e.indexOf(o.electricChars.charAt(a))>-1){l=Tl(t,i.head.line,"smart");break}}else o.electricInput&&o.electricInput.test(st(t.doc,i.head.line).text.slice(0,i.head.ch))&&(l=Tl(t,i.head.line,"smart"));l&&sr(t,"electricInput",t,i.head.line)}}}function El(t){for(var e=[],r=[],n=0;n<t.doc.sel.ranges.length;n++){var i=t.doc.sel.ranges[n].head.line,o={anchor:gt(i,0),head:gt(i+1,0)};r.push(o),e.push(t.getRange(o.anchor,o.head))}return{text:e,ranges:r}}function Wl(t,e){t.setAttribute("autocorrect","off"),t.setAttribute("autocapitalize","off"),t.setAttribute("spellcheck",!!e)}function Hl(){var t=S("textarea",null,null,"position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none"),e=S("div",[t],null,"overflow: hidden; position: relative; width: 3px; height: 0px;");return s?t.style.width="1000px":t.setAttribute("wrap","off"),v&&(t.style.border="1px solid black"),Wl(t),e}function zl(t,e,r,n,i){var o=e,l=r,a=st(t,e.line);function s(n){var o,l;if(null==(o=i?function(t,e,r,n){var i=$t(e,t.doc.direction);if(!i)return Zo(e,r,n);r.ch>=e.text.length?(r.ch=e.text.length,r.sticky="before"):r.ch<=0&&(r.ch=0,r.sticky="after");var o=jt(i,r.ch,r.sticky),l=i[o];if("ltr"==t.doc.direction&&l.level%2==0&&(n>0?l.to>r.ch:l.from<r.ch))return Zo(e,r,n);var a,s=function(t,r){return Jo(e,t instanceof gt?t.ch:t,r)},u=function(r){return t.options.lineWrapping?(a=a||Er(t,e),Vr(t,e,a,r)):{begin:0,end:e.text.length}},c=u("before"==r.sticky?s(r,-1):r.ch);if("rtl"==t.doc.direction||1==l.level){var f=1==l.level==n<0,h=s(r,f?1:-1);if(null!=h&&(f?h<=l.to&&h<=c.end:h>=l.from&&h>=c.begin)){var d=f?"before":"after";return new gt(r.line,h,d)}}var p=function(t,e,n){for(var o=function(t,e){return e?new gt(r.line,s(t,1),"before"):new gt(r.line,t,"after")};t>=0&&t<i.length;t+=e){var l=i[t],a=e>0==(1!=l.level),u=a?n.begin:s(n.end,-1);if(l.from<=u&&u<l.to)return o(u,a);if(u=a?l.from:s(l.to,-1),n.begin<=u&&u<n.end)return o(u,a)}},v=p(o+n,n,c);if(v)return v;var g=n>0?c.end:s(c.begin,-1);return null==g||n>0&&g==e.text.length||!(v=p(n>0?0:i.length-1,n,u(g)))?null:v}(t.cm,a,e,r):Zo(a,e,r))){if(n||((l=e.line+r)<t.first||l>=t.first+t.size||(e=new gt(l,e.ch,e.sticky),!(a=st(t,l)))))return!1;e=Qo(i,t.cm,a,e.line,r)}else e=o;return!0}if("char"==n)s();else if("column"==n)s(!0);else if("word"==n||"group"==n)for(var u=null,c="group"==n,f=t.cm&&t.cm.getHelper(e,"wordChars"),h=!0;!(r<0)||s(!h);h=!1){var d=a.text.charAt(e.ch)||"\n",p=et(d,f)?"w":c&&"\n"==d?"n":!c||/\s/.test(d)?null:"p";if(!c||h||p||(p="s"),u&&u!=p){r<0&&(r=1,s(),e.sticky="after");break}if(p&&(u=p),r>0&&!s(!h))break}var v=eo(t,e,o,l,!0);return yt(o,v)&&(v.hitSide=!0),v}function Il(t,e,r,n){var i,o,l=t.doc,a=e.left;if("page"==n){var s=Math.min(t.display.wrapper.clientHeight,window.innerHeight||document.documentElement.clientHeight),u=Math.max(s-.5*en(t.display),3);i=(r>0?e.bottom:e.top)+r*u}else"line"==n&&(i=r>0?e.bottom+3:e.top-3);for(;(o=Qr(t,a,i)).outside;){if(r<0?i<=0:i>=l.height){o.hitSide=!0;break}i+=5*r}return o}var _l=function(t){this.cm=t,this.lastAnchorNode=this.lastAnchorOffset=this.lastFocusNode=this.lastFocusOffset=null,this.polling=new R,this.composing=null,this.gracePeriod=!1,this.readDOMTimeout=null};function Fl(t,e){var r=Dr(t,e.line);if(!r||r.hidden)return null;var n=st(t.doc,e.line),i=Sr(r,n,e.line),o=$t(n,t.doc.direction),l="left";if(o){var a=jt(o,e.ch);l=a%2?"right":"left"}var s=Ir(i.map,e.ch,l);return s.offset="right"==s.collapse?s.end:s.start,s}function Rl(t,e){return e&&(t.bad=!0),t}function Pl(t,e,r){var n;if(e==t.display.lineDiv){if(!(n=t.display.lineDiv.childNodes[r]))return Rl(t.clipPos(gt(t.display.viewTo-1)),!0);e=null,r=0}else for(n=e;;n=n.parentNode){if(!n||n==t.display.lineDiv)return null;if(n.parentNode&&n.parentNode==t.display.lineDiv)break}for(var i=0;i<t.display.view.length;i++){var o=t.display.view[i];if(o.node==n)return Ul(o,e,r)}}function Ul(t,e,r){var n=t.text.firstChild,i=!1;if(!e||!D(n,e))return Rl(gt(ht(t.line),0),!0);if(e==n&&(i=!0,e=n.childNodes[r],r=0,!e)){var o=t.rest?Z(t.rest):t.line;return Rl(gt(ht(o),o.text.length),i)}var l=3==e.nodeType?e:null,a=e;for(l||1!=e.childNodes.length||3!=e.firstChild.nodeType||(l=e.firstChild,r&&(r=l.nodeValue.length));a.parentNode!=n;)a=a.parentNode;var s=t.measure,u=s.maps;function c(e,r,n){for(var i=-1;i<(u?u.length:0);i++)for(var o=i<0?s.map:u[i],l=0;l<o.length;l+=3){var a=o[l+2];if(a==e||a==r){var c=ht(i<0?t.line:t.rest[i]),f=o[l]+n;return(n<0||a!=e)&&(f=o[l+(n?1:0)]),gt(c,f)}}}var f=c(l,a,r);if(f)return Rl(f,i);for(var h=a.nextSibling,d=l?l.nodeValue.length-r:0;h;h=h.nextSibling){if(f=c(h,h.firstChild,0))return Rl(gt(f.line,f.ch-d),i);d+=h.textContent.length}for(var p=a.previousSibling,v=r;p;p=p.previousSibling){if(f=c(p,p.firstChild,-1))return Rl(gt(f.line,f.ch+v),i);v+=p.textContent.length}}_l.prototype.init=function(t){var e=this,r=this,n=r.cm,i=r.div=t.lineDiv;function o(t){if(!oe(n,t)){if(n.somethingSelected())Nl({lineWise:!1,text:n.getSelections()}),"cut"==t.type&&n.replaceSelection("",null,"cut");else{if(!n.options.lineWiseCopyCut)return;var e=El(n);Nl({lineWise:!0,text:e.text}),"cut"==t.type&&n.operation(function(){n.setSelections(e.ranges,0,G),n.replaceSelection("",null,"cut")})}if(t.clipboardData){t.clipboardData.clearData();var o=Ol.text.join("\n");if(t.clipboardData.setData("Text",o),t.clipboardData.getData("Text")==o)return void t.preventDefault()}var l=Hl(),a=l.firstChild;n.display.lineSpace.insertBefore(l,n.display.lineSpace.firstChild),a.value=Ol.text.join("\n");var s=document.activeElement;z(a),setTimeout(function(){n.display.lineSpace.removeChild(l),s.focus(),s==i&&r.showPrimarySelection()},50)}}Wl(i,n.options.spellcheck),ee(i,"paste",function(t){oe(n,t)||Al(t,n)||a<=11&&setTimeout(Zn(n,function(){return e.updateFromDOM()}),20)}),ee(i,"compositionstart",function(t){e.composing={data:t.data,done:!1}}),ee(i,"compositionupdate",function(t){e.composing||(e.composing={data:t.data,done:!1})}),ee(i,"compositionend",function(t){e.composing&&(t.data!=e.composing.data&&e.readFromDOMSoon(),e.composing.done=!0)}),ee(i,"touchstart",function(){return r.forceCompositionEnd()}),ee(i,"input",function(){e.composing||e.readFromDOMSoon()}),ee(i,"copy",o),ee(i,"cut",o)},_l.prototype.prepareSelection=function(){var t=fn(this.cm,!1);return t.focus=this.cm.state.focused,t},_l.prototype.showSelection=function(t,e){t&&this.cm.display.view.length&&((t.focus||e)&&this.showPrimarySelection(),this.showMultipleSelections(t))},_l.prototype.getSelection=function(){return this.cm.display.wrapper.ownerDocument.getSelection()},_l.prototype.showPrimarySelection=function(){var t=this.getSelection(),e=this.cm,n=e.doc.sel.primary(),i=n.from(),o=n.to();if(e.display.viewTo==e.display.viewFrom||i.line>=e.display.viewTo||o.line<e.display.viewFrom)t.removeAllRanges();else{var l=Pl(e,t.anchorNode,t.anchorOffset),a=Pl(e,t.focusNode,t.focusOffset);if(!l||l.bad||!a||a.bad||0!=mt(xt(l,a),i)||0!=mt(wt(l,a),o)){var s=e.display.view,u=i.line>=e.display.viewFrom&&Fl(e,i)||{node:s[0].measure.map[2],offset:0},c=o.line<e.display.viewTo&&Fl(e,o);if(!c){var f=s[s.length-1].measure,h=f.maps?f.maps[f.maps.length-1]:f.map;c={node:h[h.length-1],offset:h[h.length-2]-h[h.length-3]}}if(u&&c){var d,p=t.rangeCount&&t.getRangeAt(0);try{d=L(u.node,u.offset,c.offset,c.node)}catch(t){}d&&(!r&&e.state.focused?(t.collapse(u.node,u.offset),d.collapsed||(t.removeAllRanges(),t.addRange(d))):(t.removeAllRanges(),t.addRange(d)),p&&null==t.anchorNode?t.addRange(p):r&&this.startGracePeriod()),this.rememberSelection()}else t.removeAllRanges()}}},_l.prototype.startGracePeriod=function(){var t=this;clearTimeout(this.gracePeriod),this.gracePeriod=setTimeout(function(){t.gracePeriod=!1,t.selectionChanged()&&t.cm.operation(function(){return t.cm.curOp.selectionChanged=!0})},20)},_l.prototype.showMultipleSelections=function(t){N(this.cm.display.cursorDiv,t.cursors),N(this.cm.display.selectionDiv,t.selection)},_l.prototype.rememberSelection=function(){var t=this.getSelection();this.lastAnchorNode=t.anchorNode,this.lastAnchorOffset=t.anchorOffset,this.lastFocusNode=t.focusNode,this.lastFocusOffset=t.focusOffset},_l.prototype.selectionInEditor=function(){var t=this.getSelection();if(!t.rangeCount)return!1;var e=t.getRangeAt(0).commonAncestorContainer;return D(this.div,e)},_l.prototype.focus=function(){"nocursor"!=this.cm.options.readOnly&&(this.selectionInEditor()||this.showSelection(this.prepareSelection(),!0),this.div.focus())},_l.prototype.blur=function(){this.div.blur()},_l.prototype.getField=function(){return this.div},_l.prototype.supportsTouch=function(){return!0},_l.prototype.receivedFocus=function(){var t=this;this.selectionInEditor()?this.pollSelection():Jn(this.cm,function(){return t.cm.curOp.selectionChanged=!0}),this.polling.set(this.cm.options.pollInterval,function e(){t.cm.state.focused&&(t.pollSelection(),t.polling.set(t.cm.options.pollInterval,e))})},_l.prototype.selectionChanged=function(){var t=this.getSelection();return t.anchorNode!=this.lastAnchorNode||t.anchorOffset!=this.lastAnchorOffset||t.focusNode!=this.lastFocusNode||t.focusOffset!=this.lastFocusOffset},_l.prototype.pollSelection=function(){if(null==this.readDOMTimeout&&!this.gracePeriod&&this.selectionChanged()){var t=this.getSelection(),e=this.cm;if(g&&c&&this.cm.options.gutters.length&&function(t){for(var e=t;e;e=e.parentNode)if(/CodeMirror-gutter-wrapper/.test(e.className))return!0;return!1}(t.anchorNode))return this.cm.triggerOnKeyDown({type:"keydown",keyCode:8,preventDefault:Math.abs}),this.blur(),void this.focus();if(!this.composing){this.rememberSelection();var r=Pl(e,t.anchorNode,t.anchorOffset),n=Pl(e,t.focusNode,t.focusOffset);r&&n&&Jn(e,function(){Zi(e.doc,xi(r,n),G),(r.bad||n.bad)&&(e.curOp.selectionChanged=!0)})}}},_l.prototype.pollContent=function(){null!=this.readDOMTimeout&&(clearTimeout(this.readDOMTimeout),this.readDOMTimeout=null);var t,e,r,n=this.cm,i=n.display,o=n.doc.sel.primary(),l=o.from(),a=o.to();if(0==l.ch&&l.line>n.firstLine()&&(l=gt(l.line-1,st(n.doc,l.line-1).length)),a.ch==st(n.doc,a.line).text.length&&a.line<n.lastLine()&&(a=gt(a.line+1,0)),l.line<i.viewFrom||a.line>i.viewTo-1)return!1;l.line==i.viewFrom||0==(t=un(n,l.line))?(e=ht(i.view[0].line),r=i.view[0].node):(e=ht(i.view[t].line),r=i.view[t-1].node.nextSibling);var s,u,c=un(n,a.line);if(c==i.view.length-1?(s=i.viewTo-1,u=i.lineDiv.lastChild):(s=ht(i.view[c+1].line)-1,u=i.view[c+1].node.previousSibling),!r)return!1;for(var f=n.doc.splitLines(function(t,e,r,n,i){var o="",l=!1,a=t.doc.lineSeparator(),s=!1;function u(){l&&(o+=a,s&&(o+=a),l=s=!1)}function c(t){t&&(u(),o+=t)}function f(e){if(1==e.nodeType){var r=e.getAttribute("cm-text");if(r)return void c(r);var o,h=e.getAttribute("cm-marker");if(h){var d=t.findMarks(gt(n,0),gt(i+1,0),(g=+h,function(t){return t.id==g}));return void(d.length&&(o=d[0].find(0))&&c(ut(t.doc,o.from,o.to).join(a)))}if("false"==e.getAttribute("contenteditable"))return;var p=/^(pre|div|p|li|table|br)$/i.test(e.nodeName);if(!/^br$/i.test(e.nodeName)&&0==e.textContent.length)return;p&&u();for(var v=0;v<e.childNodes.length;v++)f(e.childNodes[v]);/^(pre|p)$/i.test(e.nodeName)&&(s=!0),p&&(l=!0)}else 3==e.nodeType&&c(e.nodeValue.replace(/\u200b/g,"").replace(/\u00a0/g," "));var g}for(;f(e),e!=r;)e=e.nextSibling,s=!1;return o}(n,r,u,e,s)),h=ut(n.doc,gt(e,0),gt(s,st(n.doc,s).text.length));f.length>1&&h.length>1;)if(Z(f)==Z(h))f.pop(),h.pop(),s--;else{if(f[0]!=h[0])break;f.shift(),h.shift(),e++}for(var d=0,p=0,v=f[0],g=h[0],m=Math.min(v.length,g.length);d<m&&v.charCodeAt(d)==g.charCodeAt(d);)++d;for(var y=Z(f),b=Z(h),w=Math.min(y.length-(1==f.length?d:0),b.length-(1==h.length?d:0));p<w&&y.charCodeAt(y.length-p-1)==b.charCodeAt(b.length-p-1);)++p;if(1==f.length&&1==h.length&&e==l.line)for(;d&&d>l.ch&&y.charCodeAt(y.length-p-1)==b.charCodeAt(b.length-p-1);)d--,p++;f[f.length-1]=y.slice(0,y.length-p).replace(/^\u200b+/,""),f[0]=f[0].slice(d).replace(/\u200b+$/,"");var x=gt(e,d),C=gt(s,h.length?Z(h).length-p:0);return f.length>1||f[0]||mt(x,C)?(co(n.doc,f,x,C,"+input"),!0):void 0},_l.prototype.ensurePolled=function(){this.forceCompositionEnd()},_l.prototype.reset=function(){this.forceCompositionEnd()},_l.prototype.forceCompositionEnd=function(){this.composing&&(clearTimeout(this.readDOMTimeout),this.composing=null,this.updateFromDOM(),this.div.blur(),this.div.focus())},_l.prototype.readFromDOMSoon=function(){var t=this;null==this.readDOMTimeout&&(this.readDOMTimeout=setTimeout(function(){if(t.readDOMTimeout=null,t.composing){if(!t.composing.done)return;t.composing=null}t.updateFromDOM()},80))},_l.prototype.updateFromDOM=function(){var t=this;!this.cm.isReadOnly()&&this.pollContent()||Jn(this.cm,function(){return Vn(t.cm)})},_l.prototype.setUneditable=function(t){t.contentEditable="false"},_l.prototype.onKeyPress=function(t){0==t.charCode||this.composing||(t.preventDefault(),this.cm.isReadOnly()||Zn(this.cm,Sl)(this.cm,String.fromCharCode(null==t.charCode?t.keyCode:t.charCode),0))},_l.prototype.readOnlyChanged=function(t){this.div.contentEditable=String("nocursor"!=t)},_l.prototype.onContextMenu=function(){},_l.prototype.resetPosition=function(){},_l.prototype.needsContentAttribute=!0;var Bl=function(t){this.cm=t,this.prevInput="",this.pollingFast=!1,this.polling=new R,this.hasSelection=!1,this.composing=null};Bl.prototype.init=function(t){var e=this,r=this,n=this.cm;this.createField(t);var i=this.textarea;function o(t){if(!oe(n,t)){if(n.somethingSelected())Nl({lineWise:!1,text:n.getSelections()});else{if(!n.options.lineWiseCopyCut)return;var e=El(n);Nl({lineWise:!0,text:e.text}),"cut"==t.type?n.setSelections(e.ranges,null,G):(r.prevInput="",i.value=e.text.join("\n"),z(i))}"cut"==t.type&&(n.state.cutIncoming=!0)}}t.wrapper.insertBefore(this.wrapper,t.wrapper.firstChild),v&&(i.style.width="0px"),ee(i,"input",function(){l&&a>=9&&e.hasSelection&&(e.hasSelection=null),r.poll()}),ee(i,"paste",function(t){oe(n,t)||Al(t,n)||(n.state.pasteIncoming=!0,r.fastPoll())}),ee(i,"cut",o),ee(i,"copy",o),ee(t.scroller,"paste",function(e){Cr(t,e)||oe(n,e)||(n.state.pasteIncoming=!0,r.focus())}),ee(t.lineSpace,"selectstart",function(e){Cr(t,e)||ue(e)}),ee(i,"compositionstart",function(){var t=n.getCursor("from");r.composing&&r.composing.range.clear(),r.composing={start:t,range:n.markText(t,n.getCursor("to"),{className:"CodeMirror-composing"})}}),ee(i,"compositionend",function(){r.composing&&(r.poll(),r.composing.range.clear(),r.composing=null)})},Bl.prototype.createField=function(t){this.wrapper=Hl(),this.textarea=this.wrapper.firstChild},Bl.prototype.prepareSelection=function(){var t=this.cm,e=t.display,r=t.doc,n=fn(t);if(t.options.moveInputWithCursor){var i=Yr(t,r.sel.primary().head,"div"),o=e.wrapper.getBoundingClientRect(),l=e.lineDiv.getBoundingClientRect();n.teTop=Math.max(0,Math.min(e.wrapper.clientHeight-10,i.top+l.top-o.top)),n.teLeft=Math.max(0,Math.min(e.wrapper.clientWidth-10,i.left+l.left-o.left))}return n},Bl.prototype.showSelection=function(t){var e=this.cm,r=e.display;N(r.cursorDiv,t.cursors),N(r.selectionDiv,t.selection),null!=t.teTop&&(this.wrapper.style.top=t.teTop+"px",this.wrapper.style.left=t.teLeft+"px")},Bl.prototype.reset=function(t){if(!this.contextMenuPending&&!this.composing){var e=this.cm;if(e.somethingSelected()){this.prevInput="";var r=e.getSelection();this.textarea.value=r,e.state.focused&&z(this.textarea),l&&a>=9&&(this.hasSelection=r)}else t||(this.prevInput=this.textarea.value="",l&&a>=9&&(this.hasSelection=null))}},Bl.prototype.getField=function(){return this.textarea},Bl.prototype.supportsTouch=function(){return!1},Bl.prototype.focus=function(){if("nocursor"!=this.cm.options.readOnly&&(!m||E()!=this.textarea))try{this.textarea.focus()}catch(t){}},Bl.prototype.blur=function(){this.textarea.blur()},Bl.prototype.resetPosition=function(){this.wrapper.style.top=this.wrapper.style.left=0},Bl.prototype.receivedFocus=function(){this.slowPoll()},Bl.prototype.slowPoll=function(){var t=this;this.pollingFast||this.polling.set(this.cm.options.pollInterval,function(){t.poll(),t.cm.state.focused&&t.slowPoll()})},Bl.prototype.fastPoll=function(){var t=!1,e=this;e.pollingFast=!0,e.polling.set(20,function r(){var n=e.poll();n||t?(e.pollingFast=!1,e.slowPoll()):(t=!0,e.polling.set(60,r))})},Bl.prototype.poll=function(){var t=this,e=this.cm,r=this.textarea,n=this.prevInput;if(this.contextMenuPending||!e.state.focused||Ce(r)&&!n&&!this.composing||e.isReadOnly()||e.options.disableInput||e.state.keySeq)return!1;var i=r.value;if(i==n&&!e.somethingSelected())return!1;if(l&&a>=9&&this.hasSelection===i||y&&/[\uf700-\uf7ff]/.test(i))return e.display.input.reset(),!1;if(e.doc.sel==e.display.selForContextMenu){var o=i.charCodeAt(0);if(8203!=o||n||(n="​"),8666==o)return this.reset(),this.cm.execCommand("undo")}for(var s=0,u=Math.min(n.length,i.length);s<u&&n.charCodeAt(s)==i.charCodeAt(s);)++s;return Jn(e,function(){Sl(e,i.slice(s),n.length-s,null,t.composing?"*compose":null),i.length>1e3||i.indexOf("\n")>-1?r.value=t.prevInput="":t.prevInput=i,t.composing&&(t.composing.range.clear(),t.composing.range=e.markText(t.composing.start,e.getCursor("to"),{className:"CodeMirror-composing"}))}),!0},Bl.prototype.ensurePolled=function(){this.pollingFast&&this.poll()&&(this.pollingFast=!1)},Bl.prototype.onKeyPress=function(){l&&a>=9&&(this.hasSelection=null),this.fastPoll()},Bl.prototype.onContextMenu=function(t){var e=this,r=e.cm,n=r.display,i=e.textarea;e.contextMenuPending&&e.contextMenuPending();var o=sn(r,t),u=n.scroller.scrollTop;if(o&&!f){var c=r.options.resetSelectionOnContextMenu;c&&-1==r.doc.sel.contains(o)&&Zn(r,Zi)(r.doc,xi(o),G);var h,d=i.style.cssText,p=e.wrapper.style.cssText,v=e.wrapper.offsetParent.getBoundingClientRect();if(e.wrapper.style.cssText="position: static",i.style.cssText="position: absolute; width: 30px; height: 30px;\n      top: "+(t.clientY-v.top-5)+"px; left: "+(t.clientX-v.left-5)+"px;\n      z-index: 1000; background: "+(l?"rgba(255, 255, 255, .05)":"transparent")+";\n      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);",s&&(h=window.scrollY),n.input.focus(),s&&window.scrollTo(null,h),n.input.reset(),r.somethingSelected()||(i.value=e.prevInput=" "),e.contextMenuPending=y,n.selForContextMenu=r.doc.sel,clearTimeout(n.detectingSelectAll),l&&a>=9&&m(),k){he(t);var g=function(){ne(window,"mouseup",g),setTimeout(y,20)};ee(window,"mouseup",g)}else setTimeout(y,50)}function m(){if(null!=i.selectionStart){var t=r.somethingSelected(),o="​"+(t?i.value:"");i.value="⇚",i.value=o,e.prevInput=t?"":"​",i.selectionStart=1,i.selectionEnd=o.length,n.selForContextMenu=r.doc.sel}}function y(){if(e.contextMenuPending==y&&(e.contextMenuPending=!1,e.wrapper.style.cssText=p,i.style.cssText=d,l&&a<9&&n.scrollbars.setScrollTop(n.scroller.scrollTop=u),null!=i.selectionStart)){(!l||l&&a<9)&&m();var t=0,o=function(){n.selForContextMenu==r.doc.sel&&0==i.selectionStart&&i.selectionEnd>0&&"​"==e.prevInput?Zn(r,no)(r):t++<10?n.detectingSelectAll=setTimeout(o,500):(n.selForContextMenu=null,n.input.reset())};n.detectingSelectAll=setTimeout(o,200)}}},Bl.prototype.readOnlyChanged=function(t){t||this.reset(),this.textarea.disabled="nocursor"==t},Bl.prototype.setUneditable=function(){},Bl.prototype.needsContentAttribute=!1,function(t){var e=t.optionHandlers;function r(r,n,i,o){t.defaults[r]=n,i&&(e[r]=o?function(t,e,r){r!=yl&&i(t,e,r)}:i)}t.defineOption=r,t.Init=yl,r("value","",function(t,e){return t.setValue(e)},!0),r("mode",null,function(t,e){t.doc.modeOption=e,Ti(t)},!0),r("indentUnit",2,Ti,!0),r("indentWithTabs",!1),r("smartIndent",!0),r("tabSize",4,function(t){Oi(t),Pr(t),Vn(t)},!0),r("lineSeparator",null,function(t,e){if(t.doc.lineSep=e,e){var r=[],n=t.doc.first;t.doc.iter(function(t){for(var i=0;;){var o=t.text.indexOf(e,i);if(-1==o)break;i=o+e.length,r.push(gt(n,o))}n++});for(var i=r.length-1;i>=0;i--)co(t.doc,e,r[i],gt(r[i].line,r[i].ch+e.length))}}),r("specialChars",/[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff]/g,function(t,e,r){t.state.specialChars=new RegExp(e.source+(e.test("\t")?"":"|\t"),"g"),r!=yl&&t.refresh()}),r("specialCharPlaceholder",$e,function(t){return t.refresh()},!0),r("electricChars",!0),r("inputStyle",m?"contenteditable":"textarea",function(){throw new Error("inputStyle can not (yet) be changed in a running editor")},!0),r("spellcheck",!1,function(t,e){return t.getInputField().spellcheck=e},!0),r("rtlMoveVisually",!w),r("wholeLineUpdateBefore",!0),r("theme","default",function(t){ml(t),xl(t)},!0),r("keyMap","default",function(t,e,r){var n=Xo(e),i=r!=yl&&Xo(r);i&&i.detach&&i.detach(t,n),n.attach&&n.attach(t,i||null)}),r("extraKeys",null),r("configureMouse",null),r("lineWrapping",!1,kl,!0),r("gutters",[],function(t){hi(t.options),xl(t)},!0),r("fixedGutter",!0,function(t,e){t.display.gutters.style.left=e?on(t.display)+"px":"0",t.refresh()},!0),r("coverGutterNextToScrollbar",!1,function(t){return _n(t)},!0),r("scrollbarStyle","native",function(t){Pn(t),_n(t),t.display.scrollbars.setScrollTop(t.doc.scrollTop),t.display.scrollbars.setScrollLeft(t.doc.scrollLeft)},!0),r("lineNumbers",!1,function(t){hi(t.options),xl(t)},!0),r("firstLineNumber",1,xl,!0),r("lineNumberFormatter",function(t){return t},xl,!0),r("showCursorWhenSelecting",!1,cn,!0),r("resetSelectionOnContextMenu",!0),r("lineWiseCopyCut",!0),r("pasteLinesPerSelection",!0),r("selectionsMayTouch",!1),r("readOnly",!1,function(t,e){"nocursor"==e&&(bn(t),t.display.input.blur()),t.display.input.readOnlyChanged(e)}),r("disableInput",!1,function(t,e){e||t.display.input.reset()},!0),r("dragDrop",!0,Cl),r("allowDropFileTypes",null),r("cursorBlinkRate",530),r("cursorScrollMargin",0),r("cursorHeight",1,cn,!0),r("singleCursorHeightPerLine",!0,cn,!0),r("workTime",100),r("workDelay",100),r("flattenSpans",!0,Oi,!0),r("addModeClass",!1,Oi,!0),r("pollInterval",100),r("undoDepth",200,function(t,e){return t.doc.history.undoDepth=e}),r("historyEventDelay",1250),r("viewportMargin",10,function(t){return t.refresh()},!0),r("maxHighlightLength",1e4,Oi,!0),r("moveInputWithCursor",!0,function(t,e){e||t.display.input.resetPosition()}),r("tabindex",null,function(t,e){return t.display.input.getField().tabIndex=e||""}),r("autofocus",null),r("direction","ltr",function(t,e){return t.doc.setDirection(e)},!0),r("phrases",null)}(Ml),function(t){var e=t.optionHandlers,r=t.helpers={};t.prototype={constructor:t,focus:function(){window.focus(),this.display.input.focus()},setOption:function(t,r){var n=this.options,i=n[t];n[t]==r&&"mode"!=t||(n[t]=r,e.hasOwnProperty(t)&&Zn(this,e[t])(this,r,i),ie(this,"optionChange",this,t))},getOption:function(t){return this.options[t]},getDoc:function(){return this.doc},addKeyMap:function(t,e){this.state.keyMaps[e?"push":"unshift"](Xo(t))},removeKeyMap:function(t){for(var e=this.state.keyMaps,r=0;r<e.length;++r)if(e[r]==t||e[r].name==t)return e.splice(r,1),!0},addOverlay:Qn(function(e,r){var n=e.token?e:t.getMode(this.options,e);if(n.startState)throw new Error("Overlays may not be stateful.");!function(t,e,r){for(var n=0,i=r(e);n<t.length&&r(t[n])<=i;)n++;t.splice(n,0,e)}(this.state.overlays,{mode:n,modeSpec:e,opaque:r&&r.opaque,priority:r&&r.priority||0},function(t){return t.priority}),this.state.modeGen++,Vn(this)}),removeOverlay:Qn(function(t){for(var e=this.state.overlays,r=0;r<e.length;++r){var n=e[r].modeSpec;if(n==t||"string"==typeof t&&n.name==t)return e.splice(r,1),this.state.modeGen++,void Vn(this)}}),indentLine:Qn(function(t,e,r){"string"!=typeof e&&"number"!=typeof e&&(e=null==e?this.options.smartIndent?"smart":"prev":e?"add":"subtract"),pt(this.doc,t)&&Tl(this,t,e,r)}),indentSelection:Qn(function(t){for(var e=this.doc.sel.ranges,r=-1,n=0;n<e.length;n++){var i=e[n];if(i.empty())i.head.line>r&&(Tl(this,i.head.line,t,!0),r=i.head.line,n==this.doc.sel.primIndex&&On(this));else{var o=i.from(),l=i.to(),a=Math.max(r,o.line);r=Math.min(this.lastLine(),l.line-(l.ch?0:1))+1;for(var s=a;s<r;++s)Tl(this,s,t);var u=this.doc.sel.ranges;0==o.ch&&e.length==u.length&&u[n].from().ch>0&&Xi(this.doc,n,new bi(o,u[n].to()),G)}}}),getTokenAt:function(t,e){return Ke(this,t,e)},getLineTokens:function(t,e){return Ke(this,gt(t),e,!0)},getTokenTypeAt:function(t){t=kt(this.doc,t);var e,r=Fe(this,st(this.doc,t.line)),n=0,i=(r.length-1)/2,o=t.ch;if(0==o)e=r[2];else for(;;){var l=n+i>>1;if((l?r[2*l-1]:0)>=o)i=l;else{if(!(r[2*l+1]<o)){e=r[2*l+2];break}n=l+1}}var a=e?e.indexOf("overlay "):-1;return a<0?e:0==a?null:e.slice(0,a-1)},getModeAt:function(e){var r=this.doc.mode;return r.innerMode?t.innerMode(r,this.getTokenAt(e).state).mode:r},getHelper:function(t,e){return this.getHelpers(t,e)[0]},getHelpers:function(t,e){var n=[];if(!r.hasOwnProperty(e))return n;var i=r[e],o=this.getModeAt(t);if("string"==typeof o[e])i[o[e]]&&n.push(i[o[e]]);else if(o[e])for(var l=0;l<o[e].length;l++){var a=i[o[e][l]];a&&n.push(a)}else o.helperType&&i[o.helperType]?n.push(i[o.helperType]):i[o.name]&&n.push(i[o.name]);for(var s=0;s<i._global.length;s++){var u=i._global[s];u.pred(o,this)&&-1==P(n,u.val)&&n.push(u.val)}return n},getStateAfter:function(t,e){var r=this.doc;return Re(this,(t=Ct(r,null==t?r.first+r.size-1:t))+1,e).state},cursorCoords:function(t,e){var r=this.doc.sel.primary();return Yr(this,null==t?r.head:"object"==typeof t?kt(this.doc,t):t?r.from():r.to(),e||"page")},charCoords:function(t,e){return Xr(this,kt(this.doc,t),e||"page")},coordsChar:function(t,e){return Qr(this,(t=qr(this,t,e||"page")).left,t.top)},lineAtHeight:function(t,e){return t=qr(this,{top:t,left:0},e||"page").top,dt(this.doc,t+this.display.viewOffset)},heightAtLine:function(t,e,r){var n,i=!1;if("number"==typeof t){var o=this.doc.first+this.doc.size-1;t<this.doc.first?t=this.doc.first:t>o&&(t=o,i=!0),n=st(this.doc,t)}else n=t;return Kr(this,n,{top:0,left:0},e||"page",r||i).top+(i?this.doc.height-Yt(n):0)},defaultTextHeight:function(){return en(this.display)},defaultCharWidth:function(){return rn(this.display)},getViewport:function(){return{from:this.display.viewFrom,to:this.display.viewTo}},addWidget:function(t,e,r,n,i){var o,l,a,s=this.display,u=(t=Yr(this,kt(this.doc,t))).bottom,c=t.left;if(e.style.position="absolute",e.setAttribute("cm-ignore-events","true"),this.display.input.setUneditable(e),s.sizer.appendChild(e),"over"==n)u=t.top;else if("above"==n||"near"==n){var f=Math.max(s.wrapper.clientHeight,this.doc.height),h=Math.max(s.sizer.clientWidth,s.lineSpace.clientWidth);("above"==n||t.bottom+e.offsetHeight>f)&&t.top>e.offsetHeight?u=t.top-e.offsetHeight:t.bottom+e.offsetHeight<=f&&(u=t.bottom),c+e.offsetWidth>h&&(c=h-e.offsetWidth)}e.style.top=u+"px",e.style.left=e.style.right="","right"==i?(c=s.sizer.clientWidth-e.offsetWidth,e.style.right="0px"):("left"==i?c=0:"middle"==i&&(c=(s.sizer.clientWidth-e.offsetWidth)/2),e.style.left=c+"px"),r&&(o=this,l={left:c,top:u,right:c+e.offsetWidth,bottom:u+e.offsetHeight},null!=(a=Ln(o,l)).scrollTop&&Dn(o,a.scrollTop),null!=a.scrollLeft&&Wn(o,a.scrollLeft))},triggerOnKeyDown:Qn(ll),triggerOnKeyPress:Qn(sl),triggerOnKeyUp:al,triggerOnMouseDown:Qn(hl),execCommand:function(t){if(jo.hasOwnProperty(t))return jo[t].call(null,this)},triggerElectric:Qn(function(t){Dl(this,t)}),findPosH:function(t,e,r,n){var i=1;e<0&&(i=-1,e=-e);for(var o=kt(this.doc,t),l=0;l<e&&!(o=zl(this.doc,o,i,r,n)).hitSide;++l);return o},moveH:Qn(function(t,e){var r=this;this.extendSelectionsBy(function(n){return r.display.shift||r.doc.extend||n.empty()?zl(r.doc,n.head,t,e,r.options.rtlMoveVisually):t<0?n.from():n.to()},q)}),deleteH:Qn(function(t,e){var r=this.doc.sel,n=this.doc;r.somethingSelected()?n.replaceSelection("",null,"+delete"):Yo(this,function(r){var i=zl(n,r.head,t,e,!1);return t<0?{from:i,to:r.head}:{from:r.head,to:i}})}),findPosV:function(t,e,r,n){var i=1,o=n;e<0&&(i=-1,e=-e);for(var l=kt(this.doc,t),a=0;a<e;++a){var s=Yr(this,l,"div");if(null==o?o=s.left:s.left=o,(l=Il(this,s,i,r)).hitSide)break}return l},moveV:Qn(function(t,e){var r=this,n=this.doc,i=[],o=!this.display.shift&&!n.extend&&n.sel.somethingSelected();if(n.extendSelectionsBy(function(l){if(o)return t<0?l.from():l.to();var a=Yr(r,l.head,"div");null!=l.goalColumn&&(a.left=l.goalColumn),i.push(a.left);var s=Il(r,a,t,e);return"page"==e&&l==n.sel.primary()&&Tn(r,Xr(r,s,"div").top-a.top),s},q),i.length)for(var l=0;l<n.sel.ranges.length;l++)n.sel.ranges[l].goalColumn=i[l]}),findWordAt:function(t){var e=this.doc,r=st(e,t.line).text,n=t.ch,i=t.ch;if(r){var o=this.getHelper(t,"wordChars");"before"!=t.sticky&&i!=r.length||!n?++i:--n;for(var l=r.charAt(n),a=et(l,o)?function(t){return et(t,o)}:/\s/.test(l)?function(t){return/\s/.test(t)}:function(t){return!/\s/.test(t)&&!et(t)};n>0&&a(r.charAt(n-1));)--n;for(;i<r.length&&a(r.charAt(i));)++i}return new bi(gt(t.line,n),gt(t.line,i))},toggleOverwrite:function(t){null!=t&&t==this.state.overwrite||((this.state.overwrite=!this.state.overwrite)?W(this.display.cursorDiv,"CodeMirror-overwrite"):T(this.display.cursorDiv,"CodeMirror-overwrite"),ie(this,"overwriteToggle",this,this.state.overwrite))},hasFocus:function(){return this.display.input.getField()==E()},isReadOnly:function(){return!(!this.options.readOnly&&!this.doc.cantEdit)},scrollTo:Qn(function(t,e){Nn(this,t,e)}),getScrollInfo:function(){var t=this.display.scroller;return{left:t.scrollLeft,top:t.scrollTop,height:t.scrollHeight-Tr(this)-this.display.barHeight,width:t.scrollWidth-Tr(this)-this.display.barWidth,clientHeight:Nr(this),clientWidth:Or(this)}},scrollIntoView:Qn(function(t,e){null==t?(t={from:this.doc.sel.primary().head,to:null},null==e&&(e=this.options.cursorScrollMargin)):"number"==typeof t?t={from:gt(t,0),to:null}:null==t.from&&(t={from:t,to:null}),t.to||(t.to=t.from),t.margin=e||0,null!=t.from.line?function(t,e){Sn(t),t.curOp.scrollToPos=e}(this,t):An(this,t.from,t.to,t.margin)}),setSize:Qn(function(t,e){var r=this,n=function(t){return"number"==typeof t||/^\d+$/.test(String(t))?t+"px":t};null!=t&&(this.display.wrapper.style.width=n(t)),null!=e&&(this.display.wrapper.style.height=n(e)),this.options.lineWrapping&&Rr(this);var i=this.display.viewFrom;this.doc.iter(i,this.display.viewTo,function(t){if(t.widgets)for(var e=0;e<t.widgets.length;e++)if(t.widgets[e].noHScroll){$n(r,i,"widget");break}++i}),this.curOp.forceUpdate=!0,ie(this,"refresh",this)}),operation:function(t){return Jn(this,t)},startOperation:function(){return Bn(this)},endOperation:function(){return Gn(this)},refresh:Qn(function(){var t=this.display.cachedTextHeight;Vn(this),this.curOp.forceUpdate=!0,Pr(this),Nn(this,this.doc.scrollLeft,this.doc.scrollTop),ui(this),(null==t||Math.abs(t-en(this.display))>.5)&&an(this),ie(this,"refresh",this)}),swapDoc:Qn(function(t){var e=this.doc;return e.cm=null,Di(this,t),Pr(this),this.display.input.reset(),Nn(this,t.scrollLeft,t.scrollTop),this.curOp.forceScroll=!0,sr(this,"swapDoc",this,e),e}),phrase:function(t){var e=this.options.phrases;return e&&Object.prototype.hasOwnProperty.call(e,t)?e[t]:t},getInputField:function(){return this.display.input.getField()},getWrapperElement:function(){return this.display.wrapper},getScrollerElement:function(){return this.display.scroller},getGutterElement:function(){return this.display.gutters}},se(t),t.registerHelper=function(e,n,i){r.hasOwnProperty(e)||(r[e]=t[e]={_global:[]}),r[e][n]=i},t.registerGlobalHelper=function(e,n,i,o){t.registerHelper(e,n,o),r[e]._global.push({pred:i,val:o})}}(Ml);var Gl="iter insert remove copy getEditor constructor".split(" ");for(var Kl in Oo.prototype)Oo.prototype.hasOwnProperty(Kl)&&P(Gl,Kl)<0&&(Ml.prototype[Kl]=function(t){return function(){return t.apply(this.doc,arguments)}}(Oo.prototype[Kl]));return se(Oo),Ml.inputStyles={textarea:Bl,contenteditable:_l},Ml.defineMode=function(t){Ml.defaults.mode||"null"==t||(Ml.defaults.mode=t),function(t,e){arguments.length>2&&(e.dependencies=Array.prototype.slice.call(arguments,2)),Le[t]=e}.apply(this,arguments)},Ml.defineMIME=function(t,e){Te[t]=e},Ml.defineMode("null",function(){return{token:function(t){return t.skipToEnd()}}}),Ml.defineMIME("text/plain","null"),Ml.defineExtension=function(t,e){Ml.prototype[t]=e},Ml.defineDocExtension=function(t,e){Oo.prototype[t]=e},Ml.fromTextArea=function(t,e){if((e=e?_(e):{}).value=t.value,!e.tabindex&&t.tabIndex&&(e.tabindex=t.tabIndex),!e.placeholder&&t.placeholder&&(e.placeholder=t.placeholder),null==e.autofocus){var r=E();e.autofocus=r==t||null!=t.getAttribute("autofocus")&&r==document.body}function n(){t.value=a.getValue()}var i;if(t.form&&(ee(t.form,"submit",n),!e.leaveSubmitMethodAlone)){var o=t.form;i=o.submit;try{var l=o.submit=function(){n(),o.submit=i,o.submit(),o.submit=l}}catch(t){}}e.finishInit=function(e){e.save=n,e.getTextArea=function(){return t},e.toTextArea=function(){e.toTextArea=isNaN,n(),t.parentNode.removeChild(e.getWrapperElement()),t.style.display="",t.form&&(ne(t.form,"submit",n),"function"==typeof t.form.submit&&(t.form.submit=i))}},t.style.display="none";var a=Ml(function(e){return t.parentNode.insertBefore(e,t.nextSibling)},e);return a},function(t){t.off=ne,t.on=ee,t.wheelEventPixels=gi,t.Doc=Oo,t.splitLines=xe,t.countColumn=F,t.findColumn=X,t.isWordChar=tt,t.Pass=B,t.signal=ie,t.Line=Ye,t.changeEnd=Ci,t.scrollbarModel=Rn,t.Pos=gt,t.cmpPos=mt,t.modes=Le,t.mimeModes=Te,t.resolveMode=Oe,t.getMode=Ne,t.modeExtensions=Se,t.extendMode=Ae,t.copyState=De,t.startState=We,t.innerMode=Ee,t.commands=jo,t.keyMap=Ro,t.keyName=qo,t.isModifierKey=Go,t.lookupKey=Bo,t.normalizeKeyMap=Uo,t.StringStream=He,t.SharedTextMarker=ko,t.TextMarker=xo,t.LineWidget=yo,t.e_preventDefault=ue,t.e_stopPropagation=ce,t.e_stop=he,t.addClass=W,t.contains=D,t.rmClass=T,t.keyNames=zo}(Ml),Ml.version="5.42.2",Ml}()},function(t,e){var r;r=function(){return this}();try{r=r||new Function("return this")()}catch(t){"object"==typeof window&&(r=window)}t.exports=r},function(t,e,r){"use strict";t.exports=function(t){var e=[];return e.toString=function(){return this.map(function(e){var r=function(t,e){var r=t[1]||"",n=t[3];if(!n)return r;if(e&&"function"==typeof btoa){var i=(l=n,"/*# sourceMappingURL=data:application/json;charset=utf-8;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(l))))+" */"),o=n.sources.map(function(t){return"/*# sourceURL="+n.sourceRoot+t+" */"});return[r].concat(o).concat([i]).join("\n")}var l;return[r].join("\n")}(e,t);return e[2]?"@media "+e[2]+"{"+r+"}":r}).join("")},e.i=function(t,r){"string"==typeof t&&(t=[[null,t,""]]);for(var n={},i=0;i<this.length;i++){var o=this[i][0];null!=o&&(n[o]=!0)}for(i=0;i<t.length;i++){var l=t[i];null!=l[0]&&n[l[0]]||(r&&!l[2]?l[2]=r:r&&(l[2]="("+l[2]+") and ("+r+")"),e.push(l))}},e}},function(t,e,r){var n,i,o={},l=(n=function(){return window&&document&&document.all&&!window.atob},function(){return void 0===i&&(i=n.apply(this,arguments)),i}),a=function(t){var e={};return function(t,r){if("function"==typeof t)return t();if(void 0===e[t]){var n=function(t,e){return e?e.querySelector(t):document.querySelector(t)}.call(this,t,r);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head}catch(t){n=null}e[t]=n}return e[t]}}(),s=null,u=0,c=[],f=r(22);function h(t,e){for(var r=0;r<t.length;r++){var n=t[r],i=o[n.id];if(i){i.refs++;for(var l=0;l<i.parts.length;l++)i.parts[l](n.parts[l]);for(;l<n.parts.length;l++)i.parts.push(y(n.parts[l],e))}else{var a=[];for(l=0;l<n.parts.length;l++)a.push(y(n.parts[l],e));o[n.id]={id:n.id,refs:1,parts:a}}}}function d(t,e){for(var r=[],n={},i=0;i<t.length;i++){var o=t[i],l=e.base?o[0]+e.base:o[0],a={css:o[1],media:o[2],sourceMap:o[3]};n[l]?n[l].parts.push(a):r.push(n[l]={id:l,parts:[a]})}return r}function p(t,e){var r=a(t.insertInto);if(!r)throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");var n=c[c.length-1];if("top"===t.insertAt)n?n.nextSibling?r.insertBefore(e,n.nextSibling):r.appendChild(e):r.insertBefore(e,r.firstChild),c.push(e);else if("bottom"===t.insertAt)r.appendChild(e);else{if("object"!=typeof t.insertAt||!t.insertAt.before)throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");var i=a(t.insertAt.before,r);r.insertBefore(e,i)}}function v(t){if(null===t.parentNode)return!1;t.parentNode.removeChild(t);var e=c.indexOf(t);e>=0&&c.splice(e,1)}function g(t){var e=document.createElement("style");if(void 0===t.attrs.type&&(t.attrs.type="text/css"),void 0===t.attrs.nonce){var n=function(){0;return r.nc}();n&&(t.attrs.nonce=n)}return m(e,t.attrs),p(t,e),e}function m(t,e){Object.keys(e).forEach(function(r){t.setAttribute(r,e[r])})}function y(t,e){var r,n,i,o;if(e.transform&&t.css){if(!(o="function"==typeof e.transform?e.transform(t.css):e.transform.default(t.css)))return function(){};t.css=o}if(e.singleton){var l=u++;r=s||(s=g(e)),n=x.bind(null,r,l,!1),i=x.bind(null,r,l,!0)}else t.sourceMap&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&"function"==typeof URL.revokeObjectURL&&"function"==typeof Blob&&"function"==typeof btoa?(r=function(t){var e=document.createElement("link");return void 0===t.attrs.type&&(t.attrs.type="text/css"),t.attrs.rel="stylesheet",m(e,t.attrs),p(t,e),e}(e),n=function(t,e,r){var n=r.css,i=r.sourceMap,o=void 0===e.convertToAbsoluteUrls&&i;(e.convertToAbsoluteUrls||o)&&(n=f(n));i&&(n+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(i))))+" */");var l=new Blob([n],{type:"text/css"}),a=t.href;t.href=URL.createObjectURL(l),a&&URL.revokeObjectURL(a)}.bind(null,r,e),i=function(){v(r),r.href&&URL.revokeObjectURL(r.href)}):(r=g(e),n=function(t,e){var r=e.css,n=e.media;n&&t.setAttribute("media",n);if(t.styleSheet)t.styleSheet.cssText=r;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(r))}}.bind(null,r),i=function(){v(r)});return n(t),function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap)return;n(t=e)}else i()}}t.exports=function(t,e){if("undefined"!=typeof DEBUG&&DEBUG&&"object"!=typeof document)throw new Error("The style-loader cannot be used in a non-browser environment");(e=e||{}).attrs="object"==typeof e.attrs?e.attrs:{},e.singleton||"boolean"==typeof e.singleton||(e.singleton=l()),e.insertInto||(e.insertInto="head"),e.insertAt||(e.insertAt="bottom");var r=d(t,e);return h(r,e),function(t){for(var n=[],i=0;i<r.length;i++){var l=r[i];(a=o[l.id]).refs--,n.push(a)}t&&h(d(t,e),e);for(i=0;i<n.length;i++){var a;if(0===(a=n[i]).refs){for(var s=0;s<a.parts.length;s++)a.parts[s]();delete o[a.id]}}}};var b,w=(b=[],function(t,e){return b[t]=e,b.filter(Boolean).join("\n")});function x(t,e,r,n){var i=r?"":n.css;if(t.styleSheet)t.styleSheet.cssText=w(e,i);else{var o=document.createTextNode(i),l=t.childNodes;l[e]&&t.removeChild(l[e]),l.length?t.insertBefore(o,l[e]):t.appendChild(o)}}},function(t,e,r){"use strict";r.r(e),r.d(e,"attachToElement",function(){return h}),r.d(e,"setUserContext",function(){return d});var n=r(5),i=r(8),o=r(10),l=r(14).pick(["en","ja","es"],"en"),a=r(15),s=r(16),u=r(17);r(20),r(23);var c={};var f={state:"closed",scrollIntoView:!0};function h(t,e,d){var p=(d=d||{}).state||f.state,v=void 0!==d.scrollIntoView?d.scrollIntoView:f.scrollIntoView,g=t.parentNode,m=r(26),y=u(m,a(s,l));function b(){var f=function(t,e){var f=new n,d=f.editor,p={"Cmd-Enter":function(){w()},"Ctrl-Enter":function(){w()}};d.setOption("lineNumbers",!0),d.setOption("extraKeys",p),f.setText(e||""),f.textareaHolder.className="mirror-console-wrapper";var v=r(25),g=u(v,a(s,l)),m=g.querySelector(".mirror-console-log");function y(t,e){var r=document.createElement("div");r.className=e;var n=t.map(function(t){return"[object Object]"===String(t)||Array.isArray(t)?o.inspect(t):String(t)});r.appendChild(document.createTextNode(n.join(", "))),m.appendChild(r)}var b={log:function(){y(Array.prototype.slice.call(arguments),"mirror-console-log-row mirror-console-log-normal"),console.log.apply(console,arguments)},info:function(){y(Array.prototype.slice.call(arguments),"mirror-console-log-row mirror-console-log-info"),console.info.apply(console,arguments)},warn:function(){y(Array.prototype.slice.call(arguments),"mirror-console-log-row mirror-console-log-warn"),console.warn.apply(console,arguments)},error:function(){y(Array.prototype.slice.call(arguments),"mirror-console-log-row mirror-console-log-error"),console.error.apply(console,arguments)}},w=function(){var t=i({console:b},c);f.runInContext(t,function(t,e){t?b.error(t):void 0!==e&&y([e],"mirror-console-log-row mirror-console-log-return")})};return f.swapWithElement(t),f.textareaHolder.appendChild(g),w(),g.querySelector(".mirror-console-run").addEventListener("click",function(){w()}),g.querySelector(".mirror-console-clear").addEventListener("click",function(){var t=document.createRange();t.selectNodeContents(g.querySelector(".mirror-console-log")),t.deleteContents()}),g.querySelector(".mirror-console-exit").addEventListener("click",function(){f.destroy(),h(t,e)}),f}(t,e);v&&f.textareaHolder.scrollIntoView(!0),g.removeChild(y)}y.className="mirror-console-attach-button-wrapper",y.querySelector(".mirror-console-run").addEventListener("click",b),null===t.nextSibling?g.appendChild(y):g.insertBefore(y,t.nextSibling),"open"===p&&b()}function d(t){c=t}},function(t,e,r){"use strict";var n=r(6),i=r(0);function o(){this.editor=this.createEditor()}r(7),o.prototype.createEditor=function(){return this.textareaHolder=document.createElement("div"),this.textarea=document.createElement("textarea"),this.textareaHolder.appendChild(this.textarea),i.fromTextArea(this.textarea)},o.prototype.setText=function(t){this.editor.setValue(t)},o.prototype.getText=function(t){return this.editor.getValue()},o.prototype.swapWithElement=function(t){this.originalElemenet=t,t.parentNode.replaceChild(this.textareaHolder,t),this.editor.refresh()},o.prototype.destroy=function(t){if(null==this.originalElemenet)throw new Error("Haven't `originalElement` : You have to call #swapWithElement before call this");this.textareaHolder.parentNode.replaceChild(this.originalElemenet,this.textareaHolder),this.originalElemenet=null,this.textarea=null,this.textareaHolder=null,this.editor=null,this.evalContext&&this.evalContext.destroy(),Object.freeze(this)},o.prototype.runInContext=function(t,e){this.evalContext&&this.evalContext.destroy(),this.evalContext=new n(t,this.textareaHolder);var r,i=this.editor.getValue();try{e(null,r=this.evalContext.evaluate(i))}catch(t){e(t,r)}},t.exports=o},function(t,e){function r(t,e){this.iframe=document.createElement("iframe"),this.iframe.style.display="none",(e=e||document.body).appendChild(this.iframe);this.iframe.contentWindow;t&&this.extend(t)}r.prototype.evaluate=function(t){return this.iframe.contentWindow.eval(t)},r.prototype.destroy=function(){this.iframe&&(this.iframe.parentNode.removeChild(this.iframe),this.iframe=null)},r.prototype.getGlobal=function(){return this.iframe.contentWindow},r.prototype.extend=function(t){var e=this.getGlobal();Object.keys(t).forEach(function(r){e[r]=t[r]})},t.exports=r},function(t,e,r){!function(t){"use strict";t.defineMode("javascript",function(e,r){var n,i,o=e.indentUnit,l=r.statementIndent,a=r.jsonld,s=r.json||a,u=r.typescript,c=r.wordCharacters||/[\w$\xa1-\uffff]/,f=function(){function t(t){return{type:t,style:"keyword"}}var e=t("keyword a"),r=t("keyword b"),n=t("keyword c"),i=t("keyword d"),o=t("operator"),l={type:"atom",style:"atom"};return{if:t("if"),while:e,with:e,else:r,do:r,try:r,finally:r,return:i,break:i,continue:i,new:t("new"),delete:n,void:n,throw:n,debugger:t("debugger"),var:t("var"),const:t("var"),let:t("var"),function:t("function"),catch:t("catch"),for:t("for"),switch:t("switch"),case:t("case"),default:t("default"),in:o,typeof:o,instanceof:o,true:l,false:l,null:l,undefined:l,NaN:l,Infinity:l,this:t("this"),class:t("class"),super:t("atom"),yield:n,export:t("export"),import:t("import"),extends:n,await:n}}(),h=/[+\-*&%=<>!?|~^@]/,d=/^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/;function p(t,e,r){return n=t,i=r,e}function v(t,e){var r,n=t.next();if('"'==n||"'"==n)return e.tokenize=(r=n,function(t,e){var n,i=!1;if(a&&"@"==t.peek()&&t.match(d))return e.tokenize=v,p("jsonld-keyword","meta");for(;null!=(n=t.next())&&(n!=r||i);)i=!i&&"\\"==n;return i||(e.tokenize=v),p("string","string")}),e.tokenize(t,e);if("."==n&&t.match(/^\d+(?:[eE][+\-]?\d+)?/))return p("number","number");if("."==n&&t.match(".."))return p("spread","meta");if(/[\[\]{}\(\),;\:\.]/.test(n))return p(n);if("="==n&&t.eat(">"))return p("=>","operator");if("0"==n&&t.match(/^(?:x[\da-f]+|o[0-7]+|b[01]+)n?/i))return p("number","number");if(/\d/.test(n))return t.match(/^\d*(?:n|(?:\.\d*)?(?:[eE][+\-]?\d+)?)?/),p("number","number");if("/"==n)return t.eat("*")?(e.tokenize=g,g(t,e)):t.eat("/")?(t.skipToEnd(),p("comment","comment")):Yt(t,e,1)?(function(t){for(var e,r=!1,n=!1;null!=(e=t.next());){if(!r){if("/"==e&&!n)return;"["==e?n=!0:n&&"]"==e&&(n=!1)}r=!r&&"\\"==e}}(t),t.match(/^\b(([gimyus])(?![gimyus]*\2))+\b/),p("regexp","string-2")):(t.eat("="),p("operator","operator",t.current()));if("`"==n)return e.tokenize=m,m(t,e);if("#"==n)return t.skipToEnd(),p("error","error");if(h.test(n))return">"==n&&e.lexical&&">"==e.lexical.type||(t.eat("=")?"!"!=n&&"="!=n||t.eat("="):/[<>*+\-]/.test(n)&&(t.eat(n),">"==n&&t.eat(n))),p("operator","operator",t.current());if(c.test(n)){t.eatWhile(c);var i=t.current();if("."!=e.lastType){if(f.propertyIsEnumerable(i)){var o=f[i];return p(o.type,o.style,i)}if("async"==i&&t.match(/^(\s|\/\*.*?\*\/)*[\[\(\w]/,!1))return p("async","keyword",i)}return p("variable","variable",i)}}function g(t,e){for(var r,n=!1;r=t.next();){if("/"==r&&n){e.tokenize=v;break}n="*"==r}return p("comment","comment")}function m(t,e){for(var r,n=!1;null!=(r=t.next());){if(!n&&("`"==r||"$"==r&&t.eat("{"))){e.tokenize=v;break}n=!n&&"\\"==r}return p("quasi","string-2",t.current())}var y="([{}])";function b(t,e){e.fatArrowAt&&(e.fatArrowAt=null);var r=t.string.indexOf("=>",t.start);if(!(r<0)){if(u){var n=/:\s*(?:\w+(?:<[^>]*>|\[\])?|\{[^}]*\})\s*$/.exec(t.string.slice(t.start,r));n&&(r=n.index)}for(var i=0,o=!1,l=r-1;l>=0;--l){var a=t.string.charAt(l),s=y.indexOf(a);if(s>=0&&s<3){if(!i){++l;break}if(0==--i){"("==a&&(o=!0);break}}else if(s>=3&&s<6)++i;else if(c.test(a))o=!0;else{if(/["'\/]/.test(a))return;if(o&&!i){++l;break}}}o&&!i&&(e.fatArrowAt=l)}}var w={atom:!0,number:!0,variable:!0,string:!0,regexp:!0,this:!0,"jsonld-keyword":!0};function x(t,e,r,n,i,o){this.indented=t,this.column=e,this.type=r,this.prev=i,this.info=o,null!=n&&(this.align=n)}function C(t,e){for(var r=t.localVars;r;r=r.next)if(r.name==e)return!0;for(var n=t.context;n;n=n.prev)for(var r=n.vars;r;r=r.next)if(r.name==e)return!0}var k={state:null,column:null,marked:null,cc:null};function M(){for(var t=arguments.length-1;t>=0;t--)k.cc.push(arguments[t])}function L(){return M.apply(null,arguments),!0}function T(t,e){for(var r=e;r;r=r.next)if(r.name==t)return!0;return!1}function O(t){var e=k.state;if(k.marked="def",e.context)if("var"==e.lexical.info&&e.context&&e.context.block){var n=function t(e,r){if(r){if(r.block){var n=t(e,r.prev);return n?n==r.prev?r:new S(n,r.vars,!0):null}return T(e,r.vars)?r:new S(r.prev,new A(e,r.vars),!1)}return null}(t,e.context);if(null!=n)return void(e.context=n)}else if(!T(t,e.localVars))return void(e.localVars=new A(t,e.localVars));r.globalVars&&!T(t,e.globalVars)&&(e.globalVars=new A(t,e.globalVars))}function N(t){return"public"==t||"private"==t||"protected"==t||"abstract"==t||"readonly"==t}function S(t,e,r){this.prev=t,this.vars=e,this.block=r}function A(t,e){this.name=t,this.next=e}var D=new A("this",new A("arguments",null));function E(){k.state.context=new S(k.state.context,k.state.localVars,!1),k.state.localVars=D}function W(){k.state.context=new S(k.state.context,k.state.localVars,!0),k.state.localVars=null}function H(){k.state.localVars=k.state.context.vars,k.state.context=k.state.context.prev}function z(t,e){var r=function(){var r=k.state,n=r.indented;if("stat"==r.lexical.type)n=r.lexical.indented;else for(var i=r.lexical;i&&")"==i.type&&i.align;i=i.prev)n=i.indented;r.lexical=new x(n,k.stream.column(),t,null,r.lexical,e)};return r.lex=!0,r}function I(){var t=k.state;t.lexical.prev&&(")"==t.lexical.type&&(t.indented=t.lexical.indented),t.lexical=t.lexical.prev)}function _(t){return function e(r){return r==t?L():";"==t||"}"==r||")"==r||"]"==r?M():L(e)}}function F(t,e){return"var"==t?L(z("vardef",e),yt,_(";"),I):"keyword a"==t?L(z("form"),B,F,I):"keyword b"==t?L(z("form"),F,I):"keyword d"==t?k.stream.match(/^\s*$/,!1)?L():L(z("stat"),K,_(";"),I):"debugger"==t?L(_(";")):"{"==t?L(z("}"),W,lt,I,H):";"==t?L():"if"==t?("else"==k.state.lexical.info&&k.state.cc[k.state.cc.length-1]==I&&k.state.cc.pop()(),L(z("form"),B,F,I,Mt)):"function"==t?L(At):"for"==t?L(z("form"),Lt,F,I):"class"==t||u&&"interface"==e?(k.marked="keyword",L(z("form"),Wt,I)):"variable"==t?u&&"declare"==e?(k.marked="keyword",L(F)):u&&("module"==e||"enum"==e||"type"==e)&&k.stream.match(/^\s*\w/,!1)?(k.marked="keyword","enum"==e?L(qt):"type"==e?L(ct,_("operator"),ct,_(";")):L(z("form"),bt,_("{"),z("}"),lt,I,I)):u&&"namespace"==e?(k.marked="keyword",L(z("form"),P,lt,I)):u&&"abstract"==e?(k.marked="keyword",L(F)):L(z("stat"),$):"switch"==t?L(z("form"),B,_("{"),z("}","switch"),W,lt,I,I,H):"case"==t?L(P,_(":")):"default"==t?L(_(":")):"catch"==t?L(z("form"),E,R,F,I,H):"export"==t?L(z("stat"),_t,I):"import"==t?L(z("stat"),Rt,I):"async"==t?L(F):"@"==e?L(P,F):M(z("stat"),P,_(";"),I)}function R(t){if("("==t)return L(Dt,_(")"))}function P(t,e){return G(t,e,!1)}function U(t,e){return G(t,e,!0)}function B(t){return"("!=t?M():L(z(")"),P,_(")"),I)}function G(t,e,r){if(k.state.fatArrowAt==k.stream.start){var n=r?Q:Z;if("("==t)return L(E,z(")"),it(Dt,")"),I,_("=>"),n,H);if("variable"==t)return M(E,bt,_("=>"),n,H)}var i=r?X:q;return w.hasOwnProperty(t)?L(i):"function"==t?L(At,i):"class"==t||u&&"interface"==e?(k.marked="keyword",L(z("form"),Et,I)):"keyword c"==t||"async"==t?L(r?U:P):"("==t?L(z(")"),K,_(")"),I,i):"operator"==t||"spread"==t?L(r?U:P):"["==t?L(z("]"),Kt,I,i):"{"==t?ot(et,"}",null,i):"quasi"==t?M(Y,i):"new"==t?L(function(t){return function(e){return"."==e?L(t?V:j):"variable"==e&&u?L(vt,t?X:q):M(t?U:P)}}(r)):"import"==t?L(P):L()}function K(t){return t.match(/[;\}\)\],]/)?M():M(P)}function q(t,e){return","==t?L(P):X(t,e,!1)}function X(t,e,r){var n=0==r?q:X,i=0==r?P:U;return"=>"==t?L(E,r?Q:Z,H):"operator"==t?/\+\+|--/.test(e)||u&&"!"==e?L(n):u&&"<"==e&&k.stream.match(/^([^>]|<.*?>)*>\s*\(/,!1)?L(z(">"),it(ct,">"),I,n):"?"==e?L(P,_(":"),i):L(i):"quasi"==t?M(Y,n):";"!=t?"("==t?ot(U,")","call",n):"."==t?L(tt,n):"["==t?L(z("]"),K,_("]"),I,n):u&&"as"==e?(k.marked="keyword",L(ct,n)):"regexp"==t?(k.state.lastType=k.marked="operator",k.stream.backUp(k.stream.pos-k.stream.start-1),L(i)):void 0:void 0}function Y(t,e){return"quasi"!=t?M():"${"!=e.slice(e.length-2)?L(Y):L(P,J)}function J(t){if("}"==t)return k.marked="string-2",k.state.tokenize=m,L(Y)}function Z(t){return b(k.stream,k.state),M("{"==t?F:P)}function Q(t){return b(k.stream,k.state),M("{"==t?F:U)}function j(t,e){if("target"==e)return k.marked="keyword",L(q)}function V(t,e){if("target"==e)return k.marked="keyword",L(X)}function $(t){return":"==t?L(I,F):M(q,_(";"),I)}function tt(t){if("variable"==t)return k.marked="property",L()}function et(t,e){return"async"==t?(k.marked="property",L(et)):"variable"==t||"keyword"==k.style?(k.marked="property","get"==e||"set"==e?L(rt):(u&&k.state.fatArrowAt==k.stream.start&&(r=k.stream.match(/^\s*:\s*/,!1))&&(k.state.fatArrowAt=k.stream.pos+r[0].length),L(nt))):"number"==t||"string"==t?(k.marked=a?"property":k.style+" property",L(nt)):"jsonld-keyword"==t?L(nt):u&&N(e)?(k.marked="keyword",L(et)):"["==t?L(P,at,_("]"),nt):"spread"==t?L(U,nt):"*"==e?(k.marked="keyword",L(et)):":"==t?M(nt):void 0;var r}function rt(t){return"variable"!=t?M(nt):(k.marked="property",L(At))}function nt(t){return":"==t?L(U):"("==t?M(At):void 0}function it(t,e,r){function n(i,o){if(r?r.indexOf(i)>-1:","==i){var l=k.state.lexical;return"call"==l.info&&(l.pos=(l.pos||0)+1),L(function(r,n){return r==e||n==e?M():M(t)},n)}return i==e||o==e?L():L(_(e))}return function(r,i){return r==e||i==e?L():M(t,n)}}function ot(t,e,r){for(var n=3;n<arguments.length;n++)k.cc.push(arguments[n]);return L(z(e,r),it(t,e),I)}function lt(t){return"}"==t?L():M(F,lt)}function at(t,e){if(u){if(":"==t)return L(ct);if("?"==e)return L(at)}}function st(t){if(u&&":"==t)return k.stream.match(/^\s*\w+\s+is\b/,!1)?L(P,ut,ct):L(ct)}function ut(t,e){if("is"==e)return k.marked="keyword",L()}function ct(t,e){return"keyof"==e||"typeof"==e?(k.marked="keyword",L("keyof"==e?ct:U)):"variable"==t||"void"==e?(k.marked="type",L(pt)):"string"==t||"number"==t||"atom"==t?L(pt):"["==t?L(z("]"),it(ct,"]",","),I,pt):"{"==t?L(z("}"),it(ht,"}",",;"),I,pt):"("==t?L(it(dt,")"),ft):"<"==t?L(it(ct,">"),ct):void 0}function ft(t){if("=>"==t)return L(ct)}function ht(t,e){return"variable"==t||"keyword"==k.style?(k.marked="property",L(ht)):"?"==e?L(ht):":"==t?L(ct):"["==t?L(P,at,_("]"),ht):void 0}function dt(t,e){return"variable"==t&&k.stream.match(/^\s*[?:]/,!1)||"?"==e?L(dt):":"==t?L(ct):M(ct)}function pt(t,e){return"<"==e?L(z(">"),it(ct,">"),I,pt):"|"==e||"."==t||"&"==e?L(ct):"["==t?L(_("]"),pt):"extends"==e||"implements"==e?(k.marked="keyword",L(ct)):void 0}function vt(t,e){if("<"==e)return L(z(">"),it(ct,">"),I,pt)}function gt(){return M(ct,mt)}function mt(t,e){if("="==e)return L(ct)}function yt(t,e){return"enum"==e?(k.marked="keyword",L(qt)):M(bt,at,Ct,kt)}function bt(t,e){return u&&N(e)?(k.marked="keyword",L(bt)):"variable"==t?(O(e),L()):"spread"==t?L(bt):"["==t?ot(xt,"]"):"{"==t?ot(wt,"}"):void 0}function wt(t,e){return"variable"!=t||k.stream.match(/^\s*:/,!1)?("variable"==t&&(k.marked="property"),"spread"==t?L(bt):"}"==t?M():"["==t?L(P,_("]"),_(":"),wt):L(_(":"),bt,Ct)):(O(e),L(Ct))}function xt(){return M(bt,Ct)}function Ct(t,e){if("="==e)return L(U)}function kt(t){if(","==t)return L(yt)}function Mt(t,e){if("keyword b"==t&&"else"==e)return L(z("form","else"),F,I)}function Lt(t,e){return"await"==e?L(Lt):"("==t?L(z(")"),Tt,_(")"),I):void 0}function Tt(t){return"var"==t?L(yt,_(";"),Nt):";"==t?L(Nt):"variable"==t?L(Ot):M(P,_(";"),Nt)}function Ot(t,e){return"in"==e||"of"==e?(k.marked="keyword",L(P)):L(q,Nt)}function Nt(t,e){return";"==t?L(St):"in"==e||"of"==e?(k.marked="keyword",L(P)):M(P,_(";"),St)}function St(t){")"!=t&&L(P)}function At(t,e){return"*"==e?(k.marked="keyword",L(At)):"variable"==t?(O(e),L(At)):"("==t?L(E,z(")"),it(Dt,")"),I,st,F,H):u&&"<"==e?L(z(">"),it(gt,">"),I,At):void 0}function Dt(t,e){return"@"==e&&L(P,Dt),"spread"==t?L(Dt):u&&N(e)?(k.marked="keyword",L(Dt)):M(bt,at,Ct)}function Et(t,e){return"variable"==t?Wt(t,e):Ht(t,e)}function Wt(t,e){if("variable"==t)return O(e),L(Ht)}function Ht(t,e){return"<"==e?L(z(">"),it(gt,">"),I,Ht):"extends"==e||"implements"==e||u&&","==t?("implements"==e&&(k.marked="keyword"),L(u?ct:P,Ht)):"{"==t?L(z("}"),zt,I):void 0}function zt(t,e){return"async"==t||"variable"==t&&("static"==e||"get"==e||"set"==e||u&&N(e))&&k.stream.match(/^\s+[\w$\xa1-\uffff]/,!1)?(k.marked="keyword",L(zt)):"variable"==t||"keyword"==k.style?(k.marked="property",L(u?It:At,zt)):"["==t?L(P,at,_("]"),u?It:At,zt):"*"==e?(k.marked="keyword",L(zt)):";"==t?L(zt):"}"==t?L():"@"==e?L(P,zt):void 0}function It(t,e){return"?"==e?L(It):":"==t?L(ct,Ct):"="==e?L(U):M(At)}function _t(t,e){return"*"==e?(k.marked="keyword",L(Gt,_(";"))):"default"==e?(k.marked="keyword",L(P,_(";"))):"{"==t?L(it(Ft,"}"),Gt,_(";")):M(F)}function Ft(t,e){return"as"==e?(k.marked="keyword",L(_("variable"))):"variable"==t?M(U,Ft):void 0}function Rt(t){return"string"==t?L():"("==t?M(P):M(Pt,Ut,Gt)}function Pt(t,e){return"{"==t?ot(Pt,"}"):("variable"==t&&O(e),"*"==e&&(k.marked="keyword"),L(Bt))}function Ut(t){if(","==t)return L(Pt,Ut)}function Bt(t,e){if("as"==e)return k.marked="keyword",L(Pt)}function Gt(t,e){if("from"==e)return k.marked="keyword",L(P)}function Kt(t){return"]"==t?L():M(it(U,"]"))}function qt(){return M(z("form"),bt,_("{"),z("}"),it(Xt,"}"),I,I)}function Xt(){return M(bt,Ct)}function Yt(t,e,r){return e.tokenize==v&&/^(?:operator|sof|keyword [bcd]|case|new|export|default|spread|[\[{}\(,;:]|=>)$/.test(e.lastType)||"quasi"==e.lastType&&/\{\s*$/.test(t.string.slice(0,t.pos-(r||0)))}return H.lex=!0,I.lex=!0,{startState:function(t){var e={tokenize:v,lastType:"sof",cc:[],lexical:new x((t||0)-o,0,"block",!1),localVars:r.localVars,context:r.localVars&&new S(null,null,!1),indented:t||0};return r.globalVars&&"object"==typeof r.globalVars&&(e.globalVars=r.globalVars),e},token:function(t,e){if(t.sol()&&(e.lexical.hasOwnProperty("align")||(e.lexical.align=!1),e.indented=t.indentation(),b(t,e)),e.tokenize!=g&&t.eatSpace())return null;var r=e.tokenize(t,e);return"comment"==n?r:(e.lastType="operator"!=n||"++"!=i&&"--"!=i?n:"incdec",function(t,e,r,n,i){var o=t.cc;for(k.state=t,k.stream=i,k.marked=null,k.cc=o,k.style=e,t.lexical.hasOwnProperty("align")||(t.lexical.align=!0);;){var l=o.length?o.pop():s?P:F;if(l(r,n)){for(;o.length&&o[o.length-1].lex;)o.pop()();return k.marked?k.marked:"variable"==r&&C(t,n)?"variable-2":e}}}(e,r,n,i,t))},indent:function(e,n){if(e.tokenize==g)return t.Pass;if(e.tokenize!=v)return 0;var i,a=n&&n.charAt(0),s=e.lexical;if(!/^\s*else\b/.test(n))for(var u=e.cc.length-1;u>=0;--u){var c=e.cc[u];if(c==I)s=s.prev;else if(c!=Mt)break}for(;("stat"==s.type||"form"==s.type)&&("}"==a||(i=e.cc[e.cc.length-1])&&(i==q||i==X)&&!/^[,\.=+\-*:?[\(]/.test(n));)s=s.prev;l&&")"==s.type&&"stat"==s.prev.type&&(s=s.prev);var f=s.type,d=a==f;return"vardef"==f?s.indented+("operator"==e.lastType||","==e.lastType?s.info.length+1:0):"form"==f&&"{"==a?s.indented:"form"==f?s.indented+o:"stat"==f?s.indented+(function(t,e){return"operator"==t.lastType||","==t.lastType||h.test(e.charAt(0))||/[,.]/.test(e.charAt(0))}(e,n)?l||o:0):"switch"!=s.info||d||0==r.doubleIndentSwitch?s.align?s.column+(d?0:1):s.indented+(d?0:o):s.indented+(/^(?:case|default)\b/.test(n)?o:2*o)},electricInput:/^\s*(?:case .*?:|default:|\{|\})$/,blockCommentStart:s?null:"/*",blockCommentEnd:s?null:"*/",blockCommentContinue:s?null:" * ",lineComment:s?null:"//",fold:"brace",closeBrackets:"()[]{}''\"\"``",helperType:s?"json":"javascript",jsonldMode:a,jsonMode:s,expressionAllowed:Yt,skipExpression:function(t){var e=t.cc[t.cc.length-1];e!=P&&e!=U||t.cc.pop()}}}),t.registerHelper("wordChars","javascript",/[\w$]/),t.defineMIME("text/javascript","javascript"),t.defineMIME("text/ecmascript","javascript"),t.defineMIME("application/javascript","javascript"),t.defineMIME("application/x-javascript","javascript"),t.defineMIME("application/ecmascript","javascript"),t.defineMIME("application/json",{name:"javascript",json:!0}),t.defineMIME("application/x-json",{name:"javascript",json:!0}),t.defineMIME("application/ld+json",{name:"javascript",jsonld:!0}),t.defineMIME("text/typescript",{name:"javascript",typescript:!0}),t.defineMIME("application/typescript",{name:"javascript",typescript:!0})}(r(0))},function(t,e,r){(function(t,r){var n=200,i="__lodash_hash_undefined__",o=800,l=16,a=9007199254740991,s="[object Arguments]",u="[object AsyncFunction]",c="[object Function]",f="[object GeneratorFunction]",h="[object Null]",d="[object Object]",p="[object Proxy]",v="[object Undefined]",g=/^\[object .+?Constructor\]$/,m=/^(?:0|[1-9]\d*)$/,y={};y["[object Float32Array]"]=y["[object Float64Array]"]=y["[object Int8Array]"]=y["[object Int16Array]"]=y["[object Int32Array]"]=y["[object Uint8Array]"]=y["[object Uint8ClampedArray]"]=y["[object Uint16Array]"]=y["[object Uint32Array]"]=!0,y[s]=y["[object Array]"]=y["[object ArrayBuffer]"]=y["[object Boolean]"]=y["[object DataView]"]=y["[object Date]"]=y["[object Error]"]=y[c]=y["[object Map]"]=y["[object Number]"]=y[d]=y["[object RegExp]"]=y["[object Set]"]=y["[object String]"]=y["[object WeakMap]"]=!1;var b="object"==typeof t&&t&&t.Object===Object&&t,w="object"==typeof self&&self&&self.Object===Object&&self,x=b||w||Function("return this")(),C=e&&!e.nodeType&&e,k=C&&"object"==typeof r&&r&&!r.nodeType&&r,M=k&&k.exports===C,L=M&&b.process,T=function(){try{return L&&L.binding&&L.binding("util")}catch(t){}}(),O=T&&T.isTypedArray;function N(t,e){return"__proto__"==e?void 0:t[e]}var S,A,D,E=Array.prototype,W=Function.prototype,H=Object.prototype,z=x["__core-js_shared__"],I=W.toString,_=H.hasOwnProperty,F=(S=/[^.]+$/.exec(z&&z.keys&&z.keys.IE_PROTO||""))?"Symbol(src)_1."+S:"",R=H.toString,P=I.call(Object),U=RegExp("^"+I.call(_).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),B=M?x.Buffer:void 0,G=x.Symbol,K=x.Uint8Array,q=B?B.allocUnsafe:void 0,X=(A=Object.getPrototypeOf,D=Object,function(t){return A(D(t))}),Y=Object.create,J=H.propertyIsEnumerable,Z=E.splice,Q=G?G.toStringTag:void 0,j=function(){try{var t=Ct(Object,"defineProperty");return t({},"",{}),t}catch(t){}}(),V=B?B.isBuffer:void 0,$=Math.max,tt=Date.now,et=Ct(x,"Map"),rt=Ct(Object,"create"),nt=function(){function t(){}return function(e){if(!Wt(e))return{};if(Y)return Y(e);t.prototype=e;var r=new t;return t.prototype=void 0,r}}();function it(t){var e=-1,r=null==t?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}function ot(t){var e=-1,r=null==t?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}function lt(t){var e=-1,r=null==t?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}function at(t){var e=this.__data__=new ot(t);this.size=e.size}function st(t,e){var r=Nt(t),n=!r&&Ot(t),i=!r&&!n&&At(t),o=!r&&!n&&!i&&zt(t),l=r||n||i||o,a=l?function(t,e){for(var r=-1,n=Array(t);++r<t;)n[r]=e(r);return n}(t.length,String):[],s=a.length;for(var u in t)!e&&!_.call(t,u)||l&&("length"==u||i&&("offset"==u||"parent"==u)||o&&("buffer"==u||"byteLength"==u||"byteOffset"==u)||kt(u,s))||a.push(u);return a}function ut(t,e,r){(void 0===r||Tt(t[e],r))&&(void 0!==r||e in t)||ht(t,e,r)}function ct(t,e,r){var n=t[e];_.call(t,e)&&Tt(n,r)&&(void 0!==r||e in t)||ht(t,e,r)}function ft(t,e){for(var r=t.length;r--;)if(Tt(t[r][0],e))return r;return-1}function ht(t,e,r){"__proto__"==e&&j?j(t,e,{configurable:!0,enumerable:!0,value:r,writable:!0}):t[e]=r}it.prototype.clear=function(){this.__data__=rt?rt(null):{},this.size=0},it.prototype.delete=function(t){var e=this.has(t)&&delete this.__data__[t];return this.size-=e?1:0,e},it.prototype.get=function(t){var e=this.__data__;if(rt){var r=e[t];return r===i?void 0:r}return _.call(e,t)?e[t]:void 0},it.prototype.has=function(t){var e=this.__data__;return rt?void 0!==e[t]:_.call(e,t)},it.prototype.set=function(t,e){var r=this.__data__;return this.size+=this.has(t)?0:1,r[t]=rt&&void 0===e?i:e,this},ot.prototype.clear=function(){this.__data__=[],this.size=0},ot.prototype.delete=function(t){var e=this.__data__,r=ft(e,t);return!(r<0||(r==e.length-1?e.pop():Z.call(e,r,1),--this.size,0))},ot.prototype.get=function(t){var e=this.__data__,r=ft(e,t);return r<0?void 0:e[r][1]},ot.prototype.has=function(t){return ft(this.__data__,t)>-1},ot.prototype.set=function(t,e){var r=this.__data__,n=ft(r,t);return n<0?(++this.size,r.push([t,e])):r[n][1]=e,this},lt.prototype.clear=function(){this.size=0,this.__data__={hash:new it,map:new(et||ot),string:new it}},lt.prototype.delete=function(t){var e=xt(this,t).delete(t);return this.size-=e?1:0,e},lt.prototype.get=function(t){return xt(this,t).get(t)},lt.prototype.has=function(t){return xt(this,t).has(t)},lt.prototype.set=function(t,e){var r=xt(this,t),n=r.size;return r.set(t,e),this.size+=r.size==n?0:1,this},at.prototype.clear=function(){this.__data__=new ot,this.size=0},at.prototype.delete=function(t){var e=this.__data__,r=e.delete(t);return this.size=e.size,r},at.prototype.get=function(t){return this.__data__.get(t)},at.prototype.has=function(t){return this.__data__.has(t)},at.prototype.set=function(t,e){var r=this.__data__;if(r instanceof ot){var i=r.__data__;if(!et||i.length<n-1)return i.push([t,e]),this.size=++r.size,this;r=this.__data__=new lt(i)}return r.set(t,e),this.size=r.size,this};var dt,pt=function(t,e,r){for(var n=-1,i=Object(t),o=r(t),l=o.length;l--;){var a=o[dt?l:++n];if(!1===e(i[a],a,i))break}return t};function vt(t){return null==t?void 0===t?v:h:Q&&Q in Object(t)?function(t){var e=_.call(t,Q),r=t[Q];try{t[Q]=void 0;var n=!0}catch(t){}var i=R.call(t);n&&(e?t[Q]=r:delete t[Q]);return i}(t):function(t){return R.call(t)}(t)}function gt(t){return Ht(t)&&vt(t)==s}function mt(t){return!(!Wt(t)||(e=t,F&&F in e))&&(Dt(t)?U:g).test(function(t){if(null!=t){try{return I.call(t)}catch(t){}try{return t+""}catch(t){}}return""}(t));var e}function yt(t){if(!Wt(t))return function(t){var e=[];if(null!=t)for(var r in Object(t))e.push(r);return e}(t);var e=Mt(t),r=[];for(var n in t)("constructor"!=n||!e&&_.call(t,n))&&r.push(n);return r}function bt(t,e,r,n,i){t!==e&&pt(e,function(o,l){if(Wt(o))i||(i=new at),function(t,e,r,n,i,o,l){var a=N(t,r),s=N(e,r),u=l.get(s);if(u)return void ut(t,r,u);var c=o?o(a,s,r+"",t,e,l):void 0,f=void 0===c;if(f){var h=Nt(s),p=!h&&At(s),v=!h&&!p&&zt(s);c=s,h||p||v?Nt(a)?c=a:Ht(w=a)&&St(w)?c=function(t,e){var r=-1,n=t.length;e||(e=Array(n));for(;++r<n;)e[r]=t[r];return e}(a):p?(f=!1,c=function(t,e){if(e)return t.slice();var r=t.length,n=q?q(r):new t.constructor(r);return t.copy(n),n}(s,!0)):v?(f=!1,g=s,m=!0?(y=g.buffer,b=new y.constructor(y.byteLength),new K(b).set(new K(y)),b):g.buffer,c=new g.constructor(m,g.byteOffset,g.length)):c=[]:function(t){if(!Ht(t)||vt(t)!=d)return!1;var e=X(t);if(null===e)return!0;var r=_.call(e,"constructor")&&e.constructor;return"function"==typeof r&&r instanceof r&&I.call(r)==P}(s)||Ot(s)?(c=a,Ot(a)?c=function(t){return function(t,e,r,n){var i=!r;r||(r={});var o=-1,l=e.length;for(;++o<l;){var a=e[o],s=n?n(r[a],t[a],a,r,t):void 0;void 0===s&&(s=t[a]),i?ht(r,a,s):ct(r,a,s)}return r}(t,It(t))}(a):(!Wt(a)||n&&Dt(a))&&(c=function(t){return"function"!=typeof t.constructor||Mt(t)?{}:nt(X(t))}(s))):f=!1}var g,m,y,b;var w;f&&(l.set(s,c),i(c,s,n,o,l),l.delete(s));ut(t,r,c)}(t,e,l,r,bt,n,i);else{var a=n?n(N(t,l),o,l+"",t,e,i):void 0;void 0===a&&(a=o),ut(t,l,a)}},It)}function wt(t,e){return Lt(function(t,e,r){return e=$(void 0===e?t.length-1:e,0),function(){for(var n=arguments,i=-1,o=$(n.length-e,0),l=Array(o);++i<o;)l[i]=n[e+i];i=-1;for(var a=Array(e+1);++i<e;)a[i]=n[i];return a[e]=r(l),function(t,e,r){switch(r.length){case 0:return t.call(e);case 1:return t.call(e,r[0]);case 2:return t.call(e,r[0],r[1]);case 3:return t.call(e,r[0],r[1],r[2])}return t.apply(e,r)}(t,this,a)}}(t,e,Rt),t+"")}function xt(t,e){var r,n,i=t.__data__;return("string"==(n=typeof(r=e))||"number"==n||"symbol"==n||"boolean"==n?"__proto__"!==r:null===r)?i["string"==typeof e?"string":"hash"]:i.map}function Ct(t,e){var r=function(t,e){return null==t?void 0:t[e]}(t,e);return mt(r)?r:void 0}function kt(t,e){var r=typeof t;return!!(e=null==e?a:e)&&("number"==r||"symbol"!=r&&m.test(t))&&t>-1&&t%1==0&&t<e}function Mt(t){var e=t&&t.constructor;return t===("function"==typeof e&&e.prototype||H)}var Lt=function(t){var e=0,r=0;return function(){var n=tt(),i=l-(n-r);if(r=n,i>0){if(++e>=o)return arguments[0]}else e=0;return t.apply(void 0,arguments)}}(j?function(t,e){return j(t,"toString",{configurable:!0,enumerable:!1,value:(r=e,function(){return r}),writable:!0});var r}:Rt);function Tt(t,e){return t===e||t!=t&&e!=e}var Ot=gt(function(){return arguments}())?gt:function(t){return Ht(t)&&_.call(t,"callee")&&!J.call(t,"callee")},Nt=Array.isArray;function St(t){return null!=t&&Et(t.length)&&!Dt(t)}var At=V||function(){return!1};function Dt(t){if(!Wt(t))return!1;var e=vt(t);return e==c||e==f||e==u||e==p}function Et(t){return"number"==typeof t&&t>-1&&t%1==0&&t<=a}function Wt(t){var e=typeof t;return null!=t&&("object"==e||"function"==e)}function Ht(t){return null!=t&&"object"==typeof t}var zt=O?function(t){return function(e){return t(e)}}(O):function(t){return Ht(t)&&Et(t.length)&&!!y[vt(t)]};function It(t){return St(t)?st(t,!0):yt(t)}var _t,Ft=(_t=function(t,e,r){bt(t,e,r)},wt(function(t,e){var r=-1,n=e.length,i=n>1?e[n-1]:void 0,o=n>2?e[2]:void 0;for(i=_t.length>3&&"function"==typeof i?(n--,i):void 0,o&&function(t,e,r){if(!Wt(r))return!1;var n=typeof e;return!!("number"==n?St(r)&&kt(e,r.length):"string"==n&&e in r)&&Tt(r[e],t)}(e[0],e[1],o)&&(i=n<3?void 0:i,n=1),t=Object(t);++r<n;){var l=e[r];l&&_t(t,l,r,i)}return t}));function Rt(t){return t}r.exports=Ft}).call(this,r(1),r(9)(t))},function(t,e){t.exports=function(t){return t.webpackPolyfill||(t.deprecate=function(){},t.paths=[],t.children||(t.children=[]),Object.defineProperty(t,"loaded",{enumerable:!0,get:function(){return t.l}}),Object.defineProperty(t,"id",{enumerable:!0,get:function(){return t.i}}),t.webpackPolyfill=1),t}},function(t,e,r){(function(t,n){var i=/%[sdj%]/g;e.format=function(t){if(!m(t)){for(var e=[],r=0;r<arguments.length;r++)e.push(a(arguments[r]));return e.join(" ")}r=1;for(var n=arguments,o=n.length,l=String(t).replace(i,function(t){if("%%"===t)return"%";if(r>=o)return t;switch(t){case"%s":return String(n[r++]);case"%d":return Number(n[r++]);case"%j":try{return JSON.stringify(n[r++])}catch(t){return"[Circular]"}default:return t}}),s=n[r];r<o;s=n[++r])v(s)||!w(s)?l+=" "+s:l+=" "+a(s);return l},e.deprecate=function(r,i){if(y(t.process))return function(){return e.deprecate(r,i).apply(this,arguments)};if(!0===n.noDeprecation)return r;var o=!1;return function(){if(!o){if(n.throwDeprecation)throw new Error(i);n.traceDeprecation?console.trace(i):console.error(i),o=!0}return r.apply(this,arguments)}};var o,l={};function a(t,r){var n={seen:[],stylize:u};return arguments.length>=3&&(n.depth=arguments[2]),arguments.length>=4&&(n.colors=arguments[3]),p(r)?n.showHidden=r:r&&e._extend(n,r),y(n.showHidden)&&(n.showHidden=!1),y(n.depth)&&(n.depth=2),y(n.colors)&&(n.colors=!1),y(n.customInspect)&&(n.customInspect=!0),n.colors&&(n.stylize=s),c(n,t,n.depth)}function s(t,e){var r=a.styles[e];return r?"["+a.colors[r][0]+"m"+t+"["+a.colors[r][1]+"m":t}function u(t,e){return t}function c(t,r,n){if(t.customInspect&&r&&k(r.inspect)&&r.inspect!==e.inspect&&(!r.constructor||r.constructor.prototype!==r)){var i=r.inspect(n,t);return m(i)||(i=c(t,i,n)),i}var o=function(t,e){if(y(e))return t.stylize("undefined","undefined");if(m(e)){var r="'"+JSON.stringify(e).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'";return t.stylize(r,"string")}if(g(e))return t.stylize(""+e,"number");if(p(e))return t.stylize(""+e,"boolean");if(v(e))return t.stylize("null","null")}(t,r);if(o)return o;var l=Object.keys(r),a=function(t){var e={};return t.forEach(function(t,r){e[t]=!0}),e}(l);if(t.showHidden&&(l=Object.getOwnPropertyNames(r)),C(r)&&(l.indexOf("message")>=0||l.indexOf("description")>=0))return f(r);if(0===l.length){if(k(r)){var s=r.name?": "+r.name:"";return t.stylize("[Function"+s+"]","special")}if(b(r))return t.stylize(RegExp.prototype.toString.call(r),"regexp");if(x(r))return t.stylize(Date.prototype.toString.call(r),"date");if(C(r))return f(r)}var u,w="",M=!1,L=["{","}"];(d(r)&&(M=!0,L=["[","]"]),k(r))&&(w=" [Function"+(r.name?": "+r.name:"")+"]");return b(r)&&(w=" "+RegExp.prototype.toString.call(r)),x(r)&&(w=" "+Date.prototype.toUTCString.call(r)),C(r)&&(w=" "+f(r)),0!==l.length||M&&0!=r.length?n<0?b(r)?t.stylize(RegExp.prototype.toString.call(r),"regexp"):t.stylize("[Object]","special"):(t.seen.push(r),u=M?function(t,e,r,n,i){for(var o=[],l=0,a=e.length;l<a;++l)O(e,String(l))?o.push(h(t,e,r,n,String(l),!0)):o.push("");return i.forEach(function(i){i.match(/^\d+$/)||o.push(h(t,e,r,n,i,!0))}),o}(t,r,n,a,l):l.map(function(e){return h(t,r,n,a,e,M)}),t.seen.pop(),function(t,e,r){if(t.reduce(function(t,e){return 0,e.indexOf("\n")>=0&&0,t+e.replace(/\u001b\[\d\d?m/g,"").length+1},0)>60)return r[0]+(""===e?"":e+"\n ")+" "+t.join(",\n  ")+" "+r[1];return r[0]+e+" "+t.join(", ")+" "+r[1]}(u,w,L)):L[0]+w+L[1]}function f(t){return"["+Error.prototype.toString.call(t)+"]"}function h(t,e,r,n,i,o){var l,a,s;if((s=Object.getOwnPropertyDescriptor(e,i)||{value:e[i]}).get?a=s.set?t.stylize("[Getter/Setter]","special"):t.stylize("[Getter]","special"):s.set&&(a=t.stylize("[Setter]","special")),O(n,i)||(l="["+i+"]"),a||(t.seen.indexOf(s.value)<0?(a=v(r)?c(t,s.value,null):c(t,s.value,r-1)).indexOf("\n")>-1&&(a=o?a.split("\n").map(function(t){return"  "+t}).join("\n").substr(2):"\n"+a.split("\n").map(function(t){return"   "+t}).join("\n")):a=t.stylize("[Circular]","special")),y(l)){if(o&&i.match(/^\d+$/))return a;(l=JSON.stringify(""+i)).match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(l=l.substr(1,l.length-2),l=t.stylize(l,"name")):(l=l.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),l=t.stylize(l,"string"))}return l+": "+a}function d(t){return Array.isArray(t)}function p(t){return"boolean"==typeof t}function v(t){return null===t}function g(t){return"number"==typeof t}function m(t){return"string"==typeof t}function y(t){return void 0===t}function b(t){return w(t)&&"[object RegExp]"===M(t)}function w(t){return"object"==typeof t&&null!==t}function x(t){return w(t)&&"[object Date]"===M(t)}function C(t){return w(t)&&("[object Error]"===M(t)||t instanceof Error)}function k(t){return"function"==typeof t}function M(t){return Object.prototype.toString.call(t)}function L(t){return t<10?"0"+t.toString(10):t.toString(10)}e.debuglog=function(t){if(y(o)&&(o=n.env.NODE_DEBUG||""),t=t.toUpperCase(),!l[t])if(new RegExp("\\b"+t+"\\b","i").test(o)){var r=n.pid;l[t]=function(){var n=e.format.apply(e,arguments);console.error("%s %d: %s",t,r,n)}}else l[t]=function(){};return l[t]},e.inspect=a,a.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]},a.styles={special:"cyan",number:"yellow",boolean:"yellow",undefined:"grey",null:"bold",string:"green",date:"magenta",regexp:"red"},e.isArray=d,e.isBoolean=p,e.isNull=v,e.isNullOrUndefined=function(t){return null==t},e.isNumber=g,e.isString=m,e.isSymbol=function(t){return"symbol"==typeof t},e.isUndefined=y,e.isRegExp=b,e.isObject=w,e.isDate=x,e.isError=C,e.isFunction=k,e.isPrimitive=function(t){return null===t||"boolean"==typeof t||"number"==typeof t||"string"==typeof t||"symbol"==typeof t||void 0===t},e.isBuffer=r(12);var T=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function O(t,e){return Object.prototype.hasOwnProperty.call(t,e)}e.log=function(){var t,r;console.log("%s - %s",(t=new Date,r=[L(t.getHours()),L(t.getMinutes()),L(t.getSeconds())].join(":"),[t.getDate(),T[t.getMonth()],r].join(" ")),e.format.apply(e,arguments))},e.inherits=r(13),e._extend=function(t,e){if(!e||!w(e))return t;for(var r=Object.keys(e),n=r.length;n--;)t[r[n]]=e[r[n]];return t}}).call(this,r(1),r(11))},function(t,e){var r,n,i=t.exports={};function o(){throw new Error("setTimeout has not been defined")}function l(){throw new Error("clearTimeout has not been defined")}function a(t){if(r===setTimeout)return setTimeout(t,0);if((r===o||!r)&&setTimeout)return r=setTimeout,setTimeout(t,0);try{return r(t,0)}catch(e){try{return r.call(null,t,0)}catch(e){return r.call(this,t,0)}}}!function(){try{r="function"==typeof setTimeout?setTimeout:o}catch(t){r=o}try{n="function"==typeof clearTimeout?clearTimeout:l}catch(t){n=l}}();var s,u=[],c=!1,f=-1;function h(){c&&s&&(c=!1,s.length?u=s.concat(u):f=-1,u.length&&d())}function d(){if(!c){var t=a(h);c=!0;for(var e=u.length;e;){for(s=u,u=[];++f<e;)s&&s[f].run();f=-1,e=u.length}s=null,c=!1,function(t){if(n===clearTimeout)return clearTimeout(t);if((n===l||!n)&&clearTimeout)return n=clearTimeout,clearTimeout(t);try{n(t)}catch(e){try{return n.call(null,t)}catch(e){return n.call(this,t)}}}(t)}}function p(t,e){this.fun=t,this.array=e}function v(){}i.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)e[r-1]=arguments[r];u.push(new p(t,e)),1!==u.length||c||a(d)},p.prototype.run=function(){this.fun.apply(null,this.array)},i.title="browser",i.browser=!0,i.env={},i.argv=[],i.version="",i.versions={},i.on=v,i.addListener=v,i.once=v,i.off=v,i.removeListener=v,i.removeAllListeners=v,i.emit=v,i.prependListener=v,i.prependOnceListener=v,i.listeners=function(t){return[]},i.binding=function(t){throw new Error("process.binding is not supported")},i.cwd=function(){return"/"},i.chdir=function(t){throw new Error("process.chdir is not supported")},i.umask=function(){return 0}},function(t,e){t.exports=function(t){return t&&"object"==typeof t&&"function"==typeof t.copy&&"function"==typeof t.fill&&"function"==typeof t.readUInt8}},function(t,e){"function"==typeof Object.create?t.exports=function(t,e){t.super_=e,t.prototype=Object.create(e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}})}:t.exports=function(t,e){t.super_=e;var r=function(){};r.prototype=e.prototype,t.prototype=new r,t.prototype.constructor=t}},function(t,e,r){"use strict";var n=function(){var t,e,r=window.navigator||window.clientInformation||{},n=[].concat(r.languages,r.language,r.userLanguage,r.browserLanguage,r.systemLanguage),i=[];for(e=0;e<n.length;e++)(t=n[e])&&(t=t.replace(/-.*/,"").toLowerCase())&&-1===i.indexOf(t)&&i.push(t);return i};t.exports={first:function(){var t=n();return t.length?t[0]:null},list:n,pick:function(t,e){var r,i=n(),o=null;for(e=e||null,r=0;r<i.length&&null===o;r++)-1!==t.indexOf(i[r])&&(o=i[r]);return null===o&&(o=e),o}}},function(t,e,r){"use strict";t.exports=function(t,e){var r=Object.keys(t),n={};return r.forEach(function(r){n[r]=t[r][e]}),n}},function(t,e){t.exports={run_console:{ja:"実行",en:"Run",es:"Ejecutar"},clear_console:{ja:"ログをクリア",en:"Clear",es:"Limpiar"},exit_console:{ja:"終了",en:"Exit",es:"Salir"}}},function(t,e,r){"use strict";var n=r(18),i=r(19);t.exports=function(t,e){return 1==arguments.length?n(t):n(i(t,e))}},function(t,e){t.exports=function(t,e){if("string"!=typeof t)throw new TypeError("String expected");e||(e=document);var r=/<([\w:]+)/.exec(t);if(!r)return e.createTextNode(t);t=t.replace(/^\s+|\s+$/g,"");var n=r[1];if("body"==n){var o=e.createElement("html");return o.innerHTML=t,o.removeChild(o.lastChild)}var l=i[n]||i._default,a=l[0],s=l[1],u=l[2];(o=e.createElement("div")).innerHTML=s+t+u;for(;a--;)o=o.lastChild;if(o.firstChild==o.lastChild)return o.removeChild(o.firstChild);var c=e.createDocumentFragment();for(;o.firstChild;)c.appendChild(o.removeChild(o.firstChild));return c};var r,n=!1;"undefined"!=typeof document&&((r=document.createElement("div")).innerHTML='  <link/><table></table><a href="/a">a</a><input type="checkbox"/>',n=!r.getElementsByTagName("link").length,r=void 0);var i={legend:[1,"<fieldset>","</fieldset>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],_default:n?[1,"X<div>","</div>"]:[0,"",""]};i.td=i.th=[3,"<table><tbody><tr>","</tr></tbody></table>"],i.option=i.optgroup=[1,'<select multiple="multiple">',"</select>"],i.thead=i.tbody=i.colgroup=i.caption=i.tfoot=[1,"<table>","</table>"],i.polyline=i.ellipse=i.polygon=i.circle=i.text=i.line=i.path=i.rect=i.g=[1,'<svg xmlns="http://www.w3.org/2000/svg" version="1.1">',"</svg>"]},function(t,e){t.exports=function(t){var e;e="object"==typeof arguments[1]&&arguments[1]?arguments[1]:Array.prototype.slice.call(arguments,1);return String(t).replace(/\{?\{([^{}]+)}}?/g,function(t,e){return function(e,r){return"{{"==e.substring(0,2)&&"}}"==e.substring(e.length-2)?"{"+r+"}":t.hasOwnProperty(r)?"function"==typeof t[r]?t[r]():t[r]:e}}(e))}},function(t,e,r){var n=r(21);"string"==typeof n&&(n=[[t.i,n,""]]);var i={hmr:!0,transform:void 0,insertInto:void 0};r(3)(n,i);n.locals&&(t.exports=n.locals)},function(t,e,r){(t.exports=r(2)(!1)).push([t.i,'@charset "UTF-8";\n.CodeMirror.cm-s-default {\n    border-bottom: #000 solid 1px;\n}\n\n.CodeMirror {\n    font-size: 16px;\n}\n\n.mirror-console-command {\n    margin-left: 15px;\n}\n\n.mirror-console-wrapper {\n    background-color: #f7f7f7;\n    outline: #000 solid 1px;\n}\n\n.mirror-console-button {\n    display: inline-block;\n    margin: 0.75em 0.25em;\n    font-size: 0.9em;\n    border: 0 none;\n    border-radius: 3px;\n    padding: 0.25em 1em;\n    color: white;\n}\n\n.mirror-console-button.mirror-console-run {\n    background-color: #5cb85c;\n}\n\n.mirror-console-button.mirror-console-clear {\n    background-color: #999999;\n}\n\n.mirror-console-button.mirror-console-exit {\n    background-color: red;\n}\n\n/* console */\n.mirror-console-log-row {\n    border-left: solid 10px #999;\n    line-height: 1.5;\n    white-space: pre;\n}\n\n.mirror-console-log-normal::before {\n    content: "▶";\n    color: #ddd;\n    margin-right: 0.5em;\n}\n\n.mirror-console-log-error::before {\n    content: "✘";\n    color: #dd6964;\n    margin-right: 0.5em;\n}\n\n.mirror-console-log-info::before {\n    content: "▶";\n    color: #8ee386;\n    margin-right: 0.5em;\n}\n\n.mirror-console-log-warn::before {\n    content: "⚠";\n    color: #ffd080;\n    margin-right: 0.5em;\n}\n\n.mirror-console-log-return::before {\n    content: "◀";\n    color: #ddd;\n    margin-right: 0.5em;\n}\n',""])},function(t,e){t.exports=function(t){var e="undefined"!=typeof window&&window.location;if(!e)throw new Error("fixUrls requires window.location");if(!t||"string"!=typeof t)return t;var r=e.protocol+"//"+e.host,n=r+e.pathname.replace(/\/[^\/]*$/,"/");return t.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,function(t,e){var i,o=e.trim().replace(/^"(.*)"$/,function(t,e){return e}).replace(/^'(.*)'$/,function(t,e){return e});return/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(o)?t:(i=0===o.indexOf("//")?o:0===o.indexOf("/")?r+o:n+o.replace(/^\.\//,""),"url("+JSON.stringify(i)+")")})}},function(t,e,r){var n=r(24);"string"==typeof n&&(n=[[t.i,n,""]]);var i={hmr:!0,transform:void 0,insertInto:void 0};r(3)(n,i);n.locals&&(t.exports=n.locals)},function(t,e,r){(t.exports=r(2)(!1)).push([t.i,"/* BASICS */\n\n.CodeMirror {\n  /* Set height, width, borders, and global font properties here */\n  font-family: monospace;\n  height: 300px;\n  color: black;\n  direction: ltr;\n}\n\n/* PADDING */\n\n.CodeMirror-lines {\n  padding: 4px 0; /* Vertical padding around content */\n}\n.CodeMirror pre {\n  padding: 0 4px; /* Horizontal padding of content */\n}\n\n.CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {\n  background-color: white; /* The little square between H and V scrollbars */\n}\n\n/* GUTTER */\n\n.CodeMirror-gutters {\n  border-right: 1px solid #ddd;\n  background-color: #f7f7f7;\n  white-space: nowrap;\n}\n.CodeMirror-linenumbers {}\n.CodeMirror-linenumber {\n  padding: 0 3px 0 5px;\n  min-width: 20px;\n  text-align: right;\n  color: #999;\n  white-space: nowrap;\n}\n\n.CodeMirror-guttermarker { color: black; }\n.CodeMirror-guttermarker-subtle { color: #999; }\n\n/* CURSOR */\n\n.CodeMirror-cursor {\n  border-left: 1px solid black;\n  border-right: none;\n  width: 0;\n}\n/* Shown when moving in bi-directional text */\n.CodeMirror div.CodeMirror-secondarycursor {\n  border-left: 1px solid silver;\n}\n.cm-fat-cursor .CodeMirror-cursor {\n  width: auto;\n  border: 0 !important;\n  background: #7e7;\n}\n.cm-fat-cursor div.CodeMirror-cursors {\n  z-index: 1;\n}\n.cm-fat-cursor-mark {\n  background-color: rgba(20, 255, 20, 0.5);\n  -webkit-animation: blink 1.06s steps(1) infinite;\n  -moz-animation: blink 1.06s steps(1) infinite;\n  animation: blink 1.06s steps(1) infinite;\n}\n.cm-animate-fat-cursor {\n  width: auto;\n  border: 0;\n  -webkit-animation: blink 1.06s steps(1) infinite;\n  -moz-animation: blink 1.06s steps(1) infinite;\n  animation: blink 1.06s steps(1) infinite;\n  background-color: #7e7;\n}\n@-moz-keyframes blink {\n  0% {}\n  50% { background-color: transparent; }\n  100% {}\n}\n@-webkit-keyframes blink {\n  0% {}\n  50% { background-color: transparent; }\n  100% {}\n}\n@keyframes blink {\n  0% {}\n  50% { background-color: transparent; }\n  100% {}\n}\n\n/* Can style cursor different in overwrite (non-insert) mode */\n.CodeMirror-overwrite .CodeMirror-cursor {}\n\n.cm-tab { display: inline-block; text-decoration: inherit; }\n\n.CodeMirror-rulers {\n  position: absolute;\n  left: 0; right: 0; top: -50px; bottom: -20px;\n  overflow: hidden;\n}\n.CodeMirror-ruler {\n  border-left: 1px solid #ccc;\n  top: 0; bottom: 0;\n  position: absolute;\n}\n\n/* DEFAULT THEME */\n\n.cm-s-default .cm-header {color: blue;}\n.cm-s-default .cm-quote {color: #090;}\n.cm-negative {color: #d44;}\n.cm-positive {color: #292;}\n.cm-header, .cm-strong {font-weight: bold;}\n.cm-em {font-style: italic;}\n.cm-link {text-decoration: underline;}\n.cm-strikethrough {text-decoration: line-through;}\n\n.cm-s-default .cm-keyword {color: #708;}\n.cm-s-default .cm-atom {color: #219;}\n.cm-s-default .cm-number {color: #164;}\n.cm-s-default .cm-def {color: #00f;}\n.cm-s-default .cm-variable,\n.cm-s-default .cm-punctuation,\n.cm-s-default .cm-property,\n.cm-s-default .cm-operator {}\n.cm-s-default .cm-variable-2 {color: #05a;}\n.cm-s-default .cm-variable-3, .cm-s-default .cm-type {color: #085;}\n.cm-s-default .cm-comment {color: #a50;}\n.cm-s-default .cm-string {color: #a11;}\n.cm-s-default .cm-string-2 {color: #f50;}\n.cm-s-default .cm-meta {color: #555;}\n.cm-s-default .cm-qualifier {color: #555;}\n.cm-s-default .cm-builtin {color: #30a;}\n.cm-s-default .cm-bracket {color: #997;}\n.cm-s-default .cm-tag {color: #170;}\n.cm-s-default .cm-attribute {color: #00c;}\n.cm-s-default .cm-hr {color: #999;}\n.cm-s-default .cm-link {color: #00c;}\n\n.cm-s-default .cm-error {color: #f00;}\n.cm-invalidchar {color: #f00;}\n\n.CodeMirror-composing { border-bottom: 2px solid; }\n\n/* Default styles for common addons */\n\ndiv.CodeMirror span.CodeMirror-matchingbracket {color: #0b0;}\ndiv.CodeMirror span.CodeMirror-nonmatchingbracket {color: #a22;}\n.CodeMirror-matchingtag { background: rgba(255, 150, 0, .3); }\n.CodeMirror-activeline-background {background: #e8f2ff;}\n\n/* STOP */\n\n/* The rest of this file contains styles related to the mechanics of\n   the editor. You probably shouldn't touch them. */\n\n.CodeMirror {\n  position: relative;\n  overflow: hidden;\n  background: white;\n}\n\n.CodeMirror-scroll {\n  overflow: scroll !important; /* Things will break if this is overridden */\n  /* 30px is the magic margin used to hide the element's real scrollbars */\n  /* See overflow: hidden in .CodeMirror */\n  margin-bottom: -30px; margin-right: -30px;\n  padding-bottom: 30px;\n  height: 100%;\n  outline: none; /* Prevent dragging from highlighting the element */\n  position: relative;\n}\n.CodeMirror-sizer {\n  position: relative;\n  border-right: 30px solid transparent;\n}\n\n/* The fake, visible scrollbars. Used to force redraw during scrolling\n   before actual scrolling happens, thus preventing shaking and\n   flickering artifacts. */\n.CodeMirror-vscrollbar, .CodeMirror-hscrollbar, .CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {\n  position: absolute;\n  z-index: 6;\n  display: none;\n}\n.CodeMirror-vscrollbar {\n  right: 0; top: 0;\n  overflow-x: hidden;\n  overflow-y: scroll;\n}\n.CodeMirror-hscrollbar {\n  bottom: 0; left: 0;\n  overflow-y: hidden;\n  overflow-x: scroll;\n}\n.CodeMirror-scrollbar-filler {\n  right: 0; bottom: 0;\n}\n.CodeMirror-gutter-filler {\n  left: 0; bottom: 0;\n}\n\n.CodeMirror-gutters {\n  position: absolute; left: 0; top: 0;\n  min-height: 100%;\n  z-index: 3;\n}\n.CodeMirror-gutter {\n  white-space: normal;\n  height: 100%;\n  display: inline-block;\n  vertical-align: top;\n  margin-bottom: -30px;\n}\n.CodeMirror-gutter-wrapper {\n  position: absolute;\n  z-index: 4;\n  background: none !important;\n  border: none !important;\n}\n.CodeMirror-gutter-background {\n  position: absolute;\n  top: 0; bottom: 0;\n  z-index: 4;\n}\n.CodeMirror-gutter-elt {\n  position: absolute;\n  cursor: default;\n  z-index: 4;\n}\n.CodeMirror-gutter-wrapper ::selection { background-color: transparent }\n.CodeMirror-gutter-wrapper ::-moz-selection { background-color: transparent }\n\n.CodeMirror-lines {\n  cursor: text;\n  min-height: 1px; /* prevents collapsing before first draw */\n}\n.CodeMirror pre {\n  /* Reset some styles that the rest of the page might have set */\n  -moz-border-radius: 0; -webkit-border-radius: 0; border-radius: 0;\n  border-width: 0;\n  background: transparent;\n  font-family: inherit;\n  font-size: inherit;\n  margin: 0;\n  white-space: pre;\n  word-wrap: normal;\n  line-height: inherit;\n  color: inherit;\n  z-index: 2;\n  position: relative;\n  overflow: visible;\n  -webkit-tap-highlight-color: transparent;\n  -webkit-font-variant-ligatures: contextual;\n  font-variant-ligatures: contextual;\n}\n.CodeMirror-wrap pre {\n  word-wrap: break-word;\n  white-space: pre-wrap;\n  word-break: normal;\n}\n\n.CodeMirror-linebackground {\n  position: absolute;\n  left: 0; right: 0; top: 0; bottom: 0;\n  z-index: 0;\n}\n\n.CodeMirror-linewidget {\n  position: relative;\n  z-index: 2;\n  padding: 0.1px; /* Force widget margins to stay inside of the container */\n}\n\n.CodeMirror-widget {}\n\n.CodeMirror-rtl pre { direction: rtl; }\n\n.CodeMirror-code {\n  outline: none;\n}\n\n/* Force content-box sizing for the elements where we expect it */\n.CodeMirror-scroll,\n.CodeMirror-sizer,\n.CodeMirror-gutter,\n.CodeMirror-gutters,\n.CodeMirror-linenumber {\n  -moz-box-sizing: content-box;\n  box-sizing: content-box;\n}\n\n.CodeMirror-measure {\n  position: absolute;\n  width: 100%;\n  height: 0;\n  overflow: hidden;\n  visibility: hidden;\n}\n\n.CodeMirror-cursor {\n  position: absolute;\n  pointer-events: none;\n}\n.CodeMirror-measure pre { position: static; }\n\ndiv.CodeMirror-cursors {\n  visibility: hidden;\n  position: relative;\n  z-index: 3;\n}\ndiv.CodeMirror-dragcursors {\n  visibility: visible;\n}\n\n.CodeMirror-focused div.CodeMirror-cursors {\n  visibility: visible;\n}\n\n.CodeMirror-selected { background: #d9d9d9; }\n.CodeMirror-focused .CodeMirror-selected { background: #d7d4f0; }\n.CodeMirror-crosshair { cursor: crosshair; }\n.CodeMirror-line::selection, .CodeMirror-line > span::selection, .CodeMirror-line > span > span::selection { background: #d7d4f0; }\n.CodeMirror-line::-moz-selection, .CodeMirror-line > span::-moz-selection, .CodeMirror-line > span > span::-moz-selection { background: #d7d4f0; }\n\n.cm-searching {\n  background-color: #ffa;\n  background-color: rgba(255, 255, 0, .4);\n}\n\n/* Used to force a border model for a node */\n.cm-force-border { padding-right: .1px; }\n\n@media print {\n  /* Hide the cursor when printing */\n  .CodeMirror div.CodeMirror-cursors {\n    visibility: hidden;\n  }\n}\n\n/* See issue #2901 */\n.cm-tab-wrap-hack:after { content: ''; }\n\n/* Help users use markselection to safely style text background */\nspan.CodeMirror-selectedtext { background: none; }\n",""])},function(t,e){t.exports='<div>\n    <div class="mirror-console-command">\n        <button class="mirror-console-button mirror-console-run">{run_console}</button>\n        <button class="mirror-console-button mirror-console-clear">{clear_console}</button>\n        <button class="mirror-console-button mirror-console-exit">{exit_console}</button>\n    </div>\n    <div class="mirror-console-log">\n    </div>\n</div>'},function(t,e){t.exports='<div>\n    <button class="mirror-console-button mirror-console-run">{run_console}</button>\n</div>'}])});

},{}],2:[function(require,module,exports){
require('../../modules/es.aggregate-error');
require('../../modules/es.object.to-string');
require('../../modules/es.promise');
require('../../modules/es.promise.all-settled');
require('../../modules/es.promise.any');
require('../../modules/es.promise.finally');
require('../../modules/es.string.iterator');
require('../../modules/web.dom-collections.iterator');
var path = require('../../internals/path');

module.exports = path.Promise;

},{"../../internals/path":65,"../../modules/es.aggregate-error":90,"../../modules/es.object.to-string":92,"../../modules/es.promise":96,"../../modules/es.promise.all-settled":93,"../../modules/es.promise.any":94,"../../modules/es.promise.finally":95,"../../modules/es.string.iterator":97,"../../modules/web.dom-collections.iterator":102}],3:[function(require,module,exports){
var parent = require('../../es/promise');
require('../../modules/esnext.aggregate-error');
// TODO: Remove from `core-js@4`
require('../../modules/esnext.promise.all-settled');
require('../../modules/esnext.promise.try');
require('../../modules/esnext.promise.any');

module.exports = parent;

},{"../../es/promise":2,"../../modules/esnext.aggregate-error":98,"../../modules/esnext.promise.all-settled":99,"../../modules/esnext.promise.any":100,"../../modules/esnext.promise.try":101}],4:[function(require,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};

},{}],5:[function(require,module,exports){
var isObject = require('../internals/is-object');

module.exports = function (it) {
  if (!isObject(it) && it !== null) {
    throw TypeError("Can't set " + String(it) + ' as a prototype');
  } return it;
};

},{"../internals/is-object":44}],6:[function(require,module,exports){
module.exports = function () { /* empty */ };

},{}],7:[function(require,module,exports){
module.exports = function (it, Constructor, name) {
  if (!(it instanceof Constructor)) {
    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
  } return it;
};

},{}],8:[function(require,module,exports){
var isObject = require('../internals/is-object');

module.exports = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};

},{"../internals/is-object":44}],9:[function(require,module,exports){
var toIndexedObject = require('../internals/to-indexed-object');
var toLength = require('../internals/to-length');
var toAbsoluteIndex = require('../internals/to-absolute-index');

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

},{"../internals/to-absolute-index":80,"../internals/to-indexed-object":81,"../internals/to-length":83}],10:[function(require,module,exports){
var wellKnownSymbol = require('../internals/well-known-symbol');

var ITERATOR = wellKnownSymbol('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR] = function () {
    return this;
  };
  // eslint-disable-next-line es/no-array-from, no-throw-literal -- required for testing
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

module.exports = function (exec, SKIP_CLOSING) {
  if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};

},{"../internals/well-known-symbol":89}],11:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],12:[function(require,module,exports){
var TO_STRING_TAG_SUPPORT = require('../internals/to-string-tag-support');
var classofRaw = require('../internals/classof-raw');
var wellKnownSymbol = require('../internals/well-known-symbol');

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};

},{"../internals/classof-raw":11,"../internals/to-string-tag-support":86,"../internals/well-known-symbol":89}],13:[function(require,module,exports){
var fails = require('../internals/fails');

module.exports = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  // eslint-disable-next-line es/no-object-getprototypeof -- required for testing
  return Object.getPrototypeOf(new F()) !== F.prototype;
});

},{"../internals/fails":29}],14:[function(require,module,exports){
'use strict';
var IteratorPrototype = require('../internals/iterators-core').IteratorPrototype;
var create = require('../internals/object-create');
var createPropertyDescriptor = require('../internals/create-property-descriptor');
var setToStringTag = require('../internals/set-to-string-tag');
var Iterators = require('../internals/iterators');

var returnThis = function () { return this; };

module.exports = function (IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = create(IteratorPrototype, { next: createPropertyDescriptor(1, next) });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
  Iterators[TO_STRING_TAG] = returnThis;
  return IteratorConstructor;
};

},{"../internals/create-property-descriptor":16,"../internals/iterators":49,"../internals/iterators-core":48,"../internals/object-create":55,"../internals/set-to-string-tag":73}],15:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var definePropertyModule = require('../internals/object-define-property');
var createPropertyDescriptor = require('../internals/create-property-descriptor');

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"../internals/create-property-descriptor":16,"../internals/descriptors":18,"../internals/object-define-property":57}],16:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],17:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var createIteratorConstructor = require('../internals/create-iterator-constructor');
var getPrototypeOf = require('../internals/object-get-prototype-of');
var setPrototypeOf = require('../internals/object-set-prototype-of');
var setToStringTag = require('../internals/set-to-string-tag');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var redefine = require('../internals/redefine');
var wellKnownSymbol = require('../internals/well-known-symbol');
var IS_PURE = require('../internals/is-pure');
var Iterators = require('../internals/iterators');
var IteratorsCore = require('../internals/iterators-core');

var IteratorPrototype = IteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR = wellKnownSymbol('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis = function () { return this; };

module.exports = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS && KIND in IterablePrototype) return IterablePrototype[KIND];
    switch (KIND) {
      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
    } return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = getPrototypeOf(anyNativeIterator.call(new Iterable()));
    if (IteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
      if (!IS_PURE && getPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
        if (setPrototypeOf) {
          setPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
        } else if (typeof CurrentIteratorPrototype[ITERATOR] != 'function') {
          createNonEnumerableProperty(CurrentIteratorPrototype, ITERATOR, returnThis);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
      if (IS_PURE) Iterators[TO_STRING_TAG] = returnThis;
    }
  }

  // fix Array.prototype.{ values, @@iterator }.name in V8 / FF
  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    INCORRECT_VALUES_NAME = true;
    defaultIterator = function values() { return nativeIterator.call(this); };
  }

  // define iterator
  if ((!IS_PURE || FORCED) && IterablePrototype[ITERATOR] !== defaultIterator) {
    createNonEnumerableProperty(IterablePrototype, ITERATOR, defaultIterator);
  }
  Iterators[NAME] = defaultIterator;

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        redefine(IterablePrototype, KEY, methods[KEY]);
      }
    } else $({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME }, methods);
  }

  return methods;
};

},{"../internals/create-iterator-constructor":14,"../internals/create-non-enumerable-property":15,"../internals/export":28,"../internals/is-pure":45,"../internals/iterators":49,"../internals/iterators-core":48,"../internals/object-get-prototype-of":59,"../internals/object-set-prototype-of":63,"../internals/redefine":69,"../internals/set-to-string-tag":73,"../internals/well-known-symbol":89}],18:[function(require,module,exports){
var fails = require('../internals/fails');

// Detect IE8's incomplete defineProperty implementation
module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});

},{"../internals/fails":29}],19:[function(require,module,exports){
var global = require('../internals/global');
var isObject = require('../internals/is-object');

var document = global.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};

},{"../internals/global":33,"../internals/is-object":44}],20:[function(require,module,exports){
// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
module.exports = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};

},{}],21:[function(require,module,exports){
module.exports = typeof window == 'object';

},{}],22:[function(require,module,exports){
var userAgent = require('../internals/engine-user-agent');

module.exports = /(?:iphone|ipod|ipad).*applewebkit/i.test(userAgent);

},{"../internals/engine-user-agent":25}],23:[function(require,module,exports){
var classof = require('../internals/classof-raw');
var global = require('../internals/global');

module.exports = classof(global.process) == 'process';

},{"../internals/classof-raw":11,"../internals/global":33}],24:[function(require,module,exports){
var userAgent = require('../internals/engine-user-agent');

module.exports = /web0s(?!.*chrome)/i.test(userAgent);

},{"../internals/engine-user-agent":25}],25:[function(require,module,exports){
var getBuiltIn = require('../internals/get-built-in');

module.exports = getBuiltIn('navigator', 'userAgent') || '';

},{"../internals/get-built-in":31}],26:[function(require,module,exports){
var global = require('../internals/global');
var userAgent = require('../internals/engine-user-agent');

var process = global.process;
var versions = process && process.versions;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  version = match[0] < 4 ? 1 : match[0] + match[1];
} else if (userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  }
}

module.exports = version && +version;

},{"../internals/engine-user-agent":25,"../internals/global":33}],27:[function(require,module,exports){
// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

},{}],28:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var getOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;
var isForced = require('../internals/is-forced');
var path = require('../internals/path');
var bind = require('../internals/function-bind-context');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var has = require('../internals/has');

var wrapConstructor = function (NativeConstructor) {
  var Wrapper = function (a, b, c) {
    if (this instanceof NativeConstructor) {
      switch (arguments.length) {
        case 0: return new NativeConstructor();
        case 1: return new NativeConstructor(a);
        case 2: return new NativeConstructor(a, b);
      } return new NativeConstructor(a, b, c);
    } return NativeConstructor.apply(this, arguments);
  };
  Wrapper.prototype = NativeConstructor.prototype;
  return Wrapper;
};

/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var PROTO = options.proto;

  var nativeSource = GLOBAL ? global : STATIC ? global[TARGET] : (global[TARGET] || {}).prototype;

  var target = GLOBAL ? path : path[TARGET] || (path[TARGET] = {});
  var targetPrototype = target.prototype;

  var FORCED, USE_NATIVE, VIRTUAL_PROTOTYPE;
  var key, sourceProperty, targetProperty, nativeProperty, resultProperty, descriptor;

  for (key in source) {
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contains in native
    USE_NATIVE = !FORCED && nativeSource && has(nativeSource, key);

    targetProperty = target[key];

    if (USE_NATIVE) if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(nativeSource, key);
      nativeProperty = descriptor && descriptor.value;
    } else nativeProperty = nativeSource[key];

    // export native or implementation
    sourceProperty = (USE_NATIVE && nativeProperty) ? nativeProperty : source[key];

    if (USE_NATIVE && typeof targetProperty === typeof sourceProperty) continue;

    // bind timers to global for call from export context
    if (options.bind && USE_NATIVE) resultProperty = bind(sourceProperty, global);
    // wrap global constructors for prevent changs in this version
    else if (options.wrap && USE_NATIVE) resultProperty = wrapConstructor(sourceProperty);
    // make static versions for prototype methods
    else if (PROTO && typeof sourceProperty == 'function') resultProperty = bind(Function.call, sourceProperty);
    // default case
    else resultProperty = sourceProperty;

    // add a flag to not completely full polyfills
    if (options.sham || (sourceProperty && sourceProperty.sham) || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(resultProperty, 'sham', true);
    }

    target[key] = resultProperty;

    if (PROTO) {
      VIRTUAL_PROTOTYPE = TARGET + 'Prototype';
      if (!has(path, VIRTUAL_PROTOTYPE)) {
        createNonEnumerableProperty(path, VIRTUAL_PROTOTYPE, {});
      }
      // export virtual prototype methods
      path[VIRTUAL_PROTOTYPE][key] = sourceProperty;
      // export real prototype methods
      if (options.real && targetPrototype && !targetPrototype[key]) {
        createNonEnumerableProperty(targetPrototype, key, sourceProperty);
      }
    }
  }
};

},{"../internals/create-non-enumerable-property":15,"../internals/function-bind-context":30,"../internals/global":33,"../internals/has":34,"../internals/is-forced":43,"../internals/object-get-own-property-descriptor":58,"../internals/path":65}],29:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

},{}],30:[function(require,module,exports){
var aFunction = require('../internals/a-function');

// optional / simple context binding
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"../internals/a-function":4}],31:[function(require,module,exports){
var path = require('../internals/path');
var global = require('../internals/global');

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global[namespace])
    : path[namespace] && path[namespace][method] || global[namespace] && global[namespace][method];
};

},{"../internals/global":33,"../internals/path":65}],32:[function(require,module,exports){
var classof = require('../internals/classof');
var Iterators = require('../internals/iterators');
var wellKnownSymbol = require('../internals/well-known-symbol');

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};

},{"../internals/classof":12,"../internals/iterators":49,"../internals/well-known-symbol":89}],33:[function(require,module,exports){
(function (global){(function (){
var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line es/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof global == 'object' && global) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],34:[function(require,module,exports){
var toObject = require('../internals/to-object');

var hasOwnProperty = {}.hasOwnProperty;

module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty.call(toObject(it), key);
};

},{"../internals/to-object":84}],35:[function(require,module,exports){
module.exports = {};

},{}],36:[function(require,module,exports){
var global = require('../internals/global');

module.exports = function (a, b) {
  var console = global.console;
  if (console && console.error) {
    arguments.length === 1 ? console.error(a) : console.error(a, b);
  }
};

},{"../internals/global":33}],37:[function(require,module,exports){
var getBuiltIn = require('../internals/get-built-in');

module.exports = getBuiltIn('document', 'documentElement');

},{"../internals/get-built-in":31}],38:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var fails = require('../internals/fails');
var createElement = require('../internals/document-create-element');

// Thank's IE8 for his funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- requied for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

},{"../internals/descriptors":18,"../internals/document-create-element":19,"../internals/fails":29}],39:[function(require,module,exports){
var fails = require('../internals/fails');
var classof = require('../internals/classof-raw');

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

},{"../internals/classof-raw":11,"../internals/fails":29}],40:[function(require,module,exports){
var store = require('../internals/shared-store');

var functionToString = Function.toString;

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (typeof store.inspectSource != 'function') {
  store.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

module.exports = store.inspectSource;

},{"../internals/shared-store":75}],41:[function(require,module,exports){
var NATIVE_WEAK_MAP = require('../internals/native-weak-map');
var global = require('../internals/global');
var isObject = require('../internals/is-object');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var objectHas = require('../internals/has');
var shared = require('../internals/shared-store');
var sharedKey = require('../internals/shared-key');
var hiddenKeys = require('../internals/hidden-keys');

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var WeakMap = global.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;
  set = function (it, metadata) {
    if (wmhas.call(store, it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    wmset.call(store, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget.call(store, it) || {};
  };
  has = function (it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    if (objectHas(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return objectHas(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return objectHas(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

},{"../internals/create-non-enumerable-property":15,"../internals/global":33,"../internals/has":34,"../internals/hidden-keys":35,"../internals/is-object":44,"../internals/native-weak-map":53,"../internals/shared-key":74,"../internals/shared-store":75}],42:[function(require,module,exports){
var wellKnownSymbol = require('../internals/well-known-symbol');
var Iterators = require('../internals/iterators');

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};

},{"../internals/iterators":49,"../internals/well-known-symbol":89}],43:[function(require,module,exports){
var fails = require('../internals/fails');

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;

},{"../internals/fails":29}],44:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],45:[function(require,module,exports){
module.exports = true;

},{}],46:[function(require,module,exports){
var anObject = require('../internals/an-object');
var isArrayIteratorMethod = require('../internals/is-array-iterator-method');
var toLength = require('../internals/to-length');
var bind = require('../internals/function-bind-context');
var getIteratorMethod = require('../internals/get-iterator-method');
var iteratorClose = require('../internals/iterator-close');

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that, 1 + AS_ENTRIES + INTERRUPTED);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = toLength(iterable.length); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && result instanceof Result) return result;
      } return new Result(false);
    }
    iterator = iterFn.call(iterable);
  }

  next = iterator.next;
  while (!(step = next.call(iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator);
      throw error;
    }
    if (typeof result == 'object' && result && result instanceof Result) return result;
  } return new Result(false);
};

},{"../internals/an-object":8,"../internals/function-bind-context":30,"../internals/get-iterator-method":32,"../internals/is-array-iterator-method":42,"../internals/iterator-close":47,"../internals/to-length":83}],47:[function(require,module,exports){
var anObject = require('../internals/an-object');

module.exports = function (iterator) {
  var returnMethod = iterator['return'];
  if (returnMethod !== undefined) {
    return anObject(returnMethod.call(iterator)).value;
  }
};

},{"../internals/an-object":8}],48:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');
var getPrototypeOf = require('../internals/object-get-prototype-of');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var has = require('../internals/has');
var wellKnownSymbol = require('../internals/well-known-symbol');
var IS_PURE = require('../internals/is-pure');

var ITERATOR = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS = false;

var returnThis = function () { return this; };

// `%IteratorPrototype%` object
// https://tc39.es/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

/* eslint-disable es/no-array-prototype-keys -- safe */
if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
  else {
    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

var NEW_ITERATOR_PROTOTYPE = IteratorPrototype == undefined || fails(function () {
  var test = {};
  // FF44- legacy iterators case
  return IteratorPrototype[ITERATOR].call(test) !== test;
});

if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {};

// `%IteratorPrototype%[@@iterator]()` method
// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
if ((!IS_PURE || NEW_ITERATOR_PROTOTYPE) && !has(IteratorPrototype, ITERATOR)) {
  createNonEnumerableProperty(IteratorPrototype, ITERATOR, returnThis);
}

module.exports = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};

},{"../internals/create-non-enumerable-property":15,"../internals/fails":29,"../internals/has":34,"../internals/is-pure":45,"../internals/object-get-prototype-of":59,"../internals/well-known-symbol":89}],49:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],50:[function(require,module,exports){
var global = require('../internals/global');
var getOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;
var macrotask = require('../internals/task').set;
var IS_IOS = require('../internals/engine-is-ios');
var IS_WEBOS_WEBKIT = require('../internals/engine-is-webos-webkit');
var IS_NODE = require('../internals/engine-is-node');

var MutationObserver = global.MutationObserver || global.WebKitMutationObserver;
var document = global.document;
var process = global.process;
var Promise = global.Promise;
// Node.js 11 shows ExperimentalWarning on getting `queueMicrotask`
var queueMicrotaskDescriptor = getOwnPropertyDescriptor(global, 'queueMicrotask');
var queueMicrotask = queueMicrotaskDescriptor && queueMicrotaskDescriptor.value;

var flush, head, last, notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!queueMicrotask) {
  flush = function () {
    var parent, fn;
    if (IS_NODE && (parent = process.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (error) {
        if (head) notify();
        else last = undefined;
        throw error;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
  // also except WebOS Webkit https://github.com/zloirock/core-js/issues/898
  if (!IS_IOS && !IS_NODE && !IS_WEBOS_WEBKIT && MutationObserver && document) {
    toggle = true;
    node = document.createTextNode('');
    new MutationObserver(flush).observe(node, { characterData: true });
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    promise = Promise.resolve(undefined);
    // workaround of WebKit ~ iOS Safari 10.1 bug
    promise.constructor = Promise;
    then = promise.then;
    notify = function () {
      then.call(promise, flush);
    };
  // Node.js without promises
  } else if (IS_NODE) {
    notify = function () {
      process.nextTick(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }
}

module.exports = queueMicrotask || function (fn) {
  var task = { fn: fn, next: undefined };
  if (last) last.next = task;
  if (!head) {
    head = task;
    notify();
  } last = task;
};

},{"../internals/engine-is-ios":22,"../internals/engine-is-node":23,"../internals/engine-is-webos-webkit":24,"../internals/global":33,"../internals/object-get-own-property-descriptor":58,"../internals/task":79}],51:[function(require,module,exports){
var global = require('../internals/global');

module.exports = global.Promise;

},{"../internals/global":33}],52:[function(require,module,exports){
/* eslint-disable es/no-symbol -- required for testing */
var V8_VERSION = require('../internals/engine-v8-version');
var fails = require('../internals/fails');

// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol();
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  return !String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});

},{"../internals/engine-v8-version":26,"../internals/fails":29}],53:[function(require,module,exports){
var global = require('../internals/global');
var inspectSource = require('../internals/inspect-source');

var WeakMap = global.WeakMap;

module.exports = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

},{"../internals/global":33,"../internals/inspect-source":40}],54:[function(require,module,exports){
'use strict';
var aFunction = require('../internals/a-function');

var PromiseCapability = function (C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject = aFunction(reject);
};

// `NewPromiseCapability` abstract operation
// https://tc39.es/ecma262/#sec-newpromisecapability
module.exports.f = function (C) {
  return new PromiseCapability(C);
};

},{"../internals/a-function":4}],55:[function(require,module,exports){
var anObject = require('../internals/an-object');
var defineProperties = require('../internals/object-define-properties');
var enumBugKeys = require('../internals/enum-bug-keys');
var hiddenKeys = require('../internals/hidden-keys');
var html = require('../internals/html');
var documentCreateElement = require('../internals/document-create-element');
var sharedKey = require('../internals/shared-key');

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  activeXDocument = null; // avoid memory leak
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  // https://github.com/zloirock/core-js/issues/475
  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    /* global ActiveXObject -- old IE */
    activeXDocument = document.domain && new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = activeXDocument ? NullProtoObjectViaActiveX(activeXDocument) : NullProtoObjectViaIFrame();
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : defineProperties(result, Properties);
};

},{"../internals/an-object":8,"../internals/document-create-element":19,"../internals/enum-bug-keys":27,"../internals/hidden-keys":35,"../internals/html":37,"../internals/object-define-properties":56,"../internals/shared-key":74}],56:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var definePropertyModule = require('../internals/object-define-property');
var anObject = require('../internals/an-object');
var objectKeys = require('../internals/object-keys');

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es/no-object-defineproperties -- safe
module.exports = DESCRIPTORS ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) definePropertyModule.f(O, key = keys[index++], Properties[key]);
  return O;
};

},{"../internals/an-object":8,"../internals/descriptors":18,"../internals/object-define-property":57,"../internals/object-keys":61}],57:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');
var anObject = require('../internals/an-object');
var toPrimitive = require('../internals/to-primitive');

// eslint-disable-next-line es/no-object-defineproperty -- safe
var $defineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
exports.f = DESCRIPTORS ? $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"../internals/an-object":8,"../internals/descriptors":18,"../internals/ie8-dom-define":38,"../internals/to-primitive":85}],58:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var propertyIsEnumerableModule = require('../internals/object-property-is-enumerable');
var createPropertyDescriptor = require('../internals/create-property-descriptor');
var toIndexedObject = require('../internals/to-indexed-object');
var toPrimitive = require('../internals/to-primitive');
var has = require('../internals/has');
var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!propertyIsEnumerableModule.f.call(O, P), O[P]);
};

},{"../internals/create-property-descriptor":16,"../internals/descriptors":18,"../internals/has":34,"../internals/ie8-dom-define":38,"../internals/object-property-is-enumerable":62,"../internals/to-indexed-object":81,"../internals/to-primitive":85}],59:[function(require,module,exports){
var has = require('../internals/has');
var toObject = require('../internals/to-object');
var sharedKey = require('../internals/shared-key');
var CORRECT_PROTOTYPE_GETTER = require('../internals/correct-prototype-getter');

var IE_PROTO = sharedKey('IE_PROTO');
var ObjectPrototype = Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
// eslint-disable-next-line es/no-object-getprototypeof -- safe
module.exports = CORRECT_PROTOTYPE_GETTER ? Object.getPrototypeOf : function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectPrototype : null;
};

},{"../internals/correct-prototype-getter":13,"../internals/has":34,"../internals/shared-key":74,"../internals/to-object":84}],60:[function(require,module,exports){
var has = require('../internals/has');
var toIndexedObject = require('../internals/to-indexed-object');
var indexOf = require('../internals/array-includes').indexOf;
var hiddenKeys = require('../internals/hidden-keys');

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};

},{"../internals/array-includes":9,"../internals/has":34,"../internals/hidden-keys":35,"../internals/to-indexed-object":81}],61:[function(require,module,exports){
var internalObjectKeys = require('../internals/object-keys-internal');
var enumBugKeys = require('../internals/enum-bug-keys');

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
// eslint-disable-next-line es/no-object-keys -- safe
module.exports = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys);
};

},{"../internals/enum-bug-keys":27,"../internals/object-keys-internal":60}],62:[function(require,module,exports){
'use strict';
var $propertyIsEnumerable = {}.propertyIsEnumerable;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;

},{}],63:[function(require,module,exports){
/* eslint-disable no-proto -- safe */
var anObject = require('../internals/an-object');
var aPossiblePrototype = require('../internals/a-possible-prototype');

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
// eslint-disable-next-line es/no-object-setprototypeof -- safe
module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    setter.call(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    anObject(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter.call(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);

},{"../internals/a-possible-prototype":5,"../internals/an-object":8}],64:[function(require,module,exports){
'use strict';
var TO_STRING_TAG_SUPPORT = require('../internals/to-string-tag-support');
var classof = require('../internals/classof');

// `Object.prototype.toString` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.tostring
module.exports = TO_STRING_TAG_SUPPORT ? {}.toString : function toString() {
  return '[object ' + classof(this) + ']';
};

},{"../internals/classof":12,"../internals/to-string-tag-support":86}],65:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],66:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return { error: false, value: exec() };
  } catch (error) {
    return { error: true, value: error };
  }
};

},{}],67:[function(require,module,exports){
var anObject = require('../internals/an-object');
var isObject = require('../internals/is-object');
var newPromiseCapability = require('../internals/new-promise-capability');

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};

},{"../internals/an-object":8,"../internals/is-object":44,"../internals/new-promise-capability":54}],68:[function(require,module,exports){
var redefine = require('../internals/redefine');

module.exports = function (target, src, options) {
  for (var key in src) {
    if (options && options.unsafe && target[key]) target[key] = src[key];
    else redefine(target, key, src[key], options);
  } return target;
};

},{"../internals/redefine":69}],69:[function(require,module,exports){
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');

module.exports = function (target, key, value, options) {
  if (options && options.enumerable) target[key] = value;
  else createNonEnumerableProperty(target, key, value);
};

},{"../internals/create-non-enumerable-property":15}],70:[function(require,module,exports){
// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

},{}],71:[function(require,module,exports){
var global = require('../internals/global');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');

module.exports = function (key, value) {
  try {
    createNonEnumerableProperty(global, key, value);
  } catch (error) {
    global[key] = value;
  } return value;
};

},{"../internals/create-non-enumerable-property":15,"../internals/global":33}],72:[function(require,module,exports){
'use strict';
var getBuiltIn = require('../internals/get-built-in');
var definePropertyModule = require('../internals/object-define-property');
var wellKnownSymbol = require('../internals/well-known-symbol');
var DESCRIPTORS = require('../internals/descriptors');

var SPECIES = wellKnownSymbol('species');

module.exports = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
  var defineProperty = definePropertyModule.f;

  if (DESCRIPTORS && Constructor && !Constructor[SPECIES]) {
    defineProperty(Constructor, SPECIES, {
      configurable: true,
      get: function () { return this; }
    });
  }
};

},{"../internals/descriptors":18,"../internals/get-built-in":31,"../internals/object-define-property":57,"../internals/well-known-symbol":89}],73:[function(require,module,exports){
var TO_STRING_TAG_SUPPORT = require('../internals/to-string-tag-support');
var defineProperty = require('../internals/object-define-property').f;
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var has = require('../internals/has');
var toString = require('../internals/object-to-string');
var wellKnownSymbol = require('../internals/well-known-symbol');

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

module.exports = function (it, TAG, STATIC, SET_METHOD) {
  if (it) {
    var target = STATIC ? it : it.prototype;
    if (!has(target, TO_STRING_TAG)) {
      defineProperty(target, TO_STRING_TAG, { configurable: true, value: TAG });
    }
    if (SET_METHOD && !TO_STRING_TAG_SUPPORT) {
      createNonEnumerableProperty(target, 'toString', toString);
    }
  }
};

},{"../internals/create-non-enumerable-property":15,"../internals/has":34,"../internals/object-define-property":57,"../internals/object-to-string":64,"../internals/to-string-tag-support":86,"../internals/well-known-symbol":89}],74:[function(require,module,exports){
var shared = require('../internals/shared');
var uid = require('../internals/uid');

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

},{"../internals/shared":76,"../internals/uid":87}],75:[function(require,module,exports){
var global = require('../internals/global');
var setGlobal = require('../internals/set-global');

var SHARED = '__core-js_shared__';
var store = global[SHARED] || setGlobal(SHARED, {});

module.exports = store;

},{"../internals/global":33,"../internals/set-global":71}],76:[function(require,module,exports){
var IS_PURE = require('../internals/is-pure');
var store = require('../internals/shared-store');

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.15.1',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
});

},{"../internals/is-pure":45,"../internals/shared-store":75}],77:[function(require,module,exports){
var anObject = require('../internals/an-object');
var aFunction = require('../internals/a-function');
var wellKnownSymbol = require('../internals/well-known-symbol');

var SPECIES = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.es/ecma262/#sec-speciesconstructor
module.exports = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? defaultConstructor : aFunction(S);
};

},{"../internals/a-function":4,"../internals/an-object":8,"../internals/well-known-symbol":89}],78:[function(require,module,exports){
var toInteger = require('../internals/to-integer');
var requireObjectCoercible = require('../internals/require-object-coercible');

// `String.prototype.{ codePointAt, at }` methods implementation
var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = String(requireObjectCoercible($this));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

module.exports = {
  // `String.prototype.codePointAt` method
  // https://tc39.es/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};

},{"../internals/require-object-coercible":70,"../internals/to-integer":82}],79:[function(require,module,exports){
var global = require('../internals/global');
var fails = require('../internals/fails');
var bind = require('../internals/function-bind-context');
var html = require('../internals/html');
var createElement = require('../internals/document-create-element');
var IS_IOS = require('../internals/engine-is-ios');
var IS_NODE = require('../internals/engine-is-node');

var location = global.location;
var set = global.setImmediate;
var clear = global.clearImmediate;
var process = global.process;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;

var run = function (id) {
  // eslint-disable-next-line no-prototype-builtins -- safe
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run(id);
  };
};

var listener = function (event) {
  run(event.data);
};

var post = function (id) {
  // old engines have not location.origin
  global.postMessage(id + '', location.protocol + '//' + location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set || !clear) {
  set = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func -- spec requirement
      (typeof fn == 'function' ? fn : Function(fn)).apply(undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (IS_NODE) {
    defer = function (id) {
      process.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  // except iOS - https://github.com/zloirock/core-js/issues/624
  } else if (MessageChannel && !IS_IOS) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = bind(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (
    global.addEventListener &&
    typeof postMessage == 'function' &&
    !global.importScripts &&
    location && location.protocol !== 'file:' &&
    !fails(post)
  ) {
    defer = post;
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in createElement('script')) {
    defer = function (id) {
      html.appendChild(createElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

module.exports = {
  set: set,
  clear: clear
};

},{"../internals/document-create-element":19,"../internals/engine-is-ios":22,"../internals/engine-is-node":23,"../internals/fails":29,"../internals/function-bind-context":30,"../internals/global":33,"../internals/html":37}],80:[function(require,module,exports){
var toInteger = require('../internals/to-integer');

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
module.exports = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};

},{"../internals/to-integer":82}],81:[function(require,module,exports){
// toObject with fallback for non-array-like ES3 strings
var IndexedObject = require('../internals/indexed-object');
var requireObjectCoercible = require('../internals/require-object-coercible');

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};

},{"../internals/indexed-object":39,"../internals/require-object-coercible":70}],82:[function(require,module,exports){
var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.es/ecma262/#sec-tointeger
module.exports = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

},{}],83:[function(require,module,exports){
var toInteger = require('../internals/to-integer');

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength
module.exports = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

},{"../internals/to-integer":82}],84:[function(require,module,exports){
var requireObjectCoercible = require('../internals/require-object-coercible');

// `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject
module.exports = function (argument) {
  return Object(requireObjectCoercible(argument));
};

},{"../internals/require-object-coercible":70}],85:[function(require,module,exports){
var isObject = require('../internals/is-object');

// `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"../internals/is-object":44}],86:[function(require,module,exports){
var wellKnownSymbol = require('../internals/well-known-symbol');

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG] = 'z';

module.exports = String(test) === '[object z]';

},{"../internals/well-known-symbol":89}],87:[function(require,module,exports){
var id = 0;
var postfix = Math.random();

module.exports = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

},{}],88:[function(require,module,exports){
/* eslint-disable es/no-symbol -- required for testing */
var NATIVE_SYMBOL = require('../internals/native-symbol');

module.exports = NATIVE_SYMBOL
  && !Symbol.sham
  && typeof Symbol.iterator == 'symbol';

},{"../internals/native-symbol":52}],89:[function(require,module,exports){
var global = require('../internals/global');
var shared = require('../internals/shared');
var has = require('../internals/has');
var uid = require('../internals/uid');
var NATIVE_SYMBOL = require('../internals/native-symbol');
var USE_SYMBOL_AS_UID = require('../internals/use-symbol-as-uid');

var WellKnownSymbolsStore = shared('wks');
var Symbol = global.Symbol;
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol : Symbol && Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!has(WellKnownSymbolsStore, name) || !(NATIVE_SYMBOL || typeof WellKnownSymbolsStore[name] == 'string')) {
    if (NATIVE_SYMBOL && has(Symbol, name)) {
      WellKnownSymbolsStore[name] = Symbol[name];
    } else {
      WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
    }
  } return WellKnownSymbolsStore[name];
};

},{"../internals/global":33,"../internals/has":34,"../internals/native-symbol":52,"../internals/shared":76,"../internals/uid":87,"../internals/use-symbol-as-uid":88}],90:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var getPrototypeOf = require('../internals/object-get-prototype-of');
var setPrototypeOf = require('../internals/object-set-prototype-of');
var create = require('../internals/object-create');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var createPropertyDescriptor = require('../internals/create-property-descriptor');
var iterate = require('../internals/iterate');

var $AggregateError = function AggregateError(errors, message) {
  var that = this;
  if (!(that instanceof $AggregateError)) return new $AggregateError(errors, message);
  if (setPrototypeOf) {
    // eslint-disable-next-line unicorn/error-message -- expected
    that = setPrototypeOf(new Error(undefined), getPrototypeOf(that));
  }
  if (message !== undefined) createNonEnumerableProperty(that, 'message', String(message));
  var errorsArray = [];
  iterate(errors, errorsArray.push, { that: errorsArray });
  createNonEnumerableProperty(that, 'errors', errorsArray);
  return that;
};

$AggregateError.prototype = create(Error.prototype, {
  constructor: createPropertyDescriptor(5, $AggregateError),
  message: createPropertyDescriptor(5, ''),
  name: createPropertyDescriptor(5, 'AggregateError')
});

// `AggregateError` constructor
// https://tc39.es/ecma262/#sec-aggregate-error-constructor
$({ global: true }, {
  AggregateError: $AggregateError
});

},{"../internals/create-non-enumerable-property":15,"../internals/create-property-descriptor":16,"../internals/export":28,"../internals/iterate":46,"../internals/object-create":55,"../internals/object-get-prototype-of":59,"../internals/object-set-prototype-of":63}],91:[function(require,module,exports){
'use strict';
var toIndexedObject = require('../internals/to-indexed-object');
var addToUnscopables = require('../internals/add-to-unscopables');
var Iterators = require('../internals/iterators');
var InternalStateModule = require('../internals/internal-state');
var defineIterator = require('../internals/define-iterator');

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.es/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.es/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.es/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.es/ecma262/#sec-createarrayiterator
module.exports = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = undefined;
    return { value: undefined, done: true };
  }
  if (kind == 'keys') return { value: index, done: false };
  if (kind == 'values') return { value: target[index], done: false };
  return { value: [index, target[index]], done: false };
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
// https://tc39.es/ecma262/#sec-createmappedargumentsobject
Iterators.Arguments = Iterators.Array;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"../internals/add-to-unscopables":6,"../internals/define-iterator":17,"../internals/internal-state":41,"../internals/iterators":49,"../internals/to-indexed-object":81}],92:[function(require,module,exports){
// empty

},{}],93:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var aFunction = require('../internals/a-function');
var newPromiseCapabilityModule = require('../internals/new-promise-capability');
var perform = require('../internals/perform');
var iterate = require('../internals/iterate');

// `Promise.allSettled` method
// https://tc39.es/ecma262/#sec-promise.allsettled
$({ target: 'Promise', stat: true }, {
  allSettled: function allSettled(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var promiseResolve = aFunction(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        promiseResolve.call(C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = { status: 'fulfilled', value: value };
          --remaining || resolve(values);
        }, function (error) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = { status: 'rejected', reason: error };
          --remaining || resolve(values);
        });
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});

},{"../internals/a-function":4,"../internals/export":28,"../internals/iterate":46,"../internals/new-promise-capability":54,"../internals/perform":66}],94:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var aFunction = require('../internals/a-function');
var getBuiltIn = require('../internals/get-built-in');
var newPromiseCapabilityModule = require('../internals/new-promise-capability');
var perform = require('../internals/perform');
var iterate = require('../internals/iterate');

var PROMISE_ANY_ERROR = 'No one promise resolved';

// `Promise.any` method
// https://tc39.es/ecma262/#sec-promise.any
$({ target: 'Promise', stat: true }, {
  any: function any(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var promiseResolve = aFunction(C.resolve);
      var errors = [];
      var counter = 0;
      var remaining = 1;
      var alreadyResolved = false;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyRejected = false;
        errors.push(undefined);
        remaining++;
        promiseResolve.call(C, promise).then(function (value) {
          if (alreadyRejected || alreadyResolved) return;
          alreadyResolved = true;
          resolve(value);
        }, function (error) {
          if (alreadyRejected || alreadyResolved) return;
          alreadyRejected = true;
          errors[index] = error;
          --remaining || reject(new (getBuiltIn('AggregateError'))(errors, PROMISE_ANY_ERROR));
        });
      });
      --remaining || reject(new (getBuiltIn('AggregateError'))(errors, PROMISE_ANY_ERROR));
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});

},{"../internals/a-function":4,"../internals/export":28,"../internals/get-built-in":31,"../internals/iterate":46,"../internals/new-promise-capability":54,"../internals/perform":66}],95:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var IS_PURE = require('../internals/is-pure');
var NativePromise = require('../internals/native-promise-constructor');
var fails = require('../internals/fails');
var getBuiltIn = require('../internals/get-built-in');
var speciesConstructor = require('../internals/species-constructor');
var promiseResolve = require('../internals/promise-resolve');
var redefine = require('../internals/redefine');

// Safari bug https://bugs.webkit.org/show_bug.cgi?id=200829
var NON_GENERIC = !!NativePromise && fails(function () {
  NativePromise.prototype['finally'].call({ then: function () { /* empty */ } }, function () { /* empty */ });
});

// `Promise.prototype.finally` method
// https://tc39.es/ecma262/#sec-promise.prototype.finally
$({ target: 'Promise', proto: true, real: true, forced: NON_GENERIC }, {
  'finally': function (onFinally) {
    var C = speciesConstructor(this, getBuiltIn('Promise'));
    var isFunction = typeof onFinally == 'function';
    return this.then(
      isFunction ? function (x) {
        return promiseResolve(C, onFinally()).then(function () { return x; });
      } : onFinally,
      isFunction ? function (e) {
        return promiseResolve(C, onFinally()).then(function () { throw e; });
      } : onFinally
    );
  }
});

// makes sure that native promise-based APIs `Promise#finally` properly works with patched `Promise#then`
if (!IS_PURE && typeof NativePromise == 'function') {
  var method = getBuiltIn('Promise').prototype['finally'];
  if (NativePromise.prototype['finally'] !== method) {
    redefine(NativePromise.prototype, 'finally', method, { unsafe: true });
  }
}

},{"../internals/export":28,"../internals/fails":29,"../internals/get-built-in":31,"../internals/is-pure":45,"../internals/native-promise-constructor":51,"../internals/promise-resolve":67,"../internals/redefine":69,"../internals/species-constructor":77}],96:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var IS_PURE = require('../internals/is-pure');
var global = require('../internals/global');
var getBuiltIn = require('../internals/get-built-in');
var NativePromise = require('../internals/native-promise-constructor');
var redefine = require('../internals/redefine');
var redefineAll = require('../internals/redefine-all');
var setPrototypeOf = require('../internals/object-set-prototype-of');
var setToStringTag = require('../internals/set-to-string-tag');
var setSpecies = require('../internals/set-species');
var isObject = require('../internals/is-object');
var aFunction = require('../internals/a-function');
var anInstance = require('../internals/an-instance');
var inspectSource = require('../internals/inspect-source');
var iterate = require('../internals/iterate');
var checkCorrectnessOfIteration = require('../internals/check-correctness-of-iteration');
var speciesConstructor = require('../internals/species-constructor');
var task = require('../internals/task').set;
var microtask = require('../internals/microtask');
var promiseResolve = require('../internals/promise-resolve');
var hostReportErrors = require('../internals/host-report-errors');
var newPromiseCapabilityModule = require('../internals/new-promise-capability');
var perform = require('../internals/perform');
var InternalStateModule = require('../internals/internal-state');
var isForced = require('../internals/is-forced');
var wellKnownSymbol = require('../internals/well-known-symbol');
var IS_BROWSER = require('../internals/engine-is-browser');
var IS_NODE = require('../internals/engine-is-node');
var V8_VERSION = require('../internals/engine-v8-version');

var SPECIES = wellKnownSymbol('species');
var PROMISE = 'Promise';
var getInternalState = InternalStateModule.get;
var setInternalState = InternalStateModule.set;
var getInternalPromiseState = InternalStateModule.getterFor(PROMISE);
var NativePromisePrototype = NativePromise && NativePromise.prototype;
var PromiseConstructor = NativePromise;
var PromiseConstructorPrototype = NativePromisePrototype;
var TypeError = global.TypeError;
var document = global.document;
var process = global.process;
var newPromiseCapability = newPromiseCapabilityModule.f;
var newGenericPromiseCapability = newPromiseCapability;
var DISPATCH_EVENT = !!(document && document.createEvent && global.dispatchEvent);
var NATIVE_REJECTION_EVENT = typeof PromiseRejectionEvent == 'function';
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;
var SUBCLASSING = false;
var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

var FORCED = isForced(PROMISE, function () {
  var GLOBAL_CORE_JS_PROMISE = inspectSource(PromiseConstructor) !== String(PromiseConstructor);
  // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
  // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
  // We can't detect it synchronously, so just check versions
  if (!GLOBAL_CORE_JS_PROMISE && V8_VERSION === 66) return true;
  // We need Promise#finally in the pure version for preventing prototype pollution
  if (IS_PURE && !PromiseConstructorPrototype['finally']) return true;
  // We can't use @@species feature detection in V8 since it causes
  // deoptimization and performance degradation
  // https://github.com/zloirock/core-js/issues/679
  if (V8_VERSION >= 51 && /native code/.test(PromiseConstructor)) return false;
  // Detect correctness of subclassing with @@species support
  var promise = new PromiseConstructor(function (resolve) { resolve(1); });
  var FakePromise = function (exec) {
    exec(function () { /* empty */ }, function () { /* empty */ });
  };
  var constructor = promise.constructor = {};
  constructor[SPECIES] = FakePromise;
  SUBCLASSING = promise.then(function () { /* empty */ }) instanceof FakePromise;
  if (!SUBCLASSING) return true;
  // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
  return !GLOBAL_CORE_JS_PROMISE && IS_BROWSER && !NATIVE_REJECTION_EVENT;
});

var INCORRECT_ITERATION = FORCED || !checkCorrectnessOfIteration(function (iterable) {
  PromiseConstructor.all(iterable)['catch'](function () { /* empty */ });
});

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};

var notify = function (state, isReject) {
  if (state.notified) return;
  state.notified = true;
  var chain = state.reactions;
  microtask(function () {
    var value = state.value;
    var ok = state.state == FULFILLED;
    var index = 0;
    // variable length - can't use forEach
    while (chain.length > index) {
      var reaction = chain[index++];
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then, exited;
      try {
        if (handler) {
          if (!ok) {
            if (state.rejection === UNHANDLED) onHandleUnhandled(state);
            state.rejection = HANDLED;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value); // can throw
            if (domain) {
              domain.exit();
              exited = true;
            }
          }
          if (result === reaction.promise) {
            reject(TypeError('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (error) {
        if (domain && !exited) domain.exit();
        reject(error);
      }
    }
    state.reactions = [];
    state.notified = false;
    if (isReject && !state.rejection) onUnhandled(state);
  });
};

var dispatchEvent = function (name, promise, reason) {
  var event, handler;
  if (DISPATCH_EVENT) {
    event = document.createEvent('Event');
    event.promise = promise;
    event.reason = reason;
    event.initEvent(name, false, true);
    global.dispatchEvent(event);
  } else event = { promise: promise, reason: reason };
  if (!NATIVE_REJECTION_EVENT && (handler = global['on' + name])) handler(event);
  else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
};

var onUnhandled = function (state) {
  task.call(global, function () {
    var promise = state.facade;
    var value = state.value;
    var IS_UNHANDLED = isUnhandled(state);
    var result;
    if (IS_UNHANDLED) {
      result = perform(function () {
        if (IS_NODE) {
          process.emit('unhandledRejection', value, promise);
        } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      state.rejection = IS_NODE || isUnhandled(state) ? UNHANDLED : HANDLED;
      if (result.error) throw result.value;
    }
  });
};

var isUnhandled = function (state) {
  return state.rejection !== HANDLED && !state.parent;
};

var onHandleUnhandled = function (state) {
  task.call(global, function () {
    var promise = state.facade;
    if (IS_NODE) {
      process.emit('rejectionHandled', promise);
    } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
  });
};

var bind = function (fn, state, unwrap) {
  return function (value) {
    fn(state, value, unwrap);
  };
};

var internalReject = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  state.value = value;
  state.state = REJECTED;
  notify(state, true);
};

var internalResolve = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  try {
    if (state.facade === value) throw TypeError("Promise can't be resolved itself");
    var then = isThenable(value);
    if (then) {
      microtask(function () {
        var wrapper = { done: false };
        try {
          then.call(value,
            bind(internalResolve, wrapper, state),
            bind(internalReject, wrapper, state)
          );
        } catch (error) {
          internalReject(wrapper, error, state);
        }
      });
    } else {
      state.value = value;
      state.state = FULFILLED;
      notify(state, false);
    }
  } catch (error) {
    internalReject({ done: false }, error, state);
  }
};

// constructor polyfill
if (FORCED) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance(this, PromiseConstructor, PROMISE);
    aFunction(executor);
    Internal.call(this);
    var state = getInternalState(this);
    try {
      executor(bind(internalResolve, state), bind(internalReject, state));
    } catch (error) {
      internalReject(state, error);
    }
  };
  PromiseConstructorPrototype = PromiseConstructor.prototype;
  // eslint-disable-next-line no-unused-vars -- required for `.length`
  Internal = function Promise(executor) {
    setInternalState(this, {
      type: PROMISE,
      done: false,
      notified: false,
      parent: false,
      reactions: [],
      rejection: false,
      state: PENDING,
      value: undefined
    });
  };
  Internal.prototype = redefineAll(PromiseConstructorPrototype, {
    // `Promise.prototype.then` method
    // https://tc39.es/ecma262/#sec-promise.prototype.then
    then: function then(onFulfilled, onRejected) {
      var state = getInternalPromiseState(this);
      var reaction = newPromiseCapability(speciesConstructor(this, PromiseConstructor));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = IS_NODE ? process.domain : undefined;
      state.parent = true;
      state.reactions.push(reaction);
      if (state.state != PENDING) notify(state, false);
      return reaction.promise;
    },
    // `Promise.prototype.catch` method
    // https://tc39.es/ecma262/#sec-promise.prototype.catch
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    var state = getInternalState(promise);
    this.promise = promise;
    this.resolve = bind(internalResolve, state);
    this.reject = bind(internalReject, state);
  };
  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === PromiseConstructor || C === PromiseWrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };

  if (!IS_PURE && typeof NativePromise == 'function' && NativePromisePrototype !== Object.prototype) {
    nativeThen = NativePromisePrototype.then;

    if (!SUBCLASSING) {
      // make `Promise#then` return a polyfilled `Promise` for native promise-based APIs
      redefine(NativePromisePrototype, 'then', function then(onFulfilled, onRejected) {
        var that = this;
        return new PromiseConstructor(function (resolve, reject) {
          nativeThen.call(that, resolve, reject);
        }).then(onFulfilled, onRejected);
      // https://github.com/zloirock/core-js/issues/640
      }, { unsafe: true });

      // makes sure that native promise-based APIs `Promise#catch` properly works with patched `Promise#then`
      redefine(NativePromisePrototype, 'catch', PromiseConstructorPrototype['catch'], { unsafe: true });
    }

    // make `.constructor === Promise` work for native promise-based APIs
    try {
      delete NativePromisePrototype.constructor;
    } catch (error) { /* empty */ }

    // make `instanceof Promise` work for native promise-based APIs
    if (setPrototypeOf) {
      setPrototypeOf(NativePromisePrototype, PromiseConstructorPrototype);
    }
  }
}

$({ global: true, wrap: true, forced: FORCED }, {
  Promise: PromiseConstructor
});

setToStringTag(PromiseConstructor, PROMISE, false, true);
setSpecies(PROMISE);

PromiseWrapper = getBuiltIn(PROMISE);

// statics
$({ target: PROMISE, stat: true, forced: FORCED }, {
  // `Promise.reject` method
  // https://tc39.es/ecma262/#sec-promise.reject
  reject: function reject(r) {
    var capability = newPromiseCapability(this);
    capability.reject.call(undefined, r);
    return capability.promise;
  }
});

$({ target: PROMISE, stat: true, forced: IS_PURE || FORCED }, {
  // `Promise.resolve` method
  // https://tc39.es/ecma262/#sec-promise.resolve
  resolve: function resolve(x) {
    return promiseResolve(IS_PURE && this === PromiseWrapper ? PromiseConstructor : this, x);
  }
});

$({ target: PROMISE, stat: true, forced: INCORRECT_ITERATION }, {
  // `Promise.all` method
  // https://tc39.es/ecma262/#sec-promise.all
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        $promiseResolve.call(C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  },
  // `Promise.race` method
  // https://tc39.es/ecma262/#sec-promise.race
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction(C.resolve);
      iterate(iterable, function (promise) {
        $promiseResolve.call(C, promise).then(capability.resolve, reject);
      });
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});

},{"../internals/a-function":4,"../internals/an-instance":7,"../internals/check-correctness-of-iteration":10,"../internals/engine-is-browser":21,"../internals/engine-is-node":23,"../internals/engine-v8-version":26,"../internals/export":28,"../internals/get-built-in":31,"../internals/global":33,"../internals/host-report-errors":36,"../internals/inspect-source":40,"../internals/internal-state":41,"../internals/is-forced":43,"../internals/is-object":44,"../internals/is-pure":45,"../internals/iterate":46,"../internals/microtask":50,"../internals/native-promise-constructor":51,"../internals/new-promise-capability":54,"../internals/object-set-prototype-of":63,"../internals/perform":66,"../internals/promise-resolve":67,"../internals/redefine":69,"../internals/redefine-all":68,"../internals/set-species":72,"../internals/set-to-string-tag":73,"../internals/species-constructor":77,"../internals/task":79,"../internals/well-known-symbol":89}],97:[function(require,module,exports){
'use strict';
var charAt = require('../internals/string-multibyte').charAt;
var InternalStateModule = require('../internals/internal-state');
var defineIterator = require('../internals/define-iterator');

var STRING_ITERATOR = 'String Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-string.prototype-@@iterator
defineIterator(String, 'String', function (iterated) {
  setInternalState(this, {
    type: STRING_ITERATOR,
    string: String(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return { value: undefined, done: true };
  point = charAt(string, index);
  state.index += point.length;
  return { value: point, done: false };
});

},{"../internals/define-iterator":17,"../internals/internal-state":41,"../internals/string-multibyte":78}],98:[function(require,module,exports){
// TODO: Remove from `core-js@4`
require('./es.aggregate-error');

},{"./es.aggregate-error":90}],99:[function(require,module,exports){
// TODO: Remove from `core-js@4`
require('./es.promise.all-settled.js');

},{"./es.promise.all-settled.js":93}],100:[function(require,module,exports){
// TODO: Remove from `core-js@4`
require('./es.promise.any');

},{"./es.promise.any":94}],101:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var newPromiseCapabilityModule = require('../internals/new-promise-capability');
var perform = require('../internals/perform');

// `Promise.try` method
// https://github.com/tc39/proposal-promise-try
$({ target: 'Promise', stat: true }, {
  'try': function (callbackfn) {
    var promiseCapability = newPromiseCapabilityModule.f(this);
    var result = perform(callbackfn);
    (result.error ? promiseCapability.reject : promiseCapability.resolve)(result.value);
    return promiseCapability.promise;
  }
});

},{"../internals/export":28,"../internals/new-promise-capability":54,"../internals/perform":66}],102:[function(require,module,exports){
require('./es.array.iterator');
var DOMIterables = require('../internals/dom-iterables');
var global = require('../internals/global');
var classof = require('../internals/classof');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var Iterators = require('../internals/iterators');
var wellKnownSymbol = require('../internals/well-known-symbol');

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

for (var COLLECTION_NAME in DOMIterables) {
  var Collection = global[COLLECTION_NAME];
  var CollectionPrototype = Collection && Collection.prototype;
  if (CollectionPrototype && classof(CollectionPrototype) !== TO_STRING_TAG) {
    createNonEnumerableProperty(CollectionPrototype, TO_STRING_TAG, COLLECTION_NAME);
  }
  Iterators[COLLECTION_NAME] = Iterators.Array;
}

},{"../internals/classof":12,"../internals/create-non-enumerable-property":15,"../internals/dom-iterables":20,"../internals/global":33,"../internals/iterators":49,"../internals/well-known-symbol":89,"./es.array.iterator":91}],103:[function(require,module,exports){
"use strict";
var TOCHighlighter = require("./sync-toc");
function quoteText(text) {
    return text.split("\n").map(function (line) {
        return "> " + line;
    }).join("\n");
}

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
    var url = this.github_issue_point
        + "?title=" + encodeURIComponent(this.github_issue_title)
        + "&body=" + encodeURIComponent(this.github_issue_body)
        + "&labels=" + encodeURIComponent(this.github_issue_labels);
    window.open(url,"promises-book");
};
module.exports = BugReporter;
module.exports.initialize = function () {
    var reportElement = document.createElement("button");
    reportElement.textContent = "バグ報告";
    reportElement.setAttribute("style", "position:fixed; right:0;bottom:0;");
    var clickEvent = ("ontouchstart" in window) ? "touchend" : "click";
    reportElement.addEventListener(clickEvent, function (event) {
        var bug = new BugReporter();
        var selectedText = bug.getSelectedText().trim();
        var body = 'URL : ' + bug.getURLs() + "\n";
        if (selectedText && selectedText.length > 0) {
            body += "\n" + quoteText(selectedText) + "\n";
        }
        bug.setBody(body);
        bug.report();
    });
    document.body.appendChild(reportElement);
};
},{"./sync-toc":106}],104:[function(require,module,exports){
/**
 * Created by azu on 2014/06/11.
 * LICENSE : MIT
 */
"use strict";
var Promise = require("core-js-pure/features/promise");
var consoleUI = require("codemirror-console-ui");
module.exports.initialize = function () {
    var attachToElement = consoleUI.attachToElement;
    var setUserContext = consoleUI.setUserContext;
    setUserContext({
        Promise: Promise
    });
    var codeBlocks = document.querySelectorAll(".executable");
    for (var i = 0; i < codeBlocks.length; i++) {
        var codeBlock = codeBlocks[i];
        var code = codeBlock.getElementsByTagName("code")[0];
        if (!code) {
            continue
        }
        attachToElement(codeBlock, code.textContent);
    }
};

},{"codemirror-console-ui":1,"core-js-pure/features/promise":3}],105:[function(require,module,exports){
/**
 * Created by azu on 2014/06/10.
 * LICENSE : MIT
 */
"use strict";
function windowOnload() {
    require("./console-editor").initialize();
    require("./sync-toc").initialize();
    require("./bug-report").initialize();
}
var readyState = document.readyState;
if (readyState === "interactive" || readyState === 'complete') {
    windowOnload();
} else {
    window.addEventListener("DOMContentLoaded", windowOnload);
}
},{"./bug-report":103,"./console-editor":104,"./sync-toc":106}],106:[function(require,module,exports){
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

},{}]},{},[105]);
