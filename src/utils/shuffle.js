/**
 * Fisher-Yates 洗牌算法
 *
 * @param {Array} array - 需要打乱的数组
 * @returns {Array} 打乱后的新数组
 */
export function shuffle(array) {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}
