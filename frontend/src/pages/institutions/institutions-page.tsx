import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { useCurrentUser } from '@/hooks/use-current-user'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCNPJ } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Institution, Representative } from '@/types'

const col = createColumnHelper<Representative>()

export function InstitutionsPage() {
  const user = useCurrentUser()
  const { can } = usePermissions()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [showAddRep, setShowAddRep] = useState(false)
  const [newRepName, setNewRepName] = useState('')
  const [newRepEmail, setNewRepEmail] = useState('')

  const institutionId = user.institutionId!

  const { data: instResponse } = useQuery({
    queryKey: ['institution', institutionId],
    queryFn: () => api.get<{ data: Institution }>(`/institutions/${institutionId}`),
  })

  const { data: repsResponse, isLoading: repsLoading } = useQuery({
    queryKey: ['representatives', institutionId],
    queryFn: () =>
      api.get<{ data: Representative[] }>(`/institutions/${institutionId}/representatives`),
  })

  const updateInstitution = useMutation({
    mutationFn: (name: string) =>
      api.put<{ data: Institution }>(`/institutions/${institutionId}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution', institutionId] })
      setIsEditing(false)
    },
  })

  const addRep = useMutation({
    mutationFn: ({ name, email }: { name: string; email: string }) =>
      api.post<{ data: Representative }>(
        `/institutions/${institutionId}/representatives`,
        { name, email },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives', institutionId] })
      setShowAddRep(false)
      setNewRepName('')
      setNewRepEmail('')
    },
  })

  const deactivateRep = useMutation({
    mutationFn: (repId: string) =>
      api.patch<{ data: Representative }>(
        `/institutions/${institutionId}/representatives/${repId}`,
        { isActive: false },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['representatives', institutionId] }),
  })

  const institution = instResponse?.data
  const representatives = repsResponse?.data ?? []

  const repColumns = [
    col.accessor('name', { header: 'Nome' }),
    col.accessor('email', { header: 'E-mail' }),
    col.accessor('isActive', {
      header: 'Status',
      cell: (info) => (
        <span className={info.getValue() ? 'text-green-600 font-medium' : 'text-slate-400'}>
          {info.getValue() ? 'Ativo' : 'Inativo'}
        </span>
      ),
    }),
    ...(can('edit', 'institutions')
      ? [
          col.display({
            id: 'actions',
            header: 'Ações',
            cell: (info) =>
              info.row.original.isActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-700 border-red-300 hover:bg-red-50 h-7 text-xs"
                  disabled={deactivateRep.isPending}
                  onClick={() => deactivateRep.mutate(info.row.original.id)}
                >
                  Desativar
                </Button>
              ) : null,
          }),
        ]
      : []),
  ]

  return (
    <PageShell
      title="Entidades"
      description="Perfil e configurações da sua entidade credenciada."
    >
      <div className="space-y-6">
        {/* Institution profile card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Dados da Entidade</CardTitle>
            {can('edit', 'institutions') && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditName(institution?.name ?? '')
                  setIsEditing(true)
                }}
              >
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {institution ? (
              isEditing ? (
                <div className="space-y-3 max-w-sm">
                  <div className="space-y-1">
                    <Label htmlFor="inst-name">Nome da Entidade</Label>
                    <Input
                      id="inst-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={updateInstitution.isPending || !editName.trim()}
                      onClick={() => updateInstitution.mutate(editName.trim())}
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Nome</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">{institution.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">CNPJ</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">{formatCNPJ(institution.cnpj)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Status</dt>
                    <dd className={`font-medium mt-0.5 ${institution.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                      {institution.isActive ? 'Ativa' : 'Inativa'}
                    </dd>
                  </div>
                </dl>
              )
            ) : (
              <p className="text-sm text-slate-400">Carregando...</p>
            )}
          </CardContent>
        </Card>

        {/* Representatives section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Representantes</h3>
            {can('edit', 'institutions') && (
              <Button size="sm" onClick={() => setShowAddRep((v) => !v)}>
                + Adicionar Representante
              </Button>
            )}
          </div>

          {showAddRep && (
            <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-medium text-slate-800">Novo Representante</p>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px] space-y-1">
                  <Label htmlFor="rep-name">Nome</Label>
                  <Input
                    id="rep-name"
                    value={newRepName}
                    onChange={(e) => setNewRepName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label htmlFor="rep-email">E-mail</Label>
                  <Input
                    id="rep-email"
                    type="email"
                    value={newRepEmail}
                    onChange={(e) => setNewRepEmail(e.target.value)}
                    placeholder="email@entidade.com"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={addRep.isPending || !newRepName.trim() || !newRepEmail.trim()}
                  onClick={() => addRep.mutate({ name: newRepName, email: newRepEmail })}
                >
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddRep(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <DataTable
            columns={repColumns}
            data={representatives}
            isLoading={repsLoading}
            searchPlaceholder="Buscar por nome ou e-mail..."
          />
        </div>
      </div>
    </PageShell>
  )
}
