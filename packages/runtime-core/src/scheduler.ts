let queue: Array<() => void> = [];
let isFlushing = false;
export function queueJob(job: () => void) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    // 异步执行 一次循环再执行微任务
    Promise.resolve().then(() => {
      for (let i = 0; i < queue.length; i++) {
        queue[i]();
      }
      queue.length = 0;
      isFlushing = false;
    });
  }
}
