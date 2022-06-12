import { patchProp } from "./patchProp";
import { nodeOps } from "./nodeOps";

export const renderOptions = Object.assign(nodeOps, { patchProp });

export * from "@mvue/runtime-core";
