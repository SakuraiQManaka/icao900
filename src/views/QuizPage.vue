<template>
    <div class="quiz-page">
        <van-nav-bar
            :title="navTitle"
            left-arrow
            @click-left="$router.push('/')"
        />

        <!-- 加载中 -->
        <div v-if="quizStore.loading" class="quiz-loading">
            <van-loading />
        </div>

        <!-- 无题目 -->
        <div v-else-if="!quizStore.currentQuestion" class="quiz-empty">
            <van-empty description="暂无题目" />
        </div>

        <!-- 刷题核心 -->
        <template v-else>
            <!-- 题号进度 -->
            <div class="quiz-progress">
                {{ quizStore.currentIndex + 1 }} / {{ quizStore.totalCount }}
            </div>

            <!-- 翻转卡片 -->
            <div class="card-container" @click="handleCardClick">
                <div class="card-inner" :class="{ 'card-flipped': quizStore.flipped }">
                    <!-- 正面 -->
                    <div class="card-face card-front">
                        <div class="card-top" @click.stop="playAudio">
                            <div
                                class="play-icon"
                                :class="{ 'is-playing': isPlaying }"
                            >
                                <span v-if="!isPlaying">
                                    <img src="/icons/icon-play.png" alt="播放" class="play-icon-img" />
                                </span>
                                <span v-else class="playing-dots">
                                    <span class="dot dot-1"></span>
                                    <span class="dot dot-2"></span>
                                    <span class="dot dot-3"></span>
                                </span>
                            </div>
                            <div class="play-hint">
                                {{ isPlaying ? '播放中...' : '点击播放音频' }}
                            </div>
                        </div>
                        <div class="card-divider"></div>
                        <div class="card-bottom">
                            <div class="flip-hint">点击此处翻转查看答案</div>
                        </div>
                    </div>

                    <!-- 背面 -->
                    <div class="card-face card-back">
                        <div class="card-top" @click.stop="playAudio">
                            <div class="play-icon-small">
                                <span v-if="!isPlaying">
                                    <img src="/icons/icon-play-small.png" alt="播放" class="play-small-img" />
                                </span>
                                <span v-else class="playing-dots-small">
                                    <span class="dot dot-1"></span>
                                    <span class="dot dot-2"></span>
                                    <span class="dot dot-3"></span>
                                </span>
                            </div>
                            <span class="play-hint-small">
                                {{ isPlaying ? '播放中...' : '重播' }}
                            </span>
                        </div>
                        <div class="card-divider"></div>
                        <div class="card-bottom card-answer">
                            <div class="answer-english">{{ quizStore.currentQuestion.content }}</div>
                            <div
                                v-if="settingsStore.showTranslation"
                                class="answer-chinese"
                            >
                                {{ quizStore.currentQuestion.trans }}
                            </div>
                            <div class="flip-hint">点击翻回</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 操作工具栏 -->
            <div class="quiz-toolbar">
                <div
                    class="tool-btn"
                    :class="{ 'tool-btn-active': isFavorited }"
                    @click="toggleFav"
                >
                    <span v-if="!isFavorited">
                        <img src="/icons/icon-fav-off.png" alt="收藏" class="tool-icon" />
                    </span>
                    <span v-else>
                        <img src="/icons/icon-fav-on.png" alt="已收藏" class="tool-icon" />
                    </span>
                    收藏
                </div>
                <div class="tool-btn" @click="markAsWrong">
                    <img src="/icons/icon-confused.png" alt="不懂" class="tool-icon" /> 不懂
                </div>
            </div>

            <!-- 导航按钮 -->
            <div class="quiz-nav">
                <van-button
                    :disabled="quizStore.isFirst"
                    @click="goPrev"
                    round
                    block
                    class="nav-btn"
                >
                    上一题
                </van-button>
                <van-button
                    v-if="!quizStore.isLast"
                    @click="goNext"
                    type="primary"
                    round
                    block
                    class="nav-btn"
                >
                    下一题
                </van-button>
                <van-button
                    v-else
                    @click="finishQuiz"
                    type="success"
                    round
                    block
                    class="nav-btn"
                >
                    完成
                </van-button>
            </div>
        </template>
    </div>

    <!-- 音频播放器（隐藏） -->
    <audio ref="audioRef" @play="onAudioPlay" @ended="onAudioEnded" @error="onAudioError" @pause="onAudioPause" />
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const quizStore = useQuizStore()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

const audioRef = ref(null)
const isPlaying = ref(false)

const navTitle = computed(() => {
    const map = {
        chapter: '章节练习',
        test: '测试模式',
        earworm: '磨耳朵模式',
        favorites: '收藏夹'
    }
    return map[quizStore.mode] || '刷题'
})

const isFavorited = computed(() => {
    const q = quizStore.currentQuestion
    if (!q) return false
    const rec = progressStore.records[q.id]
    return rec ? rec.favorited : false
})

onMounted(async () => {
    const mode = route.params.mode
    const chapter = parseInt(route.query.chapter) || 0

    await quizStore.loadQuestions(mode, chapter, progressStore.favoriteIds)

    // 加载完成后自动播放
    await nextTick()
    playAudio()
})

onBeforeUnmount(() => {
    if (audioRef.value) {
        audioRef.value.pause()
    }
})

// 切换题目时自动播放
watch(() => quizStore.currentIndex, () => {
    isPlaying.value = false
    nextTick(() => {
        if (settingsStore.autoPlay || quizStore.mode === 'earworm') {
            playAudio()
        }
    })
})

/**
 * 播放音频
 */
function playAudio() {
    const q = quizStore.currentQuestion
    if (!q || !audioRef.value) return

    const audio = audioRef.value
    audio.src = q.localAudio || q.audio
    audio.playbackRate = settingsStore.speed
    audio.play().catch(() => {
        // 自动播放被浏览器阻止时静默
    })
}

