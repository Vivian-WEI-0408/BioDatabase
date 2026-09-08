<template>
    <div class="modal-inner">
        <div class="modal-header">
            <div class="model-header__left">
                <div class="modal-title">{{ item ? 'Edit' : 'Add' }} Species</div>
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
        <div class="modal-body">
            <div class="form1">
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Full name</div>
                    </div>
                    <div class="form-input-box"><input class="form-input" v-model="f.name"></div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.name }}</div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Variant name</div>
                    </div>
                    <div class="form-input-box"><input class="form-input" v-model="f.variantName"></div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.variantName }}</div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Species name</div>
                    </div>
                    <div class="form-input-box"><input class="form-input" v-model="f.speciesName"></div>
                    <div class="form-err">
                        <div class="form-err-text"></div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-label-top">
                        <div class="form-label-text">Genus name</div>
                    </div>
                    <div class="form-input-box"><input class="form-input" v-model="f.genusName"></div>
                    <div class="form-err">
                        <div class="form-err-text"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <div class="form-buttons">
                <a class="btn btn-danger " @click="resetForm(f)">Reset</a>
                <a class="btn btn-primary " @click="save()">Save</a>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        editItem: {
            type: Object,
            required: false,
            default: null
        }
    },
    components: {
    },
    created() {
        let t = this;
        if (t.editItem) {
            t.item = mirror(t.editItem);
            copyFrom(t.f, t.item);
        }
        else {
            debug(() => {
                t.f = {
                    name: 'testttt',
                    speciesName: 'testttt',
                    genusName: 'testttt',
                    variantName: 'testttt',
                };
            });
        }
    },
    mounted() {

    },
    methods: {
        resetForm() {
            G.clearObject(this.f);
            G.clearObject(this.err);
        },
        async save() {
            let t = this;

            if (t.busying)
                return;

            G.clearObject(t.err);

            let valid = true;

            if (!t.f.name) {
                t.err.name = 'Required';
                valid = false;
            }

            if (!t.f.variantName) {
                t.err.variantName = 'Required';
                valid = false;
            }

            if (!valid)
                return;

            t.busying = true;

            if (!t.item) {
                tpro.post('species/register', t.f).then(res => {
                    t.busying = false;
                    if (res.status == 200) {
                        t.$emit('create', res.data.species);
                        A.toast('Save successful!');
                        t.$emit('close');
                    }
                }).catch(err => {
                    t.busying = false;
                    A.err(err.response.data || 'Unknown error');
                });
            }
            else {
            }

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
            item: null,
            f: {
                name: '',
                speciesName: '',
                genusName: '',
                variantName: '',
            },
            err: {
                name: '',
                variantName: '',
            },
            list: {
            },
        };
    }
};
</script>

<style lang="scss" scoped></style>