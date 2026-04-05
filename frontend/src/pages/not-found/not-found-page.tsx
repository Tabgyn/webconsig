import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <h1 className="text-6xl font-bold text-slate-300">404</h1>
      <p className="text-lg text-slate-600">Página não encontrada.</p>
      <Link to="/" className="text-blue-600 hover:underline text-sm">
        ← Ir para o Início
      </Link>
    </div>
  )
}
