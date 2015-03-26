var r = Rope("In computer programming a rope, or\n cord, is a data structure composed of smaller strings that\n is used for efficiently\n storing\n and\n manipulating\n a\n very\n long\n string.\n For example, a text editing program may use a rope to represent the text being edited, so that operations such as insertion,\n deletion, and random access can be done efficiently.");

var onChange = function(){
  
}

React.renderComponent(
  React.createElement(Editor, {
    text: r, 
    onChange: onChange}
  )
);
