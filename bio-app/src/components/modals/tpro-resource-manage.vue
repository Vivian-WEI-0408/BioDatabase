<template>
    <div class="modal-inner tpro-resource-manage">
        <div class="modal-header">
            <div class="model-header__left">
                <div class="modal-title">Managing {{ resource?.title }}</div>
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
        <div class="modal-body auto-width tpro-resource-manage__body">
            <div class="tpro-resource-toolbar">
                <a class="btn btn-primary" :class="{ disabled: !resource?.canCreate }"
                    v-tooltip="createTooltip" @click="onCreate">
                    Create
                </a>
                <a class="btn btn-danger" :class="{ disabled: !canDelete || selectedIds.length === 0 || deleting }"
                    @click="onDelete">
                    Delete
                </a>
            </div>

            <div v-if="loading" class="tpro-resource-empty">Loading...</div>
            <div v-else-if="items.length === 0" class="tpro-resource-empty">No items yet.</div>
            <div v-else class="data-table tpro-resource-table">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 48px;">
                                <input type="checkbox" :checked="allSelected" :indeterminate="someSelected"
                                    @change="toggleSelectAll">
                            </th>
                            <th>ID</th>
                            <th class="align-left">Name</th>
                            <th>Creation</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in items" :key="itemKey(item)"
                            :class="{ 'tpro-resource-row--clickable': resource?.listType === 'tasks' }"
                            @click="onRowClick(item)">
                            <td @click.stop>
                                <input type="checkbox" :checked="selectedIds.includes(itemKey(item))"
                                    @change="toggleSelect(itemKey(item))">
                            </td>
                            <td>{{ displayId(item) }}</td>
                            <td class="align-left">{{ item.name }}</td>
                            <td>{{ item.creation || item.date || '—' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import { getTproResource, parseTproError } from '../../assets/js/tpro-resources.js';

export default {
    props: {
        resourceKey: {
            type: String,
            required: true,
        },
        speciesId: {
            type: Number,
            required: true,
        },
    },
    created() {
        this.loadItems();
    },
    computed: {
        resource() {
            return getTproResource(this.resourceKey);
        },
        canDelete() {
            if (this.resource?.listType === 'tasks') {
                return this.resource?.canDelete !== false;
            }
            return Boolean(this.resource?.deletePath);
        },
        allSelected() {
            return this.items.length > 0
                && this.items.every((item) => this.selectedIds.includes(this.itemKey(item)));
        },
        someSelected() {
            return !this.allSelected
                && this.items.some((item) => this.selectedIds.includes(this.itemKey(item)));
        },
        createTooltip() {
            if (this.resource?.canCreate) {
                return null;
            }
            return { content: 'Create will be available in a future update.' };
        },
    },
    methods: {
        itemKey(item) {
            return item.ID ?? item.id;
        },
        displayId(item) {
            return item.ID ?? item.id;
        },
        async loadItems() {
            let t = this;
            const resource = t.resource;

            if (!resource) {
                return;
            }

            t.loading = true;
            t.selectedIds = [];

            try {
                if (resource.listType === 'tasks') {
                    const res = await axios.post('tasks/list', {
                        scope: 'all',
                        sortKey: 'date',
                        sortDir: 'desc',
                    });
                    const data = res.data || {};

                    if (data.status === 2) {
                        window.vrouter.replace('/signin');
                        return;
                    }

                    const tasks = data.options?.tasks || [];
                    t.items = tasks.filter((task) => task.app === 'T-Pro');
                } else {
                    const res = await tpro.get(resource.listPath(t.speciesId));
                    t.items = Array.isArray(res.data) ? res.data : [];
                }
            } catch (err) {
                A.err(parseTproError(err), 'Failed to load items');
                t.items = [];
            } finally {
                t.loading = false;
            }
        },
        toggleSelect(id) {
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter((item) => item !== id);
                return;
            }
            this.selectedIds = [...this.selectedIds, id];
        },
        toggleSelectAll() {
            if (this.allSelected) {
                this.selectedIds = [];
                return;
            }
            this.selectedIds = this.items.map((item) => this.itemKey(item));
        },
        onCreate() {
            if (!this.resource?.canCreate) {
                return;
            }
            this.$emit('create', this.resourceKey);
        },
        onRowClick(item) {
            if (this.resource?.listType !== 'tasks') {
                return;
            }
            window.vrouter.push(`/tasks/${item.id}`);
        },
        async onDelete() {
            let t = this;

            if (!t.canDelete || t.selectedIds.length === 0 || t.deleting) {
                return;
            }

            const result = await Swal.fire({
                title: 'Delete selected items?',
                text: `This will permanently remove ${t.selectedIds.length} item(s).`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                customClass: {
                    confirmButton: 'btn-confirm',
                    cancelButton: 'btn-cancel',
                },
            });

            if (!result.isConfirmed) {
                return;
            }

            t.deleting = true;

            try {
                if (t.resource.listType === 'tasks') {
                    const res = await axios.post('tasks/delete', { ids: t.selectedIds });
                    const data = res.data || {};

                    if (data.status !== 1) {
                        throw new Error(data.msg || 'Failed to delete tasks');
                    }
                } else {
                    const payload = t.resource.buildDeletePayload(t.speciesId, t.selectedIds);
                    const res = await tpro.post(t.resource.deletePath, payload);
                    const results = res.data || [];

                    if (results.some((item) => item === false)) {
                        throw new Error('Deletion failed for some items');
                    }
                }

                A.toast('Items deleted successfully');
                t.loadItems();
                t.$emit('refresh');
            } catch (err) {
                A.err(err.message || parseTproError(err), 'Delete failed');
            } finally {
                t.deleting = false;
            }
        },
        close() {
            this.$emit('close');
        },
    },
    data() {
        return {
            loading: false,
            deleting: false,
            items: [],
            selectedIds: [],
        };
    },
};
</script>

<style lang="scss" scoped>
.tpro-resource-manage__body {
    min-width: 640px;
    padding-bottom: 20px;
}

.tpro-resource-toolbar {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
}

.tpro-resource-empty {
    color: var(--text2);
    padding: 40px 0;
    text-align: center;
}

.tpro-resource-table {
    max-height: 420px;
    overflow: auto;
}

.tpro-resource-row--clickable {
    cursor: pointer;
}
</style>
