import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Plainly Videos personalized videos example" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  notFoundComponent: () => <p>The requested page could not be found.</p>,
  shellComponent: RootDocument,
});

const links = [
  {
    href: "https://help.plainlyvideos.com/",
    icon: "/file.svg",
    label: "Learn",
  },
  {
    href: "https://github.com/plainly-videos/video-automation-examples/tree/master/plainly-personalized-videos",
    icon: "/github-142-svgrepo-com.svg",
    label: "GitHub",
  },
  {
    href: "https://app.plainlyvideos.com/",
    icon: "/globe.svg",
    label: "Open Plainly",
  },
];

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh font-sans antialiased">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
            <div className="flex items-center gap-3">
              <img
                src="/plainly-logo-black.png"
                alt="Plainly Videos logo"
                width={83}
                height={24}
                className="dark:hidden"
              />
              <img
                src="/plainly-logo-white.png"
                alt="Plainly Videos logo"
                width={83}
                height={24}
                className="hidden dark:block"
              />
              <span className="hidden border-l pl-3 text-sm text-muted-foreground sm:inline">
                Personalized videos
              </span>
            </div>
            <NavigationMenu>
              <NavigationMenuList>
                {links.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <img
                        aria-hidden
                        src={link.icon}
                        alt=""
                        width={16}
                        height={16}
                        className="dark:invert"
                      />
                      <span className="hidden sm:inline">{link.label}</span>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </header>
        <main className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          {children}
        </main>
        <Scripts />
      </body>
    </html>
  );
}
