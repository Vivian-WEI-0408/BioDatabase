<template>
  <div class="data-table">
    <div class="res-title">Optimization Result</div>
    <div class="scroll-box" style="max-height: 600px;">
      <table>
        <thead style="display: none;">
          <tr>
            <td style="width: 120px;"></td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="label">Regulator name</td>
            <td class="align-left">{{ form.regulatorName }}</td>
          </tr>
          <tr>
            <td class="label">Regulation type</td>
            <td class="align-left">{{ form.regulationType }}</td>
          </tr>
          <tr>
            <td class="label">Optimized target value</td>
            <td class="align-left">
              <span>{{ form.subtarget1Name }}({{ optimizedTarget.subtargets[0].value.toFixed(2) }})</span>
              <span style="padding: 0 4px;" v-html="form.targetReduction"></span>
              <span>{{ form.subtarget2Name }}({{ optimizedTarget.subtargets[1].value.toFixed(2) }})</span>
              <span style="padding: 0 4px;">=</span>
              <span>{{ optimizedTarget.value.toFixed(2) }}</span>
            </td>
          </tr>
          <tr>
            <td class="label">Optimized condition variables</td>
            <td class="align-left">
              <div class="point-lines">
                <div>Source gene = {{ optimizedConditions[0].value }}</div>
                <div>
                  Promoter binding energy = {{ optimizedConditions[1].value.toFixed(2) }}
                  <i>k</i><sub>B</sub><i>T</i>
                </div>
                <div
                  v-if="optimizedConditions[2].value.length > 1"
                  v-for="(v, i) in optimizedConditions[2].value"
                  :key="'tf-' + i"
                >TF expression (TF {{ i + 1 }}) = {{ v.toFixed(2) }}</div>
                <div v-else>TF expression = {{ optimizedConditions[2].value[0].toFixed(2) }}</div>
                <div
                  v-if="optimizedConditions[3].value.length > 1"
                  v-for="(v, i) in optimizedConditions[3].value"
                  :key="'inducer-' + i"
                >Inducer concentration (TF {{ i + 1 }}) = {{ v.toFixed(5) }} mol/L</div>
                <div v-else>Inducer concentration = {{ optimizedConditions[3].value[0].toFixed(5) }} mol/L</div>
              </div>
            </td>
          </tr>
          <template v-if="targetBase64.length > 1">
            <tr v-for="(v, i) in targetBase64" :key="'chart-' + i">
              <td class="label">Target landscape TF({{ i + 1 }})</td>
              <td class="align-left">
                <img class="chart-img" :src="'data:image/png;base64,' + v" alt="">
              </td>
            </tr>
          </template>
          <tr v-else>
            <td class="label">Target landscape</td>
            <td class="align-left">
              <img class="chart-img" :src="'data:image/png;base64,' + targetBase64[0]" alt="">
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'regulation-optimize-result',
  props: {
    result: { type: Object, required: true },
  },
  computed: {
    form() {
      return this.result?.form || {};
    },
    optimizedTarget() {
      return this.result?.optimizedTarget || { subtargets: [{ value: 0 }, { value: 0 }], value: 0 };
    },
    optimizedConditions() {
      return this.result?.optimizedConditions || [
        { value: '' },
        { value: 0 },
        { value: [0] },
        { value: [0] },
      ];
    },
    targetBase64() {
      return this.result?.targetBase64 || [];
    },
  },
};
</script>
