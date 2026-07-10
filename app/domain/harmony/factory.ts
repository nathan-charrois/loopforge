import type { PitchClass } from '../musicPrimitives'
import type { ChordAlteration, ChordExtension, ChordQuality } from './constants'
import type { ChordSymbol, Key } from './harmony'

export function createDefaultKey(): Key {
  return {
    mode: 'major',
    tonic: 0,
  }
}

export function createChordSymbol(input: {
  root: PitchClass
  quality?: ChordQuality
  extensions?: ChordExtension[]
  alterations?: ChordAlteration[]
}): ChordSymbol {
  return {
    alterations: input.alterations ?? [],
    extensions: input.extensions ?? [],
    quality: input.quality ?? 'major',
    root: input.root,
  }
}
