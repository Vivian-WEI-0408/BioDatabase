<template>
  <div
    class="dataset-browse-row"
    :style="{ gridTemplateColumns }"
  >
    <label class="dataset-browse-row__cell dataset-browse-row__cell--check">
      <span
        class="dataset-browse-row__checkbox"
        :class="{ 'dataset-browse-row__checkbox--checked': selected }"
      >
        <svg v-if="selected" width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <input
        type="checkbox"
        class="dataset-browse-row__input"
        :checked="selected"
        @change="$emit('toggle-select', row.id)"
      >
    </label>

    <div
      v-for="col in columns"
      :key="col.key"
      class="dataset-browse-row__cell"
    >
      <span
        v-if="col.key === 'tag'"
        class="dataset-browse-row__tag"
        :class="tagClass(row.tag)"
      >
        {{ tagLabel(row.tag) }}
      </span>
      <template v-else>{{ formatCellValue(row, col.key) }}</template>
    </div>

    <div
      v-if="showActions"
      class="dataset-browse-row__cell dataset-browse-row__cell--actions"
    >
      <button
        type="button"
        class="dataset-browse-row__action-btn"
        @click="$emit('view-row', row)"
      >
        查看
      </button>
      <button
        v-if="showEditAction"
        type="button"
        class="dataset-browse-row__action-btn"
        @click="$emit('edit-row', row)"
      >
        编辑
      </button>
      <button
        v-if="showDeleteAction"
        type="button"
        class="dataset-browse-row__action-btn dataset-browse-row__action-btn--danger"
        @click="$emit('delete-row', row)"
      >
        删除
      </button>
    </div>
  </div>
</template>

<script>
const ARRAY_FIELD_KEYS = new Set(['ori', 'marker', 'oriInfo', 'markerInfo']);

export default {
  name: 'dataset-browse-row',
  props: {
    row: { type: Object, required: true },
    columns: { type: Array, default: () => [] },
    selected: { type: Boolean, default: false },
    showActions: { type: Boolean, default: true },
    showEditAction: { type: Boolean, default: true },
    showDeleteAction: { type: Boolean, default: true },
    gridTemplateColumns: { type: String, default: '' },
  },
  emits: ['toggle-select', 'view-row', 'edit-row', 'delete-row'],
  methods: {
    formatCellValue(row, key) {
      const value = row[key];
      if (Array.isArray(value) || ARRAY_FIELD_KEYS.has(key)) {
        if (Array.isArray(value)) {
          return value.filter(Boolean).join(', ');
        }
        return value ?? '';
      }
      return value ?? '';
    },
    tagLabel(tag) {
      if (tag === 'normal') {
        return '正常';
      }
      if (!tag) {
        return '—';
      }
      return tag;
    },
    tagClass(tag) {
      return tag === 'normal'
        ? 'dataset-browse-row__tag--normal'
        : 'dataset-browse-row__tag--abnormal';
    },
  },
};
</script>
