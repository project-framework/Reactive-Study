import { createDep } from './dep.js';

export const mutableCollectionHandlers = {
    // track deps
    get(target, key) {
        // 在数据劫持中进行依赖收集
        const dep = createDep(target, key);
        dep.depend();

        return Reflect.get(target, key);
    },

    // trigger deps 触发依赖
    set(target, key, value) {
        const result = Reflect.set(target, key, value);
        // 触发依赖更新
        const dep = createDep(target, key);
        dep.notify();
        return result;
    },
};
