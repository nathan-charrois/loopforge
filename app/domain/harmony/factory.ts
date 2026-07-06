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
  bass?: PitchClass
}): ChordSymbol {
  return {
    alterations: input.alterations ?? [],
    bass: input.bass,
    extensions: input.extensions ?? [],
    quality: input.quality ?? 'major',
    root: input.root,
  }
}
