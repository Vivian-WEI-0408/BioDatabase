<template>
  <div class="page-container dataset-item-page">
    <div class="dataset-item-page__header">
      <button type="button" class="dataset-item-page__back" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Back to detail
      </button>
      <div class="page-title">{{ pageTitle }}</div>
    </div>

    <div class="page-body dataset-item-page__body list-panel">
      <div v-if="loading" class="datasets-empty">Loading...</div>
      <div v-else-if="errorMsg && !form.name" class="datasets-empty">{{ errorMsg }}</div>
      <form v-else class="dataset-item-form" @submit.prevent="onSubmit">
        <section class="dataset-item-card">
          <h2 class="dataset-item-card__title">Basic Information</h2>
          <div class="dataset-item-form__grid">
            <label class="dataset-item-form__field">
              <span>Name</span>
              <input v-model="form.name" type="text" required>
            </label>
            <label class="dataset-item-form__field">
              <span>Alias</span>
              <input v-model="form.alias" type="text">
            </label>
            <label v-if="datasetType === 'part'" class="dataset-item-form__field">
              <span>Type</span>
              <select v-model="form.type">
                <option v-for="type in partTypes" :key="type" :value="type">{{ type }}</option>
              </select>
            </label>
            <label v-if="datasetType === 'part'" class="dataset-item-form__field dataset-item-form__field--wide">
              <span>Source Organism</span>
              <input v-model="form.sourceOrganism" type="text">
            </label>
            <label v-if="datasetType === 'backbone'" class="dataset-item-form__field">
              <span>Copy Number</span>
              <input v-model="form.copyNumber" type="text">
            </label>
            <label v-if="datasetType === 'backbone'" class="dataset-item-form__field">
              <span>Species</span>
              <input v-model="form.species" type="text">
            </label>
            <label v-if="datasetType === 'plasmid'" class="dataset-item-form__field">
              <span>Level</span>
              <input v-model="form.level" type="text">
            </label>
            <label
              v-if="datasetType === 'part'"
              class="dataset-item-form__field dataset-item-form__field--wide"
            >
              <span>Reference</span>
              <input v-model="form.reference" type="text">
            </label>
            <label
              v-if="datasetType === 'part'"
              class="dataset-item-form__field dataset-item-form__field--wide"
            >
              <span>Note</span>
              <textarea v-model="form.note" rows="3" />
            </label>
            <label
              v-if="datasetType === 'backbone'"
              class="dataset-item-form__field dataset-item-form__field--wide"
            >
              <span>Notes</span>
              <textarea v-model="form.notes" rows="3" />
            </label>
            <label
              v-if="datasetType === 'plasmid'"
              class="dataset-item-form__field dataset-item-form__field--wide"
            >
              <span>Note</span>
              <textarea v-model="form.note" rows="3" />
            </label>
          </div>
        </section>

        <section v-if="hasCultureFields" class="dataset-item-card">
          <h2 class="dataset-item-card__title">Culture Functions</h2>
          <div class="dataset-item-form__grid">
            <label class="dataset-item-form__field dataset-item-form__field--wide">
              <span>Ori (one per line or comma-separated)</span>
              <textarea v-model="form.oriText" rows="4" />
            </label>
            <label class="dataset-item-form__field dataset-item-form__field--wide">
              <span>Marker (one per line or comma-separated)</span>
              <textarea v-model="form.markerText" rows="4" />
            </label>
          </div>
        </section>

        <section class="dataset-item-card">
          <h2 class="dataset-item-card__title">Scar Sequences</h2>
          <div class="dataset-item-form__grid">
            <label
              v-for="enzyme in scarEnzymes"
              :key="enzyme"
              class="dataset-item-form__field dataset-item-form__field--wide"
            >
              <span>{{ enzyme }}</span>
              <input v-model="form.scar[enzyme]" type="text">
            </label>
          </div>
        </section>

        <section v-if="sequenceKey" class="dataset-item-card">
          <h2 class="dataset-item-card__title">{{ sequenceLabel }}</h2>
          <label class="dataset-item-form__field dataset-item-form__field--wide">
            <span>{{ sequenceLabel }}</span>
            <textarea v-model="form[sequenceKey]" rows="8" class="dataset-item-form__sequence" />
          </label>
        </section>

        <p v-if="errorMsg" class="dataset-item-form__error">{{ errorMsg }}</p>

        <div class="dataset-item-form__actions">
          <button type="button" class="dataset-item-form__btn dataset-item-form__btn--secondary" @click="goBack">
            Cancel
          </button>
          <button type="submit" class="dataset-item-form__btn" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
const SCAR_ENZYMES = ['BsmBI', 'BsaI', 'BbsI', 'AarI', 'SapI'];
const PART_TYPES = ['Promoter', 'CDS', 'Terminator', 'RBS', 'P+R'];

