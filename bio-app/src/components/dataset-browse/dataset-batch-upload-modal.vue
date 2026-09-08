<template>
  <div class="modal-inner dataset-batch-upload-modal">
    <div class="modal-header">
      <div class="model-header__left">
        <div class="modal-title">Batch Upload</div>
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

    <div class="modal-body auto-width dataset-batch-upload-modal__body">
      <div class="form1">
        <div class="form-group">
          <div class="download-label">Download a template, fill in your data, then upload:</div>
          <div class="download-links">
            <a
              v-for="item in templateLinks"
              :key="item.type"
              class="download-link"
              :class="{ disabled: busy || downloadingType === item.type }"
              @click="downloadTemplate(item.type)"
            >
              {{ item.label }}
              <span v-if="downloadingType === item.type"> (downloading…)</span>
            </a>
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Excel File</div>
          </div>
          <div class="form-input-box">
            <input
              ref="fileInput"
              class="form-input"
              type="file"
              accept=".xlsx"
              :disabled="busy"
              @change="onFileChange"
            >
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ fileError }}</div>
          </div>
          <div v-if="selectedFile" class="form-file-box">
            <div class="form-file-box__left">
              <div class="form-file__file-name">{{ selectedFile.name }}</div>
            </div>
            <div class="form-file-box__right">
              <a
                v-if="!busy"
                class="form-file-box__remove-btn"
                @click="clearFile"
              >Remove</a>
            </div>
          </div>
        </div>

        <div
          v-if="showStatus"
          class="dataset-batch-upload-modal__status"
        >
          <div v-if="uploadState.polling" class="dataset-batch-upload-modal__progress">
            <div class="dataset-batch-upload-modal__progress-label">
              {{ statusLabel }}<span v-if="uploadState.progress != null"> — {{ uploadState.progress }}%</span>
            </div>
            <div class="dataset-batch-upload-modal__progress-bar">
              <div
                class="dataset-batch-upload-modal__progress-fill"
                :style="{ width: `${Math.min(100, Math.max(0, Number(uploadState.progress) || 0))}%` }"
              />
            </div>
          </div>
          <div v-if="uploadState.message" class="dataset-batch-upload-modal__message">
            {{ uploadState.message }}
          </div>
          <div v-if="uploadState.errorMsg" class="form-err">
            <div class="form-err-text">{{ uploadState.errorMsg }}</div>
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
          :class="{ disabled: busy || !selectedFile }"
          @click="onSubmit"
        >Upload</a>
      </div>
    </div>
  </div>
</template>

<script>
const TEMPLATE_LINKS = [
  { type: 'part', label: 'Part template (.xlsx)' },
  { type: 'backbone', label: 'Backbone template (.xlsx)' },
  { type: 'plasmid', label: 'Plasmid template (.xlsx)' },
];

const TEMPLATE_FILENAMES = {
  part: 'part_template.xlsx',
  backbone: 'backbone_template.xlsx',
  plasmid: 'plasmid_template.xlsx',
};

export default {
  name: 'dataset-batch-upload-modal',
  props: {
    show: {
      type: Boolean,
      default: false,
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
      templateLinks: TEMPLATE_LINKS,
      selectedFile: null,
      fileError: '',
      downloadingType: '',
    };
  },
  computed: {
    busy() {
      return Boolean(this.uploadState.submitting || this.uploadState.polling);
    },
    showStatus() {
      return this.uploadState.polling
        || this.uploadState.message
        || this.uploadState.errorMsg;
    },
    statusLabel() {
      const status = String(this.uploadState.status || '').toLowerCase();
      if (status === 'completed') return 'Completed';
      if (status === 'failed') return 'Failed';
      if (status === 'running') return 'Processing';
      if (status === 'pending') return 'Pending';
      return 'Uploading';
    },
  },
  watch: {
    show(value) {
      if (value) {
        this.resetForm();
      }
    },
  },
  methods: {
    resetForm() {
      this.selectedFile = null;
      this.fileError = '';
      this.downloadingType = '';
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    onFileChange(event) {
      const file = event.target.files?.[0] || null;
      this.selectedFile = file;
      this.fileError = file ? '' : 'An Excel file is required';
    },
    clearFile() {
      this.selectedFile = null;
      this.fileError = 'An Excel file is required';
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    async downloadTemplate(datasetType) {
      if (this.busy || this.downloadingType) {
        return;
      }

      this.downloadingType = datasetType;

      try {
        const res = await axios.get('datasets/browse/upload-template', {
          params: { datasetType },
          responseType: 'blob',
        });

        const contentType = String(res.headers['content-type'] || '').toLowerCase();
        if (contentType.includes('application/json')) {
          const text = await res.data.text();
          let message = 'Template not found';
          try {
            const payload = JSON.parse(text);
            message = payload.msg || message;
          } catch (e) {
            // keep default message
          }
          alert(message);
          return;
        }

        const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
        const filename = TEMPLATE_FILENAMES[datasetType] || `${datasetType}_template.xlsx`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        alert('Failed to download template.');
      } finally {
        this.downloadingType = '';
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
      if (!this.selectedFile) {
        this.fileError = 'An Excel file is required';
        return;
      }

      this.$emit('submit', {
        file: this.selectedFile,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.dataset-batch-upload-modal__body {
  min-width: 520px;
}

.download-link.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.dataset-batch-upload-modal__status {
  margin-top: 4px;
}

.dataset-batch-upload-modal__progress-label {
  color: var(--label-gray);
  font-size: 13px;
  margin-bottom: 8px;
}

.dataset-batch-upload-modal__progress-bar {
  height: 6px;
  border-radius: 999px;
  background: #f0f0f5;
  overflow: hidden;
}

.dataset-batch-upload-modal__progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.2s ease;
}

.dataset-batch-upload-modal__message {
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
