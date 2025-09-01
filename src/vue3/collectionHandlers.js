import { track, trigger } from './dep.js';

export const mutableCollectionHandlers = {
    // 在数据劫持中进行依赖收集
    get(target, key) {
        track(target, key);
        return Reflect.get(target, key);
    },

    // 触发依赖更新
    set(target, key, value) {
        const result = Reflect.set(target, key, value);

        trigger(target, key);
        return result;
    },
};
