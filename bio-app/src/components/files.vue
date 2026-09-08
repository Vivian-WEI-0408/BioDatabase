<template>
  <div class="page-container user-files-page">
    <div class="user-files-page__header">
      <div>
        <div class="page-title">My Files</div>
        <div class="user-files-page__subtitle">Upload, search, filter, download and delete your files.</div>
      </div>
      <div class="user-files-page__actions">
        <button type="button" class="btn btn-outline" :disabled="loading" @click="fetchFiles">Refresh</button>
        <button type="button" class="btn btn-primary" :disabled="uploading" @click="openFilePicker">
          {{ uploading ? 'Uploading...' : 'Upload Files' }}
        </button>
        <input
          ref="fileInput"
          type="file"
          class="user-files-page__file-input"
          multiple
          :accept="acceptTypes"
          @change="onFileChange"
        >
      </div>
    </div>

    <div class="user-files-page__quota">
      <div class="user-files-page__quota-main">
        <div class="user-files-page__quota-label">Workspace Storage</div>
        <div class="user-files-page__quota-value">
          {{ quota.usedMB.toLocaleString() }} MB / {{ quota.totalMB.toLocaleString() }} MB
        </div>
      </div>
      <div class="user-files-page__quota-bar">
        <div class="user-files-page__quota-fill" :style="{ width: quotaPercent + '%' }"></div>
      </div>
      <div class="user-files-page__quota-note">{{ quota.availableMB.toLocaleString() }} MB available</div>
    </div>

    <div class="user-files-page__toolbar">
      <div class="datasets-search user-files-page__search">
        <input
          v-model.trim="keyword"
          type="search"
          class="datasets-search__input"
          placeholder="Search files..."
          aria-label="Search files"
          @keyup.enter="fetchFiles"
        >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="datasets-search__icon">
          <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
          <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>

      <select v-model="activeType" class="user-files-page__select" aria-label="Filter files by type">
        <option v-for="item in typeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>

      <button
        type="button"
        class="btn btn-danger user-files-page__bulk-btn"
        :disabled="selectedIds.length === 0 || deleting"
        @click="confirmDeleteSelected"
      >
        Delete Selected<span v-if="selectedIds.length"> ({{ selectedIds.length }})</span>
      </button>
    </div>

    <div class="page-body user-files-page__body">
      <div class="list-panel user-files-table-wrap">
        <div class="user-files-table">
          <div class="user-files-row user-files-row--header">
            <label class="user-files-row__cell user-files-row__cell--check">
              <span
                class="user-files-row__checkbox"
                :class="{
                  'user-files-row__checkbox--checked': allSelected,
                  'user-files-row__checkbox--indeterminate': someSelected,
                }"
              >
                <svg v-if="allSelected" width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <input type="checkbox" class="user-files-row__input" :checked="allSelected" @change="toggleSelectAll">
            </label>
            <button type="button" class="user-files-row__cell user-files-row__cell--name user-files-row__cell--sortable" @click="setSort('name')">
              File Name
            </button>
            <button type="button" class="user-files-row__cell user-files-row__cell--type user-files-row__cell--sortable" @click="setSort('category')">
              Type
            </button>
            <button type="button" class="user-files-row__cell user-files-row__cell--size user-files-row__cell--sortable" @click="setSort('size')">
              Size
            </button>
            <button type="button" class="user-files-row__cell user-files-row__cell--date user-files-row__cell--sortable" @click="setSort('createdAt')">
              Uploaded
            </button>
            <div class="user-files-row__cell user-files-row__cell--actions">Actions</div>
          </div>

          <div class="scroll-body user-files-table__body">
            <div v-for="file in fileList" :key="file.id" class="user-files-row">
              <label class="user-files-row__cell user-files-row__cell--check">
                <span class="user-files-row__checkbox" :class="{ 'user-files-row__checkbox--checked': selectedIds.includes(file.id) }">
                  <svg v-if="selectedIds.includes(file.id)" width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <input type="checkbox" class="user-files-row__input" :checked="selectedIds.includes(file.id)" @change="toggleSelect(file.id)">
              </label>
              <div class="user-files-row__cell user-files-row__cell--name">
                <div class="user-files-row__name">{{ file.originalName }}</div>
                <div class="user-files-row__meta">{{ file.extension || 'unknown' }} · {{ file.mimeType || 'unknown type' }}</div>
              </div>
              <div class="user-files-row__cell user-files-row__cell--type">
                <span class="user-files-row__badge">{{ formatCategory(file.category) }}</span>
              </div>
              <div class="user-files-row__cell user-files-row__cell--size">{{ formatSize(file.sizeBytes) }}</div>
              <div class="user-files-row__cell user-files-row__cell--date">{{ formatDate(file.createdAt) }}</div>
              <div class="user-files-row__cell user-files-row__cell--actions">
                <button type="button" class="user-files-row__action-btn" @click="downloadFile(file)">Download</button>
                <button type="button" class="user-files-row__action-btn user-files-row__action-btn--danger" @click="confirmDelete([file.id], file.originalName)">Delete</button>
              </div>
            </div>
            <div v-if="loading" class="user-files-empty">Loading...</div>
            <div v-else-if="paginationTotal === 0" class="user-files-empty">No files found.</div>
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
import ListPagination from './parts/list-pagination.vue';

