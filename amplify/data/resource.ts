import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Universal Starter Template - Data Schema
 *
 * This is a minimal example schema to get you started.
 * Replace these models with your own application-specific data models.
 *
 * @see https://docs.amplify.aws/gen2/build-a-backend/data/
 */

const schema = a.schema({
  /**
   * UserProfile - Extended user information beyond authentication
   * Automatically linked to Cognito user via owner authorization
   */
  UserProfile: a
    .model({
      email: a.string().required(),
      displayName: a.string(),
      bio: a.string(),
      avatarUrl: a.string(),
      preferences: a.json(), // Store user preferences as JSON
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(), // Users can only manage their own profile
      allow.authenticated().to(["read"]), // All authenticated users can read profiles
    ]),

  /**
   * Task - Simple todo/task example
   * Demonstrates basic CRUD operations and authorization patterns
   */
  Task: a
    .model({
      title: a.string().required(),
      description: a.string(),
      status: a.enum(["todo", "in_progress", "done"]),
      priority: a.enum(["low", "medium", "high"]),
      dueDate: a.date(),
      completedAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(), // Users can only manage their own tasks
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
