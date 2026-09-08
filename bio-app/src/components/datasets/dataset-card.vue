<template>
  <div class="dataset-card" @click="onOpen">
    <button
      type="button"
      class="dataset-card__menu"
      aria-label="Dataset options"
      @click.stop="onMenu"
    >
      <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
        <circle cx="2" cy="2" r="1.5" fill="#030229" fill-opacity="0.4" />
        <circle cx="2" cy="8" r="1.5" fill="#030229" fill-opacity="0.4" />
        <circle cx="2" cy="14" r="1.5" fill="#030229" fill-opacity="0.4" />
      </svg>
    </button>

    <div class="dataset-card__title">{{ title }}</div>

    <div class="dataset-card__tag" :class="`dataset-card__tag--${category}`">
      {{ tagLabel }}
    </div>

    <div class="dataset-card__desc">{{ description }}</div>

    <div class="dataset-card__meta">
      <div class="dataset-card__meta-item">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="dataset-card__meta-icon">
          <rect x="2" y="9" width="2.5" height="5" rx="0.5" fill="#cdccd4" />
          <rect x="6.75" y="6" width="2.5" height="8" rx="0.5" fill="#cdccd4" />
          <rect x="11.5" y="3" width="2.5" height="11" rx="0.5" fill="#cdccd4" />
        </svg>
        <span>{{ itemCount }}</span>
      </div>
      <div class="dataset-card__meta-item">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="dataset-card__meta-icon">
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#cdccd4" stroke-width="1.2" />
          <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="#cdccd4" stroke-width="1.2" stroke-linecap="round" />
        </svg>
        <span>{{ date }}</span>
      </div>
    </div>
  </div>
</template>

<script>
const tagLabels = {
  common: 'Common',
  tpro: 'T-Pro',
  tplot: 'TPlot',
};

export default {
  name: 'dataset-card',
  props: {
    id: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    itemCount: { type: String, default: '' },
    date: { type: String, default: '' },
  },
  computed: {
    tagLabel() {
      return tagLabels[this.category] || this.category;
    },
  },
  methods: {
    showComingSoon() {
      Swal.fire({
        icon: 'info',
        title: 'Coming soon',
        text: `${this.title} is not available yet.`,
        confirmButtonColor: '#605bff',
      });
    },
    onOpen() {
      this.$router.push({ name: 'dataset-browse', params: { id: this.id } });
    },
    onMenu() {
      this.$router.push({ name: 'datatable-config', params: { id: this.id } });
    },
  },
};
</script>
