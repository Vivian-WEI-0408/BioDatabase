<template>
  <div class="data-table">
    <div class="res-title">Result List</div>
    <table>
      <thead>
        <tr>
          <td></td>
          <td>Sequence</td>
          <td v-if="showExpected">Expected</td>
          <td v-if="showPredicted">Predicted</td>
          <td>Strength</td>
          <td>Binding Energy</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(v, i) in rows" :key="i">
          <td>{{ i + 1 }}</td>
          <td style="max-width: 300px; white-space: wrap;">
            <div class="characters">
              <span
                v-for="(c, j) in v.characters"
                :key="j"
                v-tooltip="{ content: v.charactersTooltipDict[j], html: true }"
                :style="{ color: c.color }"
              >{{ c.char }}</span>
            </div>
          </td>
          <td v-if="showExpected">{{ v.strength.toFixed(2) }}</td>
          <td v-if="showPredicted">{{ v.predictedStrength.toFixed(3) }}</td>
          <td v-if="!showExpected && !showPredicted">{{ v.strength.toFixed(5) }}</td>
          <td>{{ v.bindingEnergy.toFixed(5) }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="regions.length" class="regions">
      <span
        v-for="(v, i) in regions"
        :key="i"
        class="region"
        :style="{ color: v.color }"
      >{{ v.name }}{{ i < regions.length - 1 ? ';' : '' }}</span>
    </div>
  </div>
</template>

<script>
import { enrichSequenceResultList } from './tpro-result-utils.js';

export default {
  name: 'promoter-sequence-result',
  props: {
    result: { type: Object, required: true },
    mode: {
      type: String,
      default: 'predict',
      validator: (value) => ['generate', 'predict'].includes(value),
    },
  },
  computed: {
    rows() {
      return enrichSequenceResultList(this.result?.resultList || []);
    },
    regions() {
      return this.result?.regions || [];
    },
    showExpected() {
      return this.mode === 'generate';
    },
    showPredicted() {
      return this.mode === 'generate';
    },
  },
};
</script>
