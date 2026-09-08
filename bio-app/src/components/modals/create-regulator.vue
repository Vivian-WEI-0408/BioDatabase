<template>
  <div class="modal-inner">
    <div class="modal-header">
      <div class="model-header__left">
        <div class="modal-title">Add Transcriptional Regulators</div>
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
    <div class="modal-steps">
      <div class="modal-step" :class="{ active: step === 1 }"></div>
      <div class="modal-step" :class="{ active: step === 2 }"></div>
    </div>

    <template v-if="step === 1">
      <div class="modal-body auto-width">
        <div class="form1 activator-form">
          <div class="form-group">
            <div class="form-label-top">
              <div class="form-label-text">Regulation Type</div>
            </div>
            <div class="form-input-box">
              <van-radio-group shape="dot" class="form-input-box__checkboxes" v-model="f.regulationType">
                <van-radio name="single">Single regulation</van-radio>
                <van-radio name="double">Double regulation</van-radio>
              </van-radio-group>
            </div>
          </div>
          <div class="form-group">
            <div class="form-label-top">
              <div class="form-label-text">Registration Method</div>
            </div>
            <div class="form-input-box">
              <van-radio-group shape="dot" class="form-input-box__checkboxes" v-model="f.method">
                <van-radio name="new">Create new regulator(s)</van-radio>
                <van-radio name="existing">Create from existing regulator(s)</van-radio>
              </van-radio-group>
            </div>
          </div>
          <div class="form-group" v-if="f.method === 'existing'">
            <div class="form-label-top">
              <div class="form-label-text">Existing regulators</div>
            </div>
            <div class="form-input-box">
              <multi-select-box v-model="f.regulators" :items="list.regulator" placeholder="Select regulators" />
            </div>
            <div class="form-err">
              <div class="form-err-text">{{ err.regulators }}</div>
            </div>
          </div>
          <div class="form-group" v-if="f.method === 'new'">
            <div class="form-label-top">
              <div class="form-label-text">Datasets For Characterizing The Regulation</div>
            </div>
            <div class="form-input-box">
              <multi-select-box v-model="f.datasets" :items="list.dataset" placeholder="Select datasets" />
            </div>
            <div class="form-err">
              <div class="form-err-text">{{ err.datasets }}</div>
            </div>
          </div>
          <div class="form-group" v-if="f.method === 'new'">
            <div class="form-label-top">
              <div class="form-label-text">Predictor for estimating the promoter strength</div>
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
          <a class="btn btn-primary" :class="{ disabled: loading }" @click="goStep2()">Next</a>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="modal-body auto-width column-layout">
        <div class="form1 activator-form" v-for="(component, index) in components" :key="index">
          <div class="form-section-title" v-if="components.length > 1">
            <div class="form-section-title__text">Transcription Factor {{ index + 1 }}</div>
          </div>
          <div class="form-group" v-if="f.method === 'new' && f.regulationType === 'single'">
            <div class="form-label-top">
              <div class="form-label-text">The Type Of Transcription Factor (TF)</div>
            </div>
            <div class="form-input-box">
              <van-radio-group shape="dot" class="form-input-box__checkboxes" v-model="f.subtype">
                <van-radio name="activation">Activating TF</van-radio>
                <van-radio name="repression">Repressive TF</van-radio>
              </van-radio-group>
            </div>
          </div>
          <div class="form-group">
            <div class="form-label-top">
              <div class="form-label-text">TF name</div>
            </div>
            <div class="form-input-box"><input class="form-input" v-model="component.name"></div>
            <div class="form-err">
              <div class="form-err-text">{{ err[`name${index}`] }}</div>
            </div>
          </div>
          <div class="form-group">
            <div class="form-label-top">
              <div class="form-label-text">Customize the sequence of TF binding sites</div>
            </div>
            <div class="form-input-box">
              <textarea class="form-input multiple-line" rows="2" v-model="component.sequence"></textarea>
            </div>
          </div>
          <template v-if="f.method === 'new'">
            <div class="form-group">
              <div class="form-label-top">
                <div class="form-label-text">Condition variable of TF concentration</div>
              </div>
              <div class="form-input-box">
                <select-box :ref="`selCondition1_${index}`" placeholder="Select condition"
                  :items="list.conditions" @select="component.condition1 = $event.ID"></select-box>
              </div>
              <div class="form-err">
                <div class="form-err-text">{{ err[`condition1_${index}`] }}</div>
              </div>
            </div>
            <div class="form-group">
              <div class="form-label-top">
                <div class="form-label-text">Condition variable of TF induction</div>
              </div>
              <div class="form-input-box">
                <select-box :ref="`selCondition2_${index}`" placeholder="Select condition"
                  :items="list.conditions" @select="component.condition2 = $event.ID"></select-box>
              </div>
              <div class="form-err">
                <div class="form-err-text">{{ err[`condition2_${index}`] }}</div>
              </div>
            </div>
            <div class="form-group">
              <div class="form-label-top">
                <div class="form-label-text">Scaling Factor</div>
              </div>
              <div class="form-input-box">
                <input class="form-input" type="number" min="0" step="1" v-model.number="component.scaling">
              </div>
              <div class="form-err">
                <div class="form-err-text">{{ err[`scaling${index}`] }}</div>
              </div>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="component.useInduction">
                Also use datasets to calibrate the TF concentration
              </label>
            </div>
            <div class="form-group" v-if="component.useInduction">
              <div class="form-label-top">
                <div class="form-label-text">Induction datasets</div>
              </div>
              <div class="form-input-box">
                <multi-select-box v-model="component.inductionDatasets" :items="list.dataset"
                  placeholder="Select datasets" />
              </div>
              <div class="form-err">
                <div class="form-err-text">{{ err[`induction${index}`] }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div class="modal-body second" v-if="f.method === 'new'">
        <div class="form1 activator-form">
          <div class="form-group">
            <label class="checkbox-label"><input type="checkbox" v-model="f.fitMaximum"> Adjust the maximum output</label>
          </div>
          <div class="form-group">
            <label class="checkbox-label"><input type="checkbox" v-model="f.bias"> Adjust the minimum output</label>
          </div>
          <div class="form-group">
            <label class="checkbox-label"><input type="checkbox" v-model="f.cooperativity"> Adjust the binding cooperativity</label>
          </div>
          <div class="form-group">
            <label class="checkbox-label"><input type="checkbox" v-model="f.hybridFunction"> Extend the model for transcription initiation (+1 parameter)</label>
          </div>
          <div class="form-group">
            <label class="checkbox-label"><input type="checkbox" v-model="f.crossValidation"> Cross-validate on the split datasets</label>
          </div>
          <div class="form-group">
            <div class="form-label-top">
              <div class="form-label-text">Seed for the random number generator</div>
            </div>
            <div class="form-input-box"><input class="form-input" type="number" min="0" v-model="f.seed"></div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <div class="form-buttons">
          <a class="btn btn-outline" @click="step = 1">Back</a>
          <a class="btn btn-danger" @click="resetForm()">Reset</a>
          <a class="btn btn-primary" :class="{ disabled: busying }" @click="save()">Register</a>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import SelectBox from '../parts/select-box.vue';
import MultiSelectBox from '../parts/multi-select-box.vue';
import { buildTaskName, showTaskQueuedDialog, submitTproTask } from '../../assets/js/tpro-task.js';
import {
  emptyRegulatorComponent,
  loadConditionNames,
  loadExpressionDatasets,
  loadPredictors,
  loadRegulators,
  selectLatestItem,
} from '../../assets/js/tpro-create-loaders.js';

export default {
  props: {
    speciesId: { type: Number, required: true },
  },
  components: { SelectBox, MultiSelectBox },
  created() {
    this.defaultF = mirror(this.f);
    this.resetComponents();
  },
  mounted() {
    this.loadLists();
  },
  watch: {
    'f.regulationType'() {
      this.resetComponents();
    },
  },
  computed: {
    components() {
      return this.componentList;
    },
    resolvedSubtype() {
      if (this.f.regulationType === 'double') {
        return 'activation+repression';
      }
      return this.f.subtype;
    },
    combinedName() {
      return this.componentList.map((item) => item.name.trim()).filter(Boolean).join('+');
    },
  },
  methods: {
    resetComponents() {
      const count = this.f.regulationType === 'double' ? 2 : 1;
      this.componentList = Array.from({ length: count }, () => emptyRegulatorComponent());
    },
    async loadLists() {
      this.loading = true;
      try {
        const [datasets, predictors, regulators] = await Promise.all([
          loadExpressionDatasets(this.speciesId),
          loadPredictors(this.speciesId),
          loadRegulators(this.speciesId),
        ]);
        this.list.dataset = datasets;
        this.list.predictor = predictors;
        this.list.regulator = regulators;
        await this.$nextTick();
        selectLatestItem(this.list.predictor, this.$refs.selPredictor);
        if (this.list.predictor.length) {
          this.f.predictor = this.list.predictor[this.list.predictor.length - 1].ID;
        }
      } finally {
        this.loading = false;
      }
    },
    async loadConditions() {
      if (this.f.method !== 'new') {
        this.list.conditions = [];
        return;
      }
      this.list.conditions = await loadConditionNames(this.f.datasets);
    },
    resetForm() {
      copyFrom(this.f, this.defaultF);
      this.step = 1;
      this.resetComponents();
      G.clearObject(this.err);
      selectLatestItem(this.list.predictor, this.$refs.selPredictor);
    },
    validateStep1() {
      G.clearObject(this.err);
      let valid = true;
      if (this.f.method === 'existing') {
        const required = this.f.regulationType === 'double' ? 2 : 1;
        if (this.f.regulators.length !== required) {
          this.err.regulators = `Select ${required} regulator(s)`;
          valid = false;
        }
      } else {
        if (!this.f.datasets.length) {
          this.err.datasets = 'Required';
          valid = false;
        }
        if (!this.f.predictor) {
          this.err.predictor = 'Required';
          valid = false;
        }
      }
      return valid;
    },
    validateStep2() {
      G.clearObject(this.err);
      let valid = true;

      this.componentList.forEach((component, index) => {
        if (!component.name?.trim()) {
          this.err[`name${index}`] = 'Required';
          valid = false;
        }
        if (this.f.method === 'new') {
          if (!component.condition1) {
            this.err[`condition1_${index}`] = 'Required';
            valid = false;
          }
          if (!component.condition2) {
            this.err[`condition2_${index}`] = 'Required';
            valid = false;
          }
          if (component.scaling == null || component.scaling < 0) {
            this.err[`scaling${index}`] = 'Required';
            valid = false;
          }
          if (component.useInduction && !component.inductionDatasets.length) {
            this.err[`induction${index}`] = 'Required';
            valid = false;
          }
        }
      });

      return valid;
    },
    async goStep2() {
      if (!this.validateStep1()) {
        return;
      }
      await this.loadConditions();
      this.step = 2;
    },
    buildParams() {
      const params = {
        speciesID: this.speciesId,
        name: this.combinedName,
        regulationType: this.f.regulationType,
        method: this.f.method,
        subtype: this.resolvedSubtype,
        datasets: this.f.method === 'new' ? [...this.f.datasets] : [],
        regulators: this.f.method === 'existing' ? [...this.f.regulators] : [],
        predictor: this.f.method === 'new' ? this.f.predictor : null,
        components: this.componentList.map((component) => ({
          name: component.name.trim(),
          sequence: component.sequence || '',
          condition1: this.f.method === 'new' ? component.condition1 : null,
          condition2: this.f.method === 'new' ? component.condition2 : null,
          useInduction: this.f.method === 'new' ? component.useInduction : false,
          inductionDatasets: this.f.method === 'new' ? [...component.inductionDatasets] : [],
          scaling: this.f.method === 'new' ? component.scaling : 1,
        })),
        crossValidation: this.f.crossValidation,
        bias: this.f.bias,
        cooperativity: this.f.cooperativity,
        hybridFunction: this.f.hybridFunction,
        fitMaximum: this.f.fitMaximum,
      };

      if (this.f.seed !== '' && this.f.seed != null) {
        params.seed = Number(this.f.seed);
      }

      return params;
    },
    async save() {
      if (this.busying || !this.validateStep2()) {
        return;
      }

      this.busying = true;
      try {
        const task = await submitTproTask({
          operation: 'regulator/register',
          name: buildTaskName('Creating transcriptional regulator'),
          params: this.buildParams(),
          displayMeta: { label: this.combinedName },
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
      step: 1,
      defaultF: null,
      componentList: [],
      f: {
        regulationType: 'single',
        method: 'new',
        subtype: 'activation',
        datasets: [],
        regulators: [],
        predictor: null,
        fitMaximum: false,
        bias: false,
        cooperativity: false,
        hybridFunction: false,
        crossValidation: false,
        seed: '',
      },
      err: {},
      list: {
        dataset: [],
        predictor: [],
        regulator: [],
        conditions: [],
      },
    };
  },
};
</script>
