const PENDING = 'pending'
const RESOLVED = 'resolved'
const REJECTED = 'rejected'
class Promise {
    constructor(executor) {
        this.data = undefined
        this.status = PENDING
        this.callbacks = []

        const resolve = (value) => {
            if(this.status !== PENDING) return
            this.status = RESOLVED
            this.data = value
            if (this.callbacks.length > 0) {
                // then执行过了，要执行then里面的成功的回调，但是要异步执行
                setTimeout(() => {
                    this.callbacks.forEach(cbObj => {
                        cbObj.onResolved(value)
                    })
                });
            }
        }
        const reject = (reason) => {
            if(this.status !== PENDING) return
            this.status = REJECTED
            this.data = reason
            if (this.callbacks.length > 0) {
                // then执行过了，要执行then里面的失败的回调，但是要异步执行
                setTimeout(() => {
                    this.callbacks.forEach(cbObj => {
                        cbObj.onRejected(reason)
                    })
                });
            }
        }
        try {
            executor(resolve, reject)
        } catch (error) {
            reject(error)
        }
    }

    then(onResolved, onRejected) {
        
        return new Promise((resolve, reject) => {
            const fn = (callback) => {
                try {
                    const result = callback(this.data)
                    if (result instanceof Promise) {
                        result.then(resolve, reject)
                    } else {
                        resolve(result)
                    }
                } catch (error) {
                    reject(error)
                }
            }
            if (this.status === RESOLVED) {
                // 构造函数里的resolve执行了
                try {
                    const result = onResolved(this.data)
                    if (result instanceof Promise) {
                        result.then(resolve, reject)
                    } else {
                        resolve(result)
                    }
                } catch (error) {
                    reject(error)
                }
            } else if(this.status === REJECTED) {
                try {
                    const result = onRejected(this.data)
                    if (result instanceof Promise) {
                        result.then(resolve, reject)
                    } else {
                        resolve(result)
                    }
                } catch (error) {
                    reject(error)
                }
            } else {
                // then先执行了
                this.callbacks.push({
                    onResolved(value) {
                        fn(onResolved)
                    },
                    onRejected(reason) {
                        fn(onRejected)
                    }
                })
            }
        })
    }

    catch (onRejected) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const result = onRejected(this.value)
                    if (result instanceof Promise) {
                        result.then(resolve, reject)
                    } else {
                        resolve(result)
                    }
                } catch (error) {
                    reject(error)
                }
            });
        })
    }

    static resolve(value) {
        return new Promise((resolve, reject) => {
            try {
                if (value instanceof Promise) {
                    value.then(resolve, reject)
                } else {
                    resolve(value)
                }
            } catch (error) {
                reject(error)
            }
            
        })
    }

    static reject(reason) {
        return new Promise((resolve, reject) => {
            reject(reason);
        })
    }

    static all(promises) {
        let resolvedCount = 0;
        const length = promises.length;
        let resultPromise = new Array(length);
        return new Promise((resolve, reject) => {
            try {
                promises.forEach((p, index) => {
                    p.then(value => {
                        resultPromise[index] = value
                        resolvedCount++;
                    },
                    reason => {
                        reject(reason)
                    })
                })
                if (resolvedCount === length) {
                    resolve(resultPromise)
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    static race(promises) {}
}

