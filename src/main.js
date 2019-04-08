// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import router from './router';
import elementui from 'element-ui';
import clipboard from 'vue-clipboard2';

import 'element-ui/lib/theme-chalk/index.css';

Vue.config.productionTip = false;

Vue.use(elementui);
Vue.use(clipboard);

/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    render: h => h(App)
});