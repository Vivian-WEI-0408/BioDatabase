<template>
  <div class="datasets-legacy-main">
    <div class="datasets-legacy-main__header">
      <div class="datasets-legacy-main__header-top">
        <div class="datasets-legacy-main__title-wrap">
          <div class="datasets-legacy-main__title">{{ tableTitle }}</div>
        </div>
        <div class="datasets-legacy-main__toolbar">
          <label class="datasets-legacy-main__sharing">
            <span
              class="datasets-legacy-main__sharing-box"
              :class="{ 'datasets-legacy-main__sharing-box--checked': withSharingData }"
            >
              <svg v-if="withSharingData" width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <input
              type="checkbox"
              class="datasets-legacy-row__input"
              :checked="withSharingData"
              @change="$emit('update:withSharingData', $event.target.checked)"
            >
            <span class="datasets-legacy-main__sharing-label">With Sharing Data</span>
          </label>
          <div class="datasets-legacy-main__search">
            <input
              :value="searchQuery"
              type="search"
              class="datasets-legacy-main__search-input"
              placeholder="Search"
              aria-label="Search table rows"
              @input="$emit('update:searchQuery', $event.target.value)"
            >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="datasets-legacy-main__search-icon">
              <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
              <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <button type="button" class="datasets-legacy-main__add-btn" @click="onAddNew">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V13M1 7H13" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            Add New
          </button>
        </div>
      </div>

      <div v-if="tableType === 'part'" class="datasets-legacy-main__filter-row">
        <part-filter
          :model-value="filters"
          v-bind="filterOptions"
          @update:model-value="$emit('update:filters', $event)"
        />
      </div>
      <div v-else-if="tableType === 'backbone'" class="datasets-legacy-main__filter-row">
        <backbone-filter
          :model-value="filters"
          v-bind="filterOptions"
          @update:model-value="$emit('update:filters', $event)"
        />
      </div>
      <div v-else-if="tableType === 'plasmid'" class="datasets-legacy-main__filter-row">
        <plasmid-filter
          :model-value="filters"
          v-bind="filterOptions"
          @update:model-value="$emit('update:filters', $event)"
        />
      </div>
    </div>

    <div class="datasets-legacy-main__body list-panel">
      <div class="datasets-legacy-table">
        <div class="datasets-legacy-table__header datasets-legacy-row datasets-legacy-row--header">
          <label class="datasets-legacy-row__cell datasets-legacy-row__cell--check">
            <span
              class="datasets-legacy-row__checkbox"
              :class="{
                'datasets-legacy-row__checkbox--checked': allSelected,
                'datasets-legacy-row__checkbox--indeterminate': someSelected,
              }"
            >
              <svg v-if="allSelected" width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <input type="checkbox" class="datasets-legacy-row__input" :checked="allSelected" @change="$emit('toggle-select-all')">
          </label>
          <button type="button" class="datasets-legacy-table__col" @click="$emit('set-sort', 'id')">
            ID
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="datasets-legacy-table__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="datasets-legacy-table__col" @click="$emit('set-sort', 'fieldA')">
            Field A
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="datasets-legacy-table__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="datasets-legacy-table__col" @click="$emit('set-sort', 'fieldB')">
            Field B
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="datasets-legacy-table__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="datasets-legacy-table__col" @click="$emit('set-sort', 'createdAt')">
            Created At
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="datasets-legacy-table__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="datasets-legacy-table__col" @click="$emit('set-sort', 'creator')">
            Creator
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="datasets-legacy-table__sort-icon">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
          <div class="datasets-legacy-row__cell datasets-legacy-row__cell--actions"></div>
        </div>

        <div class="scroll-body">
          <dataset-legacy-row
            v-for="row in rows"
            :key="row.id"
            :row="row"
            :selected="selectedIds.includes(row.id)"
            @toggle-select="$emit('toggle-select', $event)"
            @menu="onRowMenu"
          />

          <div v-if="rows.length === 0" class="datasets-legacy-table__empty">
            No rows found.
          </div>
        </div>
      </div>
      <slot name="footer" />
    </div>
  </div>
</template>

<script>
import DatasetLegacyRow from './dataset-legacy-row.vue';
import PartFilter from './filters/part-filter.vue';
import BackboneFilter from './filters/backbone-filter.vue';
import PlasmidFilter from './filters/plasmid-filter.vue';

export default {
  name: 'dataset-legacy-main',
  components: {
    DatasetLegacyRow,
    PartFilter,
    BackboneFilter,
    PlasmidFilter,
  },
  props: {
    tableTitle: { type: String, required: true },
    tableType: { type: String, default: null },
    rows: { type: Array, required: true },
    searchQuery: { type: String, default: '' },
    withSharingData: { type: Boolean, default: false },
    selectedIds: { type: Array, default: () => [] },
    allSelected: { type: Boolean, default: false },
    someSelected: { type: Boolean, default: false },
    filters: { type: Object, default: () => ({}) },
    filterOptions: { type: Object, default: () => ({}) },
  },
  emits: [
    'update:searchQuery',
    'update:withSharingData',
    'update:filters',
    'set-sort',
    'toggle-select',
    'toggle-select-all',
  ],
  methods: {
    showComingSoon(action) {
      Swal.fire({
        icon: 'info',
        title: 'Coming soon',
        text: `${action} is not available yet.`,
        confirmButtonColor: '#605bff',
      });
    },
    onAddNew() {
      this.showComingSoon('Add New');
    },
    onRowMenu() {
      this.showComingSoon('Row actions');
    },
  },
};
</script>
