import { generate } from "./generate";
import { paser } from "./paser";
import { transform } from "./transform";

export function compile(template: string) {
  //模板转换ast html语法树
  const ast = paser(template);

  //对ast语法树进行处理，获取一些信息
  transform(ast);
  // //生成js
  const code = generate(ast);
  return code;
}
