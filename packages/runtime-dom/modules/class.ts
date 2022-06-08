export const patchClass = (el: Element, key: string, preValue: string, nextValue: string) => {
  if (preValue !== nextValue) {
    if (nextValue == null) {
      el.removeAttribute("class");
    } else {
      el.className = nextValue;
    }
  }
};
