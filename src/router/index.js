import Vue from 'vue';
import Router from 'vue-router';
import format from '@/components/format';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'format',
            component: format
        }
    ]
});