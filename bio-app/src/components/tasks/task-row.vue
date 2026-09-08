<template>
  <div class="tasks-row" :class="{ 'tasks-row--elevated': menuOpen }">
    <label class="tasks-row__cell tasks-row__cell--check">
      <span class="tasks-row__checkbox" :class="{ 'tasks-row__checkbox--checked': selected }">
        <svg v-if="selected" width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <input type="checkbox" class="tasks-row__input" :checked="selected" @change="$emit('toggle-select', task.id)">
    </label>
    <div class="tasks-row__cell tasks-row__cell--id">#{{ task.id }}</div>
    <div class="tasks-row__cell tasks-row__cell--app">
      <span class="tasks-tag" :style="{ backgroundColor: task.appColor }">{{ task.app }}</span>
    </div>
    <div class="tasks-row__cell tasks-row__cell--name">
      <button
        v-if="canViewDetail"
        type="button"
        class="tasks-row__name-link"
        @click="onView"
      >{{ task.name }}</button>
      <span v-else>{{ task.name }}</span>
      <span v-if="task.sharedCount > 0 && task.isMine" class="tasks-row__share-badge">Shared</span>
      <span v-else-if="task.sharedToMe" class="tasks-row__share-badge">Read only</span>
    </div>
    <div class="tasks-row__cell tasks-row__cell--date">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="tasks-row__date-icon">
        <rect x="2" y="3" width="12" height="11" rx="2" stroke="#5b93ff" stroke-width="1.2" />
        <path d="M5 1.5V4M11 1.5V4M2 6.5H14" stroke="#5b93ff" stroke-width="1.2" stroke-linecap="round" />
      </svg>
      {{ task.date }}
    </div>
    <div class="tasks-row__cell tasks-row__cell--status">
      <span
        class="tasks-status"
        :style="{ backgroundColor: statusStyle.bg, color: statusStyle.color }"
      >{{ statusStyle.label }}</span>
    </div>
    <div class="tasks-row__cell tasks-row__cell--creator">
      <img :src="task.creator.avatar" alt="" class="tasks-row__avatar" loading="lazy">
      <span>{{ task.creator.name }}</span>
    </div>
    <div class="tasks-row__cell tasks-row__cell--actions">
      <van-popover v-model:show="menuOpen" placement="bottom-end" :offset="[0, 8]">
        <div class="tasks-action-menu">
          <button
            v-if="canViewDetail"
            type="button"
            class="tasks-action-menu__item"
            @click="onView"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#5b93ff" stroke-width="1.2" />
              <path d="M6 4V6L7.5 7.5" stroke="#5b93ff" stroke-width="1.2" stroke-linecap="round" />
            </svg>
            View
          </button>
          <button
            v-if="canManage"
            type="button"
            class="tasks-action-menu__item tasks-action-menu__item--share"
            @click="onShare"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 7.5L7.5 9.25M7.5 2.75L4.5 4.5M3.5 6C3.5 6.82843 2.82843 7.5 2 7.5C1.17157 7.5 0.5 6.82843 0.5 6C0.5 5.17157 1.17157 4.5 2 4.5C2.82843 4.5 3.5 5.17157 3.5 6ZM10.5 2C10.5 2.82843 9.82843 3.5 9 3.5C8.17157 3.5 7.5 2.82843 7.5 2C7.5 1.17157 8.17157 0.5 9 0.5C9.82843 0.5 10.5 1.17157 10.5 2ZM10.5 10C10.5 10.8284 9.82843 11.5 9 11.5C8.17157 11.5 7.5 10.8284 7.5 10C7.5 9.17157 8.17157 8.5 9 8.5C9.82843 8.5 10.5 9.17157 10.5 10Z" stroke="#605bff" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Share
          </button>
          <button v-if="canManage" type="button" class="tasks-action-menu__item tasks-action-menu__item--edit" @click="onEdit">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="#5b93ff" stroke-width="1.2" stroke-linejoin="round" />
            </svg>
            Edit
          </button>
          <button v-if="canManage" type="button" class="tasks-action-menu__item tasks-action-menu__item--delete" @click="onDelete">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 3H10M4.5 3V2H7.5V3M3 3V10H9V3" stroke="#e71d36" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Delete
          </button>
        </div>
        <template #reference>
          <button type="button" class="tasks-row__menu-btn" aria-label="More actions">
            <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
              <circle cx="2" cy="2" r="2" fill="#030229" fill-opacity="0.5" />
              <circle cx="2" cy="8" r="2" fill="#030229" fill-opacity="0.5" />
              <circle cx="2" cy="14" r="2" fill="#030229" fill-opacity="0.5" />
            </svg>
          </button>
        </template>
      </van-popover>
    </div>
  </div>
</template>

<script>
import { taskStatusMap } from '../../data/tasks-mock.js';

export default {
  name: 'task-row',
  props: {
    task: { type: Object, required: true },
    selected: { type: Boolean, default: false },
  },
  emits: ['toggle-select', 'edit', 'delete', 'share', 'view'],
  data() {
    return {
      menuOpen: false,
    };
  },
  computed: {
    statusStyle() {
      return taskStatusMap[this.task.status] || taskStatusMap.pending;
    },
    canViewDetail() {
      return ['completed', 'failed', 'running', 'pending'].includes(this.task.status);
    },
    canManage() {
      return this.task.isMine;
    },
  },
  methods: {
    onView() {
      this.menuOpen = false;
      this.$emit('view', this.task);
    },
    onEdit() {
      this.menuOpen = false;
      this.$emit('edit', this.task);
    },
    onShare() {
      this.menuOpen = false;
      this.$emit('share', this.task);
    },
    onDelete() {
      this.menuOpen = false;
      this.$emit('delete', this.task);
    },
  },
};
</script>
