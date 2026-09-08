<template>
  <div class="page-container dashboard-page">
    <div class="page-header">
      <div class="page-title">Dashboard</div>
    </div>
    <div class="page-body dashboard-body scroll-box">
      <div class="app-cards-grid">
        <app-quick-card
          v-for="card in appCards"
          :key="card.id"
          :title="card.title"
          :description="card.description"
          :icon="card.icon"
          :route="card.route"
        />
      </div>
      <div class="dashboard-row">
        <notification-list :items="notifications" @view="onNotificationView" />
        <todo-list :items="todos" @change="onTodoChange" />
      </div>
      <div class="dashboard-row">
        <task-stats-chart :dates="taskStats.dates" :values="taskStats.values" />
        <storage-chart
          :available-percent="storage.availablePercent"
          :totalMB="storage.totalMB"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AppQuickCard from './dashboard/app-quick-card.vue';
import NotificationList from './dashboard/notification-list.vue';
import TodoList from './dashboard/todo-list.vue';
import TaskStatsChart from './dashboard/task-stats-chart.vue';
import StorageChart from './dashboard/storage-chart.vue';

export default {
  name: 'dashboard',
  components: {
    AppQuickCard,
    NotificationList,
    TodoList,
    TaskStatsChart,
    StorageChart,
  },
  data() {
    return {
      loading: false,
      appCards: [],
      notifications: [],
      todos: [],
      taskStats: { dates: [], values: [] },
      storage: { availablePercent: 0, totalMB: 0 },
    };
  },
  created() {
    if (!G.U || !G.U.token) {
      this.$router.replace('/signin');
      return;
    }
    this.loadDashboard();
  },
  methods: {
    async loadDashboard() {
      this.loading = true;
      try {
        const res = await axios.post('dashboard/getData');
        const data = res.data || {};
        if (data.status === 2) {
          this.$router.replace('/signin');
          return;
        }
        if (data.status === 1 && data.options) {
          const opts = data.options;
          if (opts.appCards) this.appCards = opts.appCards;
          if (opts.notifications) this.notifications = opts.notifications;
          if (opts.todos) this.todos = opts.todos;
          if (opts.taskStats) this.taskStats = opts.taskStats;
          if (opts.storage) this.storage = opts.storage;
        }
      } catch (e) {
        // keep empty defaults
      } finally {
        this.loading = false;
      }
    },
    async onTodoChange({ id, done }) {
      const todo = this.todos.find((item) => item.id === id);
      if (!todo) return;

      const prev = todo.done;
      todo.done = done;

      try {
        const res = await axios.post('todos/update', { id, done });
        const data = res.data || {};
        if (data.status === 2) {
          todo.done = prev;
          this.$router.replace('/signin');
          return;
        }
        if (data.status !== 1) {
          todo.done = prev;
        }
      } catch (e) {
        todo.done = prev;
      }
    },
    onNotificationView() {
      G.goPage('notifications');
    },
  },
};
</script>
