<template>
  <aside v-if="items.length" class="document-summary">
    <div class="document-summary__title">Summary</div>
    <nav class="document-summary__list">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="document-summary__item"
        :class="{ 'document-summary__item--active': activeAnchorId === item.id }"
        @click="$emit('select-anchor', item.id)"
      >
        {{ item.label }}
      </button>
    </nav>
  </aside>
</template>

<script>
export default {
  name: 'doc-summary',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    activeAnchorId: {
      type: String,
      default: '',
    },
  },
  emits: ['select-anchor'],
};
</script>
