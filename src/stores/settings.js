import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'icao_settings'

/**
 * @returns {Object} 默认设置
 */
function getDefaultSettings() {
    return {
        showTranslation: true,
        speed: 1.0,
        autoPlay: false,
        debugMode: false,
        useRemoteUrl: false,
        language: 'zh'
    }
}

/**
 * @returns {Object} 从 localStorage 读取的设置
 */
function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            return { ...getDefaultSettings(), ...JSON.parse(raw) }
        }
    } catch (e) {
        console.warn('Failed to load settings:', e)
    }
    return getDefaultSettings()
}

export const useSettingsStore = defineStore('settings', () => {
    const saved = loadSettings()
    const showTranslation = ref(saved.showTranslation)
    const speed = ref(saved.speed)
    const autoPlay = ref(saved.autoPlay)
    const debugMode = ref(saved.debugMode)
    const useRemoteUrl = ref(saved.useRemoteUrl)
    const language = ref(saved.language)

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            showTranslation: showTranslation.value,
            speed: speed.value,
            autoPlay: autoPlay.value,
            debugMode: debugMode.value,
            useRemoteUrl: useRemoteUrl.value,
            language: language.value
        }))
    }

    /**
     * 切换 Debug 模式（仅用于开发调试）
     */
    function toggleDebug() {
        debugMode.value = !debugMode.value
    }

    watch([showTranslation, speed, autoPlay, debugMode, useRemoteUrl, language], persist, { deep: true })

    return {
        showTranslation,
        speed,
        autoPlay,
        debugMode,
        useRemoteUrl,
        language,
        toggleDebug
    }
})
