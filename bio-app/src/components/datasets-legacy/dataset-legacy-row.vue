<template>
  <div class="datasets-legacy-row">
    <label class="datasets-legacy-row__cell datasets-legacy-row__cell--check">
      <span class="datasets-legacy-row__checkbox" :class="{ 'datasets-legacy-row__checkbox--checked': selected }">
        <svg v-if="selected" width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <input type="checkbox" class="datasets-legacy-row__input" :checked="selected" @change="$emit('toggle-select', row.id)">
    </label>
    <div class="datasets-legacy-row__cell datasets-legacy-row__cell--id">#{{ row.id }}</div>
    <div class="datasets-legacy-row__cell">{{ row.fieldA }}</div>
    <div class="datasets-legacy-row__cell">{{ row.fieldB }}</div>
    <div class="datasets-legacy-row__cell datasets-legacy-row__cell--date">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="datasets-legacy-row__date-icon">
        <rect x="2" y="3" width="12" height="11" rx="2" stroke="#5b93ff" stroke-width="1.2" />
        <path d="M5 1.5V4M11 1.5V4M2 6.5H14" stroke="#5b93ff" stroke-width="1.2" stroke-linecap="round" />
      </svg>
      {{ row.createdAt }}
    </div>
    <div class="datasets-legacy-row__cell datasets-legacy-row__cell--creator">
      <img :src="row.creator.avatar" alt="" class="datasets-legacy-row__avatar" loading="lazy">
      <span>{{ row.creator.name }}</span>
    </div>
    <div class="datasets-legacy-row__cell datasets-legacy-row__cell--actions">
      <button type="button" class="datasets-legacy-row__menu-btn" aria-label="More actions" @click="$emit('menu')">
        <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
          <circle cx="2" cy="2" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="8" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="14" r="2" fill="#030229" fill-opacity="0.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'dataset-legacy-row',
  props: {
    row: { type: Object, required: true },
    selected: { type: Boolean, default: false },
  },
  emits: ['toggle-select', 'menu'],
};
</script>
