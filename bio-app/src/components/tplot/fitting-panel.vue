<template>
  <div class="tplot-panel tplot-panel--fitting">
    <div class="tplot-panel__title">Fitting</div>
    <p class="tplot-panel__desc">
      Upload Part is used to upload experimental data file to fit the transcription factor parameters.
      The format of data file used to upload must be same as template.
    </p>
    <div class="tplot-panel__template">
      <p class="tplot-panel__template-label">Download a template to fill in the experimental data:</p>
      <a class="tplot-panel__template-link" @click="onDownloadTemplate">Experimental Data Template</a>
    </div>
    <div class="form1 activator-form tplot-panel__form">
      <div class="form-group">
        <div class="form-label-top">
          <div class="form-label-text">Algorithm</div>
        </div>
        <div class="form-input-box">
          <select-box
            placeholder="Select algorithm"
            :items="algorithmOptions"
            :model-value="algorithm"
            @select="$emit('update:algorithm', $event)"
          />
        </div>
      </div>
      <div class="form-group">
        <div class="form-label-top">
          <div class="form-label-text">I0</div>
        </div>
        <div class="form-input-box">
          <select-box
            placeholder="Select I0"
            :items="i0Options"
            :model-value="i0"
            @select="$emit('update:i0', $event)"
          />
        </div>
      </div>
      <div class="form-group">
        <div class="form-label-top">
          <div class="form-label-text">Experimental Data</div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          multiple
          style="display: none"
          @change="onFileChange"
        />
        <div v-if="uploadedFiles.length" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;">
          <upload-file-row
            v-for="(file, index) in uploadedFiles"
            :key="file.key || file.name + '-' + index"
            :file="file"
            @clear="$emit('clear-files')"
          />
        </div>
        <a
          class="btn btn-primary"
          :class="{ disabled: uploading }"
          style="min-width: 140px; height: 40px; font-size: 14px;"
          @click="openFilePicker"
        >
          {{ uploading ? 'Uploading...' : (uploadedFiles.length ? 'Replace files' : 'Select CSV files') }}
        </a>
      </div>
    </div>
    <div v-if="fittingResults" class="tplot-results">
      <div class="tplot-results__labels">
        <div>Fitted DBD:</div>
        <div>Fitted LBD:</div>
      </div>
      <div class="tplot-results__values">
        <div>{{ fittingResults.dbd }}</div>
        <div>{{ fittingResults.lbd }}</div>
      </div>
    </div>
    <div class="tplot-panel__actions">
      <a class="btn btn-danger" :class="{ disabled: fitting }" @click="$emit('reset')">Reset</a>
      <a class="btn btn-primary" :class="{ disabled: fitting || uploading }" @click="$emit('fitting')">
        {{ fitting ? 'Fitting...' : 'Fitting' }}
      </a>
    </div>
  </div>
</template>

<script>
import SelectBox from '../parts/select-box.vue';
import UploadFileRow from './upload-file-row.vue';
import { algorithmOptions, i0Options } from '../../data/tplot-mock.js';
import {
  getTplotErrorMessage,
  triggerBlobDownload,
} from '../../assets/js/tplot-api.js';

export default {
  name: 'fitting-panel',
  components: {
    SelectBox,
    UploadFileRow,
  },
  props: {
    algorithm: {
      type: Object,
      default: null,
    },
    i0: {
      type: Object,
      default: null,
    },
    uploadedFiles: {
      type: Array,
      default: () => [],
    },
    fittingResults: {
      type: Object,
      default: null,
    },
    uploading: {
      type: Boolean,
      default: false,
    },
    fitting: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:algorithm', 'update:i0', 'reset', 'fitting', 'files-selected', 'clear-files'],
  data() {
    return {
      algorithmOptions,
      i0Options,
      downloadingTemplate: false,
    };
  },
  methods: {
    openFilePicker() {
      if (this.uploading) return;
      this.$refs.fileInput?.click();
    },
    onFileChange(event) {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length === 0) return;
      this.$emit('files-selected', files);
    },
    async onDownloadTemplate() {
      if (this.downloadingTemplate) return;
      this.downloadingTemplate = true;
      try {
        // Flask route is historically misspelled as DownloadTempalte
        const res = await tplotApi.get('DownloadTempalte', { responseType: 'blob' });
        triggerBlobDownload(res.data, 'Template.csv');
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Download failed',
          text: getTplotErrorMessage(error, 'Failed to download template.'),
          confirmButtonColor: '#605bff',
        });
      } finally {
        this.downloadingTemplate = false;
      }
    },
  },
};
</script>
