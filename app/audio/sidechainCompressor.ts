const preparedContexts = new WeakSet<BaseAudioContext>()
const pendingContexts = new WeakMap<BaseAudioContext, Promise<void>>()

export async function prepareSidechainCompressor(
  context: BaseAudioContext,
): Promise<void> {
  if (preparedContexts.has(context)) {
    return
  }

  const pending = pendingContexts.get(context)

  if (pending !== undefined) {
    return pending
  }

  if (context.audioWorklet === undefined) {
    throw new Error('AudioWorklet is required for sidechain compression.')
  }

  const preparation = context.audioWorklet
    .addModule(new URL('./sidechainCompressorProcessor.js', import.meta.url))
    .then(() => {
      preparedContexts.add(context)
      pendingContexts.delete(context)
    })
    .catch((error: unknown) => {
      pendingContexts.delete(context)
      throw error
    })

  pendingContexts.set(context, preparation)

  return preparation
}

export function isSidechainCompressorPrepared(
  context: BaseAudioContext,
): boolean {
  return preparedContexts.has(context)
}
