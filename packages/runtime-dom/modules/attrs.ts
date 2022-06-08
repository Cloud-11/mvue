export const patchAttrs = (el: Element, key: string, nextValue: any) => {
  if (!nextValue) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, nextValue);
  }
};
