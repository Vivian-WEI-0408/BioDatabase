<template>
  <component
    :is="rootTag"
    class="categories-part-card"
    :class="{ 'categories-part-card--disabled': isDisabled }"
    v-bind="rootAttrs"
    @click="onActivate"
  >
    <div class="categories-part-card__head">
      <div class="categories-part-card__text">
        <div class="categories-part-card__title">{{ title }}</div>
        <div class="categories-part-card__subtitle">{{ subtitle }}</div>
      </div>
      <span
        v-if="verified"
        class="categories-part-card__badge"
      >Verified</span>
    </div>

    <div class="categories-part-card__image">
      <img :src="`/images/categories/${title}.png`" alt="">
    </div>
  </component>
</template>

<script>
export default {
  name: 'categories-part-card',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    to: { type: Object, default: null },
    disabled: { type: Boolean, default: false },
  },
  emits: ['click'],
  computed: {
    isDisabled() {
      return this.disabled || !this.to;
    },
    rootTag() {
      return this.isDisabled ? 'div' : 'button';
    },
    rootAttrs() {
      if (this.isDisabled) {
        return {
          'aria-disabled': 'true',
        };
      }
      return {
        type: 'button',
      };
    },
  },
  methods: {
    onActivate(event) {
      if (this.isDisabled) {
        return;
      }
      this.$emit('click', event);
      if (this.to) {
        this.$router.push(this.to);
      }
    },
  },
};
</script>
