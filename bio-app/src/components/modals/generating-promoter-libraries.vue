<template>
    <div class="modal-inner">
        <div class="modal-header">
            <div class="model-header__left">
                <div class="modal-title">Generating promoter libraries</div>
            </div>
            <div class="modal-header__right">
                <div class="modal-close-btn" @click="close()"><svg data-svg-ext-mode="persistent" width="10" height="10"
                        viewbox="0 0 10 10" fill="none" class="modal-close-icon">
                        <path opacity="0.8"
                            d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                            fill="currentColor" data-svg-ext-orig-fill="#E71D36"></path>
                    </svg></div>
            </div>
        </div>
        <div class="modal-body auto-width column-layout" style="align-items:normal;">
            <div class="form1 activator-form">
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Transciprtional Activator For Generation</div>
                    </div>
                    <div class="form-input-box">
                        <select-box ref="selActivator" placeholder="Select activator" :items="list.activator"
                            @select="f.activator = $event.ID; loadSubmotifPositions($event.ID)"></select-box>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.activator }}</div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Desired number of sequences for each submotif</div>
                    </div>
                    <div class="form-two-column">
                        <div class="form-column" v-for="(sp, i) in list.sp">
                            <div class="form-column-inner">
                                <div class="form-label-left">
                                    <div class="form-label-left__text" style="min-width: 68px;">{{ sp.value }} region
                                    </div>
                                </div>
                                <div class="form-input-box inline">
                                    <input class="form-input" v-model="sp.dimension" type="number" min="1" max="1000">
                                </div>
                            </div>
                            <div class="form-err">
                                <div class="form-err-text">{{ err['dimension' + (i + 1)] }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Desired pattern for each submotif</div>
                    </div>
                    <div class="form-input-box__multiple">
                        <template v-for="(sp, i) in list.sp">
                            <div class="form-input-box with-label inline">
                                <div class="form-label-text" style="min-width: 68px;">{{ sp.value }} region</div><input
                                    class="form-input" v-model="sp.pattern">
                            </div>
                            <div class="form-err" v-if="err['pattern' + (i + 1)]">
                                <div class="form-err-text">{{ err['pattern' + (i + 1)] }}</div>
                            </div>
                        </template>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Relative score range for each submotif</div>
                    </div>
                    <div class="form-input-box with-label" v-for="(sp, i) in list.sp">
                        <div class="form-label-text" style="min-width: 68px;">{{ sp.value }} region</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="sp.minScore" type="number" min="0" max="1" step="0.01">
                            <div class="form-err">
                                <div class="form-err-text">{{ err['minScore' + (i + 1)] }}</div>
                            </div>
                        </div>
                        <div class="form-input-box__separator">~</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="sp.maxScore" type="number" min="0" max="1" step="0.01">
                            <div class="form-err">
                                <div class="form-err-text">{{ err['maxScore' + (i + 1)] }}</div>
                            </div>
                        </div>
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

        t.loadActivators();

        t.defaultF = mirror(t.f);

        debug(() => {
            t.f = {

            };
        });
    },
    mounted() {
        let t = this;
    },
    methods: {
        loadSubmotifPositions(id) {
            let t = this;

            tpro.get('activator/submotifPositions/' + id).then(res => {
                if (res.status == 200) {
                    let arr = [];

                    res.data.forEach(item => {
                        arr.push({
                            value: item,
                            dimension: 3,
                            pattern: '',
                            minScore: 0.5,
                            maxScore: 1,
                        });
                    });

                    t.list.sp = arr;
                }
            });

        },
        resetForm() {
            let t = this;
            mirror(t.defaultF, t.f);
            G.clearObject(t.err);
            t.$refs.selActivator.onSelect(t.list.activator[t.list.activator.length - 1]);
        },
        async execute() {
            let t = this;

            if (t.busying)
                return;

            t.busying = true;

            let submotifs = [];
            let data = {
                activator: t.f.activator,
                submotifs: submotifs,
            };

            t.list.sp.forEach(sp => {
                submotifs.push({
                    count: sp.dimension,
                    pattern: sp.pattern,
                    minScore: sp.minScore,
                    maxScore: sp.maxScore,
                });
            });

            try {
                const task = await submitTproTask({
                    operation: 'library/generate',
                    name: buildTaskName('Generating promoter libraries'),
                    params: data,
                    displayMeta: {
                        spLabels: t.list.sp.map((sp) => sp.value),
                    },
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
        loadActivators() {
            let t = this;

            tpro.get('activator/show/' + t.speciesId).then(res => {
                if (res.status == 200) {
                    t.list.activator = res.data;
                    t.$refs.selActivator.onSelect(t.list.activator[t.list.activator.length - 1]);
                }
            });
        },
        async save() {
            let t = this;

            G.clearObject(t.err);

            let valid = true;

            if (!t.f.activator) {
                t.err.activator = 'Required';
                valid = false;
            }

            t.list.sp.forEach((sp, i) => {
                if (!sp.dimension) {
                    t.err['dimension' + (i + 1)] = 'Required';
                    valid = false;
                }
                else if (isNaN(sp.dimension)) {
                    t.err['dimension' + (i + 1)] = 'Invalid';
                    valid = false;
                }
                if (!sp.minScore) {
                    t.err['minScore' + (i + 1)] = 'Required';
                    valid = false;
                }
                else if (isNaN(sp.minScore)) {
                    t.err['minScore' + (i + 1)] = 'Invalid';
                    valid = false;
                }
                if (!sp.maxScore) {
                    t.err['maxScore' + (i + 1)] = 'Required';
                    valid = false;
                }
                else if (isNaN(sp.maxScore)) {
                    t.err['maxScore' + (i + 1)] = 'Invalid';
                    valid = false;
                }
            });

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
                activator: null,
                dimension1: 3,
                dimension2: 3,
                pattern1: '',
                pattern2: '',
                minScore1: 0.5,
                maxScore1: 1.0,
                minScore2: 0.5,
                maxScore2: 1.0,
            },
            err: {
            },
            list: {
                activator: [],
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
.link-box {
    .lines {
        border: 1.5px solid var(--border);
        padding: 10px;

        .item {
            .line {
                padding: 6px 20px;
                display: flex;
                gap: 10px;
                align-items: center;
                border-radius: 3px;
                border: 1px solid transparent;

                .separator {
                    font-size: 20px;
                }

                &:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    cursor: pointer;
                    font-weight: 600;
                }
            }
        }
    }
}
</style>