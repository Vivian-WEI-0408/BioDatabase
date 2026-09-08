const POLL_INTERVAL_MS = 10000;
const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);

export async function fetchTaskDetail(taskId) {
  const res = await axios.post('tasks/detail', { id: taskId });
  const data = res.data || {};

  if (data.status === 2) {
    window.vrouter.replace('/signin');
    return null;
  }

  if (data.status !== 1 || !data.options?.task) {
    throw new Error('Failed to load task detail');
  }

  return data.options.task;
}

export async function submitTproTask({ operation, name, params, displayMeta }) {
  const res = await axios.post('tasks/create', {
    appId: 't-pro',
    operation,
    name,
    params,
    displayMeta,
  });
  const data = res.data || {};

  if (data.status === 2) {
    window.vrouter.replace('/signin');
    return null;
  }

  if (data.status !== 1 || !data.options?.task) {
    throw new Error(data.msg || 'Failed to create task');
  }

  return data.options.task;
}

export async function cancelTproTask(taskId) {
  const res = await axios.post('tasks/cancel', { id: taskId });
  const data = res.data || {};

  if (data.status === 2) {
    window.vrouter.replace('/signin');
    return null;
  }

  if (data.status !== 1 || !data.options?.task) {
    throw new Error(data.msg || 'Failed to cancel task');
  }

  return data.options.task;
}

export function buildTaskName(prefix) {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${prefix} - ${day} ${month} ${year}`;
}

export function pollTaskUntilDone(taskId, { interval = POLL_INTERVAL_MS, onStatus } = {}) {
  let timer = null;
  let stopped = false;

  const stop = () => {
    stopped = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const check = async () => {
    if (stopped) {
      return null;
    }

    try {
      const task = await fetchTaskDetail(taskId);

      if (!task) {
        stop();
        return null;
      }

      if (typeof onStatus === 'function') {
        onStatus(task);
      }

      if (TERMINAL_STATUSES.has(task.status)) {
        stop();
        return task;
      }
    } catch (err) {
      console.error(err);
    }

    return null;
  };

  const promise = new Promise((resolve) => {
    const run = async () => {
      const finished = await check();
      if (finished) {
        resolve(finished);
      }
    };

    run();
    timer = setInterval(run, interval);
  });

  return {
    promise,
    stop,
  };
}

export function showTaskQueuedDialog(taskId, { onCompleted } = {}) {
  let pollHandle = null;
  let cancelling = false;

  return Swal.fire({
    title: 'Task queued',
    html: `
      <p>Your task has entered the processing queue.</p>
      <p>You can visit the task list later to view the result. Please also check in-app notifications.</p>
      <p class="task-queue-status" style="margin-top:12px;color:#605bff;">Status: pending</p>
    `,
    icon: 'info',
    showConfirmButton: true,
    confirmButtonText: 'Go to Tasks',
    showDenyButton: true,
    denyButtonText: 'Cancel Task',
    showCancelButton: true,
    cancelButtonText: 'Close',
    allowOutsideClick: true,
    customClass: {
      confirmButton: 'btn btn-primary',
      denyButton: 'btn btn-outline mr10',
      cancelButton: 'btn btn-outline mr10',
    },
    buttonsStyling: false,
    didOpen: () => {
      const statusEl = Swal.getHtmlContainer()?.querySelector('.task-queue-status');

      pollHandle = pollTaskUntilDone(taskId, {
        interval: POLL_INTERVAL_MS,
        onStatus: (task) => {
          if (statusEl) {
            statusEl.textContent = `Status: ${task.status}`;
          }

          if (TERMINAL_STATUSES.has(task.status)) {
            const denyBtn = Swal.getDenyButton();
            if (denyBtn) {
              denyBtn.disabled = true;
            }
          }
        },
      });

      pollHandle.promise.then((task) => {
        if (!task || cancelling) {
          return;
        }

        if (typeof onCompleted === 'function') {
          onCompleted(task);
        }

        Swal.close();

        if (task.status === 'completed') {
          window.vrouter.push(`/tasks/${task.id}`);
          return;
        }

        if (task.status === 'cancelled') {
          Swal.fire({
            title: 'Task cancelled',
            text: task.errorMsg || 'The task was cancelled.',
            icon: 'info',
            confirmButtonText: 'OK',
            customClass: {
              confirmButton: 'btn btn-primary',
            },
            buttonsStyling: false,
          });
          return;
        }

        Swal.fire({
          title: 'Task failed',
          text: task.errorMsg || 'The task failed to complete.',
          icon: 'error',
          confirmButtonText: 'View details',
          customClass: {
            confirmButton: 'btn btn-primary',
          },
          buttonsStyling: false,
        }).then((result) => {
          if (result.isConfirmed) {
            window.vrouter.push(`/tasks/${task.id}`);
          }
        });
      });
    },
    preDeny: async () => {
      cancelling = true;
      try {
        await cancelTproTask(taskId);
        return true;
      } catch (err) {
        cancelling = false;
        Swal.showValidationMessage(err.message || 'Failed to cancel task');
        return false;
      }
    },
    willClose: () => {
      if (pollHandle) {
        pollHandle.stop();
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      window.vrouter.push('/tasks');
    }
  });
}
