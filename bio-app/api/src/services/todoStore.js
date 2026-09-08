const { prisma } = require('./db');

function mapTodo(todo) {
  const item = {
    id: todo.id,
    text: todo.text,
    done: todo.done,
  };

  if (todo.highlight) {
    item.highlight = todo.highlight;
  }

  return item;
}

async function toggleTodo(userId, id) {
  const todoId = Number(id);

  if (!Number.isInteger(todoId) || todoId <= 0) {
    return null;
  }

  const existing = await prisma.todo.findFirst({
    where: {
      id: todoId,
      user_id: userId,
    },
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.todo.update({
    where: { id: todoId },
    data: { done: !existing.done },
  });

  return mapTodo(updated);
}

async function updateTodo(userId, { id, done } = {}) {
  const todoId = Number(id);

  if (!Number.isInteger(todoId) || todoId <= 0) {
    return null;
  }

  const existing = await prisma.todo.findFirst({
    where: {
      id: todoId,
      user_id: userId,
    },
  });

  if (!existing) {
    return null;
  }

  const data = {};

  if (typeof done === 'boolean') {
    data.done = done;
  }

  if (Object.keys(data).length === 0) {
    return mapTodo(existing);
  }

  const updated = await prisma.todo.update({
    where: { id: todoId },
    data,
  });

  return mapTodo(updated);
}

module.exports = {
  toggleTodo,
  updateTodo,
};
