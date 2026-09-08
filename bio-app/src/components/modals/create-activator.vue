<template>
  <div class="modal-inner">
    <div class="modal-header">
      <div class="model-header__left">
        <div class="modal-title">Add Activator</div>
      </div>
      <div class="modal-header__right">
        <div class="modal-close-btn" @click="close">
          <svg data-svg-ext-mode="persistent" width="10" height="10" viewbox="0 0 10 10" fill="none"
            class="modal-close-icon">
            <path opacity="0.8"
              d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
              fill="currentColor"></path>
          </svg>
        </div>
      </div>
    </div>
    <div class="modal-body auto-width column-layout">
      <div class="example-files" v-if="templates.length">
        <div class="download-label">Download example files</div>
        <div class="download-links">
          <a v-for="item in templates" :key="item.fileName" class="download-link"
            :href="templateUrl(item.fileName)" target="_blank" rel="noopener">
            {{ item.description }}
          </a>
        </div>
      </div>
      <div class="form1 activator-form">
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Name</div>
          </div>
          <div class="form-input-box"><input class="form-input" v-model="f.name" placeholder="Sigma 70"></div>
          <div class="form-err">
            <div class="form-err-text">{{ err.name }}</div>
          </div>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Cannonical Protein Name</div>
          </div>
          <div class="form-input-box"><input class="form-input" v-model="f.protein" placeholder="RpoD"></div>
          <div class="form-err">
            <div class="form-err-text">{{ err.protein }}</div>
          </div>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Promoter sequence file</div>
          </div>
          <div class="form-input-box">
            <input class="form-input" type="file" accept=".txt,text/plain" @change="onSequenceFileChange">
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ err.sequenceFile }}</div>
          </div>
          <div v-if="sequenceFile" class="form-file-box">
            <div class="form-file-box__left">
              <div class="form-file__file-name">{{ sequenceFile.name }}</div>
            </div>
            <div class="form-file-box__right">
              <a class="form-file-box__remove-btn" @click="clearSequenceFile">Remove</a>
            </div>
          </div>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Background sequence file</div>
          </div>
          <div class="form-input-box">
            <input class="form-input" type="file" accept=".txt,text/plain" @change="onBackgroundFileChange">
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ err.backgroundFile }}</div>
          </div>
          <div v-if="backgroundFile" class="form-file-box">
            <div class="form-file-box__left">
              <div class="form-file__file-name">{{ backgroundFile.name }}</div>
            </div>
            <div class="form-file-box__right">
              <a class="form-file-box__remove-btn" @click="clearBackgroundFile">Remove</a>
            </div>
          </div>
        </div>
      </div>
      <div class="form1 activator-form">
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Consensus sequence</div>
          </div>
          <div class="form-input-box">
            <input class="form-input" v-model="f.consensus">
          </div>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Consensus position</div>
          </div>
          <div class="form-input-box">
            <input class="form-input" type="number" v-model.number="f.shift">
          </div>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Global sequence shift</div>
          </div>
          <div class="form-input-box">
            <input class="form-input" type="number" v-model.number="f.globalShift">
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <div class="form-buttons">
        <a class="btn btn-danger" @click="resetForm()">Reset</a>
        <a class="btn btn-primary" :class="{ disabled: busying || loading }" @click="save()">Save</a>
      </div>
    </div>
  </div>
</template>

<script>
import { buildTaskName, showTaskQueuedDialog, submitTproTask } from '../../assets/js/tpro-task.js';
import { readFileAsBase64 } from '../../assets/js/tpro-create-loaders.js';

export default {
  props: {
    speciesId: { type: Number, required: true },
  },
  created() {
    this.defaultF = mirror(this.f);
    this.loadTemplates();
  },
  methods: {
    templateUrl(fileName) {
      return `/templates/tpro/activator/TXT/${fileName}`;
    },
    async loadTemplates() {
      this.loading = true;
      try {
        const res = await tpro.get('activator/templates/TXT');
        this.templates = res.status === 200 && Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        this.templates = [
          { fileName: 'promoter.txt', description: 'Promoter sequence file' },
          { fileName: 'background.txt', description: 'Background sequence file' },
        ];
      } finally {
        this.loading = false;
      }
    },
    onSequenceFileChange(event) {
      this.sequenceFile = event.target.files?.[0] || null;
      this.err.sequenceFile = '';
    },
    onBackgroundFileChange(event) {
      this.backgroundFile = event.target.files?.[0] || null;
      this.err.backgroundFile = '';
    },
    clearSequenceFile() {
      this.sequenceFile = null;
    },
    clearBackgroundFile() {
      this.backgroundFile = null;
    },
    resetForm() {
      copyFrom(this.f, this.defaultF);
      this.sequenceFile = null;
      this.backgroundFile = null;
      G.clearObject(this.err);
    },
    validate() {
      G.clearObject(this.err);
      let valid = true;
      if (!this.f.name?.trim()) {
        this.err.name = 'Required';
        valid = false;
      }
      if (!this.f.protein?.trim()) {
        this.err.protein = 'Required';
        valid = false;
      }
      if (!this.sequenceFile) {
        this.err.sequenceFile = 'Required';
        valid = false;
      }
      return valid;
    },
    async buildParams() {
      const params = {
        speciesID: this.speciesId,
        name: this.f.name.trim(),
        protein: this.f.protein.trim(),
        consensus: this.f.consensus,
        shift: this.f.shift,
        globalShift: this.f.globalShift,
        sequenceFile: {
          fileName: this.sequenceFile.name,
          contentBase64: await readFileAsBase64(this.sequenceFile),
        },
      };

      if (this.backgroundFile) {
        params.backgroundFile = {
          fileName: this.backgroundFile.name,
          contentBase64: await readFileAsBase64(this.backgroundFile),
        };
      }

      return params;
    },
    async save() {
      if (this.busying || this.loading || !this.validate()) {
        return;
      }

      this.busying = true;
      try {
        const task = await submitTproTask({
          operation: 'activator/register',
          name: buildTaskName('Creating activator'),
          params: await this.buildParams(),
          displayMeta: { label: this.f.name.trim() },
        });
        if (task) {
          this.$emit('close');
          showTaskQueuedDialog(task.id, { onCompleted: (finished) => this.$emit('completed', finished) });
        }
      } catch (err) {
        A.err(err.message || 'Failed to submit task');
      } finally {
        this.busying = false;
      }
    },
    close() {
      A.safety('Are you sure you want to discard your changes?').then((res) => {
        if (res.isConfirmed) {
          this.$emit('close');
        }
      });
    },
  },
  data() {
    return {
      busying: false,
      loading: true,
      defaultF: null,
      templates: [],
      sequenceFile: null,
      backgroundFile: null,
      f: {
        name: '',
        protein: '',
        consensus: 'TTGACA--------------TGNTATAAT',
        shift: -35,
        globalShift: -20,
      },
      err: {},
    };
  },
};
</script>
