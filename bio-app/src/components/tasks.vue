<template>
  <div class="page-container tasks-page">
    <div class="tasks-page__header">
      <div class="page-title">Tasks</div>
      <div class="tasks-page__toolbar">
        <div class="tasks-tabs">
          <button v-for="tab in tabs" :key="tab.value" type="button" class="tasks-tabs__btn"
            :class="{ 'tasks-tabs__btn--active': activeTab === tab.value }" @click="setActiveTab(tab.value)">{{ tab.label
            }}</button>
        </div>
        <button
          v-if="shareableSelectedIds.length > 0"
          type="button"
          class="tasks-share-selected"
          @click="openShareDialog()"
        >
          Share selected ({{ shareableSelectedIds.length }})
        </button>
        <div class="tasks-search">
          <input v-model.trim="searchQuery" type="search" class="tasks-search__input" placeholder="Search tasks..."
            aria-label="Search tasks" @keyup.enter="fetchTasks">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="tasks-search__icon">
            <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
            <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5"
              stroke-linecap="round" />
          </svg>
        </div>
      </div>
    </div>

    <div class="page-body tasks-page__body">
      <div class="tasks-table">
        <div class="tasks-table__header tasks-row tasks-row--header">
          <label class="tasks-row__cell tasks-row__cell--check">
            <span class="tasks-row__checkbox"
              :class="{ 'tasks-row__checkbox--checked': allSelected, 'tasks-row__checkbox--indeterminate': someSelected }">
              <svg v-if="allSelected" width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </span>
            <input type="checkbox" class="tasks-row__input" :checked="allSelected" @change="toggleSelectAll">
          </label>
          <button type="button" class="tasks-row__cell tasks-row__cell--id tasks-row__cell--sortable" @click="setSort('id')">
            Task ID
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="tasks-row__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="tasks-row__cell tasks-row__cell--app tasks-row__cell--sortable" @click="setSort('app')">
            App
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="tasks-row__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="tasks-row__cell tasks-row__cell--name tasks-row__cell--sortable" @click="setSort('name')">
            Name
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="tasks-row__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="tasks-row__cell tasks-row__cell--date tasks-row__cell--sortable" @click="setSort('date')">
            Date
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="tasks-row__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="tasks-row__cell tasks-row__cell--status tasks-row__cell--sortable" @click="setSort('status')">
            Status
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="tasks-row__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="tasks-row__cell tasks-row__cell--creator tasks-row__cell--sortable" @click="setSort('creator')">
            Creator
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="tasks-row__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <div class="tasks-row__cell tasks-row__cell--actions"></div>
        </div>

        <div class="scroll-body">
          <task-row v-for="task in paginatedList" :key="task.id" :task="task" :selected="selectedIds.includes(task.id)"
            @toggle-select="toggleSelect" @edit="onEditTask" @delete="onDeleteTask" @share="openShareDialog" @view="onViewTask" />
          <div v-if="loading" class="tasks-empty">
            Loading...
          </div>
          <div v-else-if="paginationTotal === 0" class="tasks-empty">
            No tasks found.
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

    <div v-if="shareDialogVisible" class="tasks-share-modal">
      <div class="tasks-share-modal__backdrop" @click="closeShareDialog"></div>
      <div class="tasks-share-modal__panel">
        <div class="tasks-share-modal__header">
          <div>
            <div class="tasks-share-modal__title">Share tasks</div>
            <div class="tasks-share-modal__subtitle">
              {{ shareTaskIds.length }} task(s) will be shared as read only.
            </div>
          </div>
          <button type="button" class="tasks-share-modal__close" aria-label="Close share dialog" @click="closeShareDialog">×</button>
        </div>

        <div class="tasks-share-modal__search">
          <input
            v-model.trim="shareSearch"
            type="search"
            class="tasks-share-modal__input"
            placeholder="Search users by name or email..."
            aria-label="Search users"
          >
        </div>

        <div class="tasks-share-modal__list">
          <div v-if="shareLoading" class="tasks-share-modal__empty">Loading users...</div>
          <template v-else>
            <button
              v-for="user in shareUsers"
              :key="user.userId"
              type="button"
              class="tasks-share-user"
              :class="{ 'tasks-share-user--selected': selectedShareUserIds.includes(user.userId) }"
              @click="toggleShareUser(user.userId)"
            >
              <img :src="user.avatar" alt="" class="tasks-share-user__avatar" loading="lazy">
              <span class="tasks-share-user__body">
                <span class="tasks-share-user__name">{{ user.name }}</span>
                <span class="tasks-share-user__email">{{ user.email }}</span>
              </span>
              <span class="tasks-share-user__check">
                <svg v-if="selectedShareUserIds.includes(user.userId)" width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
          </template>
          <div v-if="!shareLoading && shareUsers.length === 0" class="tasks-share-modal__empty">No users found.</div>
        </div>

        <div class="tasks-share-modal__footer">
          <button type="button" class="btn-cancel" @click="closeShareDialog">Cancel</button>
          <button type="button" class="btn-confirm" :disabled="shareSubmitting" @click="submitShare">
            {{ shareSubmitting ? 'Sharing...' : 'Share' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TaskRow from './tasks/task-row.vue';
import ListPagination from './parts/list-pagination.vue';
import paginationMixin from '../assets/js/pagination.js';

const tabs = [
  { label: 'ALL', value: 'all' },
  { label: 'Mine', value: 'mine' },
  { label: 'Sharing', value: 'sharing' },
];

export default {
  name: 'tasks',
  components: {
    TaskRow,
    ListPagination,
  },
  mixins: [paginationMixin],
  data() {
    return {
      tabs,
      activeTab: 'all',
      searchQuery: '',
      sortKey: 'id',
      sortDir: 'asc',
      selectedIds: [],
      taskList: [],
      loading: false,
      searchDebounceTimer: null,
      shareDialogVisible: false,
      shareTaskIds: [],
      shareSearch: '',
      shareUsers: [],
      selectedShareUserIds: [],
      shareLoading: false,
      shareSubmitting: false,
      userSearchDebounceTimer: null,
    };
  },
  created() {
    this.applyRouteFilters();
    this.fetchTasks();
  },
  beforeUnmount() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    if (this.userSearchDebounceTimer) {
      clearTimeout(this.userSearchDebounceTimer);
    }
  },
  computed: {
    paginationList() {
      return this.taskList;
    },
    allSelected() {
      return this.paginatedList.length > 0
        && this.paginatedList.every((item) => this.selectedIds.includes(item.id));
    },
    someSelected() {
      return !this.allSelected
        && this.paginatedList.some((item) => this.selectedIds.includes(item.id));
    },
    shareableSelectedIds() {
      const mineIds = new Set(this.taskList.filter((task) => task.isMine).map((task) => task.id));
      return this.selectedIds.filter((id) => mineIds.has(id));
    },
  },
  watch: {
    activeTab() {
      this.fetchTasks();
    },
    searchQuery() {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      this.searchDebounceTimer = setTimeout(() => {
        this.fetchTasks();
      }, 300);
    },
    shareSearch() {
      if (!this.shareDialogVisible) {
        return;
      }

      if (this.userSearchDebounceTimer) {
        clearTimeout(this.userSearchDebounceTimer);
      }
      this.userSearchDebounceTimer = setTimeout(() => {
        this.fetchShareUsers();
      }, 300);
    },
    taskList(list) {
      const ids = new Set(list.map((item) => item.id));
      this.selectedIds = this.selectedIds.filter((id) => ids.has(id));
    },
    '$route.query'() {
      this.applyRouteFilters();
      this.fetchTasks();
    },
  },
  methods: {
    handleAuthStatus(status) {
      if (status === 2) {
        this.$router.replace('/signin');
        return true;
      }
      return false;
    },
    applyRouteFilters() {
      const scope = this.$route.query.scope;
      if (['all', 'mine', 'sharing'].includes(scope)) {
        this.activeTab = scope;
      }
    },
    async fetchTasks() {
      this.loading = true;
      try {
        const sharedByUserId = this.activeTab === 'sharing' ? this.$route.query.sharedByUserId : '';
        const sharedWithUserId = this.activeTab === 'mine' ? this.$route.query.sharedWithUserId : '';
        const res = await axios.post('tasks/list', {
          scope: this.activeTab,
          sortKey: this.sortKey,
          sortDir: this.sortDir,
          ...(sharedByUserId ? { sharedByUserId } : {}),
          ...(sharedWithUserId ? { sharedWithUserId } : {}),
          ...(this.searchQuery ? { search: this.searchQuery } : {}),
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          const tasks = data.options?.tasks ?? [];
          this.taskList = Array.isArray(tasks) ? tasks : [];
        }
      } catch (e) {
        // keep current list on network error
      } finally {
        this.loading = false;
      }
    },
    setActiveTab(value) {
      this.activeTab = value;
      if (this.$route.query.scope || this.$route.query.sharedByUserId || this.$route.query.sharedWithUserId) {
        this.$router.replace({ path: '/tasks' });
      }
    },
    setSort(key) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortDir = 'asc';
      }
      this.resetPagination();
      this.fetchTasks();
    },
    toggleSelect(id) {
      if (this.selectedIds.includes(id)) {
        this.selectedIds = this.selectedIds.filter((item) => item !== id);
        return;
      }
      this.selectedIds = [...this.selectedIds, id];
    },
    toggleSelectAll() {
      if (this.allSelected) {
        const visible = new Set(this.paginatedList.map((item) => item.id));
        this.selectedIds = this.selectedIds.filter((id) => !visible.has(id));
        return;
      }
      const merged = new Set([
        ...this.selectedIds,
        ...this.paginatedList.map((item) => item.id),
      ]);
      this.selectedIds = [...merged];
    },
    onViewTask(task) {
      this.$router.push(`/tasks/${task.id}`);
    },
    async fetchShareUsers() {
      this.shareLoading = true;
      try {
        const res = await axios.post('sharing/users', {
          ...(this.shareSearch ? { search: this.shareSearch } : {}),
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        this.shareUsers = data.status === 1 && Array.isArray(data.options?.users)
          ? data.options.users
          : [];
      } catch (e) {
        this.shareUsers = [];
      } finally {
        this.shareLoading = false;
      }
    },
    openShareDialog(task) {
      const taskIds = task?.id ? [task.id] : this.shareableSelectedIds;

      if (task && !task.isMine) {
        Swal.fire({ icon: 'info', text: 'Shared tasks are read only and cannot be shared again.' });
        return;
      }

      if (taskIds.length === 0) {
        Swal.fire({ icon: 'info', text: 'Select at least one of your own tasks to share.' });
        return;
      }

      this.shareTaskIds = taskIds;
      this.selectedShareUserIds = [];
      this.shareSearch = '';
      this.shareDialogVisible = true;
      this.fetchShareUsers();
    },
    closeShareDialog() {
      if (this.shareSubmitting) {
        return;
      }

      this.shareDialogVisible = false;
      this.shareTaskIds = [];
      this.selectedShareUserIds = [];
      this.shareUsers = [];
      this.shareSearch = '';
    },
    toggleShareUser(userId) {
      if (this.selectedShareUserIds.includes(userId)) {
        this.selectedShareUserIds = this.selectedShareUserIds.filter((id) => id !== userId);
        return;
      }

      this.selectedShareUserIds = [...this.selectedShareUserIds, userId];
    },
    async submitShare() {
      if (this.selectedShareUserIds.length === 0) {
        Swal.fire({ icon: 'info', text: 'Select at least one user to share with.' });
        return;
      }

      this.shareSubmitting = true;
      try {
        const res = await axios.post('tasks/share', {
          taskIds: this.shareTaskIds,
          userIds: this.selectedShareUserIds,
          permission: 'read',
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.shareSubmitting = false;
          this.closeShareDialog();
          this.fetchTasks();
          Swal.fire({ icon: 'success', text: 'Task shared successfully.' });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to share task.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.shareSubmitting = false;
      }
    },
    async onEditTask(task) {
      if (!task.isMine) {
        Swal.fire({ icon: 'info', text: 'Shared tasks are read only.' });
        return;
      }

      const result = await Swal.fire({
        title: 'Rename task',
        input: 'text',
        inputValue: task.name,
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return 'Name is required';
          }
        },
      });

      if (!result.isConfirmed) return;

      try {
        const res = await axios.post('tasks/update', {
          id: Number(task.id),
          name: result.value.trim(),
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1 && data.options?.task) {
          const index = this.taskList.findIndex((item) => item.id === task.id);
          if (index !== -1) {
            this.taskList.splice(index, 1, data.options.task);
          }
          return;
        }
        Swal.fire({ icon: 'error', text: 'Failed to update task.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      }
    },
    onDeleteTask(task) {
      if (!task.isMine) {
        Swal.fire({ icon: 'info', text: 'Shared tasks are read only.' });
        return;
      }

      Swal.fire({
        title: 'Delete task?',
        text: `Task #${task.id} will be removed.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;

        try {
          const res = await axios.post('tasks/delete', { ids: [Number(task.id)] });
          const data = res.data || {};
          if (this.handleAuthStatus(data.status)) return;
          if (data.status === 1) {
            this.taskList = this.taskList.filter((item) => item.id !== task.id);
            this.selectedIds = this.selectedIds.filter((id) => id !== task.id);
            return;
          }
          Swal.fire({ icon: 'error', text: 'Failed to delete task.' });
        } catch (e) {
          Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
        }
      });
    },
  },
};
</script>
