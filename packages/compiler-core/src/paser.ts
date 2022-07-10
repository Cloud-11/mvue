import {
  NodeTypes,
  InterpolationNode,
  ElementNode,
  TextNode,
  ElementTypes,
  AttributeNode,
  SourceLocation,
  TemplateChildNode,
  RootNode,
  ParserContext,
} from "./ast";

import {
  advanceBy,
  advancePositionWithMutation,
  createPaserContext,
  getCursor,
  isEnd,
  paserTextData,
  getSelection,
  advanceBySpaces,
} from "./utils";

/**
 * 解析模板,返回ast
 * @param template 模板字符串
 * @returns AST树
 */
export function paser(template: string) {
  let context = createPaserContext(template);
  const start = getCursor(context);
  return createRoot(paserChildren(context), getSelection(context, start));
}

function createRoot(children: TemplateChildNode[], loc: SourceLocation): RootNode {
  return {
    type: NodeTypes.ROOT,
    helpers: [],
    children,
    loc,
  };
}

/**
 * 解析元素
 * @param context
 */
export function paserElement(context: ParserContext): ElementNode | undefined {
  //匹配标签 <br/> <div class="" aaa > </div>
  let ele = paserTag(context);
  if (ele == undefined) return;
  //解析子内容
  const children = paserChildren(context);
  //可能没有内容，紧跟一个结束标签 <div></div>
  //如果是自闭标签，就是上级的结束标签,要返回
  if (!ele.isSelfClosing && context.source.startsWith("</")) {
    //里面截取掉标签
    paserTag(context);
  }
  //更新标签位置
  ele.loc = getSelection(context, ele.loc.start);
  ele.children = children;
  return ele;
}

/**
 * 解析标签tag
 * @param context
 * @returns
 */
function paserTag(context: ParserContext): ElementNode | undefined {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^ \t\r\n\/>]*)/.exec(context.source);
  if (match == null) return;
  //match[0] <div  match[0] div
  const tag = match[1];
  //删除<div
  advanceBy(context, match[0].length);
  //删除
  advanceBySpaces(context);
  //处理属性
  const props = paserAttributes(context) as AttributeNode[];

  //可能为自闭和标签
  const isSelfClosing = context.source.startsWith("/>");
  //截取开始标签结尾
  advanceBy(context, isSelfClosing ? 2 : 1);
  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    tagType: ElementTypes.ELEMENT,
    children: [],
    codegenNode: undefined,
    isSelfClosing,
    loc: getSelection(context, start),
  };
}

/**
 * 解析多个属性
 * @param context
 * @returns
 */
function paserAttributes(context: ParserContext) {
  const props = [];
  while (context.source.length > 0 && !context.source.startsWith(">")) {
    const prop = paserAttribute(context);
    props.push(prop);
  }
  return props;
}
/**
 * 解析属性
 * @param context
 */
function paserAttribute(context: ParserContext): AttributeNode | undefined {
  const start = getCursor(context);
  // debugger;
  advanceBySpaces(context);
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  if (match == null) return;
  const name = match[0];
  advanceBy(context, name.length);
  advanceBySpaces(context);

  let value = undefined;
  if (context.source.startsWith("=")) {
    //key = value
    advanceBy(context, 1);
    advanceBySpaces(context);
    value = paserAttributeValue(context);
  } else {
    //单属性
  }
  const loc = getSelection(context, start);
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value,
    loc,
  };
}

function paserAttributeValue(context: ParserContext): TextNode {
  const start = getCursor(context);
  let content = "";
  //获取引号
  const quote = context.source[0];
  if (quote == "'" || quote == '"') {
    advanceBy(context, 1);
    const endIndex = context.source.indexOf(quote);
    content = paserTextData(context, endIndex);
    advanceBy(context, 1);
  } else {
    //无引号 data = 1
    const endIndex = context.source.indexOf(" ");
    content = paserTextData(context, endIndex);
  }

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start),
  };
}

/**
 * 解析表达式
 * @param context
 * @returns
 */
export function paserInterpolation(context: ParserContext): InterpolationNode {
  const start = getCursor(context);
  //截取开始2个{{
  advanceBy(context, 2);
  const endIndex = context.source.indexOf("}}");
  //内部开始
  let innerStart = getCursor(context);
  let innerEnd = getCursor(context);

  //截取原始内容
  const rawContent = paserTextData(context, endIndex);
  const content = rawContent.trim();
  //内部内容偏移 去掉了空字符
  const innerOffset = rawContent.indexOf(content);
  if (innerOffset > 0) {
    //有去空字符，重新获取内容开始位置
    advancePositionWithMutation(innerStart, rawContent, innerOffset);
  }
  //内容结束index  开始偏移+内容长度
  const innerEndOffset = innerOffset + content.length;
  //获取内容结束
  advancePositionWithMutation(innerEnd, rawContent, innerEndOffset);

  //截取尾部
  advanceBy(context, 2);
  //获取包含空字符的结束位置
  const end = getCursor(context);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd),
    },
    loc: getSelection(context, start, end),
  };
}
/**
 * 解析文本
 * @param context
 * @returns
 */
export function paserText(context: ParserContext): TextNode {
  //文本结束符号 下一个元素或模板
  let endToken = ["<", "{{"];
  //初始结束位置
  let endIndex = context.source.length;
  for (let i = 0; i < endToken.length; i++) {
    //查找第一个匹配的位置
    let index = context.source.indexOf(endToken[i], 1);
    if (index !== -1 && index < endIndex) {
      //找到了新的结束位置
      endIndex = index;
    }
  }
  //行信息
  const start = getCursor(context);
  //获取数据
  const content = paserTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start),
  };
}

/**
 * 解析子内容
 * @param context
 */
function paserChildren(context: ParserContext) {
  let nodes = [];
  //<  元素标签
  //{{}} 模板表达式
  //其他字符
  while (!isEnd(context)) {
    const source = context.source;
    let node;
    if (source.startsWith("{{")) {
      //处理表达式
      node = paserInterpolation(context);
    } else if (source.startsWith("<")) {
      node = paserElement(context);
    }
    //node为空 文本
    if (!node) {
      node = paserText(context);
    }
    if (node.type == NodeTypes.TEXT && !/[^\t\r\n\f ]/.test(node.content)) {
      continue;
    }

    nodes.push(node);
  }

  return nodes;
}
