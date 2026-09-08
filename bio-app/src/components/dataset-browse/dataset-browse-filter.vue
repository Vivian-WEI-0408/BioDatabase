<template>
  <aside class="dataset-browse-filter">
    <div class="dataset-browse-filter__header">
      <div class="dataset-browse-filter__title">Filter &amp; Categories</div>
    </div>

    <div
      v-for="group in groups"
      :key="group.id"
      class="dataset-browse-filter__section"
    >
      <button
        type="button"
        class="dataset-browse-filter__section-toggle"
        @click="toggleSection(group.id)"
      >
        <span class="dataset-browse-filter__section-title">{{ group.title }}</span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          class="dataset-browse-filter__caret"
          :class="{ 'dataset-browse-filter__caret--expanded': expanded[group.id] }"
        >
          <path d="M6 9L12 15L18 9" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div v-if="expanded[group.id]" class="dataset-browse-filter__options">
        <label
          v-for="option in group.options"
          :key="option"
          class="dataset-browse-filter__option"
        >
          <span
            class="dataset-browse-filter__checkbox"
            :class="{ 'dataset-browse-filter__checkbox--checked': isChecked(group.id, option) }"
          >
            <svg v-if="isChecked(group.id, option)" width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5L4.5 8.5L11 1.5" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <input
            type="checkbox"
            class="dataset-browse-filter__input"
            :checked="isChecked(group.id, option)"
            @change="toggleOption(group.id, option)"
          >
          <span class="dataset-browse-filter__option-label">{{ option }}</span>
        </label>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'dataset-browse-filter',
  props: {
    groups: { type: Array, required: true },
    modelValue: { type: Object, required: true },
  },
  emits: ['update:modelValue'],
  data() {
    const expanded = {};
    this.groups.forEach((group) => {
      expanded[group.id] = group.expanded !== false;
    });
    return { expanded };
  },
  methods: {
    isChecked(groupId, option) {
      return (this.modelValue[groupId] || []).includes(option);
    },
    toggleSection(groupId) {
      this.expanded[groupId] = !this.expanded[groupId];
    },
    toggleOption(groupId, option) {
      const current = [...(this.modelValue[groupId] || [])];
      const index = current.indexOf(option);
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(option);
      }
      this.$emit('update:modelValue', {
        ...this.modelValue,
        [groupId]: current,
      });
    },
  },
};
</script>
