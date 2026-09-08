<template>
  <div class="settings-card">
    <div class="settings-card__title">Change Email</div>

    <div class="settings-fields">
      <div class="settings-field">
        <label class="settings-field__label">Current Email verification code</label>
        <div class="settings-input-action-wrap">
          <input
            v-model="form.currentVcode"
            type="text"
            class="settings-field__input settings-field__input--action"
            placeholder="Enter code"
          >
          <button
            type="button"
            class="settings-input-action"
            :class="{ disabled: currentCountdown > 0 || sendingCurrent }"
            :disabled="currentCountdown > 0 || sendingCurrent"
            @click="sendCurrentCode"
          >
            {{ currentCountdown > 0 ? `${currentCountdown}s` : 'Send' }}
          </button>
        </div>
      </div>
      <div class="settings-field">
        <label class="settings-field__label">New Email Address</label>
        <input
          v-model="form.newEmail"
          type="email"
          class="settings-field__input"
          placeholder="new@example.com"
        >
      </div>
      <div class="settings-field">
        <label class="settings-field__label">New email verification code</label>
        <div class="settings-input-action-wrap">
          <input
            v-model="form.newVcode"
            type="text"
            class="settings-field__input settings-field__input--action"
            placeholder="Enter code"
          >
          <button
            type="button"
            class="settings-input-action"
            :class="{ disabled: newCountdown > 0 || sendingNew }"
            :disabled="newCountdown > 0 || sendingNew"
            @click="sendNewCode"
          >
            {{ newCountdown > 0 ? `${newCountdown}s` : 'Send' }}
          </button>
        </div>
      </div>
    </div>

    <button
      class="settings-submit btn btn-primary"
      :class="{ disabled: submitting }"
      :disabled="submitting"
      @click="updateEmail"
    >
      <span v-if="submitting" class="settings-spinner"></span>
      <span v-else>Update Email</span>
    </button>
  </div>
</template>

<script>
const COUNTDOWN_SECONDS = 60;

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
        currentVcode: '',
        newEmail: '',
        newVcode: '',
      },
      submitting: false,
      sendingCurrent: false,
      sendingNew: false,
      currentCountdown: 0,
      newCountdown: 0,
      currentTimer: null,
      newTimer: null,
    };
  },
  beforeUnmount() {
    clearInterval(this.currentTimer);
    clearInterval(this.newTimer);
  },
  methods: {
    startCountdown(type) {
      if (type === 'current') {
        clearInterval(this.currentTimer);
        this.currentCountdown = COUNTDOWN_SECONDS;
        this.currentTimer = setInterval(() => {
          this.currentCountdown -= 1;
          if (this.currentCountdown <= 0) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
          }
        }, 1000);
        return;
      }

      clearInterval(this.newTimer);
      this.newCountdown = COUNTDOWN_SECONDS;
      this.newTimer = setInterval(() => {
        this.newCountdown -= 1;
        if (this.newCountdown <= 0) {
          clearInterval(this.newTimer);
          this.newTimer = null;
        }
      }, 1000);
    },
    mapSendError(status) {
      switch (status) {
        case 2:
          return 'Session expired. Please sign in again.';
        case 5:
          return 'Please enter a valid email address.';
        case 6:
          return 'This email is already in use.';
        default:
          return 'Failed to send verification code.';
      }
    },
    async sendCurrentCode() {
      if (this.sendingCurrent || this.currentCountdown > 0) return;

      this.sendingCurrent = true;
      try {
        const res = await axios.post('user/sendCurrentEmailVCode');
        const data = res.data || {};
        if (data.status === 1) {
          this.startCountdown('current');
          Swal.fire({ icon: 'success', text: `Verification code sent to ${this.user.email || 'your email'}.`, timer: 2500, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'error', text: this.mapSendError(data.status) });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.sendingCurrent = false;
      }
    },
    async sendNewCode() {
      if (this.sendingNew || this.newCountdown > 0) return;

      const email = this.form.newEmail.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Swal.fire({ icon: 'warning', text: 'Please enter a valid new email address.' });
        return;
      }

      this.sendingNew = true;
      try {
        const res = await axios.post('user/sendNewEmailVCode', { email });
        const data = res.data || {};
        if (data.status === 1) {
          this.startCountdown('new');
          Swal.fire({ icon: 'success', text: `Verification code sent to ${email}.`, timer: 2500, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'error', text: this.mapSendError(data.status) });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.sendingNew = false;
      }
    },
    validate() {
      if (!this.form.currentVcode.trim()) {
        Swal.fire({ icon: 'warning', text: 'Please enter the current email verification code.' });
        return false;
      }
      if (!this.form.newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.newEmail.trim())) {
        Swal.fire({ icon: 'warning', text: 'Please enter a valid new email address.' });
        return false;
      }
      if (!this.form.newVcode.trim()) {
        Swal.fire({ icon: 'warning', text: 'Please enter the new email verification code.' });
        return false;
      }
      return true;
    },
    async updateEmail() {
      if (this.submitting || !this.validate()) return;

      this.submitting = true;
      try {
        const res = await axios.post('user/changeEmail', {
          email: this.form.newEmail.trim(),
          currentVcode: this.form.currentVcode.trim(),
          newVcode: this.form.newVcode.trim(),
        });
        const data = res.data || {};
        if (data.status === 1 && data.options && data.options.user) {
          this.form = {
            currentVcode: '',
            newEmail: '',
            newVcode: '',
          };
          this.$emit('updated', data.options.user);
          Swal.fire({ icon: 'success', text: 'Email updated successfully.', timer: 2000, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'error', text: this.mapSendError(data.status) || 'Invalid verification code or email.' });
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
