<template>
  <div class="item-detail-test-data">
    <div class="item-detail-section-tag">Test Data</div>
    <div class="item-detail-test-data__card">
      <div class="item-detail-test-data__top">
        <div class="item-detail-test-data__tables">
          <table class="item-detail-table">
            <thead>
              <tr>
                <th
                  v-for="column in testData.parameterTable.columns"
                  :key="column"
                >{{ column }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in testData.parameterTable.rows"
                :key="row.label"
              >
                <td>{{ row.label }}</td>
                <td v-for="(value, index) in row.values" :key="index">{{ value }}</td>
              </tr>
            </tbody>
          </table>

          <table class="item-detail-table item-detail-table--env">
            <tbody>
              <tr
                v-for="row in testData.environmentTable.rows"
                :key="row.label"
              >
                <th scope="row">{{ row.label }}</th>
                <td>{{ row.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="item-detail-test-data__diagram">
          <img
            :src="testData.circuitImage"
            alt="Circuit context diagram"
            class="item-detail-test-data__diagram-img"
            loading="lazy"
          >
        </div>
      </div>

      <h3 class="item-detail-test-data__heading">Test Method Description</h3>
      <p class="item-detail-test-data__method">{{ testData.methodDescription }}</p>

      <h3 class="item-detail-test-data__heading">Test Result</h3>
      <div class="item-detail-test-data__result">
        <img
          :src="testData.resultImage"
          alt="Test result charts"
          class="item-detail-test-data__result-img"
          loading="lazy"
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'item-detail-test-data',
  props: {
    testData: {
      type: Object,
      required: true,
    },
  },
};
</script>
