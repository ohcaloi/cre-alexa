// REFERENCE header account control on the @theme tokens: "Log in" for a visitor; account
// link + log-out for a member. Correct and complete; per the skill's model you design your
// own on useMember. Mount client:only="react" — it reads browser session state.
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useMember } from "../../hooks/members/useMember";

export interface LinkLikeProps {
  href: string;
  className?: string;
  children?: ReactNode;
}

const PlainLink = ({ href, className, children }: LinkLikeProps) => (
  <a href={href} className={className}>
    {children}
  </a>
);

export interface MemberMenuProps {
  accountHref?: string;
  loginHref?: string;
  LinkComponent?: ComponentType<LinkLikeProps>;
}

type CommunitySession = { signedIn: boolean; name?: string; photo?: string | null };

// "Test Member" -> "TM"; one word -> its first letter.
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("") || "M";

// One request per page: the phone menu script in SiteLayout may already have started it.
function communitySession(): Promise<CommunitySession> {
  const page = window as typeof window & { __creSession?: Promise<CommunitySession> };
  page.__creSession ??= fetch("/api/community/session", { credentials: "same-origin", cache: "no-store" })
    .then((reply) => (reply.ok ? reply.json() : { signedIn: false }))
    .catch(() => ({ signedIn: false }));
  return page.__creSession;
}

// Header menu for members signed in with an emailed code: name chip that opens
// dashboard, security and sign-out.
function CommunityMemberMenu({ name, photo }: { name: string; photo?: string | null }) {
  const [open, setOpen] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <div className="community-member-menu" ref={root}>
      <button type="button" className="community-member-chip" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        {photo && !photoFailed
          ? <img className="community-member-photo" src={photo} alt="" width={34} height={34} onError={() => setPhotoFailed(true)} />
          : <span className="community-member-initial" aria-hidden="true">{initialsOf(name)}</span>}
        <span className="community-member-name">{name}</span>
        <span className="community-member-caret" aria-hidden="true"></span>
      </button>
      {open && (
        <div className="community-member-pop">
          <a href="/community/account">Your dashboard</a>
          <a href="/community/security">Account security</a>
          <form method="post" action="/api/community/action">
            <button name="action" value="logout">Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function MemberMenu({
  accountHref = "/account",
  loginHref = "/login",
  LinkComponent = PlainLink,
}: MemberMenuProps) {
  const { member, loggedIn, loading, logout } = useMember();
  // Members who signed in with an emailed code have a CRE Alexa session, not a Wix one.
  // That cookie is HttpOnly, so ask the server: undefined = still checking.
  const [community, setCommunity] = useState<CommunitySession | undefined>();
  useEffect(() => {
    if (loading || loggedIn) return;
    let live = true;
    communitySession().then((session) => { if (live) setCommunity(session); });
    return () => { live = false; };
  }, [loading, loggedIn]);

  if (loading || (!loggedIn && community === undefined)) {
    return (
      <span
        className="inline-block h-8 w-16 animate-pulse rounded-control bg-secondary"
        aria-hidden="true"
      />
    );
  }

  if (!loggedIn && community?.signedIn) {
    return <CommunityMemberMenu name={community.name ?? "My account"} photo={community.photo} />;
  }

  if (!loggedIn) {
    return (
      <a
        href={loginHref}
        className="rounded-control bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Log in
      </a>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <LinkComponent
        href={accountHref}
        className="flex items-center gap-2 text-sm font-medium text-foreground no-underline transition-colors hover:text-muted-foreground"
      >
        {member?.photoUrl ? (
          <img
            src={member.photoUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            {(member?.displayName ?? "M").slice(0, 1).toUpperCase()}
          </span>
        )}
        {member?.displayName ?? "My account"}
      </LinkComponent>
      <button
        type="button"
        onClick={() => void logout()}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Log out
      </button>
    </span>
  );
}
