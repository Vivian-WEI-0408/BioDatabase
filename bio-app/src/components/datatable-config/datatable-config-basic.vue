<template>
  <div class="datatable-config-card datatable-config-card--basic">
    <div class="datatable-config-card__title">Basic Config</div>

    <div class="datatable-config-fields">
      <div class="datatable-config-field">
        <label class="datatable-config-field__label">Table Name</label>
        <input
          v-model="form.name"
          type="text"
          class="datatable-config-field__input"
          placeholder="Table name"
        >
      </div>
      <div class="datatable-config-field">
        <label class="datatable-config-field__label">Table Description</label>
        <textarea
          v-model="form.description"
          class="datatable-config-field__textarea"
          placeholder="Description"
          rows="5"
        />
      </div>
    </div>

    <button
      type="button"
      class="datatable-config-card__submit btn btn-primary"
      @click="onUpdate"
    >
      Update Table
    </button>
  </div>
</template>

<script>
export default {
  name: 'datatable-config-basic',
  props: {
    name: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  emits: ['update'],
  data() {
    return {
      form: {
        name: this.name,
        description: this.description,
      },
    };
  },
  watch: {
    name(value) {
      this.form.name = value;
    },
    description(value) {
      this.form.description = value;
    },
  },
  methods: {
    onUpdate() {
      const name = this.form.name.trim();
      const description = this.form.description.trim();
      if (!name) {
        A.err('Table name is required.');
        return;
      }
      this.$emit('update', { name, description });
      A.toast('Table updated successfully!');
    },
  },
};
</script>
