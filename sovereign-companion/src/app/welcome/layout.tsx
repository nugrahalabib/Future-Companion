/**
 * Standalone layout for the public welcome page. Strips out the
 * LanguageSwitcher and any nav so the welcome screen renders as a pure
 * full-bleed kiosk surface — nothing on screen except the giant button
 * (and whatever the welcome page itself decides to show).
 *
 * The booth operator points NPM (or any other reverse proxy) at this
 * route under welcompanion.agentbuff.id. For dev, it lives at
 * http://localhost:2970/welcome.
 */

export default function WelcomeRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen bg-obsidian">{children}</div>;
}
