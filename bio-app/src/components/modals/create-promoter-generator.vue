<template>
  <div class="modal-inner">
    <div class="modal-header">
      <div class="model-header__left">
        <div class="modal-title">Add Promoter Generator</div>
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
    <div class="modal-body auto-width">
      <div class="form1">
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
            <div class="form-label-text">Predictor model for calibrating the promoter strength</div>
          </div>
          <div class="form-input-box">
            <select-box ref="selPredictor" placeholder="Select predictor" :items="list.predictor"
              @select="f.predictor = $event.ID"></select-box>
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ err.predictor }}</div>
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
import { buildTaskName, showTaskQueuedDialog, submitTproTask } from '../../assets/js/tpro-task.js';
import { loadPredictors, selectLatestItem } from '../../assets/js/tpro-create-loaders.js';

export default {
  props: {
    speciesId: { type: Number, required: true },
  },
  components: { SelectBox },
  created() {
    this.defaultF = mirror(this.f);
  },
  mounted() {
    this.loadPredictors();
  },
  methods: {
    async loadPredictors() {
      this.loading = true;
      try {
        this.list.predictor = await loadPredictors(this.speciesId);
        await this.$nextTick();
        selectLatestItem(this.list.predictor, this.$refs.selPredictor);
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
      selectLatestItem(this.list.predictor, this.$refs.selPredictor);
    },
    validate() {
      G.clearObject(this.err);
      let valid = true;
      if (!this.f.name?.trim()) {
        this.err.name = 'Required';
        valid = false;
      }
      if (!this.f.predictor) {
        this.err.predictor = 'Required';
        valid = false;
      }
      return valid;
    },
    buildParams() {
      return {
        speciesID: this.speciesId,
        name: this.f.name.trim(),
        predictor: this.f.predictor,
      };
    },
    async save() {
      if (this.busying || this.loading || !this.validate()) {
        return;
      }

      this.busying = true;
      try {
        const task = await submitTproTask({
          operation: 'generator/register',
          name: buildTaskName('Creating promoter generator'),
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
      f: { name: 'Promoter Generator', predictor: null },
      err: {},
      list: { predictor: [] },
    };
  },
};
</script>
