export const Promise = function (executor) {
    this.$$status = 'pending';
    this.result = undefined;
    this.error = undefined;
    this.successCallBacks = [];
    this.failCallBacks = [];
    setTimeout(() => {
        try {
            executor(this.resolve.bind(this), this.reject.bind(this))
        } catch (error) {
            this.reject.bind(this)(error)
        }
    });
}
Promise.prototype.resolve = function (params) {
    if (this.$$status === 'pending') {
        this.$$status = 'success'
        this.result = params
        if (!this.successCallBacks.length) return
        this.successCallBacks.map(a => a())
    }
}
Promise.prototype.reject = function (params) {
    if (this.$$status === 'pending') {
        this.$$status = 'fail'
        this.error = params
        if (!this.failCallBacks.length) return
        this.failCallBacks.map(a => a())
    }
}
Promise.prototype.resolvePromise = function (promise, func, resolve, reject) {
    if (promise === func) {
        return reject("error")
    }
    let called;
    let _this = this
    if (func && (typeof func === 'object' || typeof func === 'function')) {
        try {
            let then = func.then;
            if (typeof then === 'function') {
                then.call(func, (func2) => {
                    if (called) return;
                    called = true;
                    _this.resolvePromise(promise, func2, resolve, reject)
                }, (error) => {
                    if (called) return;
                    called = true;
                    reject(error)
                })
            } else {
                resolve(func)
            }
        } catch (error) {
            if (called) return;
            called = true;
            reject(error)
        }
    } else {
        resolve(func)
    }
}
Promise.prototype.then = function (onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : error => {
        throw error
    }
    let _this = this
    let newPromise = new Promise((resolve, reject) => {
        if (_this.$$status === 'success') {
            setTimeout(() => {
                try {
                    let func = onFulfilled(_this.result);
                    _this.resolvePromise(newPromise, func, resolve, reject)
                } catch (error) {
                    reject(error)
                }
            });
        }
        if (_this.$$status === 'fail') {
            setTimeout(() => {
                try {
                    let func = onRejected(_this.error);
                    _this.resolvePromise(newPromise, func, resolve, reject)

                } catch (error) {
                    reject(error)
                }
            });
        }
        if (_this.$$status === 'pending') {
            _this.successCallBacks.push(() => {
                setTimeout(() => {
                    try {
                        let func = onFulfilled(_this.result);
                        _this.resolvePromise(newPromise, func, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }
                });
            })
            _this.failCallBacks.push(() => {
                try {
                    setTimeout(() => {
                        let func = onRejected(_this.error);
                        _this.resolvePromise(newPromise, func, resolve, reject)
                    });
                } catch (error) {
                    reject(error)
                }
            })
        }
    })
    return newPromise
}
Promise.prototype.catch = function (fn) {
    return this.then(null, fn)
}
Promise.resolve = function (params) {
    if (params instanceof Promise) {
        return params
    }
    return new Promise((resolve, reject) => {
        resolve(params)
    })
}
Promise.reject = function (params) {
    if (params instanceof Promise) {
        return params
    }
    return new Promise((resolve, reject) => {
        reject(params)
    })
}
Promise.race = function (promise) {
    if (!(promise instanceof Array)) {
        throw new Error("parameter must be array")
    }
    let called;
    return new Promise((resolve, reject) => {
        promise.forEach((item) => {
            if (item instanceof Promise) {
                item.then((res) => {
                    if (called) return
                    called = true
                    resolve(res)
                }).catch((res) => {
                    if (called) return
                    called = true
                    reject(res)
                })
            } else {
                resolve(item)
            }
        })
    })
}
Promise.all = function (promise) {
    if (!(promise instanceof Array)) {
        throw new Error("parameter must be array")
    }
    let len = promise.length;
    let count = 0;
    let result = []
    return new Promise((resolve, reject) => {
        if (!promise.length) {
            resolve(result)
        } else {
            promise.forEach((item) => {
                if (item instanceof Promise) {
                    item.then((res) => {
                        result[count++] = res
                        if (count === len) {
                            resolve(result)
                        }
                    }).catch((res) => {
                        reject(res)
                    })
                } else {
                    result[count++] = item
                    if (count === len) {
                        resolve(result)
                    }
                }
            })
        }
    })
}

new Promise(function (resolve, reject) {
    setTimeout(() => {
        resolve("test promise")
    }, 1000);
}).then((res) => {
    console.log(res, 'then result')
    return new Promise((resolve, reject) => {
        resolve("test promise2")
    })
}).then((res) => {
    console.log(res, 'then result')
}).then((res) => {
    console.log(res, 'then result')
    throw Error("test error")
}).catch((error) => {
    console.log(error, 'catch error')
})

const promise1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('promise1')
    }, 5000);
})
const promise2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('promise2')
    }, 10000);
})
const promise3 = Promise.resolve("promise3")
const promise4 = 'promise4'
Promise.all([promise1, promise2, promise3, promise4]).then((res) => {
    console.log(res)
})
Promise.race([promise1, promise2, promise3, promise4]).then((res) => {
    console.log(res)
})