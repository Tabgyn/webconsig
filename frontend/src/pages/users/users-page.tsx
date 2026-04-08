import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { useCurrentUser } from '@/hooks/use-current-user'
import { usePermissions } from '@/hooks/use-permissions'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CurrentUser, Role } from '@/types'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  hr_manager: 'Gestor de RH',
  employee: 'Servidor',
  institution_manager: 'Gestor de Entidade',
  representative: 'Representante',
}

const ROLE_OPTIONS = (Object.entries(ROLE_LABELS) as [Role, string][]).map(
  ([value, label]) => ({ value, label }),
)

const col = createColumnHelper<CurrentUser>()

export function UsersPage() {
  const user = useCurrentUser()
  const { can } = usePermissions()
  const queryClient = useQueryClient()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<Role>('representative')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<Role>('representative')

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ data: CurrentUser[] }>('/users'),
  })

  const addUser = useMutation({
    mutationFn: (body: { name: string; email: string; role: Role }) =>
      api.post<{ data: CurrentUser }>('/users', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowAddForm(false)
      setNewName('')
      setNewEmail('')
      setNewRole('representative')
    },
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api.patch<{ data: CurrentUser }>(`/users/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingId(null)
    },
  })

  const removeUser = useMutation({
    mutationFn: (id: string) => api.delete<Record<string, never>>(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const users = data?.data ?? []

  const columns = [
    col.accessor('name', { header: 'Nome' }),
    col.accessor('email', { header: 'E-mail' }),
    col.accessor('role', {
      header: 'Papel',
      cell: (info) => {
        const u = info.row.original
        if (editingId === u.id) {
          return (
            <select
              aria-label="Papel"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as Role)}
              className="rounded border px-2 py-1 text-sm"
            >
              {ROLE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )
        }
        return ROLE_LABELS[info.getValue()]
      },
    }),
    ...(can('edit', 'users') || can('delete', 'users')
      ? [
          col.display({
            id: 'actions',
            header: 'Ações',
            cell: (info) => {
              const u = info.row.original
              const isSelf = u.id === user.id
              if (editingId === u.id) {
                return (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={updateRole.isPending}
                      onClick={() => updateRole.mutate({ id: u.id, role: editRole })}
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )
              }
              return (
                <div className="flex gap-2">
                  {can('edit', 'users') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setEditingId(u.id)
                        setEditRole(u.role)
                      }}
                    >
                      Alterar Papel
                    </Button>
                  )}
                  {can('delete', 'users') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50 h-7 text-xs"
                      disabled={isSelf || removeUser.isPending}
                      onClick={() => removeUser.mutate(u.id)}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              )
            },
          }),
        ]
      : []),
  ]

  return (
    <PageShell
      title="Usuários"
      description="Gerenciamento de usuários do sistema."
      action={
        can('create', 'users') ? (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowAddForm((v) => !v)}
          >
            + Adicionar Usuário
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {showAddForm && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-medium text-slate-800">Novo Usuário</p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[180px] space-y-1">
                <Label htmlFor="new-name">Nome</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label htmlFor="new-email">E-mail</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="min-w-[180px] space-y-1">
                <Label htmlFor="new-role">Papel</Label>
                <select
                  id="new-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                disabled={addUser.isPending || !newName.trim() || !newEmail.trim()}
                onClick={() =>
                  addUser.mutate({ name: newName.trim(), email: newEmail.trim(), role: newRole })
                }
              >
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          searchPlaceholder="Buscar por nome ou e-mail..."
        />
      </div>
    </PageShell>
  )
}
