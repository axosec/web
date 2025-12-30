import { useEffect, useState } from "react";
import { VaultApi } from "@repo/api/vault";
import { Axosec } from "@repo/core";
import { fromBase64 } from "@repo/core/utils";
import { FOLDER_ICONS } from "./folder-options";
import type { DecryptedItem } from "./item-options";
import { Folder, Loader2, Copy, Eye, EyeOff, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/ui/alert-dialog";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Separator } from "@repo/ui/components/ui/separator";
import { toast } from "sonner";

const api = VaultApi.getInstance(import.meta.env.VITE_VAULT_API_URL);
const axo = Axosec.getInstance();

function CopyButton({ value }: { value: string }) {
  const onCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  return (
    <Button variant="ghost" size="icon" onClick={onCopy} className="h-8 w-8">
      <Copy className="size-4" />
    </Button>
  );
}

function FieldRow({ label, value, type = "text", copyable = true }: { label: string, value: string, type?: "text" | "password", copyable?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="relative flex items-center gap-2">
        <Input
          readOnly
          type={isPassword && !showPassword ? "password" : "text"}
          value={value}
          className="pr-20"
        />
        <div className="absolute right-0 flex items-center pr-1">
          {isPassword && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="h-8 w-8"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          )}
          {copyable && <CopyButton value={value} />}
        </div>
      </div>
    </div>
  );
}

export default function ShowItem({ item, onDelete }: { item: DecryptedItem, onDelete?: (id: string) => Promise<void> }) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      if (!item) return;
      setLoading(true);
      try {
        const fullItem = await api.getItem(item.id);

        const dataBytes = await axo.decrypt(
          fromBase64(fullItem.enc_data),
          fromBase64(fullItem.data_nonce),
          item._key
        );

        const jsonString = new TextDecoder().decode(dataBytes);
        setDetails(JSON.parse(jsonString));
      } catch (e) {
        console.error("Failed to decrypt item details", e);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [item]);

  if (!item) return null;

  const IconComponent = FOLDER_ICONS.find((i) => i.id === item.icon)?.icon || Folder;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin size-8 text-muted-foreground" />
        </div>
      )
    }

    if (!details) {
      return <p className="text-muted-foreground p-6">Failed to load details</p>;
    }

    switch (item.type) {
      case "login":
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <FieldRow label="Username" value={details.username || ""} />
              <FieldRow label="Password" value={details.password || ""} type="password" />
            </div>

            {details.url && details.url.length > 0 && (
              <div className="space-y-2">
                <Label>URLs</Label>
                {details.url.map((url: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <Input readOnly value={url} />
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-10 w-10">
                        <ExternalLink className="size-4" />
                      </Button>
                    </a>
                    <CopyButton value={url} />
                  </div>
                ))}
              </div>
            )}

            {details.notes && (
              <div className="grid gap-2">
                <Label>Notes</Label>
                <div className="text-sm p-3 bg-muted/50 rounded-md whitespace-pre-wrap min-h-[100px]">
                  {details.notes}
                </div>
              </div>
            )}
          </div>
        );

      case "card":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldRow label="Cardholder Name" value={details.cardholder} />
              <FieldRow label="Card Number" value={details.number} />
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Expiry" value={details.expiry} />
                <FieldRow label="CVV" value={details.cvv} type="password" />
              </div>
              <FieldRow label="PIN" value={details.pin} type="password" />
            </div>
          </div>
        );

      case "note":
        return (
          <div className="space-y-2">
            <Label>Note Content</Label>
            <div className="text-sm p-4 bg-muted/30 rounded-lg whitespace-pre-wrap min-h-[200px] border">
              {details.content}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {Object.entries(details).map(([key, value]) => (
              <FieldRow key={key} label={key.replace(/_/g, ' ')} value={String(value)} />
            ))}
          </div>
        )
    }
  };

  return (
    <div className="flex flex-col gap-6 mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center size-16 rounded-xl bg-${item.color}-500/10 text-${item.color}-500`}>
            <IconComponent className="size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{item.title}</h1>
            <p className="text-muted-foreground capitalize">{item.subtitle || item.type}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger render={
                <Button variant="destructive" size="sm">
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </Button>
              } />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the item.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(item.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Separator />

      <div>
        {renderContent()}
      </div>
    </div>
  );
}