<template>
  <register-result-base :result="result" id-key="generatorID" />
</template>

<script>
import RegisterResultBase from './register-result-base.vue';

export default {
  name: 'generator-register-result',
  components: { RegisterResultBase },
  props: {
    result: { type: Object, required: true },
  },
};
</script>
