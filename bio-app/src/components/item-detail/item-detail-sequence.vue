<template>
  <div class="item-detail-sequence">
    <div class="item-detail-section-tag">Sequence</div>
    <p class="item-detail-sequence__label">Insert Sequence</p>
    <div class="item-detail-sequence__block">
      <code class="item-detail-sequence__code">{{ sequence }}</code>
    </div>
  </div>
</template>

<script>
export default {
  name: 'item-detail-sequence',
  props: {
    sequence: {
      type: String,
      required: true,
    },
  },
};
</script>
