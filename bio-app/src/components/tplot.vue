<template>
  <div class="page-container tplot-page">
    <div class="page-header">
      <div class="page-title">TPlot</div>
    </div>
    <div class="page-body tplot-page__body">
      <dimer-plot-panel />
      <div class="tplot-page__middle">
        <fitting-panel
          :key="'fitting-' + resetKey"
          :algorithm="algorithm"
          :i0="i0"
          :uploaded-files="fittingFiles"
          :fitting-results="fittingResults"
          :uploading="uploading"
          :fitting="fitting"
          @update:algorithm="algorithm = $event"
          @update:i0="i0 = $event"
          @reset="onFittingReset"
          @fitting="onFitting"
          @files-selected="onFilesSelected"
          @clear-files="onClearFiles"
        />
        <assembly-panel :optimization-results="optimizationResults" />
      </div>
      <optimization-panel
        :key="'opt-' + resetKey"
        :alpha="alpha"
        :beta="beta"
        :lbd-optional="lbdOptional"
        :dbd-optional="dbdOptional"
        :results="optimizationResults"
        :optimizing="optimizing"
        @update:alpha="alpha = $event"
        @update:beta="beta = $event"
        @update:lbd-optional="lbdOptional = $event"
        @update:dbd-optional="dbdOptional = $event"
        @reset="onOptimizationReset"
        @optimize="onOptimize"
      />
    </div>
  </div>
</template>

<script>
import DimerPlotPanel from './tplot/dimer-plot-panel.vue';
import FittingPanel from './tplot/fitting-panel.vue';
import AssemblyPanel from './tplot/assembly-panel.vue';
import OptimizationPanel from './tplot/optimization-panel.vue';
import {
  formatFileSize,
  getTplotErrorMessage,
  optionalSelectValue,
  selectValue,
  toFormParams,
} from '../assets/js/tplot-api.js';

export default {
  name: 'tplot',
  components: {
    DimerPlotPanel,
    FittingPanel,
    AssemblyPanel,
    OptimizationPanel,
  },
  data() {
    return {
      algorithm: null,
      i0: null,
      fittingFiles: [],
      fittingUploadId: '',
      fittingResults: null,
      uploading: false,
      fitting: false,
      alpha: null,
      beta: null,
      lbdOptional: null,
      dbdOptional: null,
      optimizationResults: null,
      optimizing: false,
      resetKey: 0,
    };
  },
  methods: {
    onFittingReset() {
      this.algorithm = null;
      this.i0 = null;
      this.fittingFiles = [];
      this.fittingUploadId = '';
      this.fittingResults = null;
      this.uploading = false;
      this.fitting = false;
      this.resetKey += 1;
    },
    onClearFiles() {
      this.fittingFiles = [];
      this.fittingUploadId = '';
    },
    async onFilesSelected(files) {
      if (!files || files.length === 0) return;

      const formData = new FormData();
      files.forEach((file) => formData.append('file', file));

      this.uploading = true;
      try {
        const res = await tplotApi.post('UploadData', formData);
        const uploadId = res?.data?.upload_id;
        if (!uploadId) {
          throw new Error('Upload service did not return an upload_id.');
        }
        this.fittingUploadId = uploadId;
        this.fittingFiles = files.map((file, index) => ({
          key: `${file.name}-${file.size}-${index}-${Date.now()}`,
          name: file.name,
          size: formatFileSize(file.size),
          time: 'Uploaded',
        }));
      } catch (error) {
        this.fittingFiles = [];
        this.fittingUploadId = '';
        Swal.fire({
          icon: 'error',
          title: 'Upload failed',
          text: getTplotErrorMessage(error, 'Failed to upload experimental data.'),
          confirmButtonColor: '#605bff',
        });
      } finally {
        this.uploading = false;
      }
    },
    async onFitting() {
      if (this.fitting || this.uploading) return;

      if (!this.fittingFiles.length || !this.fittingUploadId) {
        Swal.fire({
          icon: 'warning',
          text: 'Please upload experimental data first.',
          confirmButtonColor: '#605bff',
        });
        return;
      }
      if (!this.algorithm) {
        Swal.fire({
          icon: 'warning',
          text: 'Please select an algorithm.',
          confirmButtonColor: '#605bff',
        });
        return;
      }

      const params = toFormParams({
        Algorithm: selectValue(this.algorithm),
        I0: selectValue(this.i0, ''),
        upload_id: this.fittingUploadId,
      });

      this.fitting = true;
      try {
        const res = await tplotApi.post('Fitting', params);
        const data = res.data || {};
        if (data.success === false) {
          throw new Error(data.message || data.msg || 'Fitting failed.');
        }
        this.fittingResults = {
          dbd: data.DBD ?? data.dbd ?? '',
          lbd: data.LBD ?? data.lbd ?? '',
        };
        Swal.fire({
          icon: 'success',
          title: 'Fitting succeeded',
          html: `DBD: <b>${this.fittingResults.dbd}</b><br>LBD: <b>${this.fittingResults.lbd}</b>`,
          confirmButtonColor: '#605bff',
        });
      } catch (error) {
        this.fittingResults = null;
        Swal.fire({
          icon: 'error',
          title: 'Fitting failed',
          text: getTplotErrorMessage(error, 'Fitting request failed.'),
          confirmButtonColor: '#605bff',
        });
      } finally {
        this.fitting = false;
      }
    },
    onOptimizationReset() {
      this.alpha = null;
      this.beta = null;
      this.lbdOptional = null;
      this.dbdOptional = null;
      this.optimizationResults = null;
      this.optimizing = false;
      this.resetKey += 1;
    },
    async onOptimize() {
      if (this.optimizing) return;

      const fields = {
        alpha: selectValue(this.alpha, '1'),
        beta: selectValue(this.beta, '1'),
      };
      const lbd = optionalSelectValue(this.lbdOptional);
      const dbd = optionalSelectValue(this.dbdOptional);
      if (lbd) fields.lbd = lbd;
      if (dbd) fields.dbd = dbd;

      this.optimizing = true;
      try {
        const res = await tplotApi.post('Opt', toFormParams(fields));
        const data = res.data || {};
        this.optimizationResults = {
          dbd: data.DBD ?? data.dbd ?? '',
          lbd: data.LBD ?? data.lbd ?? '',
          l: data.L ?? data.l ?? '',
          rpu: data.RPU != null ? Number(data.RPU).toFixed(1) : (data.rpu ?? ''),
        };
      } catch (error) {
        this.optimizationResults = null;
        Swal.fire({
          icon: 'error',
          title: 'Optimization failed',
          text: getTplotErrorMessage(error, 'Optimization request failed.'),
          confirmButtonColor: '#605bff',
        });
      } finally {
        this.optimizing = false;
      }
    },
  },
};
</script>
