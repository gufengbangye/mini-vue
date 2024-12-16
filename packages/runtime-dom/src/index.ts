import nodeOps from "./nodeOps";
import patchProp from "./patchProp";
import { createRenderer } from "@mini-vue/runtime-core";
export const renderOptions = Object.assign({ patchProp }, nodeOps);
export const render = createRenderer(renderOptions).render;
export * from "@mini-vue/runtime-core";
