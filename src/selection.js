define(['rangy'], function(rangy){

  function isDefined(arg) {
    if (typeof arg != 'undefined')
      return true;
    return false;
  }

///////////////////////////////////////////////////////////////////////////////////////////
////////////                     Selection                                     ////////////
///////////////////////////////////////////////////////////////////////////////////////////


  
  // the current cursor is always determine by {lastLine, lastColumn}
  var Selection = function(firstLine, firstColumn, lastLine, lastColumn){
    //if (!(this instanceof Selection)) return new Selection(firstLine, firstColumn, lastLine, lastColumn);
    
    this.firstLine = isDefined(firstLine)? firstLine: 1;
    this.firstColumn = isDefined(firstColumn)? firstColumn: 0;
    this.lastLine = isDefined(lastLine)? lastLine: this.firstLine;
    this.lastColumn = isDefined(lastColumn)? lastColumn: this.firstColumn;
    this.type = this.isCollapsed()? 'Caret': 'Range';
  }

  Selection.prototype.collapse = function() {
    this.firstLine = this.lastLine;
    this.firstColumn = this.lastColumn;
    this.type = 'Caret';
  }
  
  Selection.prototype.getCursor = function(){
    return {
      line:    this.lastLine,
      column:  this.lastColumn,
    }
  }
  
  Selection.prototype.getCursorColumn = function() {
    return this.lastColumn;
  }
  
  Selection.prototype.getCursorLine = function() {
    return this.lastLine;
  }

  Selection.prototype.isCollapsed = function() {
    return this.firstLine === this.lastLine && this.firstColumn === this.lastColumn;
  }
  
  Selection.prototype.isReversed = function() {
    return (this.firstLine > this.lastLine) || (this.firstLine === this.lastLine && this.firstColumn > this.lastColumn);
  }
  
  Selection.prototype.reverse = function(){
    this.firstLine = this.lastLine + (this.lastLine = this.firstLine, 0)
    this.firstColumn = this.lastColumn + (this.lastColumn = this.firstColumn, 0)
  }
    
  Selection.prototype.setCursorLine = function(line){
    this.lastLine = line;
    if (this.type == 'Caret')
      this.firstLine = line;
  }
  
  Selection.prototype.setCursorColumn = function(column){
    this.lastColumn = column;
    if (this.type == 'Caret')
      this.firstColumn = column;
  }
  
  Selection.prototype.setCursor = function(line, column) {
    this.lastLine = line;
    this.lastColumn = column;
    if (this.type == 'Caret') {
      this.firstLine = line;
      this.firstColumn = column;
    }
  }

///////////////////////////////////////////////////////////////////////////////////////////
////////////                     AbsoluteSelection                             ////////////
///////////////////////////////////////////////////////////////////////////////////////////
  
  var AbsoluteSelection = function() {
    // text manager is last argument
    var args = Array.prototype.slice.call(arguments);
    this.textManager = args.pop();
    Selection.apply(this, args)
    
    // this is use if to restore selection to the maximum while movement between lines
    this.savedLastColumn = this.lastColumn;
    // determine to which direction previous cursor have been moved
    this.toUp = false;
    this.toRight = false;
    
    // correct to line length
    this.firstColumn = Math.min(this.firstColumn, this.textManager.getLineLength(this.firstLine));
    this.lastColumn = Math.min(this.lastColumn, this.textManager.getLineLength(this.lastLine));
  }
  AbsoluteSelection.prototype = Selection.prototype;
  AbsoluteSelection.prototype.constructor = AbsoluteSelection;
  
  AbsoluteSelection.prototype._convertToRelative = function(windowPosition) {
      this.firstLine -= windowPosition.firstLine,
      this.firstColumn -= windowPosition.firstColumn,
      this.lastLine -= windowPosition.firstLine,
      this.lastColumn -= windowPosition.firstColumn
  }
    
  AbsoluteSelection.prototype.getRelativeSelection = function(windowPosition){
    var selection = new AbsoluteSelection(this.firstLine, this.firstColumn, this.lastLine, this.lastColumn, this.textManager)
    var reversed = selection.isReversed();
    if (reversed)
      selection.reverse()
    
    selection._truncateToShowWindow(windowPosition);
    selection._convertToRelative(windowPosition);

    if (reversed)
      selection.reverse()

    return new RelativeSelection(
      selection.firstLine,
      selection.firstColumn,
      selection.lastLine,
      selection.lastColumn
    );
  }
  
  AbsoluteSelection.prototype.isCursorOnLineEnd = function() {
    return this.getCursorColumn() === this.textManager.getLineLength(this.getCursorLine())
  }
  
  AbsoluteSelection.prototype.isCursorOnLineStart = function() {
    return this.getCursorColumn() === 0;
  }
  
  AbsoluteSelection.prototype.isNextLineExist = function() {
    return this.getCursorLine() + 1 <= this.textManager.getLinesCount()
  }
  
  AbsoluteSelection.prototype.isPreviousLineExist = function() {
    return this.getCursorLine() > 1;
  }
  
  AbsoluteSelection.prototype.moveCursorDown = function(lines) {
    if (!isDefined(lines)) lines = 1;
    var nextLine = Math.min(this.getCursorLine() + lines, this.textManager.getLinesCount());
    this.toUp = false;
    this.toRight = this.getCursorColumn() <= this.textManager.getLineLength(nextLine);
    this.setCursorLine(nextLine);
    this.setCursorColumn(Math.min(this.savedLastColumn, this.textManager.getLineLength(this.getCursorLine())));
  }
  
  AbsoluteSelection.prototype.moveCursorLeft = function() {
    this.toUp = true;
    this.toRight = false;
    this.setCursorColumn(this.getCursorColumn() - 1);
  }
  
  AbsoluteSelection.prototype.moveCursorRight = function() {
    this.toUp = false;
    this.toRight = true;
    this.setCursorColumn(this.getCursorColumn() + 1);
  }
  
  AbsoluteSelection.prototype.moveCursorToLineEnd = function(line) {
    this.toUp = this.getCursorLine() > line;
    this.toRight = true;
    this.setCursor(line, this.textManager.getLineLength(line));
  }
  
  AbsoluteSelection.prototype.moveCursorToLineStart = function(line) {
    this.toUp = this.getCursorLine() > line;
    this.toRight = false;
    this.setCursor(line, 0);
  }
  
  AbsoluteSelection.prototype.moveCursorUp = function (lines) {
    if (!isDefined(lines)) lines = 1;
    var previousLine = Math.max(this.getCursorLine() - lines, 1);
    this.toUp = true;
    this.toRight = this.getCursorColumn() <= this.textManager.getLineLength(previousLine);
    this.setCursorLine(previousLine);
    this.setCursorColumn(Math.min(this.savedLastColumn, this.textManager.getLineLength(this.getCursorLine())));
  }

  AbsoluteSelection.prototype.resetSavedCursorColumn = function(){
    this.savedLastColumn = this.lastColumn;
  }

  AbsoluteSelection.prototype._truncateColumnToShowWindow = function(column, windowPosition) {
    column = Math.max(column, windowPosition.firstColumn);
    column = Math.min(windowPosition.lastColumn + 1, column)
    return column;
  },
  
  AbsoluteSelection.prototype._truncateToShowWindow = function(windowPosition) {
    // assume first* <= last*
    if (this.firstLine < windowPosition.firstLine){
      this.firstLine = windowPosition.firstLine;
      this.firstColumn = 0;
    }
    
    if (this.lastLine > windowPosition.lastLine) {
      this.lastLine = windowPosition.lastLine;
      this.lastColumn = this.textManager.getLineLength(this.lastLine);
    }
    
    this.firstColumn = this._truncateColumnToShowWindow(this.firstColumn, windowPosition);
    this.lastColumn = this._truncateColumnToShowWindow(this.lastColumn, windowPosition);
  }
  
///////////////////////////////////////////////////////////////////////////////////////////
////////////                     RelativeSelection                             ////////////
///////////////////////////////////////////////////////////////////////////////////////////
  
  var RelativeSelection = function() {
    Selection.apply(this, arguments)
  }
  RelativeSelection.prototype = Selection.prototype;
  RelativeSelection.prototype.constructor = RelativeSelection;
  
  RelativeSelection.prototype.getAbsoluteSelection = function(windowPosition, textManager) {
    return new AbsoluteSelection(
      this.firstLine + windowPosition.firstLine,
      this.firstColumn + windowPosition.firstColumn,
      this.lastLine + windowPosition.firstLine,
      this.lastColumn + windowPosition.firstColumn,
      textManager
    )
  }

  /**
  *
  * @param {Element} node
  * @param {Bool} start True: determine the start of selection , false: determine the end of selection
  * @return {Number}
  * @api private
  */
  
  RelativeSelection.prototype._getSelectionPosition = function(node, start) {
    var range = window.getSelection().getRangeAt(0);
    var clone = range.cloneRange();
    clone.selectNodeContents(node);
    if (start)
      clone.setEnd(range.startContainer, range.startOffset);
    else
      clone.setEnd(range.endContainer, range.endOffset);
    return clone.toString().length;
  }

  RelativeSelection.prototype.show = function(domManager){
    var browserSelection = rangy.getSelection();
    var range = rangy.createRange();

    var reversed = this.isReversed();
    if (reversed)
      this.reverse();
    
    var res = domManager.getNestedTextNodeAndOffset(this.firstLine, this.firstColumn)
    range.setStart(res.node, res.offset);
    
    res = domManager.getNestedTextNodeAndOffset(this.lastLine, this.lastColumn)
    range.setEnd(res.node, res.offset);

    browserSelection.removeAllRanges();
    browserSelection.addRange(range, reversed);
  }
  
  RelativeSelection.prototype.updateFromNative = function(domManager){
    var nativeSelection = rangy.getSelection();
    var range = nativeSelection.getRangeAt(0);
    var node, lineNode;
    if (!range.collapsed) {
      this.type = 'Range';
      node = range.startContainer;
      lineNode = domManager.getLineNodeFromNestedNode(node);
      this.firstLine = domManager.getRelativeLineIndexByNode(lineNode);
      this.firstColumn = this._getSelectionPosition(lineNode, true);
    } else
      this.type = 'Caret';
      
    node = range.endContainer;
    lineNode = domManager.getLineNodeFromNestedNode(node);
    this.setCursorLine(domManager.getRelativeLineIndexByNode(lineNode));
    this.setCursorColumn(this._getSelectionPosition(lineNode, false));
    if (nativeSelection.isBackwards())
      this.reverse();
  }
  
  return {
    Selection: Selection,
    AbsoluteSelection: AbsoluteSelection,
    RelativeSelection: RelativeSelection,
  }
})