//effect函数
export let activeEffect: ReactiveEffect | null = null;
export class ReactiveEffect {
  public active = true;
  public parent: ReactiveEffect | null = null;
  public deps: Set<ReactiveEffect>[] = [];
  constructor(public fn: () => void, public scheduler: any) {}
  run() {
    try {
      //???留一个stop接口，提供执行一次的，不关联依赖
      //直接执行函数，不需要进行依赖收集
      if (!this.active) this.fn();
      //依赖收集  将fn和依赖的对象属性关联
      //记录父级effect
      this.parent = activeEffect;
      activeEffect = this;
      //清理依赖
      clearDeps(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
  //停止追踪响应式数据依赖
  stop() {
    if (this.active) {
      this.active = false;
      clearDeps(this);
    }
  }
}

export interface ReactiveEffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}
//effect函数
export function effect(fn: () => void, options: any) {
  const _effect = new ReactiveEffect(fn, options?.scheduler);
  //初始执行一次
  _effect.run();
  //返回一个run函数
  //_effect.run是一个函数，直接返回执行，会导致this指向global（window）
  let runner = _effect.run.bind(_effect) as ReactiveEffectRunner;
  //对外暴露effect实例,可调用其他方法 effectScope
  runner.effect = _effect;
  return runner;
}

//清除关联依赖
const clearDeps = (effect: ReactiveEffect) => {
  //循环每一个属性的set,在set里将自己删除
  effect.deps.forEach((depSet) => {
    depSet.delete(effect);
  });
};

//收集属性和effect
const targetMap = new WeakMap<any, Map<string | symbol, Set<ReactiveEffect>>>();
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
  trackEffect(depSet);
};
export const trackEffect = (depSet: Set<ReactiveEffect>) => {
  //添加activeEffect
  if (activeEffect && !depSet.has(activeEffect)) {
    depSet.add(activeEffect);
    //!!!反向关联，每一个effect 存储每个属性的effects,方便清除依赖,停止追踪
    activeEffect.deps.push(depSet);
  }
};
//数据改变，触发effect
export const trigger = (
  target: any,
  type: string,
  key: string | symbol,
  value: any,
  oldval: any
) => {
  triggerEffect(targetMap.get(target)?.get(key));
};
export const triggerEffect = (effects: Set<ReactiveEffect> | undefined) => {
  //拷贝一份来执行,否则死循环！！？？
  effects = new Set(effects);
  effects?.forEach((effect) => {
    if (effect !== activeEffect) {
      //自定义effect的执行，根据传入的参数调度
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  });
};
