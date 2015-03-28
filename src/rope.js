/**
 * Based on source code:
 *	- component/rope: https://github.com/component/rope (MIT license)
 *  - google/closure-library (AvlTree): https://github.com/google/closure-library/blob/master/closure/goog/structs/avltree.js
 *       (Apache v2.0 license)
 */

define(function(require){

var RopeSPLIT_LENGTH = 15;
var RopeJOIN_LENGTH = 10;

function isDefined(arg) {
	if (typeof arg != 'undefined')
		return true;
	return false;
}

/*
 * This structure used as (line, column) for external usage, and (lines, symbolsLastLine) in internal
 * usage for the Rope. The meaning of symbolsLastLine depend on circumstances it's used.
 */

RopePosition = function () {
  if (!(this instanceof RopePosition)) return new RopePosition(arguments);

  if (arguments.length == 1 && typeof arguments == 'object')
  	arguments = arguments[0];

	if (arguments.length === 1) {
		if (arguments[0] instanceof RopePosition)
			return arguments[0]
		else if (typeof arguments[0] == 'string')
			return this._fromString(arguments[0])
		else if (typeof arguments[0] == 'number')
			return this._fromIndex(arguments[0])
	} else if (arguments.length === 2)
		return this._fromLineColumn(arguments[0], arguments[1]);
	else if (arguments.length === 3)
		return this._fromFull(arguments[0], arguments[1], arguments[2]);
}


RopePosition.prototype.concat = function (position) {
	if (typeof position == 'undefined')
		return this;
	return RopePosition(
		this.count + position.count,
		this.lines + position.lines - 1,
		position.symbolsLastLine + (position.lines == 1? this.symbolsLastLine: 0)
		)
}

RopePosition.prototype.determineInfo = function(ropeLeaf) {
	if (this._isDefinedCount()){
		if (!this._isDefinedLinesColumn()) {

			this.lines = 0;
			this.symbolsLastLine = 0;

			for (var i = 0; i < this.count; i+=1) {
				if (ropeLeaf.value[i] == '\n') {
					this.lines += 1;
					this.symbolsLastLine = 0;
				} else
					this.symbolsLastLine += 1;
			}
			return;
		}
	} else { // count is not defined
		if (this._isDefinedLinesColumn()) {
			this.count = 0;

			for (var iLines = 1, iSymbols = 0; (iLines < this.lines) || ((iLines === this.lines) && (iSymbols < this.symbolsLastLine)); this.count += 1) {
				if (ropeLeaf.value[this.count] == '\n') {
					iLines += 1;
					iSymbols = 0;
				} else
					iSymbols += 1;
			}
		}
		return;
	}
	throw Error('Can\'t determine necassary info due to lack information')
}

RopePosition.prototype._fromFull = function(index, lines, column) {
	var res = RopePosition();
	res.count = index;
	res.lines = lines;
	res.symbolsLastLine = column;
	return res;
}

RopePosition.prototype._fromIndex = function(index) {
	var res = RopePosition();
	res.count = index;
	return res;
}

RopePosition.prototype._fromLineColumn = function(lines, column) {
	var res = new RopePosition()
	res.lines = lines;
	res.symbolsLastLine = column;
	return res;
}

RopePosition.prototype._fromString = function(string) {
	var res = new RopePosition()
	res.count = string.length;
	res.lines = (string.match(/\n/g) || []).length + 1;
	res.symbolsLastLine = string.length - (string.lastIndexOf('\n') + 1);
	return res;
}

RopePosition.prototype._isDefinedCount = function(){
	return isDefined(this.count);
}

RopePosition.prototype._isDefinedLinesColumn = function(){
	return isDefined(this.lines) && isDefined(this.symbolsLastLine);
}

RopePosition.prototype.isLess = function(position) {
	if (this._isDefinedCount() && position._isDefinedCount()) {
		return this.count < position.count;
	}

	if (this._isDefinedLinesColumn() && position._isDefinedLinesColumn()) {
		return this.lines < position.lines? true:
						 this.lines == position.lines? this.symbolsLastLine < position.symbolsLastLine: false;
	}

	throw Error("RopePosition's don't contain the appropriate info")
}

RopePosition.prototype.isEqual = function(position) {
	var ok = false;
	if (this._isDefinedCount() && position._isDefinedCount())
		ok = this.count === position.count;

	if (this._isDefinedLinesColumn && position._isDefinedLinesColumn())
		ok = ok && (this.lines === position.lines) && (this.symbolsLastLine === position.symbolsLastLine)

	return ok;
}

/*RopePosition.prototype.isLessOrEqual = function(position) {
	return this.isLess(position) || this.isEqual(position);
}*/

RopePosition.prototype.split = function(positionSecond) {
	var left = RopePosition(), right = RopePosition();
	if (this._isDefinedCount() && positionSecond._isDefinedCount()) {
		left.count = positionSecond.count;
		right.count = this.count - positionSecond.count;
	}

	if (this._isDefinedLinesColumn() && positionSecond._isDefinedLinesColumn()) {
		left.lines = positionSecond.lines;
		right.lines = this.lines - positionSecond.lines + 1;
		left.symbolsLastLine = positionSecond.symbolsLastLine;
		right.symbolsLastLine = this.symbolsLastLine - (right.lines == 1? positionSecond.symbolsLastLine: 0);
	}

	return [left, right]
}

///////////////////////////////////////////////////////////////////////////////////////////
////////////                     RopeNode                                      ////////////
///////////////////////////////////////////////////////////////////////////////////////////

RopeNode = function(string) {
	// allow usage without `new`
  if (!(this instanceof RopeNode)) return new RopeNode(string);

  this.height = 1;
  if (string) {
	  this.value = string;
	  this.length = RopePosition(string);
	  adjust.call(this);
	}
}

/**
 * Adjusts the tree structure, so that very long nodes are split
 * and short ones are joined
 *
 * @api private
 */

function adjust() {
  if (this.isLeaf()) {
    if (this.length.count > RopeSPLIT_LENGTH) {
      var divide = Math.floor(this.length.count / 2);
      this.setLeft(new RopeNode(this.value.substring(0, divide)));
      this.setRight(new RopeNode(this.value.substring(divide)));
      delete this.value;
    }
  } else {
    if (this.length.count < RopeJOIN_LENGTH) {
      this.value = this.left.toString() + this.right.toString();
      delete this.left;
      delete this.right;
    }
  }
  this.recalculate();
}


RopeNode.prototype.append = function(rope) {
	if (!rope)
		return this;

	var isLeftHigherOrEqual = this.height >= rope.height;
	var leftSubtree = this;
	var rightSubtree = rope;

	// find the same depth
	var levelsDiff = Math.abs(leftSubtree.height - rightSubtree.height)
	if (isLeftHigherOrEqual) {
		for (var i = 0; i < levelsDiff && leftSubtree.right; i+=1)
			leftSubtree = leftSubtree.right;
	} else { // right is higher
		for (var i = 0; i < levelsDiff && rightSubtree.left; i+=1)
			rightSubtree = rightSubtree.left;
	}

	var newNode = new RopeNode();
	if (isLeftHigherOrEqual) {
		if (leftSubtree.parent) leftSubtree.parent.setRight(newNode);
	} else { // right is higher
		rightSubtree.parent.setLeft(newNode);
	}
	newNode.setLeft(leftSubtree);
	newNode.setRight(rightSubtree);
	newNode.recalculate();
	newNode.balance(newNode)

	while (newNode.parent)
		newNode = newNode.parent;
	return newNode;
}


/**
 * Ensures that the specified node and all its ancestors are balanced. If they
 * are not, performs left and right tree rotations to achieve a balanced
 * tree. This method assumes that at most 2 rotations are necessary to balance
 * the tree (which is true for AVL-trees that are balanced after each node is
 * added or removed).
 *
 * @param {goog.structs.AvlTree.Node<T>} node Node to begin balance from.
 * @private
 */
RopeNode.prototype.balance = function(node) {
  this.traverse(function(node) {
    // Calculate the left and right node's heights
    var lh = node.left ? node.left.height : 0;
    var rh = node.right ? node.right.height : 0;

    // Rotate tree rooted at this node if it is not AVL-tree balanced
    if (lh - rh > 1) {
      if (node.left.right && (!node.left.left ||
          node.left.left.height < node.left.right.height)) {
        this.leftRotate(node.left);
      	node.left.recalculate();
      	node.left.parent.recalculate()
      }
      this.rightRotate(node);
    } else if (rh - lh > 1) {
      if (node.right.left && (!node.right.right ||
          node.right.right.height < node.right.left.height)) {
        this.rightRotate(node.right);
      node.right.recalculate()
      node.right.parent.recalculate();
      }
      this.leftRotate(node);
    }

    node.recalculate();

    // Traverse up tree and balance parent
    return node.parent;
  }, node);

};

RopeNode.prototype.checkHeights = function(){
	if (this.isLeaf()) {
		if (this.height === 1)
			return true;
		else
			throw Error('Bad height info')
	}

	var lh = 0, rh = 0;
	if (this.left) {
		this.left.checkHeights()
		lh = this.left.height;
	}
	if (this.right) {
		this.right.checkHeights()
		rh = this.right.height;
	}
	if (this.height == (Math.max(lh, rh) + 1))
		return true
	else
		throw Error('Bad height info')
}

RopeNode.prototype.checkLinks = function () {
	if (this.isLeaf())
		return true;

	if (this.left) {
		this.left.checkLinks()
		if (this.left.parent !== this)
			throw Error('Wrong link')
	}

	if (this.right) {
		this.right.checkLinks();
		if (this.right.parent !== this)
			throw Error('Wrong link')
	}

	return true;
}

RopeNode.prototype.checkPositions = function() {
	if (this.left)
		this.left.checkPositions()
	if (this.right)
		this.right.checkPositions()
	if (this.isLeaf()) {
		if (!this.length.isEqual(RopePosition(this.value)))
			throw Error("The length is wrong")
	} else { // not a leaf
		// FIXME: !!!
	}
}

RopeNode.prototype.getAbsolutePosition = function(relativePosition) {
	var curNode = this;
	while (curNode) {
		if (curNode.parent && !curNode.isLeftChild()) { // curNode is right child
			relativePosition = curNode.parent.left.length.concat(relativePosition)
		}
		curNode = curNode.parent;
	}
	return relativePosition;
}

RopeNode.prototype.getDot = function(prevPath, direction) {
	if (typeof prevPath == 'undefined')
		prevPath = ''
	if (typeof direction == 'undefined')
		direction = 'o'

	var curPath = prevPath + direction;

	if (this.isLeaf())
		return [prevPath, ' -> "', this.value, "\"\n"].join(''); 
	


	var s = [prevPath, ' -> ', curPath, "\n"].join('');
	if (this.left)
		s += this.left.getDot(curPath, 'l')
	if (this.right)
		s += this.right.getDot(curPath, 'r')
	return s;
}

/**
 * @param {int|RopePosition} indexOrPosition The absolute symbol index as if rope contains one big string OR The absolute position of symbol the return node must contain. This position may not define index of symbol because the search only use lines/column info
 * @return {{node: RopeNode, position: RopePosition}} Always return RopePosition with full info
 */

RopeNode.prototype.getNode = function(indexOrPosition) {
	var position = RopePosition(indexOrPosition);
	var curNode = this;
	
	// find the node to start from
	while (!curNode.isLeaf()) {
		if (curNode.left && position.isLess(curNode.left.length))
			curNode = curNode.left;
		else {
			position = position.split(curNode.left.length)[1];
			curNode = curNode.right;
		}
	}

	position.determineInfo(curNode);
	return {'node': curNode, 'position': position}
}


RopeNode.prototype.isLeaf = function() {
	return typeof this.value != 'undefined';
}

/**
 * Returns true iff the specified node has a parent and is the left child of
 * its parent.
 *
 * @return {boolean} Whether the specified node has a parent and is the left
 *    child of its parent.
 */
RopeNode.prototype.isLeftChild = function() {
  return !!this.parent && this.parent.left == this;
};

/**
 * Performs a left tree rotation on the specified node.
 *
 * @param {goog.structs.AvlTree.Node<T>} node Pivot node to rotate from.
 * @private
 */
RopeNode.prototype.leftRotate = function(node) {
  // Re-assign parent-child references for the parent of the node being removed
	if (node.parent) {
		if (node.isLeftChild())
			node.parent.setLeft(node.right);
		else // is right child
			node.parent.setRight(node.right);
	} else {
		node.right.parent = null;
	}

	// Re-assign parent-child references for the child of the node being removed
	var temp = node.right;
	node.right = node.right.left;
	if (node.right != null) node.right.parent = node;
	temp.setLeft(node);
};

RopeNode.prototype.recalculate = function() {
	var lh = this.left ? this.left.height : 0;
	var rh = this.right ? this.right.height : 0;
	this.height = Math.max(lh, rh) + 1;


	if (!this.isLeaf()) {
		if (this.left) {
			if (this.right)
				this.length = this.left.length.concat(this.right.length)
			else // only left
				this.length = left.length
		} else // only right
			this.length = this.right.length;
	} else { // is leaf
		this.length = RopePosition(this.value)
	}
}

/**
 * Performs a right tree rotation on the specified node.
 *
 * @param {goog.structs.AvlTree.Node<T>} node Pivot node to rotate from.
 * @private
 */
RopeNode.prototype.rightRotate = function(node) {
  // Re-assign parent-child references for the parent of the node being removed
	if (node.parent) {
  	if (node.isLeftChild())
    	node.parent.setLeft(node.left);
  	else // is right child
    	node.parent.setRight(node.left);
	} else {
		node.left.parent = null;
	}
  
	// Re-assign parent-child references for the child of the node being removed
	var temp = node.left;
	node.left = node.left.right;
	if (node.left != null) node.left.parent = node;
	temp.setRight(node);
};

RopeNode.prototype.setLeft = function(ropeNode) {
	this.left = ropeNode;
	this.left.parent = this;
}

RopeNode.prototype.setRight = function(ropeNode) {
	this.right = ropeNode;
	this.right.parent = this;
}

/**
 * @param {int} indexSecond The absolute index of symbol, the second rope will be started from
 */

RopeNode.prototype.split = function(indexSecond) {
	if (indexSecond < 0 || !(indexSecond < this.length.count))
		throw RangeError('indexSecond is not within rope bounds')
	
	var left, right, res

	if (this.isLeaf()) {
		left = this.value.substr(0, indexSecond);
		left = left == ''? null: RopeNode(left);
		right = this.value.substr(indexSecond);
		right = right == ''? null: RopeNode(right);
		return [left, right]
	}

	if (this.left && (indexSecond < this.left.length.count)) { // go left
		right = this.right;
		this.unsetRight();
		res = this.left.split(indexSecond);
		left = res[0]
		if (res[1])
			right = res[1].append(right);
		else
			right.parent = null;
	} else { // else go_right
		left = this.left;
		this.unsetLeft();
		res = this.right.split(indexSecond - left.length.count);
		if (left)
			left = left.append(res[0])
		else
			left = res[0]
		right = res[1]
	}

	return [left, right]
}

RopeNode.prototype.toString = function() {
  if (this.isLeaf()) {
    return this.value;
  } else {
    return this.left.toString() + this.right.toString();
  }
}

/**
 * Performs a traversal defined by the supplied {@code traversalFunc}. The first
 * call to {@code traversalFunc} is passed the root or the optionally specified
 * startNode. After that, calls {@code traversalFunc} with the node returned
 * by the previous call to {@code traversalFunc} until {@code traversalFunc}
 * returns null or the optionally specified endNode. The first call to
 * traversalFunc is passed the root or the optionally specified startNode.
 *
 * @param {function(
 *     this:goog.structs.AvlTree<T>,
 *     !goog.structs.AvlTree.Node):?goog.structs.AvlTree.Node} traversalFunc
 * Function used to traverse the tree.
 * @param {goog.structs.AvlTree.Node<T>=} opt_startNode The node at which the
 *     traversal begins.
 * @param {goog.structs.AvlTree.Node<T>=} opt_endNode The node at which the
 *     traversal ends.
 * @private
 */
RopeNode.prototype.traverse = function(traversalFunc, opt_startNode, opt_endNode) {
	var node = opt_startNode ? opt_startNode : this.root_;
	var endNode = opt_endNode ? opt_endNode : null;
	while (node && node != endNode) {
		node = traversalFunc.call(this, node);
	}
};

RopeNode.prototype.unsetLeft = function() {
	if (!this.left) return;
	this.left.parent = null;
	this.left = null;
}

RopeNode.prototype.unsetRight = function() {
	if (!this.right) return;
	this.right.parent = null;
	this.right = null;
}

///////////////////////////////////////////////////////////////////////////////////////////
////////////                     Rope                                          ////////////
///////////////////////////////////////////////////////////////////////////////////////////

Rope = function(string) {
	if (!(this instanceof Rope)) return new Rope(string);

	this.rope = new RopeNode(string)
}

Rope.prototype._getIndexFromPosition = function(indexOrPosition, defaultValue) {
	if (!isDefined(indexOrPosition))
		return defaultValue;

	if (typeof indexOrPosition == 'number')
		// this is index
		return indexOrPosition;
	var target = this.rope.getNode(indexOrPosition);
	return target.node.getAbsolutePosition(target.position).count;
}

// ASSUME: position has 'line' and 'symbolsLastLine' (column) properties

Rope.prototype._isPositionInBounds = function(position) {
  if (position instanceof RopePosition)
    return  (position.lines <= this.rope.length.lines) && (position.symbolsLastLine <= this.getLineLength(position.lines))
  // assume position is index [number]
  return position >= 0 && position <= this.rope.length.count;
}

/**
 * @return {int} Count of the symbols in the line (without last newline)
 */

Rope.prototype.getLineLength = function (lineIndex) {
  if (lineIndex > this.rope.length.lines)
    return 0;
  
  var startIndex = this._getIndexFromPosition(RopePosition(lineIndex, 0));
  var endIndex;
  if (lineIndex == this.rope.length.lines)
    endIndex = this.rope.length.count;
  else
    endIndex = this._getIndexFromPosition(RopePosition(lineIndex + 1, 0)) - 1;
  return endIndex - startIndex + 1;
}

Rope.prototype.getLinesCount = function () {
  return this.rope.length.lines;
}

Rope.prototype.insert = function(startPosition, stringOrRope) {
	var startIndex = this._getIndexFromPosition(startPosition);
	// FIXME: determine can we add to the only one leaf or to neighbour instead of create new leaf
	var split = this.rope.split(startIndex);
	this.rope = stringOrRope.append(split[1]);
	if (split[0])
		this.rope = split[0].append(this.rope)
}

Rope.prototype.remove = function(startPosition, endPosition) {
	var startIndex = this._getIndexFromPosition(startPosition);
	var endIndex = this._getIndexFromPosition(endPosition);
	// FIXME: determine can we join two leafs in the break
	var split = this.rope.split(startIndex);
	var split2 = split[1].split(endIndex - startIndex + 1);
	if (split[0])
		this.rope = split[0].append(split2[1]);
	else {
		if (split2[1])
			this.rope = split2[1]
		else
			this.rope = RopeNode("")
	}
}

Rope.prototype.substr = function(startPosition, endPosition) {
	startPosition = isDefined(startPosition)? startPosition: 0;
	endPosition = isDefined(endPosition)? endPosition: this.rope.length.count - 1;

  // ASSUME: startPosition and endPosition are on the same line and endPosition >= startPosition.
  //   In other case, the logic of determine if position not in bounds will be wrong
  if (!this._isPositionInBounds(startPosition))
    return "";
  else { // has first symbols
    if (!this._isPositionInBounds(endPosition))
      endPosition = endPosition instanceof RopePosition?
        RopePosition(endPosition.lines, this.getLineLength(endPosition.lines) - 1):
        this.rope.length.count - 1;
  }
  
	var startNode = this.rope.getNode(startPosition);
	var endNode = this.rope.getNode(endPosition);

	if (startNode.node === endNode.node)
		return startNode.node.value.substring(startNode.position.count, endNode.position.count + 1)
	
	var str = new Array();
	str.push(startNode.node.value.substring(startNode.position.count));

	var prevNode = startNode.node;
	var curNode = startNode.node.parent;

	while (curNode != endNode.node) {
		if (curNode.left && prevNode !== curNode.left && prevNode !== curNode.right)
			curNode = curNode.left;
		else {
			if (curNode.isLeaf()) {
				str.push(curNode.value);
			}
			var temp = curNode;
			curNode = curNode.right && prevNode != curNode.right?
								curNode.right:
								curNode.parent;
			prevNode = temp;
		}
	}
	str.push(curNode.value.substring(0, endNode.position.count))

	return str.join('')
}

Rope.prototype.getDot = function() {
	return this.rope.getDot() 
}

return {
	Rope: Rope,
	RopePosition: RopePosition
}

});