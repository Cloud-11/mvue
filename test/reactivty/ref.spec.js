import { ref } from "@mvue/reactivity";

describe("ref test", () => {
  it("ref代理对象", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = ref(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.value.foo).toBe(1);
  });
  it("ref代理number", () => {
    const wrapped = ref(1);
    expect(wrapped.value).toBe(1);
  });
  it("ref代理string", () => {
    const wrapped = ref("1");
    expect(wrapped.value).toBe("1");
  });
  it("ref代理boolean", () => {
    const wrapped = ref(true);
    expect(wrapped.value).toBe(true);
  });
});
