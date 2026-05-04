<template>
    <div class="settings-page">
        <van-nav-bar
            title="设置"
            left-arrow
            @click-left="$router.push('/')"
        />

        <div class="settings-section">
            <div class="section-title">播放设置</div>
            <van-cell title="显示翻译" center>
                <template #right-icon>
                    <van-switch v-model="settingsStore.showTranslation" />
                </template>
            </van-cell>
            <van-cell title="自动播放下一题" center>
                <template #right-icon>
                    <van-switch v-model="settingsStore.autoPlay" />
                </template>
            </van-cell>
            <van-cell title="语速控制">
                <template #value>
                    <div class="speed-control">
                        <span class="speed-label">{{ settingsStore.speed.toFixed(2) }}x</span>
                        <van-slider
                            v-model="speedValue"
                            :min="50"
                            :max="200"
                            :step="25"
                            @change="onSpeedChange"
                            style="width: 120px"
                        />
                    </div>
                </template>
            </van-cell>
        </div>

        <!-- Debug 模式开关，仅当 debugMode 开启时显示 -->
        <div v-if="settingsStore.debugMode" class="settings-section">
            <div class="section-title">调试选项</div>
            <van-cell title="使用远程音频 URL" center>
                <template #right-icon>
                    <van-switch v-model="settingsStore.useRemoteUrl" />
                </template>
            </van-cell>
            <van-cell
                title="退出调试模式"
                is-link
                @click="exitDebug"
            />
        </div>

        <div class="settings-section">
            <div class="section-title">关于</div>
            <van-cell title="版本" value="1.0.0" />
            <van-cell title="题库" value="ICAO 英语 900 题" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()

const speedValue = computed({
    get: () => Math.round(settingsStore.speed * 100),
    set: () => {}
})

function onSpeedChange(val) {
    settingsStore.speed = val / 100
}

function exitDebug() {
    settingsStore.debugMode = false
    settingsStore.useRemoteUrl = false
}
</script>

<style scoped>
.settings-page {
    min-height: 100vh;
    background: #f7f8fa;
}

.settings-section {
    margin-top: 12px;
}

.section-title {
    font-size: 13px;
    color: #969799;
    padding: 12px 16px 6px;
}

.speed-control {
    display: flex;
    align-items: center;
    gap: 8px;
}

.speed-label {
    font-size: 13px;
    color: #323233;
    min-width: 48px;
    text-align: right;
}
</style>
