import { currentInstance, setCurrentInstance } from "./component";
import { ComponentInstance } from "./vnode";
export const enum LifecycleHooks {
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
}

function createHook(type: LifecycleHooks) {
  return (hook: () => void, target: ComponentInstance | null = currentInstance) => {
    if (target) {
      //setup执行时将生命周期狗子保存到实例
      const hooks = target[type] || (target[type] = []);
      //利用闭包保存实例
      //生命周期钩子函数会在setup之后执行,setup之后全局存储的组件实例就为null了
      const wrappedHook = () => {
        setCurrentInstance(target);
        hook();
        setCurrentInstance(null);
      };
      hooks.push(wrappedHook);
    }
  };
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifecycleHooks.UPDATED);
