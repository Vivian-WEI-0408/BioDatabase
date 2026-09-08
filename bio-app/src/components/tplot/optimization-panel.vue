<template>
  <div class="tplot-panel tplot-panel--optimization">
    <div class="tplot-panel__title">Optimization</div>
    <p class="tplot-panel__desc">
      Optimization Part calculate LBD and DBD parameter to maximizing the module α*foldchange1 + β*foldchange2.
      Foldchange1 is ratio, and flodchange2 is difference between expression without inducer and expression with inducer.
    </p>
    <div class="form1 activator-form tplot-panel__form">
      <div class="form-group">
        <div class="form-label-top">
          <div class="form-label-text">α</div>
        </div>
        <div class="form-input-box">
          <select-box
            placeholder="Select α"
            :items="alphaOptions"
            :model-value="alpha"
            @select="$emit('update:alpha', $event)"
          />
        </div>
      </div>
      <div class="form-group">
        <div class="form-label-top">
          <div class="form-label-text">β</div>
        </div>
        <div class="form-input-box">
          <select-box
            placeholder="Select β"
            :items="betaOptions"
            :model-value="beta"
            @select="$emit('update:beta', $event)"
          />
        </div>
      </div>
      <div class="form-group">
        <div class="form-label-top">
          <div class="form-label-text">LBD (Optional)</div>
        </div>
        <div class="form-input-box">
          <select-box
            placeholder="Select LBD"
            :items="lbdOptionalOptions"
            :model-value="lbdOptional"
            @select="$emit('update:lbdOptional', $event)"
          />
        </div>
      </div>
      <div class="form-group">
        <div class="form-label-top">
          <div class="form-label-text">DBD (Optional)</div>
        </div>
        <div class="form-input-box">
          <select-box
            placeholder="Select DBD"
            :items="dbdOptionalOptions"
            :model-value="dbdOptional"
            @select="$emit('update:dbdOptional', $event)"
          />
        </div>
      </div>
    </div>
    <div class="tplot-panel__actions">
      <a class="btn btn-danger" :class="{ disabled: optimizing }" @click="$emit('reset')">Reset</a>
      <a class="btn btn-primary" :class="{ disabled: optimizing }" @click="$emit('optimize')">
        {{ optimizing ? 'Optimizing...' : 'Optimize' }}
      </a>
    </div>
    <div v-if="results" class="tplot-results">
      <div class="tplot-results__labels">
        <div>Optimal DBD:</div>
        <div>Optimal LBD:</div>
        <div>Optimal L:</div>
        <div>Optimal RPU:</div>
      </div>
      <div class="tplot-results__values">
        <div>{{ results.dbd }}</div>
        <div>{{ results.lbd }}</div>
        <div>{{ results.l }}</div>
        <div>{{ results.rpu }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import SelectBox from '../parts/select-box.vue';
import {
  alphaOptions,
  betaOptions,
  lbdOptionalOptions as mockLbdOptionalOptions,
  dbdOptionalOptions as mockDbdOptionalOptions,
} from '../../data/tplot-mock.js';
import {
  fetchDbdOptionalOptions,
  fetchLbdOptionalOptions,
} from '../../assets/js/tplot-api.js';

export default {
  name: 'optimization-panel',
  components: {
    SelectBox,
  },
  props: {
    alpha: {
      type: Object,
      default: null,
    },
    beta: {
      type: Object,
      default: null,
    },
    lbdOptional: {
      type: Object,
      default: null,
    },
    dbdOptional: {
      type: Object,
      default: null,
    },
    results: {
      type: Object,
      default: null,
    },
    optimizing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:alpha', 'update:beta', 'update:lbdOptional', 'update:dbdOptional', 'reset', 'optimize'],
  data() {
    return {
      alphaOptions,
      betaOptions,
      lbdOptionalOptions: mockLbdOptionalOptions,
      dbdOptionalOptions: mockDbdOptionalOptions,
    };
  },
  created() {
    this.loadOptionalOptions();
  },
  methods: {
    async loadOptionalOptions() {
      const [lbdOptions, dbdOptions] = await Promise.all([
        fetchLbdOptionalOptions(mockLbdOptionalOptions),
        fetchDbdOptionalOptions(mockDbdOptionalOptions),
      ]);
      this.lbdOptionalOptions = lbdOptions;
      this.dbdOptionalOptions = dbdOptions;
    },
  },
};
</script>
