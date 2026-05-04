import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'icao_progress'

/**
 * @returns {Object} 做题记录 { [questionId]: { done, wrong, favorited } }
 */
function loadRecords() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch {
        return {}
    }
}

export const useProgressStore = defineStore('progress', () => {
    const records = ref(loadRecords())

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
    }

    /**
     * @param {number} id - 题目 ID
     * @returns {Object} 该题记录
     */
    function getRecord(id) {
        if (!records.value[id]) {
            records.value[id] = { done: false, wrong: false, favorited: false }
        }
        return records.value[id]
    }

    /**
     * 标记题目为已做
     * @param {number} id
     */
    function markDone(id) {
        getRecord(id).done = true
        persist()
    }

    /**
     * 切换收藏状态
     * @param {number} id
     * @returns {boolean} 当前收藏状态
     */
    function toggleFavorite(id) {
        const rec = getRecord(id)
        rec.favorited = !rec.favorited
        persist()
        return rec.favorited
    }

    /**
     * 标记为不懂
     * @param {number} id
     */
    function markWrong(id) {
        const rec = getRecord(id)
        rec.done = true
        rec.wrong = true
        persist()
    }

    /**
     * @returns {Array<number>} 收藏的题目 ID 列表
     */
    const favoriteIds = computed(() => {
        return Object.entries(records.value)
            .filter(([, r]) => r.favorited)
            .map(([id]) => Number(id))
    })

    /**
     * @returns {number} 已做题数
     */
    const doneCount = computed(() => {
        return Object.values(records.value).filter(r => r.done).length
    })

    return {
        records,
        markDone,
        toggleFavorite,
        markWrong,
        favoriteIds,
        doneCount
    }
})