function onAudioPlay() {
    isPlaying.value = true
}

function onAudioPause() {
    isPlaying.value = false
}

function onAudioEnded() {
    isPlaying.value = false
    // 磨耳朵模式自动播放下一题
    if (quizStore.mode === 'earworm' && settingsStore.autoPlay) {
        setTimeout(() => {
            if (!quizStore.isLast) {
                quizStore.next()
            }
        }, 1000)
    }
}

function onAudioError() {
    isPlaying.value = false
    console.warn('音频加载失败:', quizStore.currentQuestion?.audio)
}

/**
 * 处理卡片点击
 * 上半部分（0 ~ 61.8%）翻转卡片
 * 下半部分（61.8% ~ 100%）翻转卡片
 */
function handleCardClick(e) {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const dividerY = rect.height * 0.618

    // 点击分割线下方区域翻转
    if (clickY >= dividerY) {
        quizStore.flip()
        // 翻转后标记已做
        if (quizStore.flipped && quizStore.currentQuestion) {
            progressStore.markDone(quizStore.currentQuestion.id)
        }
    }
}

function goNext() {
    quizStore.next()
}

function goPrev() {
    quizStore.prev()
}

function finishQuiz() {
    router.push('/')
}

function toggleFav() {
    if (quizStore.currentQuestion) {
        progressStore.toggleFavorite(quizStore.currentQuestion.id)
    }
}

function markAsWrong() {
    if (quizStore.currentQuestion) {
        progressStore.markWrong(quizStore.currentQuestion.id)
        showToast('已标记')
        // 自动跳到下一题
        if (!quizStore.isLast) {
            setTimeout(() => quizStore.next(), 300)
        }
    }
}
</script>

<style scoped>
.quiz-page {
    height: 100vh;
    background: #f7f8fa;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.quiz-loading,
.quiz-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.quiz-progress {
    text-align: center;
    font-size: 14px;
    color: #969799;
    padding: 12px 0 8px;
}

/* 翻转卡片 */
.card-container {
    perspective: 1000px;
    margin: 0 16px;
    flex: 1;
    display: flex;
    cursor: pointer;
    min-height: 0;
}

.card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 360px;
    transition: transform 0.5s ease-in-out;
    transform-style: preserve-3d;
}

.card-inner.card-flipped {
    transform: rotateY(180deg);
}

.card-face {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
}

.card-back {
    transform: rotateY(180deg);
}

.card-top {
    flex: 0.618;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
}

/* 播放按钮大圆 */
.play-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #1989fa;
    color: #fff;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
    transition: box-shadow 0.3s;
}

.play-icon.is-playing {
    animation: pulse-shadow 1.2s ease-in-out infinite;
}

@keyframes pulse-shadow {
    0%, 100% {
        box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
    }
    50% {
        box-shadow: 0 4px 24px rgba(25, 137, 250, 0.6);
    }
}

/* 播放中三点动画 */
.playing-dots {
    display: flex;
    align-items: center;
    gap: 6px;
}

.playing-dots .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fff;
    animation: dot-bounce 1.4s ease-in-out infinite;
}

.playing-dots .dot-1 { animation-delay: 0s; }
.playing-dots .dot-2 { animation-delay: 0.2s; }
.playing-dots .dot-3 { animation-delay: 0.4s; }

@keyframes dot-bounce {
    0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.4;
    }
    40% {
        transform: scale(1.0);
        opacity: 1.0;
    }
}

.play-hint {
    font-size: 14px;
    color: #969799;
}

.play-icon-img {
    width: 36px;
    height: 36px;
    object-fit: contain;
}

.play-small-img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    display: block;
}

/* 背面小播放按钮 */
.play-icon-small {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #1989fa;
    color: #fff;
    font-size: 12px;
    margin-right: 8px;
    vertical-align: middle;
}

.playing-dots-small {
    display: flex;
    align-items: center;
    gap: 3px;
}

.playing-dots-small .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #fff;
    animation: dot-bounce 1.4s ease-in-out infinite;
}

.playing-dots-small .dot-1 { animation-delay: 0s; }
.playing-dots-small .dot-2 { animation-delay: 0.2s; }
.playing-dots-small .dot-3 { animation-delay: 0.4s; }

.play-hint-small {
    font-size: 13px;
    color: #969799;
    display: inline-block;
    vertical-align: middle;
}

.card-divider {
    height: 1px;
    background: #eee;
    margin: 0 20px;
}

.card-bottom {
    flex: 0.382;
    display: flex;
    align-items: center;
    justify-content: center;
}

.flip-hint {
    font-size: 13px;
    color: #c8c9cc;
    user-select: none;
    -webkit-user-select: none;
}

.card-answer {
    flex-direction: column;
    padding: 16px 20px;
    align-items: flex-start;
    justify-content: flex-start;
    padding-top: 20px;
}

.answer-english {
    font-size: 18px;
    line-height: 1.6;
    color: #323233;
    margin-bottom: 12px;
    word-break: break-word;
}

.answer-chinese {
    font-size: 15px;
    line-height: 1.5;
    color: #969799;
}

/* 工具栏 */
.quiz-toolbar {
    display: flex;
    justify-content: space-around;
    padding: 16px;
}

.tool-btn {
    font-size: 14px;
    color: #646566;
    padding: 8px 20px;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
}

.tool-btn:active {
    transform: scale(0.96);
}

.tool-btn-active {
    color: #ee0a24;
}

.tool-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
    vertical-align: middle;
    margin-right: 4px;
}

/* 导航 */
.quiz-nav {
    display: flex;
    gap: 12px;
    padding: 0 16px 24px;
}

.nav-btn {
    flex: 1;
}
</style>
