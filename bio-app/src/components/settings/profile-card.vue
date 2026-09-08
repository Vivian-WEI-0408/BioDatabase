<template>
  <div class="settings-card settings-card--profile">
    <div class="settings-card__title">Profile</div>

    <div class="settings-avatar-wrap">
      <div class="settings-avatar" @click="triggerAvatarPick">
        <img
          v-if="avatarPreview"
          :src="avatarPreview"
          alt=""
          class="settings-avatar__img"
        >
        <div v-else class="settings-avatar__placeholder">
          <svg width="40" height="36" viewBox="0 0 27 24" fill="none">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M20.844 4.20732C20.898 4.29822 20.9925 4.36315 21.114 4.36315C24.354 4.36315 27 6.90832 27 10.0249V17.7383C27 20.8548 24.354 23.4 21.114 23.4H5.886C2.6325 23.4 0 20.8548 0 17.7383V10.0249C0 6.90832 2.6325 4.36315 5.886 4.36315C5.994 4.36315 6.102 4.31121 6.1425 4.20732L6.2235 4.0515C6.27005 3.95714 6.31783 3.86023 6.36634 3.76185C6.71169 3.06137 7.09375 2.28642 7.3305 1.83097C7.9515 0.662264 9.0045 0.0129856 10.314 0H16.6725C17.982 0.0129856 19.0485 0.662264 19.6695 1.83097C19.8821 2.24006 20.2061 2.89905 20.5184 3.53417C20.5828 3.66514 20.6467 3.7951 20.709 3.92164L20.844 4.20732ZM11.164 11.2065C11.7985 10.5961 12.622 10.2715 13.4995 10.2715C14.377 10.2715 15.2005 10.5961 15.8215 11.1935C16.4425 11.7908 16.78 12.5829 16.78 13.427C16.7665 15.1671 15.3085 16.5825 13.4995 16.5825C12.622 16.5825 11.7985 16.2579 11.1775 15.6605C10.5565 15.0632 10.219 14.2711 10.219 13.427V13.414C10.2055 12.5959 10.543 11.8038 11.164 11.2065Z"
              fill="#030229"
              fill-opacity="0.35"
            />
          </svg>
        </div>
      </div>
      <input
        ref="avatarInput"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        class="settings-avatar__input"
        @change="onAvatarChange"
      >
    </div>

    <div class="settings-fields">
      <div class="settings-field">
        <label class="settings-field__label">First Name</label>
        <input v-model="form.name" type="text" class="settings-field__input" placeholder="John">
      </div>
      <div class="settings-field">
        <label class="settings-field__label">Title</label>
        <input v-model="form.title" type="text" class="settings-field__input" placeholder="Developer">
      </div>
      <div class="settings-field">
        <label class="settings-field__label">Organization</label>
        <input v-model="form.organization" type="text" class="settings-field__input" placeholder="Your lab or institution">
      </div>
      <div class="settings-field">
        <label class="settings-field__label">Email</label>
        <input :value="form.email" type="text" class="settings-field__input" readonly>
      </div>
      <div class="settings-field">
        <label class="settings-field__label">Phone Number</label>
        <input v-model="form.phone" type="text" class="settings-field__input" placeholder="13300000000">
      </div>
      <div class="settings-field">
        <label class="settings-field__label">Gender</label>
        <div class="settings-select-wrap">
          <select v-model="form.gender" class="settings-field__input settings-field__select">
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <svg class="settings-select-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="#030229" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    <button
      class="settings-submit btn btn-primary"
      :class="{ disabled: submitting }"
      :disabled="submitting"
      @click="saveProfile"
    >
      <span v-if="submitting" class="settings-spinner"></span>
      <span v-else>Save Profile</span>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    user: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['updated'],
  data() {
    return {
      form: {
        name: '',
        title: '',
        organization: '',
        email: '',
        phone: '',
        gender: '',
        avatar: '',
      },
      pendingAvatarData: '',
      submitting: false,
    };
  },
  computed: {
    avatarPreview() {
      if (this.pendingAvatarData) {
        return this.pendingAvatarData;
      }
      if (this.form.avatar) {
        return this.form.avatar;
      }
      return '';
    },
  },
  watch: {
    user: {
      immediate: true,
      handler(val) {
        if (!val) return;
        this.form = {
          name: val.name || '',
          title: val.title || '',
          organization: val.organization || '',
          email: val.email || '',
          phone: val.phone || '',
          gender: val.gender || '',
          avatar: val.avatar || '',
        };
      },
    },
  },
  methods: {
    triggerAvatarPick() {
      this.$refs.avatarInput.click();
    },
    onAvatarChange(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', text: 'Image must be smaller than 5 MB.' });
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.pendingAvatarData = reader.result;
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    },
    validate() {
      if (!this.form.name.trim()) {
        Swal.fire({ icon: 'warning', text: 'Please enter your first name.' });
        return false;
      }
      return true;
    },
    async saveProfile() {
      if (this.submitting || !this.validate()) return;

      this.submitting = true;
      try {
        if (this.pendingAvatarData) {
          const uploadRes = await axios.post('user/uploadAvatar', {
            data: this.pendingAvatarData,
          });
          const uploadData = uploadRes.data || {};
          if (uploadData.status !== 1 || !uploadData.options || !uploadData.options.user) {
            Swal.fire({ icon: 'error', text: 'Failed to upload avatar.' });
            return;
          }
          this.pendingAvatarData = '';
          this.$emit('updated', uploadData.options.user);
          this.form.avatar = uploadData.options.user.avatar || '';
        }

        const res = await axios.post('user/updateProfile', {
          name: this.form.name.trim(),
          title: this.form.title.trim(),
          organization: this.form.organization.trim(),
          phone: this.form.phone.trim(),
          gender: this.form.gender,
        });
        const data = res.data || {};
        if (data.status === 1 && data.options && data.options.user) {
          this.$emit('updated', data.options.user);
          Swal.fire({ icon: 'success', text: 'Profile saved successfully.', timer: 2000, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'error', text: 'Failed to save profile.' });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
