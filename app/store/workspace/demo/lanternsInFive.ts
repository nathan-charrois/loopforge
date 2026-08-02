import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import { createBlock, createChordEvent, createChordSymbol, createDrumHitEvent, createDrumInstrument, createDrumPieceSound, createKeyEvent, createMelodicInstrument, createMeterEvent, createMixChannel, createMixer, createNoteEvent, createPattern, createProject, createProjectMetadata, createSection, createTempoEvent, createTimeline, createTrack, type DrumPiece, type DurationTicks, type Instrument, type MidiNote, PPQ, type Tick, type Velocity } from '~/domain'
import { createEntityStore } from '~/store/type'

export function lanternsInFive(): Workspace {
  const fourFourBarTicks = PPQ * 4
  const fiveFourBarTicks = PPQ * 5
  const threeFourBarTicks = PPQ * 3
  const openingStartTick = 0
  const fiveStartTick = fourFourBarTicks * 2
  const releaseStartTick = fiveStartTick + (fiveFourBarTicks * 2)
  const turnStartTick = releaseStartTick + (fourFourBarTicks * 2)
  const homeStartTick = turnStartTick + threeFourBarTicks
  const guitarTrack = createTrack({
    id: 'lanterns_track_guitar',
    instrumentId: 'guitar.default',
    name: 'Guitar',
    role: 'melody',
  })
  const voicingsTrack = createTrack({
    id: 'lanterns_track_voicings',
    instrumentId: 'guitar.default',
    name: 'Guitar Voicings',
    role: 'chords',
  })
  const bassTrack = createTrack({
    id: 'lanterns_track_bass',
    name: 'Upright Bass',
    role: 'bass',
  })
  const drumsTrack = createTrack({
    id: 'lanterns_track_drums',
    name: 'Drums',
    role: 'drums',
  })
  const tracks = [
    guitarTrack,
    voicingsTrack,
    bassTrack,
    drumsTrack,
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: '#f08c46',
          id: 'lanterns_block_guitar_opening',
          lengthTicks: fiveStartTick,
          name: 'Guitar — Lantern Theme',
          patternId: 'lanterns_pattern_guitar_opening',
          playbackMode: 'oneShot',
          startTick: openingStartTick,
          trackId: guitarTrack.id,
        }),
        createBlock({
          color: '#e8590c',
          id: 'lanterns_block_guitar_five',
          lengthTicks: releaseStartTick - fiveStartTick,
          name: 'Guitar — Crooked Answer',
          patternId: 'lanterns_pattern_guitar_five',
          playbackMode: 'oneShot',
          startTick: fiveStartTick,
          trackId: guitarTrack.id,
        }),
        createBlock({
          color: '#f76707',
          id: 'lanterns_block_guitar_release',
          lengthTicks: turnStartTick - releaseStartTick,
          name: 'Guitar — Open Sky',
          patternId: 'lanterns_pattern_guitar_release',
          playbackMode: 'oneShot',
          startTick: releaseStartTick,
          trackId: guitarTrack.id,
        }),
        createBlock({
          color: '#d9480f',
          id: 'lanterns_block_guitar_turn',
          lengthTicks: homeStartTick + fourFourBarTicks - turnStartTick,
          name: 'Guitar — Turn and Home',
          patternId: 'lanterns_pattern_guitar_turn',
          playbackMode: 'oneShot',
          startTick: turnStartTick,
          trackId: guitarTrack.id,
        }),
        createBlock({
          color: '#845ef7',
          id: 'lanterns_block_voicings_opening',
          lengthTicks: fiveStartTick,
          name: 'Voicings — Lantern Theme',
          patternId: 'lanterns_pattern_voicings_opening',
          playbackMode: 'oneShot',
          startTick: openingStartTick,
          trackId: voicingsTrack.id,
        }),
        createBlock({
          color: '#7950f2',
          id: 'lanterns_block_voicings_five',
          lengthTicks: releaseStartTick - fiveStartTick,
          name: 'Voicings — Five',
          patternId: 'lanterns_pattern_voicings_five',
          playbackMode: 'oneShot',
          startTick: fiveStartTick,
          trackId: voicingsTrack.id,
        }),
        createBlock({
          color: '#7048e8',
          id: 'lanterns_block_voicings_release',
          lengthTicks: turnStartTick - releaseStartTick,
          name: 'Voicings — Release',
          patternId: 'lanterns_pattern_voicings_release',
          playbackMode: 'oneShot',
          startTick: releaseStartTick,
          trackId: voicingsTrack.id,
        }),
        createBlock({
          color: '#6741d9',
          id: 'lanterns_block_voicings_turn',
          lengthTicks: homeStartTick + fourFourBarTicks - turnStartTick,
          name: 'Voicings — Turn and Home',
          patternId: 'lanterns_pattern_voicings_turn',
          playbackMode: 'oneShot',
          startTick: turnStartTick,
          trackId: voicingsTrack.id,
        }),
        createBlock({
          color: '#20c997',
          id: 'lanterns_block_bass_opening',
          lengthTicks: fiveStartTick,
          name: 'Bass — Warm Floor',
          patternId: 'lanterns_pattern_bass_opening',
          playbackMode: 'oneShot',
          startTick: openingStartTick,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: '#12b886',
          id: 'lanterns_block_bass_five',
          lengthTicks: releaseStartTick - fiveStartTick,
          name: 'Bass — Five Walk',
          patternId: 'lanterns_pattern_bass_five',
          playbackMode: 'oneShot',
          startTick: fiveStartTick,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: '#0ca678',
          id: 'lanterns_block_bass_release',
          lengthTicks: turnStartTick - releaseStartTick,
          name: 'Bass — Release',
          patternId: 'lanterns_pattern_bass_release',
          playbackMode: 'oneShot',
          startTick: releaseStartTick,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: '#099268',
          id: 'lanterns_block_bass_turn',
          lengthTicks: homeStartTick + fourFourBarTicks - turnStartTick,
          name: 'Bass — Turn and Home',
          patternId: 'lanterns_pattern_bass_turn',
          playbackMode: 'oneShot',
          startTick: turnStartTick,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: '#ffd43b',
          id: 'lanterns_block_drums_opening',
          lengthTicks: fiveStartTick,
          name: 'Deep Pocket — Loose Time',
          patternId: 'lanterns_pattern_drums_opening',
          playbackMode: 'oneShot',
          startTick: openingStartTick,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: '#fcc419',
          id: 'lanterns_block_drums_five',
          lengthTicks: releaseStartTick - fiveStartTick,
          name: 'Hats — Three Plus Two',
          patternId: 'lanterns_pattern_drums_five',
          playbackMode: 'oneShot',
          startTick: fiveStartTick,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: '#fab005',
          id: 'lanterns_block_drums_release',
          lengthTicks: turnStartTick - releaseStartTick,
          name: 'Hats — Open Sky',
          patternId: 'lanterns_pattern_drums_release',
          playbackMode: 'oneShot',
          startTick: releaseStartTick,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: '#f59f00',
          id: 'lanterns_block_drums_turn',
          lengthTicks: homeStartTick + fourFourBarTicks - turnStartTick,
          name: 'Drums — Short Bar, Long Landing',
          patternId: 'lanterns_pattern_drums_turn',
          playbackMode: 'oneShot',
          startTick: turnStartTick,
          trackId: drumsTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'lanterns_section_theme',
          lengthTicks: fiveStartTick,
          name: 'Theme · 4/4',
          startTick: openingStartTick,
        }),
        createSection({
          id: 'lanterns_section_five',
          lengthTicks: releaseStartTick - fiveStartTick,
          name: 'Crooked Answer · 5/4',
          startTick: fiveStartTick,
        }),
        createSection({
          id: 'lanterns_section_release',
          lengthTicks: turnStartTick - releaseStartTick,
          name: 'Release · 4/4',
          startTick: releaseStartTick,
        }),
        createSection({
          id: 'lanterns_section_turn',
          lengthTicks: homeStartTick + fourFourBarTicks - turnStartTick,
          name: 'Turn · 3/4 → 4/4',
          startTick: turnStartTick,
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createMelodicInstrument({
        id: 'guitar.default',
        name: 'Hollow-Body Guitar',
        soundId: 'guitar.default',
      }),
      createMelodicInstrument({
        id: 'bass.default',
        name: 'Upright Bass',
        soundId: 'bass.default',
      }),
      createDrumInstrument({
        id: 'drums.default',
        name: 'Jazz Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            soundId: 'drums.closedHat.default',
            volumeDb: -8,
          }),
          crash: createDrumPieceSound({
            soundId: 'drums.crash.default',
            volumeDb: -3,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.42,
            pitchSemitones: -7,
            soundId: 'drums.kick.default',
            volumeDb: 10,
          }),
          lowTom: createDrumPieceSound({
            pitchSemitones: -2,
            soundId: 'drums.lowTom.default',
            volumeDb: -2,
          }),
          openHat: createDrumPieceSound({
            soundId: 'drums.openHat.default',
            volumeDb: -9,
          }),
          ride: createDrumPieceSound({
            pitchSemitones: -2,
            soundId: 'drums.ride.default',
            volumeDb: -8,
          }),
          snare: createDrumPieceSound({
            pitchSemitones: -1,
            soundId: 'drums.snare.default',
            volumeDb: -5,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({
          id: guitarTrack.mixChannelId,
          pan: -0.25,
          volumeDb: -1,
        }),
        createMixChannel({
          id: voicingsTrack.mixChannelId,
          pan: 0.25,
          volumeDb: -8,
        }),
        createMixChannel({
          id: bassTrack.mixChannelId,
          pan: -0.25,
          volumeDb: -7,
        }),
        createMixChannel({
          id: drumsTrack.mixChannelId,
          pan: 0.25,
          volumeDb: 8,
        }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createNoteEvents('lanterns_event_guitar_opening', [
          [PPQ / 2, 66, PPQ * 3 / 4, 92],
          [PPQ + (PPQ / 2), 69, PPQ, 84],
          [(PPQ * 2) + (PPQ * 3 / 4), 64, PPQ * 3 / 4, 88],
          [fourFourBarTicks - (PPQ / 4), 62, PPQ, 94],
          [fourFourBarTicks + PPQ, 71, PPQ / 2, 82],
          [fourFourBarTicks + PPQ + (PPQ * 3 / 4), 61, PPQ * 3 / 4, 90],
          [fourFourBarTicks + (PPQ * 2) + (PPQ * 3 / 4), 64, PPQ / 2, 86],
          [fiveStartTick - (PPQ / 2), 66, PPQ / 2, 96],
        ]),
        id: 'lanterns_pattern_guitar_opening',
        kind: 'note',
        lengthTicks: fiveStartTick,
        name: 'Guitar — Lantern Theme',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_guitar_five', [
          [0, 67, PPQ, 94],
          [PPQ + (PPQ / 2), 71, PPQ / 2, 84],
          [(PPQ * 2) + (PPQ / 4), 66, PPQ, 90],
          [(PPQ * 3) + (PPQ * 3 / 4), 61, PPQ * 3 / 4, 86],
          [fiveFourBarTicks - (PPQ / 2), 62, PPQ / 2, 92],
          [fiveFourBarTicks + (PPQ / 2), 66, PPQ * 3 / 4, 94],
          [fiveFourBarTicks + PPQ + (PPQ * 3 / 4), 69, PPQ / 2, 88],
          [fiveFourBarTicks + (PPQ * 2) + (PPQ * 3 / 4), 64, PPQ, 90],
          [fiveFourBarTicks + (PPQ * 3) + (PPQ * 3 / 4), 71, PPQ * 3 / 4, 84],
          [(fiveFourBarTicks * 2) - (PPQ / 2), 61, PPQ / 2, 96],
        ]),
        id: 'lanterns_pattern_guitar_five',
        kind: 'note',
        lengthTicks: fiveFourBarTicks * 2,
        name: 'Guitar — Crooked Answer',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_guitar_release', [
          [0, 64, PPQ / 2, 90],
          [PPQ, 66, PPQ * 3 / 4, 86],
          [PPQ * 2, 69, PPQ, 94],
          [(PPQ * 3) + (PPQ / 2), 61, PPQ / 2, 82],
          [fourFourBarTicks + (PPQ / 2), 62, PPQ + (PPQ / 2), 98],
          [fourFourBarTicks + (PPQ * 2) + (PPQ / 4), 66, PPQ * 3 / 4, 88],
          [fourFourBarTicks + (PPQ * 3), 69, PPQ / 2, 92],
          [(fourFourBarTicks * 2) - (PPQ / 4), 64, PPQ / 4, 84],
        ]),
        id: 'lanterns_pattern_guitar_release',
        kind: 'note',
        lengthTicks: fourFourBarTicks * 2,
        name: 'Guitar — Open Sky',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_guitar_turn', [
          [0, 70, PPQ * 3 / 4, 90],
          [PPQ, 69, PPQ / 2, 84],
          [PPQ + (PPQ * 3 / 4), 66, PPQ * 3 / 4, 92],
          [(PPQ * 2) + (PPQ / 2), 64, PPQ / 2, 86],
          [threeFourBarTicks, 62, PPQ + (PPQ / 2), 100],
          [threeFourBarTicks + (PPQ * 2), 66, PPQ * 3 / 4, 90],
          [threeFourBarTicks + (PPQ * 3), 69, PPQ / 2, 86],
          [threeFourBarTicks + (PPQ * 3) + (PPQ * 3 / 4), 61, PPQ / 4, 82],
        ]),
        id: 'lanterns_pattern_guitar_turn',
        kind: 'note',
        lengthTicks: threeFourBarTicks + fourFourBarTicks,
        name: 'Guitar — Turn and Home',
      }),
      createPattern({
        events: [
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['maj7', '9'],
              quality: 'major',
              root: 2,
            }),
            durationTicks: PPQ * 3,
            id: 'lanterns_event_voicings_opening_1',
            playback: { gate: 0.68, recipeId: 'block_staggered' },
            timeTick: 0,
            velocity: 72,
            voicing: { register: 'mid', type: 'spread' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['7'],
              quality: 'sus4',
              root: 9,
            }),
            durationTicks: PPQ,
            id: 'lanterns_event_voicings_opening_2',
            playback: { gate: 0.72, recipeId: 'block_staggered' },
            timeTick: PPQ * 3,
            velocity: 66,
            voicing: { inversion: 1, register: 'mid', type: 'drop2' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['11'],
              quality: 'minor',
              root: 11,
            }),
            durationTicks: PPQ * 2,
            id: 'lanterns_event_voicings_opening_3',
            playback: { gate: 0.7, recipeId: 'block_staggered' },
            timeTick: fourFourBarTicks,
            velocity: 70,
            voicing: { register: 'mid', type: 'spread' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['b9'],
              extensions: ['7'],
              quality: 'major',
              root: 4,
            }),
            durationTicks: PPQ * 2,
            id: 'lanterns_event_voicings_opening_4',
            playback: { gate: 0.64, recipeId: 'block_staggered' },
            timeTick: fourFourBarTicks + (PPQ * 2),
            velocity: 68,
            voicing: { inversion: 1, register: 'mid', type: 'drop2' },
          }),
        ],
        id: 'lanterns_pattern_voicings_opening',
        kind: 'chord',
        lengthTicks: fiveStartTick,
        name: 'Voicings — Lantern Theme',
      }),
      createPattern({
        events: [
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['#11'],
              extensions: ['maj7'],
              quality: 'major',
              root: 7,
            }),
            durationTicks: PPQ * 3,
            id: 'lanterns_event_voicings_five_1',
            playback: { gate: 0.7, recipeId: 'block_staggered' },
            timeTick: 0,
            velocity: 72,
            voicing: { register: 'mid', type: 'spread' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['7'],
              quality: 'diminished',
              root: 1,
            }),
            durationTicks: PPQ * 2,
            id: 'lanterns_event_voicings_five_2',
            playback: { gate: 0.62, recipeId: 'block_staggered' },
            timeTick: PPQ * 3,
            velocity: 64,
            voicing: { inversion: 1, register: 'mid', type: 'drop2' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['9'],
              quality: 'minor',
              root: 6,
            }),
            durationTicks: PPQ * 5 / 2,
            id: 'lanterns_event_voicings_five_3',
            playback: { gate: 0.72, recipeId: 'block_staggered' },
            timeTick: fiveFourBarTicks,
            velocity: 70,
            voicing: { register: 'mid', type: 'spread' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['b9'],
              extensions: ['7'],
              quality: 'major',
              root: 11,
            }),
            durationTicks: PPQ * 5 / 2,
            id: 'lanterns_event_voicings_five_4',
            playback: { gate: 0.66, recipeId: 'block_staggered' },
            timeTick: fiveFourBarTicks + (PPQ * 5 / 2),
            velocity: 68,
            voicing: { inversion: 1, register: 'mid', type: 'drop2' },
          }),
        ],
        id: 'lanterns_pattern_voicings_five',
        kind: 'chord',
        lengthTicks: fiveFourBarTicks * 2,
        name: 'Voicings — Five',
      }),
      createPattern({
        events: [
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['9'],
              quality: 'minor',
              root: 4,
            }),
            durationTicks: PPQ * 2,
            id: 'lanterns_event_voicings_release_1',
            playback: { gate: 0.7, recipeId: 'block_staggered' },
            timeTick: 0,
            velocity: 70,
            voicing: { register: 'mid', type: 'spread' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['13'],
              quality: 'major',
              root: 9,
            }),
            durationTicks: PPQ * 2,
            id: 'lanterns_event_voicings_release_2',
            playback: { gate: 0.66, recipeId: 'block_staggered' },
            timeTick: PPQ * 2,
            velocity: 68,
            voicing: { inversion: 1, register: 'mid', type: 'drop2' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['maj7', '9'],
              quality: 'major',
              root: 2,
            }),
            durationTicks: PPQ * 3,
            id: 'lanterns_event_voicings_release_3',
            playback: { gate: 0.74, recipeId: 'block_staggered' },
            timeTick: fourFourBarTicks,
            velocity: 74,
            voicing: { register: 'mid', type: 'spread' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['b9'],
              extensions: ['7'],
              quality: 'major',
              root: 6,
            }),
            durationTicks: PPQ,
            id: 'lanterns_event_voicings_release_4',
            playback: { gate: 0.62, recipeId: 'block_staggered' },
            timeTick: fourFourBarTicks + (PPQ * 3),
            velocity: 66,
            voicing: { inversion: 1, register: 'mid', type: 'drop2' },
          }),
        ],
        id: 'lanterns_pattern_voicings_release',
        kind: 'chord',
        lengthTicks: fourFourBarTicks * 2,
        name: 'Voicings — Release',
      }),
      createPattern({
        events: [
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['#11'],
              extensions: ['maj7'],
              quality: 'major',
              root: 10,
            }),
            durationTicks: PPQ * 2,
            id: 'lanterns_event_voicings_turn_1',
            playback: { gate: 0.68, recipeId: 'block_staggered' },
            timeTick: 0,
            velocity: 72,
            voicing: { register: 'mid', type: 'spread' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['b9'],
              extensions: ['7'],
              quality: 'major',
              root: 9,
            }),
            durationTicks: PPQ,
            id: 'lanterns_event_voicings_turn_2',
            playback: { gate: 0.64, recipeId: 'block_staggered' },
            timeTick: PPQ * 2,
            velocity: 68,
            voicing: { inversion: 1, register: 'mid', type: 'drop2' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['6', '9'],
              quality: 'major',
              root: 2,
            }),
            durationTicks: PPQ * 3,
            id: 'lanterns_event_voicings_turn_3',
            playback: { gate: 0.78, recipeId: 'block_staggered' },
            timeTick: threeFourBarTicks,
            velocity: 76,
            voicing: { register: 'mid', type: 'spread' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['7'],
              quality: 'sus4',
              root: 9,
            }),
            durationTicks: PPQ,
            id: 'lanterns_event_voicings_turn_4',
            playback: { gate: 0.6, recipeId: 'block_staggered' },
            timeTick: threeFourBarTicks + (PPQ * 3),
            velocity: 64,
            voicing: { inversion: 1, register: 'mid', type: 'drop2' },
          }),
        ],
        id: 'lanterns_pattern_voicings_turn',
        kind: 'chord',
        lengthTicks: threeFourBarTicks + fourFourBarTicks,
        name: 'Voicings — Turn and Home',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_bass_opening', [
          [0, 38, PPQ + (PPQ / 2), 96],
          [PPQ * 2, 45, PPQ * 3 / 4, 82],
          [PPQ * 3, 37, PPQ * 3 / 4, 86],
          [fourFourBarTicks, 47, PPQ, 94],
          [fourFourBarTicks + PPQ + (PPQ / 2), 42, PPQ / 2, 80],
          [fourFourBarTicks + (PPQ * 2), 40, PPQ, 92],
          [fiveStartTick - (PPQ / 2), 39, PPQ / 2, 78],
        ]),
        id: 'lanterns_pattern_bass_opening',
        kind: 'note',
        lengthTicks: fiveStartTick,
        name: 'Bass — Warm Floor',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_bass_five', [
          [0, 43, PPQ + (PPQ / 2), 96],
          [PPQ * 2, 38, PPQ / 2, 80],
          [PPQ * 3, 37, PPQ, 90],
          [PPQ * 4, 40, PPQ * 3 / 4, 82],
          [fiveFourBarTicks, 42, PPQ + (PPQ / 2), 94],
          [fiveFourBarTicks + (PPQ * 2), 37, PPQ / 2, 80],
          [fiveFourBarTicks + (PPQ * 3), 47, PPQ, 92],
          [fiveFourBarTicks + (PPQ * 4), 45, PPQ * 3 / 4, 84],
        ]),
        id: 'lanterns_pattern_bass_five',
        kind: 'note',
        lengthTicks: fiveFourBarTicks * 2,
        name: 'Bass — Five Walk',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_bass_release', [
          [0, 40, PPQ, 94],
          [PPQ + (PPQ / 2), 47, PPQ / 2, 80],
          [PPQ * 2, 45, PPQ, 92],
          [PPQ * 3, 37, PPQ * 3 / 4, 82],
          [fourFourBarTicks, 38, PPQ + (PPQ / 2), 98],
          [fourFourBarTicks + (PPQ * 2), 45, PPQ * 3 / 4, 82],
          [fourFourBarTicks + (PPQ * 3), 42, PPQ * 3 / 4, 88],
        ]),
        id: 'lanterns_pattern_bass_release',
        kind: 'note',
        lengthTicks: fourFourBarTicks * 2,
        name: 'Bass — Release',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_bass_turn', [
          [0, 46, PPQ, 92],
          [PPQ + (PPQ / 2), 40, PPQ / 2, 78],
          [PPQ * 2, 45, PPQ * 3 / 4, 88],
          [threeFourBarTicks, 38, PPQ + (PPQ / 2), 100],
          [threeFourBarTicks + (PPQ * 2), 45, PPQ * 3 / 4, 84],
          [threeFourBarTicks + (PPQ * 3), 37, PPQ * 3 / 4, 80],
        ]),
        id: 'lanterns_pattern_bass_turn',
        kind: 'note',
        lengthTicks: threeFourBarTicks + fourFourBarTicks,
        name: 'Bass — Turn and Home',
      }),
      createPattern({
        events: createDrumHitEvents('lanterns_event_drums_opening', [
          [0, 'kick', 94],
          [PPQ * 2, 'snare', 48],
          [fourFourBarTicks, 'kick', 88],
          [fourFourBarTicks + (PPQ * 2), 'snare', 54],
          [fourFourBarTicks + (PPQ * 2) + (PPQ / 2), 'kick', 78],
          ...createClosedHatPulse(fiveStartTick, true),
        ]),
        id: 'lanterns_pattern_drums_opening',
        kind: 'drum',
        lengthTicks: fiveStartTick,
        name: 'Deep Pocket — Loose Time',
      }),
      createPattern({
        events: createDrumHitEvents('lanterns_event_drums_five', [
          [0, 'kick', 96],
          [PPQ * 2, 'snare', 54],
          [PPQ * 3, 'kick', 84],
          [fiveFourBarTicks, 'kick', 92],
          [fiveFourBarTicks + (PPQ * 2), 'snare', 58],
          [fiveFourBarTicks + (PPQ * 3), 'kick', 82],
          ...createClosedHatPulse(fiveFourBarTicks * 2, true),
        ]),
        id: 'lanterns_pattern_drums_five',
        kind: 'drum',
        lengthTicks: fiveFourBarTicks * 2,
        name: 'Hats — Three Plus Two',
      }),
      createPattern({
        events: createDrumHitEvents('lanterns_event_drums_release', [
          [0, 'kick', 100],
          [PPQ * 2, 'snare', 60],
          [fourFourBarTicks, 'kick', 94],
          [fourFourBarTicks + (PPQ * 2), 'snare', 62],
          [fourFourBarTicks + (PPQ * 3) + (PPQ / 2), 'kick', 80],
          ...createClosedHatPulse(fourFourBarTicks * 2, true),
        ]),
        id: 'lanterns_pattern_drums_release',
        kind: 'drum',
        lengthTicks: fourFourBarTicks * 2,
        name: 'Hats — Open Sky',
      }),
      createPattern({
        events: createDrumHitEvents('lanterns_event_drums_turn', [
          [0, 'kick', 94],
          [PPQ * 2, 'snare', 52],
          [threeFourBarTicks, 'kick', 102],
          [threeFourBarTicks + (PPQ * 2), 'snare', 64],
          [threeFourBarTicks + (PPQ * 3) + (PPQ / 2), 'kick', 82],
          ...createClosedHatPulse(
            threeFourBarTicks + fourFourBarTicks,
            true,
          ),
        ]),
        id: 'lanterns_pattern_drums_turn',
        kind: 'drum',
        lengthTicks: threeFourBarTicks + fourFourBarTicks,
        name: 'Drums — Short Bar, Long Landing',
      }),
    ]),
    project: createProject({
      id: 'project_lanterns_in_five',
      metadata: createProjectMetadata({
        description: 'An open, guitar-led jazz theme that bends through five before finding home.',
        tags: ['jazz', 'guitar', 'odd-meter'],
      }),
      name: 'Lanterns in Five',
    }),
    timeline: createTimeline({
      grid: 'eighthNote',
      keyEvents: [
        createKeyEvent({ key: { mode: 'major', tonic: 2 }, tick: 0 }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'lanterns_meter_4_4_opening',
          tick: openingStartTick,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
        createMeterEvent({
          id: 'lanterns_meter_5_4',
          tick: fiveStartTick,
          timeSignature: { denominator: 4, numerator: 5 },
        }),
        createMeterEvent({
          id: 'lanterns_meter_4_4_release',
          tick: releaseStartTick,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
        createMeterEvent({
          id: 'lanterns_meter_3_4_turn',
          tick: turnStartTick,
          timeSignature: { denominator: 4, numerator: 3 },
        }),
        createMeterEvent({
          id: 'lanterns_meter_4_4_home',
          tick: homeStartTick,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 116,
          id: 'lanterns_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

type DrumHitSeed = readonly [
  timeTick: Tick,
  piece: DrumPiece,
  velocity: Velocity,
]

function createDrumHitEvents(
  idPrefix: string,
  hits: readonly DrumHitSeed[],
) {
  return hits.map(([timeTick, piece, velocity], index) => createDrumHitEvent({
    id: `${idPrefix}_${index + 1}`,
    piece,
    timeTick,
    velocity,
  }))
}

type NoteSeed = readonly [
  timeTick: Tick,
  pitch: MidiNote,
  durationTicks: DurationTicks,
  velocity: Velocity,
]

function createNoteEvents(
  idPrefix: string,
  notes: readonly NoteSeed[],
) {
  return notes.map(([timeTick, pitch, durationTicks, velocity], index) => createNoteEvent({
    durationTicks,
    id: `${idPrefix}_${index + 1}`,
    pitch,
    timeTick,
    velocity,
  }))
}

function createClosedHatPulse(
  lengthTicks: DurationTicks,
  openFinalHit = false,
): DrumHitSeed[] {
  const stepTicks = PPQ / 2
  const hitCount = Math.floor(lengthTicks / stepTicks)

  return Array.from({ length: hitCount }, (_, index) => [
    index * stepTicks,
    openFinalHit && index === hitCount - 1
      ? 'openHat'
      : 'closedHat',
    index % 2 === 0 ? 36 : 46,
  ])
}
