/*
 * Code was given from https://github.com/yields/measure-string (MIT license)
 */

define(function(){
  
/**
 * Measure the width of the given `str` with `el`.
 *
 * @param {Element} el
 * @param {String} str
 * @return {Number}
 * @api public
 */

var measureString = function(el, str){
  var dup = document.createElement('span');
  var styl = window.getComputedStyle(el);
  dup.style.letterSpacing = styl.letterSpacing;
  dup.style.textTransform = styl.textTransform;
  dup.style.font = styl.font;
  dup.style.position = 'absolute';
  dup.style.whiteSpace = 'nowrap';
  dup.style.top = (window.innerHeight * 2) + 'px';
  dup.style.width = 'auto';
  dup.style.padding = 0;
  dup.textContent = str;
  document.body.appendChild(dup);
  var width = dup.clientWidth;
  document.body.removeChild(dup);
  return width;
};

var getTextLengthLessOrEqualElementWidth = function(string, width, elementStyle) {
  if (measureString(elementStyle, string) < width)
    return string.length;
  
  var startRange = 0, endRange = 1, midRange;
  
  while (measureString(elementStyle, string.substring(0, endRange)) < width)
    endRange = endRange << 1;
  
  // need less or equal width
  while (endRange - startRange > 1) {
    midRange = Math.floor((startRange + endRange) / 2);
    if (width < measureString(elementStyle, string.substring(0, midRange)))
      endRange = midRange
    else // >=
      startRange = midRange;
  }
  return startRange;
}

var getMonoTextLengthLessOrEqualElementWidth = function(width, elementStyle) {
  var stringLength = 200;
  // FIXME: determine maximum length
  var string = new Array(stringLength + 1).join('a');
  return getTextLengthLessOrEqualElementWidth(string, width, elementStyle);
}

return getMonoTextLengthLessOrEqualElementWidth;
});