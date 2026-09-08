<template>
  <div class="page-container admin-page">
    <div class="admin-page__header">
      <div>
        <div class="page-title">Admin</div>
        <div v-if="adminInfo.name" class="admin-page__subtitle">
          Signed in as {{ adminInfo.name }} ({{ formatRoleLabel(adminInfo.role) }})
        </div>
      </div>
      <div v-if="authorized" class="admin-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="tasks-tabs__btn"
          :class="{ 'tasks-tabs__btn--active': activeTab === tab.value }"
          @click="setActiveTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="checkingAccess" class="admin-page__state">Checking admin access...</div>
    <div v-else-if="!authorized" class="admin-page__state admin-page__state--denied">
      <div class="admin-page__state-title">Access Denied</div>
      <div class="admin-page__state-text">{{ accessMessage }}</div>
    </div>

    <template v-else>
      <div v-if="activeTab === 'users'" class="page-body admin-page__body">
        <div class="admin-toolbar">
          <div class="datasets-search admin-toolbar__search">
            <input
              v-model.trim="userFilters.keyword"
              type="search"
              class="datasets-search__input"
              placeholder="Search users..."
              aria-label="Search users"
              @keyup.enter="fetchUsers"
            >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="datasets-search__icon">
              <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
              <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <select v-model="userFilters.status" class="admin-toolbar__select" aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Disabled</option>
          </select>
          <select v-model="userFilters.role" class="admin-toolbar__select" aria-label="Filter by role">
            <option value="">All Roles</option>
            <option v-for="role in roleOptions" :key="role.value" :value="String(role.value)">
              {{ role.label }}
            </option>
          </select>
          <button type="button" class="btn btn-outline" :disabled="usersLoading" @click="fetchUsers">Refresh</button>
        </div>

        <div class="list-panel admin-table-wrap">
          <div class="admin-table">
            <div class="admin-row admin-row--header">
              <div class="admin-row__cell admin-row__cell--id">ID</div>
              <div class="admin-row__cell admin-row__cell--name">Name</div>
              <div class="admin-row__cell admin-row__cell--email">Email</div>
              <div class="admin-row__cell admin-row__cell--status">Status</div>
              <div class="admin-row__cell admin-row__cell--role">Role</div>
              <div class="admin-row__cell admin-row__cell--storage">Storage (MB)</div>
              <div class="admin-row__cell admin-row__cell--count">Tasks</div>
              <div class="admin-row__cell admin-row__cell--count">Files</div>
              <div class="admin-row__cell admin-row__cell--actions">Actions</div>
            </div>
            <div class="scroll-body admin-table__body">
              <div
                v-for="user in userList"
                :key="user.id"
                class="admin-row"
                :class="{ 'admin-row--selected': selectedUserId === user.id }"
              >
                <div class="admin-row__cell admin-row__cell--id">{{ user.id }}</div>
                <div class="admin-row__cell admin-row__cell--name">{{ user.name || '-' }}</div>
                <div class="admin-row__cell admin-row__cell--email">{{ user.email || '-' }}</div>
                <div class="admin-row__cell admin-row__cell--status">
                  <span class="admin-badge" :class="user.status === 1 ? 'admin-badge--active' : 'admin-badge--disabled'">
                    {{ user.status === 1 ? 'Active' : 'Disabled' }}
                  </span>
                </div>
                <div class="admin-row__cell admin-row__cell--role">{{ formatRoleLabel(user.role) }}</div>
                <div class="admin-row__cell admin-row__cell--storage">
                  <button type="button" class="admin-link-btn" @click="openStorageEditor(user)">
                    {{ formatStorage(user.storage) }}
                  </button>
                </div>
                <button
                  type="button"
                  class="admin-row__cell admin-row__cell--count admin-stat-link"
                  @click="viewUserTasks(user)"
                >
                  {{ user.task_count || 0 }}
                </button>
                <button
                  type="button"
                  class="admin-row__cell admin-row__cell--count admin-stat-link"
                  @click="viewUserFiles(user)"
                >
                  {{ user.file_count || 0 }}
                </button>
                <div class="admin-row__cell admin-row__cell--actions">
                  <button type="button" class="admin-action-btn" @click="loadUserDetail(user.id)">Detail</button>
                  <button
                    type="button"
                    class="admin-action-btn"
                    :disabled="userActionLoading"
                    @click="confirmToggleStatus(user)"
                  >
                    {{ user.status === 1 ? 'Disable' : 'Enable' }}
                  </button>
                  <van-popover
                    :show="rolePopoverUserId === user.id"
                    placement="bottom-end"
                    :offset="[0, 8]"
                    @update:show="(visible) => onRolePopoverVisibleChange(user.id, visible)"
                  >
                    <div class="admin-role-menu">
                      <button
                        v-for="role in roleOptions"
                        :key="role.value"
                        type="button"
                        class="admin-role-menu__item"
                        :class="{ 'admin-role-menu__item--active': user.role === role.value }"
                        @click="selectUserRole(user, role.value)"
                      >
                        {{ role.label }}
                      </button>
                    </div>
                    <template #reference>
                      <button type="button" class="admin-action-btn" @click="openRolePopover(user.id)">
                        Role
                      </button>
                    </template>
                  </van-popover>
                </div>
              </div>
              <div v-if="usersLoading" class="admin-empty">Loading users...</div>
              <div v-else-if="usersPagination.totalCount === 0" class="admin-empty">No users found.</div>
            </div>
          </div>
          <list-pagination
            :current-page="usersPage"
            :total-pages="usersTotalPages"
            :total="usersPagination.totalCount"
            :page-size="usersPageSize"
            :page-input="usersPageInput"
            @update:page-input="usersPageInput = $event"
            @prev="usersPrevPage"
            @next="usersNextPage"
            @jump="usersSubmitPageJump"
          />
        </div>

        <div v-if="selectedUserId" class="admin-detail-panel">
          <div class="admin-detail-panel__header">
            <div class="admin-detail-panel__title">
              User #{{ selectedUserId }}
              <span v-if="selectedUserDetail.name"> — {{ selectedUserDetail.name }}</span>
            </div>
            <button type="button" class="btn btn-outline" :disabled="detailLoading" @click="loadUserDetail(selectedUserId)">
              Reload Detail
            </button>
          </div>

          <div v-if="detailLoading" class="admin-empty">Loading user detail...</div>
          <template v-else>
            <div class="admin-detail-grid">
              <div><strong>Email:</strong> {{ selectedUserDetail.email || '-' }}</div>
              <div><strong>Organization:</strong> {{ selectedUserDetail.organization || '-' }}</div>
              <div><strong>Title:</strong> {{ selectedUserDetail.title || '-' }}</div>
              <div><strong>Status:</strong> {{ selectedUserDetail.status === 1 ? 'Active' : 'Disabled' }}</div>
              <div><strong>Role:</strong> {{ formatRoleLabel(selectedUserDetail.role) }}</div>
              <div>
                <strong>Storage:</strong>
                <button type="button" class="admin-link-btn" @click="openStorageEditor(selectedUserDetail)">
                  {{ formatStorage(selectedUserDetail.storage) }} MB
                </button>
              </div>
              <div>
                <strong>Tasks:</strong>
                <button type="button" class="admin-stat-link" @click="viewUserTasks(selectedUserDetail)">
                  {{ selectedUserDetail.task_count || 0 }}
                </button>
              </div>
              <div>
                <strong>Files:</strong>
                <button type="button" class="admin-stat-link" @click="viewUserFiles(selectedUserDetail)">
                  {{ selectedUserDetail.file_count || 0 }}
                </button>
              </div>
              <div v-if="isDataAdminRole(selectedUserDetail.role)" class="admin-detail-note">
                数据管理员可编辑、删除 Part / Plasmid / Backbone 三个数据表。
              </div>
            </div>
          </template>
        </div>
      </div>

      <div v-else-if="activeTab === 'files'" class="page-body admin-page__body">
        <div class="admin-toolbar">
          <input
            v-model.trim="fileFilters.userId"
            type="text"
            class="admin-toolbar__input"
            placeholder="User ID"
            aria-label="Filter by user ID"
            inputmode="numeric"
          >
          <div class="datasets-search admin-toolbar__search">
            <input
              v-model.trim="fileFilters.keyword"
              type="search"
              class="datasets-search__input"
              placeholder="Search file name..."
              aria-label="Search files"
              @keyup.enter="fetchAdminFiles"
            >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="datasets-search__icon">
              <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
              <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <select v-model="fileFilters.category" class="admin-toolbar__select" aria-label="Filter by category">
            <option value="">All Categories</option>
            <option v-for="item in categoryOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <input
            v-model.trim="fileFilters.extension"
            type="text"
            class="admin-toolbar__input"
            placeholder="Extension e.g. .pdf"
            aria-label="Filter by extension"
          >
          <button type="button" class="btn btn-outline" :disabled="filesLoading" @click="fetchAdminFiles">Refresh</button>
          <button
            type="button"
            class="btn btn-outline"
            :disabled="cleanupLoading"
            @click="previewCleanup"
          >
            Preview Cleanup
          </button>
          <button
            type="button"
            class="btn btn-danger"
            :disabled="!cleanupPreview || cleanupLoading"
            @click="confirmExecuteCleanup"
          >
            Execute Cleanup
          </button>
        </div>

        <div v-if="cleanupPreview" class="admin-cleanup-preview">
          <div class="admin-cleanup-preview__title">Cleanup Preview</div>
          <div class="admin-cleanup-preview__stats">
            <span><strong>Count:</strong> {{ cleanupPreview.count }}</span>
            <span><strong>Size:</strong> {{ formatSizeMb(cleanupPreview.totalSizeMb) }}</span>
          </div>
          <div v-if="cleanupPreview.sampleFiles && cleanupPreview.sampleFiles.length" class="admin-cleanup-preview__samples">
            Sample: {{ cleanupPreview.sampleFiles.map((f) => f.original_name).join(', ') }}
          </div>
        </div>

        <div v-if="cleanupResult" class="admin-cleanup-result">
          <div class="admin-cleanup-result__title">Last Cleanup Result</div>
          <div class="admin-cleanup-result__stats">
            <span><strong>Deleted:</strong> {{ cleanupResult.count || cleanupResult.deletedCount || 0 }}</span>
            <span><strong>Size:</strong> {{ formatSizeMb(cleanupResult.totalSizeMb) }}</span>
            <span><strong>Missing:</strong> {{ (cleanupResult.missingFiles || []).length }}</span>
            <span><strong>Failed:</strong> {{ (cleanupResult.failedFiles || []).length }}</span>
          </div>
        </div>

        <div class="list-panel admin-table-wrap">
          <div class="admin-table admin-table--files">
            <div class="admin-row admin-row--header admin-row--files">
              <label class="admin-row__cell admin-row__cell--check">
                <span
                  class="admin-checkbox"
                  :class="{
                    'admin-checkbox--checked': allFilesSelected,
                    'admin-checkbox--indeterminate': someFilesSelected,
                  }"
                >
                  <svg v-if="allFilesSelected" width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <input type="checkbox" class="admin-checkbox__input" :checked="allFilesSelected" @change="toggleSelectAllFiles">
              </label>
              <div class="admin-row__cell admin-row__cell--file-id">ID</div>
              <div class="admin-row__cell admin-row__cell--file-name">File Name</div>
              <div class="admin-row__cell admin-row__cell--file-user">User</div>
              <div class="admin-row__cell admin-row__cell--file-cat">Category</div>
              <div class="admin-row__cell admin-row__cell--file-size">Size</div>
              <div class="admin-row__cell admin-row__cell--file-date">Uploaded</div>
            </div>
            <div class="scroll-body admin-table__body">
              <div v-for="file in fileList" :key="file.id" class="admin-row admin-row--files">
                <label class="admin-row__cell admin-row__cell--check">
                  <span class="admin-checkbox" :class="{ 'admin-checkbox--checked': selectedFileIds.includes(file.id) }">
                    <svg v-if="selectedFileIds.includes(file.id)" width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1.5" stroke="#605bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                  <input
                    type="checkbox"
                    class="admin-checkbox__input"
                    :checked="selectedFileIds.includes(file.id)"
                    @change="toggleSelectFile(file.id)"
                  >
                </label>
                <div class="admin-row__cell admin-row__cell--file-id">{{ file.id }}</div>
                <div class="admin-row__cell admin-row__cell--file-name">
                  <div class="admin-row__name">{{ file.original_name }}</div>
                  <div class="admin-row__meta">{{ file.extension || '-' }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--file-user">
                  <div>{{ file.user?.name || '-' }}</div>
                  <div class="admin-row__meta">#{{ file.user_id }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--file-cat">{{ file.category || '-' }}</div>
                <div class="admin-row__cell admin-row__cell--file-size">{{ formatSizeBytes(file.size_bytes) }}</div>
                <div class="admin-row__cell admin-row__cell--file-date">{{ formatDate(file.created_at) }}</div>
              </div>
              <div v-if="filesLoading" class="admin-empty">Loading files...</div>
              <div v-else-if="filesPagination.totalCount === 0" class="admin-empty">No files found.</div>
            </div>
          </div>
          <list-pagination
            :current-page="filesPage"
            :total-pages="filesTotalPages"
            :total="filesPagination.totalCount"
            :page-size="filesPageSize"
            :page-input="filesPageInput"
            @update:page-input="filesPageInput = $event"
            @prev="filesPrevPage"
            @next="filesNextPage"
            @jump="filesSubmitPageJump"
          />
        </div>
      </div>

      <div v-else-if="activeTab === 'tasks'" class="page-body admin-page__body">
        <div class="admin-toolbar">
          <input
            v-model.trim="taskFilters.userId"
            type="text"
            class="admin-toolbar__input"
            placeholder="User ID"
            aria-label="Filter by user ID"
            inputmode="numeric"
          >
          <input
            v-model.trim="taskFilters.appId"
            type="text"
            class="admin-toolbar__input"
            placeholder="App ID"
            aria-label="Filter by app ID"
          >
          <select v-model="taskFilters.status" class="admin-toolbar__select" aria-label="Filter by status">
            <option value="">All Status</option>
            <option v-for="item in taskStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <div class="datasets-search admin-toolbar__search">
            <input
              v-model.trim="taskFilters.keyword"
              type="search"
              class="datasets-search__input"
              placeholder="Search tasks..."
              aria-label="Search tasks"
              @keyup.enter="fetchTasks"
            >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="datasets-search__icon">
              <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
              <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <button type="button" class="btn btn-outline" :disabled="tasksLoading" @click="fetchTasks">Refresh</button>
        </div>

        <div class="list-panel admin-table-wrap">
          <div class="admin-table admin-table--tasks">
            <div class="admin-row admin-row--header admin-row--tasks">
              <div class="admin-row__cell admin-row__cell--id">ID</div>
              <div class="admin-row__cell admin-row__cell--task-name">Name</div>
              <div class="admin-row__cell admin-row__cell--task-user">User</div>
              <div class="admin-row__cell admin-row__cell--task-app">App</div>
              <div class="admin-row__cell admin-row__cell--status">Status</div>
              <div class="admin-row__cell admin-row__cell--date">Created</div>
              <div class="admin-row__cell admin-row__cell--count">Shares</div>
              <div class="admin-row__cell admin-row__cell--actions">Actions</div>
            </div>
            <div class="scroll-body admin-table__body">
              <div
                v-for="task in taskList"
                :key="task.id"
                class="admin-row admin-row--tasks"
                :class="{ 'admin-row--selected': selectedTaskId === task.id }"
              >
                <div class="admin-row__cell admin-row__cell--id">{{ task.id }}</div>
                <div class="admin-row__cell admin-row__cell--task-name">
                  <div class="admin-row__name">{{ task.name || '-' }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--task-user">
                  <div>{{ task.user?.name || '-' }}</div>
                  <div class="admin-row__meta">#{{ task.user_id }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--task-app">
                  <div>{{ task.app?.title || task.app_id || '-' }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--status">
                  <span class="admin-badge" :class="taskStatusBadgeClass(task.status)">{{ task.status }}</span>
                </div>
                <div class="admin-row__cell admin-row__cell--date">{{ formatDate(task.created_at) }}</div>
                <div class="admin-row__cell admin-row__cell--count">{{ task.share_count || 0 }}</div>
                <div class="admin-row__cell admin-row__cell--actions">
                  <button type="button" class="admin-action-btn" @click="loadTaskDetail(task.id)">Detail</button>
                  <button type="button" class="admin-action-btn" @click="confirmCorrectTaskStatus(task)">Status</button>
                  <button type="button" class="admin-action-btn" @click="confirmDeleteTask(task)">Delete</button>
                </div>
              </div>
              <div v-if="tasksLoading" class="admin-empty">Loading tasks...</div>
              <div v-else-if="tasksPagination.totalCount === 0" class="admin-empty">No tasks found.</div>
            </div>
          </div>
          <list-pagination
            :current-page="tasksPage"
            :total-pages="tasksTotalPages"
            :total="tasksPagination.totalCount"
            :page-size="tasksPageSize"
            :page-input="tasksPageInput"
            @update:page-input="tasksPageInput = $event"
            @prev="tasksPrevPage"
            @next="tasksNextPage"
            @jump="tasksSubmitPageJump"
          />
        </div>

        <div v-if="selectedTaskId" class="admin-detail-panel">
          <div class="admin-detail-panel__header">
            <div class="admin-detail-panel__title">Task #{{ selectedTaskId }}</div>
            <button type="button" class="btn btn-outline" :disabled="taskDetailLoading" @click="loadTaskDetail(selectedTaskId)">
              Reload
            </button>
          </div>
          <div v-if="taskDetailLoading" class="admin-empty">Loading task detail...</div>
          <template v-else>
            <div class="admin-detail-grid">
              <div><strong>Name:</strong> {{ selectedTaskDetail.name || '-' }}</div>
              <div><strong>Status:</strong> {{ selectedTaskDetail.status }}</div>
              <div><strong>User:</strong> {{ selectedTaskDetail.user?.name || '-' }} (#{{ selectedTaskDetail.user_id }})</div>
              <div><strong>App:</strong> {{ selectedTaskDetail.app?.title || selectedTaskDetail.app_id || '-' }}</div>
              <div><strong>Operation:</strong> {{ selectedTaskDetail.operation || '-' }}</div>
              <div><strong>Shares:</strong> {{ selectedTaskDetail.share_count || 0 }}</div>
              <div v-if="selectedTaskDetail.error_msg"><strong>Error:</strong> {{ selectedTaskDetail.error_msg }}</div>
            </div>
            <div class="admin-json-block">
              <div class="admin-json-block__title">Params</div>
              <pre class="admin-json-block__content">{{ formatJsonPreview(selectedTaskDetail.params) }}</pre>
            </div>
            <div class="admin-json-block">
              <div class="admin-json-block__title">Result</div>
              <pre class="admin-json-block__content">{{ formatJsonPreview(selectedTaskDetail.result) }}</pre>
            </div>
          </template>
        </div>
      </div>

      <div v-else-if="activeTab === 'apps'" class="page-body admin-page__body">
        <div class="admin-toolbar">
          <div class="datasets-search admin-toolbar__search">
            <input
              v-model.trim="appFilters.keyword"
              type="search"
              class="datasets-search__input"
              placeholder="Search apps..."
              aria-label="Search apps"
              @keyup.enter="fetchApps"
            >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="datasets-search__icon">
              <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
              <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <select v-model="appFilters.status" class="admin-toolbar__select" aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="1">Visible</option>
            <option value="0">Hidden</option>
          </select>
          <button type="button" class="btn btn-outline" :disabled="appsLoading" @click="fetchApps">Refresh</button>
          <button type="button" class="btn btn-primary" @click="openAppForm()">Create App</button>
          <button
            type="button"
            class="btn btn-outline"
            :disabled="appsLoading || appsSortSaving || appList.length === 0"
            @click="confirmSaveAppSort"
          >
            {{ appsSortSaving ? 'Saving...' : 'Save Sort Order' }}
          </button>
        </div>

        <div class="list-panel admin-table-wrap">
          <div class="admin-table admin-table--apps">
            <div class="admin-row admin-row--header admin-row--apps">
              <div class="admin-row__cell admin-row__cell--app-id">ID</div>
              <div class="admin-row__cell admin-row__cell--app-title">Title</div>
              <div class="admin-row__cell admin-row__cell--app-route">Route</div>
              <div class="admin-row__cell admin-row__cell--status">Status</div>
              <div class="admin-row__cell admin-row__cell--sort">Sort</div>
              <div class="admin-row__cell admin-row__cell--count">Tasks</div>
              <div class="admin-row__cell admin-row__cell--count">Favorites</div>
              <div class="admin-row__cell admin-row__cell--actions">Actions</div>
            </div>
            <div class="scroll-body admin-table__body">
              <div v-for="app in appList" :key="app.id" class="admin-row admin-row--apps">
                <div class="admin-row__cell admin-row__cell--app-id">{{ app.id }}</div>
                <div class="admin-row__cell admin-row__cell--app-title">
                  <div class="admin-row__name">{{ app.title || '-' }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--app-route">{{ app.route || '-' }}</div>
                <div class="admin-row__cell admin-row__cell--status">
                  <span class="admin-badge" :class="app.status === 1 ? 'admin-badge--active' : 'admin-badge--disabled'">
                    {{ app.status === 1 ? 'Visible' : 'Hidden' }}
                  </span>
                </div>
                <div class="admin-row__cell admin-row__cell--sort">
                  <input
                    v-model.number="appSortDraft[app.id]"
                    type="number"
                    class="admin-inline-input"
                    aria-label="Sort order"
                  >
                </div>
                <div class="admin-row__cell admin-row__cell--count">{{ app.task_count || 0 }}</div>
                <div class="admin-row__cell admin-row__cell--count">{{ app.favorites_count || 0 }}</div>
                <div class="admin-row__cell admin-row__cell--actions">
                  <button type="button" class="admin-action-btn" @click="openAppForm(app)">Edit</button>
                  <button type="button" class="admin-action-btn" @click="confirmToggleAppStatus(app)">
                    {{ app.status === 1 ? 'Hide' : 'Show' }}
                  </button>
                </div>
              </div>
              <div v-if="appsLoading" class="admin-empty">Loading apps...</div>
              <div v-else-if="appsPagination.totalCount === 0" class="admin-empty">No apps found.</div>
            </div>
          </div>
          <list-pagination
            :current-page="appsPage"
            :total-pages="appsTotalPages"
            :total="appsPagination.totalCount"
            :page-size="appsPageSize"
            :page-input="appsPageInput"
            @update:page-input="appsPageInput = $event"
            @prev="appsPrevPage"
            @next="appsNextPage"
            @jump="appsSubmitPageJump"
          />
        </div>

        <div v-if="appFormVisible" class="admin-detail-panel">
          <div class="admin-detail-panel__header">
            <div class="admin-detail-panel__title">{{ appFormMode === 'create' ? 'Create App' : `Edit App: ${appForm.id}` }}</div>
            <button type="button" class="btn btn-outline" @click="closeAppForm">Close</button>
          </div>
          <div class="admin-form-grid">
            <label class="admin-form-field">
              <span>ID</span>
              <input v-model.trim="appForm.id" type="text" class="admin-form-input" :disabled="appFormMode === 'edit'">
            </label>
            <label class="admin-form-field">
              <span>Title</span>
              <input v-model.trim="appForm.title" type="text" class="admin-form-input">
            </label>
            <label class="admin-form-field admin-form-field--full">
              <span>Description</span>
              <textarea v-model="appForm.description" class="admin-form-textarea" rows="3" />
            </label>
            <label class="admin-form-field">
              <span>Icon</span>
              <input v-model.trim="appForm.icon" type="text" class="admin-form-input">
            </label>
            <label class="admin-form-field">
              <span>Route</span>
              <input v-model.trim="appForm.route" type="text" class="admin-form-input">
            </label>
            <label class="admin-form-field">
              <span>Author</span>
              <input v-model.trim="appForm.author" type="text" class="admin-form-input">
            </label>
            <label class="admin-form-field">
              <span>App Color</span>
              <input v-model.trim="appForm.app_color" type="text" class="admin-form-input">
            </label>
            <label class="admin-form-field">
              <span>Sort Order</span>
              <input v-model.number="appForm.sort_order" type="number" class="admin-form-input">
            </label>
            <label class="admin-form-field">
              <span>Status</span>
              <select v-model.number="appForm.status" class="admin-form-input">
                <option :value="1">Visible</option>
                <option :value="0">Hidden</option>
              </select>
            </label>
          </div>
          <div class="admin-form-actions">
            <button type="button" class="btn btn-primary" :disabled="appFormSaving" @click="saveAppForm">
              {{ appFormSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'documents'" class="page-body admin-page__body">
        <div class="admin-toolbar">
          <button type="button" class="btn btn-outline" :disabled="documentsLoading" @click="fetchDocuments">Refresh</button>
          <button type="button" class="btn btn-primary" @click="openSectionForm()">Create Section</button>
        </div>

        <div v-if="documentsLoading" class="admin-empty">Loading documents...</div>
        <div v-else-if="documentSections.length === 0" class="admin-empty">No document sections.</div>
        <div v-else class="list-panel admin-doc-panel">
          <div class="scroll-body admin-doc-scroll">
            <div class="admin-doc-tree">
              <div v-for="section in documentSections" :key="section.id" class="admin-doc-section">
                <div class="admin-doc-section__header">
                  <div>
                    <div class="admin-doc-section__title">{{ section.title }}</div>
                    <div class="admin-row__meta">ID: {{ section.id }} · Sort: {{ section.sort_order }} · Pages: {{ section.pages?.length || 0 }}</div>
                  </div>
                  <div class="admin-row__cell--actions">
                    <button type="button" class="admin-action-btn" @click="openPageForm(section)">Add Page</button>
                    <button type="button" class="admin-action-btn" @click="openSectionForm(section)">Edit</button>
                    <button type="button" class="admin-action-btn" @click="confirmDeleteSection(section)">Delete</button>
                  </div>
                </div>
                <div v-if="section.pages && section.pages.length" class="admin-doc-pages">
                  <div v-for="page in section.pages" :key="page.id" class="admin-doc-page">
                    <div>
                      <div class="admin-doc-page__title">{{ page.title }}</div>
                      <div class="admin-row__meta">ID: {{ page.id }} · Sort: {{ page.sort_order }}</div>
                    </div>
                    <div class="admin-row__cell--actions">
                      <button type="button" class="admin-action-btn" @click="openPageForm(section, page)">Edit</button>
                      <button type="button" class="admin-action-btn" @click="confirmDeletePage(page)">Delete</button>
                    </div>
                  </div>
                </div>
                <div v-else class="admin-doc-pages admin-doc-pages--empty">No pages in this section.</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="sectionFormVisible" class="admin-detail-panel">
          <div class="admin-detail-panel__header">
            <div class="admin-detail-panel__title">{{ sectionFormMode === 'create' ? 'Create Section' : `Edit Section: ${sectionForm.id}` }}</div>
            <button type="button" class="btn btn-outline" @click="closeSectionForm">Close</button>
          </div>
          <div class="admin-form-grid">
            <label class="admin-form-field">
              <span>ID</span>
              <input v-model.trim="sectionForm.id" type="text" class="admin-form-input" :disabled="sectionFormMode === 'edit'">
            </label>
            <label class="admin-form-field">
              <span>Title</span>
              <input v-model.trim="sectionForm.title" type="text" class="admin-form-input">
            </label>
            <label class="admin-form-field">
              <span>Sort Order</span>
              <input v-model.number="sectionForm.sort_order" type="number" class="admin-form-input">
            </label>
            <label class="admin-form-field admin-form-field--checkbox">
              <input v-model="sectionForm.expanded_default" type="checkbox">
              <span>Expanded by default</span>
            </label>
          </div>
          <div class="admin-form-actions">
            <button type="button" class="btn btn-primary" :disabled="sectionFormSaving" @click="saveSectionForm">
              {{ sectionFormSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>

        <div v-if="pageFormVisible" class="admin-detail-panel">
          <div class="admin-detail-panel__header">
            <div class="admin-detail-panel__title">{{ pageFormMode === 'create' ? 'Create Page' : `Edit Page: ${pageForm.id}` }}</div>
            <button type="button" class="btn btn-outline" @click="closePageForm">Close</button>
          </div>
          <div class="admin-form-grid">
            <label class="admin-form-field">
              <span>ID</span>
              <input v-model.trim="pageForm.id" type="text" class="admin-form-input" :disabled="pageFormMode === 'edit'">
            </label>
            <label class="admin-form-field">
              <span>Section</span>
              <select v-model="pageForm.section_id" class="admin-form-input">
                <option v-for="section in documentSections" :key="section.id" :value="section.id">{{ section.title }}</option>
              </select>
            </label>
            <label class="admin-form-field">
              <span>Title</span>
              <input v-model.trim="pageForm.title" type="text" class="admin-form-input">
            </label>
            <label class="admin-form-field admin-form-field--full">
              <span>Intro</span>
              <textarea v-model="pageForm.intro" class="admin-form-textarea" rows="2" />
            </label>
            <label class="admin-form-field admin-form-field--full">
              <span>Hero Image</span>
              <input v-model="pageForm.hero_image" type="text" class="admin-form-input">
            </label>
            <label class="admin-form-field">
              <span>Sort Order</span>
              <input v-model.number="pageForm.sort_order" type="number" class="admin-form-input">
            </label>
            <div class="admin-form-field admin-form-field--full">
              <DocumentContentEditor v-model="pageForm.content_html" />
            </div>
          </div>
          <div class="admin-form-actions">
            <button type="button" class="btn btn-primary" :disabled="pageFormSaving" @click="savePageForm">
              {{ pageFormSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'feedback'" class="page-body admin-page__body">
        <div class="admin-toolbar">
          <select v-model="feedbackFilters.status" class="admin-toolbar__select" aria-label="Filter by status">
            <option value="">All Status</option>
            <option v-for="item in feedbackStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <select v-model="feedbackFilters.type" class="admin-toolbar__select" aria-label="Filter by type">
            <option value="">All Types</option>
            <option v-for="item in feedbackTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <div class="datasets-search admin-toolbar__search">
            <input
              v-model.trim="feedbackFilters.keyword"
              type="search"
              class="datasets-search__input"
              placeholder="Search feedback..."
              aria-label="Search feedback"
              @keyup.enter="fetchFeedbacks"
            >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="datasets-search__icon">
              <circle cx="8" cy="8" r="6" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" />
              <path d="M12.5 12.5L16 16" stroke="#030229" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <button type="button" class="btn btn-outline" :disabled="feedbacksLoading" @click="fetchFeedbacks">Refresh</button>
        </div>

        <div class="list-panel admin-table-wrap">
          <div class="admin-table admin-table--feedback">
            <div class="admin-row admin-row--header admin-row--feedback">
              <div class="admin-row__cell admin-row__cell--id">ID</div>
              <div class="admin-row__cell admin-row__cell--feedback-type">Type</div>
              <div class="admin-row__cell admin-row__cell--feedback-content">Content</div>
              <div class="admin-row__cell admin-row__cell--feedback-user">User</div>
              <div class="admin-row__cell admin-row__cell--feedback-url">Page URL</div>
              <div class="admin-row__cell admin-row__cell--status">Status</div>
              <div class="admin-row__cell admin-row__cell--date">Created</div>
              <div class="admin-row__cell admin-row__cell--actions">Actions</div>
            </div>
            <div class="scroll-body admin-table__body">
              <div
                v-for="feedback in feedbackList"
                :key="feedback.id"
                class="admin-row admin-row--feedback"
                :class="{ 'admin-row--selected': selectedFeedbackId === feedback.id }"
              >
                <div class="admin-row__cell admin-row__cell--id">{{ feedback.id }}</div>
                <div class="admin-row__cell admin-row__cell--feedback-type">{{ feedback.type_label || feedback.type }}</div>
                <div class="admin-row__cell admin-row__cell--feedback-content">
                  <div class="admin-row__name">{{ feedback.content_preview || '-' }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--feedback-user">
                  <div>{{ feedback.user?.name || feedback.contact_name || '-' }}</div>
                  <div class="admin-row__meta">#{{ feedback.user_id }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--feedback-url">
                  <a
                    v-if="feedback.page_url"
                    :href="feedback.page_url"
                    class="admin-row__link"
                    target="_blank"
                    rel="noopener"
                  >{{ truncateText(feedback.page_url, 42) }}</a>
                  <span v-else>-</span>
                </div>
                <div class="admin-row__cell admin-row__cell--status">
                  <span class="admin-badge" :class="feedbackStatusBadgeClass(feedback.status)">{{ feedback.status }}</span>
                </div>
                <div class="admin-row__cell admin-row__cell--date">{{ formatDate(feedback.created_at) }}</div>
                <div class="admin-row__cell admin-row__cell--actions">
                  <button type="button" class="admin-action-btn" @click="loadFeedbackDetail(feedback.id)">Detail</button>
                  <button
                    type="button"
                    class="admin-action-btn"
                    :disabled="feedback.status === 'completed'"
                    @click="confirmCompleteFeedback(feedback)"
                  >
                    Mark Completed
                  </button>
                </div>
              </div>
              <div v-if="feedbacksLoading" class="admin-empty">Loading feedback...</div>
              <div v-else-if="feedbacksPagination.totalCount === 0" class="admin-empty">No feedback found.</div>
            </div>
          </div>
          <list-pagination
            :current-page="feedbacksPage"
            :total-pages="feedbacksTotalPages"
            :total="feedbacksPagination.totalCount"
            :page-size="feedbacksPageSize"
            :page-input="feedbacksPageInput"
            @update:page-input="feedbacksPageInput = $event"
            @prev="feedbacksPrevPage"
            @next="feedbacksNextPage"
            @jump="feedbacksSubmitPageJump"
          />
        </div>

        <div v-if="selectedFeedbackId" class="admin-detail-panel">
          <div class="admin-detail-panel__header">
            <div class="admin-detail-panel__title">Feedback #{{ selectedFeedbackId }}</div>
            <button type="button" class="btn btn-outline" :disabled="feedbackDetailLoading" @click="loadFeedbackDetail(selectedFeedbackId)">
              Reload
            </button>
          </div>
          <div v-if="feedbackDetailLoading" class="admin-empty">Loading feedback detail...</div>
          <template v-else>
            <div class="admin-detail-grid">
              <div><strong>Type:</strong> {{ selectedFeedbackDetail.type_label || selectedFeedbackDetail.type || '-' }}</div>
              <div><strong>Status:</strong> {{ selectedFeedbackDetail.status || '-' }}</div>
              <div><strong>User:</strong> {{ selectedFeedbackDetail.user?.name || '-' }} (#{{ selectedFeedbackDetail.user_id }})</div>
              <div><strong>Contact Name:</strong> {{ selectedFeedbackDetail.contact_name || '-' }}</div>
              <div><strong>Organization:</strong> {{ selectedFeedbackDetail.contact_org || '-' }}</div>
              <div><strong>Phone:</strong> {{ selectedFeedbackDetail.contact_phone || '-' }}</div>
              <div><strong>Email:</strong> {{ selectedFeedbackDetail.contact_email || '-' }}</div>
              <div class="admin-detail-grid__full">
                <strong>Page URL:</strong>
                <a
                  v-if="selectedFeedbackDetail.page_url"
                  :href="selectedFeedbackDetail.page_url"
                  target="_blank"
                  rel="noopener"
                >{{ selectedFeedbackDetail.page_url }}</a>
                <span v-else>-</span>
              </div>
            </div>
            <div class="admin-json-block">
              <div class="admin-json-block__title">Content</div>
              <pre class="admin-json-block__content">{{ selectedFeedbackDetail.content || '-' }}</pre>
            </div>
            <div v-if="selectedFeedbackDetail.images?.length" class="admin-feedback-images">
              <div class="admin-json-block__title">Images</div>
              <div class="admin-feedback-images__grid">
                <a
                  v-for="(image, index) in selectedFeedbackDetail.images"
                  :key="`${image.path || index}`"
                  :href="image.url"
                  class="admin-feedback-images__item"
                  target="_blank"
                  rel="noopener"
                >
                  <img :src="image.url" :alt="image.originalName || 'feedback image'" class="admin-feedback-images__img">
                </a>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div v-else-if="activeTab === 'settings'" class="page-body admin-page__body">
        <div class="admin-toolbar">
          <select v-model="settingsGroupFilter" class="admin-toolbar__select" aria-label="Filter by group">
            <option value="">All Groups</option>
            <option v-for="group in settingsGroupOptions" :key="group" :value="group">{{ group }}</option>
          </select>
          <button type="button" class="btn btn-outline" :disabled="settingsLoading" @click="fetchSettings">Refresh</button>
          <button type="button" class="btn btn-primary" @click="openSettingForm()">Create Setting</button>
        </div>

        <div class="list-panel admin-table-wrap">
          <div class="admin-table admin-table--settings">
            <div class="admin-row admin-row--header admin-row--settings">
              <div class="admin-row__cell admin-row__cell--setting-key">Key</div>
              <div class="admin-row__cell admin-row__cell--setting-value">Value</div>
              <div class="admin-row__cell admin-row__cell--setting-type">Type</div>
              <div class="admin-row__cell admin-row__cell--setting-group">Group</div>
              <div class="admin-row__cell admin-row__cell--date">Updated</div>
              <div class="admin-row__cell admin-row__cell--actions">Actions</div>
            </div>
            <div class="scroll-body admin-table__body">
              <div v-for="setting in filteredSettings" :key="setting.key" class="admin-row admin-row--settings">
                <div class="admin-row__cell admin-row__cell--setting-key">
                  <div class="admin-row__name">{{ setting.key }}</div>
                  <div v-if="setting.description" class="admin-row__meta">{{ setting.description }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--setting-value">
                  <div class="admin-row__name">{{ setting.value }}</div>
                </div>
                <div class="admin-row__cell admin-row__cell--setting-type">{{ setting.type || 'string' }}</div>
                <div class="admin-row__cell admin-row__cell--setting-group">{{ setting.group || 'default' }}</div>
                <div class="admin-row__cell admin-row__cell--date">{{ formatDate(setting.updated_at) }}</div>
                <div class="admin-row__cell admin-row__cell--actions">
                  <button type="button" class="admin-action-btn" @click="openSettingForm(setting)">Edit</button>
                  <button type="button" class="admin-action-btn" @click="confirmDeleteSetting(setting)">Delete</button>
                </div>
              </div>
              <div v-if="settingsLoading" class="admin-empty">Loading settings...</div>
              <div v-else-if="filteredSettings.length === 0" class="admin-empty">No settings found.</div>
            </div>
          </div>
        </div>

        <div v-if="settingFormVisible" class="admin-detail-panel">
          <div class="admin-detail-panel__header">
            <div class="admin-detail-panel__title">{{ settingFormMode === 'create' ? 'Create Setting' : `Edit Setting: ${settingForm.key}` }}</div>
            <button type="button" class="btn btn-outline" @click="closeSettingForm">Close</button>
          </div>
          <div class="admin-form-grid">
            <label class="admin-form-field">
              <span>Key</span>
              <input v-model.trim="settingForm.key" type="text" class="admin-form-input" :disabled="settingFormMode === 'edit'">
            </label>
            <label class="admin-form-field">
              <span>Type</span>
              <input v-model.trim="settingForm.type" type="text" class="admin-form-input" placeholder="string">
            </label>
            <label class="admin-form-field">
              <span>Group</span>
              <input v-model.trim="settingForm.group" type="text" class="admin-form-input" placeholder="default">
            </label>
            <label class="admin-form-field admin-form-field--full">
              <span>Value</span>
              <textarea v-model="settingForm.value" class="admin-form-textarea" rows="4" />
            </label>
            <label class="admin-form-field admin-form-field--full">
              <span>Description</span>
              <textarea v-model="settingForm.description" class="admin-form-textarea" rows="2" />
            </label>
          </div>
          <div class="admin-form-actions">
            <button type="button" class="btn btn-primary" :disabled="settingFormSaving" @click="saveSettingForm">
              {{ settingFormSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import ListPagination from './parts/list-pagination.vue';
import DocumentContentEditor from './parts/document-content-editor.vue';

const ROLE_USER = 0;
const ROLE_DATA_ADMIN = 1;
const ROLE_ADMIN = 9;

const ROLE_OPTIONS = [
  { value: ROLE_USER, label: '普通用户' },
  { value: ROLE_DATA_ADMIN, label: '数据管理员' },
  { value: ROLE_ADMIN, label: '管理员' },
];

const ROLE_LABELS = ROLE_OPTIONS.reduce((map, item) => {
  map[item.value] = item.label;
  return map;
}, {});

const categoryOptions = [
  { label: 'Images', value: 'image' },
  { label: 'Documents', value: 'document' },
  { label: 'Spreadsheets', value: 'spreadsheet' },
  { label: 'Bio Data', value: 'bio-data' },
  { label: 'Data', value: 'data' },
];

const taskStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const feedbackStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

const feedbackTypeOptions = [
  { value: 'bug', label: 'Bug反馈' },
  { value: 'feature', label: '功能建议' },
  { value: 'other', label: '其他' },
];

const emptyAppForm = () => ({
  id: '',
  title: '',
  description: '',
  icon: '',
  route: '',
  author: '',
  app_color: '',
  sort_order: 0,
  status: 1,
});

const emptySectionForm = () => ({
  id: '',
  title: '',
  sort_order: 0,
  expanded_default: false,
});

const emptyPageForm = () => ({
  id: '',
  section_id: '',
  title: '',
  intro: '',
  hero_image: '',
  content_html: '',
  sort_order: 0,
});

const emptySettingForm = () => ({
  key: '',
  value: '',
  type: 'string',
  group: 'default',
  description: '',
});

export default {
  name: 'admin',
  components: {
    ListPagination,
    DocumentContentEditor,
  },
  data() {
    return {
      checkingAccess: true,
      authorized: false,
      accessMessage: '暂无后台管理权限',
      adminInfo: {},
      activeTab: 'users',
      tabs: [
        { value: 'users', label: 'Users' },
        { value: 'files', label: 'Files' },
        { value: 'tasks', label: 'Tasks' },
        { value: 'apps', label: 'Apps' },
        { value: 'documents', label: 'Documents' },
        { value: 'settings', label: 'Settings' },
        { value: 'feedback', label: 'Feedback' },
      ],
      roleOptions: ROLE_OPTIONS,
      rolePopoverUserId: null,
      categoryOptions,
      taskStatusOptions,
      feedbackStatusOptions,
      feedbackTypeOptions,
      userFilters: {
        keyword: '',
        status: '',
        role: '',
      },
      userList: [],
      usersLoading: false,
      userActionLoading: false,
      usersPage: 1,
      usersPageSize: 20,
      usersPageInput: '1',
      usersPagination: {
        currentPage: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 1,
      },
      selectedUserId: null,
      selectedUserDetail: {},
      detailLoading: false,
      fileFilters: {
        userId: '',
        keyword: '',
        category: '',
        extension: '',
      },
      fileList: [],
      filesLoading: false,
      filesPage: 1,
      filesPageSize: 20,
      filesPageInput: '1',
      filesPagination: {
        currentPage: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 1,
      },
      selectedFileIds: [],
      cleanupPreview: null,
      cleanupCriteria: null,
      cleanupResult: null,
      cleanupLoading: false,
      userSearchTimer: null,
      fileSearchTimer: null,
      taskFilters: {
        userId: '',
        appId: '',
        status: '',
        keyword: '',
      },
      taskList: [],
      tasksLoading: false,
      tasksPage: 1,
      tasksPageSize: 20,
      tasksPageInput: '1',
      tasksPagination: {
        currentPage: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 1,
      },
      selectedTaskId: null,
      selectedTaskDetail: {},
      taskDetailLoading: false,
      taskSearchTimer: null,
      appFilters: {
        keyword: '',
        status: '',
      },
      appList: [],
      appSortDraft: {},
      appsLoading: false,
      appsSortSaving: false,
      appsPage: 1,
      appsPageSize: 20,
      appsPageInput: '1',
      appsPagination: {
        currentPage: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 1,
      },
      appFormVisible: false,
      appFormMode: 'create',
      appForm: emptyAppForm(),
      appFormSaving: false,
      appSearchTimer: null,
      documentSections: [],
      documentsLoading: false,
      sectionFormVisible: false,
      sectionFormMode: 'create',
      sectionForm: emptySectionForm(),
      sectionFormSaving: false,
      pageFormVisible: false,
      pageFormMode: 'create',
      pageForm: emptyPageForm(),
      pageFormSaving: false,
      settingsList: [],
      settingsLoading: false,
      settingsGroupFilter: '',
      settingFormVisible: false,
      settingFormMode: 'create',
      settingForm: emptySettingForm(),
      settingFormSaving: false,
      feedbackFilters: {
        status: '',
        type: '',
        keyword: '',
      },
      feedbackList: [],
      feedbacksLoading: false,
      feedbacksPage: 1,
      feedbacksPageSize: 20,
      feedbacksPageInput: '1',
      feedbacksPagination: {
        currentPage: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 1,
      },
      selectedFeedbackId: null,
      selectedFeedbackDetail: {},
      feedbackDetailLoading: false,
      feedbackSearchTimer: null,
    };
  },
  computed: {
    usersTotalPages() {
      return Math.max(1, Number(this.usersPagination.totalPages) || 1);
    },
    filesTotalPages() {
      return Math.max(1, Number(this.filesPagination.totalPages) || 1);
    },
    allFilesSelected() {
      return this.fileList.length > 0
        && this.fileList.every((item) => this.selectedFileIds.includes(item.id));
    },
    someFilesSelected() {
      return !this.allFilesSelected
        && this.fileList.some((item) => this.selectedFileIds.includes(item.id));
    },
    tasksTotalPages() {
      return Math.max(1, Number(this.tasksPagination.totalPages) || 1);
    },
    feedbacksTotalPages() {
      return Math.max(1, Number(this.feedbacksPagination.totalPages) || 1);
    },
    appsTotalPages() {
      return Math.max(1, Number(this.appsPagination.totalPages) || 1);
    },
    filteredSettings() {
      if (!this.settingsGroupFilter) {
        return this.settingsList;
      }
      return this.settingsList.filter((item) => item.group === this.settingsGroupFilter);
    },
    settingsGroupOptions() {
      return Array.from(new Set(this.settingsList.map((item) => item.group || 'default'))).sort();
    },
  },
  watch: {
    'userFilters.keyword'() {
      this.scheduleUserSearch();
    },
    'userFilters.status'() {
      this.usersPage = 1;
      this.fetchUsers();
    },
    'userFilters.role'() {
      this.usersPage = 1;
      this.fetchUsers();
    },
    usersPage(page) {
      this.usersPageInput = String(page);
    },
    'fileFilters.keyword'() {
      this.scheduleFileSearch();
    },
    'fileFilters.userId'() {
      this.scheduleFileSearch();
    },
    'fileFilters.category'() {
      this.filesPage = 1;
      this.resetCleanupState();
      this.fetchAdminFiles();
    },
    'fileFilters.extension'() {
      this.scheduleFileSearch();
    },
    filesPage(page) {
      this.filesPageInput = String(page);
    },
    fileList(list) {
      const visibleIds = new Set(list.map((item) => item.id));
      this.selectedFileIds = this.selectedFileIds.filter((id) => visibleIds.has(id));
    },
    selectedFileIds() {
      this.resetCleanupState();
    },
    'taskFilters.keyword'() {
      this.scheduleTaskSearch();
    },
    'taskFilters.userId'() {
      this.scheduleTaskSearch();
    },
    'taskFilters.appId'() {
      this.scheduleTaskSearch();
    },
    'taskFilters.status'() {
      this.tasksPage = 1;
      this.fetchTasks();
    },
    tasksPage(page) {
      this.tasksPageInput = String(page);
    },
    'appFilters.keyword'() {
      this.scheduleAppSearch();
    },
    'appFilters.status'() {
      this.appsPage = 1;
      this.fetchApps();
    },
    appsPage(page) {
      this.appsPageInput = String(page);
    },
    'feedbackFilters.keyword'() {
      this.scheduleFeedbackSearch();
    },
    'feedbackFilters.status'() {
      this.feedbacksPage = 1;
      this.fetchFeedbacks();
    },
    'feedbackFilters.type'() {
      this.feedbacksPage = 1;
      this.fetchFeedbacks();
    },
    feedbacksPage(page) {
      this.feedbacksPageInput = String(page);
    },
  },
  created() {
    if (!G.U || !G.U.token) {
      this.$router.replace('/signin');
      return;
    }
    this.checkAdminAccess();
  },
  beforeUnmount() {
    if (this.userSearchTimer) clearTimeout(this.userSearchTimer);
    if (this.fileSearchTimer) clearTimeout(this.fileSearchTimer);
    if (this.taskSearchTimer) clearTimeout(this.taskSearchTimer);
    if (this.feedbackSearchTimer) clearTimeout(this.feedbackSearchTimer);
    if (this.appSearchTimer) clearTimeout(this.appSearchTimer);
  },
  methods: {
    handleAuthStatus(status) {
      if (status === 2) {
        this.$router.replace('/signin');
        return true;
      }
      return false;
    },
    async checkAdminAccess() {
      this.checkingAccess = true;
      try {
        const res = await axios.get('admin/summary');
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1 && data.options) {
          this.authorized = true;
          this.adminInfo = data.options.admin || {};
          this.fetchUsers();
          return;
        }
        this.authorized = false;
        this.accessMessage = data.msg || '暂无后台管理权限';
      } catch (e) {
        this.authorized = false;
        this.accessMessage = 'Network error, unable to verify admin access.';
      } finally {
        this.checkingAccess = false;
      }
    },
    setActiveTab(tab) {
      if (this.activeTab === tab) return;
      this.activeTab = tab;
      if (tab === 'users' && this.userList.length === 0) {
        this.fetchUsers();
      }
      if (tab === 'files' && this.fileList.length === 0) {
        this.fetchAdminFiles();
      }
      if (tab === 'tasks' && this.taskList.length === 0) {
        this.fetchTasks();
      }
      if (tab === 'apps' && this.appList.length === 0) {
        this.fetchApps();
      }
      if (tab === 'documents' && this.documentSections.length === 0) {
        this.fetchDocuments();
      }
      if (tab === 'settings' && this.settingsList.length === 0) {
        this.fetchSettings();
      }
      if (tab === 'feedback' && this.feedbackList.length === 0) {
        this.fetchFeedbacks();
      }
    },
    scheduleUserSearch() {
      if (this.userSearchTimer) clearTimeout(this.userSearchTimer);
      this.userSearchTimer = setTimeout(() => {
        this.usersPage = 1;
        this.fetchUsers();
      }, 300);
    },
    scheduleFileSearch() {
      if (this.fileSearchTimer) clearTimeout(this.fileSearchTimer);
      this.fileSearchTimer = setTimeout(() => {
        this.filesPage = 1;
        this.resetCleanupState();
        this.fetchAdminFiles();
      }, 300);
    },
    resetCleanupState() {
      this.cleanupPreview = null;
      this.cleanupCriteria = null;
    },
    buildUserQueryParams() {
      const params = {
        page: this.usersPage,
        pageSize: this.usersPageSize,
      };
      if (this.userFilters.keyword) params.keyword = this.userFilters.keyword;
      if (this.userFilters.status !== '') params.status = this.userFilters.status;
      if (this.userFilters.role !== '') params.role = this.userFilters.role;
      return params;
    },
    async fetchUsers() {
      this.usersLoading = true;
      try {
        const res = await axios.get('admin/users', { params: this.buildUserQueryParams() });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.userList = Array.isArray(data.options?.users) ? data.options.users : [];
          this.usersPagination = {
            ...this.usersPagination,
            ...(data.options?.pagination || {}),
          };
          this.usersPage = Number(this.usersPagination.currentPage) || this.usersPage;
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load users.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.usersLoading = false;
      }
    },
    usersSetPage(page) {
      const nextPage = Math.min(Math.max(1, Number(page) || 1), this.usersTotalPages);
      if (nextPage === this.usersPage) {
        this.fetchUsers();
        return;
      }
      this.usersPage = nextPage;
      this.fetchUsers();
    },
    usersPrevPage() {
      this.usersSetPage(this.usersPage - 1);
    },
    usersNextPage() {
      this.usersSetPage(this.usersPage + 1);
    },
    usersSubmitPageJump() {
      this.usersSetPage(Number.parseInt(this.usersPageInput, 10));
    },
    async loadUserDetail(userId) {
      this.selectedUserId = userId;
      this.detailLoading = true;
      try {
        const res = await axios.get(`admin/users/${userId}`);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.selectedUserDetail = data.options?.user || {};
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load user detail.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.detailLoading = false;
      }
    },
    confirmToggleStatus(user) {
      const nextStatus = user.status === 1 ? 0 : 1;
      const action = nextStatus === 0 ? 'disable' : 'enable';
      Swal.fire({
        title: `${action === 'disable' ? 'Disable' : 'Enable'} user?`,
        text: `${user.name || user.email || `User #${user.id}`} will be ${action}d.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: action === 'disable' ? 'Disable' : 'Enable',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.updateUserStatus(user.id, nextStatus);
      });
    },
    async updateUserStatus(userId, status) {
      this.userActionLoading = true;
      try {
        const res = await axios.put(`admin/users/${userId}/status`, { status });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchUsers();
          if (this.selectedUserId === userId) {
            await this.loadUserDetail(userId);
          }
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to update user status.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.userActionLoading = false;
      }
    },
    openRolePopover(userId) {
      this.rolePopoverUserId = this.rolePopoverUserId === userId ? null : userId;
    },
    onRolePopoverVisibleChange(userId, visible) {
      if (!visible && this.rolePopoverUserId === userId) {
        this.rolePopoverUserId = null;
      }
    },
    async selectUserRole(user, role) {
      this.rolePopoverUserId = null;
      if (user.role === role) return;
      await this.updateUserRole(user.id, role);
    },
    formatRoleLabel(role) {
      return ROLE_LABELS[Number(role)] || `Role ${role}`;
    },
    isDataAdminRole(role) {
      return Number(role) === ROLE_DATA_ADMIN;
    },
    openStorageEditor(user) {
      if (!user?.id) return;
      const currentTotal = user.storage?.total_mb ?? 1024;
      Swal.fire({
        title: '设置存储空间',
        input: 'number',
        inputValue: currentTotal,
        inputAttributes: {
          min: 1,
          step: 1,
        },
        inputLabel: '总空间 (MB)',
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
        preConfirm: (value) => {
          const totalMb = Number.parseInt(value, 10);
          if (!Number.isInteger(totalMb) || totalMb < 1) {
            Swal.showValidationMessage('请输入大于 0 的整数 MB 值');
            return false;
          }
          return totalMb;
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.updateUserStorage(user.id, result.value);
      });
    },
    async updateUserStorage(userId, totalMb) {
      this.userActionLoading = true;
      try {
        const res = await axios.put(`admin/users/${userId}/storage`, { total_mb: totalMb });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchUsers();
          if (this.selectedUserId === userId) {
            await this.loadUserDetail(userId);
          }
          Swal.fire({ icon: 'success', text: '存储空间已更新。', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to update storage quota.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.userActionLoading = false;
      }
    },
    viewUserTasks(user) {
      if (!user?.id) return;
      this.taskFilters.userId = String(user.id);
      this.tasksPage = 1;
      this.selectedTaskId = null;
      this.activeTab = 'tasks';
      this.fetchTasks();
    },
    viewUserFiles(user) {
      if (!user?.id) return;
      this.fileFilters.userId = String(user.id);
      this.filesPage = 1;
      this.resetCleanupState();
      this.activeTab = 'files';
      this.fetchAdminFiles();
    },
    async updateUserRole(userId, role) {
      this.userActionLoading = true;
      try {
        const res = await axios.put(`admin/users/${userId}/role`, { role });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchUsers();
          if (this.selectedUserId === userId) {
            await this.loadUserDetail(userId);
          }
          Swal.fire({ icon: 'success', text: '角色已更新。', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to update user role.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.userActionLoading = false;
      }
    },
    buildFileQueryParams() {
      const params = {
        page: this.filesPage,
        pageSize: this.filesPageSize,
      };
      if (this.fileFilters.userId) params.userId = this.fileFilters.userId;
      if (this.fileFilters.keyword) params.keyword = this.fileFilters.keyword;
      if (this.fileFilters.category) params.category = this.fileFilters.category;
      if (this.fileFilters.extension) params.extension = this.fileFilters.extension;
      return params;
    },
    buildCleanupCriteria() {
      if (this.selectedFileIds.length > 0) {
        return { fileIds: [...this.selectedFileIds] };
      }
      const criteria = {};
      if (this.fileFilters.userId) criteria.userId = this.fileFilters.userId;
      if (this.fileFilters.keyword) criteria.keyword = this.fileFilters.keyword;
      if (this.fileFilters.category) criteria.category = this.fileFilters.category;
      if (this.fileFilters.extension) criteria.extension = this.fileFilters.extension;
      return criteria;
    },
    async fetchAdminFiles() {
      this.filesLoading = true;
      try {
        const res = await axios.get('admin/files', { params: this.buildFileQueryParams() });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.fileList = Array.isArray(data.options?.files) ? data.options.files : [];
          this.filesPagination = {
            ...this.filesPagination,
            ...(data.options?.pagination || {}),
          };
          this.filesPage = Number(this.filesPagination.currentPage) || this.filesPage;
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load files.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.filesLoading = false;
      }
    },
    filesSetPage(page) {
      const nextPage = Math.min(Math.max(1, Number(page) || 1), this.filesTotalPages);
      if (nextPage === this.filesPage) {
        this.fetchAdminFiles();
        return;
      }
      this.filesPage = nextPage;
      this.resetCleanupState();
      this.fetchAdminFiles();
    },
    filesPrevPage() {
      this.filesSetPage(this.filesPage - 1);
    },
    filesNextPage() {
      this.filesSetPage(this.filesPage + 1);
    },
    filesSubmitPageJump() {
      this.filesSetPage(Number.parseInt(this.filesPageInput, 10));
    },
    toggleSelectFile(id) {
      if (this.selectedFileIds.includes(id)) {
        this.selectedFileIds = this.selectedFileIds.filter((item) => item !== id);
        return;
      }
      this.selectedFileIds = [...this.selectedFileIds, id];
    },
    toggleSelectAllFiles() {
      if (this.allFilesSelected) {
        const visibleIds = new Set(this.fileList.map((item) => item.id));
        this.selectedFileIds = this.selectedFileIds.filter((id) => !visibleIds.has(id));
        return;
      }
      this.selectedFileIds = Array.from(new Set([
        ...this.selectedFileIds,
        ...this.fileList.map((item) => item.id),
      ]));
    },
    async previewCleanup() {
      const criteria = this.buildCleanupCriteria();
      if (!criteria.fileIds?.length && !criteria.userId) {
        Swal.fire({
          icon: 'info',
          text: 'Select files or provide a User ID (with optional filters) before preview.',
        });
        return;
      }

      this.cleanupLoading = true;
      try {
        const res = await axios.post('admin/files/cleanup/preview', criteria);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.cleanupCriteria = criteria;
          this.cleanupPreview = {
            count: data.options?.count || 0,
            totalSizeBytes: data.options?.totalSizeBytes || 0,
            totalSizeMb: data.options?.totalSizeMb || 0,
            sampleFiles: data.options?.sampleFiles || [],
          };
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Cleanup preview failed.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.cleanupLoading = false;
      }
    },
    confirmExecuteCleanup() {
      if (!this.cleanupPreview || !this.cleanupCriteria) {
        Swal.fire({ icon: 'info', text: 'Please preview cleanup before executing.' });
        return;
      }

      Swal.fire({
        title: 'Execute file cleanup?',
        html: `This will permanently delete <strong>${this.cleanupPreview.count}</strong> file(s) `
          + `(${this.formatSizeMb(this.cleanupPreview.totalSizeMb)}). This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete Files',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.executeCleanup();
      });
    },
    async executeCleanup() {
      if (!this.cleanupCriteria) return;
      this.cleanupLoading = true;
      try {
        const res = await axios.post('admin/files/cleanup', {
          ...this.cleanupCriteria,
          confirm: true,
        });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.cleanupResult = data.options || {};
          this.resetCleanupState();
          this.selectedFileIds = [];
          await this.fetchAdminFiles();
          Swal.fire({
            icon: 'success',
            text: `Cleanup completed. Deleted ${data.options?.count || 0} file(s).`,
            timer: 2200,
            showConfirmButton: false,
          });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'File cleanup failed.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.cleanupLoading = false;
      }
    },
    scheduleTaskSearch() {
      if (this.taskSearchTimer) clearTimeout(this.taskSearchTimer);
      this.taskSearchTimer = setTimeout(() => {
        this.tasksPage = 1;
        this.fetchTasks();
      }, 300);
    },
    scheduleAppSearch() {
      if (this.appSearchTimer) clearTimeout(this.appSearchTimer);
      this.appSearchTimer = setTimeout(() => {
        this.appsPage = 1;
        this.fetchApps();
      }, 300);
    },
    buildTaskQueryParams() {
      const params = {
        page: this.tasksPage,
        pageSize: this.tasksPageSize,
      };
      if (this.taskFilters.userId) params.userId = this.taskFilters.userId;
      if (this.taskFilters.appId) params.appId = this.taskFilters.appId;
      if (this.taskFilters.status) params.status = this.taskFilters.status;
      if (this.taskFilters.keyword) params.keyword = this.taskFilters.keyword;
      return params;
    },
    async fetchTasks() {
      this.tasksLoading = true;
      try {
        const res = await axios.get('admin/tasks', { params: this.buildTaskQueryParams() });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.taskList = Array.isArray(data.options?.tasks) ? data.options.tasks : [];
          this.tasksPagination = {
            ...this.tasksPagination,
            ...(data.options?.pagination || {}),
          };
          this.tasksPage = Number(this.tasksPagination.currentPage) || this.tasksPage;
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load tasks.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.tasksLoading = false;
      }
    },
    tasksSetPage(page) {
      const nextPage = Math.min(Math.max(1, Number(page) || 1), this.tasksTotalPages);
      if (nextPage === this.tasksPage) {
        this.fetchTasks();
        return;
      }
      this.tasksPage = nextPage;
      this.fetchTasks();
    },
    tasksPrevPage() {
      this.tasksSetPage(this.tasksPage - 1);
    },
    tasksNextPage() {
      this.tasksSetPage(this.tasksPage + 1);
    },
    tasksSubmitPageJump() {
      this.tasksSetPage(Number.parseInt(this.tasksPageInput, 10));
    },
    async loadTaskDetail(taskId) {
      this.selectedTaskId = taskId;
      this.taskDetailLoading = true;
      try {
        const res = await axios.get(`admin/tasks/${taskId}`);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.selectedTaskDetail = data.options?.task || {};
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load task detail.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.taskDetailLoading = false;
      }
    },
    confirmCorrectTaskStatus(task) {
      Swal.fire({
        title: 'Correct task status?',
        html: `<p>Task #${task.id}: ${task.name || '-'}</p>`,
        input: 'select',
        inputOptions: {
          pending: 'Pending',
          running: 'Running',
          completed: 'Completed',
          failed: 'Failed',
        },
        inputValue: task.status,
        showCancelButton: true,
        confirmButtonText: 'Update',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.updateTaskStatus(task.id, result.value);
      });
    },
    async updateTaskStatus(taskId, status) {
      try {
        const res = await axios.put(`admin/tasks/${taskId}/status`, { status });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchTasks();
          if (this.selectedTaskId === taskId) {
            await this.loadTaskDetail(taskId);
          }
          Swal.fire({ icon: 'success', text: 'Task status updated.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to update task status.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      }
    },
    confirmDeleteTask(task) {
      Swal.fire({
        title: 'Delete task?',
        html: `Task <strong>#${task.id}</strong> (${task.name || '-'}) will be permanently deleted.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.deleteTask(task.id);
      });
    },
    async deleteTask(taskId) {
      try {
        const res = await axios.delete(`admin/tasks/${taskId}`);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          if (this.selectedTaskId === taskId) {
            this.selectedTaskId = null;
            this.selectedTaskDetail = {};
          }
          await this.fetchTasks();
          Swal.fire({ icon: 'success', text: 'Task deleted.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to delete task.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      }
    },
    buildAppQueryParams() {
      const params = {
        page: this.appsPage,
        pageSize: this.appsPageSize,
      };
      if (this.appFilters.keyword) params.keyword = this.appFilters.keyword;
      if (this.appFilters.status !== '') params.status = this.appFilters.status;
      return params;
    },
    syncAppSortDraft() {
      const draft = {};
      this.appList.forEach((app) => {
        draft[app.id] = app.sort_order ?? 0;
      });
      this.appSortDraft = draft;
    },
    async fetchApps() {
      this.appsLoading = true;
      try {
        const res = await axios.get('admin/apps', { params: this.buildAppQueryParams() });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.appList = Array.isArray(data.options?.apps) ? data.options.apps : [];
          this.syncAppSortDraft();
          this.appsPagination = {
            ...this.appsPagination,
            ...(data.options?.pagination || {}),
          };
          this.appsPage = Number(this.appsPagination.currentPage) || this.appsPage;
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load apps.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.appsLoading = false;
      }
    },
    appsSetPage(page) {
      const nextPage = Math.min(Math.max(1, Number(page) || 1), this.appsTotalPages);
      if (nextPage === this.appsPage) {
        this.fetchApps();
        return;
      }
      this.appsPage = nextPage;
      this.fetchApps();
    },
    appsPrevPage() {
      this.appsSetPage(this.appsPage - 1);
    },
    appsNextPage() {
      this.appsSetPage(this.appsPage + 1);
    },
    appsSubmitPageJump() {
      this.appsSetPage(Number.parseInt(this.appsPageInput, 10));
    },
    openAppForm(app = null) {
      if (app) {
        this.appFormMode = 'edit';
        this.appForm = {
          id: app.id,
          title: app.title || '',
          description: app.description || '',
          icon: app.icon || '',
          route: app.route || '',
          author: app.author || '',
          app_color: app.app_color || '',
          sort_order: app.sort_order ?? 0,
          status: app.status ?? 1,
        };
      } else {
        this.appFormMode = 'create';
        this.appForm = emptyAppForm();
      }
      this.appFormVisible = true;
    },
    closeAppForm() {
      this.appFormVisible = false;
      this.appForm = emptyAppForm();
    },
    async saveAppForm() {
      const payload = {
        title: this.appForm.title,
        description: this.appForm.description,
        icon: this.appForm.icon,
        route: this.appForm.route,
        author: this.appForm.author,
        app_color: this.appForm.app_color,
        sort_order: this.appForm.sort_order,
        status: this.appForm.status,
      };
      this.appFormSaving = true;
      try {
        const res = this.appFormMode === 'create'
          ? await axios.post('admin/apps', { id: this.appForm.id, ...payload })
          : await axios.put(`admin/apps/${this.appForm.id}`, payload);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.closeAppForm();
          await this.fetchApps();
          Swal.fire({ icon: 'success', text: 'App saved.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to save app.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.appFormSaving = false;
      }
    },
    confirmToggleAppStatus(app) {
      const nextStatus = app.status === 1 ? 0 : 1;
      const action = nextStatus === 0 ? 'hide' : 'show';
      Swal.fire({
        title: `${action === 'hide' ? 'Hide' : 'Show'} app?`,
        text: `${app.title || app.id} will be ${action === 'hide' ? 'hidden' : 'visible'}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: action === 'hide' ? 'Hide' : 'Show',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.updateAppStatus(app.id, nextStatus);
      });
    },
    async updateAppStatus(appId, status) {
      try {
        const res = await axios.put(`admin/apps/${appId}/status`, { status });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchApps();
          Swal.fire({ icon: 'success', text: 'App status updated.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to update app status.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      }
    },
    confirmSaveAppSort() {
      Swal.fire({
        title: 'Save sort order?',
        text: 'This will update sort order for apps on the current page.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.saveAppSort();
      });
    },
    async saveAppSort() {
      const items = this.appList.map((app) => ({
        id: app.id,
        sort_order: Number(this.appSortDraft[app.id]),
      }));
      if (items.some((item) => !Number.isInteger(item.sort_order))) {
        Swal.fire({ icon: 'error', text: 'Sort order must be an integer.' });
        return;
      }
      this.appsSortSaving = true;
      try {
        const res = await axios.put('admin/apps/sort', { items });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchApps();
          Swal.fire({ icon: 'success', text: 'Sort order saved.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to save sort order.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.appsSortSaving = false;
      }
    },
    async fetchDocuments() {
      this.documentsLoading = true;
      try {
        const res = await axios.get('admin/documents');
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.documentSections = Array.isArray(data.options?.sections) ? data.options.sections : [];
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load documents.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.documentsLoading = false;
      }
    },
    openSectionForm(section = null) {
      if (section) {
        this.sectionFormMode = 'edit';
        this.sectionForm = {
          id: section.id,
          title: section.title || '',
          sort_order: section.sort_order ?? 0,
          expanded_default: !!section.expanded_default,
        };
      } else {
        this.sectionFormMode = 'create';
        this.sectionForm = emptySectionForm();
      }
      this.sectionFormVisible = true;
    },
    closeSectionForm() {
      this.sectionFormVisible = false;
      this.sectionForm = emptySectionForm();
    },
    async saveSectionForm() {
      const payload = {
        title: this.sectionForm.title,
        sort_order: this.sectionForm.sort_order,
        expanded_default: this.sectionForm.expanded_default,
      };
      this.sectionFormSaving = true;
      try {
        const res = this.sectionFormMode === 'create'
          ? await axios.post('admin/documents/sections', { id: this.sectionForm.id, ...payload })
          : await axios.put(`admin/documents/sections/${this.sectionForm.id}`, payload);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.closeSectionForm();
          await this.fetchDocuments();
          Swal.fire({ icon: 'success', text: 'Section saved.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to save section.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.sectionFormSaving = false;
      }
    },
    confirmDeleteSection(section) {
      Swal.fire({
        title: 'Delete section?',
        html: `Section <strong>${section.title}</strong> (${section.id}) will be deleted.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.deleteSection(section.id);
      });
    },
    async deleteSection(sectionId) {
      try {
        const res = await axios.delete(`admin/documents/sections/${sectionId}`);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchDocuments();
          Swal.fire({ icon: 'success', text: 'Section deleted.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to delete section.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      }
    },
    openPageForm(section, page = null) {
      if (page) {
        this.pageFormMode = 'edit';
        this.pageForm = {
          id: page.id,
          section_id: page.section_id || section?.id || '',
          title: page.title || '',
          intro: page.intro || '',
          hero_image: page.hero_image || '',
          content_html: page.content_html || '',
          sort_order: page.sort_order ?? 0,
        };
      } else {
        this.pageFormMode = 'create';
        this.pageForm = {
          ...emptyPageForm(),
          section_id: section?.id || '',
        };
      }
      this.pageFormVisible = true;
    },
    closePageForm() {
      this.pageFormVisible = false;
      this.pageForm = emptyPageForm();
    },
    async savePageForm() {
      const payload = {
        section_id: this.pageForm.section_id,
        title: this.pageForm.title,
        intro: this.pageForm.intro,
        hero_image: this.pageForm.hero_image,
        content_html: this.pageForm.content_html,
        sort_order: this.pageForm.sort_order,
      };
      this.pageFormSaving = true;
      try {
        const res = this.pageFormMode === 'create'
          ? await axios.post('admin/documents/pages', { id: this.pageForm.id, ...payload })
          : await axios.put(`admin/documents/pages/${this.pageForm.id}`, payload);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.closePageForm();
          await this.fetchDocuments();
          Swal.fire({ icon: 'success', text: 'Page saved.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to save page.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.pageFormSaving = false;
      }
    },
    confirmDeletePage(page) {
      Swal.fire({
        title: 'Delete page?',
        html: `Page <strong>${page.title}</strong> (${page.id}) will be deleted.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.deletePage(page.id);
      });
    },
    async deletePage(pageId) {
      try {
        const res = await axios.delete(`admin/documents/pages/${pageId}`);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchDocuments();
          Swal.fire({ icon: 'success', text: 'Page deleted.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to delete page.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      }
    },
    async fetchSettings() {
      this.settingsLoading = true;
      try {
        const res = await axios.get('admin/settings');
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.settingsList = Array.isArray(data.options?.settings) ? data.options.settings : [];
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load settings.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.settingsLoading = false;
      }
    },
    openSettingForm(setting = null) {
      if (setting) {
        this.settingFormMode = 'edit';
        this.settingForm = {
          key: setting.key,
          value: setting.value ?? '',
          type: setting.type || 'string',
          group: setting.group || 'default',
          description: setting.description || '',
        };
      } else {
        this.settingFormMode = 'create';
        this.settingForm = emptySettingForm();
      }
      this.settingFormVisible = true;
    },
    closeSettingForm() {
      this.settingFormVisible = false;
      this.settingForm = emptySettingForm();
    },
    async saveSettingForm() {
      const key = (this.settingForm.key || '').trim();
      if (!key) {
        Swal.fire({ icon: 'error', text: 'Setting key is required.' });
        return;
      }
      const payload = {
        value: this.settingForm.value,
        type: this.settingForm.type || 'string',
        group: this.settingForm.group || 'default',
        description: this.settingForm.description || '',
      };
      this.settingFormSaving = true;
      try {
        const res = await axios.put(`admin/settings/${encodeURIComponent(key)}`, payload);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.closeSettingForm();
          await this.fetchSettings();
          Swal.fire({ icon: 'success', text: 'Setting saved.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to save setting.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.settingFormSaving = false;
      }
    },
    confirmDeleteSetting(setting) {
      Swal.fire({
        title: 'Delete setting?',
        html: `Setting <strong>${setting.key}</strong> will be permanently deleted.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.deleteSetting(setting.key);
      });
    },
    async deleteSetting(key) {
      try {
        const res = await axios.delete(`admin/settings/${encodeURIComponent(key)}`);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchSettings();
          Swal.fire({ icon: 'success', text: 'Setting deleted.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to delete setting.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      }
    },
    taskStatusBadgeClass(status) {
      if (status === 'completed') return 'admin-badge--active';
      if (status === 'failed') return 'admin-badge--disabled';
      if (status === 'running') return 'admin-badge--running';
      return 'admin-badge--pending';
    },
    feedbackStatusBadgeClass(status) {
      if (status === 'completed') return 'admin-badge--active';
      return 'admin-badge--pending';
    },
    truncateText(value, maxLength = 80) {
      const text = String(value || '');
      if (text.length <= maxLength) {
        return text;
      }
      return `${text.slice(0, maxLength)}...`;
    },
    scheduleFeedbackSearch() {
      if (this.feedbackSearchTimer) clearTimeout(this.feedbackSearchTimer);
      this.feedbackSearchTimer = setTimeout(() => {
        this.feedbacksPage = 1;
        this.fetchFeedbacks();
      }, 300);
    },
    buildFeedbackQueryParams() {
      const params = {
        page: this.feedbacksPage,
        pageSize: this.feedbacksPageSize,
      };
      if (this.feedbackFilters.status) params.status = this.feedbackFilters.status;
      if (this.feedbackFilters.type) params.type = this.feedbackFilters.type;
      if (this.feedbackFilters.keyword) params.keyword = this.feedbackFilters.keyword;
      return params;
    },
    async fetchFeedbacks() {
      this.feedbacksLoading = true;
      try {
        const res = await axios.get('admin/feedback', { params: this.buildFeedbackQueryParams() });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.feedbackList = Array.isArray(data.options?.feedbacks) ? data.options.feedbacks : [];
          this.feedbacksPagination = {
            ...this.feedbacksPagination,
            ...(data.options?.pagination || {}),
          };
          this.feedbacksPage = Number(this.feedbacksPagination.currentPage) || this.feedbacksPage;
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load feedback.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.feedbacksLoading = false;
      }
    },
    feedbacksSetPage(page) {
      const nextPage = Math.min(Math.max(1, Number(page) || 1), this.feedbacksTotalPages);
      if (nextPage === this.feedbacksPage) {
        this.fetchFeedbacks();
        return;
      }
      this.feedbacksPage = nextPage;
      this.fetchFeedbacks();
    },
    feedbacksPrevPage() {
      this.feedbacksSetPage(this.feedbacksPage - 1);
    },
    feedbacksNextPage() {
      this.feedbacksSetPage(this.feedbacksPage + 1);
    },
    feedbacksSubmitPageJump() {
      this.feedbacksSetPage(Number.parseInt(this.feedbacksPageInput, 10));
    },
    async loadFeedbackDetail(feedbackId) {
      this.selectedFeedbackId = feedbackId;
      this.feedbackDetailLoading = true;
      try {
        const res = await axios.get(`admin/feedback/${feedbackId}`);
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          this.selectedFeedbackDetail = data.options?.feedback || {};
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to load feedback detail.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      } finally {
        this.feedbackDetailLoading = false;
      }
    },
    confirmCompleteFeedback(feedback) {
      if (!feedback || feedback.status === 'completed') {
        return;
      }
      Swal.fire({
        title: 'Mark feedback as completed?',
        html: `<p>Feedback #${feedback.id}</p>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Mark Completed',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn-confirm',
          cancelButton: 'btn-cancel',
        },
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        await this.updateFeedbackStatus(feedback.id, 'completed');
      });
    },
    async updateFeedbackStatus(feedbackId, status) {
      try {
        const res = await axios.put(`admin/feedback/${feedbackId}/status`, { status });
        const data = res.data || {};
        if (this.handleAuthStatus(data.status)) return;
        if (data.status === 1) {
          await this.fetchFeedbacks();
          if (this.selectedFeedbackId === feedbackId) {
            await this.loadFeedbackDetail(feedbackId);
          }
          Swal.fire({ icon: 'success', text: 'Feedback marked as completed.', timer: 1600, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', text: data.msg || 'Failed to update feedback status.' });
      } catch (e) {
        Swal.fire({ icon: 'error', text: 'Network error, please try again.' });
      }
    },
    formatJsonPreview(field) {
      if (!field) return '-';
      if (field.parseError) {
        return field.value || 'Invalid JSON';
      }
      try {
        return JSON.stringify(field.value, null, 2);
      } catch {
        return String(field.value ?? '-');
      }
    },
    formatStorage(storage) {
      const used = storage?.used_mb ?? 0;
      const total = storage?.total_mb ?? 0;
      return `${used} / ${total}`;
    },
    formatSizeBytes(bytes) {
      const value = Number(bytes) || 0;
      if (value >= 1024 * 1024) {
        return `${(value / 1024 / 1024).toFixed(2)} MB`;
      }
      if (value >= 1024) {
        return `${(value / 1024).toFixed(1)} KB`;
      }
      return `${value} B`;
    },
    formatSizeMb(mb) {
      const value = Number(mb) || 0;
      return `${value.toFixed(2)} MB`;
    },
    formatDate(value) {
      if (!value) return '-';
      return new Date(value).toLocaleString();
    },
  },
};
</script>

<style scoped>
.admin-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.admin-page__subtitle {
  margin-top: 6px;
  color: rgba(3, 2, 41, 0.5);
  font-size: 14px;
}

.admin-tabs {
  display: inline-flex;
  align-items: stretch;
  border-radius: 5px;
  overflow: hidden;
  flex-wrap: wrap;
}

.admin-page__state {
  margin-top: 24px;
  padding: 32px;
  border-radius: 12px;
  background: #fff;
  color: rgba(3, 2, 41, 0.6);
  text-align: center;
}

.admin-page__state--denied {
  color: #c0392b;
}

.admin-page__state-title {
  font-size: 20px;
  font-weight: 700;
}

.admin-page__state-text {
  margin-top: 8px;
}

.admin-page__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-top: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  padding-bottom: 30px;
}

.admin-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.admin-toolbar__search {
  width: 260px;
}

.admin-toolbar__select,
.admin-toolbar__input {
  height: 40px;
  min-width: 140px;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  background: #fff;
  color: var(--text);
}

.admin-table-wrap {
  flex: 1 1 auto;
  min-height: 260px;
  min-width: 0;
  overflow-x: auto;
}

.admin-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 10px;
  min-width: 1100px;
}

.admin-table__body {
  flex: 1;
  min-height: 0;
}

.admin-doc-panel {
  flex: 1 1 auto;
  min-height: 260px;
}

.admin-doc-scroll {
  padding-right: 10px;
}

.admin-row {
  display: grid;
  grid-template-columns: 60px 120px 1.2fr 90px 70px 130px 70px 70px 220px;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 0 20px;
  border-radius: 10px;
  background: #fff;
}

.admin-row--files {
  grid-template-columns: 36px 60px minmax(220px, 1.5fr) 140px 110px 100px 160px;
}

.admin-row--header {
  min-height: auto;
  padding: 0 20px 8px;
  padding-right:35px;
  background: transparent;
}


.admin-row--header .admin-row__cell {
  color: rgba(3, 2, 41, 0.6);
  font-size: 12px;
  font-weight: 500;
}

.admin-row--selected {
  box-shadow: inset 0 0 0 2px rgba(96, 91, 255, 0.35);
}

.admin-row__cell {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.admin-row__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-row__meta {
  margin-top: 4px;
  color: rgba(3, 2, 41, 0.45);
  font-size: 12px;
  font-weight: 500;
}

.admin-row__cell--actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.admin-action-btn {
  border: 1px solid rgba(96, 91, 255, 0.35);
  border-radius: 4px;
  padding: 3px 8px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 500;
}

.admin-action-btn:hover {
  background: rgba(96, 91, 255, 0.08);
}

.admin-link-btn,
.admin-stat-link {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--primary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.admin-link-btn:hover,
.admin-stat-link:hover {
  text-decoration: underline;
}

.admin-stat-link {
  text-align: inherit;
}

.admin-role-menu {
  min-width: 140px;
  padding: 4px 0;
}

.admin-role-menu__item {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 10px 16px;
  text-align: left;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
}

.admin-role-menu__item:hover,
.admin-role-menu__item--active {
  background: rgba(96, 91, 255, 0.08);
  color: var(--primary);
}

.admin-detail-note {
  grid-column: 1 / -1;
  color: rgba(3, 2, 41, 0.55);
  font-size: 13px;
  font-weight: 500;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
}

.admin-badge--active {
  background: rgba(46, 204, 113, 0.12);
  color: #1e8e4c;
}

.admin-badge--disabled {
  background: rgba(255, 91, 91, 0.12);
  color: #c0392b;
}

.admin-empty {
  padding: 40px 0;
  text-align: center;
  color: rgba(3, 2, 41, 0.5);
}

.admin-detail-panel {
  flex-shrink: 0;
  margin-top: 20px;
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  max-height: min(50vh, 520px);
  overflow-y: auto;
}

.admin-detail-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.admin-detail-panel__title {
  font-size: 16px;
  font-weight: 700;
}

.admin-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 20px;
  margin-bottom: 20px;
  font-size: 14px;
}

.admin-cleanup-preview,
.admin-cleanup-result {
  flex-shrink: 0;
  margin-bottom: 16px;
  padding: 16px 18px;
  border-radius: 12px;
  background: #fff;
  font-size: 14px;
}

.admin-cleanup-preview__title,
.admin-cleanup-result__title {
  font-weight: 700;
  margin-bottom: 8px;
}

.admin-cleanup-preview__stats,
.admin-cleanup-result__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.admin-cleanup-preview__samples {
  margin-top: 8px;
  color: rgba(3, 2, 41, 0.55);
  font-size: 13px;
}

.admin-row__cell--check {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.admin-checkbox__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.admin-checkbox {
  width: 20px;
  height: 20px;
  border: 1px solid #b3b3bf;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.admin-checkbox--checked {
  border-color: var(--primary);
}

.admin-checkbox--indeterminate {
  border-color: var(--primary);
  background: rgba(96, 91, 255, 0.15);
}

.admin-placeholder {
  padding: 48px 24px;
  border-radius: 12px;
  background: #fff;
  text-align: center;
}

.admin-placeholder__title {
  font-size: 18px;
  font-weight: 700;
}

.admin-placeholder__text {
  margin-top: 8px;
  color: rgba(3, 2, 41, 0.55);
}

.admin-row--tasks {
  grid-template-columns: 60px minmax(140px, 1fr) 130px 120px 100px 160px 70px 220px;
}

.admin-row--feedback {
  grid-template-columns: 60px 100px minmax(160px, 1.2fr) 130px minmax(140px, 1fr) 100px 160px 220px;
}

.admin-row--apps {
  grid-template-columns: 100px minmax(120px, 1fr) 120px 90px 80px 70px 80px 180px;
}

.admin-row--settings {
  grid-template-columns: minmax(160px, 1.2fr) minmax(160px, 1.5fr) 90px 110px 160px 160px;
}

.admin-table--tasks,
.admin-table--apps,
.admin-table--settings,
.admin-table--feedback {
  min-width: 980px;
}

.admin-row__link {
  color: var(--primary);
  text-decoration: none;
  word-break: break-all;
}

.admin-row__link:hover {
  text-decoration: underline;
}

.admin-detail-grid__full {
  grid-column: 1 / -1;
  word-break: break-all;
}

.admin-feedback-images {
  margin-top: 16px;
}

.admin-feedback-images__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.admin-feedback-images__item {
  display: block;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(3, 2, 41, 0.08);
}

.admin-feedback-images__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-badge--running {
  background: rgba(52, 152, 219, 0.12);
  color: #2471a3;
}

.admin-badge--pending {
  background: rgba(241, 196, 15, 0.15);
  color: #9a7d0a;
}

.admin-inline-input {
  width: 64px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid rgba(3, 2, 41, 0.12);
  border-radius: 6px;
  font-size: 13px;
}

.admin-json-block {
  margin-top: 16px;
}

.admin-json-block__title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
}

.admin-json-block__content {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(3, 2, 41, 0.04);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 280px;
  overflow: auto;
}

.admin-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px 16px;
}

.admin-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.admin-form-field--full {
  grid-column: 1 / -1;
}

.admin-form-field--checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.admin-form-input,
.admin-form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(3, 2, 41, 0.12);
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
}

.admin-form-textarea--json {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.admin-form-hint {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
}

.admin-form-hint--warn {
  color: #b9770e;
}

.admin-form-actions {
  margin-top: 16px;
}

.admin-doc-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-doc-section {
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

.admin-doc-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(3, 2, 41, 0.06);
}

.admin-doc-section__title {
  font-size: 15px;
  font-weight: 700;
}

.admin-doc-pages {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 18px 16px 28px;
}

.admin-doc-pages--empty {
  color: rgba(3, 2, 41, 0.45);
  font-size: 13px;
}

.admin-doc-page {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(3, 2, 41, 0.03);
}

.admin-doc-page__title {
  font-size: 14px;
  font-weight: 600;
}
</style>
