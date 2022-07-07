import { paser } from "./paser";

export function compile(template: string) {
  //模板转换ast html语法树
  const ast = paser(template);
  return ast;
  //对ast语法树进行处理，获取一些信息
  //   transform(ast);
  //生成js
  //   generate(ast);
}
