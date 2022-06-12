import { patchProp } from "./patchProp";
import { nodeOps } from "./nodeOps";
import { createRenderer } from "@mvue/runtime-core";
export const renderOptions = Object.assign(nodeOps, { patchProp });
export const render = createRenderer(renderOptions).render;

export * from "@mvue/runtime-core";
