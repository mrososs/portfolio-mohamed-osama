import { useTheme } from 'vuetify'

/**
 * Cookie-persisted light/dark theme. Reading the cookie during SSR means
 * the server renders the correct theme — no flash on load.
 */
export function useSiteTheme() {
  const theme = useTheme()
  const cookie = useCookie<'dark' | 'light'>('portfolio-theme', {
    default: () => 'dark',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  if (theme.global.name.value !== cookie.value) {
    theme.change(cookie.value)
  }

  const isDark = computed(() => theme.global.current.value.dark)

  function toggleTheme() {
    const next = isDark.value ? 'light' : 'dark'
    theme.change(next)
    cookie.value = next
  }

  return { isDark, toggleTheme }
}