const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'Documents', value: 'document' },
  { label: 'Spreadsheets', value: 'spreadsheet' },
  { label: 'Bio Data', value: 'bio-data' },
  { label: 'Data', value: 'data' },
];

const acceptTypes = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.md',
  '.csv',
  '.tsv',
  '.xls',
  '.xlsx',
  '.fa',
  '.fasta',
  '.gb',
  '.gbk',
  '.json',
].join(',');

export default {
  name: 'files',
  components: {
    ListPagination,
  },
  data() {
    return {
      acceptTypes,
      typeOptions,
      keyword: '',
      activeType: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      fileList: [],
      selectedIds: [],
      loading: false,
      uploading: false,
      deleting: false,
      searchDebounceTimer: null,
      currentPage: 1,
      pageSize: 10,
      pageInput: '1',
      serverPagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        pageSize: 10,
      },
      quota: {
        usedMB: 0,
        totalMB: 1024,
        availableMB: 1024,
        usedPercent: 0,
      },
    };
  },
  computed: {
    totalPages() {
      return Math.max(1, Number(this.serverPagination.totalPages) || 1);
    },
    paginationTotal() {
      return Number(this.serverPagination.totalCount) || 0;
    },
    quotaPercent() {
      return Math.min(100, Math.max(0, Number(this.quota.usedPercent) || 0));
    },
    allSelected() {
      return this.fileList.length > 0
        && this.fileList.every((item) => this.selectedIds.includes(item.id));
    },
    someSelected() {
      return !this.allSelected
        && this.fileList.some((item) => this.selectedIds.includes(item.id));
    },
  },
  watch: {
    keyword() {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      this.searchDebounceTimer = setTimeout(() => {
        this.currentPage = 1;
        this.fetchFiles();
      }, 300);
    },
    activeType() {
      this.currentPage = 1;
      this.fetchFiles();
    },
    currentPage(page) {
      this.pageInput = String(page);
    },
    fileList(list) {
      const visibleIds = new Set(list.map((item) => item.id));
      this.selectedIds = this.selectedIds.filter((id) => visibleIds.has(id));
    },
  },
  created() {
    this.fetchFiles();
  },
  beforeUnmount() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  },
  methods: {
    handleAuthStatus(status) {
      if (status === 2) {
        this.$router.replace('/signin');
        return true;
      }
      return false;
    },
    async fetchFiles() {
      this.loading = true;
      try {
        const res = await axios.post('files/list', {
          page: this.currentPage,
          pageSize: this.pageSize,
          keyword: this.keyword,
          type: this.activeType,
          sortBy: this.sortBy,
          sortOrder: this.sortOrder,
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.fileList = Array.isArray(data.options?.files) ? data.options.files : [];
          this.serverPagination = {
            ...this.serverPagination,
            ...(data.options?.pagination || {}),
          };
          this.quota = {
            ...this.quota,
            ...(data.options?.quota || {}),
          };
          this.currentPage = Number(this.serverPagination.currentPage) || this.currentPage;
        } else {
          Swal.fire({ icon: 'error', text: data.msg || 'Failed to load files.' });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.loading = false;
      }
    },
    setSort(key) {
      if (this.sortBy === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortBy = key;
        this.sortOrder = key === 'createdAt' ? 'desc' : 'asc';
      }
      this.currentPage = 1;
      this.fetchFiles();
    },
    setPage(page) {
      const nextPage = Math.min(Math.max(1, Number(page) || 1), this.totalPages);
      if (nextPage === this.currentPage) {
        this.fetchFiles();
        return;
      }
      this.currentPage = nextPage;
      this.fetchFiles();
    },
    prevPage() {
      this.setPage(this.currentPage - 1);
    },
    nextPage() {
      this.setPage(this.currentPage + 1);
    },
    submitPageJump() {
      this.setPage(Number.parseInt(this.pageInput, 10));
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
        const visibleIds = new Set(this.fileList.map((item) => item.id));
        this.selectedIds = this.selectedIds.filter((id) => !visibleIds.has(id));
        return;
      }
      this.selectedIds = Array.from(new Set([
        ...this.selectedIds,
        ...this.fileList.map((item) => item.id),
      ]));
    },
    openFilePicker() {
      this.$refs.fileInput?.click();
    },
    async onFileChange(event) {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length === 0) {
        return;
      }

      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      this.uploading = true;
      try {
        const res = await axios.post('files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          Swal.fire({ icon: 'success', text: 'Files uploaded successfully.', timer: 1800, showConfirmButton: false });
          this.currentPage = 1;
          await this.fetchFiles();
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Upload failed.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.uploading = false;
      }
    },
    async downloadFile(file) {
      try {
        const res = await axios.get(`files/download/${file.id}`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName || 'download';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Download failed.' });
      }
    },
    confirmDeleteSelected() {
      this.confirmDelete(this.selectedIds, `${this.selectedIds.length} selected file(s)`);
    },
    confirmDelete(ids, label) {
      if (!Array.isArray(ids) || ids.length === 0) {
        return;
      }

      Swal.fire({
        title: 'Delete files?',
        text: `${label} will be permanently removed.`,
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
        await this.deleteFiles(ids);
      });
    },
    async deleteFiles(ids) {
      this.deleting = true;
      try {
        const res = await axios.post('files/delete', { ids });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.selectedIds = this.selectedIds.filter((id) => !ids.includes(id));
          await this.fetchFiles();
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to delete files.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.deleting = false;
      }
    },
    formatCategory(category) {
      const option = this.typeOptions.find((item) => item.value === category);
      return option ? option.label.replace(/s$/, '') : 'Other';
    },
    formatSize(bytes) {
      const value = Number(bytes) || 0;
      if (value >= 1024 * 1024) {
        return `${(value / 1024 / 1024).toFixed(2)} MB`;
      }
      if (value >= 1024) {
        return `${(value / 1024).toFixed(1)} KB`;
      }
      return `${value} B`;
    },
    formatDate(value) {
      if (!value) {
        return '-';
      }
      return new Date(value).toLocaleString();
    },
  },
};
</script>

<style scoped>
.user-files-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.user-files-page__subtitle {
  margin-top: 6px;
  color: rgba(3, 2, 41, 0.5);
  font-size: 14px;
}

.user-files-page__actions,
.user-files-page__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.user-files-page__file-input {
  display: none;
}

.user-files-page__quota {
  margin-top: 24px;
  padding: 18px 20px;
  border-radius: 12px;
  background: #fff;
}

.user-files-page__quota-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.user-files-page__quota-label {
  color: rgba(3, 2, 41, 0.5);
  font-size: 13px;
  font-weight: 600;
}

.user-files-page__quota-value {
  color: var(--text);
  font-size: 18px;
  font-weight: 700;
}

.user-files-page__quota-bar {
  height: 8px;
  margin-top: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #efefef;
}

.user-files-page__quota-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
}

