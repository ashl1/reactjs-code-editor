/*
 * Code was given from https://github.com/yields/measure-string (MIT license)
 */

define(function(){
  
  var buildStringFromElement = function(element, count) {
    return new Array(count + 1).join(element)
  }
  
/**
 * Measure the width of the given `str` with `el`.
 *
 * @param {Element} el
 * @param {String} str
 * @return {Number}
 * @api public
 */

var measureString = function(el, str, isWidth){
  var dup = document.createElement(isWidth? 'span': 'div');
  var styl = window.getComputedStyle(el);
  dup.style.letterSpacing = styl.letterSpacing;
  dup.style.textTransform = styl.textTransform;
  dup.style.font = styl.font;
  dup.style.position = 'absolute';
  dup.style.whiteSpace = 'nowrap';
  dup.style.top = (window.innerHeight * 2) + 'px';
  dup.style.width = 'auto';
  //dup.style.height = 'auto'
  dup.style.padding = 0;
  if (isWidth)
    dup.textContent = str;
  else
    dup.innerHTML = str;
  document.body.appendChild(dup);
  var widthOrHeight = isWidth? dup.clientWidth: dup.clientHeight;
  document.body.removeChild(dup);
  return widthOrHeight;
};

var getTextLengthLessOrEqualElementWidthOrHeight = function(stringPart, widthOrHeight, elementStyle, isWidth) {  
  var startRange = 0, endRange = 1, midRange;
  
  while (measureString(elementStyle, buildStringFromElement(stringPart, endRange), isWidth) < widthOrHeight)
    endRange = endRange << 1;
  
  // need less or equal widthOrHeight
  while (endRange - startRange > 1) {
    midRange = Math.floor((startRange + endRange) / 2);
    if (widthOrHeight < measureString(elementStyle, buildStringFromElement(stringPart, midRange), isWidth))
      endRange = midRange
    else // >=
      startRange = midRange;
  }
  return startRange;
}

var getMonoTextLengthLessOrEqualElementWidth = function(width, elementStyle) {
  return getTextLengthLessOrEqualElementWidthOrHeight('a', width, elementStyle, true);
}

var getMonoTextLengthLessOrEqualElementHeight = function(height, elementStyle, lineElement) {
  return getTextLengthLessOrEqualElementWidthOrHeight(lineElement.outerHTML, height, elementStyle, false)
}

return {
  getMonoTextLengthLessOrEqualElementWidth: getMonoTextLengthLessOrEqualElementWidth,
  getMonoTextLengthLessOrEqualElementHeight: getMonoTextLengthLessOrEqualElementHeight,
}
});