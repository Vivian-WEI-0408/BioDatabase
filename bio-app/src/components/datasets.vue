<template>
  <div class="page-container datasets-page">
    <div class="datasets-page__header">
      <div class="page-title">DataSets</div>
      <div class="datasets-page__tabs-wrap">
        <div class="datasets-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="datasets-tabs__btn"
            :class="{ 'datasets-tabs__btn--active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >{{ tab.label }}</button>
        </div>
      </div>
      <div class="datasets-page__search-wrap">
        <div class="datasets-search">
          <input
            v-model.trim="searchQuery"
            type="search"
            class="datasets-search__input"
            placeholder="Search..."
            aria-label="Search datasets"
          >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="datasets-search__icon">
            <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
            <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
      </div>
    </div>

    <div class="page-body datasets-page__body">
      <div class="list-panel">
        <div class="scroll-body datasets-grid">
          <dataset-card
            v-for="item in paginatedList"
            :key="item.id"
            :id="item.id"
            :title="item.title"
            :category="item.category"
            :description="item.description"
            :item-count="item.itemCount"
            :date="item.date"
          />
          <div v-if="paginationTotal === 0" class="datasets-empty">No datasets found.</div>
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
import DatasetCard from './datasets/dataset-card.vue';
import ListPagination from './parts/list-pagination.vue';
import paginationMixin from '../assets/js/pagination.js';
import { datasetTabs, datasets } from '../data/datasets-mock.js';

export default {
  name: 'datasets',
  components: {
    DatasetCard,
    ListPagination,
  },
  mixins: [paginationMixin],
  data() {
    return {
      tabs: datasetTabs,
      activeTab: 'all',
      searchQuery: '',
      datasets,
      pageSize: 12,
    };
  },
  computed: {
    visibleDatasets() {
      let list = this.datasets;
      if (this.activeTab !== 'all') {
        list = list.filter((item) => item.category === this.activeTab);
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(
          (item) =>
            item.title.toLowerCase().includes(q)
            || item.description.toLowerCase().includes(q)
        );
      }
      return list;
    },
    paginationList() {
      return this.visibleDatasets;
    },
  },
};
</script>
