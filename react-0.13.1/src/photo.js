var Photo = React.createClass({

  render: function() {
    return (
      <div className='photo'>
        <img src='' />
        <span></span>
      </div>
    )
  }
});


React.render(
  <Photo/>, document.body
);