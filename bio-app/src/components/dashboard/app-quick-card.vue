<template>
  <div class="app-quick-card">
    <div class="app-quick-card__icon-wrap">
      <img :src="icon" loading="lazy" alt="" class="app-quick-card__icon">
    </div>
    <div class="app-quick-card__content">
      <div class="app-quick-card__title">{{ title }}</div>
      <div class="app-quick-card__desc">{{ description }}</div>
    </div>
    <a class="app-quick-card__btn" @click="onQuickStart">Quick Start</a>
  </div>
</template>

<script>
export default {
  name: 'app-quick-card',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '/images/logo.png' },
    route: { type: String, default: null },
  },
  methods: {
    onQuickStart() {
      if (this.route) {
        this.$router.push(this.route);
        return;
      }
      Swal.fire({
        icon: 'info',
        title: 'Coming soon',
        text: `${this.title} is not available yet.`,
        confirmButtonColor: '#605bff',
      });
    },
  },
};
</script>
