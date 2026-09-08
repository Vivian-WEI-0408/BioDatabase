<template>
  <div class="tplot-slider">
    <div class="tplot-slider__label">
      {{ valuePrefix }}
      <b>{{ displayValue }}</b>
    </div>
    <div class="tplot-slider__track-wrap">
      <input
        type="range"
        class="tplot-slider__input"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        @input="onInput"
      />
    </div>
    <div class="tplot-slider__range-labels">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'param-slider',
  props: {
    modelValue: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 10,
    },
    step: {
      type: Number,
      default: 0.01,
    },
    valuePrefix: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  computed: {
    displayValue() {
      const val = Number(this.modelValue);
      if (Number.isInteger(val)) {
        return String(val);
      }
      return val.toFixed(2);
    },
  },
  methods: {
    onInput(e) {
      this.$emit('update:modelValue', Number(e.target.value));
    },
  },
};
</script>
