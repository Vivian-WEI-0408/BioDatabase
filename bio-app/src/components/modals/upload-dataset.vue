<template>
    <div class="modal-inner">
        <div class="modal-header">
            <div class="model-header__left">
                <div class="modal-title">Upload {{ resourceTitle }}</div>
            </div>
            <div class="modal-header__right">
                <div class="modal-close-btn" @click="close">
                    <svg data-svg-ext-mode="persistent" width="10" height="10" viewbox="0 0 10 10" fill="none"
                        class="modal-close-icon">
                        <path opacity="0.8"
                            d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                            fill="currentColor"></path>
                    </svg>
                </div>
            </div>
        </div>
        <div class="modal-body auto-width tpro-upload-body">
            <div v-if="loading" class="tpro-resource-empty">Loading...</div>
            <div v-else class="form1">
                <div class="form-group" v-if="templates.length">
                    <div class="download-label">Download a template to fill in the experimental data:</div>
                    <div class="download-links">
                        <a v-for="item in templates" :key="item.fileName" class="download-link"
                            :href="templateUrl(item.fileName)" target="_blank" rel="noopener">
                            {{ item.description }} ({{ item.fileName }})
                        </a>
                    </div>
                </div>

                <div class="form-group" v-for="(suffix, index) in fileSuffixes" :key="index">
                    <div class="form-label-top">
                        <div class="form-label-text">Select a {{ suffix }} file</div>
                    </div>
                    <div class="form-input-box">
                        <input class="form-input" type="file" :accept="fileAccept"
                            @change="onFileChange(index, $event)">
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.files[index] }}</div>
                    </div>
                    <div v-if="files[index]" class="form-file-box">
                        <div class="form-file-box__left">
                            <div class="form-file__file-name">{{ files[index].name }}</div>
                        </div>
                        <div class="form-file-box__right">
                            <a class="form-file-box__remove-btn" @click="clearFile(index)">Remove</a>
                        </div>
                    </div>
                </div>

                <div class="form-group" v-for="field in metadataFields" :key="field.ID">
                    <div class="form-label-top">
                        <div class="form-label-text">
                            {{ capitalize(field.name) }}
                            <span v-if="field.type === 'list'">(one per line)</span>
                        </div>
                    </div>
                    <div class="form-input-box">
                        <input v-if="field.type === 'int' || field.type === 'float'" class="form-input" type="number"
                            v-model="metadataValues[field.ID]">
                        <select v-else-if="field.type === 'enum'" class="form-input" v-model="metadataValues[field.ID]">
                            <option v-for="entry in field.enum" :key="entry.ID" :value="entry.ID">{{ entry.value }}
                            </option>
                        </select>
                        <textarea v-else-if="field.type === 'list'" class="form-input multiple-line" rows="3"
                            v-model="metadataValues[field.ID]"></textarea>
                        <input v-else class="form-input" type="text" v-model="metadataValues[field.ID]">
                    </div>
                    <div class="form-err">
                        <div class="form-err-text">{{ err.metadata[field.ID] }}</div>
                    </div>
                </div>

                <div class="form-err" v-if="err.general">
                    <div class="form-err-text tpro-resource-err-general">{{ err.general }}</div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <div class="form-buttons">
                <a class="btn btn-danger" @click="resetForm()">Reset</a>
                <a class="btn btn-primary" :class="{ disabled: busying || loading }" @click="save()">Upload</a>
            </div>
        </div>
    </div>
</template>

<script>
import { parseTproError } from '../../assets/js/tpro-resources.js';

