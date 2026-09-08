<template>
  <div class="document-page">
    <doc-sidebar
      :sections="visibleSections"
      :active-page-id="activePageId"
      :search-query="searchQuery"
      @update:search-query="onSearch"
      @select-page="selectPage"
      @toggle-section="toggleSection"
    />
    <doc-summary
      :items="currentPage?.summary || []"
      :active-anchor-id="activeAnchorId"
      @select-anchor="onSelectAnchor"
    />
    <doc-content
      ref="docContent"
      v-if="!pageLoading && currentPage"
      :page="currentPage"
      :active-anchor-id="activeAnchorId"
      @update:active-anchor-id="activeAnchorId = $event"
    />
    <div v-else-if="pageLoading" class="document-main loading-box">
      <img class="loading-box__icon" src="/images/loading.png" alt="">
      <div class="loading-box__text">Loading...</div>
    </div>
  </div>
</template>

<script>
import DocSidebar from './document/doc-sidebar.vue';
import DocSummary from './document/doc-summary.vue';
import DocContent from './document/doc-content.vue';

function cloneSections(sections) {
  return sections.map((section) => ({
    ...section,
    items: [...section.items],
  }));
}

function findSectionForPage(sections, pageId) {
  return sections.find((section) =>
    section.items.some((item) => item.id === pageId)
  );
}

export default {
  name: 'document',
  components: {
    DocSidebar,
    DocSummary,
    DocContent,
  },
  data() {
    return {
      sections: [],
      activePageId: '',
      currentPage: null,
      pageLoading: false,
      activeAnchorId: '',
      searchQuery: '',
    };
  },
  computed: {
    visibleSections() {
      const query = this.searchQuery.trim().toLowerCase();
      if (!query) {
        return this.sections;
      }
      return this.sections
        .map((section) => {
          const items = section.items.filter((item) =>
            item.title.toLowerCase().includes(query)
          );
          if (!items.length) {
            return null;
          }
          return {
            ...section,
            expanded: true,
            items,
          };
        })
        .filter(Boolean);
    },
  },
  watch: {
    activePageId(pageId) {
      if (pageId) {
        this.fetchPage(pageId);
      }
    },
    '$route.query.pageId'(pageId) {
      const nextPageId = String(pageId || '').trim();
      if (nextPageId && nextPageId !== this.activePageId) {
        this.selectPage(nextPageId, false);
      }
    },
  },
  created() {
    this.fetchTree();
  },
  methods: {
    async fetchTree() {
      try {
        const res = await axios.post('documents/getTree');
        const data = res.data || {};
        if (data.status === 2) {
          this.$router.replace('/signin');
          return;
        }
        if (data.status === 1 && data.options) {
          this.sections = cloneSections(data.options.sections || []);
          const routePageId = String(this.$route.query.pageId || '').trim();
          this.activePageId = routePageId || data.options.defaultPageId || '';
        }
      } catch (e) {
        // keep empty state
      }
    },
    async fetchPage(pageId) {
      this.pageLoading = true;
      try {
        const res = await axios.post('documents/getPage', { pageId });
        const data = res.data || {};
        if (data.status === 2) {
          this.$router.replace('/signin');
          return;
        }
        if (data.status === 1 && data.options && data.options.page) {
          this.currentPage = data.options.page;
          this.activeAnchorId = data.options.page.summary?.[0]?.id || '';
        }
      } catch (e) {
        // keep previous page
      } finally {
        this.pageLoading = false;
      }
    },
    selectPage(pageId, syncRoute = true) {
      this.activePageId = pageId;
      const section = findSectionForPage(this.sections, pageId);
      if (section) {
        const target = this.sections.find((item) => item.id === section.id);
        if (target) {
          target.expanded = true;
        }
      }
      if (syncRoute && this.$route.query.pageId !== pageId) {
        this.$router.replace({
          name: 'document',
          query: {
            ...this.$route.query,
            pageId,
          },
        });
      }
    },
    toggleSection(sectionId) {
      const section = this.sections.find((item) => item.id === sectionId);
      if (section) {
        section.expanded = !section.expanded;
      }
    },
    onSearch(value) {
      this.searchQuery = value;
    },
    onSelectAnchor(anchorId) {
      this.activeAnchorId = anchorId;
      this.$refs.docContent?.scrollToAnchor(anchorId);
    },
  },
};
</script>
