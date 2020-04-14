/*
ES5模块用自执行函数封装
*/
(function(window) {
    const PENDING = "pending";
    const RESOLVED = "resolved";
    const REJECTED = "rejected";
    function Promise(executor) {
        const self = this;
        this.status = PENDING;

        // 给promise对象指定一个用于存储结果数据的属性
        this.data = undefined;

        // 存储then的回调函数，每个元素的结构：{ onResolved() {}, onRejected() {} }
        this.callbacks = [];

        function resolve(value) {
            if (self.status !== PENDING) {
                return;
            }
            self.status = RESOLVED;
            self.data = value;
            if (self.callbacks.length > 0) {
                setTimeout(() => {
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value);
                    });
                }, 0);
            }
        }
        function reject(reason) {
            if (self.status !== PENDING) {
                return;
            }
            self.status = REJECTED;
            self.data = reason;
            if (self.callbacks.length > 0) {
                setTimeout(() => {
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onRejected(value);
                    });
                }, 0);
            }
        }
        // 这里要捕获executor执行时可能抛出的异常，因为抛异常也算失败
        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }
    /*
    原型的then方法
    指定成功和失败的回调函数
    返回一个新的promise
    返回的promise由onResolved/onRejected执行的结果决定
    */
    Promise.prototype.then = function(onResolved, onRejected) {
        //看当前promise的状态，决定是调用onResolved，还是调用onRejected，还是把回调函数缓存起来
        const self = this;
        // 指定默认回调函数
        onResolved =
            typeof onResolved === "function" ? onResolved : value => value;
        onRejected =
            typeof onRejected === "function"
                ? onRejected
                : reason => {
                      throw reason;
                  };
        // 返回一个新的promise
        return new Promise((resolve, reject) => {
            function fn(callback) {
                try {
                    let result = callback(self.data);
                    if (result instanceof Promise) {
                        result.then(resolve, reject);
                    } else {
                        resolve(result);
                    }
                } catch (error) {
                    // 3. 抛异常，则失败
                    reject(error);
                }
            }
            // 1. promise是resolved状态，执行
            if (self.status === RESOLVED) {
                // 立即异步执行成功的回调函数
                // 1. 如果返回的是promise，返回最终的promise的结果就是这个结果
                // 2. 如果返回的不是promise，返回的就是value
                setTimeout(() => {
                    fn(onResolved);
                }, 0);
            } else if (self.status === REJECTED) {
                setTimeout(() => {
                    fn(onRejected);
                }, 0);
            } else {
                // 假设当前状态还是pending
                this.callbacks.push({
                    onResolved() {
                        fn(onResolved);
                    },
                    onRejected() {
                        fn(onRejected);
                    }
                });
            }
        });
    };
    /*
    原型的catch方法
    指定失败的回调函数
    返回一个新的promise
    */
    Promise.prototype.catch = function(onRejected) {};
    /*
    Promise函数对象的resolve方法
    返回一个成功的promise
    */
    Promise.resolve = function(value) {
        // 如果value是个成功的promise，返回一个成功的promise，value是这个promise的value
        // 如果value是个失败的promise，返回一个失败的promise，reason是这个promise的reason
        return new Promise((resolve, reject) => {
            if (value instanceof Promise) {
                value.then(resolve, reject);
            } else {
                resolve(value);
            }
        });
    };
    /*
    Promise函数对象的reject方法
    返回一个指定reason的失败的promise
    */
    Promise.reject = function(reason) {
        return new Promise((resolve, reject) => {
            reject(reason);
        });
    };
    /*
    Promise函数对象的all方法
    返回一个promise，只有当所有promise都成功时才成功，只要有一个失败的就失败
    */
    Promise.all = function(promises) {
        let promiseCount = 0;
        const length = promises.length;
        let promiseArray = new Array(length);

        return new Promise((resolve, reject) => {
            promises.forEach((p, index) => {
                p.then(
                    value => {
                        promiseArray[index] = value;
                        promiseCount++;
                        if (promiseCount === length) {
                            resolve(promiseArray);
                        }
                    },
                    reason => {
                        reject(reason);
                    }
                );
            });
        });
    };
    /*
    Promise函数对象的race方法
    返回一个promise，结果由第一个返回的promise决定
    */
    Promise.race = function(promises) {
        return new Promise((resolve, reject) => {
            promises.forEach(p => {
                p.then(
                    value => {
                        resolve(value);
                    },
                    reason => {
                        reject(reason);
                    }
                );
            });
        });
    };
    window.Promise = Promise;
})(window);
