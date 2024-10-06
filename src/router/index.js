// router.js
import { createRouter, createWebHistory } from 'vue-router';

// 引入你的组件
import GA_FJSP from "@/components/GA_FJSP.vue";
import GA_IPPS from '@/components/GA_IPPS.vue';


// 定义路由
const routes = [
    { path: '/', component: GA_FJSP },
    { path: '/ipps', component: GA_IPPS },
];

// 创建router实例
const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;