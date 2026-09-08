import './assets/js/i18n.js'
import './assets/js/jquery-3.6.0.min.js'
import './assets/js/cropper.min.js'
import './assets/js/sweetalert2.min.js'
import './assets/js/echarts.min.js'
import './assets/js/common.js'
import './assets/css/main.scss'
import 'vant/lib/index.css';
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import vant from 'vant'
import T from './components/parts/t.vue'
import enUS from 'vant/es/locale/lang/en-US';
import { Locale } from 'vant';
import '@vant/touch-emulator';

import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

let app = createApp(App);

app.use(FloatingVue)


const messages = {
    'en-US': {
        vanCalendar: {
            monthTitle: (year, month) => {
                let arr = [
                    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
                ];
                return arr[month - 1];
            },
            weekdays: [
                'S', 'M', 'T', 'W', 'T', 'F', 'S'
            ]
        },
    },
};

Locale.use('en-US', enUS);
Locale.add(messages);

window['vapp'] = app;
window['G'] = app.config.globalProperties;
window['initGlobalFuncs']();
window['vrouter'] = router;

app.component('t', T);

app.use(router)
    .use(vant);
router.isReady().then(() => {
    app.mount('#app');
});