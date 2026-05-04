/**
 * 音频路径映射工具
 *
 * 默认使用本地音频文件（/audio/icao-{id}.mp3）。
 * Debug 模式下可切换使用远程 URL 或本地文件。
 */

const SETTINGS_KEY = 'icao_settings'

/**
 * @param {number} questionId - 题目 ID
 * @param {string} remoteUrl - JSON 中的远程音频 URL
 * @returns {string} 最终的音频路径
 */
export function getAudioPath(questionId, remoteUrl) {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY)
        if (raw) {
            const settings = JSON.parse(raw)
            // debugMode 开启后，根据 useRemoteUrl 决定是否使用远程
            if (settings.debugMode && settings.useRemoteUrl) {
                return remoteUrl
            }
        }
    } catch {
        // ignore
    }
    // 默认使用本地音频
    return `/audio/icao-${questionId}.mp3`
}
