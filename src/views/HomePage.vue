<template>
    <div class="home-page">
        <div class="home-header" @click="onTitleClick">
            <h1 class="home-title">ICAO 900</h1>
            <p class="home-subtitle">听力刷题</p>
        </div>

        <div class="home-stats">
            <span>已刷 {{ progressStore.doneCount }} / {{ totalQuestions }} 题</span>
        </div>

        <div class="home-grid">
            <div class="home-card" @click="$router.push('/chapters')">
                <div class="card-icon">
                    <img src="/icons/icon-book.png" alt="章节练习" class="icon-img" />
                </div>
                <div class="card-title">章节练习</div>
                <div class="card-desc">按章节系统学习</div>
            </div>

            <div class="home-card" @click="startTest">
                <div class="card-icon">
                    <img src="/icons/icon-target.png" alt="测试模式" class="icon-img" />
                </div>
                <div class="card-title">测试模式</div>
                <div class="card-desc">随机抽题模拟考试</div>
            </div>

            <div class="home-card" @click="$router.push('/chapters?mode=earworm')">
                <div class="card-icon">
                    <img src="/icons/icon-headphone.png" alt="磨耳朵模式" class="icon-img" />
                </div>
                <div class="card-title">磨耳朵模式</div>
                <div class="card-desc">直接展示原文泛听</div>
            </div>

            <div class="home-card" @click="$router.push('/favorites')">
                <div class="card-icon">
                    <img src="/icons/icon-star.png" alt="收藏夹" class="icon-img" />
                </div>
                <div class="card-title">收藏夹</div>
                <div class="card-desc">复习收藏的题目</div>
            </div>

            <div class="home-card" @click="$router.push('/stats')">
                <div class="card-icon">
                    <img src="/icons/icon-chart.png" alt="学习统计" class="icon-img" />
                </div>
                <div class="card-title">学习统计</div>
                <div class="card-desc">查看学习进度</div>
            </div>

            <div class="home-card" @click="$router.push('/settings')">
                <div class="card-icon">
                    <img src="/icons/icon-gear.png" alt="设置" class="icon-img" />
                </div>
                <div class="card-title">设置</div>
                <div class="card-desc">个性化配置</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'

const router = useRouter()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

const totalQuestions = ref(898)
const titleClickCount = ref(0)
let titleClickTimer = null

function startTest() {
    router.push('/quiz/test')
}

/**
 * 标题连击 5 次打开 Debug 模式入口
 */
function onTitleClick() {
    titleClickCount.value++
    if (titleClickTimer) clearTimeout(titleClickTimer)
    titleClickTimer = setTimeout(() => {
        titleClickCount.value = 0
    }, 800)
    if (titleClickCount.value >= 5) {
        titleClickCount.value = 0
        settingsStore.toggleDebug()
    }
}
</script>

<style scoped>
.home-page {
    min-height: 100vh;
    background: #f7f8fa;
    padding: 20px 16px 40px;
}

.home-header {
    text-align: center;
    padding: 30px 0 10px;
}

.home-title {
    font-size: 32px;
    font-weight: 700;
    color: #1989fa;
    letter-spacing: 2px;
    cursor: default;
}

.home-subtitle {
    font-size: 14px;
    color: #969799;
    margin-top: 4px;
}

.home-stats {
    text-align: center;
    font-size: 13px;
    color: #969799;
    margin-bottom: 20px;
}

.home-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.home-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px 16px;
    text-align: center;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    transition: transform 0.15s;
}

.home-card:active {
    transform: scale(0.96);
}

.card-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.card-title {
    font-size: 15px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 4px;
}

.card-desc {
    font-size: 12px;
    color: #969799;
}
</style>
