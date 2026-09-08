<template>
  <div class="page-container settings-page">
    <div class="page-header">
      <div class="page-title">Settings</div>
    </div>
    <div class="page-body settings-grid scroll-box">
      <settings-profile-card :user="user" @updated="onUserUpdated" />
      <settings-password-card @updated="onUserUpdated" />
      <settings-email-card :user="user" @updated="onUserUpdated" />
    </div>
  </div>
</template>

<script>
import SettingsProfileCard from './settings/profile-card.vue';
import SettingsPasswordCard from './settings/password-card.vue';
import SettingsEmailCard from './settings/email-card.vue';

function applyUserUpdate(user) {
  S.set('_u', user);
  mirror(user, G.U);
  axios.defaults.headers.common['Token'] = user.token;
}

export default {
  name: 'settings',
  components: {
    SettingsProfileCard,
    SettingsPasswordCard,
    SettingsEmailCard,
  },
  data() {
    return {
      user: {},
    };
  },
  created() {
    if (!G.U || !G.U.token) {
      this.$router.replace('/signin');
      return;
    }
    this.user = { ...G.U };
    this.loadProfile();
  },
  methods: {
    async loadProfile() {
      try {
        const res = await axios.post('user/refreshProfile');
        const data = res.data || {};
        if (data.status === 1 && data.options && data.options.user) {
          applyUserUpdate(data.options.user);
          this.user = { ...data.options.user };
        }
      } catch (e) {
        // keep cached G.U data
      }
    },
    onUserUpdated(user) {
      applyUserUpdate(user);
      this.user = { ...user };
    },
  },
};
</script>
