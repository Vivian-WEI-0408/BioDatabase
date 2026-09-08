<template>
  <div class="tplot-panel tplot-panel--assembly">
    <div class="tplot-panel__title">Assembly</div>
    <p class="tplot-panel__desc">
      There is currently no description available for this feature.
    </p>
    <div class="tplot-panel__assembly-actions">
      <a
        class="btn btn-primary tplot-panel__assembly-btn"
        :class="{ disabled: assembling || downloading }"
        @click="onAssembly"
      >
        {{ assembling ? 'Assembling...' : 'Assembly' }}
      </a>
      <a
        class="btn btn-primary tplot-panel__assembly-btn"
        :class="{ disabled: assembling || downloading }"
        @click="onDownload"
      >
        {{ downloading ? 'Downloading...' : 'Download' }}
      </a>
    </div>
  </div>
</template>

<script>
import {
  getTplotErrorMessage,
  toFormParams,
  triggerBlobDownload,
} from '../../assets/js/tplot-api.js';

export default {
  name: 'assembly-panel',
  props: {
    optimizationResults: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      assembling: false,
      downloading: false,
      downloadFileId: null,
      downloadName: 'Level3.gb',
    };
  },
  methods: {
    requireOptimizationResults() {
      if (this.optimizationResults?.dbd && this.optimizationResults?.lbd && this.optimizationResults?.l != null) {
        return true;
      }
      Swal.fire({
        icon: 'warning',
        title: 'Optimization required',
        text: 'Please run Optimization first to get DBD, LBD and L.',
        confirmButtonColor: '#605bff',
      });
      return false;
    },
    async onAssembly() {
      if (this.assembling || this.downloading) return;
      if (!this.requireOptimizationResults()) return;

      this.assembling = true;
      try {
        const params = toFormParams({
          LBD: this.optimizationResults.lbd,
          DBD: this.optimizationResults.dbd,
          L: this.optimizationResults.l,
        });
        const res = await tplotApi.post('Assembly', params);
        this.downloadFileId = res?.data?.download_file_id || null;
        this.downloadName = `${res?.data?.level3_plan_name || 'Level3'}.gb`;
        if (!this.downloadFileId) throw new Error('Assembly returned no bio-app file ID.');
        Swal.fire({
          icon: 'success',
          title: 'Assembly finished',
          text: 'Assembly completed successfully.',
          confirmButtonColor: '#605bff',
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Assembly failed',
          text: getTplotErrorMessage(error, 'Assembly request failed.'),
          confirmButtonColor: '#605bff',
        });
      } finally {
        this.assembling = false;
      }
    },
    async onDownload() {
      if (this.assembling || this.downloading) return;
      if (!this.downloadFileId) {
        Swal.fire({ icon: 'warning', text: 'Please run Assembly first.', confirmButtonColor: '#605bff' });
        return;
      }

      this.downloading = true;
      try {
        const res = await axios.get(`files/download/${this.downloadFileId}`, { responseType: 'blob' });
        triggerBlobDownload(res.data, this.downloadName);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Download failed',
          text: getTplotErrorMessage(error, 'Failed to download assembly product.'),
          confirmButtonColor: '#605bff',
        });
      } finally {
        this.downloading = false;
      }
    },
  },
};
</script>
