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
      firstColumnPos: 1,      
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
      content.push(this.props.text.substr(RopePosition(iLine, this.state.firstColumnPos),
                  RopePosition(iLine, this.state.firstColumnPos + this.props.columnsVisible)));
    }

    return React.createElement('div', {
      tabIndex: this.props.autoFocus ? -1 : 0,
      contentEditable: true,
      onKeyDown: this.onKeyDown,
      onPaste: this.onPaste,
      onMouseDown: this.onMouseDown,
      onTouchStart: this.onMouseDown,
      onKeyPress: this.onKeyPress,
      onInput: this.onInput,
      onKeyUp: this.onKeyUp
    }, content);
  },

  setCursorToStart: function(){
    this.getDOMNode().focus();
    if (isNotServer) {
      var sel = window.getSelection();
      var range = document.createRange();
      range.setStart(this.getDOMNode(), 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  },

  onMouseDown: function(e) {
    if (this.props.text.length) return;
    this.setCursorToStart();
    e.preventDefault();
  },

  onKeyDown: function(e) {
    var self = this;

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

  onKeyPress: function(e){
    var val = e.target.textContent;

    // max-length validation on the fly
    if (this.props.maxLength && (val.length > this.props.maxLength)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
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
    var range = selectionRange(this.getDOMNode());
    this.setState({ range : range });
    this.props.onChange(val);
  }
  
});