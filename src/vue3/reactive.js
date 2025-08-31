import { mutableCollectionHandlers } from './collectionHandlers.js';

/**
 * 创建响应式对象
 */
export function reactive(target) {
    return new Proxy(target, mutableCollectionHandlers);
}
