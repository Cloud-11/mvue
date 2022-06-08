//属性操作
import { patchAttrs } from "../modules/attrs";
import { patchClass } from "../modules/class";
import { patchEvent } from "../modules/event";
import { patchStyle } from "../modules/style";

//测试是否为event onclick等
const onRex = /^on[^a-z]/;
export const isOn = (key: string) => onRex.test(key);

export const patchProp = (
  el: Node,
  key: string,
  preValue: object | string,
  nextValue: object | string
) => {
  //class
  if (key === "class") {
    patchClass(el, key, preValue, nextValue);
  } else if (key === "style") {
    //style
    patchStyle(el, preValue, nextValue);
  } else if (isOn(key)) {
    //events
    patchEvent(el, preValue, nextValue);
  } else {
    //attrs
    patchAttrs(el, key, preValue, nextValue);
  }
};
