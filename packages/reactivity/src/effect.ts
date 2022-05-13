//effect函数
export let activeEffect: ReactEffect | null = null;
class ReactEffect {
  public active = true;
  public parent: ReactEffect | null = null;
  constructor(public fn: () => {}) {}
  run() {
    try {
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
}
export function effect(fn: () => {}) {
  const _effect = new ReactEffect(fn);
  _effect.run();
}
