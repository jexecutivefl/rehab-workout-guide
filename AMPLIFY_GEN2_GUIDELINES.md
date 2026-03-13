# Amplify Gen 2 + Next.js Development Guidelines

If updating amplify gen 2 make sure to read /AMPLIFY_GEN2_GUIDELINES.MD first

## Schema Definition Rules (amplify/data/resource.ts)

### Enums

- **DO NOT chain `.required()` on enums** - enums are required by default
- Use `.optional()` only if the field should be nullable

```typescript
// ❌ WRONG - will cause TypeScript error
priority: a.enum(['low', 'medium', 'high']).required(),

// ✅ CORRECT
priority: a.enum(['low', 'medium', 'high']),

// ✅ CORRECT - if field should be optional
priority: a.enum(['low', 'medium', 'high']).optional(),
```

### Reserved Names

These names are reserved in GraphQL and **cannot be used as model names**:

- `Subscription` (use `PlanSubscription`, `UserSubscription`, etc.)
- `Query`
- `Mutation`
- `Type`

### GraphQL Naming Rules

All identifiers (model names, field names, enum values) must:

- Start with a letter (a-z, A-Z) or underscore (\_)
- **Cannot start with a number**

```typescript
// ❌ WRONG
a.enum(["1_pending", "2_approved"]);
field1stAttempt: a.string();

// ✅ CORRECT
a.enum(["pending", "approved"]);
firstAttempt: a.string();
```

### Keep Schema and Frontend Types in Sync

When adding enum values to the schema, ensure all frontend type definitions match:

```typescript
// If schema has:
status: a.enum(['ACTIVE', 'SOLD', 'REMOVED', 'EXPIRED', 'PENDING']),

// Frontend types must include all values:
type ListingStatus = 'ACTIVE' | 'SOLD' | 'REMOVED' | 'EXPIRED' | 'PENDING';
```

---

## TypeScript Type Compatibility

### Nullable vs Undefined

Amplify Gen 2 returns `Nullable<T> | undefined` but many interfaces expect `T | null`.

**Always convert undefined to null when mapping Amplify data:**

```typescript
// ❌ WRONG - may be undefined
description: post.description,

// ✅ CORRECT - converts undefined to null
description: post.description ?? null,
```

**Consider creating a utility helper:**

```typescript
// utils/nullify.ts
export const nullify = <T>(value: T | undefined): T | null => value ?? null;

// Usage:
description: nullify(post.description),
userId: nullify(item.userId),
```

### Enum Type Casting

When form state is generic `string` but schema expects specific enum values:

```typescript
// ❌ WRONG - string not assignable to enum type
status: data.status,

// ✅ CORRECT - cast to the expected type
status: data.status as "pending" | "approved" | "rejected" | null,

// ✅ BETTER - define reusable type
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | null;
status: data.status as OrderStatus,
```

### Null Checks in Callbacks

TypeScript control flow analysis doesn't carry into callbacks:

```typescript
// ❌ WRONG - TypeScript doesn't know maxPrice is non-null inside callback
if (filters.maxPrice) {
  products = products.filter(
    (product) => product.price <= filters.maxPrice // Error: possibly null
  );
}

// ✅ CORRECT - capture value before callback
if (filters.maxPrice) {
  const maxPrice = filters.maxPrice;
  products = products.filter((product) => product.price <= maxPrice);
}
```

---

## Pre-Deployment Checklist

Before pushing changes that modify the Amplify schema or data layer:

1. **Run local type check:** `npx tsc --noEmit`
2. **Run local build:** `npm run build`
3. **Verify schema syntax:** `npx ampx sandbox` (start and check for errors)

### Common Build Errors Quick Reference

| Error Pattern                                                                     | Cause                                  | Fix                                                      |
| --------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| `Property 'required' does not exist on type 'EnumType<...>'`                      | Chaining `.required()` on enum         | Remove `.required()` from enum                           |
| `'X' is a reserved type name`                                                     | Using reserved GraphQL name            | Rename model (e.g., `Subscription` → `PlanSubscription`) |
| `Expected Name, found Int "1"`                                                    | Identifier starts with number          | Rename to start with letter                              |
| `Type 'Nullable<string> \| undefined' is not assignable to type 'string \| null'` | Amplify nullable mismatch              | Add `?? null` to convert undefined                       |
| `Type 'string' is not assignable to type 'enum...'`                               | Generic string vs enum type            | Cast to specific enum type                               |
| `'X' is possibly 'null'` inside callback                                          | Null check doesn't flow into callbacks | Store value in variable before callback                  |
| `Property 'X' does not exist on type`                                             | Removed model still referenced         | Update all references to removed/renamed models          |

---

## Project Structure Best Practices

### Shared Types

Create a central types file that derives from the Amplify schema:

```typescript
// types/amplify.ts
import type { Schema } from "@/amplify/data/resource";

export type BlogPost = Schema["BlogPost"]["type"];
export type Product = Schema["Product"]["type"];

// Enum types (extract from schema or define to match)
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
```

### Data Transformation Layer

Create service functions that handle Amplify ↔ Frontend type conversion:

```typescript
// services/product-service.ts
export function toProductDTO(product: Schema["Product"]["type"]): ProductDTO {
  return {
    id: product.id,
    name: product.name ?? null,
    description: product.description ?? null,
    price: product.price ?? null,
    // ... handle all nullable conversions
  };
}
```

---

## React 19 + Amplify UI Compatibility

The `@aws-amplify/ui-react` package may show peer dependency warnings with React 19. These are warnings, not errors, and builds will succeed. To suppress:

```json
// package.json
{
  "overrides": {
    "@xstate/react": {
      "react": "$react"
    }
  }
}
```
