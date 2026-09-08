<template>
  <div class="dashboard-card storage-chart">
    <div class="dashboard-card__header">
      <div class="dashboard-card__title">Workspace Storage</div>
      <button type="button" class="dashboard-card__menu-btn" aria-label="More">
        <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
          <circle cx="2" cy="2" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="8" r="2" fill="#030229" fill-opacity="0.5" />
          <circle cx="2" cy="14" r="2" fill="#030229" fill-opacity="0.5" />
        </svg>
      </button>
    </div>
    <div class="storage-chart__body">
      <div class="storage-chart__ring-wrap">
        <div ref="chartEl" class="storage-chart__canvas"></div>
        <div class="storage-chart__center">
          <div class="storage-chart__percent">{{ availablePercent }}%</div>
          <div class="storage-chart__label">Available Space</div>
        </div>
      </div>
      <div class="storage-chart__legend">
        <span class="storage-chart__legend-dot"></span>
        <span class="storage-chart__legend-text">{{ totalMB.toLocaleString() }} MB</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'storage-chart',
  props: {
    availablePercent: { type: Number, default: 70 },
    totalMB: { type: Number, default: 1024 },
  },
  data() {
    return {
      chart: null,
    };
  },
  computed: {
    usedPercent() {
      return 100 - this.availablePercent;
    },
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
        series: [
          {
            type: 'pie',
            radius: ['68%', '88%'],
            center: ['50%', '50%'],
            silent: true,
            label: { show: false },
            data: [
              {
                value: this.availablePercent,
                itemStyle: { color: '#5b93ff' },
              },
              {
                value: this.usedPercent,
                itemStyle: { color: '#efefef' },
              },
            ],
          },
        ],
      });
    },
  },
};
</script>
