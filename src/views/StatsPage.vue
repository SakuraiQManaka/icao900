<template>
    <div class="stats-page">
        <van-nav-bar
            title="学习统计"
            left-arrow
            @click-left="$router.push('/')"
        />

        <div class="stats-content">
            <div class="stat-card">
                <div class="stat-number">{{ progressStore.doneCount }}</div>
                <div class="stat-label">已刷题数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{{ totalQuestions }}</div>
                <div class="stat-label">总题数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{{ progressStore.favoriteIds.length }}</div>
                <div class="stat-label">收藏数</div>
            </div>
        </div>

        <div class="progress-section">
            <div class="section-title">章节进度</div>
            <div
                v-for="ch in chapters"
                :key="ch.index"
                class="chapter-progress-item"
            >
                <div class="chapter-label">
                    第{{ ch.index }}章 {{ ch.name }}
                </div>
                <div class="chapter-stat-row">
                    <div class="chapter-bar">
                        <div
                            class="chapter-bar-fill"
                            :style="{ width: getChapterPercent(ch.index) + '%' }"
                        ></div>
                    </div>
                    <div class="chapter-pct">{{ getChapterPercent(ch.index) }}%</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { chapters } from '../stores/quiz'
import { useProgressStore } from '../stores/progress'

const progressStore = useProgressStore()
const totalQuestions = 898

const chapterTotals = {
    1: 85, 2: 100, 3: 110, 4: 120,
    5: 115, 6: 130, 7: 118, 8: 120
}

function getChapterStartId(index) {
    const starts = { 1: 1, 2: 86, 3: 186, 4: 296, 5: 416, 6: 531, 7: 661, 8: 779 }
    return starts[index] || 1
}

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

function getChapterPercent(index) {
    const total = chapterTotals[index] || 0
    if (total === 0) return 0
    return Math.round((getChapterDoneCount(index) / total) * 100)
}
</script>

<style scoped>
.stats-page {
    min-height: 100vh;
    background: #f7f8fa;
}

.stats-content {
    display: flex;
    padding: 20px 16px;
    gap: 12px;
}

.stat-card {
    flex: 1;
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.stat-number {
    font-size: 28px;
    font-weight: 700;
    color: #1989fa;
}

.stat-label {
    font-size: 13px;
    color: #969799;
    margin-top: 4px;
}

.progress-section {
    padding: 0 16px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 12px;
}

.chapter-progress-item {
    background: #fff;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 10px;
}

.chapter-label {
    font-size: 14px;
    color: #323233;
    margin-bottom: 8px;
}

.chapter-stat-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.chapter-bar {
    flex: 1;
    height: 6px;
    background: #f2f3f5;
    border-radius: 3px;
    overflow: hidden;
}

.chapter-bar-fill {
    height: 100%;
    background: #1989fa;
    border-radius: 3px;
    transition: width 0.3s;
}

.chapter-pct {
    font-size: 13px;
    color: #969799;
    min-width: 36px;
    text-align: right;
}
</style>
