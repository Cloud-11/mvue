export const TO_DISPLAY_STRING = Symbol("toDisplayString");
export const CREATE_TEXT = Symbol("createTextVnode");
export const OPEN_BLOCK = Symbol(`openBlock`);
export const CREATE_BLOCK = Symbol(`createBlock`);
export const FRAGMENT = Symbol(`Fragment`);
export const CREATE_ELEMENT_BLOCK = Symbol(`createElementBlock`);
export const CREATE_VNODE = Symbol(`createVNode`);
export const CREATE_ELEMENT_VNODE = Symbol(`createElementVNode`);

export const RENDER_SLOT = Symbol(`renderSlot`);
export const helperMap = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_TEXT]: "createTextVnode",
  [CREATE_ELEMENT_VNODE]: "createElementVNode",
  [RENDER_SLOT]: "renderSlot",
  [OPEN_BLOCK]: "openBlock",
  [CREATE_ELEMENT_BLOCK]: "createElementBlock",
  [FRAGMENT]: "Fragment",
  [CREATE_BLOCK]: "createBlock",
};
