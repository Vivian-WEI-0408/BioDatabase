<template>
  <div class="dashboard-card task-stats-chart">
    <div class="dashboard-card__header">
      <div class="dashboard-card__title">Computation Task Statistics</div>
      <button type="button" class="dashboard-card__menu-btn" aria-label="More">
        <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
          <circle cx="2" cy="2" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="8" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="14" r="2" fill="#030229" fill-opacity="0.5" />
        </svg>
      </button>
    </div>
    <div ref="chartEl" class="task-stats-chart__canvas"></div>
  </div>
</template>

<script>
export default {
  name: 'task-stats-chart',
  props: {
    dates: { type: Array, default: () => [] },
    values: { type: Array, default: () => [] },
  },
  data() {
    return {
      chart: null,
    };
  },
  mounted() {
    this.initChart();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    handleResize() {
      if (this.chart) {
        this.chart.resize();
      }
    },
    initChart() {
      const el = this.$refs.chartEl;
      if (!el || !window.echarts) {
        return;
      }

      this.chart = echarts.init(el);
      this.chart.setOption({
        grid: {
          left: 40,
          right: 20,
          top: 20,
          bottom: 30,
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#030229',
          borderWidth: 0,
          textStyle: { color: '#fff' },
          formatter(params) {
            const item = params[0];
            return `<div style="opacity:0.8;font-size:12px;">Num of Tasks</div><div style="font-size:16px;font-weight:600;">${item.value}</div>`;
          },
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.dates,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: 'rgba(3, 2, 41, 0.49)', fontSize: 12 },
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
          interval: 20,
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(3, 2, 41, 0.08)' } },
          axisLabel: { color: 'rgba(3, 2, 41, 0.49)', fontSize: 12 },
        },
        series: [
          {
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            showSymbol: false,
            emphasis: {
              focus: 'series',
              itemStyle: { color: '#6155f5', borderColor: '#fff', borderWidth: 2 },
            },
            lineStyle: {
              width: 3,
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#26c0e2' },
                { offset: 1, color: '#6155f5' },
              ]),
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(97, 85, 245, 0.25)' },
                { offset: 1, color: 'rgba(38, 192, 226, 0.02)' },
              ]),
            },
            data: this.values,
          },
        ],
      });
    },
  },
};
</script>
