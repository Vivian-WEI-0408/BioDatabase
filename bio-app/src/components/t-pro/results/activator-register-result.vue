<template>
  <div class="tpro-register-result">
    <div class="res-title">Activator Registration Result</div>
    <p v-if="result.message">{{ result.message }}</p>
    <p v-if="result.label || result.summaryName"><b>Name:</b> {{ result.label || result.summaryName }}</p>
    <p v-if="result.activatorID"><b>ID:</b> {{ result.activatorID }}</p>
    <div v-if="logos.length" class="tpro-register-result__images">
      <div v-for="(logo, i) in logos" :key="i" class="tpro-register-result__image-item">
        <div class="tpro-register-result__image-label">Motif {{ logo.position }}–{{ logo.length }}</div>
        <img v-if="logo.encodedImage" :src="`data:image/png;base64,${logo.encodedImage}`" alt="Motif logo">
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'activator-register-result',
  props: {
    result: { type: Object, required: true },
  },
  computed: {
    logos() {
      return this.result?.logoBase64List || [];
    },
  },
};
</script>
