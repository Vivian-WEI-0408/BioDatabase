<template>
  <div class="tpro-register-result">
    <div class="res-title">Regulator Registration Result</div>
    <p v-if="result.message">{{ result.message }}</p>
    <p v-if="result.label"><b>Name:</b> {{ result.label }}</p>
    <p v-if="result.regulatorID"><b>ID:</b> {{ result.regulatorID }}</p>
    <div v-if="scoreRows.length" class="data-table">
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Training</th>
            <th>Testing</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in scoreRows" :key="row.key">
            <td>{{ row.key }}</td>
            <td>{{ formatScore(row.training) }}</td>
            <td>{{ formatScore(row.testing) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="result.correlationBase64" class="tpro-register-result__images">
      <img :src="`data:image/png;base64,${result.correlationBase64}`" alt="Correlation plot">
    </div>
    <div v-if="profiles.length" class="tpro-register-result__images">
      <div v-for="(profile, i) in profiles" :key="i" class="tpro-register-result__image-item">
        <div class="tpro-register-result__image-label">Profile {{ i + 1 }}</div>
        <img v-if="profile" :src="`data:image/png;base64,${profile}`" alt="Profile plot">
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'regulator-register-result',
  props: {
    result: { type: Object, required: true },
  },
  computed: {
    scoreRows() {
      const training = this.result?.trainingScores || {};
      const testing = this.result?.testingScores || {};
      const keys = [...new Set([...Object.keys(training), ...Object.keys(testing)])];
      return keys.map((key) => ({
        key,
        training: training[key],
        testing: testing[key],
      }));
    },
    profiles() {
      return (this.result?.profileBase64 || []).filter(Boolean);
    },
  },
  methods: {
    formatScore(value) {
      return value == null ? '—' : Number(value).toFixed(4);
    },
  },
};
</script>
