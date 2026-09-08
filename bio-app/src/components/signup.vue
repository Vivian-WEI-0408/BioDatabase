<template>
  <div class="signup-page">
    <div class="signup-form-panel">
      <div class="signup-form">
        <div class="signup-logo">
          <img src="/images/logo-dna.png" alt="logo" />
        </div>
        <h1 class="signup-title">Sign Up</h1>

        <div class="signup-field">
          <label class="signup-label">Full Name</label>
          <div class="signup-input-box">
            <input
              v-model="form.name"
              type="text"
              class="signup-input"
              placeholder="Jiangyu"
              @keyup.enter="submit"
            />
          </div>
        </div>

        <div class="signup-field">
          <label class="signup-label">Email Address</label>
          <div class="signup-input-box">
            <input
              v-model="form.email"
              type="text"
              class="signup-input"
              placeholder="example@gmail.com"
              @keyup.enter="submit"
            />
          </div>
        </div>

        <div class="signup-field">
          <label class="signup-label">Organization</label>
          <div class="signup-input-box">
            <input
              v-model="form.organization"
              type="text"
              class="signup-input"
              placeholder="Your lab or institution"
              @keyup.enter="submit"
            />
          </div>
        </div>

        <div class="signup-field">
          <label class="signup-label">Password</label>
          <div class="signup-input-box">
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              class="signup-input"
              placeholder="••••••••"
              @keyup.enter="submit"
            />
            <span class="signup-pwd-toggle" @click="showPwd = !showPwd">
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

        <div class="signup-terms">
          <label class="signup-checkbox">
            <input v-model="form.agreed" type="checkbox" />
            <span class="signup-check-mark"></span>
          </label>
          <p class="signup-terms-text">
            By creating an account you agree to the
            <a class="signup-link" @click="showTermsNotice('terms of use')">terms of use</a>
            and our
            <a class="signup-link" @click="showTermsNotice('privacy policy')">privacy policy.</a>
          </p>
        </div>

        <button
          class="signup-submit-btn"
          :class="{ disabled: submitting }"
          :disabled="submitting"
          @click="submit"
        >
          <span v-if="submitting" class="signup-spinner"></span>
          <span v-else>Create account</span>
        </button>

        <p class="signup-login-link">
          Already have an account?
          <a class="signup-link" @click="showLoginNotice">Log in</a>
        </p>
      </div>
    </div>
    <div class="signup-illustration">
      <img src="/images/signup-illustration.png" alt="illustration" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: '',
        email: '',
        organization: '',
        password: '',
        agreed: false,
      },
      showPwd: false,
      submitting: false,
    };
  },
  methods: {
    validate() {
      let t = this;
      if (!t.form.name.trim()) {
        Swal.fire({ icon: 'warning', text: 'Please enter your full name.' });
        return false;
      }
      if (!t.form.email.trim()) {
        Swal.fire({ icon: 'warning', text: 'Please enter your email address.' });
        return false;
      }
      if (!t.form.organization.trim()) {
        Swal.fire({ icon: 'warning', text: 'Please enter your organization.' });
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.form.email.trim())) {
        Swal.fire({ icon: 'warning', text: 'Please enter a valid email address.' });
        return false;
      }
      if (!t.form.password) {
        Swal.fire({ icon: 'warning', text: 'Please enter a password.' });
        return false;
      }
      if (t.form.password.length < 6) {
        Swal.fire({ icon: 'warning', text: 'Password must be at least 6 characters.' });
        return false;
      }
      if (!t.form.agreed) {
        Swal.fire({ icon: 'warning', text: 'Please agree to the terms of use and privacy policy.' });
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
        let res = await axios.post('account/register', {
          name: t.form.name.trim(),
          email: t.form.email.trim(),
          organization: t.form.organization.trim(),
          password: t.form.password,
        });

        let data = res.data || {};
        if (data.status == 1 && data.options && data.options.user) {
          let user = data.options.user;
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
        case 5:
          return 'Invalid email address.';
        case 6:
          return 'This email is already registered.';
        case 4:
          return 'Please fill in all required fields.';
        default:
          return 'Sign up failed, please try again.';
      }
    },
    showTermsNotice(name) {
      Swal.fire({ icon: 'info', text: 'The ' + name + ' page is not available yet.' });
    },
    showLoginNotice() {
      this.$router.push('/signin');
    },
  },
};
</script>

<style lang="scss" scoped>
.signup-page {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: #fafafa;
  overflow: hidden;
}

.signup-form-panel {
  flex: 0 0 448px;
  width: 448px;
  height: 100%;
  background-color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
}

.signup-form {
  width: 348px;
  padding: 90px 0 60px;
  display: flex;
  flex-direction: column;
}

.signup-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;

  img {
    width: 92px;
    height: 92px;
    object-fit: contain;
  }
}

.signup-title {
  text-align: center;
  color: var(--text);
  font-size: 25px;
  font-weight: 600;
  line-height: 28px;
  margin-bottom: 70px;
}

.signup-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
}

.signup-label {
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
  margin-bottom: 10px;
}

.signup-input-box {
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

.signup-input {
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

.signup-pwd-toggle {
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

.signup-terms {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 28px;
}

.signup-checkbox {
  position: relative;
  flex: 0 0 15px;
  width: 15px;
  height: 15px;
  margin-top: 3px;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
    margin: 0;
  }

  .signup-check-mark {
    display: block;
    width: 15px;
    height: 15px;
    border: 1px solid rgba(3, 2, 41, 0.5);
    border-radius: 2px;
    background-color: #fff;
    transition: background-color 0.15s, border-color 0.15s;
  }

  input:checked + .signup-check-mark {
    background-color: var(--primary);
    border-color: var(--primary);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
  }
}

.signup-terms-text {
  font-size: 14px;
  color: var(--text);
  line-height: 22px;
  margin: 0;
  flex: 1;
}

.signup-link {
  color: var(--primary);
  text-decoration: underline;
  cursor: pointer;
  display: inline-flex;
}

.signup-submit-btn {
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

.signup-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: signup-spin 0.8s linear infinite;
}

@keyframes signup-spin {
  to { transform: rotate(360deg); }
}

.signup-login-link {
  text-align: center;
  font-size: 16px;
  color: var(--text);
  margin: 0;
}

.signup-illustration {
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
  .signup-illustration {
    display: none;
  }
  .signup-form-panel {
    flex: 1;
    width: 100%;
  }
}
</style>
