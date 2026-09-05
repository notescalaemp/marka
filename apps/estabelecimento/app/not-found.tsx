export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-3 py-16 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-marka-gray">
        O recurso que você tentou acessar não existe.
      </p>
      <a href="/dashboard" className="text-sm text-marka-black underline">
        Voltar ao dashboard
      </a>
    </div>
  );
}
