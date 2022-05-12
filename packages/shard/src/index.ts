/**
 * isObject
 * @param obj
 * @returns
 */
const isObject = (obj: any) => {
  return typeof obj === "object" && obj !== null;
};
export default isObject;
