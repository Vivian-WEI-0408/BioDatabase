<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">T-Pro</div>
      <div>
        <van-popover v-model:show="showSpeciesSelect" placement="bottom">
          <div class="scroll-box" style="max-height: 218px;">
            <div role="menuitem" class="van-popover__action" tabindex="0" v-for="(item, i) in list.species" :key="i">
              <div class="van-popover__action-text van-hairline--bottom" @click="onSelectSpecies(item)">
                {{ item.name }}</div>
            </div>
          </div>
          <template #reference>
            <div class="select-box">
              <div class="text" v-if="selectedSpecies">
                Current Species: <b>{{ selectedSpecies.name }}</b>
              </div>
              <div class="text" v-else>
                Select Species
              </div>
              <svg width="15" height="7" viewbox="0 0 15 7" fill="none" class="icon">
                <path d="M0.5 0.5L4.5 4.5L8.5 0.5" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
          </template>
        </van-popover>
      </div>
      <a class="btn btn-primary" @click="showAddSpecies = true">
        <svg class="fill-icon" viewBox="0 0 1024 1024" width="14" height="14">
          <path
            d="M511.69700348 1010.27680591c29.01186061 0 53.27678401-23.07819013 53.27678538-51.48405908V565.27678401h382.2798636c28.40586894 0 53.27678401-24.23967472 53.276784-53.25153394 0-28.98661055-24.87091644-52.67079235-53.276784-52.67079236h-382.2798636v-394.14720454c0-28.3806189-24.2649234-51.45880902-53.27678538-51.45880903-28.98661055 0-52.67079235 23.07819013-52.67079234 51.48405772v394.14720451h-382.2798636c-28.40586894 0-53.27678401 23.65893174-53.276784 52.6455437s24.87091644 53.27678401 53.276784 53.276784h382.2798636v393.51596283c0 28.40586894 23.6841818 51.50930775 52.67079234 51.50930775z">
          </path>
        </svg>
        <span>Add Species</span>
      </a>
    </div>
    <div class="page-body">
      <div class="item-stats-grid">
        <div class="stat-item stat-item--clickable" v-for="item in statItems" :key="item.key"
          @click="openResourceManage(item.key)">
          <img loading="lazy" src="/images/dataset.png" alt="" class="stat-item-img">
          <div class="stat-item-text">
            <div class="stat-item-num">{{ stats[item.key] }}</div>
            <div class="stat-item-name" v-html="item.label"></div>
          </div>
        </div>
      </div>
      <div class="block-box">
        <div class="block-header">
          <div class="block-title">Operations</div>
        </div>
        <div class="block-body">
          <div class="operation-left">
            <a class="btn btn-info" @click="showDesignNewPromoters = true">Design new promoters</a>
          </div>
          <div class="operation-right">
            <a class="btn btn-primary" @click="showPredictingPromoterStrengths = true"><b>Predict</b> promoter strength</a>
            <a class="btn btn-primary" @click="showGeneratingPromoterSequences = true"><b>Generate</b> promoter sequences</a>
            <a class="btn btn-primary" @click="showGeneratingPromoterLibraries = true"><b>Design</b> promoter libraries</a>
            <a class="btn btn-primary" @click="showOptimizingTranscriptionalRegulation = true"><b>Optimize</b> transcriptional regulation</a>
          </div>
        </div>
      </div>
    </div>
    <van-popup v-model:show="showAddSpecies" v-if="showAddSpecies" :close-on-click-overlay="false">
      <add-species @create="loadSpecies" @close="showAddSpecies = false"></add-species>
    </van-popup>
    <van-popup v-model:show="showDesignNewPromoters" v-if="showDesignNewPromoters" :close-on-click-overlay="false">
      <design-new-promoters :speciesId="selectedSpecies.ID"
        @close="showDesignNewPromoters = false"></design-new-promoters>
    </van-popup>
    <van-popup v-model:show="showPredictingPromoterStrengths" v-if="showPredictingPromoterStrengths" :close-on-click-overlay="false">
      <predicting-promoter-strengths :speciesId="selectedSpecies.ID"
        @close="showPredictingPromoterStrengths = false"></predicting-promoter-strengths>
    </van-popup>
    <van-popup v-model:show="showGeneratingPromoterSequences" v-if="showGeneratingPromoterSequences" :close-on-click-overlay="false">
      <generating-promoter-sequences :speciesId="selectedSpecies.ID"
        @close="showGeneratingPromoterSequences = false"></generating-promoter-sequences>
    </van-popup>
    <van-popup v-model:show="showGeneratingPromoterLibraries" v-if="showGeneratingPromoterLibraries" :close-on-click-overlay="false">
      <generating-promoter-libraries :speciesId="selectedSpecies.ID"
        @close="showGeneratingPromoterLibraries = false"></generating-promoter-libraries>
    </van-popup>
    <van-popup v-model:show="showOptimizingTranscriptionalRegulation" v-if="showOptimizingTranscriptionalRegulation" :close-on-click-overlay="false">
      <optimizing-transcriptional-regulation :speciesId="selectedSpecies.ID"
        @close="showOptimizingTranscriptionalRegulation = false"></optimizing-transcriptional-regulation>
    </van-popup>
    <van-popup v-model:show="showResourceManage" v-if="showResourceManage && activeResourceKey && selectedSpecies"
      :close-on-click-overlay="false">
      <tpro-resource-manage ref="resourceManageRef" :resourceKey="activeResourceKey" :speciesId="selectedSpecies.ID"
        @create="onResourceCreate" @refresh="loadStats" @close="closeResourceManage"></tpro-resource-manage>
    </van-popup>
    <van-popup v-model:show="showUploadDataset" v-if="showUploadDataset && uploadDatasetConfig && selectedSpecies"
      :close-on-click-overlay="false" :z-index="3000">
      <upload-dataset :speciesId="selectedSpecies.ID" :datasetType="uploadDatasetConfig.datasetType"
        :fileType="uploadDatasetConfig.fileType" :resourceTitle="uploadDatasetConfig.title"
        @created="onDatasetCreated" @close="showUploadDataset = false"></upload-dataset>
    </van-popup>
    <van-popup v-model:show="showCreateResource" v-if="showCreateResource && activeCreateModal && selectedSpecies"
      :close-on-click-overlay="false" :z-index="3000">
      <component :is="activeCreateModal" :speciesId="selectedSpecies.ID" @completed="onResourceRegistered"
        @close="showCreateResource = false"></component>
    </van-popup>
  </div>
