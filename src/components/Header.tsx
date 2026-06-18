interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCreateGame: () => void;
}

export function Header({ sidebarOpen, onToggleSidebar, onCreateGame }: HeaderProps) {
  return (
    <header className="h-16 bg-indigo-700 text-white flex items-center px-4 gap-3 shadow-md z-20 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-indigo-600 transition-colors"
        aria-label="Toggle sidebar"
      >
        <div className="flex flex-col gap-1.5 w-5">
          <span className={`block h-0.5 bg-white transition-all duration-300 ${sidebarOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 bg-white transition-all duration-300 ${sidebarOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 bg-white transition-all duration-300 ${sidebarOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>
      <span className="text-2xl font-bold tracking-tight select-none flex-1">
        play<span className="text-indigo-300">tabase</span>
      </span>
      <button
        onClick={onCreateGame}
        className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
      >
        <span className="text-base leading-none">+</span>
        New Game
      </button>
    </header>
  );
}
