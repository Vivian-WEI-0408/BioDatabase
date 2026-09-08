<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="recover-overlay"
      @click.self="close"
      @keydown.esc="close"
    >
      <div class="recover-card">
        <div class="recover-logo">
          <img src="/images/logo-dna.png" alt="logo" />
        </div>
        <h2 class="recover-title">Recover</h2>

        <template v-if="step === 1">
          <div class="recover-field">
            <label class="recover-label">Email Address</label>
            <div class="recover-input-box">
              <input
                v-model="form.email"
                type="text"
                class="recover-input"
                placeholder="example@gmail.com"
                @keyup.enter="sendCode"
              />
            </div>
          </div>

          <button
            class="recover-submit-btn"
            :class="{ disabled: submitting }"
            :disabled="submitting"
            @click="sendCode"
          >
            <span v-if="submitting" class="recover-spinner"></span>
            <span v-else>Reset Your Password</span>
          </button>
        </template>

        <template v-else>
          <div class="recover-field">
            <label class="recover-label">Verification Code</label>
            <div class="recover-input-box">
              <input
                v-model="form.vcode"
                type="text"
                class="recover-input"
                placeholder="Enter verification code"
                @keyup.enter="resetPassword"
              />
            </div>
          </div>

          <div class="recover-field">
            <label class="recover-label">New Password</label>
            <div class="recover-input-box">
              <input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                class="recover-input"
                placeholder="••••••••"
                @keyup.enter="resetPassword"
              />
              <span class="recover-pwd-toggle" @click="showPwd = !showPwd">
                <svg v-if="showPwd" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="#9a9aa9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="#9a9aa9" stroke-width="1.6"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.06 6.06A13.16 13.16 0 0 0 2 11s3.5 7 10 7a9.12 9.12 0 0 0 4.06-.94M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="#9a9aa9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>
          </div>

          <div class="recover-field">
            <label class="recover-label">Confirm Password</label>
            <div class="recover-input-box">
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPwd ? 'text' : 'password'"
                class="recover-input"
                placeholder="••••••••"
                @keyup.enter="resetPassword"
              />
              <span class="recover-pwd-toggle" @click="showConfirmPwd = !showConfirmPwd">
                <svg v-if="showConfirmPwd" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="#9a9aa9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="#9a9aa9" stroke-width="1.6"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.06 6.06A13.16 13.16 0 0 0 2 11s3.5 7 10 7a9.12 9.12 0 0 0 4.06-.94M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="#9a9aa9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>
          </div>

          <button
            class="recover-submit-btn"
            :class="{ disabled: submitting }"
            :disabled="submitting"
            @click="resetPassword"
          >
            <span v-if="submitting" class="recover-spinner"></span>
            <span v-else>Reset Your Password</span>
          </button>

          <p class="recover-back-link">
            <a @click="step = 1">Back to email</a>
          </p>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      step: 1,
      form: {
        email: '',
        vcode: '',
        password: '',
        confirmPassword: '',
      },
      showPwd: false,
      showConfirmPwd: false,
      submitting: false,
    };
  },
  watch: {
    visible(val) {
      if (val) {
        this.resetForm();
      }
    },
  },
  methods: {
    resetForm() {
      this.step = 1;
      this.form = {
        email: '',
        vcode: '',
        password: '',
        confirmPassword: '',
      };
      this.showPwd = false;
      this.showConfirmPwd = false;
      this.submitting = false;
    },
    close() {
      if (this.submitting) return;
      this.$emit('close');
    },
    validateEmail() {
      let email = this.form.email.trim();
      if (!email) {
        Swal.fire({ icon: 'warning', text: 'Please enter your email address.' });
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Swal.fire({ icon: 'warning', text: 'Please enter a valid email address.' });
        return false;
      }
      return true;
    },
    validateReset() {
      if (!this.form.vcode.trim()) {
        Swal.fire({ icon: 'warning', text: 'Please enter the verification code.' });
        return false;
      }
      if (!this.form.password) {
        Swal.fire({ icon: 'warning', text: 'Please enter a new password.' });
        return false;
      }
      if (this.form.password.length < 6) {
        Swal.fire({ icon: 'warning', text: 'Password must be at least 6 characters.' });
        return false;
      }
      if (this.form.password !== this.form.confirmPassword) {
        Swal.fire({ icon: 'warning', text: 'Passwords do not match.' });
        return false;
      }
      return true;
    },
    mapSendCodeError(status) {
      switch (status) {
        case 2:
          return 'Account not found.';
        case 3:
          return 'Failed to send verification code. Please try again.';
        default:
          return 'Failed to send verification code.';
      }
    },
    mapResetError(status) {
      switch (status) {
        case 2:
          return 'Account not found.';
        case 3:
          return 'Invalid verification code.';
        default:
          return 'Password reset failed, please try again.';
      }
    },
    async sendCode() {
      let t = this;
      if (t.submitting) return;
      if (!t.validateEmail()) return;

      t.submitting = true;
      try {
        let res = await axios.post('account/sendVCode', {
          tel: t.form.email.trim(),
        });

        let data = res.data || {};
        if (data.status == 1) {
          t.step = 2;
        } else {
          Swal.fire({ icon: 'error', text: t.mapSendCodeError(data.status) });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        t.submitting = false;
      }
    },
    async resetPassword() {
      let t = this;
      if (t.submitting) return;
      if (!t.validateReset()) return;

      t.submitting = true;
      try {
        let res = await axios.post('account/resetPassword', {
          tel: t.form.email.trim(),
          vcode: t.form.vcode.trim(),
          password: t.form.password,
        });

        let data = res.data || {};
        if (data.status == 1) {
          Swal.fire({ icon: 'success', text: 'Password reset successfully.' });
          t.$emit('close');
        } else {
          Swal.fire({ icon: 'error', text: t.mapResetError(data.status) });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        t.submitting = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.recover-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(247, 247, 248, 0.92);
}

.recover-card {
  width: 658px;
  max-width: calc(100vw - 32px);
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(3, 2, 41, 0.08);
  padding: 78px 78px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.recover-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 58px;

  img {
    width: 92px;
    height: 92px;
    object-fit: contain;
  }
}

.recover-title {
  text-align: center;
  color: var(--text);
  font-size: 25px;
  font-weight: 600;
  line-height: 34px;
  margin: 0 0 58px;
}

.recover-field {
  width: 502px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 45px;
}

.recover-label {
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
  margin-bottom: 10px;
}

.recover-input-box {
  position: relative;
  width: 100%;
  height: 50px;
  background-color: #f7f7f8;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus-within {
    border-color: rgba(96, 91, 255, 0.4);
    box-shadow: 2px 2px 10px rgba(96, 91, 255, 0.08);
  }
}

.recover-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  padding: 0 16px;
  font-size: 14px;
  color: var(--text);
  border-radius: 10px;

  &::placeholder {
    color: rgba(3, 2, 41, 0.5);
  }
}

.recover-pwd-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 24px;
  height: 24px;
}

.recover-submit-btn {
  width: 502px;
  max-width: 100%;
  height: 50px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  transition: transform 0.1s, box-shadow 0.15s, opacity 0.15s;

  &:hover:not(.disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(96, 91, 255, 0.25);
  }

  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.recover-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: recover-spin 0.8s linear infinite;
}

@keyframes recover-spin {
  to { transform: rotate(360deg); }
}

.recover-back-link {
  margin: 20px 0 0;
  text-align: center;
  font-size: 14px;

  a {
    color: var(--primary);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 700px) {
  .recover-card {
    padding: 48px 24px 40px;
  }

  .recover-logo {
    margin-bottom: 40px;
  }

  .recover-title {
    margin-bottom: 40px;
  }

  .recover-field {
    margin-bottom: 30px;
  }
}
</style>
