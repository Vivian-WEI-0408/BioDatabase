<template>
  <div class="dataset-browse-page">
    <dataset-browse-filter
      :groups="browse.filterGroups"
      :model-value="filters"
      @update:model-value="filters = $event"
    />
    <div class="dataset-browse-main">
      <dataset-browse-header
        :browse-label="browse.browseLabel"
        @back="onBack"
      />
      <div class="dataset-browse-schematic-wrap">
        <img src="/images/categories/badge.png" alt="badge" class="dataset-browse-schematic-badge">
      </div>
      <div class="dataset-browse-table-wrap list-panel">
        <div class="dataset-browse-toolbar">
          <div class="dataset-browse-actions">
            <a class="btn btn-primary" @click="openUploadMapModal">Upload Map</a>
            <a
              v-if="canManageRows"
              class="btn btn-outline"
              @click="openBatchUploadModal"
            >Batch Upload</a>
          </div>
          <div class="dataset-browse-search">
            <input
              v-model.trim="searchQuery"
              type="search"
              class="dataset-browse-search__input"
              placeholder="Search name or alias..."
              aria-label="Search dataset rows"
              @keyup.enter="submitSearch"
            >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="dataset-browse-search__icon">
              <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
              <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
        </div>
        <dataset-browse-table
          :rows="paginatedList"
          :columns="columns"
          :selected-ids="selectedIds"
          :all-selected="allSelected"
          :some-selected="someSelected"
          :show-actions="true"
          :show-edit-action="canManageRows"
          :show-delete-action="canDeleteRows"
          @set-sort="setSort"
          @toggle-select="toggleSelect"
          @toggle-select-all="toggleSelectAll"
          @view-row="onViewRow"
          @edit-row="onEditRow"
          @delete-row="onDeleteRow"
        />
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

    <van-popup
      v-model:show="showUploadMapModal"
      v-if="showUploadMapModal"
      :close-on-click-overlay="false"
    >
      <dataset-upload-modal
        :show="showUploadMapModal"
        :dataset-type="datasetType"
        :upload-state="uploadState"
        @close="closeUploadMapModal"
        @submit="onUploadMapSubmit"
      />
    </van-popup>

    <van-popup
      v-model:show="showBatchUploadModal"
      v-if="showBatchUploadModal"
      :close-on-click-overlay="false"
    >
      <dataset-batch-upload-modal
        :show="showBatchUploadModal"
        :upload-state="uploadState"
        @close="closeBatchUploadModal"
        @submit="onBatchUploadSubmit"
      />
    </van-popup>
  </div>
</template>

<script>
import DatasetBrowseFilter from './dataset-browse/dataset-browse-filter.vue';
import DatasetBrowseHeader from './dataset-browse/dataset-browse-header.vue';
import DatasetBrowseTable from './dataset-browse/dataset-browse-table.vue';
import DatasetUploadModal from './dataset-browse/dataset-upload-modal.vue';
import DatasetBatchUploadModal from './dataset-browse/dataset-batch-upload-modal.vue';
import ListPagination from './parts/list-pagination.vue';
import paginationMixin from '../assets/js/pagination.js';
import { getDatasetBrowse } from '../data/dataset-browse-mock.js';
import { datasets } from '../data/datasets-mock.js';

const API_DEFAULT_FILTERS = {
  part: { type: [], enzyme: [], scar: [] },
  backbone: { ori: [], marker: [], enzyme: [], scar: [] },
  plasmid: { ori: [], marker: [], enzyme: [], scar: [] },
};

const BROWSE_LABELS = {
  part: 'Parts',
  backbone: 'Backbones',
  plasmid: 'Plasmids',
};

function normalizeDatasetType(value) {
  const normalized = String(value || 'part').trim().toLowerCase();
  if (normalized === 'backbone' || normalized === 'plasmid') {
    return normalized;
  }
  return 'part';
}

function buildInitialState(route) {
  const datasetId = route.params.id;
  const query = route.query || {};
  const datasetType = normalizeDatasetType(query.datasetType);
  const dataset = datasets.find((item) => item.id === datasetId);
  const mockBrowse = getDatasetBrowse(datasetId, dataset?.title);
  const hasBrowseQuery = Boolean(query.datasetType || query.type);
  const apiDefaults = API_DEFAULT_FILTERS[datasetType] || API_DEFAULT_FILTERS.part;

  const filters = hasBrowseQuery
    ? { ...apiDefaults }
    : { ...mockBrowse.defaultFilters };

  const typeQuery = query.type;
  if (typeQuery && Object.prototype.hasOwnProperty.call(filters, 'type')) {
    const typeValue = Array.isArray(typeQuery) ? typeQuery[0] : typeQuery;
    if (typeValue) {
      filters.type = [String(typeValue)];
    }
  }

  const browse = hasBrowseQuery
    ? {
      filterGroups: [],
      browseLabel: BROWSE_LABELS[datasetType] || mockBrowse.browseLabel,
      defaultFilters: { ...apiDefaults },
    }
    : mockBrowse;

  return {
    datasetType,
    browse,
    filters,
  };
}

