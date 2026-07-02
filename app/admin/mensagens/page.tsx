import { AdminMensagens } from '@/components/admin/AdminMensagens'

export default function AdminMensagensPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
        <p className="text-sm text-gray-400">Responda as dúvidas dos clientes.</p>
      </div>
      <AdminMensagens />
    </div>
  )
}