</template>

<script>
import AddSpecies from './modals/add-species.vue';
import DesignNewPromoters from './modals/design-new-promoters.vue';
import GeneratingPromoterSequences from './modals/generating-promoter-sequences.vue';
import PredictingPromoterStrengths from './modals/predicting-promoter-strengths.vue';
import GeneratingPromoterLibraries from './modals/generating-promoter-libraries.vue';
import OptimizingTranscriptionalRegulation from './modals/optimizing-transcriptional-regulation.vue';
import TproResourceManage from './modals/tpro-resource-manage.vue';
import UploadDataset from './modals/upload-dataset.vue';
import CreateReporter from './modals/create-reporter.vue';
import CreatePromoterGenerator from './modals/create-promoter-generator.vue';
import CreateActivator from './modals/create-activator.vue';
import CreatePredictor from './modals/create-predictor.vue';
import CreateRegulator from './modals/create-regulator.vue';
import { getTproResource } from '../assets/js/tpro-resources.js';
import { STAT_ITEMS, createEmptyStats, fetchTproStats } from '../assets/js/tpro-stats.js';

const CREATE_MODAL_MAP = {
  'create-reporter': CreateReporter,
  'create-promoter-generator': CreatePromoterGenerator,
  'create-activator': CreateActivator,
  'create-predictor': CreatePredictor,
  'create-regulator': CreateRegulator,
};

export default {
  components: {
    AddSpecies,
    DesignNewPromoters,
    PredictingPromoterStrengths,
    GeneratingPromoterSequences,
    GeneratingPromoterLibraries,
    OptimizingTranscriptionalRegulation,
    TproResourceManage,
    UploadDataset,
  },
  created() {
    let t = this;
    t.loadSpecies();
  },
  mounted() {
  },
  methods: {
    loadSpecies() {

      let t = this;

      t.list.species.clear();

      tpro.get('species/show').then(res => {
        if (res.status == 200) {
          t.list.species = res.data;
          t.selectedSpecies = t.list.species[0];
          t.loadStats();

          debug(()=>{
            // t.showDesignNewPromoters = true;
            // t.showPredictingPromoterStrengths = true;
            // t.showGeneratingPromoterSequences = true;
            // t.showGeneratingPromoterLibraries = true;
            // t.showOptimizingTranscriptionalRegulation = true;
          });

        }
      });

    },
    async loadStats() {
      let t = this;

      if (!t.selectedSpecies?.ID) {
        return;
      }

      t.statsLoading = true;

      try {
        const stats = await fetchTproStats(t.selectedSpecies.ID);

        if (stats) {
          t.stats = stats;
        }
      } catch (err) {
        console.error(err);
      } finally {
        t.statsLoading = false;
      }
    },
    onSelectSpecies(item) {
      let t = this;
      t.selectedSpecies = item;
      t.showSpeciesSelect = false;
      t.loadStats();
    },
    openResourceManage(resourceKey) {
      let t = this;

      if (!t.selectedSpecies?.ID) {
        A.err('Please select a species first.');
        return;
      }

      t.activeResourceKey = resourceKey;
      t.showResourceManage = true;
    },
    closeResourceManage() {
      this.showResourceManage = false;
      this.activeResourceKey = null;
    },
    onResourceCreate(resourceKey) {
      let t = this;
      const resource = getTproResource(resourceKey);

      if (!resource?.canCreate) {
        return;
      }

      if (resource.datasetType) {
        t.uploadDatasetConfig = {
          datasetType: resource.datasetType,
          fileType: resource.fileType,
          title: resource.title,
        };
        t.showUploadDataset = true;
        return;
      }

      const modal = CREATE_MODAL_MAP[resource.createModal];
      if (!modal) {
        return;
      }

      t.activeCreateModal = modal;
      t.showCreateResource = true;
    },
    onResourceRegistered(task) {
      if (task?.status === 'completed') {
        this.loadStats();
        this.$refs.resourceManageRef?.loadItems();
      }
    },
    onDatasetCreated() {
      let t = this;

      t.showUploadDataset = false;
      t.uploadDatasetConfig = null;
      t.loadStats();
      t.$refs.resourceManageRef?.loadItems();
    },
  },
  data() {
    return {
      selectedSpecies: null,
      showSpeciesSelect: false,
      showAddSpecies: false,
      showDesignNewPromoters: false,
      showPredictingPromoterStrengths: false,
      showGeneratingPromoterSequences: false,
      showGeneratingPromoterLibraries: false,
      showOptimizingTranscriptionalRegulation: false,
      showResourceManage: false,
      activeResourceKey: null,
      showUploadDataset: false,
      uploadDatasetConfig: null,
      showCreateResource: false,
      activeCreateModal: null,
      statItems: STAT_ITEMS,
      stats: createEmptyStats(),
      statsLoading: false,
      list: {
        species: [
        ]
      }
    };
  },
};
</script>

<style lang="scss" scoped></style>