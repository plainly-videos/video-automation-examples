import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
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

const footerLinks = [
  {
    href: "https://help.plainlyvideos.com/",
    icon: "/file.svg",
    label: "Learn",
  },
  {
    href: "https://github.com/plainly-videos/video-automation-examples/tree/master/plainly-personalized-videos",
    icon: "/github-142-svgrepo-com.svg",
    label: "View on GitHub",
  },
  {
    href: "https://app.plainlyvideos.com/",
    icon: "/globe.svg",
    label: "Go to app.plainlyvideos.com →",
  },
];

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <div className="mx-auto flex min-h-svh max-w-6xl flex-col items-center gap-10 px-4 py-12">
          <img
            src="/plainly-logo-black.png"
            alt="Plainly Videos logo"
            width={160}
            height={32}
            className="dark:hidden"
          />
          <img
            src="/plainly-logo-white.png"
            alt="Plainly Videos logo"
            width={160}
            height={32}
            className="hidden dark:block"
          />
          <main className="flex w-full flex-col gap-8">{children}</main>
          <footer className="mt-auto flex flex-wrap items-center justify-center gap-6 text-sm">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              >
                <img
                  aria-hidden
                  src={link.icon}
                  alt=""
                  width={16}
                  height={16}
                />
                {link.label}
              </a>
            ))}
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
