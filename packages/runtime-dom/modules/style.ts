import { isArray, isString } from "@mvue/shard";

export const patchStyle = (el: HTMLElement, preValue: any, nextValue: any) => {
  const isCssString = isString(nextValue);

  //TODO 浏览器的css前缀未处理
  //

  //有新值 并且不是css字符串
  if (nextValue && !isCssString) {
    //循环新值(css对象) 一一赋值
    for (let key in nextValue) {
      setStyle(el, key, nextValue[key]);
    }
    //循环老值(css对象) 但是新值的key没有 删除
    if (preValue && !isString(preValue)) {
      for (let key in preValue) {
        if (!nextValue[key]) {
          setStyle(el, key, "");
        }
      }
    }
  } else {
    if (isCssString) {
      //有新值，但是csstext
      if (preValue !== nextValue) {
        el.style.cssText = nextValue as string;
      }
    } else if (preValue) {
      //没有新值直接移除style
      el.removeAttribute("style");
    }
  }
};
const setStyle = (el: HTMLElement, key: string, val: string | string[]) => {
  if (isArray(val)) {
    val.forEach((v) => setStyle(el, key, v));
  } else {
    el.style.setProperty(key, val ? val : null);
  }
};
