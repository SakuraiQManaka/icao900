<template>
    <div class="chapter-page">
        <van-nav-bar
            :title="isEarworm ? '磨耳朵模式' : '章节列表'"
            left-arrow
            @click-left="$router.push('/')"
        />

        <div class="chapter-list">
            <div
                v-for="ch in chapters"
                :key="ch.index"
                class="chapter-card"
                @click="startChapter(ch.index)"
            >
                <div class="chapter-info">
                    <div class="chapter-name">
                        第{{ ch.index }}章 {{ ch.name }}
                    </div>
                    <div class="chapter-progress-text">
                        {{ getChapterDoneCount(ch.index) }} / {{ getChapterTotal(ch.index) }} 题
                    </div>
                </div>
                <div class="chapter-progress-bar">
                    <div
                        class="chapter-progress-fill"
                        :style="{ width: getChapterProgress(ch.index) + '%' }"
                    ></div>
                </div>
                <div class="chapter-arrow">
                    <img src="/icons/icon-arrow-right.png" alt=">" class="arrow-img" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapters } from '../stores/quiz'
import { useProgressStore } from '../stores/progress'

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()

const isEarworm = ref(route.query.mode === 'earworm')

// 各章节题数（从合并 JSON 得知）
const chapterTotals = {
    1: 85, 2: 100, 3: 110, 4: 120,
    5: 115, 6: 130, 7: 118, 8: 120
}

/**
 * @param {number} index - 章节索引
 * @returns {number}
 */
function getChapterTotal(index) {
    return chapterTotals[index] || 0
}

/**
 * @param {number} index - 章节索引
 * @returns {number}
 */
function getChapterDoneCount(index) {
    const startId = getChapterStartId(index)
    const endId = getChapterStartId(index + 1) - 1
    let count = 0
    Object.entries(progressStore.records).forEach(([id, rec]) => {
        const nid = Number(id)
        if (nid >= startId && nid <= endId && rec.done) {
            count++
        }
    })
    return count
}

/**
 * @param {number} index - 章节索引
 * @returns {number} 该章节起始 ID
 */
function getChapterStartId(index) {
    const starts = { 1: 1, 2: 86, 3: 186, 4: 296, 5: 416, 6: 531, 7: 661, 8: 779 }
    return starts[index] || 1
}

/**
 * @param {number} index - 章节索引
 * @returns {number} 完成百分比
 */
function getChapterProgress(index) {
    const total = getChapterTotal(index)
    if (total === 0) return 0
    return Math.round((getChapterDoneCount(index) / total) * 100)
}

function startChapter(index) {
    const mode = isEarworm.value ? 'earworm' : 'chapter'
    router.push(`/quiz/${mode}?chapter=${index}`)
}
</script>

<style scoped>
.chapter-page {
    min-height: 100vh;
    background: #f7f8fa;
}

.chapter-list {
    padding: 16px;
}

.chapter-card {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.chapter-card:active {
    transform: scale(0.98);
}

.chapter-info {
    flex: 1;
}

.chapter-name {
    font-size: 15px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 6px;
}

.chapter-progress-text {
    font-size: 12px;
    color: #969799;
    margin-bottom: 8px;
}

.chapter-progress-bar {
    height: 4px;
    background: #f2f3f5;
    border-radius: 2px;
    overflow: hidden;
}

.chapter-progress-fill {
    height: 100%;
    background: #1989fa;
    border-radius: 2px;
    transition: width 0.3s;
}

.chapter-arrow {
    font-size: 14px;
    color: #c8c9cc;
    margin-left: 12px;
    display: flex;
    align-items: center;
}

.arrow-img {
    width: 16px;
    height: 16px;
    object-fit: contain;
}
</style>
