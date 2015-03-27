//var selectionRange = require('selection-range');

/**
 * Make a contenteditable element
 */

var Editor = React.createClass({displayName: "Editor",

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
      virtualCursor: {line: 1, column: 0}
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
    
    /*if (this.state && this.state.range) {
      selectionRange(this.getDOMNode(), this.state.range);
    }*/
  },

  autofocus: function(){
    this.getDOMNode().focus();
    this._showCursor();
  },

  render: function() {
    
    var content = [];
    var text;
    for (var iLine = this.state.firstLinePos; iLine < this.state.firstLinePos + this.props.linesVisible; iLine += 1) {
      text = this.props.text.substr(
            RopePosition(iLine, this.state.firstColumnPos),
            RopePosition(iLine, this.state.firstColumnPos + this.props.columnsVisible)
          )
      if (text == "")
        text = " ";
      content.push(
        React.createElement("div", null, React.createElement("pre", null, text))
      )
    }
    
    return (
      React.createElement("div", {
        tabIndex: this.props.autoFocus ? -1 : 0, 
        contentEditable: true, 
        onPaste: this.onPaste, 
        onMouseDown: this.onMouseDown, 
        onTouchStart: this.onMouseDown, 
        onKeyDown: this.onKeyPress, 
        onKeyPress: this.onKeyPress, 
        onInput: this.onInput, 
        onKeyUp: this.onKeyUp
      }, 
        content
      )
    )
  },

  onMouseDown: function(e) {
    /*if (this.props.text.length) return;
    this.setCursorToStart();
    e.preventDefault();*/
  },

  onPaste: function(e){
    // handle paste manually to ensure we unset our placeholder
    e.preventDefault();

    var data = e.clipboardData.getData('text/plain');

    // prevent text longer then our max-length from being
    // added
    this.setText(data);
  },

  onKeyPress: function(e){
    var key = e.key;
    var cursorReal = this._getCursorOnRealLine();
    
    // FIXME: Reset virtual cursor to real cursor () while change text or changes by mouse
    
    if (! (key == 'ArrowUp' || key == 'ArrowDown' || key == 'PageUp' || key == 'PageDown'))
      this.state.virtualCursor = cursorReal;
    
    if (key == 'ArrowLeft') {
      if (this._cursorOnLineStart()) {
        if (this._previousLineExist())
          this._moveCursorToLineEnd(cursorReal.line - 1)
      } else // not on real line start
        this._moveCursorLeft()
      
    } else if (key == 'ArrowRight') {
      this.state.virtualCursor = cursorReal;
      if (this._cursorOnLineEnd()) {
        if (this._nextLineExist())
          this._moveCursorToLineStart(cursorReal.line + 1)
      } else // not on real line end
        this._moveCursorRight()

    } else if (key == 'ArrowUp') {
      if (this._previousLineExist())
        this._moveCursorUp()
      else // prev line does not exist
        this._moveCursorToLineStart(this.state.virtualCursor.line)

    } else if (key == 'ArrowDown') {
      if (this._nextLineExist())
        this._moveCursorDown()
      else // next line does not exist
        this._moveCursorToLineEnd(this.state.virtualCursor.line)
      
    } else if (key == 'Home') {
      
    } else if (key == 'End') {
      
    } else if (key == 'PageUp') {
      
    } else if (key == 'PageDown') {
      
    } else if (key == 'Backspace') {
      
    } else if (key == 'Delete') {
      
    } else if (key == 'Tab') {
      
    }
    
    /*var val = e.target.textContent;

    // max-length validation on the fly
    if (this.props.maxLength && (val.length > this.props.maxLength)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }*/
  },

  onKeyUp: function(e) {
    /*var stop = this._stop;
    this._stop = false;
    
    // This is a lame hack to support IE, which doesn't
    // support the 'input' event on contenteditable. Definitely
    // not ideal, but it seems to work for now.
    if (!stop && !this._ignoreKeyup) {
      this.setText(e.target.textContent);
    }*/
  },

  onInput: function(e) {
    /*this._ignoreKeyup = true;
    this.setText(e.target.textContent);*/
  },

  setText: function(val) {
    /*var range = selectionRange(this.getDOMNode());
    this.setState({ range : range });
    this.props.onChange(val);*/
  },
  
  _cursorOnLineEnd: function() {
    return this.state.virtualCursor.column === this.props.text.getLineLength(this.state.virtualCursor.line)
  },
  
  _cursorOnLineStart: function() {
    return this.state.virtualCursor.column === 0;
  },
  
  _getCursorOnRealLine: function() {
    var line = this.state.virtualCursor.line;
    return {
      line: line,
      column: Math.min(this.state.virtualCursor.column, this.props.text.getLineLength(line))
    }
  },
  
  _moveCursorDown: function() {
    var nextLine = this.state.virtualCursor.line + 1;
    var toRight = this._getCursorOnRealLine().column <= this.props.text.getLineLength(nextLine);
    this.state.virtualCursor.line = nextLine;
    this._updateShowBuffer({toUp: 0, toRight: toRight})
  },
  
  _moveCursorLeft: function() {
    this.state.virtualCursor.column -= 1;
    this._updateShowBuffer({toUp: 1, toRight: 0});
  },
  
  _moveCursorRight: function() {
    this.state.virtualCursor.column += 1;
    this._updateShowBuffer({toUp: 0, toRight: 1});
  },
  
  _moveCursorToLineEnd: function(line) {
    var toUp = this.state.virtualCursor.line > line;
    var length = this.props.text.getLineLength(line)
    var toRight = this.state.virtualCursor.column < length
    this.state.virtualCursor = {line: line, column: length};
    this._updateShowBuffer({toUp: toUp, toRight: toRight})
  },
  
  _moveCursorToLineStart: function(line) {
    var toUp = this.state.virtualCursor.line > line;
    this.state.virtualCursor = {line: line, column: 0};
    this._updateShowBuffer({toUp: toUp, toRight: 0})
  },
  
  _moveCursorUp: function () {
    var previousLine = this.state.virtualCursor.line - 1;
    var toRight = this._getCursorOnRealLine().column <= this.props.text.getLineLength(previousLine);
    this.state.virtualCursor.line = previousLine;
    this._updateShowBuffer({toUp: 1, toRight: toRight})
  },
  
  _nextLineExist: function() {
    return this.state.virtualCursor.line + 1 <= this.props.text.getLinesCount()
  },
  
  _previousLineExist: function() {
    return this.state.virtualCursor.line > 1;
  },

  _showCursor: function(){
    // 1. Get cursor position relative to showed buffer
    // 2.a Get the <div> node belongs to the line
    // 2.b Find the nested <span> tag belongs to the relative position in the line
    // 3. Set cursor to the specified selection

    /*
    React.findDOMNode(this).focus();
    
    var sel = rangy.getSelection();
    var ranges = sel.getAllRanges();
    
    var range = rangy.createRange();
    range.setStart(this.getDOMNode(), 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    */
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
    if (needUpdate)
      this.forceUpdate();
  },
});