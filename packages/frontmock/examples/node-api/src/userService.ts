/**
 * User Service
 *
 * Example Node.js service for testing
 */

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

// In-memory storage
const users: Map<string, User> = new Map()
let nextId = 1

export class UserService {
  static async create(data: { name: string; email: string }): Promise<User> {
    if (!data.name || !data.email) {
      throw new Error('Name and email are required')
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format')
    }

    const id = String(nextId++)
    const user: User = {
      id,
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
    }

    users.set(id, user)
    return user
  }

  static async findById(id: string): Promise<User | null> {
    return users.get(id) || null
  }

  static async findAll(): Promise<User[]> {
    return Array.from(users.values())
  }

  static async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = users.get(id)
    if (!user) return null

    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format')
    }

    const updated = { ...user, ...data, id, createdAt: user.createdAt }
    users.set(id, updated)
    return updated
  }

  static async delete(id: string): Promise<boolean> {
    return users.delete(id)
  }

  static async clear(): Promise<void> {
    users.clear()
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
}
