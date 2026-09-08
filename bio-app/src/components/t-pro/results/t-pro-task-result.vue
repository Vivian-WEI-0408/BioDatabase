<template>
  <component :is="resultComponent" v-if="resultComponent" :result="result" v-bind="resultProps" />
  <div v-else class="tasks-empty">Unsupported task result type.</div>
</template>

<script>
import PromoterSequenceResult from './promoter-sequence-result.vue';
import PromoterLibraryResult from './promoter-library-result.vue';
import RegulationDesignResult from './regulation-design-result.vue';
import RegulationOptimizeResult from './regulation-optimize-result.vue';
import ReporterRegisterResult from './reporter-register-result.vue';
import GeneratorRegisterResult from './generator-register-result.vue';
import ActivatorRegisterResult from './activator-register-result.vue';
import PredictorRegisterResult from './predictor-register-result.vue';
import RegulatorRegisterResult from './regulator-register-result.vue';
import AssemblyTaskResult from '../../assembly/assembly-task-result.vue';

const COMPONENT_MAP = {
  'promoter/generate': {
    component: PromoterSequenceResult,
    props: { mode: 'generate' },
  },
  'promoter/predict': {
    component: PromoterSequenceResult,
    props: { mode: 'predict' },
  },
  'library/generate': {
    component: PromoterLibraryResult,
    props: {},
  },
  'regulation/design': {
    component: RegulationDesignResult,
    props: {},
  },
  'regulation/optimize': {
    component: RegulationOptimizeResult,
    props: {},
  },
  'reporter/register': {
    component: ReporterRegisterResult,
    props: {},
  },
  'generator/register': {
    component: GeneratorRegisterResult,
    props: {},
  },
  'activator/register': {
    component: ActivatorRegisterResult,
    props: {},
  },
  'predictor/register': {
    component: PredictorRegisterResult,
    props: {},
  },
  'regulator/register': {
    component: RegulatorRegisterResult,
    props: {},
  },
  'assembly/direct': {
    component: AssemblyTaskResult,
    props: {},
  },
  'assembly/repository': {
    component: AssemblyTaskResult,
    props: {},
  },
  'assembly/excel': {
    component: AssemblyTaskResult,
    props: {},
  },
};

export default {
  name: 't-pro-task-result',
  components: {
    PromoterSequenceResult,
    PromoterLibraryResult,
    RegulationDesignResult,
    RegulationOptimizeResult,
    ReporterRegisterResult,
    GeneratorRegisterResult,
    ActivatorRegisterResult,
    PredictorRegisterResult,
    RegulatorRegisterResult,
    AssemblyTaskResult,
  },
  props: {
    operation: { type: String, required: true },
    result: { type: Object, required: true },
  },
  computed: {
    config() {
      return COMPONENT_MAP[this.operation] || null;
    },
    resultComponent() {
      return this.config?.component || null;
    },
    resultProps() {
      return this.config?.props || {};
    },
  },
};
</script>
