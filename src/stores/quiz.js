import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { shuffle } from '../utils/shuffle'
import { getAudioPath } from '../utils/audioMapper'

/**
 * 章节元数据
 */
export const chapters = [
    { index: 1, name: '基本通话术语', file: 'chapter-1.json' },
    { index: 2, name: '机场管制通话术语', file: 'chapter-2.json' },
    { index: 3, name: '雷达管制通话术语', file: 'chapter-3.json' },
    { index: 4, name: '进近管制通话术语', file: 'chapter-4.json' },
    { index: 5, name: '区域管制通话术语', file: 'chapter-5.json' },
    { index: 6, name: '紧急情况通话术语', file: 'chapter-6.json' },
    { index: 7, name: '气象通话术语', file: 'chapter-7.json' },
    { index: 8, name: '其他情况通话术语', file: 'chapter-8.json' }
]

/**
 * @param {number} chapterIndex - 章节索引 (1-8)
 * @returns {Promise<Array>} 题目列表
 */
async function loadChapterQuestions(chapterIndex) {
    const ch = chapters.find(c => c.index === chapterIndex)
    if (!ch) throw new Error(`Chapter ${chapterIndex} not found`)
    const resp = await fetch(`/data/chapters/${ch.file}`)
    const data = await resp.json()
    return data.questions
}

/**
 * @returns {Promise<Array>} 所有题目
 */
async function loadAllQuestions() {
    const resp = await fetch('/data/all.json')
    const data = await resp.json()
    return data.questions
}

export const useQuizStore = defineStore('quiz', () => {
    const questions = ref([])
    const currentIndex = ref(0)
    const mode = ref('')        // 'chapter' | 'test' | 'earworm' | 'favorites'
    const chapterIndex = ref(0) // 当前章节 (0 表示非章节模式)
    const flipped = ref(false)  // 卡片是否翻转
    const loading = ref(false)

    const currentQuestion = computed(() => {
        return questions.value[currentIndex.value] || null
    })

    const totalCount = computed(() => questions.value.length)

    const isLast = computed(() => currentIndex.value >= totalCount.value - 1)
    const isFirst = computed(() => currentIndex.value <= 0)

    /**
     * 加载题目列表
     * @param {string} m - 模式
     * @param {number} ch - 章节索引 (仅 chapter/earworm 模式)
     * @param {Array} favIds - 收藏 ID 列表 (仅 favorites 模式)
     */
    async function loadQuestions(m, ch, favIds = []) {
        loading.value = true
        mode.value = m
        chapterIndex.value = ch || 0
        flipped.value = false
        currentIndex.value = 0

        let qs = []
        if (m === 'chapter' || m === 'earworm') {
            qs = await loadChapterQuestions(ch)
        } else if (m === 'test') {
            const all = await loadAllQuestions()
            qs = shuffle(all)
        } else if (m === 'favorites') {
            const all = await loadAllQuestions()
            qs = all.filter(q => favIds.includes(q.id))
        }

        // 为每个题目注入本地音频路径
        qs = qs.map(q => ({
            ...q,
            localAudio: getAudioPath(q.id, q.audio)
        }))

        questions.value = qs
        loading.value = false
    }

    /**
     * 切换到指定索引的题目
     * @param {number} index
     */
    function goTo(index) {
        if (index >= 0 && index < totalCount.value) {
            currentIndex.value = index
            flipped.value = false
        }
    }

    function next() {
        if (!isLast.value) {
            goTo(currentIndex.value + 1)
        }
    }

    function prev() {
        if (!isFirst.value) {
            goTo(currentIndex.value - 1)
        }
    }

    function flip() {
        flipped.value = !flipped.value
    }

    /**
     * @returns {number} 当前章节的总题数（用于进度显示）
     */
    const chapterTotal = computed(() => {
        if (chapterIndex.value > 0) {
            const ch = chapters.find(c => c.index === chapterIndex.value)
            return ch ? ch.total || 0 : 0
        }
        return totalCount.value
    })

    return {
        questions,
        currentIndex,
        mode,
        chapterIndex,
        flipped,
        loading,
        currentQuestion,
        totalCount,
        isLast,
        isFirst,
        loadQuestions,
        goTo,
        next,
        prev,
        flip
    }
})
