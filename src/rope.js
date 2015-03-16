/**
 * Based on source code:
 *	- component/rope: https://github.com/component/rope (MIT license)
 *  - google/closure-library (AvlTree): https://github.com/google/closure-library/blob/master/closure/goog/structs/avltree.js
 *       (Apache v2.0 license)
 */

RopeSPLIT_LENGTH = 15;
RopeJOIN_LENGTH = 10;

/*RopePosition = function (rope, arguments) {
	this.rope = rope;
	// determine, whether we receive 1 argument (index), 2 arguments (line, count) or 3 arguments (index, line, count)
}

RopePosition.prototype.getIndex = function() {

}

RopePosition.prototype.getLineCount = function() {
	return [line, count]
}

RopePosition.prototype.isLess = function(position) {

}

RopePosition.prototype.isEqual = function(position) {

}

RopePosition.prototype.isLessOrEqual = function(position) {
	return this.isLess(position) || this.isEqual(position);
}

RopePosition.prototype.extend = function (position) {

}

RopePosition.prototype.split = function (position) {
	return [first, second]
}*/

ropePositionConcat = function(position1, position2) {
	return {
		'count': position1.count + position2.count,
		'lines': position1.lines + position2.lines - 1,
		'symbolsLastLine': position2.symbolsLastLine + (position2.lines == 1? position1.symbolsLastLine: 0),
	}
}

getRopePositionFromString = function(string) {
	return {
		'count': string.length,
		'lines': (string.match('/\n/g') || []).length + 1,
		'symbolsLastLine': string.length - (string.lastIndexOf('\n') + 1),
	}
}

RopeNode = function(string) {
	// allow usage without `new`
  if (!(this instanceof RopeNode)) return new RopeNode(string);

  this.height = 1;
  if (string) {
	  this.value = string;
	  this.length = getRopePositionFromString(string);
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
 * Position is symbol index
 */

RopeNode.prototype.getNode = function(position) {
	var curNode = this;
	
	// find the node to start from
	while (!curNode.isLeaf()) {
		if (curNode.left && (position < curNode.left.length.count))
			curNode = curNode.left;
		else {
			position -= curNode.left.length.count;
			curNode = curNode.right;
		}
	}

	return {'node': curNode, 'index': position}
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
				this.length = ropePositionConcat(this.left.length, this.right.length)
			else
				this.length = this.left.length 
		} else // only right
			this.length = this.right.length;
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
 * @param positionSecond The number of index, the second rope will be started from
 */

RopeNode.prototype.split = function(positionSecond) {
	if (positionSecond < 0 || !(positionSecond < this.length.count))
		throw RangeError('positionSecond is not within rope bounds')
	
	var left, right, res

	if (this.isLeaf()) {
		left = this.value.substr(0, positionSecond);
		left = left == ''? null: RopeNode(left);
		right = this.value.substr(positionSecond);
		right = right == ''? null: RopeNode(right);
		return [left, right]
	}

	if (this.left && (positionSecond < this.left.length.count)) { // go left
		right = this.right;
		this.unsetRight();
		res = this.left.split(positionSecond);
		left = res[0]
		if (res[1])
			right = res[1].append(right);
		else
			right.parent = null;
	} else { // else go_right
		left = this.left;
		this.unsetLeft();
		res = this.right.split(positionSecond - left.length.count);
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

Rope = function(string) {
	if (!(this instanceof Rope)) return new Rope(string);

	this.rope = new RopeNode(string)
}

Rope.prototype.insert = function(startPosition, stringOrRope) {
	// FIXME: determine can we add to the only one leaf or to neighbour
	var split = this.rope.split(startPosition);
	this.rope = split[0].append(stringOrRope).append(split[1]);
}

Rope.prototype.remove = function(startPosition, afterEndPosition) {
	// FIXME: determine can we join two leafs in the break
	var split = this.rope.split(startPosition);
	var split2 = split[1].split(afterEndPosition - startPosition);
	this.rope = split[0].append(split2[1]);
}

Rope.prototype.substr = function(startPosition, afterEndPosition) {
	if (typeof startPosition == 'undefined')
		startPosition = 0;
	if (typeof afterEndPosition == 'undefined')
		afterEndPosition = this.rope.length.count + 1;
	// FIXME: determine positions types

	// FIXME: check if endPosition == startPosition
	var endPosition = afterEndPosition - 1;

	var startNode = this.rope.getNode(startPosition);
	var endNode = this.rope.getNode(endPosition);

	if (startNode.node === endNode.node)
		return startNode.node.value.substring(startNode.index, endNode.index + 1)
	
	var str = new Array();
	str.push(startNode.node.value.substring(startNode.index));

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
	str.push(curNode.value.substring(0, endNode.index + 1))

	return str.join('')
}

Rope.prototype.getDot = function() {
	return this.rope.getDot() 
}