define(['react'], function(React){
  
  var DomManager = function(reactComponent){
    if (!(this instanceof DomManager)) return new DomManager(reactComponent);

    this.reactComponent = reactComponent;
  }
  
  DomManager.prototype.getLineNodeFromNestedNode = function(node) {
    while (!node.classList || !node.classList.length || node.classList[0] != 'codeLine')
      node = node.parentNode;
    return (node.classList && node.classList.length && node.classList[0] == 'codeLine')? node: null;
  }
  
  DomManager.prototype._getLineNodeByIndex = function(index) {
    var node = React.findDOMNode(this.reactComponent.refs['codeLines']);
    return node.childNodes[index];
  }

  DomManager.prototype.getNestedTextNodeAndOffset = function(lineIndex, offset){
    var node = this._getLineNodeByIndex(lineIndex);
    
    var length = 0;
    var resNode = node, resOffset = offset;
    this._visitNodes(node, function(node){
      if (offset > node.textContent.length) {
        offset -= node.textContent.length;
        return false;
      }
      resNode = node;
      resOffset = offset;
      return true;
    });
    return {node: resNode, offset: resOffset}
  }
  
  /*
   * @param node {DomNode} The node represented the one code line
   */
  DomManager.prototype.getRelativeLineIndexByNode = function(node) {
    var i = 0;
    while( (node = node.previousSibling) != null ) 
      i++;
    return i;
  }

    /**
   * Walk all text nodes of `node`.
   *
   * @param {Element|Node} node
   * @param {Function} fn
   * @api private
   */

  DomManager.prototype.isChildrenOfNode = function (node, baseNode) {
    while (node !== baseNode && node)
      node = node.parentNode;
    return node === baseNode;
  }
    
  DomManager.prototype._visitNodes = function (node, fn){
    if (node.nodeType == 3) 
      return fn(node)
    
    // not text node
    var nodes = node.childNodes;
    if (nodes.length) {
      for (var i = 0; i < nodes.length; ++i) {
        if (this._visitNodes(nodes[i], fn))
          return true;
      }
    }
    return false;
  }
  
  return DomManager;
})