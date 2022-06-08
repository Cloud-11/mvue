export interface NodeOps {
  insert(parent: Element, child: Element, anchor?: Element): void;
  remove(child: Element): void;
  createElement(tagName: string): Element;
  createText(text: string): Text;
  createComment(text: string): Comment;
  setText(node: Text, text: string): void;
  setElementText(node: Element, text: string): void;
  parentNode(node: Node): Node | null;
  nextSibling(node: Node): Node | null;
  querySelector(selector: string): Element | null;
}
//dom操作
export const nodeOps: NodeOps = {
  //创建元素
  createElement(tagName: string) {
    return document.createElement(tagName);
  },
  //创建文本节点
  createText(text: string) {
    return document.createTextNode(text);
  },
  //创建注释节点
  createComment(text: string) {
    return document.createComment(text);
  },
  //插入节点
  insert: (child, parent, anchor) => {
    if (anchor != null) {
      parent.insertBefore(child, anchor);
    } else {
      parent.appendChild(child);
    }
  },
  //删除节点
  remove: (child) => {
    const parent = child.parentNode;
    if (parent != null) {
      parent.removeChild(child);
    }
  },
  //设置元素的文本
  setElementText: (node, text) => {
    node.textContent = text;
  },
  //设置文本节点的文本
  setText: (node, text) => {
    node.nodeValue = text;
  },
  //查询元素
  querySelector: (selector) => {
    return document.querySelector(selector);
  },
  //获取父节点
  parentNode: (node) => {
    return node.parentNode;
  },
  //获取下一个节点
  nextSibling: (node) => {
    return node.nextSibling;
  },
};
