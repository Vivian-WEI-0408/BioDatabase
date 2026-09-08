<template>
  <div class="page-container global-search-page">
    <div class="global-search-page__header">
      <div>
        <div class="page-title">Search</div>
        <div class="global-search-page__subtitle">
          Search tasks, component datasets, files and documents.
        </div>
      </div>
      <div class="global-search-page__search">
        <input
          v-model.trim="searchInput"
          type="search"
          class="global-search-page__input"
          placeholder="Search anything..."
          aria-label="Search anything"
          @keyup.enter="submitSearch"
        >
        <button type="button" class="global-search-page__button" aria-label="Search" @click="submitSearch">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.8" stroke-width="1.5" />
            <path d="M12.5 12.5L16 16" stroke="currentColor" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <div class="page-body global-search-page__body">
      <div v-if="!query" class="global-search-empty">
        Enter keywords in the sidebar or the search box above.
      </div>
      <div v-else-if="loading" class="global-search-empty">Searching...</div>
      <div v-else-if="errorMsg" class="global-search-empty">{{ errorMsg }}</div>
      <div v-else-if="totalCount === 0" class="global-search-empty">
        No results found for "{{ query }}".
      </div>
      <div
        v-else
        class="global-search-blocks"
        :class="{ 'global-search-blocks--expanded': Boolean(expandedBlockKey) }"
      >
        <section
          v-for="block in displayedBlocks"
          :key="block.key"
          class="global-search-block list-panel"
          :class="{ 'global-search-block--expanded': expandedBlockKey === block.key }"
        >
          <div class="global-search-block__header">
            <div>
              <h2 class="global-search-block__title">{{ block.label }}</h2>
              <div class="global-search-block__count">{{ block.total }} result(s)</div>
            </div>
            <button
              type="button"
              class="global-search-block__expand"
              :aria-label="expandedBlockKey === block.key ? 'Collapse block' : 'Expand block'"
              @click="toggleBlockExpand(block.key)"
            >
              {{ expandedBlockKey === block.key ? 'Collapse' : 'Expand' }}
            </button>
          </div>

          <div v-if="!block.items.length" class="global-search-block__empty">
            No {{ block.label.toLowerCase() }} matched.
          </div>
          <div v-else class="global-search-block__list">
            <button
              v-for="item in block.items"
              :key="item.type + '-' + item.id"
              type="button"
              class="global-search-result"
              @click="openResult(item)"
            >
              <div class="global-search-result__main">
                <div class="global-search-result__title-row">
                  <span class="global-search-result__title">{{ item.title }}</span>
                  <span class="global-search-result__badge">{{ formatType(item.type) }}</span>
                </div>
                <div v-if="item.subtitle" class="global-search-result__subtitle">{{ item.subtitle }}</div>
                <div v-if="item.description" class="global-search-result__description">{{ item.description }}</div>
              </div>
              <span class="global-search-result__action">View</span>
            </button>
          </div>
        </section>
      </div>
    </div>

    <div v-if="selectedFile" class="global-search-file-modal">
      <div class="global-search-file-modal__backdrop" @click="closeFileDetail"></div>
      <div class="global-search-file-modal__panel">
        <div class="global-search-file-modal__header">
          <div>
            <div class="global-search-file-modal__title">{{ selectedFile.title }}</div>
            <div class="global-search-file-modal__subtitle">{{ selectedFile.subtitle }}</div>
          </div>
          <button type="button" class="global-search-file-modal__close" aria-label="Close" @click="closeFileDetail">×</button>
        </div>
        <dl class="global-search-file-modal__meta">
          <div>
            <dt>File Name</dt>
            <dd>{{ selectedFile.meta.originalName }}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{{ selectedFile.meta.category || 'other' }}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{{ formatSize(selectedFile.meta.sizeBytes) }}</dd>
          </div>
          <div>
            <dt>Uploaded</dt>
            <dd>{{ formatDate(selectedFile.meta.createdAt) }}</dd>
          </div>
          <div>
            <dt>MIME</dt>
            <dd>{{ selectedFile.meta.mimeType || 'unknown' }}</dd>
          </div>
        </dl>
        <div class="global-search-file-modal__actions">
          <button type="button" class="btn btn-outline" @click="closeFileDetail">Close</button>
          <button type="button" class="btn btn-primary" @click="downloadFile(selectedFile)">Download</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const BLOCK_ORDER = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'parts', label: 'Parts' },
  { key: 'backbones', label: 'Backbones' },
  { key: 'plasmids', label: 'Plasmids' },
  { key: 'files', label: 'Files' },
  { key: 'documents', label: 'Documents' },
];

const TYPE_LABELS = {
  task: 'Task',
  part: 'Part',
  backbone: 'Backbone',
  plasmid: 'Plasmid',
  file: 'File',
  document: 'Document',
};

export default {
  name: 'global-search',
  data() {
    return {
      searchInput: '',
      query: '',
      blocks: {},
      loading: false,
      errorMsg: '',
      selectedFile: null,
      expandedBlockKey: '',
    };
  },
  computed: {
    visibleBlocks() {
      return BLOCK_ORDER.map((block) => ({
        key: block.key,
        label: this.blocks[block.key]?.label || block.label,
        total: Number(this.blocks[block.key]?.total) || 0,
        items: this.blocks[block.key]?.items || [],
      }));
    },
    totalCount() {
      return this.visibleBlocks.reduce((sum, block) => sum + block.total, 0);
    },
    displayedBlocks() {
      if (!this.expandedBlockKey) {
        return this.visibleBlocks;
      }
      return this.visibleBlocks.filter((block) => block.key === this.expandedBlockKey);
    },
  },
  watch: {
    '$route.query.q': {
      immediate: true,
      handler(value) {
        const nextQuery = String(value || '').trim();
        this.searchInput = nextQuery;
        this.query = nextQuery;
        this.selectedFile = null;
        this.expandedBlockKey = '';
        this.fetchResults();
      },
    },
  },
  methods: {
    submitSearch() {
      const nextQuery = this.searchInput.trim();
      if (!nextQuery) {
        return;
      }
      if (nextQuery === this.query) {
        this.fetchResults();
        return;
      }
      this.$router.push({ name: 'search', query: { q: nextQuery } });
    },
    async fetchResults() {
      this.errorMsg = '';
      this.blocks = {};
      if (!this.query) {
        return;
      }

      this.loading = true;
      try {
        const res = await axios.post('search/global', {
          query: this.query,
          limit: 20,
        });
        const data = res.data || {};
        if (data.status === 2) {
          this.$router.replace('/signin');
          return;
        }
        if (data.status === 1) {
          this.blocks = data.options?.blocks || {};
          return;
        }
        this.errorMsg = data.msg || 'Search failed.';
      } catch (e) {
        this.errorMsg = 'Network error, please try again.';
      } finally {
        this.loading = false;
      }
    },
    openResult(item) {
      if (item.type === 'file') {
        this.selectedFile = item;
        return;
      }
      if (item.route) {
        this.$router.push(item.route);
      }
    },
    closeFileDetail() {
      this.selectedFile = null;
    },
    toggleBlockExpand(blockKey) {
      this.expandedBlockKey = this.expandedBlockKey === blockKey ? '' : blockKey;
    },
    async downloadFile(file) {
      try {
        const res = await axios.get(`files/download/${file.id}`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = file.meta?.originalName || file.title || 'download';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Download failed.' });
      }
    },
    formatType(type) {
      return TYPE_LABELS[type] || type;
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
