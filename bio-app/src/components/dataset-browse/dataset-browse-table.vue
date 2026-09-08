<template>
  <div class="dataset-browse-table list-panel">
    <div
      class="dataset-browse-table__header dataset-browse-row dataset-browse-row--header"
      :style="{ gridTemplateColumns }"
    >
      <label class="dataset-browse-row__cell dataset-browse-row__cell--check">
        <span
          class="dataset-browse-row__checkbox"
          :class="{
            'dataset-browse-row__checkbox--checked': allSelected,
            'dataset-browse-row__checkbox--indeterminate': someSelected,
          }"
        >
          <svg v-if="allSelected" width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <input type="checkbox" class="dataset-browse-row__input" :checked="allSelected" @change="$emit('toggle-select-all')">
      </label>
      <button
        v-for="col in columns"
        :key="col.key"
        type="button"
        class="dataset-browse-table__col"
        @click="$emit('set-sort', col.key)"
      >
        {{ col.label }}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="dataset-browse-table__sort-icon">
          <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
      </button>
      <div
        v-if="showActions"
        class="dataset-browse-table__col dataset-browse-table__col--actions"
      >
        操作
      </div>
    </div>

    <div class="scroll-body">
      <dataset-browse-row
        v-for="row in rows"
        :key="row.id"
        :row="row"
        :columns="columns"
        :selected="selectedIds.includes(row.id)"
        :show-actions="showActions"
        :show-edit-action="showEditAction"
        :show-delete-action="showDeleteAction"
        :grid-template-columns="gridTemplateColumns"
        @toggle-select="$emit('toggle-select', $event)"
        @view-row="$emit('view-row', $event)"
        @edit-row="$emit('edit-row', $event)"
        @delete-row="$emit('delete-row', $event)"
      />

      <div v-if="rows.length === 0" class="dataset-browse-table__empty">
        No rows found.
      </div>
    </div>
  </div>
</template>

<script>
import DatasetBrowseRow from './dataset-browse-row.vue';

export default {
  name: 'dataset-browse-table',
  components: { DatasetBrowseRow },
  props: {
    rows: { type: Array, required: true },
    columns: { type: Array, default: () => [] },
    selectedIds: { type: Array, default: () => [] },
    allSelected: { type: Boolean, default: false },
    someSelected: { type: Boolean, default: false },
    showActions: { type: Boolean, default: true },
    showEditAction: { type: Boolean, default: true },
    showDeleteAction: { type: Boolean, default: true },
  },
  emits: [
    'set-sort',
    'toggle-select',
    'toggle-select-all',
    'view-row',
    'edit-row',
    'delete-row',
  ],
  computed: {
    gridTemplateColumns() {
      const dataCols = this.columns.length > 0
        ? `repeat(${this.columns.length}, minmax(80px, 1fr))`
        : 'minmax(200px, 1fr)';
      const actionsCol = this.showActions ? ' 140px' : '';
      return `20px ${dataCols}${actionsCol}`;
    },
  },
};
</script>
