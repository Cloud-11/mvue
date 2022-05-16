//effect函数
export let activeEffect: ReactEffect | null = null;
class ReactEffect {
  public active = true;
  public parent: ReactEffect | null = null;
  public deps: Set<ReactEffect>[] = [];
  constructor(public fn: () => {}) {}
  run() {
    try {
      //???留一个stop接口，提供执行一次的，不关联依赖
      //直接执行函数，不需要进行依赖收集
      if (!this.active) this.fn();
      //依赖收集  将fn和依赖的对象属性关联
      //记录父级effect
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
  //停止追踪响应式数据依赖
  stop() {
    this.active = false;
    clearDeps(this);
  }
}
//清除关联依赖
const clearDeps = (effect: ReactEffect) => {
  //循环每一个属性的set,在set里将自己删除
  effect.deps.forEach((depSet) => {
    depSet.delete(effect);
  });
};
export function effect(fn: () => {}) {
  const _effect = new ReactEffect(fn);
  _effect.run();
}
//收集属性和effect
const targetMap = new WeakMap<any, Map<string | symbol, Set<ReactEffect>>>();
export const track = (target: any, type: string, key: string | symbol) => {
  //有effect才收集
  if (!activeEffect) return;
  //对象的属性Map
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  //属性的effect的Set
  let depSet = depsMap.get(key);
  if (!depSet) {
    depsMap.set(key, (depSet = new Set()));
  }
  //添加activeEffect
  if (!depSet.has(activeEffect)) {
    depSet.add(activeEffect);
    //!!!反向关联，每一个effect 存储每个属性的effects,方便清除依赖,停止追踪
    activeEffect.deps.push(depSet);
  }
};
//触发收集
export const trigger = (
  target: any,
  type: string,
  key: string | symbol,
  value: any,
  oldval: any
) => {
  const effects = targetMap.get(target)?.get(key);
  effects?.forEach((effect) => {
    effect.run();
  });
};
