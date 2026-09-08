<template>
  <div class="item-detail-page">
    <template v-if="item">
      <item-detail-sidebar
        :category-label="item.categoryLabel"
        :sections="sections"
        :active-section-id="activeSectionId"
        @select-section="activeSectionId = $event"
      />
      <item-detail-content
        :item="item"
        :active-section-id="activeSectionId"
        @update:active-section-id="activeSectionId = $event"
      />
    </template>
    <div v-else class="item-detail-empty">
      <p class="item-detail-empty__title">Item not found</p>
      <p class="item-detail-empty__desc">No item matches the id "{{ itemId }}".</p>
    </div>
  </div>
</template>

<script>
import ItemDetailSidebar from './item-detail/item-detail-sidebar.vue';
import ItemDetailContent from './item-detail/item-detail-content.vue';
import { getItemById, itemDetailSections } from '../data/item-detail-mock.js';

export default {
  name: 'item-detail',
  components: {
    ItemDetailSidebar,
    ItemDetailContent,
  },
  data() {
    return {
      sections: itemDetailSections,
      activeSectionId: 'overview',
    };
  },
  computed: {
    itemId() {
      return this.$route.params.id;
    },
    item() {
      return getItemById(this.itemId);
    },
  },
  watch: {
    itemId() {
      this.activeSectionId = 'overview';
    },
  },
};
</script>
