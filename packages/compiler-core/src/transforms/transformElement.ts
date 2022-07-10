import {
  createObjectExpression,
  createObjectProperty,
  createSimpleExpression,
  createVNodeCall,
  ElementTypes,
  ObjectExpression,
  RootNode,
  TemplateChildNode,
  TransformContext,
  VNodeCall,
} from "./../ast";
import { isElementNode } from "../utils";
export function transformElement(node: RootNode | TemplateChildNode, context: TransformContext) {
  return () => {
    if (
      !(
        isElementNode(node) &&
        (node.tagType === ElementTypes.ELEMENT || node.tagType === ElementTypes.COMPONENT)
      )
    ) {
      return;
    }

    //createElementVnode(div,{},[])

    const { tag, props } = node;
    const isComponent = node.tagType === ElementTypes.COMPONENT;

    // let vnodeTag = isComponent
    //   ? resolveComponentType(node as ComponentNode, context)
    let vnodeTag = `"${tag}"`;
    let properties: ObjectExpression["properties"] = [];
    if (props) {
      //属性
      for (let i = 0; i < props.length; i++) {
        properties.push(
          createObjectProperty(
            createSimpleExpression(props[i].name),
            createSimpleExpression(props[i].value!.content)
          )
        );
      }
    }
    const PropsExpression = properties.length > 0 ? createObjectExpression(properties) : undefined;
    let childrenNode: VNodeCall["children"] = undefined;
    if (node.children?.length === 1) {
      childrenNode = node.children[0];
    } else {
      childrenNode = node.children;
    }

    node.codegenNode = createVNodeCall(context, vnodeTag, PropsExpression, childrenNode);
  };
}
