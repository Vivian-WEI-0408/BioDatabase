<template>
  <div class="item-detail-overview">
    <div class="item-detail-section-tag">Overview</div>
    <h1 class="item-detail-overview__title">{{ title }}</h1>
    <p class="item-detail-overview__desc">{{ description }}</p>
    <dl class="item-detail-overview__grid">
      <div
        v-for="field in fields"
        :key="field.label"
        class="item-detail-overview__row"
      >
        <dt class="item-detail-overview__label">{{ field.label }}</dt>
        <dd class="item-detail-overview__pill">{{ field.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<script>
export default {
  name: 'item-detail-overview',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    fields: { type: Array, default: () => [] },
  },
};
</script>
