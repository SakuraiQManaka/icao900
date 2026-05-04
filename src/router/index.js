import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('../views/HomePage.vue')
    },
    {
        path: '/chapters',
        name: 'chapters',
        component: () => import('../views/ChapterListPage.vue')
    },
    {
        path: '/quiz/:mode',
        name: 'quiz',
        component: () => import('../views/QuizPage.vue'),
        props: true
    },
    {
        path: '/favorites',
        name: 'favorites',
        component: () => import('../views/FavoritesPage.vue')
    },
    {
        path: '/stats',
        name: 'stats',
        component: () => import('../views/StatsPage.vue')
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('../views/SettingsPage.vue')
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
