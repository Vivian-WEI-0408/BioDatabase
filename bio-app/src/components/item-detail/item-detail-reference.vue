<template>
  <div class="item-detail-reference">
    <div class="item-detail-section-tag">Reference</div>
    <div class="item-detail-reference__card">
      <p class="item-detail-reference__text">
        {{ reference.text }}
        <a
          :href="reference.url"
          class="item-detail-reference__link"
          target="_blank"
          rel="noopener noreferrer"
        >{{ reference.url }}</a>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'item-detail-reference',
  props: {
    reference: {
      type: Object,
      required: true,
    },
  },
};
</script>
