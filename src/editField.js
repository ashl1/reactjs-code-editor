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
    onChange: React.PropTypes.func.isRequired, // after the text is changed
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

  componentWillReceiveProps: function(nextProps){
    this.state.selection = new Selection.AbsoluteSelection(nextProps.text);
    this.state.windowPosition = WindowPosition(this.state.windowPosition.firstLine, this.state.windowPosition.firstColumn, nextProps.linesVisible, nextProps.columnsVisible);
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
      <div
        tabIndex = {this.props.autoFocus ? -1 : 0}
        contentEditable = {true}
        spellCheck = {false}
        onPaste = {this.onPaste}
        onCut = {this.onCut}
        onCopy = {this.onCopy}
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
    )/*
        <div>{this.state.selection.getCursorLine()} - {this.state.selection.getCursorColumn()}</div>
      </div>
    )*/
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

  onCut: function(e) {
    this._preventDefaultEventAction(e);
    
    if (this.state.selection.isCollapsed())
      return;
    
    var positions = this._convertSelectionToRopePosition();
    e.clipboardData.setData('text/plain', this.props.text.substr(positions[0], positions[1]))
    this._tryDeleteSelectedText();
    this.state.windowPosition.tryUpdateToSelection(this.state.selection);
    this.forceUpdate();
    this.props.onChange();
  },
  
  onCopy: function(e) {
    this._preventDefaultEventAction(e);
    
    if (this.state.selection.isCollapsed())
      return;
    
    var positions = this._convertSelectionToRopePosition();
    e.clipboardData.setData('text/plain', this.props.text.substr(positions[0], positions[1]))
  },
  
  onPaste: function(e){
    this._preventDefaultEventAction(e);

    this._tryDeleteSelectedText();
    var text = e.clipboardData.getData('text/plain');
    this.props.text.insert(RopePosition(this.state.selection.getCursorLine(), this.state.selection.getCursorColumn()), text)
    this.state.windowPosition.tryUpdateToSelection(this.state.selection);
    this.forceUpdate()
    this.props.onChange();
  },

  onKeyDown: function(e) {
    var key = e.key;
    var selection = this.state.selection;

    if (key == 'ArrowLeft' || key == 'ArrowRight' || key == 'ArrowDown' || key == 'ArrowUp' ||
        key == 'PageUp' || key == 'PageDown')
      this.state.cursorHandled = true;
    
    if (key == 'Shift') {
      selection.selectingState = true;
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
      else {// prev line does not exist
        selection.moveCursorToLineStart(selection.getCursorLine())
        selection.resetSavedCursorColumn();
      }
        
    } else if (key == 'ArrowDown') {
      if (selection.isNextLineExist())
        selection.moveCursorDown()
      else { // next line does not exist
        selection.moveCursorToLineEnd(selection.getCursorLine())
        selection.resetSavedCursorColumn();
      }
      
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
      if (!this._tryDeleteSelectedText()) {
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
      }
      this._preventDefaultEventAction(e)
      this.forceUpdate();

    } else if (key == 'Delete') {
      if (!this._tryDeleteSelectedText()) {
        if (selection.isCursorOnLineEnd()) {
          if (selection.isNextLineExist()) {
            var symbolPosition = RopePosition(selection.getCursorLine(), this.props.text.getLineLength(selection.getCursorLine()))
            this.props.text.remove(symbolPosition, symbolPosition);
          }
        } else { // not on real line end
          var symbolPosition = RopePosition(selection.getCursorLine(), selection.getCursorColumn());
          this.props.text.remove(symbolPosition, symbolPosition);
        }
      }
      this._preventDefaultEventAction(e)
      this.forceUpdate();

    } else if (key == 'Tab') {
      
    }

    if (!(key == 'ArrowUp' || key == 'ArrowDown' || key == 'PageUp' || key == 'PageDown'))
      selection.resetSavedCursorColumn();

    if (key !== 'Unidentified') {
      var needUpdate = this.state.windowPosition.tryUpdateToSelection(selection);
      if (needUpdate) {
        // prevent default action to stop additional (native) caret movement
        this._preventDefaultEventAction(e);
        this.forceUpdate();
        this.props.onChange();
      } else {
        if (key == 'ArrowUp' || key == 'ArrowDown' || key == 'PageUp' || key == 'PageDown' || key == 'ArrowLeft' || key == 'ArrowRight') {
          // show cursor at end of line if virtual cursor > line length, and while range selection, and after selecting
          this._preventDefaultEventAction(e)
          this._showSelection();
        }
      }
    }
  },
  
  onKeyPress: function(e){
    var key = e.key;
    var selection = this.state.selection;

    if (key == 'Enter')
      key = "\n";
    
    this._tryDeleteSelectedText();
    selection.collapse();
    selection.selectingState= false;
    
    this.props.text.insert(RopePosition(selection.getCursorLine(), selection.getCursorColumn()), key)
    if (key == "\n")
      selection.moveCursorToLineStart(selection.getCursorLine() + 1);
    else
      selection.moveCursorRight();
    this._preventDefaultEventAction(e)
    this.state.windowPosition.tryUpdateToSelection(selection)
    this.forceUpdate();
    this.props.onChange();
  },
  
  onKeyUp: function(e) {
    if (e.key == 'Shift')
      this.state.selection.selectingState = false;
  },

  gotoLine: function(lineIndex) {
    lineIndex = Math.min(lineIndex, this.props.text.getLinesCount() - this.props.linesVisible);
    this.state.windowPosition = WindowPosition(lineIndex, this.state.windowPosition.firstColumn,
      this.props.linesVisible, this.props.columnsVisible)
    this.forceUpdate();
  },
  
  _convertSelectionToRopePosition: function(){
    var selection = this.state.selection.clone();
    
    if (selection.isReversed())
      selection.reverse()
    var lastLine = selection.lastLine - (selection.lastColumn === 0? 1: 0)
    var lastColumn = selection.lastColumn === 0? this.props.text.getLineLength(lastLine): selection.lastColumn - 1;
    return [RopePosition(selection.firstLine, selection.firstColumn), RopePosition(lastLine, lastColumn)]
  },
  
  _preventDefaultEventAction: function(event) {
    event.preventDefault();
    event.stopPropagation();
  },

  _showSelection: function(){
    this.state.selection.getRelativeSelection(this.state.windowPosition).show(this.state.domManager);
  },

  _tryDeleteSelectedText: function() {
    var selection = this.state.selection;
    
    if (selection.isCollapsed())
      return false;
    
    var positions = this._convertSelectionToRopePosition();
    this.props.text.remove(positions[0], positions[1]);
    
    // collapse to first symbols
    selection.setCursor(selection.firstLine, selection.firstColumn);
    return true;
  },
  
});

  return EditField
});