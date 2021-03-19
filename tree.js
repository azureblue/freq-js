/**
 * @license
 * Copyright Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license. See LICENSE in the project root for details.
 * Copyright 2017 azureblue <https://github.com/azureblue>
 */

export function Node(key, value = null) {
    this.left = null;
    this.right = null;
    this.height = null;
    this.weight = 1;
    this.count = 1;
    this.key = key;
    this.value = value;
}

/**
 * Performs a right rotate on this node.
 *
 *       b                           a
 *      / \                         / \
 *     a   e -> b.rotateRight() -> c   b
 *    / \                             / \
 *   c   d                           d   e
 *
 * @return {Node} The root of the sub-tree; the node where this node used to be.
 */
Node.prototype.rotateRight = function () {
    var other = this.left;
    this.left = other.right;
    other.right = this;
    this.updateHeight();
    other.updateHeight();
    this.updateWeight();
    other.updateWeight();
    return other;
};
Node.prototype.updateHeight = function () {
    this.height = Math.max(this.leftHeight(), this.rightHeight()) + 1;
};

Node.prototype.updateWeight = function () {
    this.weight = this.count;
    if (this.left)
        this.weight += this.left.weight;
    if (this.right)
        this.weight += this.right.weight;
};

/**
 * Performs a left rotate on this node.
 *
 *     a                              b
 *    / \                            / \
 *   c   b   -> a.rotateLeft() ->   a   e
 *      / \                        / \
 *     d   e                      c   d
 *
 * @return {Node} The root of the sub-tree; the node where this node used to be.
 */
Node.prototype.rotateLeft = function () {
    var other = this.right;
    this.right = other.left;
    other.left = this;
    this.updateHeight();
    other.updateHeight();
    this.updateWeight();
    other.updateWeight();
    return other;
};

Node.prototype.leftHeight = function () {
    if (!this.left) {
        return -1;
    }
    return this.left.height;
};

Node.prototype.rightHeight = function () {
    if (!this.right) {
        return -1;
    }
    return this.right.height;
};

Node.prototype.leftWeight = function () {
    if (!this.left) {
        return 0;
    }
    return this.left.weight;
};

Node.prototype.rightWeight = function () {
    if (!this.right) {
        return 0;
    }
    return this.right.weight;
};


/**
 * @license
 * Copyright Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license. See LICENSE in the project root for details.
 * Copyright 2017 azureblue <https://github.com/azureblue>
 */

export function AvlOSTree() {
    this.reset();
}

AvlOSTree.prototype.reset = function() {
    this._root = null;
    this._size = 0;
}

AvlOSTree.prototype.insert = function (key, value = null) {
    this._root = this._insert(key, this._root, value);
    this._size++;
};

AvlOSTree.prototype._insert = function (key, root, value = null) {
    // Perform regular BST insertion
    if (root === null)
        return new Node(key, value);

    if (key < root.key)
        root.left = this._insert(key, root.left, value);
    else if (key > root.key)
        root.right = this._insert(key, root.right, value);
    else {
        root.count++;
        root.updateWeight();
        return root;
    }

    root.updateHeight();
    root.updateWeight();

    var balanceState = getBalanceState(root);

    if (balanceState === BalanceState.UNBALANCED_LEFT) {
        // Left left case
        if (key < root.left.key) {
            root = root.rotateRight();
        } else {
            // Left right case
            root.left = root.left.rotateLeft();
            return root.rotateRight();
        }
    }

    if (balanceState === BalanceState.UNBALANCED_RIGHT) {
        if (key >= root.right.key) {
            // Right right case
            root = root.rotateLeft();
        } else {
            // Right left case
            root.right = root.right.rotateRight();
            return root.rotateLeft();
        }
    }

    return root;
};

AvlOSTree.prototype.delete = function (key) {
    this._root = this._delete(key, this._root);
    this._size--;
};

AvlOSTree.prototype._delete = function (key, root) {
    // Perform regular BST deletion
    if (root === null) {
        this._size++;
        return root;
    }

    if (key < root.key) {
        // The key to be deleted is in the left sub-tree
        root.left = this._delete(key, root.left);
    } else if (key > root.key) {
        // The key to be deleted is in the right sub-tree
        root.right = this._delete(key, root.right);
    } else {
        if (root.count > 1) {
            root.count--;
            root.updateWeight();
            return root;
        }
        // root is the node to be deleted
        if (!root.left && !root.right) {
            root = null;
        } else if (!root.left && root.right) {
            root = root.right;
        } else if (root.left && !root.right) {
            root = root.left;
        } else {
            // Node has 2 children, get the in-order successor
            var inOrderSuccessor = minValueNode(root.right);
            root.key = inOrderSuccessor.key;
            root.right = this._delete(inOrderSuccessor.key, root.right);
        }
    }

    if (root === null) {
        return root;
    }

    root.updateHeight();
    root.updateWeight();
    var balanceState = getBalanceState(root);

    if (balanceState === BalanceState.UNBALANCED_LEFT) {
        // Left left case
        if (getBalanceState(root.left) === BalanceState.BALANCED ||
            getBalanceState(root.left) === BalanceState.SLIGHTLY_UNBALANCED_LEFT) {
            return root.rotateRight();
        }
        // Left right case
        if (getBalanceState(root.left) === BalanceState.SLIGHTLY_UNBALANCED_RIGHT) {
            root.left = root.left.rotateLeft();
            return root.rotateRight();
        }
    }

    if (balanceState === BalanceState.UNBALANCED_RIGHT) {
        // Right right case
        if (getBalanceState(root.right) === BalanceState.BALANCED ||
            getBalanceState(root.right) === BalanceState.SLIGHTLY_UNBALANCED_RIGHT) {
            return root.rotateLeft();
        }
        // Right left case
        if (getBalanceState(root.right) === BalanceState.SLIGHTLY_UNBALANCED_LEFT) {
            root.right = root.right.rotateRight();
            return root.rotateLeft();
        }
    }

    return root;
};

function minValueNode(root) {
    var current = root;
    while (current.left) {
        current = current.left;
    }
    return current;
}

function maxValueNode(root) {
    var current = root;
    while (current.right) {
        current = current.right;
    }
    return current;
}

AvlOSTree.prototype._selectKey = function (i, root) {
    var lw = root.leftWeight();
    if (i < lw)
        return this._selectKey(i, root.left);
    lw += root.count;
    if (i >= lw)
        return this._selectKey(i - lw, root.right);
    else
        return root.key;
};

AvlOSTree.prototype.selectKey = function (i) {
    if (!this._root || i < 0 || i >= this._root.weight)
        return undefined;
    return this._selectKey(i, this._root);
};

AvlOSTree.prototype.size = function () {
    return this._size;
};

var BalanceState = {
    UNBALANCED_RIGHT: 1,
    SLIGHTLY_UNBALANCED_RIGHT: 2,
    BALANCED: 3,
    SLIGHTLY_UNBALANCED_LEFT: 4,
    UNBALANCED_LEFT: 5
};

function getBalanceState(node) {
    var heightDifference = node.leftHeight() - node.rightHeight();
    switch (heightDifference) {
        case -2:
            return BalanceState.UNBALANCED_RIGHT;
        case -1:
            return BalanceState.SLIGHTLY_UNBALANCED_RIGHT;
        case 1:
            return BalanceState.SLIGHTLY_UNBALANCED_LEFT;
        case 2:
            return BalanceState.UNBALANCED_LEFT;
        default:
            return BalanceState.BALANCED;
    }
}
