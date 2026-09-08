<template>
  <div class="modal-inner">
    <div class="modal-header">
      <div class="model-header__left">
        <div class="modal-title">Add Training a Promoter Strength Predictor</div>
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
      <div class="form1 activator-form">
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Name</div>
          </div>
          <div class="form-input-box"><input class="form-input" v-model="f.name"></div>
          <div class="form-err">
            <div class="form-err-text">{{ err.name }}</div>
          </div>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Training mode</div>
          </div>
          <div class="form-input-box">
            <van-radio-group shape="dot" class="form-input-box__checkboxes" v-model="f.mode">
              <van-radio name="bare">Bare (without dataset)</van-radio>
              <van-radio name="new">New (de novo training)</van-radio>
              <van-radio name="update">Update (transfer learning)</van-radio>
            </van-radio-group>
          </div>
        </div>
        <div class="form-group" v-if="f.mode !== 'bare'">
          <div class="form-label-top">
            <div class="form-label-text">Dataset for Training</div>
          </div>
          <div class="form-input-box">
            <multi-select-box v-model="f.datasetIDs" :items="list.dataset" placeholder="Select datasets" />
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ err.datasetIDs }}</div>
          </div>
        </div>
        <div class="form-group" v-if="f.mode !== 'update'">
          <div class="form-label-top">
            <div class="form-label-text">Transcriptional Activator for Motif Finding</div>
          </div>
          <div class="form-input-box">
            <select-box ref="selActivator" placeholder="Select activator" :items="list.activator"
              @select="f.activator = $event.ID"></select-box>
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ err.activator }}</div>
          </div>
        </div>
        <div class="form-group" v-if="f.mode === 'update'">
          <div class="form-label-top">
            <div class="form-label-text">Base model for transfer learning</div>
          </div>
          <div class="form-input-box">
            <select-box ref="selBasePredictor" placeholder="Select predictor" :items="list.predictor"
              @select="f.predictor = $event.ID"></select-box>
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ err.predictor }}</div>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="f.fitMaximum"> Refit the maximum strength
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="f.fitMotifScore"> Refit motif scores
            </label>
          </div>
        </div>
      </div>
      <div class="form1 activator-form">
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Minimum promoter shift</div>
          </div>
          <div class="form-input-box"><input class="form-input" type="number" v-model.number="f.minGlobalShift"></div>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Maximum promoter shift</div>
          </div>
          <div class="form-input-box"><input class="form-input" type="number" v-model.number="f.maxGlobalShift"></div>
          <div class="form-err">
            <div class="form-err-text">{{ err.shiftRange }}</div>
          </div>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Minimum spacer length variation</div>
          </div>
          <div class="form-input-box"><input class="form-input" type="number" v-model.number="f.minLocalShift"></div>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Maximum spacer length variation</div>
          </div>
          <div class="form-input-box"><input class="form-input" type="number" v-model.number="f.maxLocalShift"></div>
        </div>
      </div>
    </div>
    <div class="modal-body second" v-if="f.mode !== 'bare'">
      <div class="form1 activator-form">
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="f.crossValidation"> Cross-validate on the split datasets
          </label>
        </div>
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">Seed for the random number generator</div>
          </div>
          <div class="form-input-box">
            <input class="form-input" type="number" min="0" v-model="f.seed"
              v-tooltip="{ content: 'Leave blank for a random seed.', html: true }">
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
import SelectBox from '../parts/select-box.vue';
import MultiSelectBox from '../parts/multi-select-box.vue';
import { buildTaskName, showTaskQueuedDialog, submitTproTask } from '../../assets/js/tpro-task.js';
import {
  loadActivators,
  loadExpressionDatasets,
  loadPredictors,
  selectLatestItem,
} from '../../assets/js/tpro-create-loaders.js';

export default {
  props: {
    speciesId: { type: Number, required: true },
  },
  components: { SelectBox, MultiSelectBox },
  created() {
    this.defaultF = mirror(this.f);
  },
  mounted() {
    this.loadLists();
  },
  methods: {
    async loadLists() {
      this.loading = true;
      try {
        const [datasets, activators, predictors] = await Promise.all([
          loadExpressionDatasets(this.speciesId),
          loadActivators(this.speciesId),
          loadPredictors(this.speciesId),
        ]);
        this.list.dataset = datasets;
        this.list.activator = activators;
        this.list.predictor = predictors;
        await this.$nextTick();
        selectLatestItem(this.list.activator, this.$refs.selActivator);
        selectLatestItem(this.list.predictor, this.$refs.selBasePredictor);
        if (this.list.activator.length) {
          this.f.activator = this.list.activator[this.list.activator.length - 1].ID;
        }
        if (this.list.predictor.length) {
          this.f.predictor = this.list.predictor[this.list.predictor.length - 1].ID;
        }
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      copyFrom(this.f, this.defaultF);
      G.clearObject(this.err);
      selectLatestItem(this.list.activator, this.$refs.selActivator);
      selectLatestItem(this.list.predictor, this.$refs.selBasePredictor);
    },
    validate() {
      G.clearObject(this.err);
      let valid = true;
      if (!this.f.name?.trim()) {
        this.err.name = 'Required';
        valid = false;
      }
      if (this.f.mode !== 'bare' && !this.f.datasetIDs.length) {
        this.err.datasetIDs = 'Required';
        valid = false;
      }
      if (this.f.mode !== 'update' && !this.f.activator) {
        this.err.activator = 'Required';
        valid = false;
      }
      if (this.f.mode === 'update' && !this.f.predictor) {
        this.err.predictor = 'Required';
        valid = false;
      }
      if (this.f.minGlobalShift > this.f.maxGlobalShift || this.f.minLocalShift > this.f.maxLocalShift) {
        this.err.shiftRange = 'Invalid shift range';
        valid = false;
      }
      return valid;
    },
    buildParams() {
      const params = {
        speciesID: this.speciesId,
        name: this.f.name.trim(),
        mode: this.f.mode,
        datasetIDs: this.f.mode === 'bare' ? [] : [...this.f.datasetIDs],
        activator: this.f.mode === 'update' ? null : this.f.activator,
        predictor: this.f.mode === 'update' ? this.f.predictor : null,
        minGlobalShift: this.f.minGlobalShift,
        maxGlobalShift: this.f.maxGlobalShift,
        minLocalShift: this.f.minLocalShift,
        maxLocalShift: this.f.maxLocalShift,
        fitMaximum: this.f.fitMaximum,
        fitMotifScore: this.f.fitMotifScore,
        crossValidation: this.f.crossValidation,
      };

      if (this.f.seed !== '' && this.f.seed != null) {
        params.seed = Number(this.f.seed);
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
          operation: 'predictor/register',
          name: buildTaskName('Training promoter strength predictor'),
          params: this.buildParams(),
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
      f: {
        name: '',
        mode: 'new',
        datasetIDs: [],
        activator: null,
        predictor: null,
        minGlobalShift: -100,
        maxGlobalShift: 100,
        minLocalShift: 0,
        maxLocalShift: 0,
        fitMaximum: false,
        fitMotifScore: false,
        crossValidation: false,
        seed: '',
      },
      err: {},
      list: { dataset: [], activator: [], predictor: [] },
    };
  },
};
</script>
