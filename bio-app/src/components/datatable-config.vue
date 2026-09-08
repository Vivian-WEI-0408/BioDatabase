<template>
  <div class="datatable-config-page">
    <dataset-legacy-sidebar
      :sections="visibleSections"
      :active-table-id="activeTableId"
      :search-query="sidebarSearch"
      @update:search-query="sidebarSearch = $event"
      @select-table="selectTable"
      @toggle-section="toggleSection"
    />
    <datatable-config-main
      :table-id="activeTableId"
      :table-name="currentConfig.name"
      :config="currentConfig"
      @update-basic="updateBasic"
      @update-sharing="updateSharing"
      @remove-user="removeUser"
    />
  </div>
</template>

<script>
import DatasetLegacySidebar from './datasets-legacy/dataset-legacy-sidebar.vue';
import DatatableConfigMain from './datatable-config/datatable-config-main.vue';
import {
  cloneConfig,
  cloneSections,
  datatableConfigSections,
  datatableConfigs,
  defaultTableId,
  findSectionForTable,
  getTableConfigById,
  isKnownTableId,
} from '../data/datatable-config-mock.js';

export default {
  name: 'datatable-config',
  components: {
    DatasetLegacySidebar,
    DatatableConfigMain,
  },
  data() {
    const routeId = this.$route.params.id;
    const activeTableId = isKnownTableId(routeId) ? routeId : defaultTableId;
    return {
      sections: cloneSections(datatableConfigSections),
      configs: Object.fromEntries(
        Object.entries(datatableConfigs).map(([id, config]) => [id, cloneConfig(config)])
      ),
      activeTableId,
      sidebarSearch: '',
    };
  },
  computed: {
    currentConfig() {
      return getTableConfigById(this.activeTableId, this.configs);
    },
    visibleSections() {
      const query = this.sidebarSearch.trim().toLowerCase();
      if (!query) {
        return this.sections;
      }
      return this.sections
        .map((section) => {
          const tables = section.tables.filter((table) =>
            table.title.toLowerCase().includes(query)
          );
          if (!tables.length) {
            return null;
          }
          return {
            ...section,
            expanded: true,
            tables,
          };
        })
        .filter(Boolean);
    },
  },
  created() {
    this.expandSectionForTable(this.activeTableId);
    if (this.$route.params.id !== this.activeTableId) {
      this.$router.replace({
        name: 'datatable-config',
        params: { id: this.activeTableId },
      });
    }
  },
  watch: {
    '$route.params.id'(id) {
      if (id && isKnownTableId(id) && id !== this.activeTableId) {
        this.activeTableId = id;
        this.expandSectionForTable(id);
      }
    },
  },
  methods: {
    expandSectionForTable(tableId) {
      const section = findSectionForTable(tableId, this.sections);
      if (section) {
        const target = this.sections.find((item) => item.id === section.id);
        if (target) {
          target.expanded = true;
        }
      }
    },
    selectTable(tableId) {
      if (tableId === this.activeTableId) {
        return;
      }
      this.activeTableId = tableId;
      this.expandSectionForTable(tableId);
      this.$router.replace({
        name: 'datatable-config',
        params: { id: tableId },
      });
    },
    toggleSection(sectionId) {
      const section = this.sections.find((item) => item.id === sectionId);
      if (section) {
        section.expanded = !section.expanded;
      }
    },
    updateBasic(payload) {
      const current = this.configs[this.activeTableId] || getTableConfigById(this.activeTableId);
      this.configs = {
        ...this.configs,
        [this.activeTableId]: {
          ...current,
          name: payload.name,
          description: payload.description,
        },
      };
      const section = findSectionForTable(this.activeTableId, this.sections);
      if (section) {
        const targetSection = this.sections.find((item) => item.id === section.id);
        const table = targetSection?.tables.find((item) => item.id === this.activeTableId);
        if (table) {
          table.title = payload.name;
        }
      }
    },
    updateSharing(users) {
      const current = this.configs[this.activeTableId] || getTableConfigById(this.activeTableId);
      this.configs = {
        ...this.configs,
        [this.activeTableId]: {
          ...current,
          sharedUsers: users.map((user) => ({ ...user })),
        },
      };
    },
    removeUser(userId) {
      const current = getTableConfigById(this.activeTableId, this.configs);
      this.configs = {
        ...this.configs,
        [this.activeTableId]: {
          ...current,
          sharedUsers: current.sharedUsers.filter((user) => user.id !== userId),
        },
      };
    },
  },
};
</script>
