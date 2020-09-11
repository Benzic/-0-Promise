interface PromiseType {
    $$status: string,
    failCallBacks: PromiseType[],
    successCallBacks: PromiseType[],
    result: any,
    error: any,
    then: (onFulfilled?: any, onRejected?: any) => PromiseType,
    catch: (fn?: Function) => PromiseType,
    resolve: (params?: any) => void,
    reject: (params?: any) => void,
    resolvePromise: (promise: PromiseType, func: PromiseType, resolve: Function, reject: Function) => void
}
export const Promise = function (this: PromiseType, executor: Function) {
    let _this = this
    _this.$$status = "pending"
    _this.result = undefined;
    _this.error = undefined;
    _this.failCallBacks = [];
    _this.successCallBacks = [];
    setTimeout(() => {
        try {
            executor(_this.resolve.bind(this), _this.reject.bind(this));
        } catch (error) {
            _this.reject.bind(this)(error)
        }
    });
} as any

Promise.prototype.resolvePromise = function (promise: PromiseType, func: PromiseType, resolve: Function, reject: Function) {
    let _this = this
    if (func === promise) {  //避免循环引用
        return reject("error")
    }
    let called: any              //防止多次调用
    if (func && (typeof func === 'object' || typeof func === 'function')) {
        try {
            let then = func.then;
            if (typeof then === 'function') {
                //失败方法和成功方法只执行一次
                then.call(func, (func2: PromiseType) => {
                    if (called) return;
                    called = true;
                    //返回新的promise,继续处理
                    _this.resolvePromise(promise, func2, resolve, reject);
                }, (error: any) => {
                    if (called) return;
                    called = true;
                    reject(error);
                })
            } else {        //直接输出成功
                resolve(func);
            }
        } catch (error) {  //直接输出失败
            if (called) return;
            called = true;
            reject(error)
        }
    } else {
        resolve(func);
    }
}
Promise.prototype.resolve = function (params: any) {
    if (this.$$status === "pending") {
        this.$$status = "success"
        this.result = params;
        if (!this.successCallBacks.length) return;
        this.successCallBacks.map((a: Function) => a())
    }
}
Promise.prototype.reject = function (params: any) {
    if (this.$$status === "pending") {
        this.$$status = "fail"
        this.error = params
        if (!this.failCallBacks.length) return;
        this.failCallBacks.map((a: Function) => a())
    }
}


Promise.prototype.then = function (onFulfilled: Function, onRejected: Function) {
    let _this = this;
    let newPromise = new Promise((resolve: Function, reject: Function) => {
        if (_this.$$status === "success") {
            setTimeout(() => {
                try {
                    let func = onFulfilled(_this.result);
                    _this.resolvePromise(newPromise, func, resolve, reject)
                } catch (error) {
                    reject(error)
                }
            })
        }
        if (_this.$$status === 'fail') {
            setTimeout(() => {
                try {
                    let func = onRejected(_this.error);
                    _this.resolvePromise(newPromise, func, resolve, reject);
                } catch (error) {
                    reject(error)
                }
            })
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
                })
            })
            _this.failCallBacks.push(() => {
                setTimeout(() => {
                    try {
                        let func = onRejected(_this.error);
                        _this.resolvePromise(newPromise, func, resolve, reject);
                    } catch (error) {
                        reject(error)
                    }
                })
            })
        }
    })
    return newPromise
}
Promise.prototype.catch = function (fn: Function) {
    return this.then(null, fn)
}
Promise.resolve = function (val: any) {
    if (val instanceof Promise) {
        return val
    }
    return new Promise((resolve: Function, reject: Function) => {
        resolve(val)
    })
}
Promise.reject = function (val: any) {
    if (val instanceof Promise) {
        return val
    }
    return new Promise((resolve: Function, reject: Function) => {
        reject(val)
    })
}
Promise.race = function (promises: any) {
    if (!(promises instanceof Array)) {
        throw new TypeError("parameter must be array")
    }
    let flag: boolean;      //避免执行多次
    return new Promise((resolve: Function, reject: Function) => {
        promises.forEach((item: any) => {
            if (item instanceof Promise) {
                item.then((res: any) => {
                    if (!flag) {
                        flag = true;
                        resolve(res)
                    }
                }).catch((error: any) => {
                    if (!flag) {
                        flag = true;
                        reject(error)
                    }
                })
            } else {
                if (!flag) {
                    flag = true;
                    resolve(item)
                }
            }
        })
    })
}

Promise.all = function (promises: PromiseType) {
    if (!(promises instanceof Array)) {
        throw new TypeError("parameter must be array")
    }
    let count = 0//用于计数，当等于len时就resolve
    let len = promises.length
    let result: any = []//用于存放结果
    return new Promise((resolve: Function, reject: Function) => {
        if (!promises.length) {
            resolve(result)
        } else {
            promises.forEach((item: any) => {
                if (item instanceof Promise) {
                    item.then((data: any) => {
                        result[count++] = data
                        if (count === len) {
                            resolve(result)
                        }
                    }).catch((error: any) => {
                        reject(error)
                    })
                } else {
                    result[count++] = item
                    if (count === len) {
                        resolve(result)
                    }
                }
            });
        }

    })
}
new Promise(function (resolve: Function, reject: Function) {
    setTimeout(() => {
        resolve("test promise")
    }, 1000);
}).then((res: any) => {
    console.log(res, 'then result')
    return new Promise((resolve: Function, reject: Function) => {
        resolve("test promise2")
    })
}).then((res: any) => {
    console.log(res, 'then result')
}).then((res: any) => {
    console.log(res, 'then result')
    throw Error("test error")
}).catch((error: any) => {
    console.log(error, 'catch error')
})


const promise1 = new Promise((resolve: any, reject: any) => {
    setTimeout(() => {
        resolve('promise1')
    }, 5000);
})
const promise2 = new Promise((resolve: any, reject: any) => {
    setTimeout(() => {
        resolve('promise2')
    }, 10000);
})
const promise3 = Promise.resolve("promise3")
const promise4 = 'promise4'
Promise.all([promise1, promise2, promise3, promise4]).then((res: any) => {
    console.log(res)
})
// Promise.race([promise1, promise2, promise3, promise4]).then((res: any) => {
//     console.log(res)
// })