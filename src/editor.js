define(['react', 'rope', 'editField', 'lexer', 'measure-string'], function(React, rope, EditField, lexer, MeasureString) {
  var TwoEditFields = React.createClass({
    propTypes: {
      linesVisible: React.PropTypes.number,
      columnsVisible: React.PropTypes.number,
      
      text: React.PropTypes.instanceOf(Rope).isRequired,
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
  
    render: function(){
      var self = this
      return (
        <div>
        <EditField
          linesVisible = {this.props.linesVisible}
          columnsVisible = {this.props.columnsVisible}
          text = {this.props.text}
          onChange = {function(){self.update(2)}}
          ref = {"editField1"}
        />
        <EditField
          linesVisible = {this.props.linesVisible}
          columnsVisible = {this.props.columnsVisible}
          text = {this.props.text}
          onChange = {function(){self.update(1)}}
          ref = {"editField2"}
        />
        </div>
      )
    },
    
    update: function(editFieldIndex) {
      this.refs['editField'+editFieldIndex].forceUpdate();
    },
  })
  
  var Editor = function(){
    this.lexer = Lexer();
    this.rope = Rope("", this.lexer)
    this.editField = document.getElementById("editor")
    
    this.editorForm;
    var editorSelf = this;
    
    
    this.fileChanged = function(event){
      var filename = event.target.files[0];
      if (filename) {
        var fileReader = new FileReader();
        fileReader.onload = function(){
          editorSelf.rope = Rope(this.result, editorSelf.lexer);
          editorSelf.show()
        }
        editorSelf.editField.innerHTML = "загружается...";
        fileReader.readAsText(filename)
      }
    }
    
    this.getFirstElementByClassName = function(className) {
      var elems = document.getElementsByTagName('*'), i;
      for (i in elems)
          if((' ' + elems[i].className + ' ').indexOf(' ' + className + ' ') > -1)
              return elems[i];
    }
    
    this.show = function(){
      this.editorForm = React.render(
        <TwoEditFields
           linesVisible = {this.height}
           columnsVisible = {this.width}
           text = {this.rope}
        />, this.editField
      )
    }
    
    this.heightChanged = function(height) {
      this.height = height
      this.show()
    }
    
    this.widthChanged = function(width) {
      this.width = width
      this.show()
    }
    
    this.sizeChanged = function(height, width) {
      this.height = height
      this.width = width
      this.show()
    }
    
    this.autoSize = function() {
      var codeLineElement = this.getFirstElementByClassName('codeLine');
      this.width = MeasureString.getMonoTextLengthLessOrEqualElementWidth(this.editField.clientWidth, codeLineElement);
      this.height = Math.floor( MeasureString.getMonoTextLengthLessOrEqualElementHeight(this.editField.clientHeight, codeLineElement.childNodes[0], codeLineElement) / 2);

      this.show();
    }
    
    this.setLineStart = function(editFieldIndex, lineStart) {
      this.editorForm.refs['editField' + editFieldIndex].gotoLine(lineStart)
    }
    
    this.tryAutosize = function() {
      if (document.getElementById('editorSizeAuto').checked)
        this.autoSize();
    }
    
    this.tryAutosize();
  }
  
  var editor = new Editor();
  document.getElementById("userFile").addEventListener("change", editor.fileChanged);

  var editorHeight = document.getElementById('editorHeight');
  var editorWidth = document.getElementById('editorWidth');
  var lineStart1 = document.getElementById('lineStart1')
  var lineStart2 = document.getElementById('lineStart2')
  document.getElementById('editorSizeAuto').addEventListener('change', function(event){
    if (event.target.checked) {
      editorHeight.disabled = true;
      editorWidth.disabled = true;
      
      editor.autoSize();
    } else {
      editorHeight.disabled = false;
      editorWidth.disabled = false;
      
      editor.sizeChanged(Number(editorHeight.value), Number(editorWidth.value));
    }

  })
  editorHeight.addEventListener('change', function(event){
    editor.heightChanged(Number(event.target.value));
  })
  editorWidth.addEventListener('change', function(event){
    editor.widthChanged(Number(event.target.value));
  })
  lineStart1.addEventListener('change', function(event){
    editor.setLineStart(1, Number(event.target.value))
  })
  lineStart2.addEventListener('change', function(event){
    editor.setLineStart(2, Number(event.target.value))
  })
  window.addEventListener('resize', function(){
    editor.tryAutosize();
  })
});