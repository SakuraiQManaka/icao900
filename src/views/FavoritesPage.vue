<template>
    <div class="favorites-page">
        <van-nav-bar
            title="收藏夹"
            left-arrow
            @click-left="$router.push('/')"
        />

        <div v-if="favQuestions.length === 0" class="fav-empty">
            <van-empty description="暂无收藏题目，刷题时点击收藏" />
        </div>

        <div v-else class="fav-list">
            <div
                v-for="q in favQuestions"
                :key="q.id"
                class="fav-item"
                @click="goToQuiz(q.id)"
            >
                <div class="fav-id">#[{{ q.id }}]</div>
                <div class="fav-content">{{ q.content }}</div>
                <div class="fav-arrow">
                    <img src="/icons/icon-arrow-right.png" alt=">" class="arrow-img" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '../stores/progress'

const router = useRouter()
const progressStore = useProgressStore()

const favQuestions = ref([])

onMounted(async () => {
    const favIds = progressStore.favoriteIds
    if (favIds.length === 0) return

    const resp = await fetch('/data/all.json')
    const data = await resp.json()
    favQuestions.value = data.questions.filter(q => favIds.includes(q.id))
})

function goToQuiz(id) {
    router.push(`/quiz/favorites?id=${id}`)
}
</script>

<style scoped>
.favorites-page {
    min-height: 100vh;
    background: #f7f8fa;
}

.fav-empty {
    padding-top: 80px;
}

.fav-list {
    padding: 16px;
}

.fav-item {
    background: #fff;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.fav-item:active {
    transform: scale(0.98);
}

.fav-id {
    font-size: 12px;
    color: #969799;
    min-width: 48px;
}

.fav-content {
    flex: 1;
    font-size: 14px;
    color: #323233;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.fav-arrow {
    font-size: 14px;
    color: #c8c9cc;
    margin-left: 8px;
    display: flex;
    align-items: center;
}
</style>
