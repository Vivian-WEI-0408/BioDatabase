<template>
  <div class="datatable-config-main">
    <div class="datatable-config-main__header">
      <div class="datatable-config-main__title">{{ tableName }}</div>
      <button
        type="button"
        class="datatable-config-main__filter-btn"
        aria-label="Column filter settings"
        @click="onFilterClick"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M2 4H18M5 10H15M8 16H12"
            stroke="#030229"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <div class="datatable-config-main__top">
      <datatable-config-basic
        :key="`basic-${tableId}`"
        :name="config.name"
        :description="config.description"
        @update="$emit('update-basic', $event)"
      />
      <datatable-config-sharing
        :key="`sharing-${tableId}`"
        :users="config.sharedUsers"
        @update="$emit('update-sharing', $event)"
        @remove-user="$emit('remove-user', $event)"
      />
    </div>

    <datatable-config-transfer
      :key="`transfer-${tableId}`"
      :table-name="config.name"
    />
  </div>
</template>

<script>
import DatatableConfigBasic from './datatable-config-basic.vue';
import DatatableConfigSharing from './datatable-config-sharing.vue';
import DatatableConfigTransfer from './datatable-config-transfer.vue';

export default {
  name: 'datatable-config-main',
  components: {
    DatatableConfigBasic,
    DatatableConfigSharing,
    DatatableConfigTransfer,
  },
  props: {
    tableId: { type: String, required: true },
    tableName: { type: String, required: true },
    config: {
      type: Object,
      required: true,
    },
  },
  emits: ['update-basic', 'update-sharing', 'remove-user'],
  methods: {
    onFilterClick() {
      Swal.fire({
        icon: 'info',
        title: 'Coming soon',
        text: 'Column filter settings are not available yet.',
        confirmButtonColor: '#605bff',
      });
    },
  },
};
</script>
