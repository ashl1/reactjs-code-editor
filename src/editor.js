define(['react', 'rope', 'editField', 'lexer', 'measure-string'], function(React, rope, EditField, lexer, MeasureString) {
  var onChange = function(){
    
  }

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
        <EditField
          linesVisible = {this.height}
          columnsVisible = {this.width}
          text = {this.rope}
          onChange = {onChange}
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
      this.height = MeasureString.getMonoTextLengthLessOrEqualElementHeight(this.editField.clientHeight, codeLineElement.childNodes[0], codeLineElement);

      this.show();
    }
    
    this.setLineStart = function(lineStart) {
      this.editorForm.gotoLine(lineStart)
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
  var lineStart = document.getElementById('lineStart')
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
  lineStart.addEventListener('change', function(event){
    editor.setLineStart(Number(event.target.value))
  })
  window.addEventListener('resize', function(){
    editor.tryAutosize();
  })
});