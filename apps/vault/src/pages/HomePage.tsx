import { useEffect, useState, type ComponentProps } from "react";
import { useAuth } from "@repo/ui/context/auth-context";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/components/ui/sidebar"
import { VaultApi } from "@repo/api/vault";
import { AppSidebar, decryptFolders, type FolderNode } from "../components/app-sidebar";
import { Separator } from "@repo/ui/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@repo/ui/components/ui/breadcrumb";
import { fromBase64, toBase64 } from "@repo/core/utils";
import { Axosec } from "@repo/core";
import { CreateFolderDialog } from "../components/create-folder";
import type { FolderMetadata } from "../components/folder-options";

const api = VaultApi.getInstance(import.meta.env.VITE_VAULT_API_URL);
const axo = Axosec.getInstance();

export default function HomePage() {
  const { user, privateKey } = useAuth()
  const [decryptedFolders, setDecryptedFolders] = useState<FolderNode[] | null>(null)
  const [activeFolder, setActiveFolder] = useState<FolderNode | null>(null)
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<FolderNode | null>(null);

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

    const folderKey = window.crypto.getRandomValues(new Uint8Array(32));

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
  };

  const handleUpdateFolder = async (meta: FolderMetadata) => {
    if (!activeFolder) return;

    const jsonString = JSON.stringify(meta);
    const metaBytes = new TextEncoder().encode(jsonString);
    const { data: encMetadata, nonce: metaNonce } = await axo.encrypt(metaBytes, activeFolder._key);

    await api.updateFolder(activeFolder.id, {
      enc_metadata: toBase64(encMetadata),
      nonce: toBase64(metaNonce),
    });

    await loadData();
    setActiveFolder({ ...activeFolder, ...meta });
  };

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
        }} />}
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
          TODO
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
