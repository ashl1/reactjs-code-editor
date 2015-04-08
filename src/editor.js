define(['react', 'rope', 'editField', 'lexer'], function(React, rope, EditField, lexer) {
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
          editorSelf.editorForm = React.render(
            <EditField
              linesVisible = {10}
              columnsVisible = {30}
              text = {editorSelf.rope}
              onChange = {onChange}
            />, editorSelf.editField
          )
        }
        editorSelf.editField.innerHTML = "загружается...";
        fileReader.readAsText(filename)
      }
    }
  }
  
  var editor = new Editor();
  document.getElementById("userFile").addEventListener("change", editor.fileChanged);
});