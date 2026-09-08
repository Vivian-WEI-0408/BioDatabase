<template>
  <div class="share-card" role="button" tabindex="0" @click="$emit('view', shareId)" @keyup.enter="$emit('view', shareId)">
    <button
      v-if="showDelete"
      type="button"
      class="share-card__delete"
      aria-label="Remove sharing"
      @click.stop="onDelete"
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

    <div class="share-card__profile">
      <img :src="avatar" alt="" class="share-card__avatar" loading="lazy">
      <div class="share-card__name">{{ name }}</div>
      <div class="share-card__role">{{ role }}</div>
    </div>

    <div class="share-card__stats">
      <div class="share-card__stat" :class="statClass">
        <span class="share-card__stat-label">Task</span>
        <span class="share-card__stat-value">{{ taskCount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'share-card',
  props: {
    shareId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: '' },
    avatar: { type: String, default: '/images/avatar.png' },
    status: { type: String, default: 'ALL' },
    taskCount: { type: Number, default: 0 },
    datasetCount: { type: Number, default: 0 },
    showDelete: { type: Boolean, default: false },
  },
  emits: ['delete', 'view'],
  computed: {
    statClass() {
      return this.status === 'Parts' ? 'share-card__stat--beige' : 'share-card__stat--blue';
    },
  },
  methods: {
    onDelete() {
      Swal.fire({
        title: 'Remove sharing?',
        text: `Stop sharing with ${this.name}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then((result) => {
        if (!result.isConfirmed) return;
        this.$emit('delete', this.shareId);
      });
    },
  },
};
</script>
