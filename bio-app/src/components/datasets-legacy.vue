<template>
  <div class="datasets-legacy-page">
    <dataset-legacy-sidebar
      :sections="visibleSections"
      :active-table-id="activeTableId"
      :search-query="sidebarSearch"
      @update:search-query="sidebarSearch = $event"
      @select-table="selectTable"
      @toggle-section="toggleSection"
    />
    <dataset-legacy-main
      :table-title="currentTable.title"
      :table-type="currentTable.tableType"
      :rows="paginatedList"
      :search-query="tableSearch"
      :with-sharing-data="withSharingData"
      :selected-ids="selectedIds"
      :all-selected="allSelected"
      :some-selected="someSelected"
      :filters="activeFilters"
      :filter-options="activeFilterOptions"
      @update:search-query="tableSearch = $event"
      @update:with-sharing-data="withSharingData = $event"
      @update:filters="activeFilters = $event"
      @set-sort="setSort"
      @toggle-select="toggleSelect"
      @toggle-select-all="toggleSelectAll"
    >
      <template #footer>
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
      </template>
    </dataset-legacy-main>
  </div>
</template>

<script>
import DatasetLegacySidebar from './datasets-legacy/dataset-legacy-sidebar.vue';
import DatasetLegacyMain from './datasets-legacy/dataset-legacy-main.vue';
import ListPagination from './parts/list-pagination.vue';
import paginationMixin from '../assets/js/pagination.js';
import {
  backboneFilterOptions,
  cloneSections,
  datasetLegacySections,
  defaultTableId,
  emptyBackboneFilters,
  emptyPartFilters,
  emptyPlasmidFilters,
  findSectionForTable,
  getTableById,
  partFilterOptions,
  plasmidFilterOptions,
} from '../data/datasets-legacy-mock.js';

export default {
  name: 'datasets-legacy',
  components: {
    DatasetLegacySidebar,
    DatasetLegacyMain,
    ListPagination,
  },
  mixins: [paginationMixin],
  data() {
    return {
      sections: cloneSections(datasetLegacySections),
      activeTableId: defaultTableId,
      sidebarSearch: '',
      tableSearch: '',
      withSharingData: false,
      sortKey: 'id',
      sortDir: 'asc',
      selectedIds: [],
      rowList: [],
      loading: false,
      searchDebounceTimer: null,
      partFilters: { ...emptyPartFilters },
      backboneFilters: { ...emptyBackboneFilters },
      plasmidFilters: { ...emptyPlasmidFilters },
    };
  },
  created() {
    this.fetchRows();
  },
  beforeUnmount() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  },
  computed: {
    currentTable() {
      return getTableById(this.activeTableId, this.sections);
    },
    activeFilters: {
      get() {
        switch (this.currentTable.tableType) {
          case 'part':
            return this.partFilters;
          case 'backbone':
            return this.backboneFilters;
          case 'plasmid':
            return this.plasmidFilters;
          default:
            return {};
        }
      },
      set(value) {
        switch (this.currentTable.tableType) {
          case 'part':
            this.partFilters = value;
            break;
          case 'backbone':
            this.backboneFilters = value;
            break;
          case 'plasmid':
            this.plasmidFilters = value;
            break;
          default:
            break;
        }
      },
    },
    activeFilterOptions() {
      switch (this.currentTable.tableType) {
        case 'part':
          return partFilterOptions;
        case 'backbone':
          return backboneFilterOptions;
        case 'plasmid':
          return plasmidFilterOptions;
        default:
          return {};
      }
    },
    visibleSections() {
      const query = this.sidebarSearch.trim().toLowerCase();
      if (!query) {
        return this.sections;
      }
      return this.sections
        .map((section) => {
          const tables = section.tables.filter((table) =>
            table.title.toLowerCase().includes(query)
          );
          if (!tables.length) {
            return null;
          }
          return {
            ...section,
            expanded: true,
            tables,
          };
        })
        .filter(Boolean);
    },
    paginationList() {
      return this.rowList;
    },
    allSelected() {
      return this.paginatedList.length > 0
        && this.paginatedList.every((item) => this.selectedIds.includes(item.id));
    },
    someSelected() {
      return !this.allSelected
        && this.paginatedList.some((item) => this.selectedIds.includes(item.id));
    },
  },
  watch: {
    rowList(list) {
      const ids = new Set(list.map((item) => item.id));
      this.selectedIds = this.selectedIds.filter((id) => ids.has(id));
    },
    activeTableId() {
      this.selectedIds = [];
      this.tableSearch = '';
      this.resetFiltersForTable(this.currentTable.tableType);
      this.resetPagination();
      this.fetchRows();
    },
    withSharingData() {
      this.resetPagination();
      this.fetchRows();
    },
    partFilters: {
      deep: true,
      handler() {
        this.resetPagination();
        this.fetchRows();
      },
    },
    backboneFilters: {
      deep: true,
      handler() {
        this.resetPagination();
        this.fetchRows();
      },
    },
    plasmidFilters: {
      deep: true,
      handler() {
        this.resetPagination();
        this.fetchRows();
      },
    },
    tableSearch() {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      this.searchDebounceTimer = setTimeout(() => {
        this.resetPagination();
        this.fetchRows();
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
    async fetchRows() {
      this.loading = true;
      try {
        const res = await axios.post('datasets/legacy/rows', {
          tableId: this.activeTableId,
          withSharingData: this.withSharingData,
          sortKey: this.sortKey,
          sortDir: this.sortDir,
          filters: this.activeFilters,
          ...(this.tableSearch.trim() ? { search: this.tableSearch.trim() } : {}),
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          const rows = data.options?.rows ?? [];
          this.rowList = Array.isArray(rows) ? rows : [];
        }
      } catch (e) {
        // keep current list on network error
      } finally {
        this.loading = false;
      }
    },
    resetFiltersForTable(tableType) {
      if (tableType === 'part') {
        this.partFilters = { ...emptyPartFilters };
        return;
      }
      if (tableType === 'backbone') {
        this.backboneFilters = { ...emptyBackboneFilters };
        return;
      }
      if (tableType === 'plasmid') {
        this.plasmidFilters = { ...emptyPlasmidFilters };
      }
    },
    selectTable(tableId) {
      this.activeTableId = tableId;
      const section = findSectionForTable(tableId, this.sections);
      if (section) {
        const target = this.sections.find((item) => item.id === section.id);
        if (target) {
          target.expanded = true;
        }
      }
    },
    toggleSection(sectionId) {
      const section = this.sections.find((item) => item.id === sectionId);
      if (section) {
        section.expanded = !section.expanded;
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
      this.fetchRows();
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
  },
};
</script>
