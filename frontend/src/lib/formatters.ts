export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr + 'T12:00:00'))
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`
}

export function formatCompetence(competence: string): string {
  const [year, month] = competence.split('-')
  return `${month}/${year}`
}
