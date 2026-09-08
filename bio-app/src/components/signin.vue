<template>
  <div class="signin-page">
    <div class="signin-form-panel">
      <div class="signin-form">
        <div class="signin-logo">
          <img src="/images/logo-dna.png" alt="logo" />
        </div>
        <h1 class="signin-title">Log in</h1>

        <div class="signin-field">
          <label class="signin-label">Email Address</label>
          <div class="signin-input-box">
            <input
              v-model="form.email"
              type="text"
              class="signin-input"
              placeholder="example@gmail.com"
              @keyup.enter="submit"
            />
          </div>
        </div>

        <div class="signin-field">
          <label class="signin-label">Password</label>
          <div class="signin-input-box">
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              class="signin-input"
              placeholder="••••••••"
              @keyup.enter="submit"
            />
            <span class="signin-pwd-toggle" @click="showPwd = !showPwd">
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

        <div class="signin-options">
          <label class="signin-checkbox">
            <input v-model="form.remember" type="checkbox" />
            <span class="signin-check-mark"></span>
            <span class="signin-remember-text">Remember me</span>
          </label>
          <a class="signin-link" @click="showResetNotice">Reset Password?</a>
        </div>

        <button
          class="signin-submit-btn"
          :class="{ disabled: submitting }"
          :disabled="submitting"
          @click="submit"
        >
          <span v-if="submitting" class="signin-spinner"></span>
          <span v-else>Log in</span>
        </button>

        <p class="signin-signup-link">
          Don't have an account?
          <a class="signin-link" @click="$router.push('/signup')">Sign up</a>
        </p>
      </div>
    </div>
    <div class="signin-illustration">
      <img src="/images/signup-illustration.png" alt="illustration" />
    </div>

    <RecoverPasswordModal
      :visible="showRecover"
      @close="showRecover = false"
    />
  </div>
</template>

<script>
import RecoverPasswordModal from './recover-password-modal.vue';

const REMEMBER_KEY = '_remember_email';

export default {
  components: {
    RecoverPasswordModal,
  },
  created() {
    let saved = localStorage[REMEMBER_KEY];
    if (saved) {
      this.form.email = saved;
      this.form.remember = true;
    }
  },
  data() {
    return {
      form: {
        email: '',
        password: '',
        remember: false,
      },
      showPwd: false,
      submitting: false,
      showRecover: false,
    };
  },
  methods: {
    validate() {
      let t = this;
      if (!t.form.email.trim()) {
        Swal.fire({ icon: 'warning', text: 'Please enter your email address.' });
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.form.email.trim())) {
        Swal.fire({ icon: 'warning', text: 'Please enter a valid email address.' });
        return false;
      }
      if (!t.form.password) {
        Swal.fire({ icon: 'warning', text: 'Please enter your password.' });
        return false;
      }
      return true;
    },
    async submit() {
      let t = this;
      if (t.submitting) return;
      if (!t.validate()) return;

      t.submitting = true;
      try {
        let res = await axios.post('account/login', {
          username: t.form.email.trim(),
          password: t.form.password,
        });

        let data = res.data || {};
        if (data.status == 1 && data.options && data.options.user) {
          let user = data.options.user;
          if (t.form.remember) {
            localStorage[REMEMBER_KEY] = t.form.email.trim();
          } else {
            delete localStorage[REMEMBER_KEY];
          }
          S.set('_u', user);
          mirror(user, G.U);
          axios.defaults.headers.common['Token'] = user.token;
          if (typeof G.afterLogin === 'function') G.afterLogin();
          t.$router.replace('/dashboard');
        } else {
          let msg = t.mapErrorMessage(data.status);
          Swal.fire({ icon: 'error', text: msg });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        t.submitting = false;
      }
    },
    mapErrorMessage(status) {
      switch (status) {
        case 2:
          return 'Account not found.';
        case 3:
          return 'Incorrect password.';
        case 4:
          return 'This client has been disabled. Please contact support.';
        default:
          return 'Login failed, please try again.';
      }
    },
    showResetNotice() {
      this.showRecover = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.signin-page {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: #fafafa;
  overflow: hidden;
}

.signin-form-panel {
  flex: 0 0 448px;
  width: 448px;
  height: 100%;
  background-color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
}

.signin-form {
  width: 348px;
  padding: 90px 0 60px;
  display: flex;
  flex-direction: column;
}

.signin-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;

  img {
    width: 92px;
    height: 92px;
    object-fit: contain;
  }
}

.signin-title {
  text-align: center;
  color: var(--text);
  font-size: 25px;
  font-weight: 600;
  line-height: 28px;
  margin-bottom: 70px;
}

.signin-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
}

.signin-label {
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
  margin-bottom: 10px;
}

.signin-input-box {
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

.signin-input {
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

.signin-pwd-toggle {
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

.signin-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.signin-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 15px;
    height: 15px;
    cursor: pointer;
    margin: 0;
  }

  .signin-check-mark {
    flex: 0 0 15px;
    width: 15px;
    height: 15px;
    border: 1px solid rgba(3, 2, 41, 0.5);
    border-radius: 2px;
    background-color: #fff;
    transition: background-color 0.15s, border-color 0.15s;
  }

  input:checked + .signin-check-mark {
    background-color: var(--primary);
    border-color: var(--primary);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
  }
}

.signin-remember-text {
  font-size: 14px;
  color: var(--text);
  line-height: 22px;
}

.signin-link {
  color: var(--primary);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.signin-submit-btn {
  width: 100%;
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
  margin-bottom: 24px;

  &:hover:not(.disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(96, 91, 255, 0.25);
  }

  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.signin-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: signin-spin 0.8s linear infinite;
}

@keyframes signin-spin {
  to { transform: rotate(360deg); }
}

.signin-signup-link {
  text-align: center;
  font-size: 16px;
  color: var(--text);
  margin: 0;
}

.signin-illustration {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #fafafa;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
}

@media (max-width: 900px) {
  .signin-illustration {
    display: none;
  }
  .signin-form-panel {
    flex: 1;
    width: 100%;
  }
}
</style>
