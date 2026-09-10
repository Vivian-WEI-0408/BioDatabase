<template>
  <div class="page-container dataset-item-page">
    <div class="dataset-item-page__header">
      <button type="button" class="dataset-item-page__back" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Back to list
      </button>
      <div class="page-title">{{ pageTitle }}</div>
      <div v-if="detail" class="dataset-item-page__actions">
        <button
          type="button"
          class="dataset-item-page__edit-btn"
          @click="downloadMap"
        >
          Download Map
        </button>
        <button
          v-if="canEditRecord"
          type="button"
          class="dataset-item-page__edit-btn"
          @click="goEdit"
        >
          Edit
        </button>
        <button
          v-if="canDeleteRecord"
          type="button"
          class="dataset-item-page__edit-btn dataset-item-page__edit-btn--danger"
          @click="onDelete"
        >
          Delete
        </button>
      </div>
    </div>

    <div class="page-body dataset-item-page__body list-panel">
      <div v-if="loading" class="datasets-empty">Loading...</div>
      <div v-else-if="errorMsg" class="datasets-empty">{{ errorMsg }}</div>
      <template v-else-if="detail">
        <section class="dataset-item-card">
          <h2 class="dataset-item-card__title">Basic Information</h2>
          <dl class="dataset-item-fields">
            <div v-for="field in basicFields" :key="field.key" class="dataset-item-fields__row">
              <dt>{{ field.label }}</dt>
              <dd>{{ formatFieldValue(field.key) }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="cultureField" class="dataset-item-card">
          <h2 class="dataset-item-card__title">{{ cultureField.label }}</h2>
          <p v-if="!cultureValues.length" class="dataset-item-empty-text">None</p>
          <ul v-else class="dataset-item-tag-list">
            <li v-for="item in cultureValues" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section v-if="markerField" class="dataset-item-card">
          <h2 class="dataset-item-card__title">{{ markerField.label }}</h2>
          <p v-if="!markerValues.length" class="dataset-item-empty-text">None</p>
          <ul v-else class="dataset-item-tag-list">
            <li v-for="item in markerValues" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section v-if="detail.scar" class="dataset-item-card">
          <h2 class="dataset-item-card__title">Scar Sequences</h2>
          <dl class="dataset-item-fields">
            <div v-for="enzyme in scarEnzymes" :key="enzyme" class="dataset-item-fields__row">
              <dt>{{ enzyme }}</dt>
              <dd class="dataset-item-fields__mono">{{ detail.scar[enzyme] || '—' }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="sequenceField" class="dataset-item-card">
          <h2 class="dataset-item-card__title">{{ sequenceField.label }}</h2>
          <pre class="dataset-item-sequence">{{ sequenceValue || '—' }}</pre>
        </section>

        <section v-if="parentSections.length" class="dataset-item-card">
          <h2 class="dataset-item-card__title">Parent Components</h2>
          <div
            v-for="section in parentSections"
            :key="section.key"
            class="dataset-item-parent-block"
          >
            <h3 class="dataset-item-parent-block__title">{{ section.label }}</h3>
            <p v-if="!section.items.length" class="dataset-item-empty-text">None</p>
            <ul v-else class="dataset-item-tag-list">
              <li v-for="item in section.items" :key="item.id">{{ item.name || `#${item.id}` }}</li>
            </ul>
          </div>
        </section>

        <section v-if="detail.features && detail.features.length" class="dataset-item-card">
          <h2 class="dataset-item-card__title">Features</h2>
          <div class="dataset-item-features-table-wrap">
            <table class="dataset-item-features-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(feature, index) in detail.features" :key="index">
                  <td>{{ feature.label || '—' }}</td>
                  <td>{{ feature.type || '—' }}</td>
                  <td>{{ feature.start }}</td>
                  <td>{{ feature.end }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script>
const SCAR_ENZYMES = ['BsmBI', 'BsaI', 'BbsI', 'AarI', 'SapI'];

const BASIC_FIELDS = {
  part: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'alias', label: 'Alias' },
    { key: 'type', label: 'Type' },
    { key: 'user', label: 'User' },
    { key: 'sourceOrganism', label: 'Source Organism' },
    { key: 'lengthInLevel0', label: 'Length' },
    { key: 'reference', label: 'Reference' },
    { key: 'note', label: 'Note' },
    { key: 'updateDate', label: 'Updated' },
  ],
  backbone: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'alias', label: 'Alias' },
    { key: 'user', label: 'User' },
    { key: 'length', label: 'Length' },
    { key: 'copyNumber', label: 'Copy Number' },
    { key: 'species', label: 'Species' },
    { key: 'notes', label: 'Notes' },
    { key: 'updateDate', label: 'Updated' },
  ],
  plasmid: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'alias', label: 'Alias' },
    { key: 'user', label: 'User' },
    { key: 'level', label: 'Level' },
    { key: 'length', label: 'Length' },
    { key: 'note', label: 'Note' },
    { key: 'updateDate', label: 'Updated' },
  ],
};

function normalizeDatasetType(value) {
  const normalized = String(value || 'part').trim().toLowerCase();
  if (normalized === 'backbone' || normalized === 'plasmid') {
    return normalized;
  }
  return 'part';
}

