export async function startMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./browser')
    await worker.start({ onUnhandledRequest: 'warn' })
  }
}
