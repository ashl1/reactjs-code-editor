var Photo = React.createClass({displayName: "Photo",

  render: function() {
    return React.createElement("img", {src: "http:tinyurl.comlkevsb9"})
  }
});

React.render(
  React.createElement(Photo, null)
);