import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import { createBlock, createChordEvent, createChordSymbol, createDrumHitEvent, createDrumHitEvents, createDrumInstrument, createDrumPieceSound, createKeyEvent, createMeterEvent, createMixChannel, createMixer, createNoteEvent, createNoteEvents, createPattern, createProject, createProjectMetadata, createSection, createTempoEvent, createThorInstrument, createTimeline, createTrack, type Instrument, PPQ } from '~/domain'
import { createEntityStore } from '~/store/type'

export function lanternsInFive(): Workspace {
  const fourFourBarTicks = PPQ * 4
  const fiveFourBarTicks = PPQ * 5
  const threeFourBarTicks = PPQ * 3
  const eighthNoteTicks = PPQ / 2
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
          name: 'Lantern Theme',
          patternId: 'lanterns_pattern_guitar_opening',
          playbackMode: 'oneShot',
          startTick: openingStartTick,
          trackId: guitarTrack.id,
        }),
        createBlock({
          color: '#e8590c',
          id: 'lanterns_block_guitar_five',
          lengthTicks: releaseStartTick - fiveStartTick,
          name: 'Crooked Answer',
          patternId: 'lanterns_pattern_guitar_five',
          playbackMode: 'oneShot',
          startTick: fiveStartTick,
          trackId: guitarTrack.id,
        }),
        createBlock({
          color: '#f76707',
          id: 'lanterns_block_guitar_release',
          lengthTicks: turnStartTick - releaseStartTick,
          name: 'Open Sky',
          patternId: 'lanterns_pattern_guitar_release',
          playbackMode: 'oneShot',
          startTick: releaseStartTick,
          trackId: guitarTrack.id,
        }),
        createBlock({
          color: '#d9480f',
          id: 'lanterns_block_guitar_turn',
          lengthTicks: homeStartTick + fourFourBarTicks - turnStartTick,
          name: 'Turn and Home',
          patternId: 'lanterns_pattern_guitar_turn',
          playbackMode: 'oneShot',
          startTick: turnStartTick,
          trackId: guitarTrack.id,
        }),
        createBlock({
          color: '#845ef7',
          id: 'lanterns_block_voicings_opening',
          lengthTicks: fiveStartTick,
          name: 'Lantern Theme',
          patternId: 'lanterns_pattern_voicings_opening',
          playbackMode: 'oneShot',
          startTick: openingStartTick,
          trackId: voicingsTrack.id,
        }),
        createBlock({
          color: '#7950f2',
          id: 'lanterns_block_voicings_five',
          lengthTicks: releaseStartTick - fiveStartTick,
          name: 'Five',
          patternId: 'lanterns_pattern_voicings_five',
          playbackMode: 'oneShot',
          startTick: fiveStartTick,
          trackId: voicingsTrack.id,
        }),
        createBlock({
          color: '#7048e8',
          id: 'lanterns_block_voicings_release',
          lengthTicks: turnStartTick - releaseStartTick,
          name: 'Release',
          patternId: 'lanterns_pattern_voicings_release',
          playbackMode: 'oneShot',
          startTick: releaseStartTick,
          trackId: voicingsTrack.id,
        }),
        createBlock({
          color: '#6741d9',
          id: 'lanterns_block_voicings_turn',
          lengthTicks: homeStartTick + fourFourBarTicks - turnStartTick,
          name: 'Turn and Home',
          patternId: 'lanterns_pattern_voicings_turn',
          playbackMode: 'oneShot',
          startTick: turnStartTick,
          trackId: voicingsTrack.id,
        }),
        createBlock({
          color: '#20c997',
          id: 'lanterns_block_bass_opening',
          lengthTicks: fiveStartTick,
          name: 'Warm Floor',
          patternId: 'lanterns_pattern_bass_opening',
          playbackMode: 'oneShot',
          startTick: openingStartTick,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: '#12b886',
          id: 'lanterns_block_bass_five',
          lengthTicks: releaseStartTick - fiveStartTick,
          name: 'Five Walk',
          patternId: 'lanterns_pattern_bass_five',
          playbackMode: 'oneShot',
          startTick: fiveStartTick,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: '#0ca678',
          id: 'lanterns_block_bass_release',
          lengthTicks: turnStartTick - releaseStartTick,
          name: 'Release',
          patternId: 'lanterns_pattern_bass_release',
          playbackMode: 'oneShot',
          startTick: releaseStartTick,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: '#099268',
          id: 'lanterns_block_bass_turn',
          lengthTicks: homeStartTick + fourFourBarTicks - turnStartTick,
          name: 'Turn and Home',
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
          name: 'Three Plus Two',
          patternId: 'lanterns_pattern_drums_five',
          playbackMode: 'oneShot',
          startTick: fiveStartTick,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: '#fab005',
          id: 'lanterns_block_drums_release',
          lengthTicks: turnStartTick - releaseStartTick,
          name: 'Open Sky',
          patternId: 'lanterns_pattern_drums_release',
          playbackMode: 'oneShot',
          startTick: releaseStartTick,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: '#f59f00',
          id: 'lanterns_block_drums_turn',
          lengthTicks: homeStartTick + fourFourBarTicks - turnStartTick,
          name: 'Short Bar, Long Landing',
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
      createThorInstrument({
        id: 'guitar.default',
        name: 'Hollow-Body Guitar',
        soundId: 'guitar.default',
      }),
      createThorInstrument({
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
          volumeDb: -2,
        }),
        createMixChannel({
          id: voicingsTrack.mixChannelId,
          pan: 0.25,
          volumeDb: -8,
        }),
        createMixChannel({
          id: bassTrack.mixChannelId,
          pan: -0.25,
          volumeDb: -8,
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
          createNoteEvent({ timeTick: PPQ / 2, pitch: 66, durationTicks: PPQ * 3 / 4, velocity: 92, id: 'lanterns_event_guitar_opening_1' }),
          createNoteEvent({ timeTick: PPQ + (PPQ / 2), pitch: 69, durationTicks: PPQ, velocity: 84, id: 'lanterns_event_guitar_opening_2' }),
          createNoteEvent({ timeTick: (PPQ * 2) + (PPQ * 3 / 4), pitch: 64, durationTicks: PPQ * 3 / 4, velocity: 88, id: 'lanterns_event_guitar_opening_3' }),
          createNoteEvent({ timeTick: fourFourBarTicks - (PPQ / 4), pitch: 62, durationTicks: PPQ, velocity: 94, id: 'lanterns_event_guitar_opening_4' }),
          createNoteEvent({ timeTick: fourFourBarTicks + PPQ, pitch: 71, durationTicks: PPQ / 2, velocity: 82, id: 'lanterns_event_guitar_opening_5' }),
          createNoteEvent({ timeTick: fourFourBarTicks + PPQ + (PPQ * 3 / 4), pitch: 61, durationTicks: PPQ * 3 / 4, velocity: 90, id: 'lanterns_event_guitar_opening_6' }),
          createNoteEvent({ timeTick: fourFourBarTicks + (PPQ * 2) + (PPQ * 3 / 4), pitch: 64, durationTicks: PPQ / 2, velocity: 86, id: 'lanterns_event_guitar_opening_7' }),
          createNoteEvent({ timeTick: fiveStartTick - (PPQ / 2), pitch: 66, durationTicks: PPQ / 2, velocity: 96, id: 'lanterns_event_guitar_opening_8' }),
        ]),
        id: 'lanterns_pattern_guitar_opening',
        kind: 'note',
        lengthTicks: fiveStartTick,
        name: 'Lantern Theme',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_guitar_five', [
          createNoteEvent({ timeTick: 0, pitch: 67, durationTicks: PPQ, velocity: 94, id: 'lanterns_event_guitar_five_1' }),
          createNoteEvent({ timeTick: PPQ + (PPQ / 2), pitch: 71, durationTicks: PPQ / 2, velocity: 84, id: 'lanterns_event_guitar_five_2' }),
          createNoteEvent({ timeTick: (PPQ * 2) + (PPQ / 4), pitch: 66, durationTicks: PPQ, velocity: 90, id: 'lanterns_event_guitar_five_3' }),
          createNoteEvent({ timeTick: (PPQ * 3) + (PPQ * 3 / 4), pitch: 61, durationTicks: PPQ * 3 / 4, velocity: 86, id: 'lanterns_event_guitar_five_4' }),
          createNoteEvent({ timeTick: fiveFourBarTicks - (PPQ / 2), pitch: 62, durationTicks: PPQ / 2, velocity: 92, id: 'lanterns_event_guitar_five_5' }),
          createNoteEvent({ timeTick: fiveFourBarTicks + (PPQ / 2), pitch: 66, durationTicks: PPQ * 3 / 4, velocity: 94, id: 'lanterns_event_guitar_five_6' }),
          createNoteEvent({ timeTick: fiveFourBarTicks + PPQ + (PPQ * 3 / 4), pitch: 69, durationTicks: PPQ / 2, velocity: 88, id: 'lanterns_event_guitar_five_7' }),
          createNoteEvent({ timeTick: fiveFourBarTicks + (PPQ * 2) + (PPQ * 3 / 4), pitch: 64, durationTicks: PPQ, velocity: 90, id: 'lanterns_event_guitar_five_8' }),
          createNoteEvent({ timeTick: fiveFourBarTicks + (PPQ * 3) + (PPQ * 3 / 4), pitch: 71, durationTicks: PPQ * 3 / 4, velocity: 84, id: 'lanterns_event_guitar_five_9' }),
          createNoteEvent({ timeTick: (fiveFourBarTicks * 2) - (PPQ / 2), pitch: 61, durationTicks: PPQ / 2, velocity: 96, id: 'lanterns_event_guitar_five_10' }),
        ]),
        id: 'lanterns_pattern_guitar_five',
        kind: 'note',
        lengthTicks: fiveFourBarTicks * 2,
        name: 'Crooked Answer',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_guitar_release', [
          createNoteEvent({ timeTick: 0, pitch: 64, durationTicks: PPQ / 2, velocity: 90, id: 'lanterns_event_guitar_release_1' }),
          createNoteEvent({ timeTick: PPQ, pitch: 66, durationTicks: PPQ * 3 / 4, velocity: 86, id: 'lanterns_event_guitar_release_2' }),
          createNoteEvent({ timeTick: PPQ * 2, pitch: 69, durationTicks: PPQ, velocity: 94, id: 'lanterns_event_guitar_release_3' }),
          createNoteEvent({ timeTick: (PPQ * 3) + (PPQ / 2), pitch: 61, durationTicks: PPQ / 2, velocity: 82, id: 'lanterns_event_guitar_release_4' }),
          createNoteEvent({ timeTick: fourFourBarTicks + (PPQ / 2), pitch: 62, durationTicks: PPQ + (PPQ / 2), velocity: 98, id: 'lanterns_event_guitar_release_5' }),
          createNoteEvent({ timeTick: fourFourBarTicks + (PPQ * 2) + (PPQ / 4), pitch: 66, durationTicks: PPQ * 3 / 4, velocity: 88, id: 'lanterns_event_guitar_release_6' }),
          createNoteEvent({ timeTick: fourFourBarTicks + (PPQ * 3), pitch: 69, durationTicks: PPQ / 2, velocity: 92, id: 'lanterns_event_guitar_release_7' }),
          createNoteEvent({ timeTick: (fourFourBarTicks * 2) - (PPQ / 4), pitch: 64, durationTicks: PPQ / 4, velocity: 84, id: 'lanterns_event_guitar_release_8' }),
        ]),
        id: 'lanterns_pattern_guitar_release',
        kind: 'note',
        lengthTicks: fourFourBarTicks * 2,
        name: 'Open Sky',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_guitar_turn', [
          createNoteEvent({ timeTick: 0, pitch: 70, durationTicks: PPQ * 3 / 4, velocity: 90, id: 'lanterns_event_guitar_turn_1' }),
          createNoteEvent({ timeTick: PPQ, pitch: 69, durationTicks: PPQ / 2, velocity: 84, id: 'lanterns_event_guitar_turn_2' }),
          createNoteEvent({ timeTick: PPQ + (PPQ * 3 / 4), pitch: 66, durationTicks: PPQ * 3 / 4, velocity: 92, id: 'lanterns_event_guitar_turn_3' }),
          createNoteEvent({ timeTick: (PPQ * 2) + (PPQ / 2), pitch: 64, durationTicks: PPQ / 2, velocity: 86, id: 'lanterns_event_guitar_turn_4' }),
          createNoteEvent({ timeTick: threeFourBarTicks, pitch: 62, durationTicks: PPQ + (PPQ / 2), velocity: 100, id: 'lanterns_event_guitar_turn_5' }),
          createNoteEvent({ timeTick: threeFourBarTicks + (PPQ * 2), pitch: 66, durationTicks: PPQ * 3 / 4, velocity: 90, id: 'lanterns_event_guitar_turn_6' }),
          createNoteEvent({ timeTick: threeFourBarTicks + (PPQ * 3), pitch: 69, durationTicks: PPQ / 2, velocity: 86, id: 'lanterns_event_guitar_turn_7' }),
          createNoteEvent({ timeTick: threeFourBarTicks + (PPQ * 3) + (PPQ * 3 / 4), pitch: 61, durationTicks: PPQ / 4, velocity: 82, id: 'lanterns_event_guitar_turn_8' }),
        ]),
        id: 'lanterns_pattern_guitar_turn',
        kind: 'note',
        lengthTicks: threeFourBarTicks + fourFourBarTicks,
        name: 'Turn and Home',
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
        name: 'Lantern Theme',
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
        name: 'Five',
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
        name: 'Release',
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
        name: 'Turn and Home',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_bass_opening', [
          createNoteEvent({ timeTick: 0, pitch: 38, durationTicks: PPQ + (PPQ / 2), velocity: 96, id: 'lanterns_event_bass_opening_1' }),
          createNoteEvent({ timeTick: PPQ * 2, pitch: 45, durationTicks: PPQ * 3 / 4, velocity: 82, id: 'lanterns_event_bass_opening_2' }),
          createNoteEvent({ timeTick: PPQ * 3, pitch: 37, durationTicks: PPQ * 3 / 4, velocity: 86, id: 'lanterns_event_bass_opening_3' }),
          createNoteEvent({ timeTick: fourFourBarTicks, pitch: 47, durationTicks: PPQ, velocity: 94, id: 'lanterns_event_bass_opening_4' }),
          createNoteEvent({ timeTick: fourFourBarTicks + PPQ + (PPQ / 2), pitch: 42, durationTicks: PPQ / 2, velocity: 80, id: 'lanterns_event_bass_opening_5' }),
          createNoteEvent({ timeTick: fourFourBarTicks + (PPQ * 2), pitch: 40, durationTicks: PPQ, velocity: 92, id: 'lanterns_event_bass_opening_6' }),
          createNoteEvent({ timeTick: fiveStartTick - (PPQ / 2), pitch: 39, durationTicks: PPQ / 2, velocity: 78, id: 'lanterns_event_bass_opening_7' }),
        ]),
        id: 'lanterns_pattern_bass_opening',
        kind: 'note',
        lengthTicks: fiveStartTick,
        name: 'Warm Floor',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_bass_five', [
          createNoteEvent({ timeTick: 0, pitch: 43, durationTicks: PPQ + (PPQ / 2), velocity: 96, id: 'lanterns_event_bass_five_1' }),
          createNoteEvent({ timeTick: PPQ * 2, pitch: 38, durationTicks: PPQ / 2, velocity: 80, id: 'lanterns_event_bass_five_2' }),
          createNoteEvent({ timeTick: PPQ * 3, pitch: 37, durationTicks: PPQ, velocity: 90, id: 'lanterns_event_bass_five_3' }),
          createNoteEvent({ timeTick: PPQ * 4, pitch: 40, durationTicks: PPQ * 3 / 4, velocity: 82, id: 'lanterns_event_bass_five_4' }),
          createNoteEvent({ timeTick: fiveFourBarTicks, pitch: 42, durationTicks: PPQ + (PPQ / 2), velocity: 94, id: 'lanterns_event_bass_five_5' }),
          createNoteEvent({ timeTick: fiveFourBarTicks + (PPQ * 2), pitch: 37, durationTicks: PPQ / 2, velocity: 80, id: 'lanterns_event_bass_five_6' }),
          createNoteEvent({ timeTick: fiveFourBarTicks + (PPQ * 3), pitch: 47, durationTicks: PPQ, velocity: 92, id: 'lanterns_event_bass_five_7' }),
          createNoteEvent({ timeTick: fiveFourBarTicks + (PPQ * 4), pitch: 45, durationTicks: PPQ * 3 / 4, velocity: 84, id: 'lanterns_event_bass_five_8' }),
        ]),
        id: 'lanterns_pattern_bass_five',
        kind: 'note',
        lengthTicks: fiveFourBarTicks * 2,
        name: 'Five Walk',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_bass_release', [
          createNoteEvent({ timeTick: 0, pitch: 40, durationTicks: PPQ, velocity: 94, id: 'lanterns_event_bass_release_1' }),
          createNoteEvent({ timeTick: PPQ + (PPQ / 2), pitch: 47, durationTicks: PPQ / 2, velocity: 80, id: 'lanterns_event_bass_release_2' }),
          createNoteEvent({ timeTick: PPQ * 2, pitch: 45, durationTicks: PPQ, velocity: 92, id: 'lanterns_event_bass_release_3' }),
          createNoteEvent({ timeTick: PPQ * 3, pitch: 37, durationTicks: PPQ * 3 / 4, velocity: 82, id: 'lanterns_event_bass_release_4' }),
          createNoteEvent({ timeTick: fourFourBarTicks, pitch: 38, durationTicks: PPQ + (PPQ / 2), velocity: 98, id: 'lanterns_event_bass_release_5' }),
          createNoteEvent({ timeTick: fourFourBarTicks + (PPQ * 2), pitch: 45, durationTicks: PPQ * 3 / 4, velocity: 82, id: 'lanterns_event_bass_release_6' }),
          createNoteEvent({ timeTick: fourFourBarTicks + (PPQ * 3), pitch: 42, durationTicks: PPQ * 3 / 4, velocity: 88, id: 'lanterns_event_bass_release_7' }),
        ]),
        id: 'lanterns_pattern_bass_release',
        kind: 'note',
        lengthTicks: fourFourBarTicks * 2,
        name: 'Release',
      }),
      createPattern({
        events: createNoteEvents('lanterns_event_bass_turn', [
          createNoteEvent({ timeTick: 0, pitch: 46, durationTicks: PPQ, velocity: 92, id: 'lanterns_event_bass_turn_1' }),
          createNoteEvent({ timeTick: PPQ + (PPQ / 2), pitch: 40, durationTicks: PPQ / 2, velocity: 78, id: 'lanterns_event_bass_turn_2' }),
          createNoteEvent({ timeTick: PPQ * 2, pitch: 45, durationTicks: PPQ * 3 / 4, velocity: 88, id: 'lanterns_event_bass_turn_3' }),
          createNoteEvent({ timeTick: threeFourBarTicks, pitch: 38, durationTicks: PPQ + (PPQ / 2), velocity: 100, id: 'lanterns_event_bass_turn_4' }),
          createNoteEvent({ timeTick: threeFourBarTicks + (PPQ * 2), pitch: 45, durationTicks: PPQ * 3 / 4, velocity: 84, id: 'lanterns_event_bass_turn_5' }),
          createNoteEvent({ timeTick: threeFourBarTicks + (PPQ * 3), pitch: 37, durationTicks: PPQ * 3 / 4, velocity: 80, id: 'lanterns_event_bass_turn_6' }),
        ]),
        id: 'lanterns_pattern_bass_turn',
        kind: 'note',
        lengthTicks: threeFourBarTicks + fourFourBarTicks,
        name: 'Turn and Home',
      }),
      createPattern({
        events: createDrumHitEvents('lanterns_event_drums_opening', [
          createDrumHitEvent({ timeTick: 0, piece: 'kick', velocity: 94, id: 'lanterns_event_drums_opening_1' }),
          createDrumHitEvent({ timeTick: PPQ * 2, piece: 'snare', velocity: 48, id: 'lanterns_event_drums_opening_2' }),
          createDrumHitEvent({ timeTick: fourFourBarTicks, piece: 'kick', velocity: 88, id: 'lanterns_event_drums_opening_3' }),
          createDrumHitEvent({ timeTick: fourFourBarTicks + (PPQ * 2), piece: 'snare', velocity: 54, id: 'lanterns_event_drums_opening_4' }),
          createDrumHitEvent({ timeTick: fourFourBarTicks + (PPQ * 2) + (PPQ / 2), piece: 'kick', velocity: 78, id: 'lanterns_event_drums_opening_5' }),
          ...Array.from(
            { length: Math.floor(fiveStartTick / eighthNoteTicks) },
            (_, index) => createDrumHitEvent({
              timeTick: index * eighthNoteTicks,
              piece: index === Math.floor(fiveStartTick / eighthNoteTicks) - 1
                ? 'openHat'
                : 'closedHat',
              velocity: index % 2 === 0 ? 36 : 46,
              id: `lanterns_event_drums_opening_hat_${index + 1}`,
            }),
          ),
        ]),
        id: 'lanterns_pattern_drums_opening',
        kind: 'drum',
        lengthTicks: fiveStartTick,
        name: 'Deep Pocket — Loose Time',
      }),
      createPattern({
        events: createDrumHitEvents('lanterns_event_drums_five', [
          createDrumHitEvent({ timeTick: 0, piece: 'kick', velocity: 96, id: 'lanterns_event_drums_five_1' }),
          createDrumHitEvent({ timeTick: PPQ * 2, piece: 'snare', velocity: 54, id: 'lanterns_event_drums_five_2' }),
          createDrumHitEvent({ timeTick: PPQ * 3, piece: 'kick', velocity: 84, id: 'lanterns_event_drums_five_3' }),
          createDrumHitEvent({ timeTick: fiveFourBarTicks, piece: 'kick', velocity: 92, id: 'lanterns_event_drums_five_4' }),
          createDrumHitEvent({ timeTick: fiveFourBarTicks + (PPQ * 2), piece: 'snare', velocity: 58, id: 'lanterns_event_drums_five_5' }),
          createDrumHitEvent({ timeTick: fiveFourBarTicks + (PPQ * 3), piece: 'kick', velocity: 82, id: 'lanterns_event_drums_five_6' }),
          ...Array.from(
            {
              length: Math.floor(
                (fiveFourBarTicks * 2) / eighthNoteTicks,
              ),
            },
            (_, index) => createDrumHitEvent({
              timeTick: index * eighthNoteTicks,
              piece: index === Math.floor(
                (fiveFourBarTicks * 2) / eighthNoteTicks,
              ) - 1
                ? 'openHat'
                : 'closedHat',
              velocity: index % 2 === 0 ? 36 : 46,
              id: `lanterns_event_drums_five_hat_${index + 1}`,
            }),
          ),
        ]),
        id: 'lanterns_pattern_drums_five',
        kind: 'drum',
        lengthTicks: fiveFourBarTicks * 2,
        name: 'Three Plus Two',
      }),
      createPattern({
        events: createDrumHitEvents('lanterns_event_drums_release', [
          createDrumHitEvent({ timeTick: 0, piece: 'kick', velocity: 100, id: 'lanterns_event_drums_release_1' }),
          createDrumHitEvent({ timeTick: PPQ * 2, piece: 'snare', velocity: 60, id: 'lanterns_event_drums_release_2' }),
          createDrumHitEvent({ timeTick: fourFourBarTicks, piece: 'kick', velocity: 94, id: 'lanterns_event_drums_release_3' }),
          createDrumHitEvent({ timeTick: fourFourBarTicks + (PPQ * 2), piece: 'snare', velocity: 62, id: 'lanterns_event_drums_release_4' }),
          createDrumHitEvent({ timeTick: fourFourBarTicks + (PPQ * 3) + (PPQ / 2), piece: 'kick', velocity: 80, id: 'lanterns_event_drums_release_5' }),
          ...Array.from(
            {
              length: Math.floor(
                (fourFourBarTicks * 2) / eighthNoteTicks,
              ),
            },
            (_, index) => createDrumHitEvent({
              timeTick: index * eighthNoteTicks,
              piece: index === Math.floor(
                (fourFourBarTicks * 2) / eighthNoteTicks,
              ) - 1
                ? 'openHat'
                : 'closedHat',
              velocity: index % 2 === 0 ? 36 : 46,
              id: `lanterns_event_drums_release_hat_${index + 1}`,
            }),
          ),
        ]),
        id: 'lanterns_pattern_drums_release',
        kind: 'drum',
        lengthTicks: fourFourBarTicks * 2,
        name: 'Open Sky',
      }),
      createPattern({
        events: createDrumHitEvents('lanterns_event_drums_turn', [
          createDrumHitEvent({ timeTick: 0, piece: 'kick', velocity: 94, id: 'lanterns_event_drums_turn_1' }),
          createDrumHitEvent({ timeTick: PPQ * 2, piece: 'snare', velocity: 52, id: 'lanterns_event_drums_turn_2' }),
          createDrumHitEvent({ timeTick: threeFourBarTicks, piece: 'kick', velocity: 102, id: 'lanterns_event_drums_turn_3' }),
          createDrumHitEvent({ timeTick: threeFourBarTicks + (PPQ * 2), piece: 'snare', velocity: 64, id: 'lanterns_event_drums_turn_4' }),
          createDrumHitEvent({ timeTick: threeFourBarTicks + (PPQ * 3) + (PPQ / 2), piece: 'kick', velocity: 82, id: 'lanterns_event_drums_turn_5' }),
          ...Array.from(
            {
              length: Math.floor(
                (threeFourBarTicks + fourFourBarTicks) / eighthNoteTicks,
              ),
            },
            (_, index) => createDrumHitEvent({
              timeTick: index * eighthNoteTicks,
              piece: index === Math.floor(
                (threeFourBarTicks + fourFourBarTicks) / eighthNoteTicks,
              ) - 1
                ? 'openHat'
                : 'closedHat',
              velocity: index % 2 === 0 ? 36 : 46,
              id: `lanterns_event_drums_turn_hat_${index + 1}`,
            }),
          ),
        ]),
        id: 'lanterns_pattern_drums_turn',
        kind: 'drum',
        lengthTicks: threeFourBarTicks + fourFourBarTicks,
        name: 'Short Bar, Long Landing',
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
