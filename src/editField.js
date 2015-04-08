/**
 * Use cursor position code from https://github.com/yields/editable (MIT license)
 */


define(['react', 'rangy', 'selection', 'domManager', 'windowPosition'], function(React, rangy, Selection, DomManager, WindowPosition) {

function isDefined(arg) {
  if (typeof arg != 'undefined')
    return true;
  return false;
}

var LexerDomainClassname = {
  1: "operators",
  2: "constants",
  3: "string",
  4: "keywords",
  5: "comments",
  6: "variable_name",
  7: "other",
  8: "whitespace",
  9: "invalid",
  10: "preprocessor",
}

var EditField = React.createClass({

  propTypes: {
    linesVisible: React.PropTypes.number,
    columnsVisible: React.PropTypes.number,
    
    text: React.PropTypes.instanceOf(Rope).isRequired,
    onChange: React.PropTypes.func.isRequired,
    autoFocus: React.PropTypes.bool,
    codeHighlight: React.PropTypes.bool,
  },
  
  getDefaultProps: function() {
    return {
      autoFocus: true,
      linesVisible: 40,
      columnsVisible: 80,
      codeHighlight: true,
    };
  },

  getInitialState: function(){
    return {
      cursorHandled: false,
      domManager: DomManager(this),
      selection: new Selection.AbsoluteSelection(this.props.text),
      windowPosition: WindowPosition(1, 0, this.props.linesVisible, this.props.columnsVisible),
    };
  },

  componentDidMount: function(){
    if (!rangy.initialized)
      rangy.init();

    if (this.props.autoFocus) {
      this.autofocus();
    }
  },

  componentDidUpdate: function(prevProps, prevState){
    this._showSelection();
  },

  autofocus: function(){
    this.getDOMNode().focus();
    this._showSelection();
  },

  render: function() {
    var content = [];
    var windowPosition = this.state.windowPosition;
    var id, lexems, codeLine;
    for (var iLine = windowPosition.firstLine; iLine <= windowPosition.lastLine; iLine += 1) {
      codeLine = [];
      if (this.props.codeHighlight) {
        lexems = this.props.text.getLexems(
              RopePosition(iLine, windowPosition.firstColumn),
              RopePosition(iLine, windowPosition.lastColumn)
            )
        
        // assume at least one (newline symbol) is presented
        for (var i = 0; i < lexems.length; i += 1) {
          codeLine.push(
            <span className={LexerDomainClassname[lexems[i].domain]}>{lexems[i].string}</span>
          )
        }
        if (lexems.length == 0)
          codeLine = " ";
      } else { // don't highlight code
        codeLine = this.props.text.substr(RopePosition(iLine, windowPosition.firstColumn),
              RopePosition(iLine, windowPosition.lastColumn))
        if (codeLine === "")
          codeLine = " ";
      }
      id = 'codeLine_' + iLine;
      content.push(
        <div className={"codeLine"} key={id} ref={id}><pre>{codeLine}</pre></div>
      )
    }
    
    return (
      <div>
      <div
        tabIndex = {this.props.autoFocus ? -1 : 0}
        contentEditable = {true}
        spellCheck = {false}
        onPaste = {this.onPaste}
        onMouseDown = {this.onMouseDown}
        onSelect = {this.onSelect}
        onTouchStart = {this.onMouseDown}
        onKeyDown = {this.onKeyDown}
        onKeyPress = {this.onKeyPress}
        onKeyUp = {this.onKeyUp}
        ref = {"codeLines"}
      >
        {content}
      </div>
        <div>{this.state.selection.getCursorLine()} - {this.state.selection.getCursorColumn()}</div>
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
      // assume cursor wass changed by key event
      this.state.cursorHandled = false;
      return;
    }
    
    var relativeSelection = new Selection.RelativeSelection()
    relativeSelection.updateFromNative(this.state.domManager);
    this.state.selection = relativeSelection.getAbsoluteSelection(this.state.windowPosition, this.props.text);
    
    // may require update if cursor position became greater than line length
    var needUpdate = this.state.windowPosition.tryUpdateToSelection(this.state.selection);
    if (needUpdate) {
      // prevent default action to stop additional (native) caret movement
      this._preventDefaultEventAction(e);
      this.forceUpdate();
    }
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
    var selection = this.state.selection;

    if (! (key == 'ArrowUp' || key == 'ArrowDown' || key == 'PageUp' || key == 'PageDown'))
      selection.resetSavedCursorColumn();

    if (key == 'ArrowLeft' || key == 'ArrowRight' || key == 'ArrowDown' || key == 'ArrowUp' ||
        key == 'PageUp' || key == 'PageDown')
      this.state.cursorHandled = true;
    
    if (key == 'Shift') {
      selection.setCollapsed(false);
    } else if (key == 'ArrowLeft') {
      if (selection.isCursorOnLineStart()) {
        if (selection.isPreviousLineExist())
          selection.moveCursorToLineEnd(selection.getCursorLine() - 1)
      } else // not on real line start
        selection.moveCursorLeft()
      
    } else if (key == 'ArrowRight') {
      if (selection.isCursorOnLineEnd()) {
        if (selection.isNextLineExist())
          selection.moveCursorToLineStart(selection.getCursorLine() + 1)
      } else // not on real line end
        selection.moveCursorRight()

    } else if (key == 'ArrowUp') {
      if (selection.isPreviousLineExist())
        selection.moveCursorUp()
      else // prev line does not exist
        selection.moveCursorToLineStart(selection.getCursorLine())
        
    } else if (key == 'ArrowDown') {
      if (selection.isNextLineExist())
        selection.moveCursorDown()
      else // next line does not exist
        selection.moveCursorToLineEnd(selection.getCursorLine())
      
    } else if (key == 'Home') {
      selection.moveCursorToLineStart(selection.getCursorLine())

    } else if (key == 'End') {
      selection.moveCursorToLineEnd(selection.getCursorLine())

    } else if (key == 'PageUp') {
      if (selection.isPreviousLineExist())
        selection.moveCursorUp(this.props.linesVisible)
      else
        selection.moveCursorToLineStart(selection.getCursorLine())

    } else if (key == 'PageDown') {
      if (selection.isNextLineExist())
        selection.moveCursorDown(this.props.linesVisible)
      else
        selection.moveCursorToLineEnd(selection.getCursorLine())

    } else if (key == 'Backspace') {
      if (selection.isCursorOnLineStart()) {
        if (selection.isPreviousLineExist()) {
          var previousLine = selection.getCursorLine() - 1,
              previousLineLength = this.props.text.getLineLength(previousLine);
          selection.moveCursorToLineEnd(previousLine);
          this.props.text.remove(
            RopePosition(previousLine, previousLineLength),
            RopePosition(previousLine, previousLineLength));
        }
      } else { // not on real line start
        var symbolPosition = RopePosition(selection.getCursorLine(), selection.getCursorColumn() - 1);
        this.props.text.remove(symbolPosition, symbolPosition);
        selection.moveCursorLeft();
      }
      this._preventDefaultEventAction(e)
      this.forceUpdate();

    } else if (key == 'Delete') {
      if (selection.isCursorOnLineEnd()) {
        if (selection.isNextLineExist()) {
          var symbolPosition = RopePosition(selection.getCursorLine(), this.props.text.getLineLength(selection.getCursorLine()))
          this.props.text.remove(symbolPosition, symbolPosition);
        }
      } else { // not on real line end
        var symbolPosition = RopePosition(selection.getCursorLine(), selection.getCursorColumn());
        this.props.text.remove(symbolPosition, symbolPosition);
      }
      this._preventDefaultEventAction(e)
      this.forceUpdate();

    } else if (key == 'Tab') {
      
    }

    var needUpdate = this.state.windowPosition.tryUpdateToSelection(selection);
    if (needUpdate) {
      // prevent default action to stop additional (native) caret movement
      this._preventDefaultEventAction(e);
      this.forceUpdate();
    } else {
      if (!selection.isCollapsed || key == 'ArrowUp' || key == 'ArrowDown' || key == 'PageUp' || key == 'PageDown') {
        // show cursor at end of line if virtual cursor > line length and while range selection
        this._preventDefaultEventAction(e)
        this._showSelection();
      }
    }
  },
  
  onKeyPress: function(e){
    var key = e.key;
    var selection = this.state.selection;

    if (key == 'Enter')
      key = "\n";
    
    this.props.text.insert(RopePosition(selection.getCursorLine(), selection.getCursorColumn()), key)
    if (key == "\n")
      selection.moveCursorToLineStart(selection.getCursorLine() + 1);
    else
      selection.moveCursorRight();
    this._preventDefaultEventAction(e)
    this.forceUpdate();
  },
  
  onKeyUp: function(e) {
    if (e.key == 'Shift')
      this.state.selection.setCollapsed(true);
  },
      
  _preventDefaultEventAction: function(event) {
    event.preventDefault();
    event.stopPropagation();
  },

  _showSelection: function(){
    this.state.selection.getRelativeSelection(this.state.windowPosition).show(this.state.domManager);
  },
  
});

  return EditField
});