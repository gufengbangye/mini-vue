export * from "@mini-vue/reactivity";
import nodeOps from "./nodeOps";
import patchProp from "./patchProps";
export const renderOptions = Object.assign({ patchProp }, nodeOps);
