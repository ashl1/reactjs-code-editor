//var selectionRange = require('selection-range');

/**
 * Make a contenteditable element
 */

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
    };
  },

  componentDidMount: function(){
    if (this.props.autoFocus) {
      this.autofocus();
    }
  },

  componentDidUpdate: function(prevProps, prevState){
    if (this.state && this.state.range) {
      selectionRange(this.getDOMNode(), this.state.range);
    }
  },

  autofocus: function(){
    this.getDOMNode().focus();
    if (!this.props.text.length) {
      this.setCursorToStart();
    }
  },

  render: function() {
    
    var content = [];
    for (var iLine = this.state.firstLinePos; iLine < this.state.firstLinePos + this.props.linesVisible; iLine += 1) {
      content.push(
        <div>
        {
          this.props.text.substr(
            RopePosition(iLine, this.state.firstColumnPos),
            RopePosition(iLine, this.state.firstColumnPos + this.props.columnsVisible)
          )
        }</div>
      )
    }

    return (
      <div
        tabIndex = {this.props.autoFocus ? -1 : 0}
        contentEditable = {true}
        onKeyDown = {this.onKeyDown}
        onPaste = {this.onPaste}
        onMouseDown = {this.onMouseDown}
        onTouchStart = {this.onMouseDown}
        onKeyPress = {this.onKeyPress}
        onInput = {this.onInput}
        onKeyUp = {this.onKeyUp}
      >
        {content}
      </div>
    )
  },

  setCursorToStart: function(){
    this.getDOMNode().focus();
    var sel = window.getSelection();
    var range = document.createRange();
    range.setStart(this.getDOMNode(), 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  },

  onMouseDown: function(e) {
    /*if (this.props.text.length) return;
    this.setCursorToStart();
    e.preventDefault();*/
  },

  onKeyDown: function(e) {
/*    var self = this;

    function prev () {
      e.preventDefault();
      e.stopPropagation();
      self._stop = true;
    }

    var key = e.key;

    if (key == 'Delete' && !this.props.text.trim().length) {
      prev();
      return;
    }

    // todo: cleanup
    if (key == 'Enter') return prev();

    if (e.metaKey) {
      if (e.keyCode == 66) return prev();
      if (e.keyCode == 73) return prev();
    }

    if (!this.props.text.trim().length) {
      if (key == 'Backspace') return prev();
      if (key == 'Delete') return prev();
      if (key == 'ArrowRight') return prev();
      if (key == 'ArrowLeft') return prev();
      if (key == 'ArrowDown') return prev();
      if (key == 'ArrowUp') return prev();
      if (key == 'Tab') return prev();
    }*/
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
    
    // movements
    if (key == 'ArrowLeft') {
      this.virtualCursor = cursorReal;
      if (cursorOnRealLineStart) {
        if (previousLine.exist()) {
          cursor.setOnRealLineEnd(previousLine)
        }
      } else { // not on real line start
        cursor.moveLeft()
      } 
      this._updateShowBuffer({toUp: 1, toRight: 1});
    } else if (key == 'ArrowRight') {
      if (cursorOnRealLineEnd) {
        if (nextLine.exist()){
          cursor.setOnRealLineStart(nextLine);
        }
      } else { // not on real line end
        cursor.moveRight()
      }
      this._updateShowBuffer({toUp: 0, toRight: 0});
    } else if (key == 'ArrowUp') {
      if (previousLine.exist()) {
        cursor.moveUp();
        this._updateShowBuffer({toUp: 1, toRight: showedCursor.column() <= previousLine.length})
      } else { // prev line does not exist
        cursor.setOnRealLineStart(currentLine)
        this._updateShowBuffer({toUp: 1, toRight: 0})
      }
    } else if (key == 'ArrowDown') {
      if (nextLine.exist()) {
        cursor.moveDown();
      } else { // next line does not exist
        cursor.setOnRealLineEnd(currentLine);
      }
      // this._updateShowBuffer
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
    var stop = this._stop;
    this._stop = false;
    
    // This is a lame hack to support IE, which doesn't
    // support the 'input' event on contenteditable. Definitely
    // not ideal, but it seems to work for now.
    if (!stop && !this._ignoreKeyup) {
      this.setText(e.target.textContent);
    }
  },

  onInput: function(e) {
    this._ignoreKeyup = true;
    this.setText(e.target.textContent);
  },

  setText: function(val) {
    /*var range = selectionRange(this.getDOMNode());
    this.setState({ range : range });
    this.props.onChange(val);*/
  }
  
  _getCursorOnRealLine: function() {
    var line = this.state.virtualCursor.line;
    return {
      line: line,
      column: Math.min(this.state.virtualCursor.column, this.props.text.getLineLength(line))
    }
  }
  
  // Virtual cursor represents maximum columned cursor used while movements
  // This cursor not represented real shown cursor and the positions isn't real RopePosition
  //  because it not in real lines bounds. But it represents the absolute position in line, not 
  //  relative to shown in GUI.
  // This info is used while real cursor and selection showing, dynamically changes before
  _updateVirtualCursor: function(prevPosition, nextPosition) {
    
  }
  
  _updateShowBuffer: function(toUp, toRight) {
    //update based on cursor info
    
    // determine if new virtual cursor line keep on showed buffer, if not:
    //   toUp == true: align that new cursor line will be first showed line
    //   toUp == false: align than new cursor line will be the last showed
    
    // the same rules for the column
  }
});