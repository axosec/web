import { Api, type RegisterRequest } from "@repo/api/account";
import { Axosec } from "@repo/core";
import { toBase64, sha512 } from "@repo/core/utils";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@repo/ui/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { toast } from "sonner";
import * as z from "zod";
import { useForm } from "@tanstack/react-form";

const api = Api.getInstance(import.meta.env.VITE_API_URL);
const axo = Axosec.getInstance();

const formSchema = z
  .object({
    email: z
      .email("Invalid email")
      .min(5, "Email too short, minimum of 5 characters")
      .max(250, "Email too long, maximum of 250 characters"),
    username: z
      .string()
      .min(4, "Username too short, minimum of 4 characters")
      .max(250, "Username too long, maximum of 250 characters"),
    password: z.string().min(8, "Password too short, minimum of 8 characters"),
    passwordAgain: z
      .string()
      .min(8, "Password too short, minimum of 8 characters"),
  })
  .refine((v) => v.password === v.passwordAgain, {
    message: "Passwords do not match.",
    path: ["passwordAgain"],
  });

export function RegisterPage() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      username: "",
      password: "",
      passwordAgain: "",
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const salt = await axo.generateSalt(32);
        const masterKey = await axo.deriveKey(value.password, salt);
        const identity = await axo.generateIdentity();
        const encPrivateKey = await axo.encrypt(identity.private, masterKey);
        const authHash = await sha512(masterKey);

        const payload: RegisterRequest = {
          email: value.email,
          username: value.username,
          salt: toBase64(salt),
          auth_verifier: toBase64(authHash),
          public_key: toBase64(identity.public),
          enc_private_key: toBase64(encPrivateKey),
        };

        await api.register(payload);

        toast.success("Registration Successful!");
        navigate("/login");
      } catch (e: any) {
        console.error("Registration Error:", e);

        form.setFieldMeta("email", (meta) => ({
          ...meta,
          isTouched: true,
          errorMap: {
            ...(meta.errorMap ?? {}),
            api: [e],
          },
        }));
      } finally {
      }
    },
  });

  const showFieldError = (fieldMeta: { isTouched: boolean }, submissionAttempts: number) =>
    fieldMeta.isTouched || submissionAttempts > 0;

  return (
    <div className="flex justify-center items-center mt-16">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create new Axosec account!</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="register-form"
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="email"
                children={(field) => {
                  const shouldShow = showFieldError(
                    field.state.meta,
                    form.state.submissionAttempts ?? 0
                  );
                  const isInvalid = shouldShow && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="alice@example.com"
                        autoComplete="email"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="username"
                children={(field) => {
                  const shouldShow = showFieldError(
                    field.state.meta,
                    form.state.submissionAttempts ?? 0
                  );
                  const isInvalid = shouldShow && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="alice"
                        autoComplete="username"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="password"
                children={(field) => {
                  const shouldShow =
                    field.state.meta.isTouched || (form.state.submissionAttempts ?? 0) > 0;
                  const isInvalid = shouldShow && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Master Password</FieldLabel>

                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="**********"
                        autoComplete="new-password"
                      />

                      <FieldDescription>
                        If you lose your master password, you won’t be able to access your account again.
                        We can’t recover it for you.
                      </FieldDescription>

                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="passwordAgain"
                children={(field) => {
                  const shouldShow = showFieldError(
                    field.state.meta,
                    form.state.submissionAttempts ?? 0
                  );
                  const isInvalid = shouldShow && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Master Password Again
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="**********"
                        autoComplete="new-password"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="block">
          <p className="text-sm text-muted-foreground mb-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
          <Field orientation="horizontal">

            <form.Subscribe
              selector={(state) => [state.isSubmitting, state.isDirty] as const}
              children={([isSubmitting, isDirty]) => (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isSubmitting || !isDirty}
                  >
                    Reset
                  </Button>
                  <Button type="submit" form="register-form" disabled={isSubmitting || !isDirty}>
                    {(isSubmitting && !isDirty) ? "Registering..." : "Register"}
                  </Button>
                </>
              )}
            />


          </Field>


        </CardFooter>
      </Card>
    </div>
  );
}
