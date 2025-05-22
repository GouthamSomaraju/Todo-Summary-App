let todos = [];
let idCounter = 1;

export const getTodos = () => todos;
export const addTodo = (text) => {
  const todo = { id: idCounter++, text };
  todos.push(todo);
  return todo;
};
export const deleteTodo = (id) => {
  todos = todos.filter(todo => todo.id !== id);
};
