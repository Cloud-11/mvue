export const patchClass = (el: Element, nextValue: string) => {
  if (nextValue == null) {
    el.removeAttribute("class");
  } else {
    el.className = nextValue;
  }
};
