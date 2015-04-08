define(function(){
  
  var WindowPosition = function(firstLine, firstColumn, height, width){
    if (!(this instanceof WindowPosition)) return new WindowPosition(firstLine, firstColumn, height, width);
    
    this.firstLine = firstLine;
    this.firstColumn = firstColumn;
    this.lastLine = this.firstLine + height - 1;
    this.lastColumn = this.firstColumn + width - 1;
  }
  
  /*
   * @return {Bool} True if need rerender, False - otherwise
   */
  WindowPosition.prototype.tryUpdateToSelection = function(absoluteSelection){
    var needUpdate = false;
    var cursorLine = absoluteSelection.getCursorLine();
    var cursorColumn = absoluteSelection.getCursorColumn();
    var height = this.lastLine - this.firstLine + 1;
    var width = this.lastColumn - this.firstColumn + 1;
    
    if (!(this.firstLine <= cursorLine && cursorLine <= this.lastLine)) {
      if (absoluteSelection.toUp) {
        this.firstLine = cursorLine;
      } else { // toDown
        this.firstLine = Math.max(cursorLine - height + 1, 0)
      }
      this.lastLine = this.firstLine + height - 1;
      needUpdate = true;
    }
    
    if (!(this.firstColumn <= cursorColumn && cursorColumn <= this.firstColumn + width)) {
      if (absoluteSelection.toRight)
          this.firstColumn = Math.max(cursorColumn - width, 0);
      else // to left
        this.firstColumn = cursorColumn;
      this.lastColumn = this.firstColumn + width - 1;
      needUpdate = true;
    }
    return needUpdate;
  }
  
  return WindowPosition;
})