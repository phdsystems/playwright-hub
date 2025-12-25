<template>
  <div class="todo-list" data-testid="todo-list">
    <h1>Todo List</h1>

    <form @submit.prevent="addTodo" data-testid="add-form">
      <input
        v-model="newTodo"
        type="text"
        placeholder="Add a todo..."
        data-testid="todo-input"
      />
      <button type="submit" data-testid="add-btn">Add</button>
    </form>

    <ul data-testid="todos">
      <li
        v-for="todo in todos"
        :key="todo.id"
        :data-testid="`todo-${todo.id}`"
      >
        <input
          type="checkbox"
          :checked="todo.completed"
          @change="toggleTodo(todo.id)"
          :data-testid="`checkbox-${todo.id}`"
        />
        <span :class="{ completed: todo.completed }">{{ todo.text }}</span>
        <button
          @click="removeTodo(todo.id)"
          :data-testid="`remove-${todo.id}`"
        >
          Remove
        </button>
      </li>
    </ul>

    <p data-testid="count">{{ remaining }} remaining</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const todos = ref<Todo[]>([])
const newTodo = ref('')
let nextId = 1

const addTodo = () => {
  if (!newTodo.value.trim()) return

  todos.value.push({
    id: nextId++,
    text: newTodo.value,
    completed: false,
  })
  newTodo.value = ''
}

const toggleTodo = (id: number) => {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}

const removeTodo = (id: number) => {
  todos.value = todos.value.filter((t) => t.id !== id)
}

const remaining = computed(() => {
  return todos.value.filter((t) => !t.completed).length
})
</script>

<style scoped>
.completed {
  text-decoration: line-through;
  opacity: 0.6;
}
</style>
