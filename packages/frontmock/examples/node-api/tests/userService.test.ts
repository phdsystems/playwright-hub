/**
 * UserService Tests
 *
 * Example using @ux.qa/frontmock for Node.js testing
 */

import { t } from '@ux.qa/frontmock'
import { UserService } from '../src/userService'

const { describe, it, expect, beforeEach } = t

describe('UserService', () => {
  beforeEach(async () => {
    await UserService.clear()
  })

  describe('create', () => {
    it('creates a new user', async () => {
      const user = await UserService.create({
        name: 'John Doe',
        email: 'john@example.com',
      })

      expect(user).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
      })
      expect(user.id).toBeDefined()
      expect(user.createdAt).toBeDefined()
    })

    it('throws error for missing name', async () => {
      await expect(
        UserService.create({ name: '', email: 'john@example.com' })
      ).rejects.toThrow('Name and email are required')
    })

    it('throws error for missing email', async () => {
      await expect(
        UserService.create({ name: 'John', email: '' })
      ).rejects.toThrow('Name and email are required')
    })

    it('throws error for invalid email', async () => {
      await expect(
        UserService.create({ name: 'John', email: 'invalid-email' })
      ).rejects.toThrow('Invalid email format')
    })
  })

  describe('findById', () => {
    it('finds user by id', async () => {
      const created = await UserService.create({
        name: 'John Doe',
        email: 'john@example.com',
      })

      const found = await UserService.findById(created.id)

      expect(found).toEqual(created)
    })

    it('returns null for non-existent id', async () => {
      const found = await UserService.findById('999')

      expect(found).toBeNull()
    })
  })

  describe('findAll', () => {
    it('returns empty array when no users', async () => {
      const users = await UserService.findAll()

      expect(users).toEqual([])
    })

    it('returns all users', async () => {
      await UserService.create({ name: 'User 1', email: 'user1@example.com' })
      await UserService.create({ name: 'User 2', email: 'user2@example.com' })

      const users = await UserService.findAll()

      expect(users).toHaveLength(2)
    })
  })

  describe('update', () => {
    it('updates user', async () => {
      const user = await UserService.create({
        name: 'John Doe',
        email: 'john@example.com',
      })

      const updated = await UserService.update(user.id, {
        name: 'Jane Doe',
      })

      expect(updated?.name).toBe('Jane Doe')
      expect(updated?.email).toBe('john@example.com')
    })

    it('returns null for non-existent user', async () => {
      const updated = await UserService.update('999', { name: 'Test' })

      expect(updated).toBeNull()
    })

    it('throws error for invalid email', async () => {
      const user = await UserService.create({
        name: 'John',
        email: 'john@example.com',
      })

      await expect(
        UserService.update(user.id, { email: 'invalid' })
      ).rejects.toThrow('Invalid email format')
    })
  })

  describe('delete', () => {
    it('deletes user', async () => {
      const user = await UserService.create({
        name: 'John Doe',
        email: 'john@example.com',
      })

      const deleted = await UserService.delete(user.id)
      expect(deleted).toBe(true)

      const found = await UserService.findById(user.id)
      expect(found).toBeNull()
    })

    it('returns false for non-existent user', async () => {
      const deleted = await UserService.delete('999')

      expect(deleted).toBe(false)
    })
  })
})
