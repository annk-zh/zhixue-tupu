import { createPinia } from 'pinia'

// Pinia 实例（在 main.js 中通过 app.use(pinia) 挂载）
// store 模块按业务拆分于 src/store/modules/*.js
const pinia = createPinia()

export default pinia