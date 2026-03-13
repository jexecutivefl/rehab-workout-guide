"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

/**
 * LoginForm Component
 *
 * Amplify UI Authenticator with custom styling.
 * Provides email/password authentication out of the box.
 *
 * @see https://ui.docs.amplify.aws/react/connected-components/authenticator
 */

export function LoginForm() {
  return (
    <Authenticator
      formFields={{
        signUp: {
          email: {
            order: 1,
            placeholder: "Enter your email",
            isRequired: true,
          },
          password: {
            order: 2,
            placeholder: "Enter your password",
            isRequired: true,
          },
          confirm_password: {
            order: 3,
            placeholder: "Confirm your password",
            isRequired: true,
          },
        },
      }}
    />
  );
}
