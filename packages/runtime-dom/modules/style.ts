export const patchStyle = (el: Element, preValue: string, nextValue: string) => {
  (el as HTMLElement).style.cssText = nextValue;
};
