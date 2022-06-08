export const patchEvent = (
  el: Element,
  key: string,
  preValue: EventListenerObject,
  nextValue: EventListenerObject
) => {
  el.addEventListener(key.slice(2), nextValue);
};
