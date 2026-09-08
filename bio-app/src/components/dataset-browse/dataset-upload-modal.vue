<template>
  <div class="modal-inner dataset-upload-modal">
    <div class="modal-header">
      <div class="model-header__left">
        <div class="modal-title">Upload Map</div>
      </div>
      <div class="modal-header__right">
        <div
          class="modal-close-btn"
          :class="{ 'modal-close-btn--disabled': busy }"
          @click="onClose"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="modal-close-icon">
            <path
              opacity="0.8"
              d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>

    <div class="modal-body auto-width dataset-upload-modal__body">
      <div class="form1">
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Dataset Type</div>
          </div>
          <div class="form-input-box">
            <select
              v-model="localDatasetType"
              class="form-input"
              :disabled="busy"
            >
              <option value="part">Part</option>
              <option value="backbone">Backbone</option>
              <option value="plasmid">Plasmid</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Sequence Files</div>
          </div>
          <div class="form-input-box">
            <input
              ref="fileInput"
              class="form-input"
              type="file"
              multiple
              accept=".fasta,.fa,.gb,.gbk,.ape,.str,.dna"
              :disabled="busy"
              @change="onFileChange"
            >
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ fileError }}</div>
          </div>
          <div v-if="selectedFiles.length" class="dataset-upload-modal__file-list">
            <div
              v-for="(file, index) in selectedFiles"
              :key="`${file.name}-${index}`"
              class="form-file-box"
            >
              <div class="form-file-box__left">
                <div class="form-file__file-name">{{ file.name }}</div>
              </div>
              <div class="form-file-box__right">
                <a
                  v-if="!busy"
                  class="form-file-box__remove-btn"
                  @click="removeFile(index)"
                >Remove</a>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              v-model="saveFeature"
              type="checkbox"
              :disabled="busy"
            >
            Save feature annotations
          </label>
        </div>

        <div
          v-if="showStatus"
          class="dataset-upload-modal__status"
        >
          <div v-if="busy" class="dataset-upload-modal__progress">
            <div class="dataset-upload-modal__progress-label">
              {{ statusLabel }}
            </div>
            <div class="dataset-upload-modal__progress-bar dataset-upload-modal__progress-bar--indeterminate">
              <div class="dataset-upload-modal__progress-fill dataset-upload-modal__progress-fill--indeterminate" />
            </div>
          </div>
          <div v-if="uploadState.message" class="dataset-upload-modal__message">
            {{ uploadState.message }}
          </div>
          <div v-if="uploadState.errorMsg" class="form-err">
            <div class="form-err-text" style="white-space: pre-line">{{ uploadState.errorMsg }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <div class="form-buttons">
        <a
          class="btn btn-outline"
          :class="{ disabled: busy }"
          @click="onClose"
        >Cancel</a>
        <a
          class="btn btn-primary"
          :class="{ disabled: busy || !selectedFiles.length }"
          @click="onSubmit"
        >Upload</a>
      </div>
    </div>
  </div>
</template>

<script>
const DATASET_TYPES = ['part', 'backbone', 'plasmid'];

function normalizeDatasetType(value) {
  const normalized = String(value || 'part').trim().toLowerCase();
  return DATASET_TYPES.includes(normalized) ? normalized : 'part';
}

export default {
  name: 'dataset-upload-modal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    datasetType: {
      type: String,
      default: 'part',
    },
    uploadState: {
      type: Object,
      default: () => ({
        submitting: false,
        polling: false,
        status: '',
        progress: 0,
        message: '',
        errorMsg: '',
      }),
    },
  },
  emits: ['close', 'submit', 'update:show'],
  data() {
    return {
      localDatasetType: 'part',
      selectedFiles: [],
      saveFeature: true,
      fileError: '',
    };
  },
  computed: {
    busy() {
      return Boolean(this.uploadState.submitting || this.uploadState.polling);
    },
    showStatus() {
      return this.uploadState.submitting
        || this.uploadState.polling
        || this.uploadState.message
        || this.uploadState.errorMsg;
    },
    statusLabel() {
      const status = String(this.uploadState.status || '').toLowerCase();
      if (status === 'completed') return 'Completed';
      if (status === 'failed') return 'Failed';
      if (status === 'running') return 'Processing';
      if (status === 'pending') return 'Pending';
      if (this.uploadState.submitting) return 'Processing';
      return 'Uploading';
    },
  },
  watch: {
    show(value) {
      if (value) {
        this.resetForm();
      }
    },
    datasetType: {
      immediate: true,
      handler(value) {
        this.localDatasetType = normalizeDatasetType(value);
      },
    },
  },
  methods: {
    resetForm() {
      this.localDatasetType = normalizeDatasetType(this.datasetType);
      this.selectedFiles = [];
      this.saveFeature = true;
      this.fileError = '';
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    onFileChange(event) {
      const files = Array.from(event.target.files || []);
      this.selectedFiles = files;
      this.fileError = files.length ? '' : 'At least one file is required';
    },
    removeFile(index) {
      this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
      this.fileError = this.selectedFiles.length ? '' : 'At least one file is required';
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    onClose() {
      if (this.busy) {
        return;
      }
      this.$emit('close');
      this.$emit('update:show', false);
    },
    onSubmit() {
      if (this.busy) {
        return;
      }
      if (!this.selectedFiles.length) {
        this.fileError = 'At least one file is required';
        return;
      }

      this.$emit('submit', {
        files: [...this.selectedFiles],
        datasetType: normalizeDatasetType(this.localDatasetType),
        saveFeature: this.saveFeature,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.dataset-upload-modal__body {
  min-width: 520px;
}

.dataset-upload-modal__file-list {
  margin-top: 8px;
}

.dataset-upload-modal__status {
  margin-top: 4px;
}

.dataset-upload-modal__progress-label {
  color: var(--label-gray);
  font-size: 13px;
  margin-bottom: 8px;
}

.dataset-upload-modal__progress-bar {
  height: 6px;
  border-radius: 999px;
  background: #f0f0f5;
  overflow: hidden;
}

.dataset-upload-modal__progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.2s ease;
}

.dataset-upload-modal__progress-bar--indeterminate {
  position: relative;
}

.dataset-upload-modal__progress-fill--indeterminate {
  width: 40%;
  animation: dataset-upload-indeterminate 1.2s ease-in-out infinite;
}

@keyframes dataset-upload-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}

.dataset-upload-modal__message {
  margin-top: 10px;
  color: var(--text);
  font-size: 13px;
  line-height: 1.4;
}

.modal-close-btn--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
