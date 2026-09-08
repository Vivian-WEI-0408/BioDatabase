<template>
  <div class="dataset-filter-field">
    <label class="dataset-filter-field__label" :for="fieldId">{{ label }}</label>
    <div class="dataset-filter-field__select-wrap">
      <select
        :id="fieldId"
        class="dataset-filter-field__select"
        :value="modelValue ?? ''"
        @change="onChange"
      >
        <option value="">{{ placeholder }}</option>
        <option
          v-for="option in normalizedOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="dataset-filter-field__caret" aria-hidden="true">
        <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
      </svg>
    </div>
  </div>
</template>

<script>
let fieldIdCounter = 0;

export default {
  name: 'filter-select-field',
  props: {
    label: { type: String, required: true },
    options: { type: Array, default: () => [] },
    modelValue: { type: [String, null], default: null },
    placeholder: { type: String, default: 'All' },
  },
  emits: ['update:modelValue'],
  data() {
    fieldIdCounter += 1;
    return {
      fieldId: `dataset-filter-${fieldIdCounter}`,
    };
  },
  computed: {
    normalizedOptions() {
      return this.options.map((option) => {
        if (typeof option === 'string') {
          return { value: option, label: option };
        }
        return {
          value: option.value,
          label: option.label ?? option.value,
        };
      });
    },
  },
  methods: {
    onChange(event) {
      const value = event.target.value;
      this.$emit('update:modelValue', value || null);
    },
  },
};
</script>
