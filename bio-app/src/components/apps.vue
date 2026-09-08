<template>
  <div class="page-container apps-page">
    <div class="apps-page__header">
      <div class="page-title">Apps</div>
      <div class="apps-search">
        <input
          v-model.trim="searchQuery"
          type="search"
          class="apps-search__input"
          placeholder="Search apps..."
          aria-label="Search apps"
        >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="apps-search__icon">
          <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
          <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
    </div>

    <div class="page-body apps-page__body">
      <div class="list-panel">
        <div v-if="loading" class="loading-box">
          <img class="loading-box__icon" src="/images/loading.png" alt="">
          <div class="loading-box__text">Loading...</div>
        </div>
        <template v-else>
          <div class="scroll-body scroll-body--grid">
            <app-card
              v-for="app in paginatedList"
              :key="app.id"
              :title="app.title"
              :description="app.description"
              :icon="app.icon"
              :author="app.author"
              :date="app.date"
              :task-count="app.taskCount"
              :route="app.route"
              :starred="app.starred"
              @toggle-star="toggleStar(app.id)"
            />
            <div v-if="paginationTotal === 0" class="apps-empty">No apps found.</div>
          </div>
          <list-pagination
            :current-page="currentPage"
            :total-pages="totalPages"
            :total="paginationTotal"
            :page-size="pageSize"
            :page-input="pageInput"
            @update:page-input="pageInput = $event"
            @prev="prevPage"
            @next="nextPage"
            @jump="submitPageJump"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import AppCard from './apps/app-card.vue';
import ListPagination from './parts/list-pagination.vue';
import paginationMixin from '../assets/js/pagination.js';

export default {
  name: 'apps',
  components: {
    AppCard,
    ListPagination,
  },
  mixins: [paginationMixin],
  data() {
    return {
      searchQuery: '',
      apps: [],
      loading: false,
      pageSize: 12,
    };
  },
  computed: {
    filteredApps() {
      if (!this.searchQuery) {
        return this.apps;
      }
      const q = this.searchQuery.toLowerCase();
      return this.apps.filter(
        (app) =>
          app.title.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q) ||
          app.author.toLowerCase().includes(q)
      );
    },
    paginationList() {
      return this.filteredApps;
    },
  },
  created() {
    this.loadApps();
  },
  methods: {
    async loadApps() {
      this.loading = true;
      try {
        const res = await axios.post('apps/list');
        if (res.data.status == 1) {
          this.apps = res.data.options.apps || [];
        } else if (res.data.status == 2) {
          this.$router.replace('/signin');
        }
      } catch (e) {
        // keep empty list
      } finally {
        this.loading = false;
      }
    },
    async toggleStar(id) {
      const app = this.apps.find((item) => item.id === id);
      if (!app) {
        return;
      }
      const previous = app.starred;
      app.starred = !app.starred;
      try {
        const res = await axios.post('apps/toggleStar', { appId: id });
        if (res.data.status == 1) {
          app.starred = res.data.options.starred;
        } else if (res.data.status == 2) {
          app.starred = previous;
          this.$router.replace('/signin');
        } else {
          app.starred = previous;
        }
      } catch (e) {
        app.starred = previous;
      }
    },
  },
};
</script>
