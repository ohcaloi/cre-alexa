// REFERENCE header account control on the @theme tokens: "Log in" for a visitor; account
// link + log-out for a member. Correct and complete; per the skill's model you design your
// own on useMember. Mount client:only="react" — it reads browser session state.
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
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

export default function MemberMenu({
  accountHref = "/account",
  loginHref = "/login",
  LinkComponent = PlainLink,
}: MemberMenuProps) {
  const { member, loggedIn, loading, logout } = useMember();
  // Members who signed in with an emailed code have a CRE Alexa session, not a Wix one.
  // That cookie is HttpOnly, so ask the server: undefined = still checking.
  const [community, setCommunity] = useState<{ signedIn: boolean; name?: string } | undefined>();
  useEffect(() => {
    if (loading || loggedIn) return;
    let live = true;
    fetch("/api/community/session", { credentials: "same-origin", cache: "no-store" })
      .then((reply) => (reply.ok ? reply.json() : { signedIn: false }))
      .catch(() => ({ signedIn: false }))
      .then((session) => { if (live) setCommunity(session); });
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
    const name = community.name ?? "My account";
    return (
      <a href="/community/account" className="community-member-chip" aria-label={`Your member dashboard, ${name}`}>
        <span className="community-member-initial" aria-hidden="true">{name.trim().charAt(0).toUpperCase() || "M"}</span>
        <span className="community-member-name">{name}</span>
      </a>
    );
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
