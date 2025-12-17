import { Api } from "@repo/api/account";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { fromBase64, sha512, toBase64 } from "@repo/core/utils";
import { Axosec } from "@repo/core";
import { useAuth } from "@repo/ui/context/auth-context";
import * as z from "zod";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card"
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";

const api = Api.getInstance(import.meta.env.VITE_API_URL);

const formSchema = z
  .object({
    email: z
      .email("Invalid email")
      .min(5, "Email too short, minimum of 5 characters")
      .max(250, "Email too long, maximum of 250 characters"),
    password: z.string().min(8, "Password too short, minimum of 8 characters"),
  });


export function LoginPage() {
  const axo = Axosec.getInstance();
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        console.log("Starting Login...");

        const init = await api.loginInit({ "email": value.email })

        const masterKey = await axo.deriveKey(value.password, fromBase64(init.salt));

        const authHash = await sha512(masterKey);

        const user = await api.login({ email: value.email, auth_verifier: toBase64(authHash) })

        const encKeyBytes = fromBase64(user.enc_private_key);
        const privateKey = await axo.decrypt(encKeyBytes, masterKey);

        login(user, privateKey)
        toast.success("Login Successful!")
        navigate("/")

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
      }
    }
  })

  const showFieldError = (fieldMeta: { isTouched: boolean }, submissionAttempts: number) =>
    fieldMeta.isTouched || submissionAttempts > 0;

  return (
    <div className="flex justify-center items-center mt-16">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Log into your Axosec account!</CardDescription>
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
                        autoComplete="current-password"
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
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Register
            </Link>
          </p>
          <Field orientation="horizontal">
            <form.Subscribe
              selector={(state) => [state.isSubmitting, state.isDirty] as const}
              children={([isSubmitting, isDirty]) => (

                  <Button type="submit" form="register-form" disabled={isSubmitting || !isDirty}>
                    {(isSubmitting && !isDirty) ? "Logging in..." : "Login"}
                  </Button>
              )}
            />


          </Field>


        </CardFooter>
      </Card>
    </div>
  )
}
