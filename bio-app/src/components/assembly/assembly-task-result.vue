<template>
  <div class="assembly-result">
    <div class="res-title">Assembly Result</div>
    <div v-if="!assemblies.length" class="tasks-empty">No assembly products were returned.</div>
    <article v-for="(assembly, index) in assemblies" :key="`${assembly.plasmidId || index}-${index}`" class="assembly-result__item">
      <div class="assembly-result__heading">
        <div>
          <h3>{{ assembly.plasmidName || `Assembly ${index + 1}` }}</h3>
          <span v-if="assembly.plasmidId">Plasmid ID: {{ assembly.plasmidId }}</span>
        </div>
        <span class="assembly-result__status">Completed</span>
      </div>

      <div class="assembly-result__metrics">
        <div><span>Enzyme</span><strong>{{ assembly.enzyme || '-' }}</strong></div>
        <div><span>Length</span><strong>{{ formatLength(assembly.length) }}</strong></div>
        <div><span>Files</span><strong>{{ filesOf(assembly).length }}</strong></div>
      </div>

      <div v-if="filesOf(assembly).length" class="assembly-result__files">
        <div v-for="file in filesOf(assembly)" :key="file.id" class="assembly-result__file">
          <div>
            <strong>{{ file.originalName || file.name || `File ${file.id}` }}</strong>
            <span>{{ file.extension || file.category || 'result file' }}<template v-if="file.sizeBytes != null"> · {{ formatSize(file.sizeBytes) }}</template></span>
          </div>
          <button type="button" class="btn btn-outline" :disabled="downloadingId === file.id" @click="download(file)">
            {{ downloadingId === file.id ? 'Downloading...' : 'Download' }}
          </button>
        </div>
      </div>

      <div v-else class="assembly-result__downloads">
        <button v-if="assembly.downloadFileId" type="button" class="btn btn-outline" @click="downloadById(assembly.downloadFileId, `${assembly.plasmidName || 'assembly'}.gb`)">Download GenBank</button>
        <button v-if="assembly.archiveFileId" type="button" class="btn btn-primary" @click="downloadById(assembly.archiveFileId, `${assembly.plasmidName || 'assembly'}_results.zip`)">Download all results</button>
      </div>
    </article>
    <div v-if="downloadError" class="assembly-result__error">{{ downloadError }}</div>
  </div>
</template>

<script>
import { formatFileSize, triggerBlobDownload } from '../../assets/js/tplot-api.js';

export default {
  name: 'assembly-task-result',
  props: { result: { type: Object, required: true } },
  data() { return { downloadingId: null, downloadError: '' }; },
  computed: {
    assemblies() {
      if (Array.isArray(this.result?.assemblies)) return this.result.assemblies.filter(Boolean);
      if (this.result?.plasmidId || this.result?.files) return [this.result];
      return [];
    },
  },
  methods: {
    filesOf(assembly) { return Array.isArray(assembly?.files) ? assembly.files : []; },
    formatLength(value) { return Number.isFinite(Number(value)) ? `${Number(value).toLocaleString()} bp` : '-'; },
    formatSize(value) { return formatFileSize(value); },
    async download(file) { await this.downloadById(file.id, file.originalName || file.name || 'assembly-result'); },
    async downloadById(id, filename) {
      if (!id || this.downloadingId) return;
      this.downloadingId = id; this.downloadError = '';
      try {
        const response = await axios.get(`files/download/${id}`, { responseType: 'blob' });
        triggerBlobDownload(response.data, filename);
      } catch (error) {
        this.downloadError = error?.response?.data?.msg || error?.message || 'Failed to download result file.';
      } finally { this.downloadingId = null; }
    },
  },
};
</script>

<style scoped>
.assembly-result { width: 100%; }
.assembly-result__item { margin-top: 18px; padding: 20px; border: 1px solid #e7e6ef; border-radius: 10px; background: #fff; }
.assembly-result__heading, .assembly-result__file, .assembly-result__downloads { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.assembly-result__heading h3 { margin: 0 0 5px; color: #29283d; }
.assembly-result__heading span, .assembly-result__file span { display: block; color: #858496; font-size: 13px; }
.assembly-result__status { padding: 5px 10px; border-radius: 14px; color: #277a50 !important; background: #eaf8f1; }
.assembly-result__metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
.assembly-result__metrics div { padding: 12px; border-radius: 8px; background: #f8f8fb; }
.assembly-result__metrics span { display: block; color: #858496; font-size: 12px; margin-bottom: 5px; }
.assembly-result__files { display: grid; gap: 8px; }
.assembly-result__file { padding: 10px 12px; border: 1px solid #ecebf3; border-radius: 8px; }
.assembly-result__file strong { display: block; margin-bottom: 4px; word-break: break-all; }
.assembly-result__downloads { justify-content: flex-start; }
.assembly-result__error { margin-top: 14px; padding: 10px 12px; border-radius: 7px; color: #b33939; background: #fff1f1; }
@media (max-width: 700px) { .assembly-result__metrics { grid-template-columns: 1fr; } .assembly-result__file { align-items: flex-start; flex-direction: column; } }
</style>
