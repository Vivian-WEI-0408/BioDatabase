<template>
  <div class="page-container assembly-tool-page">
    <div class="page-header">
      <div>
        <div class="page-title">Assembly Tool</div>
        <div class="assembly-tool__subtitle">Golden Gate assembly using records in Bio App</div>
      </div>
    </div>

    <div class="page-body assembly-tool__body">
      <div class="assembly-tool__tabs">
        <button v-for="item in tabs" :key="item.id" type="button"
          class="assembly-tool__tab" :class="{ active: tab === item.id }" @click="tab = item.id">
          {{ item.label }}
        </button>
      </div>

      <section v-if="tab === 'direct'" class="assembly-tool__panel">
        <h2>Direct assembly</h2>
        <p>Enter record names or numeric IDs. Separate multiple records with commas or new lines.</p>
        <div class="assembly-tool__grid">
          <label>Assembly name<input v-model.trim="form.name" placeholder="Required"></label>
          <label>Level<input v-model.trim="form.level" placeholder="For example: 1"></label>
          <label>Enzyme<select v-model="form.enzyme"><option value="auto">Auto</option><option>BsaI</option><option>BsmBI</option><option>BbsI</option></select></label>
          <label>Backbone<input v-model.trim="form.backbones" placeholder="Exactly one name or ID"></label>
          <label class="wide">Parts<textarea v-model="form.parts" rows="3" placeholder="PartA, PartB"></textarea></label>
          <label class="wide">Plasmids<textarea v-model="form.plasmids" rows="3" placeholder="PlasmidA, PlasmidB"></textarea></label>
          <label class="wide">Part start scars<textarea v-model="form.startScars" rows="2" placeholder="One per part; optional"></textarea></label>
          <label class="wide">Part end scars<textarea v-model="form.endScars" rows="2" placeholder="One per part; optional"></textarea></label>
          <label class="wide">Note<textarea v-model="form.note" rows="2"></textarea></label>
        </div>
        <button type="button" class="btn btn-primary" :disabled="busy" @click="runDirect">{{ busy ? 'Submitting...' : 'Run assembly' }}</button>
      </section>

      <section v-else-if="tab === 'repository'" class="assembly-tool__panel">
        <div class="assembly-tool__panel-title"><div><h2>Saved repositories</h2><p>Run a previously saved, non-expired assembly plan.</p></div><button type="button" class="btn btn-outline" @click="loadRepositories">Refresh</button></div>
        <div v-if="loadingRepositories" class="assembly-tool__empty">Loading...</div>
        <div v-else-if="!repositories.length" class="assembly-tool__empty">No saved repositories.</div>
        <div v-else class="assembly-tool__repositories">
          <div v-for="repo in repositories" :key="repo.id" class="assembly-tool__repository">
            <div><strong>{{ repo.name }}</strong><span>Level {{ repo.level || '-' }} · {{ repo.data.total_parts }} parts · {{ repo.data.total_plasmids }} plasmids</span></div>
            <button type="button" class="btn btn-primary" :disabled="busy" @click="runRepository(repo)">Run</button>
          </div>
        </div>
      </section>

      <section v-else class="assembly-tool__panel">
        <h2>Excel batch assembly</h2>
        <p>Upload an original Assembly workbook (.xlsx). Every assembly plan in the file will be saved as a temporary repository and submitted as one task.</p>
        <a class="assembly-tool__template-link" :class="{ disabled: downloadingTemplate }" @click="downloadTemplate">
          {{ downloadingTemplate ? 'Downloading template...' : 'Download AssemblyPlan.xlsx template' }}
        </a>
        <label class="assembly-tool__file">Excel file<input type="file" accept=".xlsx" @change="excelFile = $event.target.files[0] || null"></label>
        <button type="button" class="btn btn-primary" :disabled="busy || !excelFile" @click="runExcel">{{ busy ? 'Uploading...' : 'Upload and run' }}</button>
      </section>

      <div v-if="message" class="assembly-tool__notice" :class="{ error: messageType === 'error' }">{{ message }}</div>
    </div>
  </div>
</template>

<script>
import { triggerBlobDownload } from '../assets/js/tplot-api.js';

function values(text) {
  return String(text || '').split(/[\n,;，；]+/).map((item) => item.trim()).filter(Boolean)
    .map((item) => /^\d+$/.test(item) ? Number(item) : item);
}

