<template>
  <aside class="datasets-legacy-sidebar">
    <div class="datasets-legacy-sidebar__header">
      <div class="datasets-legacy-sidebar__title">DataSets</div>
      <div class="datasets-legacy-search">
        <input
          :value="searchQuery"
          type="search"
          class="datasets-legacy-search__input"
          placeholder="Search"
          aria-label="Search datasets"
          @input="$emit('update:searchQuery', $event.target.value)"
        >
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" class="datasets-legacy-search__icon">
          <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
          <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
    </div>

    <div
      v-for="section in sections"
      :key="section.id"
      class="datasets-legacy-nav-section"
      :class="{ 'datasets-legacy-nav-section--expanded': section.expanded }"
    >
      <button
        type="button"
        class="datasets-legacy-nav-section__toggle"
        @click="$emit('toggle-section', section.id)"
      >
        <span class="datasets-legacy-nav-section__title">{{ section.title }}</span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          class="datasets-legacy-nav-section__caret"
          :class="{ 'datasets-legacy-nav-section__caret--expanded': section.expanded }"
        >
          <path d="M6 9L12 15L18 9" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div v-if="section.expanded" class="datasets-legacy-nav-section__items">
        <button
          v-for="table in section.tables"
          :key="table.id"
          type="button"
          class="datasets-legacy-nav-item"
          :class="{ 'datasets-legacy-nav-item--active': activeTableId === table.id }"
          @click="$emit('select-table', table.id)"
        >
          {{ table.title }}
        </button>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'dataset-legacy-sidebar',
  props: {
    sections: {
      type: Array,
      required: true,
    },
    activeTableId: {
      type: String,
      required: true,
    },
    searchQuery: {
      type: String,
      default: '',
    },
  },
  emits: ['update:searchQuery', 'select-table', 'toggle-section'],
};
</script>
