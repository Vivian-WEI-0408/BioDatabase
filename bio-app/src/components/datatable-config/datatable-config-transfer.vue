<template>
  <div class="datatable-config-card datatable-config-card--transfer">
    <div class="datatable-config-card__title">Data Transfer</div>

    <div class="datatable-config-transfer-section">
      <div class="datatable-config-transfer-section__label">Export</div>
      <button
        type="button"
        class="datatable-config-transfer-btn btn btn-mint"
        @click="downloadData"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="datatable-config-transfer-btn__icon">
          <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M2 12V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V12" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        Download Data
      </button>
    </div>

    <div class="datatable-config-transfer-section">
      <div class="datatable-config-transfer-section__label">Import</div>
      <div class="datatable-config-transfer-section__actions">
        <button
          type="button"
          class="datatable-config-transfer-btn btn btn-mint"
          @click="downloadTemplate"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="datatable-config-transfer-btn__icon">
            <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M2 12V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V12" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          CSV Template
        </button>
        <button
          type="button"
          class="datatable-config-transfer-btn btn btn-primary"
          @click="triggerUpload"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="datatable-config-transfer-btn__icon">
            <path d="M8 14V6M8 6L5 9M8 6L11 9" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M2 3V4C2 4.55228 2.44772 5 3 5H13C13.5523 5 14 4.55228 14 4V3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          Upload Data
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".csv,text/csv"
          class="datatable-config-transfer__file-input"
          @change="onFileSelected"
        >
      </div>
    </div>
  </div>
</template>

<script>
function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default {
  name: 'datatable-config-transfer',
  props: {
    tableName: { type: String, default: 'data-table' },
  },
  methods: {
    safeFilename() {
      return this.tableName.trim().replace(/\s+/g, '-').toLowerCase() || 'data-table';
    },
    downloadData() {
      const filename = `${this.safeFilename()}.csv`;
      const content = 'id,name,value\n0001,Sample A,100\n0002,Sample B,200\n';
      downloadCsv(filename, content);
      A.toast('Download started.');
    },
    downloadTemplate() {
      const filename = `${this.safeFilename()}-template.csv`;
      const content = 'id,name,value\n';
      downloadCsv(filename, content);
      A.toast('Template downloaded.');
    },
    triggerUpload() {
      this.$refs.fileInput.click();
    },
    onFileSelected(event) {
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (!file) {
        return;
      }
      A.toast(`${file.name} uploaded successfully!`);
    },
  },
};
</script>
