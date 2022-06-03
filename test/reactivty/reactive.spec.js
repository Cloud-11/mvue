import { readonly, toRaw, reactive } from "@mvue/reactivity";
import { jest } from "@jest/globals";

describe("reactive test", () => {
  it("reactive 重复代理", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = reactive(original);
    const wrapped2 = reactive(wrapped);
    expect(wrapped).not.toBe(original);
    expect(wrapped).toBe(wrapped2);
  });
});

describe("readonly test", () => {
  it("readonly 取值测试", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
  });
  it("readonly set测试", () => {
    console.warn = jest.fn();
    const user = readonly({ age: 10 });
    user.age = 11;
    expect(console.warn).toBeCalled();
  });
});

describe("toRaw test", () => {
  it("toRaw代理对象", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = reactive(original);
    expect(wrapped).not.toBe(original);
    expect(toRaw(wrapped)).toBe(original);
  });
});