function normalizeDatasetType(value) {
  const normalized = String(value || 'part').trim().toLowerCase();
  if (normalized === 'backbone' || normalized === 'plasmid') {
    return normalized;
  }
  return 'part';
}

function emptyScar() {
  return SCAR_ENZYMES.reduce((result, enzyme) => {
    result[enzyme] = '';
    return result;
  }, {});
}

function joinList(values) {
  return (values || []).join('\n');
}

function buildFormFromDetail(datasetType, detail) {
  const scar = { ...emptyScar(), ...(detail.scar || {}) };
  const form = {
    name: detail.name || '',
    alias: detail.alias || '',
    scar,
  };

  if (datasetType === 'part') {
    form.type = detail.type || PART_TYPES[0];
    form.sourceOrganism = detail.sourceOrganism || '';
    form.note = detail.note || '';
    form.reference = detail.reference || '';
    form.level0Sequence = detail.level0Sequence || '';
  }

  if (datasetType === 'backbone') {
    form.copyNumber = detail.copyNumber || '';
    form.species = detail.species || '';
    form.notes = detail.notes || '';
    form.sequence = detail.sequence || '';
    form.oriText = joinList(detail.ori);
    form.markerText = joinList(detail.marker);
  }

  if (datasetType === 'plasmid') {
    form.level = detail.level || '';
    form.note = detail.note || '';
    form.sequenceConfirm = detail.sequenceConfirm || '';
    form.oriText = joinList(detail.oriInfo);
    form.markerText = joinList(detail.markerInfo);
  }

  return form;
}

function buildUpdatePayload(datasetType, form) {
  const values = {
    name: form.name,
    alias: form.alias,
    scar: form.scar,
  };

  if (datasetType === 'part') {
    values.type = form.type;
    values.sourceOrganism = form.sourceOrganism;
    values.note = form.note;
    values.reference = form.reference;
    values.level0Sequence = form.level0Sequence;
  }

  if (datasetType === 'backbone') {
    values.copyNumber = form.copyNumber;
    values.species = form.species;
    values.notes = form.notes;
    values.sequence = form.sequence;
    values.ori = form.oriText;
    values.marker = form.markerText;
  }

  if (datasetType === 'plasmid') {
    values.level = form.level;
    values.note = form.note;
    values.sequenceConfirm = form.sequenceConfirm;
    values.oriInfo = form.oriText;
    values.markerInfo = form.markerText;
  }

  return values;
}

export default {
  name: 'dataset-item-edit',
  data() {
    return {
      loading: false,
      saving: false,
      errorMsg: '',
      form: {
        name: '',
        alias: '',
        scar: emptyScar(),
      },
      scarEnzymes: SCAR_ENZYMES,
      partTypes: PART_TYPES,
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
      const labels = { part: 'Edit Part', backbone: 'Edit Backbone', plasmid: 'Edit Plasmid' };
      const name = this.form.name;
      return name ? `${labels[this.datasetType]} — ${name}` : labels[this.datasetType];
    },
    hasCultureFields() {
      return this.datasetType === 'backbone' || this.datasetType === 'plasmid';
    },
    sequenceKey() {
      if (this.datasetType === 'part') return 'level0Sequence';
      if (this.datasetType === 'backbone') return 'sequence';
      if (this.datasetType === 'plasmid') return 'sequenceConfirm';
      return null;
    },
    sequenceLabel() {
      if (this.datasetType === 'part') return 'Level 0 Sequence';
      return 'Sequence';
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
    if (!this.canEditRecord) {
      alert('You do not have permission to edit records.');
      this.goBack();
      return;
    }
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
        if (data.status === 1 && data.options?.detail) {
          this.form = buildFormFromDetail(this.datasetType, data.options.detail);
          return;
        }
        this.errorMsg = data.msg || 'Failed to load record detail.';
      } catch (e) {
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
        name: 'dataset-item-detail',
        params: {
          datasetType: this.datasetType,
          id: this.recordId,
        },
        query: this.buildBrowseReturnQuery(),
      });
    },
    async onSubmit() {
      if (!this.canEditRecord) {
        this.errorMsg = 'You do not have permission to edit records.';
        return;
      }
      this.saving = true;
      this.errorMsg = '';
      try {
        const res = await axios.post('datasets/browse/update', {
          datasetType: this.datasetType,
          id: this.recordId,
          values: buildUpdatePayload(this.datasetType, this.form),
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.$router.push({
            name: 'dataset-item-detail',
            params: {
              datasetType: this.datasetType,
              id: this.recordId,
            },
            query: this.buildBrowseReturnQuery(),
          });
          return;
        }
        this.errorMsg = data.msg || 'Failed to save changes.';
      } catch (e) {
        this.errorMsg = 'Failed to save changes.';
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
