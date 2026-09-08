export default {
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      pageInput: '1',
    };
  },
  computed: {
    paginationMeta() {
      const source = this.paginationList || [];
      const total = source.length;
      const totalPages = Math.max(1, Math.ceil(total / this.pageSize) || 1);
      const currentPage = Math.min(this.currentPage, totalPages);
      const start = (currentPage - 1) * this.pageSize;

      return {
        total,
        totalPages,
        currentPage,
        items: source.slice(start, start + this.pageSize),
      };
    },
    paginatedList() {
      return this.paginationMeta.items;
    },
    totalPages() {
      return this.paginationMeta.totalPages;
    },
    paginationTotal() {
      return this.paginationMeta.total;
    },
  },
  watch: {
    paginationList() {
      this.resetPagination();
    },
    currentPage(page) {
      this.pageInput = String(page);
    },
  },
  methods: {
    resetPagination() {
      this.currentPage = 1;
      this.pageInput = '1';
    },
    setPage(page) {
      const p = Math.min(Math.max(1, Number(page) || 1), this.totalPages);
      this.currentPage = p;
      this.pageInput = String(p);
    },
    prevPage() {
      this.setPage(this.currentPage - 1);
    },
    nextPage() {
      this.setPage(this.currentPage + 1);
    },
    submitPageJump() {
      this.setPage(parseInt(this.pageInput, 10));
    },
  },
};
