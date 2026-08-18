import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

const links = [
  { to: '/', label: 'Home' },
  { to: '/todo', label: 'Todo (D1)' },
  { to: '/kv', label: 'KV' },
  { to: '/r2', label: 'R2' },
  { to: '/counter', label: 'Counter (DO)' }
]

const RootComponent = () => {
  return (
    <div className='min-h-screen flex flex-col'>
      <header className='border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'>
        <nav className='max-w-3xl mx-auto px-4 h-14 flex items-center gap-4 overflow-x-auto'>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className='text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 whitespace-nowrap'
              activeProps={{ className: 'text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap' }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href='/docs'
            target='_blank'
            rel='noreferrer'
            className='ml-auto text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 whitespace-nowrap'
          >
            API Docs
          </a>
        </nav>
      </header>
      <main className='flex-1 max-w-3xl w-full mx-auto px-4 py-8'>
        <Outlet />
      </main>
      <footer className='border-t border-zinc-200 dark:border-zinc-800 py-4 text-center text-xs text-zinc-400'>
        v{__APP_VERSION__} ({__GIT_HASH__})
      </footer>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent
})
