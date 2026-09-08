<template>
  <div class="settings-card">
    <div class="settings-card__title">Modify Password</div>

    <div class="settings-fields">
      <div class="settings-field">
        <label class="settings-field__label">Current Password</label>
        <input
          v-model="form.currentPassword"
          type="password"
          class="settings-field__input"
          placeholder="••••••"
          autocomplete="current-password"
        >
      </div>
      <div class="settings-field">
        <label class="settings-field__label">New Password</label>
        <input
          v-model="form.newPassword"
          type="password"
          class="settings-field__input"
          placeholder="••••••"
          autocomplete="new-password"
        >
      </div>
      <div class="settings-field">
        <label class="settings-field__label">Confirm New Password</label>
        <input
          v-model="form.confirmPassword"
          type="password"
          class="settings-field__input"
          placeholder="••••••"
          autocomplete="new-password"
          @keyup.enter="updatePassword"
        >
      </div>
    </div>

    <button
      class="settings-submit btn btn-primary"
      :class="{ disabled: submitting }"
      :disabled="submitting"
      @click="updatePassword"
    >
      <span v-if="submitting" class="settings-spinner"></span>
      <span v-else>Update Password</span>
    </button>
  </div>
</template>

<script>
export default {
  emits: ['updated'],
  data() {
    return {
      form: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
      submitting: false,
    };
  },
  methods: {
    validate() {
      if (!this.form.currentPassword) {
        Swal.fire({ icon: 'warning', text: 'Please enter your current password.' });
        return false;
      }
      if (!this.form.newPassword) {
        Swal.fire({ icon: 'warning', text: 'Please enter a new password.' });
        return false;
      }
      if (this.form.newPassword.length < 6) {
        Swal.fire({ icon: 'warning', text: 'Password must be at least 6 characters.' });
        return false;
      }
      if (this.form.newPassword !== this.form.confirmPassword) {
        Swal.fire({ icon: 'warning', text: 'Passwords do not match.' });
        return false;
      }
      return true;
    },
    async updatePassword() {
      if (this.submitting || !this.validate()) return;

      this.submitting = true;
      try {
        const res = await axios.post('user/changePassword', {
          currentPassword: this.form.currentPassword,
          newPassword: this.form.newPassword,
          confirmPassword: this.form.confirmPassword,
        });
        const data = res.data || {};
        if (data.status === 1 && data.options && data.options.user) {
          this.form = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          };
          this.$emit('updated', data.options.user);
          Swal.fire({ icon: 'success', text: 'Password updated successfully.', timer: 2000, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'error', text: 'Incorrect current password or invalid input.' });
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
