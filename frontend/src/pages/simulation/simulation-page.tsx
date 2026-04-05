import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import type { SimulationResult } from '@/types'

const simulationSchema = z.object({
  installmentValue: z.coerce
    .number({ invalid_type_error: 'Informe um valor válido' })
    .positive('Valor da parcela deve ser positivo'),
  installments: z.coerce
    .number({ invalid_type_error: 'Informe um número válido' })
    .int()
    .min(1, 'Mínimo 1 parcela')
    .max(96, 'Máximo 96 parcelas'),
  interestRate: z.coerce
    .number({ invalid_type_error: 'Informe uma taxa válida' })
    .positive('Taxa deve ser positiva')
    .max(10, 'Taxa máxima: 10% a.m.'),
})

type SimulationFormValues = z.infer<typeof simulationSchema>

export function SimulationPage() {
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationSchema),
    defaultValues: { installmentValue: undefined, installments: undefined, interestRate: undefined },
  })

  async function onSubmit(values: SimulationFormValues) {
    setIsCalculating(true)
    try {
      const data = await api.post<SimulationResult>('/simulation/calculate', values)
      setResult(data)
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <PageShell
      title="Simulação de Empréstimo"
      description="Calcule o valor liberado e o custo total de um empréstimo consignado."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input form */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Dados do Empréstimo</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="installmentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Parcela (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 350,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 48" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Juros (% a.m.)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 1.80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isCalculating}
              >
                {isCalculating ? 'Calculando...' : 'Calcular'}
              </Button>
            </form>
          </Form>
        </div>

        {/* Results */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Resultado da Simulação</h3>
          {result ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Valor Liberado ao Servidor</p>
                <p className="mt-1 text-3xl font-bold text-blue-600">
                  {formatCurrency(result.releasedValue)}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Total a Pagar</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">
                    {formatCurrency(result.totalValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Custo do Financiamento</p>
                  <p className="mt-1 text-lg font-semibold text-red-600">
                    {formatCurrency(result.financingCost)}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                Simulação calculada com base nos dados informados. Sujeita a análise e aprovação da entidade conveniada.
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              Preencha os dados e clique em Calcular para ver o resultado.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
