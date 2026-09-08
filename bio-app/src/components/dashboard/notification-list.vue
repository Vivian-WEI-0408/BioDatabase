<template>
  <div class="dashboard-card notification-list">
    <div class="dashboard-card__header">
      <div class="dashboard-card__title">Notifications</div>
      <button type="button" class="dashboard-card__menu-btn" aria-label="More">
        <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
          <circle cx="2" cy="2" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="8" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="14" r="2" fill="#030229" fill-opacity="0.5" />
        </svg>
      </button>
    </div>
    <div class="notification-list__body">
      <template v-for="(item, index) in items" :key="item.id">
        <div v-if="index > 0" class="notification-item__divider"></div>
        <notification-item :item="item" variant="inline" @view="$emit('view', $event)" />
      </template>
    </div>
  </div>
</template>

<script>
import NotificationItem from '../notifications/notification-item.vue';

export default {
  name: 'notification-list',
  components: {
    NotificationItem,
  },
  props: {
    items: { type: Array, default: () => [] },
  },
  emits: ['view'],
};
</script>
