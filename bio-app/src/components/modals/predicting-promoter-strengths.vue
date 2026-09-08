<template>
    <div class="modal-inner">
        <div class="modal-header">
            <div class="model-header__left">
                <div class="modal-title">Predicting promoter strengths</div>
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
                        <div class="form-label-text">Model For Prediction</div>
                    </div>
                    <div class="form-input-box">
                        <select-box ref="selPredictor" placeholder="Select predictor" :items="list.predictor"
                            @select="f.predictor = $event.ID" placement="bottom"></select-box>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.predictor }}</div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Please input sequences line-by-line</div>
                        <a class="form-label-link" @click="putSampleSequences">Add an Example</a>
                    </div>
                    <div class="form-input-box"><textarea resize="none" class="form-input multiple-line" rows="5"
                            v-model="f.sequences"></textarea>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.sequences }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <div class="form-buttons">
                <a class="btn btn-danger " @click="resetForm()">Reset</a>
                <a class="btn btn-primary " @click="save()">Predict</a>
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

        t.loadPredictors();

        t.defaultF = mirror(t.f);

        debug(() => {
            t.f = {
                sequences: 'ATGATTTCTGGAATTCGCGGCCGCTTCTAGAGTTTACAGCTAGCTCAGTCCTAGGTATTATGCTAGCTACTAGTGAAAGAGGAGAAATACTAGATGGCTT'
            };
        });
    },
    mounted() {
        let t = this;
    },
    methods: {
        putSampleSequences() {
            let t = this;
            t.f.sequences = `ATGATTTCTGGAATTCGCGGCCGCTTCTAGAGTTTACAGCTAGCTCAGTCCTAGGTATTATGCTAGCTACTAGTGAAAGAGGAGAAATACTAGATGGCTT`;
        },
        resetForm() {
            let t = this;
            mirror(t.defaultF, t.f);
            G.clearObject(t.err);
            t.$refs.selPredictor.onSelect(t.list.predictor[t.list.predictor.length - 1]);
        },
        async execute() {
            let t = this;

            if (t.busying)
                return;

            t.busying = true;

            let data = {
                predictor: t.f.predictor,
                sequences: [t.f.sequences],
            };

            try {
                const task = await submitTproTask({
                    operation: 'promoter/predict',
                    name: buildTaskName('Predicting promoter strengths'),
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
        loadPredictors() {
            let t = this;
            tpro.get('predictor/show/' + t.speciesId).then(res => {
                if (res.status == 200) {
                    t.list.predictor = res.data;
                    t.$refs.selPredictor.onSelect(t.list.predictor[t.list.predictor.length - 1]);
                }
            });
        },
        async save() {
            let t = this;

            G.clearObject(t.err);

            let valid = true;

            if (!t.f.predictor) {
                t.err.predictor = 'Required';
                valid = false;
            }

            if (!t.f.sequences) {
                t.err.sequences = 'Required';
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
                predictor: null,
                sequences: '',
            },
            err: {
            },
            list: {
                predictor: [],
            },
            dict: {
            }
        };
    },
    computed: {
    }
};
</script>
