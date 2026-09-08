<template>
  <aside class="item-detail-sidebar">
    <div class="item-detail-sidebar__header">
      <div class="item-detail-sidebar__title">{{ categoryLabel }}</div>
    </div>
    <nav class="item-detail-sidebar__nav" aria-label="Item sections">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        class="item-detail-sidebar__nav-item"
        :class="{ 'item-detail-sidebar__nav-item--active': activeSectionId === section.id }"
        @click="$emit('select-section', section.id)"
      >
        {{ section.label }}
      </button>
    </nav>
  </aside>
</template>

<script>
export default {
  name: 'item-detail-sidebar',
  props: {
    categoryLabel: {
      type: String,
      required: true,
    },
    sections: {
      type: Array,
      required: true,
    },
    activeSectionId: {
      type: String,
      required: true,
    },
  },
  emits: ['select-section'],
};
</script>
