<template>
  <div
    class="notification-item"
    :class="{
      'notification-item--card': variant === 'card',
      'notification-item--read': item.read,
    }"
  >
    <div class="notification-item__row">
      <span class="notification-item__tag" :style="{ backgroundColor: item.tagColor }">{{ item.tag }}</span>
      <div class="notification-item__main">
        <p class="notification-item__text">
          <template v-if="item.taskId">
            <strong>Task ID {{ item.taskId }}</strong>, {{ item.message }}
          </template>
          <template v-else>
            User <strong>{{ item.user }}</strong> {{ item.message }}
          </template>
          <a class="notification-item__link" @click="$emit('view', item)">[View]</a>
        </p>
        <div class="notification-item__time">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="notification-item__clock">
            <circle cx="7" cy="7" r="6" stroke="#999" stroke-width="1.2" />
            <path d="M7 4V7L9 9" stroke="#999" stroke-width="1.2" stroke-linecap="round" />
          </svg>
          {{ item.time }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'notification-item',
  props: {
    item: { type: Object, required: true },
    variant: {
      type: String,
      default: 'inline',
      validator: (value) => ['inline', 'card'].includes(value),
    },
  },
  emits: ['view'],
};
</script>
