<template>
  <div class="app-card" @click="onOpen">
    <button
      type="button"
      class="app-card__star"
      :class="{ 'app-card__star--active': starred }"
      aria-label="Toggle favorite"
      @click.stop="onToggleStar"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 1.5L12.472 7.236L18.66 7.854L14.03 12.064L15.416 18.146L10 15.27L4.584 18.146L5.97 12.064L1.34 7.854L7.528 7.236L10 1.5Z"
          :fill="starred ? '#FF8D28' : 'none'"
          :stroke="starred ? '#FF8D28' : '#B3B3BF'"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div class="app-card__body">
      <div class="app-card__icon-wrap">
        <img :src="icon" loading="lazy" alt="" class="app-card__icon">
      </div>
      <div class="app-card__title">{{ title }}</div>
      <div class="app-card__desc">{{ description }}</div>
    </div>

    <div class="app-card__footer">
      <div class="app-card__meta">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="app-card__meta-icon">
          <circle cx="8" cy="5" r="2.5" stroke="#999" stroke-width="1.2" />
          <path d="M3 14c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="#999" stroke-width="1.2" stroke-linecap="round" />
        </svg>
        <span>{{ author }}</span>
      </div>
      <div class="app-card__meta">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="app-card__meta-icon">
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#999" stroke-width="1.2" />
          <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="#999" stroke-width="1.2" stroke-linecap="round" />
        </svg>
        <span>{{ date }}</span>
      </div>
      <div class="app-card__meta">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="app-card__meta-icon">
          <rect x="2" y="9" width="2.5" height="5" rx="0.5" fill="#999" />
          <rect x="6.75" y="6" width="2.5" height="8" rx="0.5" fill="#999" />
          <rect x="11.5" y="3" width="2.5" height="11" rx="0.5" fill="#999" />
        </svg>
        <span>{{ taskCount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app-card',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '/images/logo.png' },
    author: { type: String, default: '' },
    date: { type: String, default: '' },
    taskCount: { type: String, default: '' },
    route: { type: String, default: null },
    starred: { type: Boolean, default: false },
  },
  emits: ['toggle-star'],
  methods: {
    onOpen() {
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
    onToggleStar() {
      this.$emit('toggle-star');
    },
  },
};
</script>