export default {
  name: 'assembly-tool',
  data() {
    return {
      tabs: [{ id: 'direct', label: 'Direct' }, { id: 'repository', label: 'Repositories' }, { id: 'excel', label: 'Excel batch' }],
      tab: 'direct', busy: false, loadingRepositories: false, downloadingTemplate: false, repositories: [], excelFile: null,
      message: '', messageType: 'success',
      form: { name: '', level: '', enzyme: 'auto', backbones: '', parts: '', plasmids: '', startScars: '', endScars: '', note: '' },
    };
  },
  created() { this.loadRepositories(); },
  methods: {
    showError(error, fallback) {
      this.messageType = 'error';
      this.message = error?.response?.data?.msg || error?.response?.data?.message || error?.message || fallback;
    },
    openTask(taskId) {
      this.messageType = 'success';
      this.message = `Assembly task #${taskId} was submitted.`;
      this.$router.push(`/tasks/${taskId}`);
    },
    async runDirect() {
      if (!this.form.name) { this.messageType = 'error'; this.message = 'Assembly name is required.'; return; }
      const parts = values(this.form.parts);
      const backbones = values(this.form.backbones);
      const plasmids = values(this.form.plasmids);
      if (backbones.length !== 1) { this.messageType = 'error'; this.message = 'Exactly one backbone is required.'; return; }
      this.busy = true; this.message = '';
      try {
        const response = await axios.post('assembly/run', {
          name: this.form.name, level: this.form.level, enzyme: this.form.enzyme,
          parts, backbones, plasmids, note: this.form.note,
          part_start_scar: values(this.form.startScars).map(String),
          part_end_scar: values(this.form.endScars).map(String),
        });
        if (response.data.status !== 1) throw new Error(response.data.msg || 'Failed to submit assembly');
        this.openTask(response.data.options.taskId);
      } catch (error) { this.showError(error, 'Failed to submit assembly.'); }
      finally { this.busy = false; }
    },
    async loadRepositories() {
      this.loadingRepositories = true;
      try {
        const response = await axios.get('assembly/repositories');
        if (response.data.status === 1) this.repositories = response.data.options.repositories || [];
      } catch (error) { this.showError(error, 'Failed to load repositories.'); }
      finally { this.loadingRepositories = false; }
    },
    async runRepository(repo) {
      this.busy = true; this.message = '';
      try {
        const response = await axios.post(`assembly/repositories/${repo.id}/run`, { enzyme: 'auto' });
        if (response.data.status !== 1) throw new Error(response.data.msg || 'Failed to submit repository');
        this.openTask(response.data.options.taskId);
      } catch (error) { this.showError(error, 'Failed to run repository.'); }
      finally { this.busy = false; }
    },
    async runExcel() {
      if (!this.excelFile) return;
      const body = new FormData(); body.append('file', this.excelFile); body.append('title', this.excelFile.name);
      this.busy = true; this.message = '';
      try {
        const response = await axios.post('assembly/excel', body);
        if (response.data.status !== 1) throw new Error(response.data.msg || 'Failed to upload workbook');
        this.openTask(response.data.options.taskId);
      } catch (error) { this.showError(error, 'Failed to upload workbook.'); }
      finally { this.busy = false; }
    },
    async downloadTemplate() {
      if (this.downloadingTemplate) return;
      this.downloadingTemplate = true; this.message = '';
      try {
        const response = await axios.get('assembly/template', { responseType: 'blob' });
        triggerBlobDownload(response.data, 'AssemblyPlan.xlsx');
      } catch (error) { this.showError(error, 'Failed to download assembly template.'); }
      finally { this.downloadingTemplate = false; }
    },
  },
};
</script>

<style scoped>
.assembly-tool__subtitle { margin-top: 6px; color: #747486; }
.assembly-tool__body { max-width: 1050px; }
.assembly-tool__tabs { display: flex; gap: 8px; margin-bottom: 18px; }
.assembly-tool__tab { border: 1px solid #deddea; border-radius: 8px; background: #fff; padding: 10px 20px; cursor: pointer; color: #555469; }
.assembly-tool__tab.active { color: #fff; border-color: #605bff; background: #605bff; }
.assembly-tool__panel { background: #fff; border: 1px solid #ecebf3; border-radius: 12px; padding: 24px; }
.assembly-tool__panel h2 { margin: 0 0 6px; color: #25243a; }
.assembly-tool__panel p { margin: 0 0 22px; color: #747486; }
.assembly-tool__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 22px; }
.assembly-tool__grid label, .assembly-tool__file { display: flex; flex-direction: column; gap: 7px; color: #45445a; font-size: 14px; }
.assembly-tool__grid label.wide { grid-column: 1 / -1; }
.assembly-tool__grid input, .assembly-tool__grid select, .assembly-tool__grid textarea, .assembly-tool__file input { border: 1px solid #deddea; border-radius: 7px; padding: 10px 12px; font: inherit; resize: vertical; }
.assembly-tool__panel-title, .assembly-tool__repository { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.assembly-tool__repositories { display: grid; gap: 10px; }
.assembly-tool__repository { border: 1px solid #ecebf3; border-radius: 8px; padding: 14px 16px; }
.assembly-tool__repository span { display: block; color: #858496; font-size: 13px; margin-top: 5px; }
.assembly-tool__empty { color: #858496; padding: 24px 0; text-align: center; }
.assembly-tool__file { margin: 26px 0 18px; }
.assembly-tool__template-link { display: inline-block; color: #605bff; text-decoration: underline; cursor: pointer; }
.assembly-tool__template-link.disabled { opacity: .55; pointer-events: none; }
.assembly-tool__notice { margin-top: 16px; border-radius: 8px; padding: 12px 15px; color: #277a50; background: #eefaf4; }
.assembly-tool__notice.error { color: #b33939; background: #fff1f1; }
@media (max-width: 760px) { .assembly-tool__grid { grid-template-columns: 1fr; } .assembly-tool__grid label.wide { grid-column: auto; } }
</style>
