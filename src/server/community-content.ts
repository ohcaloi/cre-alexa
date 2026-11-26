export const directories = {
  events: { title: "Community events", kind: "event" },
  articles: { title: "Community articles", kind: "article" },
  venues: { title: "Venues", kind: "venue" },
  sponsors: { title: "Sponsors", kind: "sponsor" },
  vendors: { title: "Vendor directory", kind: "vendor" },
} as const;

export function directoryFor(path: string | undefined) {
  return path && Object.hasOwn(directories, path) ? directories[path as keyof typeof directories] : null;
}

export const isDemoListing = (slug: string) => slug.startsWith("demo-cre-alexa-");

export const directions = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

export const eventDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(date)) + " CT";