export default {
    props: {
        speciesId: {
            type: Number,
            required: true,
        },
        datasetType: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            default: 'CSV',
        },
        resourceTitle: {
            type: String,
            default: 'dataset',
        },
    },
    created() {
        this.loadSpecs();
    },
    methods: {
        capitalize(value) {
            if (!value) {
                return '';
            }
            return value.charAt(0).toUpperCase() + value.slice(1);
        },
        templateUrl(fileName) {
            return `/templates/tpro/${this.datasetType}/${this.fileType}/${fileName}`;
        },
        async loadSpecs() {
            let t = this;
            t.loading = true;

            try {
                const [specsRes, templatesRes, metadataRes] = await Promise.all([
                    tpro.get('dataset/specs/file'),
                    tpro.get(`dataset/templates/${t.datasetType}/${t.fileType}`),
                    tpro.get(`dataset/specs/metadata/${t.datasetType}/${t.fileType}/${t.speciesId}`),
                ]);

                const specs = specsRes.data || [];
                const datasetSpec = specs.find((item) => item.datasetType === t.datasetType);
                const formatSpec = datasetSpec?.fileFormats?.find((item) => item.name === t.fileType);
                t.fileSuffixes = formatSpec?.defaultSuffixes || ['.csv'];
                t.templates = templatesRes.data || [];
                t.metadataFields = metadataRes.data || [];
                t.initMetadataValues();
                t.resetFiles();
            } catch (err) {
                A.err(parseTproError(err), 'Failed to load upload form');
            } finally {
                t.loading = false;
            }
        },
        initMetadataValues() {
            let t = this;
            const values = {};

            t.metadataFields.forEach((field) => {
                if (field.type === 'enum' && field.enum?.length) {
                    values[field.ID] = field.default ?? field.enum[0].ID;
                } else if (field.type === 'list') {
                    values[field.ID] = Array.isArray(field.default) ? field.default.join('\n') : (field.default ?? '');
                } else {
                    values[field.ID] = field.default ?? '';
                }
            });

            t.metadataValues = values;
        },
        resetFiles() {
            let t = this;
            t.files = t.fileSuffixes.map(() => null);
            t.err.files = t.fileSuffixes.map(() => '');
        },
        onFileChange(index, event) {
            const file = event.target.files?.[0] || null;
            this.files[index] = file;
            this.err.files[index] = '';
        },
        clearFile(index) {
            this.files[index] = null;
            this.err.files[index] = '';
        },
        resetForm() {
            this.initMetadataValues();
            this.resetFiles();
            G.clearObject(this.err.metadata);
            this.err.general = '';
        },
        validate() {
            let t = this;
            let valid = true;

            G.clearObject(t.err.metadata);
            t.err.general = '';
            t.err.files = t.fileSuffixes.map(() => '');

            t.files.forEach((file, index) => {
                if (!file) {
                    t.err.files[index] = 'Required';
                    valid = false;
                }
            });

            t.metadataFields.forEach((field) => {
                if (!field.mandatory) {
                    return;
                }

                const value = t.metadataValues[field.ID];
                if (value === '' || value === null || value === undefined) {
                    t.err.metadata[field.ID] = 'Required';
                    valid = false;
                }
            });

            return valid;
        },
        buildMetadataPayload() {
            return this.metadataFields.map((field) => ({
                ID: field.ID,
                value: this.metadataValues[field.ID],
            }));
        },
        async save() {
            let t = this;

            if (t.busying || t.loading) {
                return;
            }

            if (!t.validate()) {
                return;
            }

            t.busying = true;

            const formData = new FormData();
            formData.append('data', JSON.stringify({
                datasetType: t.datasetType,
                fileType: t.fileType,
                speciesID: t.speciesId,
                metadata: t.buildMetadataPayload(),
            }));

            t.files.forEach((file) => {
                formData.append('files', file);
            });

            try {
                const res = await tpro.post('dataset/register', formData);
                const result = res.data || {};

                if (result.datasetID) {
                    A.toast(result.message || 'Dataset successfully registered');
                    t.$emit('created');
                    t.$emit('close');
                    return;
                }

                t.err.general = result.message || 'Registration failed';
            } catch (err) {
                t.err.general = parseTproError(err);
            } finally {
                t.busying = false;
            }
        },
        close() {
            let t = this;
            A.safety('Are you sure you want to discard your changes?').then((res) => {
                if (res.isConfirmed) {
                    t.$emit('close');
                }
            });
        },
    },
    computed: {
        fileAccept() {
            return this.fileType === 'CSV' ? '.csv,text/csv' : '';
        },
    },
    data() {
        return {
            loading: true,
            busying: false,
            fileSuffixes: [],
            templates: [],
            metadataFields: [],
            metadataValues: {},
            files: [],
            err: {
                files: [],
                metadata: {},
                general: '',
            },
        };
    },
};
</script>

<style lang="scss" scoped>
.tpro-upload-body {
    min-width: 520px;
}

.tpro-resource-err-general {
    text-align: left;
}
</style>
