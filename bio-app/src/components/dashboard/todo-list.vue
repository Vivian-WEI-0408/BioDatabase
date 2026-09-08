<template>
  <div class="dashboard-card todo-list">
    <div class="dashboard-card__header">
      <div class="dashboard-card__title">ToDo List</div>
      <button type="button" class="dashboard-card__menu-btn" aria-label="More">
        <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
          <circle cx="2" cy="2" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="8" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="14" r="2" fill="#030229" fill-opacity="0.5" />
        </svg>
      </button>
    </div>
    <div class="todo-list__body">
      <label
        v-for="item in localItems"
        :key="item.id"
        class="todo-item"
        :class="{ 'todo-item--done': item.done }"
      >
        <span class="todo-item__checkbox" :class="{ 'todo-item__checkbox--checked': item.done }">
          <svg v-if="item.done" width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <input
          type="checkbox"
          class="todo-item__input"
          :checked="item.done"
          @change="onItemChange(item, $event)"
        >
        <span class="todo-item__text">
          <template v-if="item.highlight">
            {{ item.text.split(item.highlight)[0] }}<strong>{{ item.highlight }}</strong>{{ item.text.split(item.highlight)[1] }}
          </template>
          <template v-else>{{ item.text }}</template>
        </span>
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'todo-list',
  props: {
    items: { type: Array, default: () => [] },
  },
  emits: ['change'],
  data() {
    return {
      localItems: this.items.map((item) => ({ ...item })),
    };
  },
  watch: {
    items: {
      handler(newItems) {
        this.localItems = newItems.map((item) => ({ ...item }));
      },
    },
  },
  methods: {
    onItemChange(item, event) {
      const done = event.target.checked;
      item.done = done;
      this.$emit('change', { id: item.id, done });
    },
  },
};
</script>
