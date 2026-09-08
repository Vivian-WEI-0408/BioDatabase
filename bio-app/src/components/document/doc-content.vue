<template>
  <main ref="mainEl" class="document-main">
    <div v-if="page" class="document-article">
      <nav class="document-breadcrumb" aria-label="Breadcrumb">
        <template v-for="(crumb, index) in page.breadcrumb" :key="index">
          <span
            class="document-breadcrumb__item"
            :class="{ 'document-breadcrumb__item--active': index === page.breadcrumb.length - 1 }"
          >
            {{ crumb.label }}
          </span>
          <svg
            v-if="index < page.breadcrumb.length - 1"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            class="document-breadcrumb__sep"
          >
            <path d="M7 5L13 10L7 15" stroke="#475569" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </template>
      </nav>

      <div class="document-article__intro">
        <h1 class="document-article__title">{{ page.title }}</h1>
        <p class="document-article__desc">{{ page.intro }}</p>
      </div>

      <div v-if="page.heroImage" class="document-hero">
        <img :src="page.heroImage" alt="" class="document-hero__image" loading="lazy">
        <button
          type="button"
          class="document-hero__favorite"
          :class="{ 'document-hero__favorite--active': favorited }"
          aria-label="Favorite"
          @click="favorited = !favorited"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              :fill="favorited ? '#fff' : 'none'"
              :stroke="favorited ? 'none' : '#fff'"
              stroke-width="1.5"
            />
          </svg>
        </button>
      </div>

      <div
        v-if="preparedContentHtml"
        ref="contentEl"
        class="document-content document-section__body"
        v-html="preparedContentHtml"
      />
    </div>
  </main>
</template>

<script>
function slugifyHeading(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHtmlTags(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function injectHeadingIds(html) {
  let index = 0;

  return String(html || '').replace(
    /<h([2-3])(?![^>]*\sid=)([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (full, level, attrs, text) => {
      const label = stripHtmlTags(text);
      const id = slugifyHeading(label) || `heading-${index + 1}`;
      index += 1;
      return `<h${level}${attrs} id="doc-section-${id}">${text}</h${level}>`;
    }
  );
}

export default {
  name: 'doc-content',
  props: {
    page: {
      type: Object,
      default: null,
    },
    activeAnchorId: {
      type: String,
      default: '',
    },
  },
  emits: ['update:activeAnchorId'],
  data() {
    return {
      favorited: false,
      observer: null,
      scrollingToAnchor: false,
      scrollEndTimer: null,
    };
  },
  computed: {
    preparedContentHtml() {
      return injectHeadingIds(this.page?.contentHtml || '');
    },
  },
  watch: {
    page() {
      this.favorited = false;
      this.$nextTick(() => {
        this.setupObserver();
      });
    },
    preparedContentHtml() {
      this.$nextTick(() => {
        this.setupObserver();
      });
    },
  },
  mounted() {
    this.setupObserver();
  },
  beforeUnmount() {
    this.teardownObserver();
    window.clearTimeout(this.scrollEndTimer);
  },
  methods: {
    scrollToAnchor(anchorId) {
      if (!anchorId) {
        return;
      }
      const root = this.$refs.mainEl;
      const el = root?.querySelector(`#doc-section-${anchorId}`);
      if (!el) {
        return;
      }

      this.scrollingToAnchor = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });

      window.clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = window.setTimeout(() => {
        this.scrollingToAnchor = false;
      }, 800);
    },
    setupObserver() {
      this.teardownObserver();
      if (!this.preparedContentHtml) {
        return;
      }
      const root = this.$refs.mainEl;
      if (!root) {
        return;
      }
      const headingEls = root.querySelectorAll('[id^="doc-section-"]');
      if (!headingEls.length) {
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
            const id = visible[0].target.id.replace('doc-section-', '');
            if (id !== this.activeAnchorId) {
              this.$emit('update:activeAnchorId', id);
            }
          }
        },
        { root, rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] }
      );
      headingEls.forEach((el) => {
        this.observer.observe(el);
      });
    },
    teardownObserver() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    },
  },
};
</script>
