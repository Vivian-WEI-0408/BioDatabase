<template>
  <main ref="mainEl" class="item-detail-main" @scroll="onScroll">
    <div class="item-detail-article">
      <section
        id="item-section-overview"
        class="item-detail-section"
      >
        <item-detail-overview
          :title="item.title"
          :description="item.description"
          :fields="item.overview.fields"
        />
      </section>

      <section
        id="item-section-test-data"
        class="item-detail-section"
      >
        <item-detail-test-data :test-data="item.testData" />
      </section>

      <section
        id="item-section-sequence"
        class="item-detail-section"
      >
        <item-detail-sequence :sequence="item.sequence" />
      </section>

      <section
        id="item-section-reference"
        class="item-detail-section"
      >
        <item-detail-reference :reference="item.reference" />
      </section>
    </div>
  </main>
</template>

<script>
import ItemDetailOverview from './item-detail-overview.vue';
import ItemDetailTestData from './item-detail-test-data.vue';
import ItemDetailSequence from './item-detail-sequence.vue';
import ItemDetailReference from './item-detail-reference.vue';

export default {
  name: 'item-detail-content',
  components: {
    ItemDetailOverview,
    ItemDetailTestData,
    ItemDetailSequence,
    ItemDetailReference,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
    activeSectionId: {
      type: String,
      default: '',
    },
  },
  emits: ['update:activeSectionId'],
  data() {
    return {
      observer: null,
      scrollingToAnchor: false,
    };
  },
  watch: {
    item() {
      this.$nextTick(() => {
        this.setupObserver();
      });
    },
    activeSectionId(sectionId) {
      if (!sectionId || this.scrollingToAnchor) {
        return;
      }
      const root = this.$refs.mainEl;
      const el = root?.querySelector('#item-section-' + sectionId);
      if (el) {
        this.scrollingToAnchor = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
          this.scrollingToAnchor = false;
        }, 400);
      }
    },
  },
  mounted() {
    this.setupObserver();
  },
  beforeUnmount() {
    this.teardownObserver();
  },
  methods: {
    setupObserver() {
      this.teardownObserver();
      const root = this.$refs.mainEl;
      if (!root) {
        return;
      }
      const sectionEls = root.querySelectorAll('.item-detail-section');
      if (!sectionEls.length) {
        return;
      }
      this.observer = new IntersectionObserver(
        (entries) => {
          if (this.scrollingToAnchor) {
            return;
          }
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible.length) {
            const id = visible[0].target.id.replace('item-section-', '');
            if (id !== this.activeSectionId) {
              this.$emit('update:activeSectionId', id);
            }
          }
        },
        { root, rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] }
      );
      sectionEls.forEach((el) => {
        this.observer.observe(el);
      });
    },
    teardownObserver() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    },
    onScroll() {
      // IntersectionObserver handles anchor sync.
    },
  },
};
</script>
