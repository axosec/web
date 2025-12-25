import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/ui/sidebar"
import { LogOut, LucideIcon, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";


import { Button } from "@repo/ui/components/ui/button"
import { useAuth } from "../context/auth-context.js";
import { ThemeSelector } from "./theme-selector.js";

export type ItemProps = {
  groupName: string,
  items: {
    title: string,
    url: string,
    icon: LucideIcon
  }[]
}[]

export default function AppSidebar({ name, groups }: { name: string, groups: ItemProps }) {
  const { logout } = useAuth()
  return (
    <Sidebar>
      <SidebarHeader>
        {name}
      </SidebarHeader>
      <SidebarContent>
        {groups.map(group => (
          <SidebarGroup>
            <SidebarGroupLabel>{group.groupName}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<Link to={item.url} />}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        ))}

      </SidebarContent>
      <SidebarFooter>
        <div className="flex justify-center gap-4">
          <ThemeSelector />
          <Button variant="outline" size="icon" onClick={logout}>
            <LogOut />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}