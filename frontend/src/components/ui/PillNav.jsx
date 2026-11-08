/**
 * Floating icon navigation. Every item carries a visible tooltip on hover or
 * focus and an accessible name.
 * @param {{ items: Array<{ label: string, href: string, icon: Function, onClick?: Function, accent?: boolean, external?: boolean, current?: boolean }> }} props
 */
export default function PillNav({ items, label = "Main" }) {
  return (
    <nav className="pill-nav" aria-label={label}>
      {items.map(({ label: name, href, icon: Icon, onClick, accent, external, current }) => (
        <a
          key={name}
          href={href}
          onClick={onClick}
          className={`pill-nav__item${accent ? " pill-nav__item--accent" : ""}`}
          aria-label={name}
          aria-current={current ? "page" : undefined}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <Icon size={20} />
          <span className="pill-nav__tip" aria-hidden="true">
            {name}
          </span>
        </a>
      ))}
    </nav>
  );
}
