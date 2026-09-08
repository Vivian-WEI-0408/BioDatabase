<template>
  <div class="tpro-register-result">
    <div class="res-title">Registration Result</div>
    <p v-if="result.message">{{ result.message }}</p>
    <p v-if="result.label"><b>Name:</b> {{ result.label }}</p>
    <p v-if="idValue"><b>ID:</b> {{ idValue }}</p>
  </div>
</template>

<script>
export default {
  name: 'register-result-base',
  props: {
    result: { type: Object, required: true },
    idKey: { type: String, required: true },
  },
  computed: {
    idValue() {
      return this.result?.[this.idKey] || null;
    },
  },
};
</script>
