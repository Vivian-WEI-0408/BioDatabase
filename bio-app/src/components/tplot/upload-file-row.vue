<template>
  <div class="tplot-upload-row">
    <div class="tplot-upload-row__details">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="tplot-upload-row__icon">
        <path d="M4 1h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" stroke="#242634" stroke-width="1.2" fill="none"/>
        <path d="M9 1v3h3" stroke="#242634" stroke-width="1.2"/>
        <path d="M5 8h4M5 10h3" stroke="#242634" stroke-width="1"/>
      </svg>
      <div class="tplot-upload-row__text">
        <div class="tplot-upload-row__name">{{ file.name }}</div>
        <div class="tplot-upload-row__time">{{ file.time || 'Selected' }}</div>
      </div>
    </div>
    <div class="tplot-upload-row__tag">{{ file.size }}</div>
    <button type="button" class="tplot-upload-row__menu" aria-label="File options" @click="onMenu">
      <svg width="3" height="13" viewBox="0 0 3 13" fill="none">
        <circle cx="1.5" cy="1.5" r="1.5" fill="#242634"/>
        <circle cx="1.5" cy="6.5" r="1.5" fill="#242634"/>
        <circle cx="1.5" cy="11.5" r="1.5" fill="#242634"/>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'upload-file-row',
  props: {
    file: {
      type: Object,
      required: true,
    },
  },
  emits: ['clear'],
  methods: {
    onMenu() {
      Swal.fire({
        title: this.file.name || 'File',
        text: 'Clear the selected file?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Clear',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#605bff',
      }).then((result) => {
        if (result.isConfirmed) {
          this.$emit('clear');
        }
      });
    },
  },
};
</script>
