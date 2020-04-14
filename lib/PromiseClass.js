const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";
class Promise {
    constructor(executor) {
        // 状态
        this.status = PENDING;
        // 数据
        this.data;
        // promise的回调函数，是一个对象数组，每个元素包含onResolved, onRejected
        this.callbacks = [];

        const resolve = value => {
            // resolve执行的时候，执行以下:
            // 1. 状态变成resolved
            // 2. 数据设置为value
            // 3. 这个时候，then方法可能已经调用了，也就是说回调函数已经准备好了，可以调用了
            // 4. 如果then方法还没调用，那说明resolve这里执行是同步的
            if (this.status !== PENDING) {
                // 说明已经执行过resolve或者reject了，状态已经改变过了，并且状态只能改变一次
                return;
            }
            this.status = RESOLVED;
            this.data = value;
            
            setTimeout(() => {
                // then已经调用过了，回调函数已经有了，所以要执行回调了，而且then里面的回调是要异步执行的
                if (this.callbacks.length > 0) {
                    this.callbacks.forEach(callbackOjb => {
                        callbackOjb.onResolved(value);
                    });
                }
            });
        };
        const reject = reason => {
            // reject执行的时候，执行以下：
            // 1. 状态变成rejected
            // 2. 数据设置为reason
            // 3. 这个时候，then方法可能已经调用了，也就是说回调函数已经准备好了，可以调用了
            // 4. 如果then方法还没调用，那说明reject这里执行是同步的
            this.status = REJECTED;
            this.data = reason;
            setTimeout(() => {
                // then已经调用过了，回调函数已经有了，所以要执行回调了，then里面的回调是要异步执行的
                if (this.callbacks.length > 0) {
                    this.callbacks.forEach(callbackOjb => {
                        callbackOjb.onRejected(reason);
                    });
                }
            });
        };

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    /**
     * 要形成链式调用，那么then方法还要返回一个promise
     */
    then(onResolved, onRejected) {
        return new Promise((resolve, reject) => {
            const fn = callback => {
                try {
                    // 执行过resolve/reject了，说明已经成功了，那就执行onResolved/onRejected回调呗
                    const result = callback(this.data);
                    if (result instanceof Promise) {
                        // onResolved/onRejected执行的结果是promise
                        result.then(resolve, reject);
                    } else {
                        // onResolved/onRejected执行的结果不是promise
                        resolve(result);
                    }
                } catch (error) {
                    // 执行回调过程中可能会出现异常，异常情况就要返回失败的promise了
                    reject(error);
                }
            };
            if (this.status === PENDING) {
                // 说明还没执行过resolve,reject，这个时候当然要把回调保存起来啦
                this.callbacks.push({
                    onResolved,
                    onRejected
                });
            } else if (this.status === RESOLVED) {
                setTimeout(() => {
                    fn(onResolved);
                });
            } else {
                setTimeout(() => {
                    fn(onRejected);
                });
            }
        });
    }

    /**
     * promise失败才会执行onRejected
     * 返回新的promise
     */
    catch(onRejected) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const result = onRejected(this.data);
                    if (result instanceof Promise) {
                        // onRejected执行的结果是promise
                        result.then(resolve, reject);
                    } else {
                        // onRejected执行的结果不是promise
                        resolve(result);
                    }
                } catch (error) {
                    reject(error)
                }
            });
        })
    }

    /**
     * 是类的方法
     * 返回新的成功的promise
     */
    static resolve(value) {
        return new Promise((resolve, reject) => {
            if (value instanceof Promise) {
                value.then(resolve, reject)
            } else {
                resolve(value)
            }
        })
    }

    /**
     *
     */
    static reject(reason) {
        return new Promise((resolve, reject) => {
            reject(reason);
        });
    }

    /**
     * Promise类的方法
     * @param {} promises ： 一个promise数组
     * 返回一个promise数组，每个promise都返回成功，all才会返回成功，否则返回失败
     * 而且在数组中的位置不能变
     */
    static all(promises) {
        let result = new Array(promises.length);
        let count = 0;
        return  new Promise((resolve, reject) => {
            promises.forEach((p, index) => {
                
                p.then(value => {
                    result[index] = value;
                    count++;
                    if (count === promises.length) {
                        resolve(result)
                    }
                }, reason => {
                    reject(reason)
                })
            })
        })
    }

    /**
     * Promise类的方法
     * 返回一个promise，结果由第一个返回的promise决定
     * @param {*} promises 
     */
    static race(promises) {
        return new Promise((resolve, reject) => {
            promises.forEach(p => {
                p.then(value => {
                    resolve(value)
                }, reason => {
                    reject(reason)
                })
            })
        })
    }
}
