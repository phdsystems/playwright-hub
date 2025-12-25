# Why Bun Uses Zig (Not Rust)

Jarred Sumner (Bun's creator) chose Zig over Rust for several reasons:

## 1. C interop is critical

Bun relies heavily on existing C libraries:
- **JavaScriptCore** (Safari's JS engine) - written in C++
- **BoringSSL** - C
- **zlib**, **libuv**, etc.

| Language | C interop |
|----------|-----------|
| Zig | Native, zero overhead |
| Rust | FFI, requires bindings, overhead |

## 2. Simpler mental model

| Aspect | Rust | Zig |
|--------|------|-----|
| Memory | Borrow checker, lifetimes | Manual, explicit |
| Learning | Steep curve | Gentler |
| Compile errors | Complex | Straightforward |
| Refactoring | Fight the compiler | More flexible |

Jarred stated he wanted to "move fast" without fighting Rust's borrow checker.

## 3. Compile times

| Language | Compile speed |
|----------|---------------|
| Zig | Fast |
| Rust | Notoriously slow |

For rapid iteration on a large project, this matters.

## 4. Zig's unique features

- **Comptime** - Compile-time code execution (powerful metaprogramming)
- **No hidden control flow** - Explicit allocators, no exceptions
- **Drop-in C compiler** - Zig can compile C code directly

## Jarred's own words (paraphrased)

> "Rust is great, but Zig lets me write code the way I think about it. I can integrate with C libraries instantly and iterate faster."

## Trade-off

Rust would give stronger safety guarantees, but Zig gave Bun:
- Faster development velocity
- Seamless C/C++ integration
- Simpler codebase

## What is Zig?

**Zig** is a low-level systems programming language designed as a modern alternative to C.

| Aspect | Description |
|--------|-------------|
| **Type** | Compiled, statically typed |
| **Level** | Systems/low-level (like C, Rust) |
| **Memory** | Manual management, no GC |
| **Created** | 2016 by Andrew Kelley |
| **Focus** | Safety, performance, simplicity |

### Bun's architecture

```
Bun = Zig (core runtime) + JavaScriptCore (JS engine)
```

| Benefit | Result |
|---------|--------|
| No garbage collector | Predictable performance |
| Low-level control | Faster than Node.js |
| Small binaries | Single executable (~90MB) |
| C interop | Easy integration with C libraries |

### Zig vs other systems languages

| Feature | C | Rust | Zig |
|---------|---|------|-----|
| Memory safety | No | Yes (ownership) | Manual + safety features |
| Complexity | Low | High | Medium |
| Compile speed | Fast | Slow | Fast |
| Learning curve | Medium | Steep | Gentle |
| C interop | Native | FFI | Native (drop-in C replacement) |

### Example

```zig
const std = @import("std");

pub fn main() void {
    std.debug.print("Hello, {s}!\n", .{"World"});
}
```

Zig is gaining popularity for building high-performance tools. Besides Bun, it's also used in parts of Uber's infrastructure and other performance-critical systems.
