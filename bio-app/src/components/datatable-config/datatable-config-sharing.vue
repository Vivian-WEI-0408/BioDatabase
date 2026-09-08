<template>
  <div class="datatable-config-card datatable-config-card--sharing">
    <div class="datatable-config-card__title">Sharing Config</div>

    <div class="datatable-config-field">
      <label class="datatable-config-field__label">Who can access my data</label>
      <div class="datatable-config-sharing-search">
        <input
          v-model.trim="peopleSearch"
          type="search"
          class="datatable-config-sharing-search__input"
          placeholder="Search for People"
          aria-label="Search for people"
        >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="datatable-config-sharing-search__icon">
          <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
          <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
    </div>

    <div class="datatable-config-sharing-list list-panel">
      <div class="scroll-body">
        <div
          v-for="user in paginatedList"
          :key="user.id"
          class="datatable-config-sharing-row"
        >
          <img :src="user.avatar" alt="" class="datatable-config-sharing-row__avatar" loading="lazy">
          <div class="datatable-config-sharing-row__info">
            <div class="datatable-config-sharing-row__name">{{ user.name }}</div>
            <div class="datatable-config-sharing-row__email">{{ user.email }}</div>
          </div>
          <button
            type="button"
            class="datatable-config-sharing-row__delete"
            aria-label="Remove user"
            @click="onRemove(user)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4H14M5.5 4V2.5H10.5V4M4 4V12.5C4 13.0523 4.44772 13.5 5 13.5H11C11.5523 13.5 12 13.0523 12 12.5V4"
                stroke="#030229"
                stroke-opacity="0.4"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path d="M6.5 7V11M9.5 7V11" stroke="#030229" stroke-opacity="0.4" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <div v-if="paginationTotal === 0" class="datatable-config-sharing-list__empty">
          No people found.
        </div>
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
    </div>

    <button
      type="button"
      class="datatable-config-card__submit btn btn-primary"
      @click="onUpdate"
    >
      Update
    </button>
  </div>
</template>

<script>
import ListPagination from '../parts/list-pagination.vue';
import paginationMixin from '../../assets/js/pagination.js';

export default {
  name: 'datatable-config-sharing',
  components: {
    ListPagination,
  },
  mixins: [paginationMixin],
  props: {
    users: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update', 'remove-user'],
  data() {
    return {
      peopleSearch: '',
      localUsers: this.users.map((user) => ({ ...user })),
      pageSize: 8,
    };
  },
  computed: {
    filteredUsers() {
      const query = this.peopleSearch.toLowerCase();
      if (!query) {
        return this.localUsers;
      }
      return this.localUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query)
          || user.email.toLowerCase().includes(query)
      );
    },
    paginationList() {
      return this.filteredUsers;
    },
  },
  watch: {
    users: {
      deep: true,
      handler(list) {
        this.localUsers = list.map((user) => ({ ...user }));
      },
    },
  },
  methods: {
    onRemove(user) {
      Swal.fire({
        title: 'Remove access?',
        text: `Stop sharing with ${user.name}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then((result) => {
        if (!result.isConfirmed) {
          return;
        }
        this.localUsers = this.localUsers.filter((item) => item.id !== user.id);
        this.$emit('remove-user', user.id);
      });
    },
    onUpdate() {
      this.$emit('update', this.localUsers.map((user) => ({ ...user })));
      A.toast('Sharing settings updated!');
    },
  },
};
</script>
