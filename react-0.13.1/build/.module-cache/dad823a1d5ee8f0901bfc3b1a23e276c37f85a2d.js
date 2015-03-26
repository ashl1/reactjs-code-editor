var Photo = React.createClass({displayName: "Photo",

  render: function() {
    return (
      React.createElement("div", {className: "photo"}, 
        React.createElement("img", {src: ""}), 
        React.createElement("span", null)
      )
    )
  }
});
