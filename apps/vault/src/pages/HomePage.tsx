import { useEffect, useState, type ComponentProps } from "react";
import { useAuth } from "@repo/ui/context/auth-context";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/components/ui/sidebar"
import { VaultApi, type ItemType } from "@repo/api/vault";
import { AppSidebar } from "../components/app-sidebar";
import { decryptFolders, type FolderNode } from "../components/folder-options";
import { Separator } from "@repo/ui/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@repo/ui/components/ui/breadcrumb";
import { fromBase64, toBase64 } from "@repo/core/utils";
import { Axosec } from "@repo/core";
import { CreateFolderDialog } from "../components/create-folder";
import type { FolderMetadata } from "../components/folder-options";
import { decryptItems, type DecryptedItem } from "../components/item-options";
import CreateItem from "../components/create-item";
import ShowItem from "../components/show-item";
import { toast } from "sonner";

const api = VaultApi.getInstance(import.meta.env.VITE_VAULT_API_URL);
const axo = Axosec.getInstance();

export default function HomePage() {
  const { user, privateKey } = useAuth()
  const [decryptedFolders, setDecryptedFolders] = useState<FolderNode[] | null>(null)
  const [activeFolder, setActiveFolder] = useState<FolderNode | null>(null)
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<FolderNode | null>(null);
  const [viewType, setViewType] = useState<'show-item' | 'create-item'>('create-item');
  const [items, setItems] = useState<DecryptedItem[]>([]);
  const [activeItem, setActiveItem] = useState<DecryptedItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<{ item: DecryptedItem, details: any } | null>(null);

  const loadItems = async () => {
    if (!activeFolder) return;
    try {
      const rawItems = await api.listItems(activeFolder.id);
      const decrypted = await decryptItems(rawItems, activeFolder._key);
      setItems(decrypted);
    } catch (e) {
      console.error("Failed to load items", e);
    }
  };

  useEffect(() => {
    if (activeFolder) {
      loadItems();
      setActiveItem(null);
    } else {
      setItems([]);
    }
  }, [activeFolder]);

  const loadData = async () => {
    if (!privateKey) return;
    try {
      const folders = await api.listFolders();
      const decrypted = await decryptFolders(folders, privateKey);
      setDecryptedFolders(decrypted);
    } catch (e) {
      console.error("Failed to load folders", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [privateKey]);

  const handleCreateFolder = async (meta: FolderMetadata) => {
    if (!user?.vault_public_key || !privateKey) return;

    try {
      const folderKey = await axo.generateSalt(32);

      const jsonString = JSON.stringify(meta);
      const metaBytes = new TextEncoder().encode(jsonString);
      const { data: encMetadata, nonce: metaNonce } = await axo.encrypt(metaBytes, folderKey);

      const userPub = fromBase64(user.vault_public_key);
      const { data: wrappedKey, nonce: keyNonce } = await axo.wrapKey(folderKey, userPub);

      await api.createFolder({
        enc_metadata: toBase64(encMetadata),
        nonce: toBase64(metaNonce),
        enc_key: toBase64(wrappedKey),
        key_nonce: toBase64(keyNonce),
      });

      await loadData();
      toast.success("Folder created successfully");
    } catch (e) {
      console.error("Failed to create folder", e);
      toast.error("Failed to create folder");
    }
  };

  const handleUpdateFolder = async (meta: FolderMetadata) => {
    if (!activeFolder) return;

    try {
      const jsonString = JSON.stringify(meta);
      const metaBytes = new TextEncoder().encode(jsonString);
      const { data: encMetadata, nonce: metaNonce } = await axo.encrypt(metaBytes, activeFolder._key);

      await api.updateFolder(activeFolder.id, {
        enc_metadata: toBase64(encMetadata),
        nonce: toBase64(metaNonce),
      });

      await loadData();
      setActiveFolder({ ...activeFolder, ...meta });
      toast.success("Folder updated successfully");
    } catch (e) {
      console.error("Failed to update folder", e);
      toast.error("Failed to update folder");
    }
  };

  const handleCreateItem = async (type: ItemType, values: any) => {
    if (!activeFolder || !privateKey) return;

    try {
      const itemKey = await axo.generateSalt(32);

      const overviewObj = {
        title: values.title,
        subtitle: type === "login" ? values.username
          : type === "card" ? `Ends in ${values.number.slice(-4)}`
            : "Secure Note",
        icon: values.icon || "default",
        color: values.color || "default",
        type: type
      };

      let dataObj = {};

      switch (type) {
        case "login":
          dataObj = {
            username: values.username,
            password: values.password,
            url: values.url,
            notes: values.notes
          };
          break;
        case "card":
          dataObj = {
            cardholder: values.cardholder,
            number: values.number,
            expiry: values.expiry,
            cvv: values.cvv,
            pin: values.pin
          };
          break;
        case "note":
          dataObj = {
            content: values.content
          };
          break;
      }

      const overviewBytes = new TextEncoder().encode(JSON.stringify(overviewObj));
      const { data: encOverview, nonce: overviewNonce } = await axo.encrypt(overviewBytes, itemKey);

      const dataBytes = new TextEncoder().encode(JSON.stringify(dataObj));
      const { data: encData, nonce: dataNonce } = await axo.encrypt(dataBytes, itemKey);

      const { data: encKey, nonce: keyNonce } = await axo.encrypt(itemKey, activeFolder._key);

      await api.createItem({
        folder_id: activeFolder.id,
        type: type,

        enc_overview: toBase64(encOverview),
        overview_nonce: toBase64(overviewNonce),

        enc_data: toBase64(encData),
        data_nonce: toBase64(dataNonce),

        enc_key: toBase64(encKey),
        key_nonce: toBase64(keyNonce),
      });

      toast.success("Item created successfully");

      await loadData();
      await loadItems();
    } catch (error) {
      console.error("Failed to create item:", error);
      toast.error("Failed to save item");
    }
  };

  const handleUpdateItem = async (type: ItemType, values: any) => {
    if (!activeFolder || !privateKey || !itemToEdit) return;

    try {
      const itemKey = itemToEdit.item._key;

      const overviewObj = {
        title: values.title,
        subtitle: type === "login" ? values.username
          : type === "card" ? `Ends in ${values.number.slice(-4)}`
            : "Secure Note",
        icon: values.icon || "default",
        color: values.color || "default",
        type: type
      };

      let dataObj = {};

      switch (type) {
        case "login":
          dataObj = {
            username: values.username,
            password: values.password,
            url: values.url,
            notes: values.notes
          };
          break;
        case "card":
          dataObj = {
            cardholder: values.cardholder,
            number: values.number,
            expiry: values.expiry,
            cvv: values.cvv,
            pin: values.pin
          };
          break;
        case "note":
          dataObj = {
            content: values.content
          };
          break;
      }

      const overviewBytes = new TextEncoder().encode(JSON.stringify(overviewObj));
      const { data: encOverview, nonce: overviewNonce } = await axo.encrypt(overviewBytes, itemKey);

      const dataBytes = new TextEncoder().encode(JSON.stringify(dataObj));
      const { data: encData, nonce: dataNonce } = await axo.encrypt(dataBytes, itemKey);

      await api.updateItem(itemToEdit.item.id, {
        enc_overview: toBase64(encOverview),
        overview_nonce: toBase64(overviewNonce),
        enc_data: toBase64(encData),
        data_nonce: toBase64(dataNonce),
      });

      toast.success("Item updated successfully");

      await loadItems();

      const updatedItem = {
        ...itemToEdit.item,
        ...overviewObj
      };
      setActiveItem(updatedItem);
      setViewType('show-item');
      setItemToEdit(null);

    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.deleteResource(id, 'item');
      await loadItems();
      if (activeItem?.id === id) {
        setActiveItem(null);
        setViewType('create-item');
      }
      toast.success("Item deleted successfully");
    } catch (e) {
      console.error("Failed to delete item", e);
      toast.error("Failed to delete item");
    }
  }


  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as ComponentProps<typeof SidebarProvider>["style"]
      }
    >
      {decryptedFolders && <AppSidebar
        folders={decryptedFolders}
        activeItem={activeFolder}
        setActiveItem={setActiveFolder}
        onCreateItem={() => {
          setItemToEdit(null);
          setViewType('create-item');
        }}
        onCreateFolder={() => {
          setFolderToEdit(null);
          setIsFolderDialogOpen(true);
        }}
        onEditFolder={(folder) => {
          setFolderToEdit(folder);
          setIsFolderDialogOpen(true);
        }}
        onDeleteFolder={async (id) => {
          await api.deleteResource(id, 'folder');
          await loadData();
          setActiveFolder(null);
        }}
        items={items}
        selectedItem={activeItem}
        onSelectItem={(item) => {
          setActiveItem(item);
          setViewType('show-item');
        }}
      />
      }
      <SidebarInset>
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                Folders
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeFolder?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {viewType === 'show-item' && activeItem &&
            <ShowItem
              item={activeItem}
              onDelete={handleDeleteItem}
              onEdit={(item, details) => {
                setItemToEdit({ item, details });
                setViewType('create-item');
              }}
            />
          }
          {viewType === 'create-item' && (
            <>
              {activeFolder ? (
                <CreateItem
                  onSubmit={itemToEdit ? handleUpdateItem : handleCreateItem}
                  initialData={itemToEdit?.item}
                  initialDetails={itemToEdit?.details}
                />
              ) : (
                <p>Folder not found</p>
              )}
            </>
          )}
        </div>
      </SidebarInset>
      <CreateFolderDialog
        open={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        initialData={folderToEdit ? {
          name: folderToEdit.name,
          color: folderToEdit.color,
          icon: folderToEdit.icon
        } : undefined}
        onSubmit={folderToEdit ? handleUpdateFolder : handleCreateFolder}
      />
    </SidebarProvider>
  );
}