.user-files-page__quota-note {
  margin-top: 8px;
  color: rgba(3, 2, 41, 0.5);
  font-size: 12px;
}

.user-files-page__toolbar {
  margin-top: 24px;
}

.user-files-page__search {
  width: 280px;
}

.user-files-page__select {
  height: 40px;
  min-width: 170px;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  background: #fff;
  color: var(--text);
}

.user-files-page__bulk-btn:disabled,
.user-files-page__actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-files-page__body {
  display: flex;
}

.user-files-table-wrap {
  flex: 1;
  min-width: 0;
}

.user-files-table {
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 980px;
  flex-direction: column;
  gap: 10px;
}

.user-files-table__body {
  min-height: 0;
}

.user-files-row {
  display: grid;
  grid-template-columns: 36px minmax(260px, 1.8fr) 150px 120px 180px 180px;
  align-items: center;
  gap: 10px;
  min-height: 70px;
  padding: 0 24px;
  border-radius: 10px;
  background: #fff;
}

.user-files-row--header {
  min-height: auto;
  padding: 0 24px 8px;
  background: transparent;
}

.user-files-row__cell {
  min-width: 0;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
}

.user-files-row--header .user-files-row__cell {
  border: none;
  background: transparent;
  color: rgba(3, 2, 41, 0.6);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
}

.user-files-row__cell--check {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-files-row__cell--sortable {
  justify-content: flex-start;
  cursor: pointer;
}

.user-files-row__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.user-files-row__checkbox {
  width: 20px;
  height: 20px;
  border: 1px solid #b3b3bf;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.user-files-row__checkbox--checked {
  border-color: var(--primary);
}

.user-files-row__checkbox--indeterminate {
  border-color: var(--primary);
  background: rgba(96, 91, 255, 0.15);
}

.user-files-row__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-files-row__meta {
  margin-top: 4px;
  overflow: hidden;
  color: rgba(3, 2, 41, 0.45);
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-files-row__badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(96, 91, 255, 0.1);
  color: var(--primary);
  font-size: 12px;
}

.user-files-row__cell--actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.user-files-row__action-btn {
  border: 1px solid rgba(96, 91, 255, 0.35);
  border-radius: 4px;
  padding: 3px 8px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 500;
}

.user-files-row__action-btn:hover {
  background: rgba(96, 91, 255, 0.08);
}

.user-files-row__action-btn--danger {
  border-color: rgba(255, 91, 91, 0.35);
  color: #e04f4f;
}

.user-files-empty {
  padding: 40px 0;
  text-align: center;
  color: rgba(3, 2, 41, 0.5);
}
</style>
