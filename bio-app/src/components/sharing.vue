<template>
  <div class="page-container sharing-page">
    <div class="sharing-page__header">
      <div class="page-title">Sharing</div>
      <div class="sharing-page__tabs-wrap">
        <div class="sharing-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="sharing-tabs__btn"
            :class="{ 'sharing-tabs__btn--active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >{{ tab.label }}</button>
        </div>
      </div>
      <div class="sharing-page__search-wrap">
        <div class="sharing-search">
          <input
            v-model.trim="searchQuery"
            type="search"
            class="sharing-search__input"
            placeholder="Search..."
            aria-label="Search sharing"
          >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="sharing-search__icon">
            <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
            <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
      </div>
    </div>

    <div class="page-body sharing-page__body">
      <div class="list-panel">
        <div class="scroll-body sharing-grid">
          <share-card
            v-for="item in paginatedList"
            :key="item.id"
            :share-id="item.id"
            :name="item.name"
            :role="item.role"
            :avatar="item.avatar"
            :status="item.status"
            :task-count="item.taskCount"
            :dataset-count="item.datasetCount"
            :show-delete="activeTab === 'fromMe'"
            @delete="onDeleteShare"
            @view="onViewShare"
          />
          <div v-if="loading" class="sharing-empty">Loading...</div>
          <div v-else-if="paginationTotal === 0" class="sharing-empty">No sharing found.</div>
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
import ShareCard from './sharing/share-card.vue';
import ListPagination from './parts/list-pagination.vue';
import paginationMixin from '../assets/js/pagination.js';

const tabs = [
  { label: 'To Me', value: 'toMe' },
  { label: 'From Me', value: 'fromMe' },
];

export default {
  name: 'sharing',
  components: {
    ShareCard,
    ListPagination,
  },
  mixins: [paginationMixin],
  data() {
    return {
      tabs,
      activeTab: 'fromMe',
      searchQuery: '',
      toMeList: [],
      fromMeList: [],
      pageSize: 12,
      loading: false,
      searchDebounceTimer: null,
    };
  },
  created() {
    this.fetchSharing();
  },
  beforeUnmount() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  },
  computed: {
    currentList() {
      return this.activeTab === 'toMe' ? this.toMeList : this.fromMeList;
    },
    visibleShares() {
      return this.currentList;
    },
    paginationList() {
      return this.visibleShares;
    },
  },
  watch: {
    activeTab() {
      this.resetPagination();
    },
    searchQuery() {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      this.searchDebounceTimer = setTimeout(() => {
        this.fetchSharing();
      }, 300);
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
    async fetchSharing() {
      this.loading = true;
      try {
        const res = await axios.post('sharing/list', {
          ...(this.searchQuery ? { search: this.searchQuery } : {}),
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.toMeList = Array.isArray(data.options?.toMe) ? data.options.toMe : [];
          this.fromMeList = Array.isArray(data.options?.fromMe) ? data.options.fromMe : [];
          this.resetPagination();
        }
      } catch (e) {
        // keep current cards on network error
      } finally {
        this.loading = false;
      }
    },
    async onDeleteShare(id) {
      try {
        const res = await axios.post('sharing/unshare', {
          userIds: [Number(id)],
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.fromMeList = this.fromMeList.filter((item) => item.id !== id);
          return;
        }
        Swal.fire({ icon: 'error', text: 'Failed to remove sharing.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      }
    },
    onViewShare(id) {
      const query = this.activeTab === 'toMe'
        ? { scope: 'sharing', sharedByUserId: id }
        : { scope: 'mine', sharedWithUserId: id };
      this.$router.push({ path: '/tasks', query });
    },
  },
};
</script>
