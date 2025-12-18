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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu"
import { useTheme } from "@repo/ui/components/theme-provider"
import { useAuth } from "../context/auth-context.js";

export type ItemProps = {
  groupName: string,
  items: {
    title: string,
    url: string,
    icon: LucideIcon
  }[]
}[]

export default function AppSidebar({ name, groups }: { name: string, groups: ItemProps }) {
  const { setTheme } = useTheme()
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
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" onClick={logout}>
            <LogOut />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}