<template>
    <div class="modal-inner">
        <div class="modal-header">
            <div class="model-header__left">
                <div class="modal-title">Generating promoter sequences</div>
            </div>
            <div class="modal-header__right">
                <div class="modal-close-btn" @click="close"><svg data-svg-ext-mode="persistent" width="10" height="10"
                        viewbox="0 0 10 10" fill="none" class="modal-close-icon">
                        <path opacity="0.8"
                            d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                            fill="currentColor" data-svg-ext-orig-fill="#E71D36"></path>
                    </svg></div>
            </div>
        </div>
        <div class="modal-body auto-width column-layout align-top">
            <div class="form1 activator-form">
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Model For Generation</div>
                    </div>
                    <div class="form-input-box">
                        <select-box ref="selGenerator" placeholder="Select model" :items="list.generator"
                            @select="f.generator = $event.ID" placement="top"></select-box>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.generator }}</div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Please input the desired pattern</div>
                    </div>
                    <div class="form-input-box"><input class="form-input" placeholder="N{20}AAACCCGGGTTTN{20}"
                            v-model="f.pattern"></div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.pattern }}</div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Please input the desired strength(s) line-by-line</div>
                    </div>
                    <div class="form-input-box"><textarea resize="none" class="form-input multiple-line"
                            v-model="f.strengths" rows="5" placeholder="0.1
0.5
1"></textarea></div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.strengths }}</div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Relative tolerance of strength deviation</div>
                    </div>
                    <div class="form-input-box"><input class="form-input" placeholder="0.1" min="0" max="1" step="0.01"
                            type="number" value="0.1" v-model="f.tolerance"></div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.tolerance }}</div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Seed for the random number generator</div>
                    </div>
                    <div class="form-input-box"><input class="form-input" min="0" max="1000000" step="1" type="number"
                            v-model="f.seed">
                        <svg v-tooltip="{ 'content': 'This is intended for reproducible results. <br>Leave it blank if you do not want a fixed seed.', 'html': true }"
                            data-svg-ext-root="1" width="18" height="18" viewbox="0 0 18 18" fill="none"
                            class="form-input__right-icon">
                            <path
                                d="M8.75 0C3.91797 0 0 3.91797 0 8.75C0 13.582 3.91797 17.5 8.75 17.5C13.582 17.5 17.5 13.582 17.5 8.75C17.5 3.91797 13.582 0 8.75 0ZM8.75 13.8281C8.31836 13.8281 7.96875 13.4785 7.96875 13.0469C7.96875 12.6152 8.31836 12.2656 8.75 12.2656C9.18164 12.2656 9.53125 12.6152 9.53125 13.0469C9.53125 13.4785 9.18164 13.8281 8.75 13.8281ZM9.97852 9.54102C9.61719 9.67969 9.375 10.0312 9.375 10.416V10.8594C9.375 10.9453 9.30469 11.0156 9.21875 11.0156H8.28125C8.19531 11.0156 8.125 10.9453 8.125 10.8594V10.4395C8.125 9.98828 8.25586 9.54297 8.51367 9.17188C8.76562 8.80859 9.11719 8.53125 9.53125 8.37305C10.1953 8.11719 10.625 7.56055 10.625 6.95312C10.625 6.0918 9.7832 5.39062 8.75 5.39062C7.7168 5.39062 6.875 6.0918 6.875 6.95312V7.10156C6.875 7.1875 6.80469 7.25781 6.71875 7.25781H5.78125C5.69531 7.25781 5.625 7.1875 5.625 7.10156V6.95312C5.625 6.18555 5.96094 5.46875 6.57031 4.93555C7.15625 4.42188 7.92969 4.14062 8.75 4.14062C9.57031 4.14062 10.3438 4.42383 10.9297 4.93555C11.5391 5.46875 11.875 6.18555 11.875 6.95312C11.875 8.08203 11.1309 9.09766 9.97852 9.54102Z"
                                fill="currentColor" data-svg-ext-orig-fill="#E71D36"></path>
                        </svg>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.seed }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <div class="form-buttons">
                <a class="btn btn-danger " @click="resetForm()">Reset</a>
                <a class="btn btn-primary " @click="save()">Generate</a>
            </div>
        </div>
    </div>
</template>

<script>
import SelectBox from '../parts/select-box.vue';
import { buildTaskName, showTaskQueuedDialog, submitTproTask } from '../../assets/js/tpro-task.js';

export default {
    props: {
        speciesId: {
            type: Number,
            required: true
        }
    },
    components: {
        SelectBox
    },
    created() {
        let t = this;

        t.loadGenerators();

        t.defaultF = mirror(t.f);

        debug(() => {
            t.f = {
                pattern: 'N{20}AAACCCGGGTTTN{20}',
                strengths: '0.1\n0.5\n1',
                tolerance: 0.1,
                seed: '',
            };
        });
    },
    mounted() {
        let t = this;
    },
    methods: {
        resetForm() {
            let t = this;
            mirror(t.defaultF, t.f);
            G.clearObject(t.err);
            t.$refs.selGenerator.onSelect(t.list.generator[t.list.generator.length - 1]);
        },
        async execute() {
            let t = this;

            if (t.busying)
                return;

            t.busying = true;

            let data = {
                generator: t.f.generator,
                pattern: t.f.pattern,
                strengthList: t.f.strengths.split('\n').map(item => parseFloat(item)),
                tolerance: t.f.tolerance,
                seed: t.f.seed || 0,
            };

            try {
                const task = await submitTproTask({
                    operation: 'promoter/generate',
                    name: buildTaskName('Generating promoter sequences'),
                    params: data,
                });

                if (task) {
                    t.$emit('close');
                    showTaskQueuedDialog(task.id);
                }
            } catch (err) {
                A.err(err.message || 'Failed to submit task');
            } finally {
                t.busying = false;
            }
        },
        loadGenerators() {
            let t = this;

            tpro.get('generator/show/' + t.speciesId).then(res => {
                if (res.status == 200) {
                    t.list.generator = res.data;
                    t.$refs.selGenerator.onSelect(t.list.generator[t.list.generator.length - 1]);
                }
            });
        },
        async save() {
            let t = this;

            G.clearObject(t.err);

            let valid = true;

            if (!t.f.generator) {
                t.err.generator = 'Required';
                valid = false;
            }

            if (!t.f.strengths) {
                t.err.strengths = 'Required';
                valid = false;
            }

            if (!numberCheck(t.f, t.err, ['tolerance'])) {
                valid = false;
            }

            if (t.f.seed && isNaN(t.f.seed)) {
                t.err.seed = 'Invalid';
                valid = false;
            }

            if (!valid)
                return;

            t.execute();

        },
        close() {
            let t = this;
            A.safety('Are you sure you want to discard your changes?').then(res => {
                if (res.isConfirmed) {
                    t.$emit('close');
                }
            });
        }
    },
    data() {
        return {
            defaultF: {},
            f: {
                generator: null,
                pattern: '',
                strengths: '',
                tolerance: 0.1,
                seed: '',
            },
            err: {
            },
            list: {
                generator: [],
            },
            dict: {
            }
        };
    },
    computed: {
    }
};
</script>

<style lang="scss" scoped>
.characters {
    display: flex;
    flex-wrap: wrap;
    word-break: break-all;
}

.subregion {
    word-break: break-all;
    text-align: left;

    &:hover {}
}

.regions {
    display: flex;
    justify-content: center;
    gap: 6px;
    padding: 6px 0;
}
</style>