export default {
  name: 'dataset-item-detail',
  data() {
    return {
      loading: false,
      errorMsg: '',
      detail: null,
      scarEnzymes: SCAR_ENZYMES,
    };
  },
  computed: {
    datasetType() {
      return normalizeDatasetType(this.$route.params.datasetType);
    },
    recordId() {
      return this.$route.params.id;
    },
    pageTitle() {
      const labels = { part: 'Part Detail', backbone: 'Backbone Detail', plasmid: 'Plasmid Detail' };
      const name = this.detail?.name;
      return name ? `${labels[this.datasetType]} — ${name}` : labels[this.datasetType];
    },
    basicFields() {
      return BASIC_FIELDS[this.datasetType] || BASIC_FIELDS.part;
    },
    cultureField() {
      if (this.datasetType === 'backbone') {
        return { key: 'ori', label: 'Ori' };
      }
      if (this.datasetType === 'plasmid') {
        return { key: 'oriInfo', label: 'Ori' };
      }
      return null;
    },
    markerField() {
      if (this.datasetType === 'backbone') {
        return { key: 'marker', label: 'Marker' };
      }
      if (this.datasetType === 'plasmid') {
        return { key: 'markerInfo', label: 'Marker' };
      }
      return null;
    },
    cultureValues() {
      if (!this.detail || !this.cultureField) {
        return [];
      }
      return this.detail[this.cultureField.key] || [];
    },
    markerValues() {
      if (!this.detail || !this.markerField) {
        return [];
      }
      return this.detail[this.markerField.key] || [];
    },
    sequenceField() {
      if (this.datasetType === 'part') {
        return { key: 'level0Sequence', label: 'Level 0 Sequence' };
      }
      if (this.datasetType === 'backbone') {
        return { key: 'sequence', label: 'Sequence' };
      }
      if (this.datasetType === 'plasmid') {
        return { key: 'sequenceConfirm', label: 'Sequence' };
      }
      return null;
    },
    sequenceValue() {
      if (!this.detail || !this.sequenceField) {
        return '';
      }
      return this.detail[this.sequenceField.key] || '';
    },
    parentSections() {
      if (this.datasetType !== 'plasmid' || !this.detail) {
        return [];
      }
      return [
        { key: 'parentPart', label: 'Parent Parts', items: this.detail.parentPart || [] },
        { key: 'parentBackbone', label: 'Parent Backbones', items: this.detail.parentBackbone || [] },
        { key: 'parentPlasmid', label: 'Parent Plasmids', items: this.detail.parentPlasmid || [] },
      ];
    },
    canDeleteRecord() {
      const role = Number(G.U?.role || 0);
      return role === 1 || role >= 9;
    },
    canEditRecord() {
      const role = Number(G.U?.role || 0);
      return role === 1 || role >= 9;
    },
  },
  watch: {
    '$route.params': {
      deep: true,
      handler() {
        this.fetchDetail();
      },
    },
  },
  created() {
    this.fetchDetail();
  },
  methods: {
    handleAuthStatus(status) {
      if (status === 2) {
        this.$router.replace('/signin');
        return true;
      }
      return false;
    },
    formatFieldValue(key) {
      const value = this.detail?.[key];
      if (value == null || value === '') {
        return '—';
      }
      return value;
    },
    async fetchDetail() {
      this.loading = true;
      this.errorMsg = '';
      try {
        const res = await axios.post('datasets/browse/detail', {
          datasetType: this.datasetType,
          id: this.recordId,
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.detail = data.options?.detail || null;
          if (!this.detail) {
            this.errorMsg = 'Record not found.';
          }
          return;
        }
        this.detail = null;
        this.errorMsg = data.msg || 'Failed to load record detail.';
      } catch (e) {
        this.detail = null;
        this.errorMsg = 'Failed to load record detail.';
      } finally {
        this.loading = false;
      }
    },
    buildBrowseReturnQuery() {
      const query = { datasetType: this.datasetType };
      const type = this.$route.query?.type;
      if (type) {
        query.type = Array.isArray(type) ? type[0] : type;
      }
      return query;
    },
    goBack() {
      this.$router.push({
        name: 'dataset-browse',
        params: { id: 'component-library' },
        query: this.buildBrowseReturnQuery(),
      });
    },
    goEdit() {
      if (!this.canEditRecord) {
        alert('You do not have permission to edit records.');
        return;
      }
      this.$router.push({
        name: 'dataset-item-edit',
        params: {
          datasetType: this.datasetType,
          id: this.recordId,
        },
        query: this.buildBrowseReturnQuery(),
      });
    },
    downloadMapPath() {
      const id = this.detail?.id ?? this.recordId;
      return `datasets/browse/map/${encodeURIComponent(this.datasetType)}/${encodeURIComponent(id)}`;
    },
    async downloadMap() {
      try {
        const response = await axios.get(this.downloadMapPath(), { responseType: 'blob' });
        const blobUrl = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${this.detail?.name || `${this.datasetType}-${this.recordId}`}.gb`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        alert('Failed to download map. The record may not contain a sequence.');
      }
    },
    async onDelete() {
      if (!this.canDeleteRecord) {
        alert('You do not have permission to delete records.');
        return;
      }
      const label = this.detail?.name || `#${this.recordId}`;
      if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
        return;
      }

      try {
        const res = await axios.post('datasets/browse/delete', {
          datasetType: this.datasetType,
          id: this.recordId,
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status !== 1) {
          alert(data.msg || 'Failed to delete record.');
          return;
        }
        this.goBack();
      } catch (e) {
        alert('Failed to delete record.');
      }
    },
  },
};
</script>
