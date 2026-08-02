import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import { createBlock, createDrumHitEvent, createDrumHitEvents, createDrumInstrument, createDrumPieceSound, createKeyEvent, createMelodicInstrument, createMeterEvent, createMixChannel, createMixer, createNoteEvent, createNoteEvents, createPattern, createProject, createProjectMetadata, createSection, createTempoEvent, createTimeline, createTrack, type DurationTicks, type Instrument, type Pattern, PPQ } from '~/domain'
import { createEntityStore } from '~/store/type'

export function blueHourBelow(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 8
  const drumBlockTicks = barTicks * 2
  const halfBeatTicks = PPQ / 2
  const quarterBeatTicks = PPQ / 4
  const sustainedChordTicks = PPQ * 3
  const sustainedBassTicks = sustainedChordTicks + halfBeatTicks
  const melodyColor = '#7950f2'
  const drumsColor = '#fd7e14'
  const bar2 = barTicks
  const bar3 = barTicks * 2
  const bar4 = barTicks * 3
  const bar5 = barTicks * 4
  const bar6 = barTicks * 5
  const bar7 = barTicks * 6
  const bar8 = barTicks * 7
  const keysTrack = createTrack({
    color: melodyColor,
    id: 'blue_hour_track_keys',
    instrumentId: 'keys.default',
    name: 'Submerged Rhodes',
    role: 'melody',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'blue_hour_track_drums',
    instrumentId: 'drums.default',
    name: 'Deep Pocket',
    role: 'drums',
  })
  const tracks = [keysTrack, drumsTrack]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: melodyColor,
          id: 'blue_hour_block_keys',
          lengthTicks: totalTicks,
          name: 'C minor after dark',
          patternId: 'blue_hour_pattern_keys',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: keysTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'blue_hour_block_drums_1',
          lengthTicks: drumBlockTicks,
          name: 'Sink In',
          patternId: 'blue_hour_pattern_drums_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'blue_hour_block_drums_2',
          lengthTicks: drumBlockTicks,
          name: 'Modal Lift',
          patternId: 'blue_hour_pattern_drums_2',
          playbackMode: 'oneShot',
          startTick: bar3,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'blue_hour_block_drums_3',
          lengthTicks: drumBlockTicks,
          name: 'Open Pocket',
          patternId: 'blue_hour_pattern_drums_3',
          playbackMode: 'oneShot',
          startTick: bar5,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'blue_hour_block_drums_4',
          lengthTicks: drumBlockTicks,
          name: 'Turn Home',
          patternId: 'blue_hour_pattern_drums_4',
          playbackMode: 'oneShot',
          startTick: bar7,
          trackId: drumsTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'blue_hour_section_sink',
          lengthTicks: barTicks * 4,
          name: 'Sink In',
          startTick: 0,
        }),
        createSection({
          id: 'blue_hour_section_surface',
          lengthTicks: barTicks * 4,
          name: 'Surface',
          startTick: bar5,
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createMelodicInstrument({
        id: 'keys.default',
        name: 'Submerged Rhodes',
        soundId: 'keys.default',
      }),
      createDrumInstrument({
        id: 'drums.default',
        name: 'Deep Dust Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            soundId: 'drums.closedHat.default',
            volumeDb: -12,
          }),
          crash: createDrumPieceSound({
            durationSeconds: 0.48,
            pitchSemitones: -3,
            soundId: 'drums.crash.default',
            volumeDb: -9,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.42,
            pitchSemitones: -9,
            soundId: 'drums.kick.default',
            volumeDb: 12,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.32,
            pitchSemitones: -7,
            soundId: 'drums.lowTom.default',
            volumeDb: 0,
          }),
          openHat: createDrumPieceSound({
            durationSeconds: 0.38,
            pitchSemitones: -2,
            soundId: 'drums.openHat.default',
            volumeDb: -10,
          }),
          ride: createDrumPieceSound({
            durationSeconds: 0.36,
            pitchSemitones: -3,
            soundId: 'drums.ride.default',
            volumeDb: -10,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.18,
            pitchSemitones: -4,
            soundId: 'drums.snare.default',
            volumeDb: -3,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({
          id: keysTrack.mixChannelId,
          pan: -0.25,
          volumeDb: 0,
        }),
        createMixChannel({
          id: drumsTrack.mixChannelId,
          pan: 0.25,
          volumeDb: 10,
        }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createNoteEvents('blue_hour_event_keys', [
          // Bar 1: Cm9 — open fifth, seventh, ninth, and a close D/Eb glow.
          createNoteEvent({ timeTick: 0, pitch: 36, durationTicks: sustainedBassTicks, velocity: 92, id: 'blue_hour_event_keys_1' }),
          createNoteEvent({ timeTick: 0, pitch: 55, durationTicks: sustainedChordTicks, velocity: 58, id: 'blue_hour_event_keys_2' }),
          createNoteEvent({ timeTick: 0, pitch: 58, durationTicks: sustainedChordTicks, velocity: 62, id: 'blue_hour_event_keys_3' }),
          createNoteEvent({ timeTick: 0, pitch: 62, durationTicks: sustainedChordTicks, velocity: 54, id: 'blue_hour_event_keys_4' }),
          createNoteEvent({ timeTick: 0, pitch: 63, durationTicks: sustainedChordTicks, velocity: 60, id: 'blue_hour_event_keys_5' }),
          createNoteEvent({ timeTick: (PPQ * 5) / 2, pitch: 67, durationTicks: halfBeatTicks, velocity: 68, id: 'blue_hour_event_keys_6' }),
          createNoteEvent({ timeTick: (PPQ * 13) / 4, pitch: 70, durationTicks: quarterBeatTicks, velocity: 60, id: 'blue_hour_event_keys_7' }),

          // Bar 2: Abmaj9 — the upper voices barely move.
          createNoteEvent({ timeTick: bar2, pitch: 44, durationTicks: sustainedBassTicks, velocity: 92, id: 'blue_hour_event_keys_8' }),
          createNoteEvent({ timeTick: bar2, pitch: 55, durationTicks: sustainedChordTicks, velocity: 56, id: 'blue_hour_event_keys_9' }),
          createNoteEvent({ timeTick: bar2, pitch: 58, durationTicks: sustainedChordTicks, velocity: 60, id: 'blue_hour_event_keys_10' }),
          createNoteEvent({ timeTick: bar2, pitch: 60, durationTicks: sustainedChordTicks, velocity: 54, id: 'blue_hour_event_keys_11' }),
          createNoteEvent({ timeTick: bar2, pitch: 63, durationTicks: sustainedChordTicks, velocity: 62, id: 'blue_hour_event_keys_12' }),
          createNoteEvent({ timeTick: bar2 + (PPQ * 2), pitch: 75, durationTicks: halfBeatTicks, velocity: 66, id: 'blue_hour_event_keys_13' }),
          createNoteEvent({ timeTick: bar2 + (PPQ * 13) / 4, pitch: 72, durationTicks: halfBeatTicks, velocity: 58, id: 'blue_hour_event_keys_14' }),

          // Bar 3: Ebmaj9/G — a soft inversion keeps the bass line afloat.
          createNoteEvent({ timeTick: bar3, pitch: 43, durationTicks: sustainedBassTicks, velocity: 92, id: 'blue_hour_event_keys_15' }),
          createNoteEvent({ timeTick: bar3, pitch: 53, durationTicks: sustainedChordTicks, velocity: 54, id: 'blue_hour_event_keys_16' }),
          createNoteEvent({ timeTick: bar3, pitch: 58, durationTicks: sustainedChordTicks, velocity: 60, id: 'blue_hour_event_keys_17' }),
          createNoteEvent({ timeTick: bar3, pitch: 62, durationTicks: sustainedChordTicks, velocity: 56, id: 'blue_hour_event_keys_18' }),
          createNoteEvent({ timeTick: bar3, pitch: 63, durationTicks: sustainedChordTicks, velocity: 62, id: 'blue_hour_event_keys_19' }),
          createNoteEvent({ timeTick: bar3 + (PPQ * 2), pitch: 74, durationTicks: halfBeatTicks, velocity: 68, id: 'blue_hour_event_keys_20' }),
          createNoteEvent({ timeTick: bar3 + (PPQ * 3), pitch: 67, durationTicks: halfBeatTicks, velocity: 58, id: 'blue_hour_event_keys_21' }),

          // Bar 4: F9/A — borrowed from C Dorian for the modal lift.
          createNoteEvent({ timeTick: bar4, pitch: 45, durationTicks: sustainedBassTicks, velocity: 92, id: 'blue_hour_event_keys_22' }),
          createNoteEvent({ timeTick: bar4, pitch: 51, durationTicks: sustainedChordTicks, velocity: 54, id: 'blue_hour_event_keys_23' }),
          createNoteEvent({ timeTick: bar4, pitch: 55, durationTicks: sustainedChordTicks, velocity: 58, id: 'blue_hour_event_keys_24' }),
          createNoteEvent({ timeTick: bar4, pitch: 57, durationTicks: sustainedChordTicks, velocity: 62, id: 'blue_hour_event_keys_25' }),
          createNoteEvent({ timeTick: bar4, pitch: 60, durationTicks: sustainedChordTicks, velocity: 56, id: 'blue_hour_event_keys_26' }),
          createNoteEvent({ timeTick: bar4, pitch: 65, durationTicks: sustainedChordTicks, velocity: 60, id: 'blue_hour_event_keys_27' }),
          createNoteEvent({ timeTick: bar4 + (PPQ * 5) / 2, pitch: 72, durationTicks: halfBeatTicks, velocity: 66, id: 'blue_hour_event_keys_28' }),
          createNoteEvent({ timeTick: bar4 + (PPQ * 7) / 2, pitch: 67, durationTicks: halfBeatTicks, velocity: 60, id: 'blue_hour_event_keys_29' }),

          // Bar 5: Cm11 — deeper and wider on the return.
          createNoteEvent({ timeTick: bar5, pitch: 43, durationTicks: sustainedBassTicks, velocity: 92, id: 'blue_hour_event_keys_31' }),
          createNoteEvent({ timeTick: bar5, pitch: 58, durationTicks: sustainedChordTicks, velocity: 60, id: 'blue_hour_event_keys_32' }),
          createNoteEvent({ timeTick: bar5, pitch: 62, durationTicks: sustainedChordTicks, velocity: 54, id: 'blue_hour_event_keys_33' }),
          createNoteEvent({ timeTick: bar5, pitch: 63, durationTicks: sustainedChordTicks, velocity: 58, id: 'blue_hour_event_keys_34' }),
          createNoteEvent({ timeTick: bar5, pitch: 65, durationTicks: sustainedChordTicks, velocity: 62, id: 'blue_hour_event_keys_35' }),
          createNoteEvent({ timeTick: bar5 + (PPQ * 3) / 2, pitch: 67, durationTicks: halfBeatTicks, velocity: 68, id: 'blue_hour_event_keys_36' }),
          createNoteEvent({ timeTick: bar5 + (PPQ * 5) / 2, pitch: 70, durationTicks: halfBeatTicks, velocity: 64, id: 'blue_hour_event_keys_37' }),
          createNoteEvent({ timeTick: bar5 + (PPQ * 7) / 2, pitch: 77, durationTicks: halfBeatTicks, velocity: 58, id: 'blue_hour_event_keys_38' }),

          // Bar 6: Abmaj9/C — suspended above a warm first-inversion bass.
          createNoteEvent({ timeTick: bar6, pitch: 48, durationTicks: sustainedBassTicks, velocity: 92, id: 'blue_hour_event_keys_39' }),
          createNoteEvent({ timeTick: bar6, pitch: 55, durationTicks: sustainedChordTicks, velocity: 54, id: 'blue_hour_event_keys_40' }),
          createNoteEvent({ timeTick: bar6, pitch: 58, durationTicks: sustainedChordTicks, velocity: 60, id: 'blue_hour_event_keys_41' }),
          createNoteEvent({ timeTick: bar6, pitch: 63, durationTicks: sustainedChordTicks, velocity: 58, id: 'blue_hour_event_keys_42' }),
          createNoteEvent({ timeTick: bar6, pitch: 68, durationTicks: sustainedChordTicks, velocity: 62, id: 'blue_hour_event_keys_43' }),
          createNoteEvent({ timeTick: bar6 + (PPQ * 2), pitch: 75, durationTicks: halfBeatTicks, velocity: 68, id: 'blue_hour_event_keys_44' }),
          createNoteEvent({ timeTick: bar6 + (PPQ * 3), pitch: 72, durationTicks: halfBeatTicks, velocity: 60, id: 'blue_hour_event_keys_45' }),

          // Bar 7: Fm9 — back inside natural minor before the turnaround.
          createNoteEvent({ timeTick: bar7, pitch: 41, durationTicks: sustainedBassTicks, velocity: 92, id: 'blue_hour_event_keys_46' }),
          createNoteEvent({ timeTick: bar7, pitch: 51, durationTicks: sustainedChordTicks, velocity: 54, id: 'blue_hour_event_keys_47' }),
          createNoteEvent({ timeTick: bar7, pitch: 55, durationTicks: sustainedChordTicks, velocity: 58, id: 'blue_hour_event_keys_48' }),
          createNoteEvent({ timeTick: bar7, pitch: 56, durationTicks: sustainedChordTicks, velocity: 62, id: 'blue_hour_event_keys_49' }),
          createNoteEvent({ timeTick: bar7, pitch: 60, durationTicks: sustainedChordTicks, velocity: 56, id: 'blue_hour_event_keys_50' }),
          createNoteEvent({ timeTick: bar7, pitch: 65, durationTicks: sustainedChordTicks, velocity: 60, id: 'blue_hour_event_keys_51' }),
          createNoteEvent({ timeTick: bar7 + (PPQ * 2), pitch: 72, durationTicks: halfBeatTicks, velocity: 66, id: 'blue_hour_event_keys_52' }),
          createNoteEvent({ timeTick: bar7 + (PPQ * 11) / 4, pitch: 75, durationTicks: quarterBeatTicks, velocity: 62, id: 'blue_hour_event_keys_53' }),
          createNoteEvent({ timeTick: bar7 + (PPQ * 7) / 2, pitch: 79, durationTicks: halfBeatTicks, velocity: 58, id: 'blue_hour_event_keys_54' }),

          // Bar 8: G7b9 resolves to a compact Cm9 on beat four.
          createNoteEvent({ timeTick: bar8, pitch: 43, durationTicks: sustainedChordTicks, velocity: 80, id: 'blue_hour_event_keys_55' }),
          createNoteEvent({ timeTick: bar8, pitch: 53, durationTicks: sustainedChordTicks, velocity: 56, id: 'blue_hour_event_keys_56' }),
          createNoteEvent({ timeTick: bar8, pitch: 56, durationTicks: sustainedChordTicks, velocity: 60, id: 'blue_hour_event_keys_57' }),
          createNoteEvent({ timeTick: bar8, pitch: 59, durationTicks: sustainedChordTicks, velocity: 64, id: 'blue_hour_event_keys_58' }),
          createNoteEvent({ timeTick: bar8, pitch: 62, durationTicks: sustainedChordTicks, velocity: 58, id: 'blue_hour_event_keys_59' }),
          createNoteEvent({ timeTick: bar8, pitch: 67, durationTicks: sustainedChordTicks, velocity: 54, id: 'blue_hour_event_keys_60' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 2), pitch: 68, durationTicks: halfBeatTicks, velocity: 66, id: 'blue_hour_event_keys_61' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 5) / 2, pitch: 67, durationTicks: halfBeatTicks, velocity: 60, id: 'blue_hour_event_keys_62' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 3), pitch: 48, durationTicks: PPQ, velocity: 74, id: 'blue_hour_event_keys_63' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 3), pitch: 55, durationTicks: PPQ, velocity: 54, id: 'blue_hour_event_keys_64' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 3), pitch: 58, durationTicks: PPQ, velocity: 60, id: 'blue_hour_event_keys_65' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 3), pitch: 62, durationTicks: PPQ, velocity: 56, id: 'blue_hour_event_keys_66' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 3), pitch: 63, durationTicks: PPQ, velocity: 62, id: 'blue_hour_event_keys_67' }),
        ]),
        id: 'blue_hour_pattern_keys',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          progression: 'Cm9 · Abmaj9 · Ebmaj9/G · F9/A · Cm11 · Abmaj9/C · Fm9 · G7b9 → Cm9',
        },
        name: 'Blue Hour Voicings',
      }),
      ...splitPattern(createPattern({
        events: createDrumHitEvents('blue_hour_event_drums', [
          // Bar 1: establish the heavy halftime pocket.
          createDrumHitEvent({ timeTick: 0, piece: 'kick', velocity: 118, id: 'blue_hour_event_drums_1' }),
          createDrumHitEvent({ timeTick: PPQ + halfBeatTicks, piece: 'kick', velocity: 82, id: 'blue_hour_event_drums_2' }),
          createDrumHitEvent({ timeTick: PPQ * 2, piece: 'snare', velocity: 106, id: 'blue_hour_event_drums_3' }),
          createDrumHitEvent({ timeTick: (PPQ * 11) / 4, piece: 'kick', velocity: 76, id: 'blue_hour_event_drums_4' }),
          createDrumHitEvent({ timeTick: (PPQ * 15) / 4, piece: 'snare', velocity: 38, id: 'blue_hour_event_drums_5' }),

          // Bar 2: a late kick pulls against the straight hats.
          createDrumHitEvent({ timeTick: bar2, piece: 'kick', velocity: 112, id: 'blue_hour_event_drums_6' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 5) / 4, piece: 'snare', velocity: 34, id: 'blue_hour_event_drums_7' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 3) / 2, piece: 'kick', velocity: 80, id: 'blue_hour_event_drums_8' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 2), piece: 'snare', velocity: 108, id: 'blue_hour_event_drums_9' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 5) / 2, piece: 'kick', velocity: 88, id: 'blue_hour_event_drums_10' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 15) / 4, piece: 'kick', velocity: 70, id: 'blue_hour_event_drums_11' }),

          // Bar 3: leave air after the backbeat.
          createDrumHitEvent({ timeTick: bar3, piece: 'kick', velocity: 114, id: 'blue_hour_event_drums_12' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 5) / 4, piece: 'kick', velocity: 76, id: 'blue_hour_event_drums_13' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 2), piece: 'snare', velocity: 104, id: 'blue_hour_event_drums_14' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 9) / 4, piece: 'kick', velocity: 84, id: 'blue_hour_event_drums_15' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 13) / 4, piece: 'snare', velocity: 36, id: 'blue_hour_event_drums_16' }),

          // Bar 4: low toms answer the modal-interchange chord.
          createDrumHitEvent({ timeTick: bar4, piece: 'kick', velocity: 116, id: 'blue_hour_event_drums_17' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 3) / 2, piece: 'kick', velocity: 80, id: 'blue_hour_event_drums_18' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 2), piece: 'snare', velocity: 108, id: 'blue_hour_event_drums_19' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 3), piece: 'lowTom', velocity: 72, id: 'blue_hour_event_drums_20' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 13) / 4, piece: 'closedHat', velocity: 44, id: 'blue_hour_event_drums_21' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 13) / 4, piece: 'lowTom', velocity: 78, id: 'blue_hour_event_drums_22' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 7) / 2, piece: 'lowTom', velocity: 86, id: 'blue_hour_event_drums_23' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 15) / 4, piece: 'closedHat', velocity: 50, id: 'blue_hour_event_drums_24' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 15) / 4, piece: 'lowTom', velocity: 94, id: 'blue_hour_event_drums_25' }),

          // Bar 5: the ride opens the second half without losing weight.
          createDrumHitEvent({ timeTick: bar5, piece: 'kick', velocity: 120, id: 'blue_hour_event_drums_26' }),
          createDrumHitEvent({ timeTick: bar5, piece: 'ride', velocity: 54, id: 'blue_hour_event_drums_27' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 7) / 4, piece: 'kick', velocity: 78, id: 'blue_hour_event_drums_28' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 2), piece: 'snare', velocity: 110, id: 'blue_hour_event_drums_29' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 11) / 4, piece: 'kick', velocity: 86, id: 'blue_hour_event_drums_30' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 15) / 4, piece: 'snare', velocity: 40, id: 'blue_hour_event_drums_31' }),

          // Bar 6: a busier kick phrase, still tucked behind the snare.
          createDrumHitEvent({ timeTick: bar6, piece: 'kick', velocity: 114, id: 'blue_hour_event_drums_32' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 5) / 4, piece: 'kick', velocity: 76, id: 'blue_hour_event_drums_33' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 7) / 4, piece: 'snare', velocity: 34, id: 'blue_hour_event_drums_34' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 2), piece: 'snare', velocity: 108, id: 'blue_hour_event_drums_35' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 5) / 2, piece: 'kick', velocity: 88, id: 'blue_hour_event_drums_36' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 13) / 4, piece: 'kick', velocity: 72, id: 'blue_hour_event_drums_37' }),

          // Bar 7: strip back before the final turn.
          createDrumHitEvent({ timeTick: bar7, piece: 'kick', velocity: 116, id: 'blue_hour_event_drums_38' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 5) / 4, piece: 'snare', velocity: 36, id: 'blue_hour_event_drums_39' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 2), piece: 'snare', velocity: 106, id: 'blue_hour_event_drums_40' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 3), piece: 'kick', velocity: 86, id: 'blue_hour_event_drums_41' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 7) / 2, piece: 'ride', velocity: 48, id: 'blue_hour_event_drums_42' }),

          // Bar 8: the deepest kick and a compact tom fill into the loop.
          createDrumHitEvent({ timeTick: bar8, piece: 'crash', velocity: 58, id: 'blue_hour_event_drums_43' }),
          createDrumHitEvent({ timeTick: bar8, piece: 'kick', velocity: 122, id: 'blue_hour_event_drums_44' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 3) / 2, piece: 'kick', velocity: 84, id: 'blue_hour_event_drums_45' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 2), piece: 'snare', velocity: 112, id: 'blue_hour_event_drums_46' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 11) / 4, piece: 'kick', velocity: 90, id: 'blue_hour_event_drums_47' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 13) / 4, piece: 'snare', velocity: 38, id: 'blue_hour_event_drums_48' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 13) / 4, piece: 'lowTom', velocity: 76, id: 'blue_hour_event_drums_49' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 7) / 2, piece: 'lowTom', velocity: 86, id: 'blue_hour_event_drums_50' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 15) / 4, piece: 'lowTom', velocity: 98, id: 'blue_hour_event_drums_51' }),

          ...Array.from(
            { length: Math.floor(totalTicks / halfBeatTicks) },
            (_, index) => createDrumHitEvent({
              timeTick: index * halfBeatTicks,
              piece: index === Math.floor(totalTicks / halfBeatTicks) - 1
                ? 'openHat'
                : 'closedHat',
              velocity: index % 2 === 0 ? 36 : 46,
              id: `blue_hour_event_drums_hat_${index + 1}`,
            }),
          ),
        ]),
        id: 'blue_hour_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'half-time, deep, loose',
        },
        name: 'Eight Bars Below',
      }), drumBlockTicks, [
        'Pocket I — Sink In',
        'Pocket II — Modal Lift',
        'Pocket III — Open Up',
        'Pocket IV — Turn Home',
      ]),
    ]),
    project: createProject({
      id: 'project_blue_hour_below',
      metadata: createProjectMetadata({
        description: 'An eight-bar, drum-forward deep beat in C minor, lifted for one bar by C Dorian.',
        tags: ['chill', 'deep-beat', 'drum-focused', 'modal-interchange'],
      }),
      name: 'Blue Hour Below',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          key: { mode: 'minor', tonic: 0 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'blue_hour_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 74,
          id: 'blue_hour_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function splitPattern(
  pattern: Pattern,
  segmentLengthTicks: DurationTicks,
  segmentNames: readonly string[],
): Pattern[] {
  const segmentCount = Math.ceil(pattern.lengthTicks / segmentLengthTicks)

  if (segmentNames.length !== segmentCount) {
    throw new Error(`Pattern ${pattern.id} requires ${segmentCount} segment names.`)
  }

  return segmentNames.map((name, index) => {
    const startTick = index * segmentLengthTicks
    const endTick = startTick + segmentLengthTicks

    return createPattern({
      events: [...pattern.events]
        .filter(event => event.timeTick >= startTick && event.timeTick < endTick)
        .map(event => ({
          ...event,
          timeTick: event.timeTick - startTick,
        })),
      id: `${pattern.id}_${index + 1}`,
      kind: pattern.kind,
      lengthTicks: segmentLengthTicks,
      metadata: {
        ...pattern.metadata,
        sourcePatternId: pattern.id,
      },
      name,
    })
  })
}
