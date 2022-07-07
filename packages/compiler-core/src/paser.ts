import { NodeTypes, Node, Position, SourceLocation } from "./ast";

export interface ParserContext {
  line: number; //行
  column: number; //列
  offset: number; //偏移
  source: string; //源模板
  readonly originalSource: string; //原始模板
}

export function paser(template: string) {
  let context = createPaserContext(template);
  let nodes = [];
  //<  元素标签
  //{{}} 模板字符
  //其他字符
  while (!isEnd(context)) {
    const source = context.source;
    let node;
    if (source.startsWith("{{")) {
      node = "tag";
    } else if (source.startsWith("<")) {
      node = "com";
    }
    //node为空 文本
    if (!node) {
      //   debugger;
      node = paserText(context);
    }
    nodes.push(node);
    break;
  }
  console.log(nodes);
  return nodes;
}

function paserText(context: ParserContext): Node {
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
  const text = paserTextData(context, endIndex);
  console.log(start, text);
  return {
    type: NodeTypes.TEXT,
    loc: {
      start,
      end: getCursor(context),
      source: text,
    },
  };
}

function getSelection(context: ParserContext, start: Position, end?: Position): SourceLocation {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset),
  };
}

function paserTextData(context: ParserContext, endIndex: number) {
  //获取数据
  let text = context.source.slice(0, endIndex);
  //已获取的数据截取掉
  advanceBy(context, endIndex);
  return text;
}

function advancePositionWithMutation(context: ParserContext, source: string, endIndex: number) {
  let line = 0;
  //换行后的index位置
  let lineStartPos = -1;
  for (let i = 0; i < endIndex; i++) {
    //取asc 10为换行符
    if (source.charCodeAt(i) == 10) {
      line++;
      lineStartPos = i;
    }
  }
  context.line += line;
  //如果此次截取没有换行 ，则直接加上此次结束index(长度),
  //换行了，则是结束位置减去换行后的第一个位置 就等于新的一行的列
  context.column = lineStartPos == -1 ? context.column + endIndex : endIndex - lineStartPos;
  context.offset += endIndex;
}

function advanceBy(context: ParserContext, endIndex: number) {
  //已获取的数据截取掉
  let source = context.source;
  //更新偏移信息
  advancePositionWithMutation(context, source, endIndex);
  context.source = source.slice(endIndex);
}

function getCursor(context: ParserContext) {
  let { line, column, offset } = context;
  return { line, column, offset };
}

function createPaserContext(template: string) {
  return {
    line: 1, //行
    column: 1, //列
    offset: 0, //偏移
    source: template, //源模板
    originalSource: template, //原始模板
  };
}
function isEnd(context: ParserContext) {
  //source 需要解析的字符为空 结束
  return !context.source;
}