export default {
  name: 'dataset-browse',
  components: {
    DatasetBrowseFilter,
    DatasetBrowseHeader,
    DatasetBrowseTable,
    DatasetUploadModal,
    DatasetBatchUploadModal,
    ListPagination,
  },
  mixins: [paginationMixin],
  data() {
    const initial = buildInitialState(this.$route);
    return {
      datasetType: initial.datasetType,
      browse: initial.browse,
      filters: initial.filters,
      sortKey: 'name',
      sortDir: 'asc',
      selectedIds: [],
      rowList: [],
      columns: [],
      serverPagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        pageSize: 10,
      },
      loading: false,
      showUploadMapModal: false,
      showBatchUploadModal: false,
      uploadPollTimerId: null,
      uploadState: {
        submitting: false,
        polling: false,
        taskId: null,
        status: '',
        progress: 0,
        message: '',
        errorMsg: '',
        uploadKind: '',
      },
      searchQuery: '',
      searchDebounceTimer: null,
    };
  },
  created() {
    this.fetchRows();
  },
  beforeUnmount() {
    this.stopUploadPolling();
    this.clearSearchDebounce();
  },
  computed: {
    paginatedList() {
      return this.rowList;
    },
    totalPages() {
      const pages = Number(this.serverPagination.totalPages) || 0;
      return Math.max(1, pages);
    },
    paginationTotal() {
      return Number(this.serverPagination.totalCount) || 0;
    },
    allSelected() {
      return this.paginatedList.length > 0
        && this.paginatedList.every((item) => this.selectedIds.includes(item.id));
    },
    someSelected() {
      return !this.allSelected
        && this.paginatedList.some((item) => this.selectedIds.includes(item.id));
    },
    canManageRows() {
      const role = Number(G.U?.role || 0);
      return role === 1 || role >= 9;
    },
    canDeleteRows() {
      return this.canManageRows;
    },
  },
  watch: {
    rowList(list) {
      const ids = new Set(list.map((item) => item.id));
      this.selectedIds = this.selectedIds.filter((id) => ids.has(id));
    },
    filters: {
      deep: true,
      handler() {
        this.onQueryChange();
      },
    },
    searchQuery() {
      this.clearSearchDebounce();
      this.searchDebounceTimer = setTimeout(() => {
        this.onQueryChange();
      }, 300);
    },
    currentPage(page, previousPage) {
      if (page === previousPage) {
        return;
      }
      this.fetchRows();
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
    applyBrowsePayload(payload) {
      if (!payload || typeof payload !== 'object') {
        return;
      }
      this.browse = {
        ...this.browse,
        filterGroups: payload.filterGroups || this.browse.filterGroups,
        browseLabel: payload.browseLabel || this.browse.browseLabel,
        defaultFilters: payload.defaultFilters || this.browse.defaultFilters,
      };
      if (Array.isArray(payload.columns)) {
        this.columns = payload.columns;
      }
      if (payload.pagination && typeof payload.pagination === 'object') {
        this.serverPagination = { ...payload.pagination };
      }
    },
    onQueryChange() {
      const wasOnFirstPage = this.currentPage === 1;
      this.resetPagination();
      if (wasOnFirstPage) {
        this.fetchRows();
      }
    },
    clearSearchDebounce() {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = null;
      }
    },
    submitSearch() {
      this.clearSearchDebounce();
      this.onQueryChange();
    },
    buildBrowseReturnQuery() {
      const query = { datasetType: this.datasetType };
      const type = this.$route.query?.type;
      if (type) {
        query.type = Array.isArray(type) ? type[0] : type;
      }
      return query;
    },
    async fetchRows() {
      this.loading = true;
      try {
        const res = await axios.post('datasets/browse/rows', {
          datasetType: this.datasetType,
          sortKey: this.sortKey,
          sortDir: this.sortDir,
          filters: this.filters,
          search: this.searchQuery,
          page: this.currentPage,
          pageSize: this.pageSize,
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          const payload = data.options || {};
          this.applyBrowsePayload(payload);
          const rows = payload.rows ?? [];
          this.rowList = Array.isArray(rows) ? rows : [];
        }
      } catch (e) {
        // keep current list on network error
      } finally {
        this.loading = false;
      }
    },
    onBack() {
      if (this.$route.query?.datasetType) {
        this.$router.push({ name: 'datasets-categories' });
        return;
      }
      this.$router.push({ name: 'datasets' });
    },
    setSort(key) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortDir = 'asc';
      }
      this.onQueryChange();
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
    onViewRow(row) {
      this.$router.push({
        name: 'dataset-item-detail',
        params: {
          datasetType: this.datasetType,
          id: row.id,
        },
        query: this.buildBrowseReturnQuery(),
      });
    },
    onEditRow(row) {
      if (!this.canManageRows) {
        alert('You do not have permission to edit records.');
        return;
      }
      this.$router.push({
        name: 'dataset-item-edit',
        params: {
          datasetType: this.datasetType,
          id: row.id,
        },
        query: this.buildBrowseReturnQuery(),
      });
    },
    createInitialUploadState() {
      return {
        submitting: false,
        polling: false,
        taskId: null,
        status: '',
        progress: 0,
        message: '',
        errorMsg: '',
      };
    },
    resetUploadState() {
      this.uploadState = this.createInitialUploadState();
    },
    openUploadMapModal() {
      this.stopUploadPolling();
      this.resetUploadState();
      this.showUploadMapModal = true;
    },
    openBatchUploadModal() {
      if (!this.canManageRows) {
        alert('You do not have permission to batch upload.');
        return;
      }
      this.stopUploadPolling();
      this.resetUploadState();
      this.showBatchUploadModal = true;
    },
    closeUploadMapModal() {
      if (this.uploadState.submitting) {
        return;
      }
      this.showUploadMapModal = false;
      this.resetUploadState();
    },
    closeBatchUploadModal() {
      if (this.uploadState.submitting || this.uploadState.polling) {
        return;
      }
      this.showBatchUploadModal = false;
      this.resetUploadState();
    },
    extractUploadError(data, fallbackMsg) {
      const options = data?.options || {};
      if (options.errorMsg) {
        return options.errorMsg;
      }
      const result = options.result;
      if (result?.errors?.[0]) {
        return Array.isArray(result.errors)
          ? result.errors.slice(0, 5).join('\n')
          : result.errors[0];
      }
      if (typeof result === 'string' && result.trim()) {
        return result;
      }
      return data?.msg || fallbackMsg || 'Upload failed';
    },
    applyUploadStatusPayload(payload) {
      if (!payload || typeof payload !== 'object') {
        return;
      }
      this.uploadState = {
        ...this.uploadState,
        polling: true,
        taskId: payload.taskId ?? this.uploadState.taskId,
        status: payload.status || this.uploadState.status,
        progress: payload.progress ?? this.uploadState.progress,
        message: payload.message || '',
        errorMsg: payload.errorMsg || '',
      };
    },
    stopUploadPolling() {
      if (this.uploadPollTimerId) {
        clearInterval(this.uploadPollTimerId);
        this.uploadPollTimerId = null;
      }
    },
    startUploadPolling(taskId, uploadKind) {
      this.stopUploadPolling();
      this.uploadState = {
        ...this.uploadState,
        submitting: false,
        polling: true,
        taskId,
        status: 'pending',
        progress: 0,
        message: 'Upload task created',
        errorMsg: '',
        uploadKind,
      };

      const poll = async () => {
        try {
          const res = await axios.post('datasets/browse/upload-status', { taskId });
          const data = res.data || {};
          if (this.handleAuthStatus(data.status)) {
            this.stopUploadPolling();
            this.uploadState.polling = false;
            return;
          }
          if (data.status !== 1) {
            this.stopUploadPolling();
            this.uploadState = {
              ...this.uploadState,
              polling: false,
              status: 'failed',
              errorMsg: data.msg || 'Failed to load upload status',
            };
            return;
          }

          const payload = data.options || {};
          this.applyUploadStatusPayload(payload);

          const normalizedStatus = String(payload.status || '').toLowerCase();
          if (normalizedStatus === 'completed') {
            this.stopUploadPolling();
            this.uploadState.polling = false;
            this.uploadState.status = 'completed';
            alert(payload.message || 'Upload completed successfully.');
            if (this.uploadState.uploadKind === 'map') this.showUploadMapModal = false;
            if (this.uploadState.uploadKind === 'batch') this.showBatchUploadModal = false;
            this.resetUploadState();
            await this.fetchRows();
            return;
          }

          if (normalizedStatus === 'failed') {
            this.stopUploadPolling();
            this.uploadState = {
              ...this.uploadState,
              polling: false,
              status: 'failed',
              errorMsg: this.extractUploadError(data, 'Upload failed'),
            };
          }
        } catch (e) {
          this.stopUploadPolling();
          this.uploadState = {
            ...this.uploadState,
            polling: false,
            status: 'failed',
            errorMsg: 'Failed to load upload status',
          };
        }
      };

      poll();
      this.uploadPollTimerId = setInterval(poll, 2000);
    },
    async onUploadMapSubmit(payload) {
      await this.uploadMap(payload);
    },
    async onBatchUploadSubmit(payload) {
      await this.uploadBatch(payload);
    },
    async uploadMap({ files, datasetType, saveFeature, conflictPolicy = '' }) {
      if (this.uploadState.submitting || this.uploadState.polling) {
        return;
      }

      this.uploadState = {
        ...this.createInitialUploadState(),
        submitting: true,
        status: 'running',
        message: 'Processing…',
      };

      const formData = new FormData();
      (files || []).forEach((file) => {
        formData.append('files', file);
      });
      formData.append('datasetType', datasetType || this.datasetType);
      formData.append('saveFeature', saveFeature ? 'true' : 'false');
      if (conflictPolicy) formData.append('conflictPolicy', conflictPolicy);

      try {
        const res = await axios.post('datasets/browse/upload-map', formData);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) {
          this.resetUploadState();
          return;
        }
        if (data.status !== 1) {
          this.uploadState = {
            ...this.createInitialUploadState(),
            status: 'failed',
            errorMsg: data.msg || 'Failed to create upload task',
          };
          return;
        }
        if (data.options?.requiresConfirmation) {
          const conflicts = data.options.conflicts || [];
          const choice = await Swal.fire({ title: '发现重名记录', text: `${conflicts.join(', ')}。请选择如何处理重名记录，新记录仍会继续上传。`, showDenyButton: true, confirmButtonText: '全部更新', denyButtonText: '全部跳过', allowOutsideClick: false, allowEscapeKey: false });
          const updateAll = choice.isConfirmed;
          this.resetUploadState();
          await this.uploadMap({ files, datasetType, saveFeature, conflictPolicy: updateAll ? 'update' : 'skip' });
          return;
        }
        const taskId = data.options?.taskId;
        if (!taskId) throw new Error('Upload task was not created');
        this.startUploadPolling(taskId, 'map');
      } catch (e) {
        const responseData = e?.response?.data;
        const message = responseData?.msg
          || e?.message
          || 'Failed to upload map files';
        this.uploadState = {
          ...this.createInitialUploadState(),
          status: 'failed',
          errorMsg: message,
        };
      }
    },
    async uploadBatch({ file, conflictPolicy = '' }) {
      if (this.uploadState.submitting || this.uploadState.polling) {
        return;
      }
      if (!this.canManageRows) {
        alert('You do not have permission to batch upload.');
        return;
      }

      this.uploadState = {
        ...this.createInitialUploadState(),
        submitting: true,
        message: 'Starting upload…',
      };

      const formData = new FormData();
      formData.append('file', file);
      if (conflictPolicy) formData.append('conflictPolicy', conflictPolicy);

      try {
        const res = await axios.post('datasets/browse/upload-batch', formData);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) {
          this.resetUploadState();
          return;
        }
        if (data.status !== 1) {
          this.uploadState = {
            ...this.createInitialUploadState(),
            errorMsg: data.msg || 'Failed to create upload task',
          };
          return;
        }

        if (data.options?.requiresConfirmation) {
          const conflicts = data.options.conflicts || [];
          const choice = await Swal.fire({ title: '发现重名记录', text: `${conflicts.join(', ')}。请选择如何处理重名记录，新记录仍会继续上传。`, showDenyButton: true, confirmButtonText: '全部更新', denyButtonText: '全部跳过', allowOutsideClick: false, allowEscapeKey: false });
          const updateAll = choice.isConfirmed;
          this.resetUploadState();
          await this.uploadBatch({ file, conflictPolicy: updateAll ? 'update' : 'skip' });
          return;
        }

        const taskId = data.options?.taskId;
        if (!taskId) {
          this.uploadState = {
            ...this.createInitialUploadState(),
            errorMsg: 'Upload task was not created',
          };
          return;
        }

        this.startUploadPolling(taskId, 'batch');
      } catch (e) {
        this.uploadState = {
          ...this.createInitialUploadState(),
          errorMsg: 'Failed to create upload task',
        };
      }
    },
    async onDeleteRow(row) {
      if (!this.canDeleteRows) {
        alert('You do not have permission to delete records.');
        return;
      }
      const label = row?.name || `#${row?.id}`;
      if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
        return;
      }

      try {
        const res = await axios.post('datasets/browse/delete', {
          datasetType: this.datasetType,
          id: row.id,
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status !== 1) {
          alert(data.msg || 'Failed to delete record.');
          return;
        }

        const wasLastOnPage = this.rowList.length <= 1;
        if (wasLastOnPage && this.currentPage > 1) {
          this.setPage(this.currentPage - 1);
          return;
        }
        await this.fetchRows();
      } catch (e) {
        alert('Failed to delete record.');
      }
    },
  },
};
</script>
