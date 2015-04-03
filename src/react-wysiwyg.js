/**
 * Use cursor position code from https://github.com/yields/editable (MIT license)
 */


define(['react', 'rangy'], function(React, rangy) {

function isDefined(arg) {
  if (typeof arg != 'undefined')
    return true;
  return false;
}

var Editor = React.createClass({

  propTypes: {
    linesVisible: React.PropTypes.number,
    columnsVisible: React.PropTypes.number,
    
    text: React.PropTypes.instanceOf(Rope).isRequired,
    onChange: React.PropTypes.func.isRequired,
    autoFocus: React.PropTypes.bool
  },
  
  getDefaultProps: function() {
    return {
      autoFocus: true,
      linesVisible: 40,
      columnsVisible: 80,
    };
  },

  getInitialState: function(){
    return {
      firstLinePos: 1,
      firstColumnPos: 0,
      virtualCursor: {line: 1, column: 0},
      keyEvent: null,
      cursorHandled: false,
    };
  },

  componentDidMount: function(){
    if (this.props.autoFocus) {
      this.autofocus();
    }
  },

  componentDidUpdate: function(prevProps, prevState){
    
    // set cursor
    //cursorShowedPosition = this._getCursorShowPosition()
    // 1. Get cursor position relative to showed buffer
    // 2.a Get the <div> node belongs to the line
    // 2.b Find the nested <span> tag belongs to the relative position in the line
    // 3. Set cursor to the specified selection
    this._showCursor();
  },

  autofocus: function(){
    this.getDOMNode().focus();
    this._showCursor();
  },

  render: function() {
    
    var content = [];
    var id, text;
    for (var iLine = this.state.firstLinePos; iLine < this.state.firstLinePos + this.props.linesVisible; iLine += 1) {
      text = this.props.text.substr(
            RopePosition(iLine, this.state.firstColumnPos),
            RopePosition(iLine, this.state.firstColumnPos + this.props.columnsVisible - 1)
          )
      if (text == "")
        text = " ";
      id = 'codeLine_' + iLine;
      content.push(
        <div className={"codeLine"} key={id} ref={id}><pre>{text}</pre></div>
      )
    }
    
    return (
      <div>
      <div
        tabIndex = {this.props.autoFocus ? -1 : 0}
        contentEditable = {true}
        onPaste = {this.onPaste}
        onMouseDown = {this.onMouseDown}
        onSelect = {this.onSelect}
        onTouchStart = {this.onMouseDown}
        onKeyDown = {this.onKeyDown}
        onKeyPress = {this.onKeyPress}
      >
        {content}
      </div>
        <div>{this.state.virtualCursor.line} - {this.state.virtualCursor.column}/{this.state.firstColumnPos}</div>
      </div>
    )
  },

  onMouseDown: function(e) {
    
  },
  
  onSelect: function(e) {
    // 1. Determine the line when cursor caret is located
    // 2. Determine real string column
    // 3. Update the virtual cursor
    
    if (this.state.cursorHandled) {
      // handle manually by other methods
      this.state.cursorHandled = false;
      return;
    }
    
    var lineNode = this._getLineNodeFromNestedNode(rangy.getSelection().getRangeAt(0).startContainer);
    this.state.virtualCursor.line = this._extractLineNumber(lineNode);
    this.state.virtualCursor.column = this._getRealCursorColumnFromRelative(this._getCursorPosition(lineNode));
    
    // For DEBUG
    this.forceUpdate();
  },

  onPaste: function(e){
    // handle paste manually to ensure we unset our placeholder
    e.preventDefault();

    var data = e.clipboardData.getData('text/plain');

    // prevent text longer then our max-length from being
    // added
    this.setText(data);
  },

  onKeyDown: function(e) {
    var key = e.key;
    var cursorReal = this._getCursorOnRealLine();
    this.state.keyEvent = e;
    
    if (! (key == 'ArrowUp' || key == 'ArrowDown' || key == 'PageUp' || key == 'PageDown'))
      this.state.virtualCursor = cursorReal;
    
    if (key == 'ArrowLeft') {
      if (this._cursorOnLineStart()) {
        if (this._previousLineExist())
          this._moveCursorToLineEnd(cursorReal.line - 1)
      } else // not on real line start
        this._moveCursorLeft()
      
    } else if (key == 'ArrowRight') {
      if (this._cursorOnLineEnd()) {
        if (this._nextLineExist())
          this._moveCursorToLineStart(cursorReal.line + 1)
      } else // not on real line end
        this._moveCursorRight()

    } else if (key == 'ArrowUp') {
      if (this._previousLineExist())
        this._moveCursorUp()
      else // prev line does not exist
        this._moveCursorToLineStart(cursorReal.line)
        
    } else if (key == 'ArrowDown') {
      if (this._nextLineExist())
        this._moveCursorDown()
      else // next line does not exist
        this._moveCursorToLineEnd(cursorReal.line)
      
    } else if (key == 'Home') {
      this._moveCursorToLineStart(cursorReal.line)

    } else if (key == 'End') {
      this._moveCursorToLineEnd(cursorReal.line)

    } else if (key == 'PageUp') {
      if (this._previousLineExist())
        this._moveCursorUp(this.props.linesVisible)
      else
        this._moveCursorToLineStart(cursorReal.line)

    } else if (key == 'PageDown') {
      if (this._nextLineExist())
        this._moveCursorDown(this.props.linesVisible)
      else
        this._moveCursorToLineEnd(cursorReal.line)

    } else if (key == 'Backspace') {
      if (this._cursorOnLineStart()) {
        if (this._previousLineExist()) {
          var previousLine = cursorReal.line - 1,
              previousLineLength = this.props.text.getLineLength(previousLine);
          this._moveCursorToLineEnd(previousLine);
          this.props.text.remove(
            RopePosition(previousLine, previousLineLength),
            RopePosition(previousLine, previousLineLength));
        }
      } else { // not on real line start
        var symbolPosition = RopePosition(cursorReal.line, cursorReal.column - 1);
        this.props.text.remove(symbolPosition, symbolPosition);
        this._moveCursorLeft();
      }
      this._preventDefaultEventAction(e)
      this.forceUpdate();

    } else if (key == 'Delete') {
      if (this._cursorOnLineEnd()) {
        if (this._nextLineExist()) {
          var symbolPosition = RopePosition(cursorReal.line, this.props.text.getLineLength(cursorReal.line))
          this.props.text.remove(symbolPosition, symbolPosition);
        }
      } else { // not on real line end
        var symbolPosition = RopePosition(cursorReal.line, cursorReal.column);
        this.props.text.remove(symbolPosition, symbolPosition);
      }
      this._preventDefaultEventAction(e)
      this.forceUpdate();

    } else if (key == 'Tab') {
      
    }

    if (!this.state.cursorHandled && (key == 'ArrowUp' || key == 'ArrowDown' || key == 'PageUp' || key == 'PageDown')) {
      // show cursor at end of line if virtual cursor > line length
      this._preventDefaultEventAction(e)
      this._showCursor();
    }

    
  },
  
  onKeyPress: function(e){
    var key = e.key;
    var cursorReal = this._getCursorOnRealLine();
    this.state.keyEvent = e;

    if (key == 'Enter')
      key = "\n";
    
    this.props.text.insert(RopePosition(cursorReal.line, cursorReal.column), key)
    if (key == "\n")
      this._moveCursorToLineStart(cursorReal.line + 1);
    else
      this._moveCursorRight();
    this._preventDefaultEventAction(e)
    this.forceUpdate();
  },
  
  _cursorOnLineEnd: function() {
    return this.state.virtualCursor.column === this.props.text.getLineLength(this.state.virtualCursor.line)
  },
  
  _cursorOnLineStart: function() {
    return this.state.virtualCursor.column === 0;
  },
  
  _extractLineNumber: function(node) {
    return Number(node.dataset.reactid.split('$')[1].split('_')[1]);
  },
  
  _getCursorOnRealLine: function() {
    var line = this.state.virtualCursor.line;
    return {
      line: line,
      column: Math.min(this.state.virtualCursor.column, this.props.text.getLineLength(line))
    }
  },
  
  _getLineNodeFromNestedNode: function(node) {
    while (!node.classList || !node.classList.length || node.classList[0] != 'codeLine')
      node = node.parentNode;
    return node
  },
  
  _getRealCursorColumnFromRelative: function(relativeColumn) {
    return this.state.firstColumnPos + relativeColumn;
  },
  
  _moveCursorDown: function(lines) {
    this.state.cursorHandled = true;
    if (!isDefined(lines)) lines = 1;
    var nextLine = Math.min(this.state.virtualCursor.line + lines, this.props.text.getLinesCount());
    var toRight = this._getCursorOnRealLine().column <= this.props.text.getLineLength(nextLine);
    this.state.virtualCursor.line = nextLine;
    this._updateShowBuffer({toUp: 0, toRight: toRight})
  },
  
  _moveCursorLeft: function() {
    this.state.cursorHandled = true;
    this.state.virtualCursor.column -= 1;
    this._updateShowBuffer({toUp: 1, toRight: 0});
  },
  
  _moveCursorRight: function() {
    this.state.cursorHandled = true;
    this.state.virtualCursor.column += 1;
    this._updateShowBuffer({toUp: 0, toRight: 1});
  },
  
  _moveCursorToLineEnd: function(line) {
    this.state.cursorHandled = true;
    var toUp = this.state.virtualCursor.line > line;
    var length = this.props.text.getLineLength(line)
    var toRight = this.state.virtualCursor.column < length
    this.state.virtualCursor = {line: line, column: length};
    this._updateShowBuffer({toUp: toUp, toRight: toRight})
  },
  
  _moveCursorToLineStart: function(line) {
    this.state.cursorHandled = true;
    var toUp = this.state.virtualCursor.line > line;
    this.state.virtualCursor = {line: line, column: 0};
    this._updateShowBuffer({toUp: toUp, toRight: 0})
  },
  
  _moveCursorUp: function (lines) {
    this.state.cursorHandled = true;
    if (!isDefined(lines)) lines = 1;
    var previousLine = Math.max(this.state.virtualCursor.line - lines, 1);
    var toRight = this._getCursorOnRealLine().column <= this.props.text.getLineLength(previousLine);
    this.state.virtualCursor.line = previousLine;
    this._updateShowBuffer({toUp: 1, toRight: toRight})
  },
  
  _nextLineExist: function() {
    return this.state.virtualCursor.line + 1 <= this.props.text.getLinesCount()
  },
  
  _preventDefaultEventAction: function(event) {
    event.preventDefault();
    event.stopPropagation();
  },

  _previousLineExist: function() {
    return this.state.virtualCursor.line > 1;
  },

  /**
  * Set / get caret position with `el`.
  *
  * @param {Element} el
  * @param {Number} at
  * @return {Number}
  * @api private
  */

  _getCursorPosition: function(node) {
    var range = window.getSelection().getRangeAt(0);
    var clone = range.cloneRange();
    clone.selectNodeContents(node);
    clone.setEnd(range.endContainer, range.endOffset);
    return clone.toString().length;
  },

  _setCursorPosition: function(node, pos) {
    var length = 0, abort;

    this._visitNodes(node, function(node){
      if (3 != node.nodeType) return;
      length += node.textContent.length;
      if (length >= pos) {
        if (abort) return;
        abort = true;
        var sel = document.getSelection();
        var range = document.createRange();
        var sub = length - node.textContent.length;
        range.setStart(node, pos - sub);
        range.setEnd(node, pos - sub);
        sel.removeAllRanges();
        sel.addRange(range);
        return true;
      }
    });
  },

  /**
   * Walk all text nodes of `node`.
   *
   * @param {Element|Node} node
   * @param {Function} fn
   * @api private
   */

  _visitNodes: function (node, fn){
    var nodes = node.childNodes;
    for (var i = 0; i < nodes.length; ++i) {
      if (fn(nodes[i])) break;
      this._visitNodes(nodes[i], fn);
    }
  },


  _showCursor: function(){
    if (!rangy.initialized)
      rangy.init();
    // 1. Get cursor position relative to showed buffer
    // 2.a Get the <div> node belongs to the line
    // 2.b Find the nested <span> tag belongs to the relative position in the line
    // 3. Set cursor to the specified selection

    var relativeColumn = Math.min(this.state.virtualCursor.column, this.props.text.getLineLength(this.state.virtualCursor.line)) - this.state.firstColumnPos;
    var node = React.findDOMNode(this.refs['codeLine_' + this.state.virtualCursor.line]);

    node.focus();
    this._setCursorPosition(node, relativeColumn);
  },
  
  // Virtual cursor represents maximum columned cursor used while movements
  // This cursor not represented real shown cursor and the positions isn't real RopePosition
  //  because it not in real lines bounds. But it represents the absolute position in line, not 
  //  relative to shown in GUI.
  // This info is used while real cursor and selection showing, dynamically changes before
  _updateVirtualCursor: function(prevPosition, nextPosition) {
    
  },
  
  _updateShowBuffer: function(args) {
    // update based on virtual cursor info and real strings
    var cursor = this._getCursorOnRealLine(this.state.virtualCursor);
    var needUpdate = false;
    
    if (!(this.state.firstLinePos <= cursor.line && cursor.line <= this.state.firstLinePos + this.props.linesVisible - 1)) {
      if (args.toUp)
        this.state.firstLinePos = cursor.line
      else // toDown
        this.state.firstLinePos = Math.max(cursor.line - this.props.linesVisible + 1, 0)
      needUpdate = true;
    }
    
    if (!(this.state.firstColumnPos <= cursor.column && cursor.column <= this.state.firstColumnPos + this.props.columnsVisible)) {
      if (args.toRight)
          this.state.firstColumnPos = Math.max(cursor.column - this.props.columnsVisible, 0)
      else // to left
        this.state.firstColumnPos = cursor.column
      needUpdate = true;
    }
    if (needUpdate) {
      // prevent default action to stop additional (native) caret movement
      this._preventDefaultEventAction(this.state.keyEvent);
      this.forceUpdate();
    }
  },
});

  return Editor
});