import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { ButtonLink } from '../../components/ui'
import { t } from '../../i18n/strings'
import { FeatureTour } from './FeatureTour'
import { useDemoLogin } from './useDemoLogin'

/** Standalone feature tour — one feature per tab, sized for screenshots. */
export function Features() {
  const { busy, tryFeature } = useDemoLogin()
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute -left-40 -top-40 -z-10 size-[30rem] animate-blob rounded-full bg-teal-glow/20 blur-3xl" />
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Logo />
          </Link>
          <span className="hidden h-6 w-px bg-line-strong sm:block" />
          <span className="hidden text-lg font-semibold text-navy-500 sm:block">{t.tour.eyebrow}</span>
        </div>
        <ButtonLink to="/login" variant="secondary">
          {t.landing.logIn}
        </ButtonLink>
      </header>
      <FeatureTour onTry={tryFeature} busy={busy} heading={false} />
      <footer className="mx-auto max-w-7xl px-5 pb-8 text-center text-sm text-navy-500 sm:px-8">{t.app.fictional}</footer>
    </div>
  )
}
