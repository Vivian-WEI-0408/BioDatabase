<template>
  <aside class="document-sidebar">
    <div class="document-sidebar__header">
      <div class="document-sidebar__title">Document</div>
      <div class="document-search">
        <input
          :value="searchQuery"
          type="search"
          class="document-search__input"
          placeholder="Search"
          aria-label="Search documents"
          @input="$emit('update:searchQuery', $event.target.value)"
        >
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" class="document-search__icon">
          <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
          <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
    </div>

    <div
      v-for="section in sections"
      :key="section.id"
      class="document-nav-section"
      :class="{ 'document-nav-section--expanded': section.expanded }"
    >
      <button
        type="button"
        class="document-nav-section__toggle"
        @click="$emit('toggle-section', section.id)"
      >
        <span class="document-nav-section__title">{{ section.title }}</span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          class="document-nav-section__caret"
          :class="{ 'document-nav-section__caret--expanded': section.expanded }"
        >
          <path d="M6 9L12 15L18 9" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div v-if="section.expanded" class="document-nav-section__items">
        <button
          v-for="item in section.items"
          :key="item.id"
          type="button"
          class="document-nav-item"
          :class="{ 'document-nav-item--active': activePageId === item.id }"
          @click="$emit('select-page', item.id)"
        >
          {{ item.title }}
        </button>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'doc-sidebar',
  props: {
    sections: {
      type: Array,
      required: true,
    },
    activePageId: {
      type: String,
      required: true,
    },
    searchQuery: {
      type: String,
      default: '',
    },
  },
  emits: ['update:searchQuery', 'select-page', 'toggle-section'],
};
</script>
