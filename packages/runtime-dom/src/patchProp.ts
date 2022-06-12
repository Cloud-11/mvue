//属性操作
import { patchAttrs } from "../modules/attrs";
import { patchClass } from "../modules/class";
import { patchEvent } from "../modules/event";
import { patchStyle } from "../modules/style";

//测试是否为event onclick等
const onRex = /^on[^a-z]/;
export const isOn = (key: string) => onRex.test(key);

export const patchProp = (el: Element, key: string, preValue: any, nextValue: any) => {
  //class
  if (key === "class") {
    patchClass(el, nextValue as string);
  } else if (key === "style") {
    //style
    patchStyle(el as HTMLElement, preValue, nextValue);
  } else if (isOn(key)) {
    //events
    patchEvent(el, key, nextValue);
  } else {
    //attrs
    patchAttrs(el, key, nextValue);
  }
};
