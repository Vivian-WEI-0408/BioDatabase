<template>
  <div class="tplot-panel tplot-panel--dimer">
    <div class="tplot-panel__title">Dimer Plot</div>
    <p class="tplot-panel__desc">
      Use the figure below to explore how changes to the various parameter values.
      The Dimer module plot are colored in blue while the NR module plot are colored in pink.
      The figure was generated using the <b>Bokeh</b> plotting framework.
    </p>
    <iframe
      class="tplot-panel__form tplot-panel__chart tplot-panel__embed"
      :src="plotUrl"
      title="TFDesignWeb TPlot"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
    />
  </div>
</template>

<script>
const DEFAULT_PLOT_URL = '/tplot-api/TFPlot';

export default {
  name: 'dimer-plot-panel',
  computed: {
    plotUrl() {
      return import.meta.env.VITE_TPLOT_PLOT_URL || DEFAULT_PLOT_URL;
    },
  },
};
</script>
