/**
 * TodoList Component Tests
 *
 * Example using @ux.qa/frontmock with Vue Test Utils
 */

import { t } from '@ux.qa/frontmock'
import { mount } from '@vue/test-utils'
import TodoList from '../src/TodoList.vue'

const { describe, it, expect } = t

describe('TodoList', () => {
  it('renders empty list', () => {
    const wrapper = mount(TodoList)

    expect(wrapper.find('[data-testid="todos"]').element.children).toHaveLength(0)
    expect(wrapper.find('[data-testid="count"]').text()).toBe('0 remaining')
  })

  it('adds a todo', async () => {
    const wrapper = mount(TodoList)

    await wrapper.find('[data-testid="todo-input"]').setValue('Buy milk')
    await wrapper.find('[data-testid="add-form"]').trigger('submit')

    expect(wrapper.find('[data-testid="todos"]').element.children).toHaveLength(1)
    expect(wrapper.text()).toContain('Buy milk')
  })

  it('toggles todo completion', async () => {
    const wrapper = mount(TodoList)

    await wrapper.find('[data-testid="todo-input"]').setValue('Buy milk')
    await wrapper.find('[data-testid="add-form"]').trigger('submit')

    await wrapper.find('[data-testid="checkbox-1"]').setValue(true)

    expect(wrapper.find('[data-testid="count"]').text()).toBe('0 remaining')
  })

  it('removes a todo', async () => {
    const wrapper = mount(TodoList)

    await wrapper.find('[data-testid="todo-input"]').setValue('Buy milk')
    await wrapper.find('[data-testid="add-form"]').trigger('submit')

    await wrapper.find('[data-testid="remove-1"]').trigger('click')

    expect(wrapper.find('[data-testid="todos"]').element.children).toHaveLength(0)
  })

  it('shows correct remaining count', async () => {
    const wrapper = mount(TodoList)

    await wrapper.find('[data-testid="todo-input"]').setValue('Task 1')
    await wrapper.find('[data-testid="add-form"]').trigger('submit')

    await wrapper.find('[data-testid="todo-input"]').setValue('Task 2')
    await wrapper.find('[data-testid="add-form"]').trigger('submit')

    await wrapper.find('[data-testid="checkbox-1"]').setValue(true)

    expect(wrapper.find('[data-testid="count"]').text()).toBe('1 remaining')
  })
})
