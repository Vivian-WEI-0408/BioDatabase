<template>
  <div class="page-container notifications-page">
    <div class="notifications-page__header">
      <div class="page-title">Notification</div>
      <div class="notifications-page__toolbar">
        <div class="tasks-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="tasks-tabs__btn"
            :class="{ 'tasks-tabs__btn--active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >{{ tab.label }}</button>
        </div>
        <div class="apps-search">
          <input
            v-model.trim="searchQuery"
            type="search"
            class="apps-search__input"
            placeholder="Search notifications..."
            aria-label="Search notifications"
          >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="apps-search__icon">
            <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
            <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
      </div>
    </div>

    <div class="page-body notifications-page__body">
      <div class="list-panel">
        <div class="scroll-body">
          <notification-item
            v-for="item in paginatedList"
            :key="item.id"
            :item="item"
            variant="card"
            @view="onView"
          />
          <div v-if="loading" class="notifications-page__empty">
            Loading...
          </div>
          <div v-else-if="paginationTotal === 0" class="notifications-page__empty">
            No notifications found.
          </div>
        </div>
        <list-pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total="paginationTotal"
          :page-size="pageSize"
          :page-input="pageInput"
          @update:page-input="pageInput = $event"
          @prev="prevPage"
          @next="nextPage"
          @jump="submitPageJump"
        />
      </div>
    </div>
  </div>
</template>

<script>
import NotificationItem from './notifications/notification-item.vue';
import ListPagination from './parts/list-pagination.vue';
import paginationMixin from '../assets/js/pagination.js';

const tabs = [
  { label: 'ALL', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' },
];

export default {
  name: 'notifications',
  components: {
    NotificationItem,
    ListPagination,
  },
  mixins: [paginationMixin],
  data() {
    return {
      tabs,
      activeTab: 'all',
      searchQuery: '',
      notifications: [],
      loading: false,
    };
  },
  computed: {
    visibleNotifications() {
      let items = this.notifications;

      if (this.activeTab === 'unread') {
        items = items.filter((item) => !item.read);
      } else if (this.activeTab === 'read') {
        items = items.filter((item) => item.read);
      }

      if (!this.searchQuery) {
        return items;
      }

      const q = this.searchQuery.toLowerCase();
      return items.filter((item) => {
        const haystack = [
          item.tag,
          item.taskId,
          item.user,
          item.message,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    },
    paginationList() {
      return this.visibleNotifications;
    },
  },
  watch: {
    activeTab() {
      this.fetchNotifications();
    },
  },
  created() {
    this.fetchNotifications();
  },
  methods: {
    async fetchNotifications() {
      this.loading = true;
      try {
        const res = await axios.post('notifications/list', {
          filter: this.activeTab,
        });
        const data = res.data || {};
        if (data.status === 2) {
          this.$router.replace('/signin');
          return;
        }
        if (data.status === 1 && data.options) {
          this.notifications = data.options.notifications || [];
        }
      } catch (e) {
        // keep current list
      } finally {
        this.loading = false;
      }
    },
    async onView(item) {
      try {
        const res = await axios.post('notifications/markRead', { id: item.id });
        const data = res.data || {};
        if (data.status === 2) {
          this.$router.replace('/signin');
          return;
        }
        const target = this.notifications.find((n) => n.id === item.id);
        if (data.status === 1 && data.options && data.options.notification) {
          if (target) {
            Object.assign(target, data.options.notification);
          }
        } else if (target) {
          target.read = true;
        }
      } catch (e) {
        const target = this.notifications.find((n) => n.id === item.id);
        if (target) {
          target.read = true;
        }
      }

      if (item.taskId) {
        this.$router.push(`/tasks/${item.taskId}`);
        return;
      }

      console.log('View notification:', item);
    },
  },
};
</script>
