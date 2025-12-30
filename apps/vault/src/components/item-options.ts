import * as z from "zod";
import type { ItemSummary } from "@repo/api/vault";
import { Axosec } from "@repo/core";
import { fromBase64 } from "@repo/core/utils";

export const MetadataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  icon: z.string().default("default"),
  color: z.string().default("default"),
  subtitle: z.string().optional(),
})

export const LoginSchema = z.object({
  username: z.string().optional(),
  password: z.string().min(1, "Password is required"),
  url: z.array(z.string()),
  totp_secret: z.string().optional(),
  notes: z.string().optional(),
})

export const CardSchema = z.object({
  cardholder: z.string().min(1, "Cardholder name is required"),
  number: z.string().regex(/^\d{13,19}$/, "Invalid card number"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "MM/YY"),
  cvv: z.string().regex(/^\d{3,4}$/, "Invalid CVV"),
  pin: z.string(),
})

export const NoteSchema = z.object({
  content: z.string(),
})

export interface ItemOverview {
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  type: string;
}

export interface DecryptedItem extends ItemOverview {
  id: string;
  _key: Uint8Array;
}

export async function decryptItems(
  rawItems: ItemSummary[],
  folderKey: Uint8Array
): Promise<DecryptedItem[]> {
  const axo = Axosec.getInstance();
  const decryptedItems: DecryptedItem[] = [];

  await Promise.all(rawItems.map(async (i) => {
    try {
      const itemKey = await axo.decrypt(
        fromBase64(i.wrapped_key),
        fromBase64(i.key_nonce),
        folderKey
      );

      const overviewBytes = await axo.decrypt(
        fromBase64(i.enc_overview),
        fromBase64(i.overview_nonce),
        itemKey
      );

      const plainText = new TextDecoder().decode(overviewBytes);
      const overview: ItemOverview = JSON.parse(plainText);

      decryptedItems.push({
        id: i.id,
        ...overview,
        _key: itemKey,
      });

    } catch (e) {
      console.error(`Failed to decrypt item ${i.id}`, e);
    }
  }));

  return decryptedItems;
}