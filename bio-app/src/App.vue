<template>
	<div class="main-app" id="mainContent" :class="{ 'disabled-scroll': disabledScroll }">
		<app-menu v-show="showAppMenu"></app-menu>
		<div class="content-block" :class="['page-' + $route.name, { 'full-screen': !showAppMenu }]">
			<router-view v-slot="{ Component }">
				<!-- <keep-alive exclude="home,login"> -->
				<component :is="Component" :key="$route.fullPath" />
				<!-- </keep-alive> -->
			</router-view>
		</div>
	</div>
</template>

<script>
import axios from 'axios';

const api = axios.create({ baseURL: '/api/' });
const tpro = axios.create({
	baseURL: '/t-pro-api/',
	timeout: 600000,
});
const tplotApi = axios.create({ baseURL: '/tplot-api/' });

window['axios'] = api;
window['tpro'] = tpro;
window['tplotApi'] = tplotApi;
window['Swal'] = Sweetalert2;

const AUTH_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
let authRefreshTimer = null;
let handlingAuthError = false;

function hasLocalSession() {
	const stored = typeof S !== 'undefined' ? S.get('_u') : null;
	if (stored?.token) {
		return true;
	}
	return !!(G?.U?.token);
}

function forceSignOut(router) {
	if (handlingAuthError) {
		return;
	}
	handlingAuthError = true;

	if (typeof G?.afterLogout === 'function') {
		G.afterLogout();
	} else if (typeof G?.clearUserData === 'function') {
		G.clearUserData();
	}

	if (authRefreshTimer) {
		clearInterval(authRefreshTimer);
		authRefreshTimer = null;
	}

	const current = router?.currentRoute?.value?.name;
	if (current !== 'signin' && current !== 'signup') {
		router.replace('/signin').finally(() => {
			handlingAuthError = false;
		});
		return;
	}

	handlingAuthError = false;
}

import AppMenu from './components/parts/app-menu.vue';
import { reactive } from 'vue';

export default {

	components: {
		AppMenu,
	},

	created() {

		let t = this;

		api.interceptors.response.use(
			(response) => {
				if (response.data) {
					const status = response.data.status;
					const url = String(response.config?.url || '');
					const isPublicAuthCall = /^account\/(login|register|sendVCode|resetPassword)/.test(url);

					// status 2/4 on public account APIs are business errors (e.g. bad credentials)
					if (status == -99 || ((status == 2 || status == 4) && !isPublicAuthCall && hasLocalSession())) {
						forceSignOut(t.$router);
						return Promise.reject(new Error('Auth Error'));
					}
				}
				return response;
			},
			(error) => {
				return Promise.reject(error);
			}
		);

		t.initRouter();

		if (t.initGlobal()) {
			t._initApp();
		}

	},

	mounted() {
		let t = this;
	},

	methods: {

		async _initApp() {
			let t = this;


			let authed = await t.userAuth();

			if (authed) {
			}

		},

		afterLogin() {
			let t = this;
			t.initUserRole();
			api.defaults.headers.common["Token"] = G.U.token;
			tplotApi.defaults.headers.common["Token"] = G.U.token;
			t.startAuthRefreshTimer();
		},

		afterLogout() {
			G.clearUserData();
			mirror({
				role: 0,
				username: '',
				name: '',
				email: '',
				title: '',
				phone: '',
				gender: '',
				avatar: '',
				token: '',
				token_expires_at: '',
			}, G.U);
			delete api.defaults.headers.common['Token'];
			delete tplotApi.defaults.headers.common['Token'];
			if (authRefreshTimer) {
				clearInterval(authRefreshTimer);
				authRefreshTimer = null;
			}
		},

		startAuthRefreshTimer() {
			let t = this;

			if (authRefreshTimer) {
				clearInterval(authRefreshTimer);
			}

			authRefreshTimer = setInterval(() => {
				if (!G.U?.token) {
					return;
				}
				t.silentRefreshProfile();
			}, AUTH_REFRESH_INTERVAL_MS);
		},

		async silentRefreshProfile() {
			try {
				const res = await api.post('user/refreshProfile');
				if (res.data?.status == 1 && res.data.options?.user) {
					const user = res.data.options.user;
					S.set('_u', user);
					mirror(user, G.U);
					api.defaults.headers.common['Token'] = G.U.token;
					tplotApi.defaults.headers.common['Token'] = G.U.token;
				}
			} catch (err) {
				// Auth interceptor handles status 2/4
			}
		},

		initRouter() {
			window['vrouter'].beforeEach((to, from, next) => {
				const isPublic = !!(to.meta && to.meta.public);
				const loggedIn = hasLocalSession();

				if (!loggedIn && !isPublic) {
					next({ name: 'signin', query: { redirect: to.fullPath } });
					return;
				}

				if (loggedIn && (to.name === 'signin' || to.name === 'signup')) {
					next({ name: 'dashboard' });
					return;
				}

				if (to.meta?.requiresAdmin && Number(G.U?.role || 0) < 9) {
					next({ name: 'dashboard' });
					return;
				}

				next();
			});
		},

		initGlobal() {

			let t = this;

			G._language = window._language;

			const U = reactive({
				role: 0,
				username: '',
				name: '',
				email: '',
				title: '',
				phone: '',
				gender: '',
				avatar: '',
				token: '',
				token_expires_at: '',
			});

			G.U = U;

			G.startUrl = location.href;
			G.busying = false;

			G.afterLogin = t.afterLogin;
			G.afterLogout = t.afterLogout;

			G.back = () => {
				t.$router.go(-1);
			};

			G.switchLanguage = () => {
				if (window._language === 'zh-cn') {
					window._language = 'en-us';
				} else {
					window._language = 'zh-cn';
				}
				localStorage['_language'] = window._language;
				location.reload();
			},


			G.refreshBaseData = () => {
				t.loadBaseData();
			}


			let p = getURLParams();

			return true;
		},

		async userAuth() {

			let t = this;

			if (S.get("_u")) {
				mirror(S.get("_u"), G.U);
				t.U = G.U;
				t.initUserRole();
			}

			if (G.U.token) {

				api.defaults.headers.common["Token"] = G.U.token;
				tplotApi.defaults.headers.common["Token"] = G.U.token;

				try {
					let res = await api.post("user/refreshProfile");

					if (res.data.status == 1) {
						let U = res.data.options.user;
						S.set("_u", U);
						mirror(U, t.U);
						t.initUserRole();
						api.defaults.headers.common["Token"] = G.U.token;
						tplotApi.defaults.headers.common["Token"] = G.U.token;
						t.startAuthRefreshTimer();
						if (t.$route.name == 'signin' || t.$route.name == 'signup') {
							t.$router.replace('dashboard');
						}

						return true;
					}

					forceSignOut(t.$router);
				} catch (err) {
					// Auth interceptor already handles status 2/4
				}
			}

			return false;
		},

		initUserRole() {
		},


	},

	data() {
		return {
			disabledScroll: false,
			ready: false,
		};
	},

	computed: {
		showAppMenu() {
			let name = this.$route.name;
			return name !== 'signup' && name !== 'signin';
		},
	}

};
</script>

<style lang="scss" scoped>
.content-block.full-screen {
	width: 100%;
}
</style>
