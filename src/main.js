import { createApp } from 'vue'
import pinia from './store'

import App from './App.vue'
import router from './router'

// Element Plus 全量引入
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/theme.css'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('[app error]', err, info)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')