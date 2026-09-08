<template>
  <div class="datasets-categories-page">
    <dataset-browse-filter :groups="filterGroups" :model-value="filters" @update:model-value="filters = $event" />

    <div class="datasets-categories__main">
      <div class="categories-banner">
        <div class="categories-banner__title">Featured DNA Parts</div>
        <div class="categories-banner__decor" aria-hidden="true">
          <img src="/images/categories/Featured DNA Parts.png" alt="" loading="lazy" />
        </div>
      </div>

      <div v-if="visibleDnaParts.length" class="datasets-categories__grid">
        <categories-part-card
          v-for="part in visibleDnaParts"
          :key="part.id"
          :title="part.title"
          :subtitle="part.subtitle"
          :verified="part.verified"
          :to="buildBrowseRoute(part)"
        />
      </div>

      <div class="categories-banner">
        <div class="categories-banner__title">Logic Gates & Circuits</div>
        <div class="categories-banner__decor" aria-hidden="true">
          <img src="/images/categories/Logic Gates & Circuits.png" alt="" loading="lazy" />
        </div>
      </div>

      <div v-if="visibleCircuitParts.length" class="datasets-categories__grid">
        <categories-part-card
          v-for="part in visibleCircuitParts"
          :key="part.id"
          :title="part.title"
          :subtitle="part.subtitle"
          :verified="part.verified"
          disabled
        />
      </div>

      <div v-if="visibleDnaParts.length === 0 && visibleCircuitParts.length === 0" class="datasets-categories__empty">
        No parts match the selected filters.
      </div>
    </div>
  </div>
</template>

<script>
import DatasetBrowseFilter from './dataset-browse/dataset-browse-filter.vue';
import CategoriesPartCard from './datasets/categories-part-card.vue';

export default {
  name: 'datasets-categories',
  components: {
    DatasetBrowseFilter,
    CategoriesPartCard,
  },
  data() {
    return {
      filterGroups: [
        {
          id: 'partType',
          title: 'Part Type',
          expanded: true,
          options: ['Promoter', 'RBS', 'CDS', 'Terminator'],
        },
        {
          id: 'function',
          title: 'Function',
          expanded: true,
          options: ['Regulation', 'Enzymatic', 'Structural'],
        },
        {
          id: 'chassis',
          title: 'Chassis',
          expanded: true,
          options: ['E. coli', 'Yeast', 'Mammalian'],
        },
      ],
      parts: [
        {
          id: 'p1',
          title: 'Promoter',
          subtitle: '(P_inducible_T7)',
          verified: true,
          section: 'dna',
          partType: 'Promoter',
          function: 'Regulation',
          chassis: 'E. coli',
          imageType: 'promoter',
          datasetType: 'part',
          initialType: 'Promoter',
        },
        {
          id: 'p2',
          title: 'RBS',
          subtitle: '(RBS_optimized)',
          verified: true,
          section: 'dna',
          partType: 'RBS',
          function: 'Regulation',
          chassis: 'E. coli',
          imageType: 'rbs',
          datasetType: 'part',
          initialType: 'RBS',
        },
        {
          id: 'p3',
          title: 'CDS',
          subtitle: '(P_inducible_T7)',
          verified: true,
          section: 'dna',
          partType: 'CDS',
          function: 'Enzymatic',
          chassis: 'E. coli',
          imageType: 'cds',
          datasetType: 'part',
          initialType: 'CDS',
        },
        {
          id: 'p4',
          title: 'Terminator',
          subtitle: '(T_strong_stemloop)',
          verified: true,
          section: 'dna',
          partType: 'Terminator',
          function: 'Regulation',
          chassis: 'E. coli',
          imageType: 'terminator',
          datasetType: 'part',
          initialType: 'Terminator',
        },
        {
          id: 'p5',
          title: 'Backbone',
          subtitle: '(pUC19 Backbone)',
          verified: true,
          section: 'dna',
          partType: 'Backbone',
          function: 'Structural',
          chassis: 'E. coli',
          imageType: 'backbone',
          datasetType: 'backbone',
        },
        {
          id: 'p6',
          title: 'Plasmid',
          subtitle: '(Plasmid_pBR322)',
          verified: true,
          section: 'dna',
          partType: 'Plasmid',
          function: 'Structural',
          chassis: 'E. coli',
          imageType: 'plasmid',
          datasetType: 'plasmid',
        },
   
        {
          id: 'c1',
          title: 'AND Gate',
          subtitle: '(Circuit_AND_01)',
          verified: false,
          section: 'circuits',
          partType: 'Device',
          function: 'Regulation',
          chassis: 'E. coli',
          imageType: 'and',
        },
        {
          id: 'c2',
          title: 'NOT Gate',
          subtitle: '(Inverter_B)',
          verified: false,
          section: 'circuits',
          partType: 'Device',
          function: 'Regulation',
          chassis: 'E. coli',
          imageType: 'not',
        },
        {
          id: 'c3',
          title: 'NAND Gate',
          subtitle: '(Universal_NAND)',
          verified: false,
          section: 'circuits',
          partType: 'Device',
          function: 'Regulation',
          chassis: 'Yeast',
          imageType: 'nand',
        },
        {
          id: 'c4',
          title: 'NOR Gate',
          subtitle: '(Circuit_NOR_D)',
          verified: false,
          section: 'circuits',
          partType: 'Device',
          function: 'Regulation',
          chassis: 'Yeast',
          imageType: 'nor',
        },
        {
          id: 'c5',
          title: 'Operational Amplifier',
          subtitle: '(......)',
          verified: false,
          section: 'circuits',
          partType: 'Device',
          function: 'Structural',
          chassis: 'Mammalian',
          imageType: 'opamp',
        },
      ],
      filters: {
        partType: [],
        function: [],
        chassis: [],
      },
    };
  },
  computed: {
    filteredParts() {
      return this.parts.filter((part) => {
        return ['partType', 'function', 'chassis'].every((groupId) => {
          const selected = this.filters[groupId] || [];
          if (selected.length === 0) {
            return true;
          }
          return selected.includes(part[groupId]);
        });
      });
    },
    visibleDnaParts() {
      return this.filteredParts.filter((part) => part.section === 'dna');
    },
    visibleCircuitParts() {
      return this.filteredParts.filter((part) => part.section === 'circuits');
    },
  },
  methods: {
    buildBrowseRoute(part) {
      if (!part.datasetType) {
        return null;
      }
      const query = { datasetType: part.datasetType };
      if (part.initialType) {
        query.type = part.initialType;
      }
      return {
        name: 'dataset-browse',
        params: { id: 'component-library' },
        query,
      };
    },
  },
};
</script>
