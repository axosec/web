import type { FolderSummary } from "@repo/api/vault"
import { Axosec } from "@repo/core";
import { fromBase64 } from "@repo/core/utils";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInput, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@repo/ui/components/ui/sidebar";
import { useEffect } from "react";
import { ChevronsUpDown, Command, Folder, Inbox, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/ui/dropdown-menu";
import { ThemeSelector } from "@repo/ui/components/theme-selector";
import { FOLDER_COLORS, FOLDER_ICONS, type FolderMetadata } from "./folder-options";

export interface FolderNode {
  id: string;
  name: string;
  icon: string;
  color: string;
  _key: Uint8Array;
}

export async function decryptFolders(
  rawFolders: FolderSummary[],
  userPrivateKey: Uint8Array
): Promise<FolderNode[]> {
  const axo = Axosec.getInstance();
  const decryptedFolders: FolderNode[] = [];

  await Promise.all(rawFolders.map(async (f) => {
    try {
      const folderKey = await axo.unwrapKey(
        fromBase64(f.wrapped_key),
        fromBase64(f.key_nonce),
        userPrivateKey
      );

      const metaBytes = await axo.decrypt(
        fromBase64(f.enc_metadata),
        fromBase64(f.nonce),
        folderKey
      );

      const plainText = new TextDecoder().decode(metaBytes);
      let metadata: FolderMetadata;

      try {
        metadata = JSON.parse(plainText);
      } catch (e) {
        metadata = {
          name: plainText,
          icon: "default",
          color: "default"
        };
      }

      decryptedFolders.push({
        id: f.id,
        name: metadata.name,
        icon: metadata.icon,
        color: metadata.color,
        _key: folderKey,
      });

    } catch (e) {
      console.error(`Failed to decrypt folder ${f.id}`, e);
    }
  }));

  return decryptedFolders;
}

export function AppSidebar({
  folders,
  activeItem,
  setActiveItem,
  onCreateFolder,
  ...props
}: {
  folders: FolderNode[]
  activeItem: FolderNode | null
  setActiveItem: (item: FolderNode) => void
  onCreateFolder: () => void
} & React.ComponentProps<typeof Sidebar>) {
  const { setOpen } = useSidebar()

  useEffect(() => {
    if (folders.length > 0 && !activeItem) {
      setActiveItem(folders[0])
    }
  }, [folders, activeItem])

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="md:h-8 md:p-0" render={
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
                    >
                      <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <Command className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">Axosec vault</span>
                      </div>
                      <ChevronsUpDown />
                    </SidebarMenuButton>
                  } />
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                  >
                    <DropdownMenuItem onClick={onCreateFolder} className="gap-2 p-2">
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Plus className="size-4 shrink-0" />
                      </div>
                      Create Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {folders.map((item) => {
                  const IconComponent = FOLDER_ICONS.find((i) => i.id === item.icon)?.icon || Folder;
                  const colorClass = FOLDER_COLORS.find((c) => c.id === item.color)?.text || "";

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        tooltip={{
                          children: item.name,
                          hidden: false,
                        }}
                        onClick={() => {
                          setActiveItem(item);
                          setOpen(true);
                        }}
                        isActive={activeItem?.id === item.id}
                        className="px-2.5 md:px-2"
                      >
                        <IconComponent className={colorClass} />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <ThemeSelector />
        </SidebarFooter>
      </Sidebar>

      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem ? activeItem.name : "Select a Folder"}
            </div>
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground gap-2">
                <Inbox className="h-10 w-10 opacity-20" />
                <p className="text-sm">No items for now</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}