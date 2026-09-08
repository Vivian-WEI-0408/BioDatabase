<template>
  <div>
    <div class="data-table">
      <div class="res-title">Selected submotifs</div>
      <table>
        <thead>
          <tr>
            <th v-for="(label, i) in spLabels" :key="i">-{{ label }} region</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(_, rowIndex) in firstColumn" :key="rowIndex">
            <td v-for="(column, colIndex) in submotifList" :key="colIndex">
              {{ column[rowIndex] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="link-box">
      <div class="res-title">Combinations of submotifs</div>
      <div class="lines scroll-box" style="max-height: 200px;">
        <div v-for="(combination, i) in combinationList" :key="i" class="item">
          <div class="line">
            <span>{{ combination[0] }}</span>
            <span class="separator"> - </span>
            <span>{{ combination[1] }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'promoter-library-result',
  props: {
    result: { type: Object, required: true },
  },
  computed: {
    spLabels() {
      return this.result?.spLabels || [];
    },
    submotifList() {
      return this.result?.submotifList || [];
    },
    combinationList() {
      return this.result?.combinationList || [];
    },
    firstColumn() {
      return this.submotifList[0] || [];
    },
  },
};
</script>

<style lang="scss" scoped>
.link-box {
  .lines {
    border: 1.5px solid var(--border);
    padding: 10px;

    .item {
      .line {
        padding: 6px 20px;
        display: flex;
        gap: 10px;
        align-items: center;
        border-radius: 3px;
        border: 1px solid transparent;

        .separator {
          font-size: 20px;
        }

        &:hover {
          border-color: var(--primary);
          color: var(--primary);
          cursor: pointer;
          font-weight: 600;
        }
      }
    }
  }
}
</style>
