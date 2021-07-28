const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected'

class MyPromise {
  constructor(executor) {
    const that = this
    this.state = PENDING;
    this.resolvValue = null;
    this.rejectValue = null;
    this.resolvedCallbacks = [];
    this.rejectedCallbacks = [];

    function resolve(value) {
      if (that.state === PENDING) {
        that.state = RESOLVED;
        that.resolvValue = value;
        that.rejectedCallbacks.map(cb => cb(that.resolvValue))
      }
    }

    function reject(value) {
      if (that.state === PENDING) {
        that.state = REJECTED
        that.rejectValue = value
        that.rejectedCallbacks.map(cb => cb(that.rejectValue))
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled, onRejected) {
    const that = this;
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
    onRejected = typeof onRejected === 'function' ? onRejected : e => throw e;

    const promise2 = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (that.state === RESOLVED) {
          let x = onFulfilled(that.resolvValue);
          resolvePromise(promise2, x, resolve, reject)
        }
        if (that.state === REJECTED) {
          let x = onRejected(that.rejectValue);
          resolvePromise(promise2, x, resolve, reject)
        }
        if (that.state === PENDING) {
          that.resolvedCallbacks.push(() => {
            let x = onFulfilled(that.resolvValue);
            resolvePromise(promise2, x, resolve, reject)
          });
          that.rejectedCallbacks.push(() => {
            let x = onRejected(that.resolvValue);
            resolvePromise(promise2, x, resolve, reject)
          });
        }
      },0)
    });

    return promise2;
  }
}
