<template>
  <div class="page-container task-detail-page">
    <div class="task-detail-page__header">
      <button type="button" class="task-detail-page__back" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Back to Tasks
      </button>
      <div class="page-title">Task Detail</div>
    </div>

    <div class="page-body task-detail-page__body">
      <div v-if="loading" class="tasks-empty">Loading...</div>
      <div v-else-if="!task" class="tasks-empty">Task not found.</div>
      <template v-else>
        <div class="task-detail-card">
          <div class="task-detail-card__meta">
            <div class="task-detail-card__row">
              <span class="task-detail-card__label">Task ID</span>
              <span>#{{ task.id }}</span>
            </div>
            <div class="task-detail-card__row">
              <span class="task-detail-card__label">App</span>
              <span class="tasks-tag" :style="{ backgroundColor: task.appColor }">{{ task.app }}</span>
            </div>
            <div class="task-detail-card__row">
              <span class="task-detail-card__label">Name</span>
              <span>{{ task.name }}</span>
            </div>
            <div class="task-detail-card__row">
              <span class="task-detail-card__label">Date</span>
              <span>{{ task.date }}</span>
            </div>
            <div class="task-detail-card__row">
              <span class="task-detail-card__label">Status</span>
              <span
                class="tasks-status"
                :style="{ backgroundColor: statusStyle.bg, color: statusStyle.color }"
              >{{ statusStyle.label }}</span>
            </div>
            <div class="task-detail-card__row">
              <span class="task-detail-card__label">Creator</span>
              <span>{{ task.creator.name }}</span>
            </div>
            <div class="task-detail-card__row">
              <span class="task-detail-card__label">Permission</span>
              <span>{{ task.isMine ? 'Owner' : 'Read only' }}</span>
            </div>
          </div>
        </div>

        <div v-if="task.status === 'running' || task.status === 'pending'" class="task-detail-result">
          <div class="loading-box">
            <img class="loading-box__icon" src="/images/loading.png" alt="">
            <div class="loading-box__text">Task is still processing...</div>
            <button
              v-if="task.isMine"
              type="button"
              class="btn btn-outline task-detail-cancel-btn"
              :disabled="cancelling"
              @click="cancelTask"
            >
              {{ cancelling ? 'Cancelling...' : 'Cancel Task' }}
            </button>
          </div>
        </div>

        <div v-else-if="task.status === 'failed'" class="task-detail-result">
          <div class="task-detail-error">
            <div class="res-title">Task Failed</div>
            <p>{{ task.errorMsg || 'The task failed to complete.' }}</p>
          </div>
        </div>

        <div v-else-if="task.status === 'cancelled'" class="task-detail-result">
          <div class="task-detail-error">
            <div class="res-title">Task Cancelled</div>
            <p>{{ task.errorMsg || 'The task was cancelled.' }}</p>
          </div>
        </div>

        <div v-else-if="task.status === 'completed' && task.result" class="task-detail-result result-box align-left">
          <t-pro-task-result :operation="task.operation" :result="task.result" />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import TProTaskResult from './t-pro/results/t-pro-task-result.vue';
import { taskStatusMap } from '../data/tasks-mock.js';
import { cancelTproTask, fetchTaskDetail } from '../assets/js/tpro-task.js';

const REFRESH_INTERVAL_MS = 10000;

export default {
  name: 'task-detail',
  components: {
    TProTaskResult,
  },
  data() {
    return {
      task: null,
      loading: false,
      cancelling: false,
      refreshTimer: null,
    };
  },
  computed: {
    taskId() {
      return this.$route.params.id;
    },
    statusStyle() {
      if (!this.task) {
        return taskStatusMap.pending;
      }
      return taskStatusMap[this.task.status] || taskStatusMap.pending;
    },
  },
  watch: {
    taskId: {
      immediate: true,
      handler() {
        this.loadTask();
      },
    },
  },
  beforeUnmount() {
    this.clearRefreshTimer();
  },
  methods: {
    clearRefreshTimer() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },
    setupRefreshTimer() {
      this.clearRefreshTimer();

      if (!this.task || (this.task.status !== 'running' && this.task.status !== 'pending')) {
        return;
      }

      this.refreshTimer = setInterval(() => {
        this.loadTask(true);
      }, REFRESH_INTERVAL_MS);
    },
    async loadTask(silent = false) {
      if (!silent) {
        this.loading = true;
      }

      try {
        const task = await fetchTaskDetail(this.taskId);
        this.task = task;
        this.setupRefreshTimer();
      } catch (e) {
        if (!silent) {
          this.task = null;
        }
      } finally {
        if (!silent) {
          this.loading = false;
        }
      }
    },
    goBack() {
      this.$router.push('/tasks');
    },
    async cancelTask() {
      if (!this.task?.isMine || this.cancelling) {
        return;
      }

      this.cancelling = true;
      try {
        const task = await cancelTproTask(this.task.id);
        if (task) {
          this.task = task;
          this.setupRefreshTimer();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          text: err.message || 'Failed to cancel task',
        });
      } finally {
        this.cancelling = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.task-detail-page__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-detail-page__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: #605bff;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
}

.task-detail-page__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-detail-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 8px 24px rgba(3, 2, 41, 0.04);
}

.task-detail-card__meta {
  display: grid;
  gap: 12px;
}

.task-detail-card__row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.task-detail-card__label {
  min-width: 80px;
  color: rgba(3, 2, 41, 0.5);
}

.task-detail-result {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 8px 24px rgba(3, 2, 41, 0.04);
}

.task-detail-error p {
  margin: 8px 0 0;
  color: #e71d36;
}

.task-detail-cancel-btn {
  margin-top: 16px;
}
</style>
