import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePermissions } from '@/hooks/use-permissions'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SystemSetting } from '@/types'

export function SettingsPage() {
  const { can } = usePermissions()
  const queryClient = useQueryClient()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: SystemSetting[] }>('/settings'),
  })

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put<{ data: SystemSetting }>(`/settings/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setEditingKey(null)
    },
  })

  const settings = data?.data ?? []

  return (
    <PageShell
      title="Configurações"
      description="Parâmetros do sistema Webconsig."
    >
      {isLoading ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {settings.map((setting) => (
            <div key={setting.key} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{setting.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
                </div>
                {editingKey === setting.key ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={updateSetting.isPending || !editValue.trim()}
                      onClick={() =>
                        updateSetting.mutate({ key: setting.key, value: editValue.trim() })
                      }
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingKey(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {setting.value}
                    </span>
                    {can('edit', 'settings') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingKey(setting.key)
                          setEditValue(setting.value)
                        }}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
