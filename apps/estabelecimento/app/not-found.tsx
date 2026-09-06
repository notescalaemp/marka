export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-marka-off bg-marka-mesh bg-no-repeat px-4">
      <div className="card mx-auto max-w-lg space-y-3 p-10 text-center">
        <h1 className="text-2xl font-semibold text-marka-black">Página não encontrada</h1>
        <p className="text-sm text-marka-gray">
          O recurso que você tentou acessar não existe.
        </p>
        <a href="/dashboard" className="inline-block text-sm font-medium text-marka-green-dark underline">
          Voltar ao dashboard
        </a>
      </div>
    </div>
  );
}
