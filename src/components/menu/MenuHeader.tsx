type Props = { pubName: string };

export function MenuHeader({ pubName }: Props) {
  return (
    <header className="px-5 pt-7 pb-5">
      <div className="flex items-center gap-3">
        {/* Logo slot — octopus mark goes here once the asset lands. */}
        <span
          aria-hidden="true"
          className="inline-block h-8 w-8 rounded-full border border-accent/60"
          style={{
            backgroundImage:
              'radial-gradient(circle at 35% 30%, rgba(232,163,61,0.4) 0%, transparent 55%)',
          }}
        />
        <h1 className="font-display font-extrabold uppercase text-3xl tracking-widish leading-none">
          {pubName}
          <span className="text-accent">.</span>
        </h1>
      </div>
      <p className="mt-2 text-xs uppercase tracking-widest text-muted">Cenovnik</p>
    </header>
  );
}
