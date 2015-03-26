var Photo = React.createClass({displayName: "Photo",

  render: function() {
    return (
      React.createElement("div", {className: "photo"}
      )
    )
  }
});


React.render(
  React.createElement(Photo, null), document.body
);