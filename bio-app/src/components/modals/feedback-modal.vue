<template>
  <div class="modal-inner feedback-modal">
    <div class="modal-header">
      <div class="model-header__left">
        <div class="modal-title">意见反馈</div>
      </div>
      <div class="modal-header__right">
        <div class="modal-close-btn" @click="close">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="modal-close-icon">
            <path opacity="0.8"
              d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
              fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
    <div class="modal-body auto-width feedback-modal__body">
      <div class="form1">
        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">当前页面</div>
          </div>
          <div class="form-input-box">
            <input class="form-input" type="text" :value="pageUrl" readonly>
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">意见类型</div>
          </div>
          <div class="form-input-box">
            <select v-model="form.type" class="form-input">
              <option value="bug">Bug反馈</option>
              <option value="feature">功能建议</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">意见文本 <span class="feedback-modal__required">*</span></div>
          </div>
          <div class="form-input-box">
            <textarea
              v-model.trim="form.content"
              class="form-input multiple-line feedback-modal__textarea"
              rows="6"
              maxlength="2000"
              placeholder="请描述您遇到的问题或建议"
            />
          </div>
          <div class="feedback-modal__counter">{{ form.content.length }} / 2000</div>
          <div class="form-err">
            <div class="form-err-text">{{ err.content }}</div>
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">姓名</div>
          </div>
          <div class="form-input-box">
            <input v-model.trim="form.contact_name" class="form-input" type="text" maxlength="100">
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">单位名称</div>
          </div>
          <div class="form-input-box">
            <input v-model.trim="form.contact_org" class="form-input" type="text" maxlength="255">
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">联系手机号</div>
          </div>
          <div class="form-input-box">
            <input v-model.trim="form.contact_phone" class="form-input" type="text" maxlength="32">
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ err.contact_phone }}</div>
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">联系邮箱</div>
          </div>
          <div class="form-input-box">
            <input v-model.trim="form.contact_email" class="form-input" type="email" maxlength="255">
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ err.contact_email }}</div>
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-top">
            <div class="form-label-text">上传图片（最多 10 张，单张不超过 5MB）</div>
          </div>
          <div class="form-input-box">
            <input
              ref="fileInput"
              class="feedback-modal__file-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              multiple
              @change="onFileChange"
            >
            <button type="button" class="btn btn-outline" :disabled="submitting || images.length >= 10" @click="openFilePicker">
              选择图片
            </button>
          </div>
          <div class="form-err">
            <div class="form-err-text">{{ err.files }}</div>
          </div>
          <div v-if="images.length" class="feedback-modal__previews">
            <div v-for="(image, index) in images" :key="image.key" class="feedback-modal__preview">
              <img :src="image.previewUrl" alt="" class="feedback-modal__preview-img">
              <button type="button" class="feedback-modal__preview-remove" @click="removeImage(index)">移除</button>
            </div>
          </div>
        </div>

        <div class="form-err" v-if="err.general">
          <div class="form-err-text">{{ err.general }}</div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <div class="form-buttons">
        <a class="btn btn-danger" :class="{ disabled: submitting }" @click="resetForm">重置</a>
        <a class="btn btn-primary" :class="{ disabled: submitting }" @click="submit">{{ submitting ? '提交中...' : '提交' }}</a>
      </div>
    </div>
  </div>
</template>

