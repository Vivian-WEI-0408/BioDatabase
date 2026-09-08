<template>
  <div class="dataset-filter-bar">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="dataset-filter-bar__icon" aria-hidden="true">
      <path d="M3 5H17M5 10H15M7 15H13" stroke="#030229" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <filter-select-field
      label="Type"
      :options="typeOptions"
      :model-value="modelValue.type"
      @update:model-value="updateField('type', $event)"
    />
    <filter-select-field
      label="Enzyme"
      :options="enzymeOptions"
      :model-value="modelValue.enzyme"
      @update:model-value="updateField('enzyme', $event)"
    />
    <filter-select-field
      label="Resistance"
      :options="resistanceOptions"
      :model-value="modelValue.resistance"
      @update:model-value="updateField('resistance', $event)"
    />
  </div>
</template>

<script>
import FilterSelectField from './filter-select-field.vue';

export default {
  name: 'backbone-filter',
  components: {
    FilterSelectField,
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    typeOptions: { type: Array, default: () => [] },
    enzymeOptions: { type: Array, default: () => [] },
    resistanceOptions: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue'],
  methods: {
    updateField(key, value) {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        [key]: value,
      });
    },
  },
};
</script>
