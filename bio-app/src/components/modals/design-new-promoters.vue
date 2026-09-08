<template>
    <div class="modal-inner">
        <div class="modal-header">
            <div class="model-header__left">
                <div class="modal-title">Designing a promoter sequence</div>
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
                        <div class="form-label-text">I'd like to start from...</div>
                    </div>
                    <div class="form-input-box">
                        <van-radio-group shape="dot" class="form-input-box__checkboxes" v-model="f.type">
                            <van-radio name="existing">A specific regulator</van-radio>
                            <van-radio name="customized">A general regulation type</van-radio>
                        </van-radio-group>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text"></div>
                    </div>
                </div>
                <div class="form-group" v-show="f.type == 'existing'">
                    <div class="form-label-top">
                        <div class="form-label-text">Please select an existing regulator</div>
                    </div>
                    <div class="form-input-box">
                        <select-box v-model="selectedRegulator" ref="selRegulator" placeholder="Select regulator"
                            :items="list.regulator" @select="f.regulator = $event.ID"></select-box>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.regulator }}</div>
                    </div>
                </div>
                <div class="form-group"
                    v-if="f.type == 'existing' && selectedRegulator && selectedRegulator.type == 'single'">
                    <div class="form-label-top">
                        <div class="form-label-text">Sequence of the TF binding site (optional)</div>
                    </div>
                    <div class="form-input-box">
                        <input class="form-input" v-model="f.sequence1">
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.sequence1 }}</div>
                    </div>
                </div>
                <div class="form-group"
                    v-if="f.type == 'existing' && selectedRegulator && selectedRegulator.type == 'multiple'">
                    <div class="form-label-top">
                        <div class="form-label-text">Sequence of the TF binding site (optional)</div>
                    </div>
                    <div class="form-input-box__multiple">
                        <div class="form-input-box with-label inline">
                            <div class="form-label-text" style="min-width: 28px;">TF 1</div>
                            <input class="form-input" v-model="f.sequence1">
                        </div>
                        <div class="form-err" v-if="err.sequence1">
                            <div class="form-err-text">{{ err.sequence1 }}</div>
                        </div>
                        <div class="form-input-box with-label inline">
                            <div class="form-label-text" style="min-width: 28px;">TF 2</div>
                            <input class="form-input" v-model="f.sequence2">
                        </div>
                        <div class="form-err" v-if="err.sequence2">
                            <div class="form-err-text">{{ err.sequence2 }}</div>
                        </div>
                    </div>
                </div>
                <div class="form-group" v-if="f.type == 'customized'">
                    <div class="form-label-top">
                        <div class="form-label-text">Please specify the type of transcription factor (TF) </div>
                    </div>
                    <div class="form-input-box">
                        <van-radio-group shape="dot" class="form-input-box__checkboxes" v-model="f.subtype">
                            <van-radio name="activation">Activating TF</van-radio>
                            <van-radio name="repression">Repressive TF</van-radio>
                            <van-radio name="A+R">Activating TF + Repressive TF</van-radio>
                        </van-radio-group>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text"></div>
                    </div>
                </div>
                <div class="form-group" v-if="f.type == 'customized' && f.subtype != 'A+R'">
                    <div class="form-label-top">
                        <div class="form-label-text">Sequence of the TF binding site (required)</div>
                    </div>
                    <div class="form-input-box"><input class="form-input" v-model="f.sequence1"></div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.sequence1 }}</div>
                    </div>
                </div>
                <div class="form-group" v-if="f.type == 'customized' && (f.subtype == 'A+R')">
                    <div class="form-label-top">
                        <div class="form-label-text">Sequence of the TF binding site (required):</div>
                    </div>
                    <div class="form-input-box__multiple">
                        <div class="form-input-box with-label inline">
                            <div class="form-label-text">TF 1</div><input class="form-input" v-model="f.sequence1">
                        </div>
                        <div class="form-err" v-if="err.sequence1">
                            <div class="form-err-text">{{ err.sequence1 }}</div>
                        </div>
                        <div class="form-input-box with-label inline">
                            <div class="form-label-text">TF 2</div><input class="form-input" v-model="f.sequence2">
                        </div>
                        <div class="form-err" v-if="err.sequence2">
                            <div class="form-err-text">{{ err.sequence2 }}</div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Select the optimization target</div>
                        <div class="form-label-top__right">
                            <van-radio-group direction="horizontal" class="_reductions" shape="dot"
                                v-model="f.targetReduction">
                                <van-radio icon-size="14px" name="*">&times;</van-radio>
                                <van-radio icon-size="14px" name="+">&plus;</van-radio>
                            </van-radio-group>
                        </div>
                    </div>
                    <div class="form-input-box with-label">
                        <div class="form-label-text">Subtarget 1</div>
                        <select-box ref="selSubtarget1" :items="list.subtarget1"
                            @select="f.subtarget1 = $event.id"></select-box>
                    </div>
                    <div class="form-input-box with-label second-line">
                        <div class="form-label-text form-label-text__hidden">Subtarget 1</div>
                        <div class="form-label-text">Weight 1</div><input class="form-input form-input__limit-width"
                            v-model="f.targetWeight1" type="number" min="0" step="1">
                        <div class="form-err">
                            <div class="form-err-text">{{ err.targetWeight1 }}</div>
                        </div>
                    </div>
                    <div class="form-input-box with-label">
                        <div class="form-label-text">Subtarget 2</div>
                        <select-box ref="selSubtarget2" :items="list.subtarget2"
                            @select="f.subtarget2 = $event.id"></select-box>
                    </div>
                    <div class="form-input-box with-label second-line">
                        <div class="form-label-text form-label-text__hidden">Subtarget 2<br></div>
                        <div class="form-label-text">Weight 2</div><input class="form-input form-input__limit-width"
                            v-model="f.targetWeight2" type="number" min="0" step="1">
                        <div class="form-err">
                            <div class="form-err-text">{{ err.targetWeight2 }}</div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Predictor for estimating the promoter strength</div>
                    </div>
                    <div class="form-input-box">
                        <select-box ref="selPredictor" placeholder="Select predictor" :items="list.predictor"
                            @select="f.predictor = $event.ID" placement="top"></select-box>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.predictor }}</div>
                    </div>
                </div>
            </div>
            <div class="form1 activator-form">
                <div class="form-section-title">
                    <div class="form-section-title__text">Constraints for optimization</div>
                    <svg width="15" height="7" viewbox="0 0 9 5" fill="none" class="form-section-title__icon"
                        style="display: none;">
                        <path d="M0.5 0.5L4.5 4.5L8.5 0.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"
                            fill="currentColor"></path>
                    </svg>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Desired range of the optimization target</div>
                    </div>
                    <div class="form-input-box__multiple">
                        <div class="form-input-box with-label inline">
                            <div class="form-label-text" style="min-width: 205px;">Minimum uninduced expression</div>
                            <input class="form-input" v-model="f.minMinimum" type="number" min="0" step="0.001">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minMinimum }}</div>
                            </div>
                        </div>
                        <div class="form-input-box with-label inline">
                            <div class="form-label-text" style="min-width: 205px;">Minimum induced expression</div>
                            <input class="form-input" v-model="f.minMaximum" type="number" min="0" step="0.001">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minMaximum }}</div>
                            </div>
                        </div>
                        <div class="form-input-box with-label inline">
                            <div class="form-label-text" style="min-width: 205px;">Minimum induction fold-change</div>
                            <input class="form-input" v-model="f.minFoldchange1" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minFoldchange1 }}</div>
                            </div>
                        </div>
                        <div class="form-input-box with-label inline" v-if="multipleTF">
                            <div class="form-label-text" style="min-width: 205px;">Minimum induction fold-change<br>for
                                the second TF</div><input class="form-input" v-model="f.minFoldchange2" type="number"
                                min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minFoldchange2 }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Concentration range of the TF</div>
                    </div>
                    <div class="form-input-box with-label" v-if="!multipleTF">
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.minRegulator1" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minRegulator1 }}</div>
                            </div>
                        </div>
                        <div class="form-input-box__separator">~</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.maxRegulator1" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.maxRegulator1 }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-input-box with-label" v-if="multipleTF">
                        <div class="form-label-text" style="min-width: 28px;">TF 1</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.minRegulator1" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minRegulator1 }}</div>
                            </div>
                        </div>
                        <div class="form-input-box__separator">~</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.maxRegulator1" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.maxRegulator1 }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-input-box with-label" v-if="multipleTF">
                        <div class="form-label-text" style="min-width: 28px;">TF 2</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.minRegulator2" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minRegulator2 }}</div>
                            </div>
                        </div>
                        <div class="form-input-box__separator">~</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.maxRegulator2" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.maxRegulator2 }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Concentration range of the inducer (mol/L)</div>
                    </div>
                    <div class="form-input-box with-label" v-if="!multipleTF">
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.minInducer1" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minInducer1 }}</div>
                            </div>
                        </div>
                        <div class="form-input-box__separator">~</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.maxInducer1" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.maxInducer1 }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-input-box with-label" v-if="multipleTF">
                        <div class="form-label-text" style="min-width: 28px;">TF 1</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.minInducer1" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minInducer1 }}</div>
                            </div>
                        </div>
                        <div class="form-input-box__separator">~</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.maxInducer1" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.maxInducer1 }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-input-box with-label" v-if="multipleTF">
                        <div class="form-label-text" style="min-width: 28px;">TF 2</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.minInducer2" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.minInducer2 }}</div>
                            </div>
                        </div>
                        <div class="form-input-box__separator">~</div>
                        <div class="form-input-box__inner-with-err">
                            <input class="form-input" v-model="f.maxInducer2" type="number" min="0" step="1">
                            <div class="form-err">
                                <div class="form-err-text">{{ err.maxInducer2 }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Possible choice of promoters </div>
                    </div>
                    <div class="form-input-box">
                        <van-radio-group shape="dot" class="form-input-box__checkboxes" v-model="f.promoterChoice">
                            <van-radio name="dataset">Using existing promoters sequences </van-radio>
                            <van-radio name="generator">Generating by a trained model</van-radio>
                        </van-radio-group>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text"></div>
                    </div>
                </div>
                <div class="form-group" v-if="f.promoterChoice == 'generator'">
                    <div class="form-label-top">
                        <div class="form-label-text">Customize the pattern of promoter sequence</div>
                    </div>
                    <div class="form-input-box">
                        <input class="form-input" v-model="f.pattern" placeholder="N{10} TTGACA N{23} GAGCAC">
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.pattern }}</div>
                    </div>
                </div>
                <div class="form-group" v-show="f.promoterChoice == 'generator'">
                    <div class="form-label-top">
                        <div class="form-label-text">Select a model to generate promoter sequences</div>
                    </div>
                    <div class="form-input-box">
                        <select-box ref="selGenerator" placeholder="Select model" :items="list.generator"
                            @select="f.generator = $event.ID" placement="top"></select-box>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.generator }}</div>
                    </div>
                </div>
                <div class="form-group" v-show="f.promoterChoice == 'dataset'">
                    <div class="form-label-top">
                        <div class="form-label-text">Datasets containing possible choice of promoters</div>
                    </div>
                    <div class="form-input-box">
                        <select-box ref="selDataset" placeholder="Select dataset" :items="list.dataset"
                            @select="f.dataset = $event.ID" placement="top"></select-box>
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.dataset }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <div class="form-buttons">
                <a class="btn btn-danger " @click="resetForm()">Reset</a>
                <a class="btn btn-primary " @click="save()">Design</a>
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

        t.loadRegulators();
        t.loadPredictors();
        t.loadDatasets();
        t.loadGenerators();

        t.defaultF = mirror(t.f);

        debug(() => {
            t.f = {
                "type": "existing",
                "regulator": 53,
                "subtype": "activation",
                "sequence1": "",
                "sequence2": "",
                "subtarget1": "relmaximum",
                "targetReduction": "*",
                "targetWeight1": 1,
                "subtarget2": "foldchange",
                "targetWeight2": 1,
                "predictor": 8,
                "minMinimum": 0.001,
                "minMaximum": 0.001,
                "minFoldchange1": 1,
                "minFoldchange2": 1,
                "minRegulator1": 0,
                "maxRegulator1": 10,
                "minRegulator2": 0,
                "maxRegulator2": 10,
                "minInducer1": 0,
                "maxInducer1": 1,
                "minInducer2": 0,
                "maxInducer2": 1,
                "promoterChoice": "dataset",
                "dataset": 1,
                "pattern": "",
                "generator": 1,
            };

        });
    },
    mounted() {
        let t = this;
        t.$refs.selSubtarget1.selected = t.list.subtarget1[1];
        t.$refs.selSubtarget2.selected = t.list.subtarget2[4];
    },
    methods: {
        resetForm() {
            let t = this;
            mirror(t.defaultF, t.f);
            G.clearObject(t.err);
            t.$refs.selRegulator.onSelect(t.list.regulator[t.list.regulator.length - 1]);
            t.$refs.selPredictor.onSelect(t.list.predictor[t.list.predictor.length - 1]);
            t.$refs.selDataset.onSelect(t.list.dataset[t.list.dataset.length - 1]);
            t.$refs.selGenerator.onSelect(t.list.generator[t.list.generator.length - 1]);
        },
        buildDisplayMeta() {
            let t = this;
            let regulator = t.list.regulator.find(item => item.ID == t.f.regulator);

            return {
                form: {
                    regulatorName: regulator?.name || '',
                    regulationType: regulator?.type == 'single' ? 'Single TF' : 'Multiple TFs',
                    subtarget1Name: t.list.subtarget1.find(item => item.id == t.f.subtarget1)?.name || '',
                    subtarget2Name: t.list.subtarget2.find(item => item.id == t.f.subtarget2)?.name || '',
                    targetReduction: t.f.targetReduction == '+' ? '&plus;' : '&times;',
                },
            };
        },
        async execute() {
            let t = this;

            if (t.busying)
                return;

            t.busying = true;

            let data = {
                regulator: t.f.regulator,
                predictor: t.f.predictor,
                generator: t.f.generator,
                type: t.f.type,
                subtype: t.f.subtype,
                pattern: t.f.pattern,
                promoterChoice: t.f.promoterChoice,
                target: {
                    subtargets: [
                        {
                            name: t.f.subtarget1,
                            weight: t.f.targetWeight1
                        },
                        {
                            name: t.f.subtarget2,
                            weight: t.f.targetWeight2
                        }
                    ],
                    targetReduction: t.f.targetReduction
                },

                minMinimum: t.f.minMinimum,
                minMaximum: t.f.minMaximum,

                components: [
                    {
                        sequence: t.f.sequence1,
                        minRegulator: t.f.minRegulator1,
                        maxRegulator: t.f.maxRegulator1,
                        minInducer: t.f.minInducer1,
                        maxInducer: t.f.maxInducer1,
                        minFoldchange: t.f.minFoldchange1
                    }
                ],

                datasets: [t.f.dataset],
            };

            if (t.multipleTF) {
                data.components.push({
                    sequence: t.f.sequence2,
                    minRegulator: t.f.minRegulator2,
                    maxRegulator: t.f.maxRegulator2,
                    minInducer: t.f.minInducer2,
                    maxInducer: t.f.maxInducer2,
                    minFoldchange: t.f.minFoldchange2
                });
            }

            try {
                const task = await submitTproTask({
                    operation: 'regulation/design',
                    name: buildTaskName('Designing a promoter sequence'),
                    params: data,
                    displayMeta: t.buildDisplayMeta(),
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
        loadDatasets() {
            let t = this;
            tpro.get('dataset/show/genes/' + t.speciesId).then(res => {
                if (res.status == 200) {
                    t.list.dataset = res.data;
                    t.$refs.selDataset.onSelect(t.list.dataset[t.list.dataset.length - 1]);
                }
            });
        },
        loadRegulators() {
            let t = this;
            tpro.get('regulator/show/' + t.speciesId).then(res => {
                if (res.status == 200) {
                    t.list.regulator = res.data.filter(item => !item.subtypes.includes('Guharajan'));
                    t.$refs.selRegulator.onSelect(t.list.regulator[t.list.regulator.length - 1]);
                }
            });
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

            if (t.f.type == 'existing' && !t.f.regulator) {
                t.err.regulator = 'Required';
                valid = false;
            }

            if (t.f.type == 'customized') {
                if (t.f.subtype == 'activation' || t.f.subtype == 'repression') {
                    if (!t.f.sequence1) {
                        t.err.sequence1 = 'Required';
                        valid = false;
                    }
                }

                if (t.f.subtype == 'A+R') {
                    if (!t.f.sequence1) {
                        t.err.sequence1 = 'Required';
                        valid = false;
                    }
                    if (!t.f.sequence2) {
                        t.err.sequence2 = 'Required';
                        valid = false;
                    }
                }
            }

            if (!t.f.targetWeight1) {
                t.err.targetWeight1 = 'Required';
                valid = false;
            }
            else if (isNaN(t.f.targetWeight1)) {
                t.err.targetWeight1 = 'Invalid';
                valid = false;
            }

            if (t.f.subtarget2) {
                if (!t.f.targetWeight2) {
                    t.err.targetWeight2 = 'Required';
                    valid = false;
                }
                else if (isNaN(t.f.targetWeight2)) {
                    t.err.targetWeight2 = 'Invalid';
                    valid = false;
                }
            }

            if (!t.f.predictor) {
                t.err.predictor = 'Required';
                valid = false;
            }


            if (!numberCheck(t.f, t.err,
                ['minMinimum', 'minMaximum', 'minFoldchange1', 'minRegulator1', 'maxRegulator1', 'minInducer1', 'maxInducer1'])) {
                valid = false;
            }

            if (t.multipleTF) {
                if (!numberCheck(t.f, t.err,
                    ['minFoldchange2', 'minRegulator2', 'maxRegulator2', 'minInducer2', 'maxInducer2'])) {
                    valid = false;
                }
            }
            if (t.f.promoterChoice == 'generator' && !t.f.generator) {
                t.err.generator = 'Required';
                valid = false;
            }
            if (t.f.promoterChoice == 'dataset' && !t.f.dataset) {
                t.err.dataset = 'Required';
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
                "type": "existing",
                "regulator": 53,
                "subtype": "activation",
                "sequence1": "",
                "sequence2": "",
                "subtarget1": "relmaximum",
                "targetReduction": "*",
                "targetWeight1": 1,
                "subtarget2": "foldchange",
                "targetWeight2": 1,
                "predictor": 8,
                "minMinimum": 0.001,
                "minMaximum": 0.001,
                "minFoldchange1": 1,
                "minFoldchange2": 1,
                "minRegulator1": 0,
                "maxRegulator1": 10,
                "minRegulator2": 0,
                "maxRegulator2": 10,
                "minInducer1": 0,
                "maxInducer1": 1,
                "minInducer2": 0,
                "maxInducer2": 1,
                "promoterChoice": "dataset",
                "dataset": 1,
                "pattern": "",
                "generator": 1,
            },
            selectedRegulator: null,
            err: {
            },
            list: {
                regulator: [],
                predictor: [],
                dataset: [],
                generator: [],
                subtarget1: [
                    { 'id': 'maximum', 'name': 'Induced expression' },
                    { 'id': 'relmaximum', 'name': 'Normalized induced expression' },
                    { 'id': 'logrelmaximum', 'name': 'log10(Normalized induced expression)' },
                    { 'id': 'foldchange', 'name': 'Induction fold-change' },
                    { 'id': 'logfoldchange', 'name': 'log10(Induction fold-change)' },
                ],
                subtarget2: [
                    { 'id': '', 'name': 'None' },
                    { 'id': 'maximum', 'name': 'Induced expression' },
                    { 'id': 'relmaximum', 'name': 'Normalized induced expression' },
                    { 'id': 'logrelmaximum', 'name': 'log10(Normalized induced expression)' },
                    { 'id': 'foldchange', 'name': 'Induction fold-change' },
                    { 'id': 'logfoldchange', 'name': 'log10(Induction fold-change)' },
                ],
            },
            dict: {
            }
        };
    },
    computed: {
        multipleTF() {
            let t = this;
            return (t.f.type == 'existing' && t.selectedRegulator && t.selectedRegulator.type == 'multiple') ||
                (t.f.type == 'customized' && t.f.subtype == 'A+R');
        },
    }
};
</script>

<style lang="scss">
._reductions {
    .van-radio__icon--dot__icon {
        height: 7px;
        width: 7px;
    }

    .van-radio__label {
        font-size: 20px;
        margin-left: 2px;
    }
}
</style>