import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatSuporte } from '@/components/suporte/ChatSuporte'

export const metadata = { title: 'Suporte' }

export default async function SuportePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/suporte')

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fale conosco</h1>
        <p className="text-sm text-gray-400">Dúvidas sobre um ebook, pagamento ou acesso? É só chamar.</p>
      </div>
      <ChatSuporte />
    </div>
  )
}
