import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { installPlatformContext } from './platformContext'
import './styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
installPlatformContext(app)
app.mount('#app')
