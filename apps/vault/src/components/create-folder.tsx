import * as z from "zod"
import { useForm } from "@tanstack/react-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { FOLDER_COLORS, FOLDER_ICONS, type FolderMetadata } from "./folder-options"
import { FieldError } from "@repo/ui/components/ui/field"

interface CreateFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (meta: FolderMetadata) => Promise<void>
  initialData?: FolderMetadata
}

const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(50, "Name is too long"),
  color: z.string(),
  icon: z.string(),
})

export function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CreateFolderDialogProps) {

  const form = useForm({
    defaultValues: {
      name: initialData?.name ?? "",
      color: initialData?.color ?? "default",
      icon: initialData?.icon ?? "default",
    },
    validators: {
      onChange: folderSchema,
      onSubmit: folderSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value)
        form.reset()
        onOpenChange(false)
      } catch (error) {
        console.error("Submission failed", error)
      }
    },
  })


  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset()
    }
    onOpenChange(isOpen)
  }

  const showFieldError = (fieldMeta: { isTouched: boolean }, submissionAttempts: number) =>
    fieldMeta.isTouched || submissionAttempts > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Folder" : "Create New Folder"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update your folder details." : "Customize your folder."} Metadata is encrypted client-side.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          <form.Field
            name="name"
          >
            {(field) => {
              const shouldShow = showFieldError(
                field.state.meta,
                form.state.submissionAttempts ?? 0
              );
              const isInvalid = shouldShow && !field.state.meta.isValid;
              return (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Financials"
                    autoFocus
                    autoComplete="off"
                    className={cn(field.state.meta.errors.length > 0 && "border-red-500")}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </div>
              )
            }}
          </form.Field>

          <form.Field name="color">
            {(field) => (
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => field.handleChange(c.id)}
                      className={cn(
                        "h-6 w-6 rounded-full border transition-all hover:scale-110 focus:ring-2 focus:ring-offset-1",
                        c.id === "default" ? "bg-slate-200" : c.bg,
                        field.state.value === c.id
                          ? "ring-2 ring-offset-1 ring-black dark:ring-white scale-110"
                          : ""
                      )}
                      title={c.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </form.Field>

          <form.Field name="icon">
            {(field) => (
              <div className="space-y-2">
                <Label>Icon</Label>
                <ScrollArea className="h-[150px] rounded-md border p-2">
                  <div className="grid grid-cols-5 gap-2">
                    {FOLDER_ICONS.map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => field.handleChange(id)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs transition-colors hover:bg-muted",
                          field.state.value === id
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "text-muted-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    initialData ? "Save Changes" : "Create Folder"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}