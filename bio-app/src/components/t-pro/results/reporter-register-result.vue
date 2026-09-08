<template>
  <register-result-base :result="result" id-key="reporterID" />
</template>

<script>
import RegisterResultBase from './register-result-base.vue';

export default {
  name: 'reporter-register-result',
  components: { RegisterResultBase },
  props: {
    result: { type: Object, required: true },
  },
};
</script>