<script>
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default {
  name: 'feedback-modal',
  props: {
    pageUrl: {
      type: String,
      default: '',
    },
  },
  emits: ['close', 'submitted'],
  data() {
    return {
      submitting: false,
      form: {
        type: 'bug',
        content: '',
        contact_name: '',
        contact_org: '',
        contact_phone: '',
        contact_email: '',
      },
      images: [],
      err: {
        content: '',
        contact_phone: '',
        contact_email: '',
        files: '',
        general: '',
      },
    };
  },
  created() {
    const user = G.U || {};
    this.form.contact_name = user.name || '';
    this.form.contact_org = user.organization || '';
    this.form.contact_phone = user.phone || '';
    this.form.contact_email = user.email || '';
  },
  beforeUnmount() {
    this.revokePreviewUrls();
  },
  methods: {
    close() {
      this.$emit('close');
    },
    openFilePicker() {
      this.$refs.fileInput?.click();
    },
    revokePreviewUrls() {
      this.images.forEach((image) => {
        if (image.previewUrl) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    },
    onFileChange(event) {
      const selected = Array.from(event.target.files || []);
      event.target.value = '';

      if (!selected.length) {
        return;
      }

      this.err.files = '';

      const remaining = MAX_IMAGES - this.images.length;
      if (remaining <= 0) {
        this.err.files = `最多上传 ${MAX_IMAGES} 张图片`;
        return;
      }

      const accepted = [];
      for (const file of selected.slice(0, remaining)) {
        if (!file.type.startsWith('image/')) {
          this.err.files = '仅支持上传图片文件';
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          this.err.files = '单张图片不能超过 5MB';
          continue;
        }
        accepted.push({
          key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }

      this.images = this.images.concat(accepted);
    },
    removeImage(index) {
      const image = this.images[index];
      if (image?.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
      }
      this.images.splice(index, 1);
    },
    resetForm() {
      if (this.submitting) {
        return;
      }
      this.revokePreviewUrls();
      this.images = [];
      this.form.type = 'bug';
      this.form.content = '';
      this.form.contact_name = (G.U && G.U.name) || '';
      this.form.contact_org = (G.U && G.U.organization) || '';
      this.form.contact_phone = (G.U && G.U.phone) || '';
      this.form.contact_email = (G.U && G.U.email) || '';
      this.err = {
        content: '',
        contact_phone: '',
        contact_email: '',
        files: '',
        general: '',
      };
    },
    validate() {
      this.err = {
        content: '',
        contact_phone: '',
        contact_email: '',
        files: '',
        general: '',
      };

      if (!this.form.content.trim()) {
        this.err.content = '请填写意见文本';
        return false;
      }

      if (this.form.content.length > 2000) {
        this.err.content = '意见文本不能超过 2000 字';
        return false;
      }

      if (this.form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.contact_email)) {
        this.err.contact_email = '联系邮箱格式不正确';
        return false;
      }

      if (this.form.contact_phone && !/^[\d+\-()\s]{6,32}$/.test(this.form.contact_phone)) {
        this.err.contact_phone = '联系手机号格式不正确';
        return false;
      }

      return true;
    },
    async submit() {
      if (this.submitting || !this.validate()) {
        return;
      }

      const formData = new FormData();
      formData.append('type', this.form.type);
      formData.append('content', this.form.content);
      formData.append('page_url', this.pageUrl || window.location.href);
      formData.append('contact_name', this.form.contact_name);
      formData.append('contact_org', this.form.contact_org);
      formData.append('contact_phone', this.form.contact_phone);
      formData.append('contact_email', this.form.contact_email);
      this.images.forEach((image) => {
        formData.append('files', image.file);
      });

      this.submitting = true;
      try {
        const res = await axios.post('feedback/submit', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const data = res.data || {};
        if (data.status === 2) {
          this.$router.replace('/signin');
          return;
        }
        if (data.status === 1) {
          Swal.fire({
            icon: 'success',
            text: data.msg || '意见反馈已提交，感谢您的反馈！',
            timer: 1800,
            showConfirmButton: false,
          });
          this.$emit('submitted');
          this.close();
          return;
        }
        this.err.general = data.msg || '提交失败，请稍后重试';
      } catch (e) {
        this.err.general = '网络错误，请稍后重试';
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
.feedback-modal__body {
  max-height: 70vh;
  overflow: auto;
}

.feedback-modal__required {
  color: #e74c3c;
}

.feedback-modal__textarea {
  min-height: 140px;
  resize: vertical;
}

.feedback-modal__counter {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(3, 2, 41, 0.45);
  text-align: right;
}

.feedback-modal__file-input {
  display: none;
}

.feedback-modal__previews {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.feedback-modal__preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 96px;
}

.feedback-modal__preview-img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(3, 2, 41, 0.08);
  background: #fff;
}

.feedback-modal__preview-remove {
  border: none;
  background: none;
  color: #e74c3c;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}
</style>
