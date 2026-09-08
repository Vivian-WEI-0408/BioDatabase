<template>
  <div class="dataset-browse-header">
    <button type="button" class="dataset-browse-header__back" @click="$emit('back')">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none" class="dataset-browse-header__back-icon">
        <path d="M17 6H2M2 6L7 1M2 6L7 11" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Back
    </button>
    <div class="dataset-browse-header__title">Browsing: {{ browseLabel }}</div>
    <div class="dataset-browse-header__decoration" aria-hidden="true">
      <img src="/images/categories/Featured DNA Parts.png" alt="header decoration" class="dataset-browse-header__decoration-image">
    </div>
  </div>
</template>

<script>
export default {
  name: 'dataset-browse-header',
  props: {
    browseLabel: { type: String, required: true },
  },
  emits: ['back'],
};
</script>
