import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import { createBlock, createDrumHitEvent, createDrumHitEvents, createDrumInstrument, createDrumPieceSound, createKeyEvent, createMelodicInstrument, createMeterEvent, createMixChannel, createMixer, createNoteEvent, createNoteEvents, createPattern, createProject, createProjectMetadata, createSection, createTempoEvent, createTimeline, createTrack, type DurationTicks, type Instrument, type Pattern, PPQ } from '~/domain'
import { createEntityStore } from '~/store/type'

export function theHouseIsListening(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 16
  const drumBlockTicks = barTicks * 2
  const melodyBlockTicks = barTicks * 4
  const eighthNoteTicks = PPQ / 2
  const sixteenthNoteTicks = PPQ / 4
  const thirtySecondNoteTicks = PPQ / 8
  const tripletTicks = PPQ / 3
  const sustainedPianoTicks = barTicks - (thirtySecondNoteTicks * 5)
  const hookNote = 76
  const bar2 = barTicks
  const bar3 = barTicks * 2
  const bar4 = barTicks * 3
  const bar5 = barTicks * 4
  const bar6 = barTicks * 5
  const bar7 = barTicks * 6
  const bar8 = barTicks * 7
  const bar9 = barTicks * 8
  const bar10 = barTicks * 9
  const bar11 = barTicks * 10
  const bar12 = barTicks * 11
  const bar13 = barTicks * 12
  const bar14 = barTicks * 13
  const bar15 = barTicks * 14
  const bar16 = barTicks * 15

  const pianoTrack = createTrack({
    accepts: ['note'],
    color: '#2ba0af',
    id: 'house_listening_track_piano',
    instrumentId: 'keys.default',
    name: 'Distant Piano',
    role: 'chords',
  })
  const melodyTrack = createTrack({
    color: '#54005e',
    id: 'house_listening_track_melody',
    instrumentId: 'lead.default',
    name: 'Hook Upstairs',
    role: 'melody',
  })
  const ghostVoiceTrack = createTrack({
    color: '#a9c7ff',
    id: 'house_listening_track_ghost_voice',
    instrumentId: 'voice.ghost',
    name: 'Ghost Voice',
    role: 'melody',
  })
  const drumsTrack = createTrack({
    color: '#ba3239',
    id: 'house_listening_track_808s',
    instrumentId: 'drums.default',
    name: 'Possessed 808s',
    role: 'drums',
  })

  const tracks = [
    pianoTrack,
    melodyTrack,
    ghostVoiceTrack,
    drumsTrack,
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: pianoTrack.color,
          id: 'house_listening_block_piano',
          lengthTicks: totalTicks,
          name: 'Piano — Distant Piano',
          patternId: 'house_listening_pattern_piano',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: melodyTrack.color,
          id: 'house_listening_block_melody_1',
          lengthTicks: melodyBlockTicks,
          name: 'Melody — Hook Upstairs I',
          patternId: 'house_listening_pattern_melody_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: melodyTrack.id,
        }),
        createBlock({
          color: melodyTrack.color,
          id: 'house_listening_block_melody_2',
          lengthTicks: melodyBlockTicks,
          name: 'Melody — Hook Upstairs II',
          patternId: 'house_listening_pattern_melody_2',
          playbackMode: 'oneShot',
          startTick: bar5,
          trackId: melodyTrack.id,
        }),
        createBlock({
          color: melodyTrack.color,
          id: 'house_listening_block_melody_3',
          lengthTicks: melodyBlockTicks,
          name: 'Melody — Hook Upstairs III',
          patternId: 'house_listening_pattern_melody_3',
          playbackMode: 'oneShot',
          startTick: bar9,
          trackId: melodyTrack.id,
        }),
        createBlock({
          color: melodyTrack.color,
          id: 'house_listening_block_melody_4',
          lengthTicks: melodyBlockTicks,
          name: 'Melody — Hook Upstairs IV',
          patternId: 'house_listening_pattern_melody_4',
          playbackMode: 'oneShot',
          startTick: bar13,
          trackId: melodyTrack.id,
        }),
        createBlock({
          color: ghostVoiceTrack.color,
          id: 'house_listening_block_ghost_voice_1',
          lengthTicks: melodyBlockTicks,
          name: 'Ghost Voice — Behind the Wallpaper',
          patternId: 'house_listening_pattern_ghost_voice_1',
          playbackMode: 'oneShot',
          startTick: bar9,
          trackId: ghostVoiceTrack.id,
        }),
        createBlock({
          color: ghostVoiceTrack.color,
          id: 'house_listening_block_ghost_voice_2',
          lengthTicks: melodyBlockTicks,
          name: 'Ghost Voice — Follow Me Home',
          patternId: 'house_listening_pattern_ghost_voice_2',
          playbackMode: 'oneShot',
          startTick: bar13,
          trackId: ghostVoiceTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_1',
          lengthTicks: drumBlockTicks,
          name: 'Footsteps',
          patternId: 'house_listening_pattern_808s_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_2',
          lengthTicks: drumBlockTicks,
          name: 'Door Opens',
          patternId: 'house_listening_pattern_808s_2',
          playbackMode: 'oneShot',
          startTick: bar3,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_3',
          lengthTicks: drumBlockTicks,
          name: 'Possession',
          patternId: 'house_listening_pattern_808s_3',
          playbackMode: 'oneShot',
          startTick: bar5,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_4',
          lengthTicks: drumBlockTicks,
          name: 'Run',
          patternId: 'house_listening_pattern_808s_4',
          playbackMode: 'oneShot',
          startTick: bar7,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_5',
          lengthTicks: drumBlockTicks,
          name: 'Walls Answer',
          patternId: 'house_listening_pattern_808s_5',
          playbackMode: 'oneShot',
          startTick: bar9,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_6',
          lengthTicks: drumBlockTicks,
          name: 'Floor Gives Way',
          patternId: 'house_listening_pattern_808s_6',
          playbackMode: 'oneShot',
          startTick: bar11,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_7',
          lengthTicks: drumBlockTicks,
          name: 'False Exit',
          patternId: 'house_listening_pattern_808s_7',
          playbackMode: 'oneShot',
          startTick: bar13,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_8',
          lengthTicks: drumBlockTicks,
          name: 'Knock From Inside',
          patternId: 'house_listening_pattern_808s_8',
          playbackMode: 'oneShot',
          startTick: bar15,
          trackId: drumsTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'house_listening_section_seance',
          lengthTicks: barTicks * 4,
          name: 'Séance',
          startTick: 0,
        }),
        createSection({
          id: 'house_listening_section_possession',
          lengthTicks: barTicks * 4,
          name: 'Possession',
          startTick: bar5,
        }),
        createSection({
          id: 'house_listening_section_walls_answer',
          lengthTicks: barTicks * 4,
          name: 'The Walls Answer',
          startTick: bar9,
        }),
        createSection({
          id: 'house_listening_section_no_way_out',
          lengthTicks: barTicks * 4,
          name: 'No Way Out',
          startTick: bar13,
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createMelodicInstrument({
        id: 'keys.default',
        name: 'Haunted Upright Piano',
        soundId: 'keys.default',
      }),
      createMelodicInstrument({
        id: 'lead.default',
        name: 'Soft Sine Lead',
        soundId: 'sine.soft',
      }),
      createMelodicInstrument({
        id: 'voice.ghost',
        name: 'Breath Choir',
        soundId: 'voice.ghost',
      }),
      createDrumInstrument({
        id: 'drums.default',
        name: 'Possessed 808 Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.07,
            pitchSemitones: 4,
            soundId: 'drums.closedHat.default',
            volumeDb: -10,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.9,
            pitchSemitones: -12,
            soundId: 'drums.kick.default',
            volumeDb: 12,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.72,
            pitchSemitones: -5,
            soundId: 'drums.kick.default',
            volumeDb: 5,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.18,
            pitchSemitones: -3,
            soundId: 'drums.snare.default',
            volumeDb: 1,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({
          id: pianoTrack.mixChannelId,
          pan: -0.20,
          volumeDb: -4,
        }),
        createMixChannel({
          id: melodyTrack.mixChannelId,
          pan: 0.20,
          volumeDb: -8,
        }),
        createMixChannel({
          id: ghostVoiceTrack.mixChannelId,
          pan: -0.40,
          volumeDb: -5,
        }),
        createMixChannel({
          id: drumsTrack.mixChannelId,
          pan: 0,
          volumeDb: 6,
        }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createNoteEvents('house_listening_event_piano', [
          // Bar 1: Am(add9), rolled upward from A2 into a tight B/C cluster.
          createNoteEvent({ timeTick: 0, pitch: 45, durationTicks: sustainedPianoTicks, velocity: 78, id: 'house_listening_event_piano_1' }),
          createNoteEvent({ timeTick: thirtySecondNoteTicks, pitch: 52, durationTicks: sustainedPianoTicks, velocity: 66, id: 'house_listening_event_piano_2' }),
          createNoteEvent({ timeTick: thirtySecondNoteTicks * 2, pitch: 59, durationTicks: sustainedPianoTicks, velocity: 62, id: 'house_listening_event_piano_3' }),
          createNoteEvent({ timeTick: thirtySecondNoteTicks * 3, pitch: 60, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_4' }),
          createNoteEvent({ timeTick: thirtySecondNoteTicks * 4, pitch: 64, durationTicks: sustainedPianoTicks, velocity: 58, id: 'house_listening_event_piano_5' }),

          // Bar 2: Fmaj7(#11), keeping E and B suspended like distant bells.
          createNoteEvent({ timeTick: bar2, pitch: 41, durationTicks: sustainedPianoTicks, velocity: 74, id: 'house_listening_event_piano_6' }),
          createNoteEvent({ timeTick: bar2 + thirtySecondNoteTicks, pitch: 48, durationTicks: sustainedPianoTicks, velocity: 62, id: 'house_listening_event_piano_7' }),
          createNoteEvent({ timeTick: bar2 + (thirtySecondNoteTicks * 2), pitch: 52, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_8' }),
          createNoteEvent({ timeTick: bar2 + (thirtySecondNoteTicks * 3), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 58, id: 'house_listening_event_piano_9' }),
          createNoteEvent({ timeTick: bar2 + (thirtySecondNoteTicks * 4), pitch: 59, durationTicks: sustainedPianoTicks, velocity: 64, id: 'house_listening_event_piano_10' }),

          // Bar 3: Bbmaj7(#11), the borrowed bII from A Phrygian.
          createNoteEvent({ timeTick: bar3, pitch: 46, durationTicks: sustainedPianoTicks, velocity: 80, id: 'house_listening_event_piano_11' }),
          createNoteEvent({ timeTick: bar3 + thirtySecondNoteTicks, pitch: 53, durationTicks: sustainedPianoTicks, velocity: 64, id: 'house_listening_event_piano_12' }),
          createNoteEvent({ timeTick: bar3 + (thirtySecondNoteTicks * 2), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_13' }),
          createNoteEvent({ timeTick: bar3 + (thirtySecondNoteTicks * 3), pitch: 62, durationTicks: sustainedPianoTicks, velocity: 60, id: 'house_listening_event_piano_14' }),
          createNoteEvent({ timeTick: bar3 + (thirtySecondNoteTicks * 4), pitch: 64, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_15' }),

          // Bar 4: E7(b9), with F hanging over the dominant until the loop turns.
          createNoteEvent({ timeTick: bar4, pitch: 40, durationTicks: sustainedPianoTicks, velocity: 82, id: 'house_listening_event_piano_16' }),
          createNoteEvent({ timeTick: bar4 + thirtySecondNoteTicks, pitch: 47, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_17' }),
          createNoteEvent({ timeTick: bar4 + (thirtySecondNoteTicks * 2), pitch: 50, durationTicks: sustainedPianoTicks, velocity: 62, id: 'house_listening_event_piano_18' }),
          createNoteEvent({ timeTick: bar4 + (thirtySecondNoteTicks * 3), pitch: 56, durationTicks: sustainedPianoTicks, velocity: 72, id: 'house_listening_event_piano_19' }),
          createNoteEvent({ timeTick: bar4 + (thirtySecondNoteTicks * 4), pitch: 65, durationTicks: sustainedPianoTicks, velocity: 66, id: 'house_listening_event_piano_20' }),

          // Bar 5: Am11 opens the second pass into a wider minor cloud.
          createNoteEvent({ timeTick: bar5, pitch: 45, durationTicks: sustainedPianoTicks, velocity: 84, id: 'house_listening_event_piano_21' }),
          createNoteEvent({ timeTick: bar5 + thirtySecondNoteTicks, pitch: 52, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_22' }),
          createNoteEvent({ timeTick: bar5 + (thirtySecondNoteTicks * 2), pitch: 55, durationTicks: sustainedPianoTicks, velocity: 62, id: 'house_listening_event_piano_23' }),
          createNoteEvent({ timeTick: bar5 + (thirtySecondNoteTicks * 3), pitch: 59, durationTicks: sustainedPianoTicks, velocity: 66, id: 'house_listening_event_piano_24' }),
          createNoteEvent({ timeTick: bar5 + (thirtySecondNoteTicks * 4), pitch: 60, durationTicks: sustainedPianoTicks, velocity: 72, id: 'house_listening_event_piano_25' }),
          createNoteEvent({ timeTick: bar5 + (thirtySecondNoteTicks * 5), pitch: 62, durationTicks: sustainedPianoTicks, velocity: 58, id: 'house_listening_event_piano_26' }),

          // Bar 6: Fmaj9(#11), bright enough to feel deeply wrong.
          createNoteEvent({ timeTick: bar6, pitch: 41, durationTicks: sustainedPianoTicks, velocity: 78, id: 'house_listening_event_piano_27' }),
          createNoteEvent({ timeTick: bar6 + thirtySecondNoteTicks, pitch: 48, durationTicks: sustainedPianoTicks, velocity: 62, id: 'house_listening_event_piano_28' }),
          createNoteEvent({ timeTick: bar6 + (thirtySecondNoteTicks * 2), pitch: 52, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_29' }),
          createNoteEvent({ timeTick: bar6 + (thirtySecondNoteTicks * 3), pitch: 55, durationTicks: sustainedPianoTicks, velocity: 58, id: 'house_listening_event_piano_30' }),
          createNoteEvent({ timeTick: bar6 + (thirtySecondNoteTicks * 4), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 64, id: 'house_listening_event_piano_31' }),
          createNoteEvent({ timeTick: bar6 + (thirtySecondNoteTicks * 5), pitch: 59, durationTicks: sustainedPianoTicks, velocity: 60, id: 'house_listening_event_piano_32' }),

          // Bar 7: Bbmaj7(#11)/A presses the borrowed chord over an A pedal.
          createNoteEvent({ timeTick: bar7, pitch: 45, durationTicks: sustainedPianoTicks, velocity: 82, id: 'house_listening_event_piano_33' }),
          createNoteEvent({ timeTick: bar7 + thirtySecondNoteTicks, pitch: 53, durationTicks: sustainedPianoTicks, velocity: 62, id: 'house_listening_event_piano_34' }),
          createNoteEvent({ timeTick: bar7 + (thirtySecondNoteTicks * 2), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_35' }),
          createNoteEvent({ timeTick: bar7 + (thirtySecondNoteTicks * 3), pitch: 58, durationTicks: sustainedPianoTicks, velocity: 64, id: 'house_listening_event_piano_36' }),
          createNoteEvent({ timeTick: bar7 + (thirtySecondNoteTicks * 4), pitch: 62, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_37' }),
          createNoteEvent({ timeTick: bar7 + (thirtySecondNoteTicks * 5), pitch: 64, durationTicks: sustainedPianoTicks, velocity: 60, id: 'house_listening_event_piano_38' }),

          // Bar 8: E7(b9) stays unresolved so the first A feels inevitable.
          createNoteEvent({ timeTick: bar8, pitch: 40, durationTicks: sustainedPianoTicks, velocity: 86, id: 'house_listening_event_piano_39' }),
          createNoteEvent({ timeTick: bar8 + thirtySecondNoteTicks, pitch: 47, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_40' }),
          createNoteEvent({ timeTick: bar8 + (thirtySecondNoteTicks * 2), pitch: 50, durationTicks: sustainedPianoTicks, velocity: 64, id: 'house_listening_event_piano_41' }),
          createNoteEvent({ timeTick: bar8 + (thirtySecondNoteTicks * 3), pitch: 56, durationTicks: sustainedPianoTicks, velocity: 74, id: 'house_listening_event_piano_42' }),
          createNoteEvent({ timeTick: bar8 + (thirtySecondNoteTicks * 4), pitch: 65, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_43' }),
          createNoteEvent({ timeTick: bar8 + (thirtySecondNoteTicks * 5), pitch: 71, durationTicks: sustainedPianoTicks, velocity: 58, id: 'house_listening_event_piano_44' }),

          // Bar 9: Am9/G puts the familiar chord over a descending floorboard bass.
          createNoteEvent({ timeTick: bar9, pitch: 43, durationTicks: sustainedPianoTicks, velocity: 84, id: 'house_listening_event_piano_45' }),
          createNoteEvent({ timeTick: bar9 + thirtySecondNoteTicks, pitch: 45, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_46' }),
          createNoteEvent({ timeTick: bar9 + (thirtySecondNoteTicks * 2), pitch: 52, durationTicks: sustainedPianoTicks, velocity: 64, id: 'house_listening_event_piano_47' }),
          createNoteEvent({ timeTick: bar9 + (thirtySecondNoteTicks * 3), pitch: 59, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_48' }),
          createNoteEvent({ timeTick: bar9 + (thirtySecondNoteTicks * 4), pitch: 60, durationTicks: sustainedPianoTicks, velocity: 74, id: 'house_listening_event_piano_49' }),
          createNoteEvent({ timeTick: bar9 + (thirtySecondNoteTicks * 5), pitch: 64, durationTicks: sustainedPianoTicks, velocity: 62, id: 'house_listening_event_piano_50' }),

          // Bar 10: Fmaj9(#11)/A keeps the upper voices but lifts the bass.
          createNoteEvent({ timeTick: bar10, pitch: 45, durationTicks: sustainedPianoTicks, velocity: 80, id: 'house_listening_event_piano_51' }),
          createNoteEvent({ timeTick: bar10 + thirtySecondNoteTicks, pitch: 48, durationTicks: sustainedPianoTicks, velocity: 64, id: 'house_listening_event_piano_52' }),
          createNoteEvent({ timeTick: bar10 + (thirtySecondNoteTicks * 2), pitch: 52, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_53' }),
          createNoteEvent({ timeTick: bar10 + (thirtySecondNoteTicks * 3), pitch: 55, durationTicks: sustainedPianoTicks, velocity: 60, id: 'house_listening_event_piano_54' }),
          createNoteEvent({ timeTick: bar10 + (thirtySecondNoteTicks * 4), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 66, id: 'house_listening_event_piano_55' }),
          createNoteEvent({ timeTick: bar10 + (thirtySecondNoteTicks * 5), pitch: 59, durationTicks: sustainedPianoTicks, velocity: 62, id: 'house_listening_event_piano_56' }),

          // Bar 11: Bbmaj9(#11)/F makes the borrowed chord feel wider and heavier.
          createNoteEvent({ timeTick: bar11, pitch: 41, durationTicks: sustainedPianoTicks, velocity: 86, id: 'house_listening_event_piano_57' }),
          createNoteEvent({ timeTick: bar11 + thirtySecondNoteTicks, pitch: 46, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_58' }),
          createNoteEvent({ timeTick: bar11 + (thirtySecondNoteTicks * 2), pitch: 53, durationTicks: sustainedPianoTicks, velocity: 66, id: 'house_listening_event_piano_59' }),
          createNoteEvent({ timeTick: bar11 + (thirtySecondNoteTicks * 3), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 72, id: 'house_listening_event_piano_60' }),
          createNoteEvent({ timeTick: bar11 + (thirtySecondNoteTicks * 4), pitch: 60, durationTicks: sustainedPianoTicks, velocity: 64, id: 'house_listening_event_piano_61' }),
          createNoteEvent({ timeTick: bar11 + (thirtySecondNoteTicks * 5), pitch: 64, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_62' }),

          // Bar 12: E7sus4(b9) lets A and G# grind together before the turnaround.
          createNoteEvent({ timeTick: bar12, pitch: 40, durationTicks: sustainedPianoTicks, velocity: 88, id: 'house_listening_event_piano_63' }),
          createNoteEvent({ timeTick: bar12 + thirtySecondNoteTicks, pitch: 47, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_64' }),
          createNoteEvent({ timeTick: bar12 + (thirtySecondNoteTicks * 2), pitch: 50, durationTicks: sustainedPianoTicks, velocity: 66, id: 'house_listening_event_piano_65' }),
          createNoteEvent({ timeTick: bar12 + (thirtySecondNoteTicks * 3), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 74, id: 'house_listening_event_piano_66' }),
          createNoteEvent({ timeTick: bar12 + (thirtySecondNoteTicks * 4), pitch: 65, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_67' }),
          createNoteEvent({ timeTick: bar12 + (thirtySecondNoteTicks * 5), pitch: 68, durationTicks: sustainedPianoTicks, velocity: 76, id: 'house_listening_event_piano_68' }),

          // Bar 13: Am9/C begins the turnaround with the tonic already off balance.
          createNoteEvent({ timeTick: bar13, pitch: 48, durationTicks: sustainedPianoTicks, velocity: 84, id: 'house_listening_event_piano_69' }),
          createNoteEvent({ timeTick: bar13 + thirtySecondNoteTicks, pitch: 52, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_70' }),
          createNoteEvent({ timeTick: bar13 + (thirtySecondNoteTicks * 2), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 74, id: 'house_listening_event_piano_71' }),
          createNoteEvent({ timeTick: bar13 + (thirtySecondNoteTicks * 3), pitch: 59, durationTicks: sustainedPianoTicks, velocity: 62, id: 'house_listening_event_piano_72' }),
          createNoteEvent({ timeTick: bar13 + (thirtySecondNoteTicks * 4), pitch: 64, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_73' }),
          createNoteEvent({ timeTick: bar13 + (thirtySecondNoteTicks * 5), pitch: 69, durationTicks: sustainedPianoTicks, velocity: 66, id: 'house_listening_event_piano_74' }),

          // Bar 14: Dm9 pulls the harmony around the iv chord.
          createNoteEvent({ timeTick: bar14, pitch: 38, durationTicks: sustainedPianoTicks, velocity: 88, id: 'house_listening_event_piano_75' }),
          createNoteEvent({ timeTick: bar14 + thirtySecondNoteTicks, pitch: 45, durationTicks: sustainedPianoTicks, velocity: 70, id: 'house_listening_event_piano_76' }),
          createNoteEvent({ timeTick: bar14 + (thirtySecondNoteTicks * 2), pitch: 48, durationTicks: sustainedPianoTicks, velocity: 66, id: 'house_listening_event_piano_77' }),
          createNoteEvent({ timeTick: bar14 + (thirtySecondNoteTicks * 3), pitch: 53, durationTicks: sustainedPianoTicks, velocity: 74, id: 'house_listening_event_piano_78' }),
          createNoteEvent({ timeTick: bar14 + (thirtySecondNoteTicks * 4), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_79' }),
          createNoteEvent({ timeTick: bar14 + (thirtySecondNoteTicks * 5), pitch: 64, durationTicks: sustainedPianoTicks, velocity: 64, id: 'house_listening_event_piano_80' }),

          // Bar 15: Bbmaj7(#11) is the last open door before the dominant slams shut.
          createNoteEvent({ timeTick: bar15, pitch: 46, durationTicks: sustainedPianoTicks, velocity: 90, id: 'house_listening_event_piano_81' }),
          createNoteEvent({ timeTick: bar15 + thirtySecondNoteTicks, pitch: 53, durationTicks: sustainedPianoTicks, velocity: 72, id: 'house_listening_event_piano_82' }),
          createNoteEvent({ timeTick: bar15 + (thirtySecondNoteTicks * 2), pitch: 57, durationTicks: sustainedPianoTicks, velocity: 76, id: 'house_listening_event_piano_83' }),
          createNoteEvent({ timeTick: bar15 + (thirtySecondNoteTicks * 3), pitch: 60, durationTicks: sustainedPianoTicks, velocity: 68, id: 'house_listening_event_piano_84' }),
          createNoteEvent({ timeTick: bar15 + (thirtySecondNoteTicks * 4), pitch: 64, durationTicks: sustainedPianoTicks, velocity: 72, id: 'house_listening_event_piano_85' }),
          createNoteEvent({ timeTick: bar15 + (thirtySecondNoteTicks * 5), pitch: 69, durationTicks: sustainedPianoTicks, velocity: 66, id: 'house_listening_event_piano_86' }),

          // Bar 16: E7(b9,#11) holds still while the drums tear the room apart.
          createNoteEvent({ timeTick: bar16, pitch: 40, durationTicks: sustainedPianoTicks, velocity: 94, id: 'house_listening_event_piano_87' }),
          createNoteEvent({ timeTick: bar16 + thirtySecondNoteTicks, pitch: 47, durationTicks: sustainedPianoTicks, velocity: 76, id: 'house_listening_event_piano_88' }),
          createNoteEvent({ timeTick: bar16 + (thirtySecondNoteTicks * 2), pitch: 50, durationTicks: sustainedPianoTicks, velocity: 72, id: 'house_listening_event_piano_89' }),
          createNoteEvent({ timeTick: bar16 + (thirtySecondNoteTicks * 3), pitch: 56, durationTicks: sustainedPianoTicks, velocity: 80, id: 'house_listening_event_piano_90' }),
          createNoteEvent({ timeTick: bar16 + (thirtySecondNoteTicks * 4), pitch: 65, durationTicks: sustainedPianoTicks, velocity: 76, id: 'house_listening_event_piano_91' }),
          createNoteEvent({ timeTick: bar16 + (thirtySecondNoteTicks * 5), pitch: 70, durationTicks: sustainedPianoTicks, velocity: 82, id: 'house_listening_event_piano_92' }),
        ]),
        id: 'house_listening_pattern_piano',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          borrowedChord: 'Bbmaj7(#11), bII from A Phrygian',
          progression: 'Am(add9) - Fmaj7(#11) - Bbmaj7(#11) - E7(b9); turnaround: Am9/C - Dm9 - Bbmaj7(#11) - E7alt',
        },
        name: 'Piano — Distant Piano',
      }),
      ...splitPattern(createPattern({
        events: createNoteEvents('house_listening_event_melody', [
          // E5 is the anchor: fifth of Am, maj7 of F, #11 of Bb, and root of E7.
          // Bar 1: the hook — E, C-B, a long E, then A as the pickup.
          createNoteEvent({ timeTick: eighthNoteTicks, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 84, id: 'house_listening_event_melody_1' }),
          createNoteEvent({ timeTick: PPQ + eighthNoteTicks, pitch: 72, durationTicks: sixteenthNoteTicks, velocity: 70, id: 'house_listening_event_melody_2' }),
          createNoteEvent({ timeTick: PPQ + eighthNoteTicks + sixteenthNoteTicks, pitch: 71, durationTicks: sixteenthNoteTicks, velocity: 74, id: 'house_listening_event_melody_3' }),
          createNoteEvent({ timeTick: (PPQ * 2) + sixteenthNoteTicks, pitch: hookNote, durationTicks: PPQ + sixteenthNoteTicks, velocity: 88, id: 'house_listening_event_melody_4' }),
          createNoteEvent({ timeTick: (PPQ * 3) + eighthNoteTicks, pitch: 69, durationTicks: eighthNoteTicks, velocity: 72, id: 'house_listening_event_melody_5' }),

          // Bar 2: F answers upward through A-C-E-B and lands on E again.
          createNoteEvent({ timeTick: bar2, pitch: 69, durationTicks: eighthNoteTicks, velocity: 76, id: 'house_listening_event_melody_6' }),
          createNoteEvent({ timeTick: bar2 + PPQ, pitch: 72, durationTicks: eighthNoteTicks, velocity: 72, id: 'house_listening_event_melody_7' }),
          createNoteEvent({ timeTick: bar2 + PPQ + eighthNoteTicks + sixteenthNoteTicks, pitch: hookNote, durationTicks: sixteenthNoteTicks, velocity: 80, id: 'house_listening_event_melody_8' }),
          createNoteEvent({ timeTick: bar2 + (PPQ * 2) + sixteenthNoteTicks, pitch: 71, durationTicks: eighthNoteTicks, velocity: 74, id: 'house_listening_event_melody_9' }),
          createNoteEvent({ timeTick: bar2 + (PPQ * 3), pitch: hookNote, durationTicks: PPQ, velocity: 86, id: 'house_listening_event_melody_10' }),

          // Bar 3: the same contour turns uncanny over borrowed Bbmaj7(#11).
          createNoteEvent({ timeTick: bar3 + eighthNoteTicks, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 82, id: 'house_listening_event_melody_11' }),
          createNoteEvent({ timeTick: bar3 + PPQ + eighthNoteTicks, pitch: 74, durationTicks: sixteenthNoteTicks, velocity: 72, id: 'house_listening_event_melody_12' }),
          createNoteEvent({ timeTick: bar3 + PPQ + eighthNoteTicks + sixteenthNoteTicks, pitch: 70, durationTicks: sixteenthNoteTicks, velocity: 76, id: 'house_listening_event_melody_13' }),
          createNoteEvent({ timeTick: bar3 + (PPQ * 2) + sixteenthNoteTicks, pitch: 69, durationTicks: eighthNoteTicks, velocity: 70, id: 'house_listening_event_melody_14' }),
          createNoteEvent({ timeTick: bar3 + (PPQ * 3), pitch: hookNote, durationTicks: PPQ, velocity: 88, id: 'house_listening_event_melody_15' }),

          // Bar 4: G#-B-D-F circles the dominant before E snaps into focus.
          createNoteEvent({ timeTick: bar4, pitch: 68, durationTicks: eighthNoteTicks, velocity: 78, id: 'house_listening_event_melody_16' }),
          createNoteEvent({ timeTick: bar4 + PPQ, pitch: 71, durationTicks: eighthNoteTicks, velocity: 74, id: 'house_listening_event_melody_17' }),
          createNoteEvent({ timeTick: bar4 + PPQ + eighthNoteTicks + sixteenthNoteTicks, pitch: 74, durationTicks: sixteenthNoteTicks, velocity: 80, id: 'house_listening_event_melody_18' }),
          createNoteEvent({ timeTick: bar4 + (PPQ * 2) + sixteenthNoteTicks, pitch: 77, durationTicks: eighthNoteTicks, velocity: 76, id: 'house_listening_event_melody_19' }),
          createNoteEvent({ timeTick: bar4 + (PPQ * 3), pitch: hookNote, durationTicks: PPQ, velocity: 90, id: 'house_listening_event_melody_20' }),

          // Bars 5–8 repeat the melody so it sticks, then tighten the final F-E.
          createNoteEvent({ timeTick: bar5 + eighthNoteTicks, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 88, id: 'house_listening_event_melody_21' }),
          createNoteEvent({ timeTick: bar5 + PPQ + eighthNoteTicks, pitch: 72, durationTicks: sixteenthNoteTicks, velocity: 74, id: 'house_listening_event_melody_22' }),
          createNoteEvent({ timeTick: bar5 + PPQ + eighthNoteTicks + sixteenthNoteTicks, pitch: 71, durationTicks: sixteenthNoteTicks, velocity: 78, id: 'house_listening_event_melody_23' }),
          createNoteEvent({ timeTick: bar5 + (PPQ * 2) + sixteenthNoteTicks, pitch: hookNote, durationTicks: PPQ + sixteenthNoteTicks, velocity: 92, id: 'house_listening_event_melody_24' }),
          createNoteEvent({ timeTick: bar5 + (PPQ * 3) + eighthNoteTicks, pitch: 69, durationTicks: eighthNoteTicks, velocity: 76, id: 'house_listening_event_melody_25' }),

          createNoteEvent({ timeTick: bar6, pitch: 69, durationTicks: eighthNoteTicks, velocity: 80, id: 'house_listening_event_melody_26' }),
          createNoteEvent({ timeTick: bar6 + PPQ, pitch: 72, durationTicks: eighthNoteTicks, velocity: 76, id: 'house_listening_event_melody_27' }),
          createNoteEvent({ timeTick: bar6 + PPQ + eighthNoteTicks + sixteenthNoteTicks, pitch: hookNote, durationTicks: sixteenthNoteTicks, velocity: 84, id: 'house_listening_event_melody_28' }),
          createNoteEvent({ timeTick: bar6 + (PPQ * 2) + sixteenthNoteTicks, pitch: 71, durationTicks: eighthNoteTicks, velocity: 78, id: 'house_listening_event_melody_29' }),
          createNoteEvent({ timeTick: bar6 + (PPQ * 3), pitch: hookNote, durationTicks: PPQ, velocity: 90, id: 'house_listening_event_melody_30' }),

          createNoteEvent({ timeTick: bar7 + eighthNoteTicks, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 86, id: 'house_listening_event_melody_31' }),
          createNoteEvent({ timeTick: bar7 + PPQ + eighthNoteTicks, pitch: 74, durationTicks: sixteenthNoteTicks, velocity: 76, id: 'house_listening_event_melody_32' }),
          createNoteEvent({ timeTick: bar7 + PPQ + eighthNoteTicks + sixteenthNoteTicks, pitch: 70, durationTicks: sixteenthNoteTicks, velocity: 80, id: 'house_listening_event_melody_33' }),
          createNoteEvent({ timeTick: bar7 + (PPQ * 2) + sixteenthNoteTicks, pitch: 69, durationTicks: eighthNoteTicks, velocity: 74, id: 'house_listening_event_melody_34' }),
          createNoteEvent({ timeTick: bar7 + (PPQ * 3), pitch: hookNote, durationTicks: PPQ, velocity: 92, id: 'house_listening_event_melody_35' }),

          createNoteEvent({ timeTick: bar8, pitch: 68, durationTicks: eighthNoteTicks, velocity: 82, id: 'house_listening_event_melody_36' }),
          createNoteEvent({ timeTick: bar8 + PPQ, pitch: 71, durationTicks: eighthNoteTicks, velocity: 78, id: 'house_listening_event_melody_37' }),
          createNoteEvent({ timeTick: bar8 + PPQ + eighthNoteTicks + sixteenthNoteTicks, pitch: 74, durationTicks: sixteenthNoteTicks, velocity: 84, id: 'house_listening_event_melody_38' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 2) + sixteenthNoteTicks, pitch: 77, durationTicks: sixteenthNoteTicks, velocity: 80, id: 'house_listening_event_melody_39' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 2) + eighthNoteTicks, pitch: hookNote, durationTicks: PPQ + eighthNoteTicks, velocity: 94, id: 'house_listening_event_melody_40' }),

          // Bars 9–12 strip the original four-bar hook to its most recognizable notes.
          createNoteEvent({ timeTick: bar9 + eighthNoteTicks, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 82, id: 'house_listening_event_melody_41' }),
          createNoteEvent({ timeTick: bar9 + PPQ + eighthNoteTicks, pitch: 72, durationTicks: sixteenthNoteTicks, velocity: 68, id: 'house_listening_event_melody_42' }),
          createNoteEvent({ timeTick: bar9 + (PPQ * 2) + sixteenthNoteTicks, pitch: hookNote, durationTicks: PPQ + sixteenthNoteTicks, velocity: 86, id: 'house_listening_event_melody_43' }),

          createNoteEvent({ timeTick: bar10, pitch: 69, durationTicks: eighthNoteTicks, velocity: 72, id: 'house_listening_event_melody_44' }),
          createNoteEvent({ timeTick: bar10 + PPQ, pitch: 72, durationTicks: eighthNoteTicks, velocity: 70, id: 'house_listening_event_melody_45' }),
          createNoteEvent({ timeTick: bar10 + (PPQ * 3), pitch: hookNote, durationTicks: PPQ, velocity: 84, id: 'house_listening_event_melody_46' }),

          createNoteEvent({ timeTick: bar11 + eighthNoteTicks, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 80, id: 'house_listening_event_melody_47' }),
          createNoteEvent({ timeTick: bar11 + PPQ + eighthNoteTicks, pitch: 74, durationTicks: sixteenthNoteTicks, velocity: 70, id: 'house_listening_event_melody_48' }),
          createNoteEvent({ timeTick: bar11 + (PPQ * 2) + sixteenthNoteTicks, pitch: 69, durationTicks: eighthNoteTicks, velocity: 68, id: 'house_listening_event_melody_49' }),
          createNoteEvent({ timeTick: bar11 + (PPQ * 3), pitch: hookNote, durationTicks: PPQ, velocity: 86, id: 'house_listening_event_melody_50' }),

          createNoteEvent({ timeTick: bar12, pitch: 68, durationTicks: eighthNoteTicks, velocity: 76, id: 'house_listening_event_melody_51' }),
          createNoteEvent({ timeTick: bar12 + PPQ, pitch: 71, durationTicks: eighthNoteTicks, velocity: 72, id: 'house_listening_event_melody_52' }),
          createNoteEvent({ timeTick: bar12 + (PPQ * 2) + sixteenthNoteTicks, pitch: 77, durationTicks: eighthNoteTicks, velocity: 74, id: 'house_listening_event_melody_53' }),
          createNoteEvent({ timeTick: bar12 + (PPQ * 3), pitch: hookNote, durationTicks: PPQ, velocity: 88, id: 'house_listening_event_melody_54' }),

          // Bars 13–16 repeat that reduced shape over the turnaround, leaving room for Ghost Voice.
          createNoteEvent({ timeTick: bar13 + eighthNoteTicks, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 82, id: 'house_listening_event_melody_55' }),
          createNoteEvent({ timeTick: bar13 + PPQ + eighthNoteTicks, pitch: 72, durationTicks: sixteenthNoteTicks, velocity: 68, id: 'house_listening_event_melody_56' }),
          createNoteEvent({ timeTick: bar13 + (PPQ * 2) + sixteenthNoteTicks, pitch: hookNote, durationTicks: PPQ + sixteenthNoteTicks, velocity: 86, id: 'house_listening_event_melody_57' }),

          createNoteEvent({ timeTick: bar14, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 78, id: 'house_listening_event_melody_58' }),
          createNoteEvent({ timeTick: bar14 + PPQ, pitch: 74, durationTicks: eighthNoteTicks, velocity: 72, id: 'house_listening_event_melody_59' }),
          createNoteEvent({ timeTick: bar14 + (PPQ * 3), pitch: 69, durationTicks: PPQ, velocity: 82, id: 'house_listening_event_melody_60' }),

          createNoteEvent({ timeTick: bar15 + eighthNoteTicks, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 80, id: 'house_listening_event_melody_61' }),
          createNoteEvent({ timeTick: bar15 + PPQ + eighthNoteTicks, pitch: 74, durationTicks: sixteenthNoteTicks, velocity: 70, id: 'house_listening_event_melody_62' }),
          createNoteEvent({ timeTick: bar15 + (PPQ * 2) + sixteenthNoteTicks, pitch: 70, durationTicks: eighthNoteTicks, velocity: 72, id: 'house_listening_event_melody_63' }),
          createNoteEvent({ timeTick: bar15 + (PPQ * 3), pitch: hookNote, durationTicks: PPQ, velocity: 86, id: 'house_listening_event_melody_64' }),

          createNoteEvent({ timeTick: bar16, pitch: 68, durationTicks: eighthNoteTicks, velocity: 80, id: 'house_listening_event_melody_65' }),
          createNoteEvent({ timeTick: bar16 + PPQ, pitch: 71, durationTicks: eighthNoteTicks, velocity: 76, id: 'house_listening_event_melody_66' }),
          createNoteEvent({ timeTick: bar16 + (PPQ * 2) + sixteenthNoteTicks, pitch: 77, durationTicks: eighthNoteTicks, velocity: 78, id: 'house_listening_event_melody_67' }),
          createNoteEvent({ timeTick: bar16 + (PPQ * 5) / 2, pitch: hookNote, durationTicks: eighthNoteTicks, velocity: 88, id: 'house_listening_event_melody_68' }),
        ]),
        id: 'house_listening_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          harmonicRoles: 'E5: Am fifth, F maj7, Bb #11, E7 root',
          hook: 'E-C-B-E-A motif with chord-tone answers',
          variation: 'Bars 9–16 reduce the original hook to three or four notes per bar',
        },
        name: 'Melody — Hook Upstairs',
      }), melodyBlockTicks, [
        'Melody — Hook Upstairs I',
        'Melody — Hook Upstairs II',
        'Melody — Hook Upstairs III',
        'Melody — Hook Upstairs IV',
      ]),
      ...splitPattern(createPattern({
        events: createNoteEvents('house_listening_event_ghost_voice', [
          // Bars 9–12: a high, breathy counterline follows the inner notes of the new piano voicings.
          createNoteEvent({ timeTick: 0, pitch: 79, durationTicks: PPQ + eighthNoteTicks, velocity: 58, id: 'house_listening_event_ghost_voice_1' }),
          createNoteEvent({ timeTick: PPQ * 2, pitch: 83, durationTicks: PPQ, velocity: 62, id: 'house_listening_event_ghost_voice_2' }),
          createNoteEvent({ timeTick: PPQ * 3, pitch: 84, durationTicks: PPQ, velocity: 64, id: 'house_listening_event_ghost_voice_3' }),

          createNoteEvent({ timeTick: bar2, pitch: 81, durationTicks: PPQ + eighthNoteTicks, velocity: 60, id: 'house_listening_event_ghost_voice_4' }),
          createNoteEvent({ timeTick: bar2 + (PPQ * 2), pitch: 79, durationTicks: eighthNoteTicks, velocity: 56, id: 'house_listening_event_ghost_voice_5' }),
          createNoteEvent({ timeTick: bar2 + (PPQ * 5) / 2, pitch: 76, durationTicks: PPQ + eighthNoteTicks, velocity: 62, id: 'house_listening_event_ghost_voice_6' }),

          createNoteEvent({ timeTick: bar3, pitch: 77, durationTicks: PPQ, velocity: 58, id: 'house_listening_event_ghost_voice_7' }),
          createNoteEvent({ timeTick: bar3 + PPQ + eighthNoteTicks, pitch: 81, durationTicks: PPQ, velocity: 62, id: 'house_listening_event_ghost_voice_8' }),
          createNoteEvent({ timeTick: bar3 + (PPQ * 3), pitch: 88, durationTicks: PPQ, velocity: 66, id: 'house_listening_event_ghost_voice_9' }),

          createNoteEvent({ timeTick: bar4, pitch: 86, durationTicks: PPQ, velocity: 64, id: 'house_listening_event_ghost_voice_10' }),
          createNoteEvent({ timeTick: bar4 + (PPQ * 2), pitch: 89, durationTicks: eighthNoteTicks, velocity: 60, id: 'house_listening_event_ghost_voice_11' }),
          createNoteEvent({ timeTick: bar4 + (PPQ * 5) / 2, pitch: 88, durationTicks: PPQ + eighthNoteTicks, velocity: 66, id: 'house_listening_event_ghost_voice_12' }),

          // Bars 13–16: the voice descends through the turnaround, then suspends G# over the final fill.
          createNoteEvent({ timeTick: bar5, pitch: 84, durationTicks: PPQ + eighthNoteTicks, velocity: 62, id: 'house_listening_event_ghost_voice_13' }),
          createNoteEvent({ timeTick: bar5 + (PPQ * 2), pitch: 83, durationTicks: eighthNoteTicks, velocity: 58, id: 'house_listening_event_ghost_voice_14' }),
          createNoteEvent({ timeTick: bar5 + (PPQ * 3), pitch: 81, durationTicks: PPQ, velocity: 64, id: 'house_listening_event_ghost_voice_15' }),

          createNoteEvent({ timeTick: bar6, pitch: 77, durationTicks: PPQ + eighthNoteTicks, velocity: 60, id: 'house_listening_event_ghost_voice_16' }),
          createNoteEvent({ timeTick: bar6 + (PPQ * 2) - sixteenthNoteTicks, pitch: 76, durationTicks: PPQ - eighthNoteTicks, velocity: 58, id: 'house_listening_event_ghost_voice_17' }),
          createNoteEvent({ timeTick: bar6 + (PPQ * 3), pitch: 81, durationTicks: PPQ, velocity: 64, id: 'house_listening_event_ghost_voice_18' }),

          createNoteEvent({ timeTick: bar7, pitch: 82, durationTicks: PPQ, velocity: 62, id: 'house_listening_event_ghost_voice_19' }),
          createNoteEvent({ timeTick: bar7 + PPQ + eighthNoteTicks, pitch: 81, durationTicks: PPQ, velocity: 60, id: 'house_listening_event_ghost_voice_20' }),
          createNoteEvent({ timeTick: bar7 + (PPQ * 3), pitch: 88, durationTicks: PPQ, velocity: 68, id: 'house_listening_event_ghost_voice_21' }),

          createNoteEvent({ timeTick: bar8, pitch: 89, durationTicks: PPQ, velocity: 66, id: 'house_listening_event_ghost_voice_22' }),
          createNoteEvent({ timeTick: bar8 + PPQ + sixteenthNoteTicks, pitch: 86, durationTicks: eighthNoteTicks, velocity: 62, id: 'house_listening_event_ghost_voice_23' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 2), pitch: 83, durationTicks: eighthNoteTicks, velocity: 64, id: 'house_listening_event_ghost_voice_24' }),
          createNoteEvent({ timeTick: bar8 + (PPQ * 11) / 4, pitch: 80, durationTicks: PPQ + sixteenthNoteTicks, velocity: 70, id: 'house_listening_event_ghost_voice_25' }),
        ]),
        id: 'house_listening_pattern_ghost_voice',
        kind: 'note',
        lengthTicks: barTicks * 8,
        metadata: {
          contour: 'long upper-register phrases descending into a sustained G#5',
          role: 'countermelody for bars 9–16',
        },
        name: 'Ghost Voice — Through the House',
      }), melodyBlockTicks, [
        'Ghost Voice — Behind the Wallpaper',
        'Ghost Voice — Follow Me Home',
      ]),
      ...splitPattern(createPattern({
        events: createDrumHitEvents('house_listening_event_808s', [
          // A quiet eighth-note spine keeps the rolls legible.
          // ...Array.from(
          //   { length: Math.floor(totalTicks / eighthNoteTicks) },
          //   (_, index) => [
          //     index * eighthNoteTicks,
          //     'closedHat',
          //     index % 2 === 0 ? 36 : 46,
          //   ] as const,
          // ),

          ...Array.from(
            { length: Math.floor(totalTicks / eighthNoteTicks) },
            (_, index) => createDrumHitEvent({
              timeTick: index * eighthNoteTicks,
              piece: 'closedHat',
              velocity: index % 2 === 0 ? 36 : 46,
              id: `house_listening_event_808s_closedHat_${index + 1}`,
            }),
          ),

          // Bar 1: establish the halftime snare, then let the 808s answer it.
          createDrumHitEvent({ timeTick: 0, piece: 'lowTom', velocity: 88, id: 'house_listening_event_808s_1' }),
          createDrumHitEvent({ timeTick: 0, piece: 'kick', velocity: 127, id: 'house_listening_event_808s_2' }),
          createDrumHitEvent({ timeTick: (PPQ * 3) / 4, piece: 'kick', velocity: 104, id: 'house_listening_event_808s_3' }),
          createDrumHitEvent({ timeTick: (PPQ * 7) / 4, piece: 'lowTom', velocity: 112, id: 'house_listening_event_808s_4' }),
          createDrumHitEvent({ timeTick: PPQ * 2, piece: 'snare', velocity: 120, id: 'house_listening_event_808s_5' }),
          createDrumHitEvent({ timeTick: (PPQ * 5) / 2, piece: 'kick', velocity: 116, id: 'house_listening_event_808s_6' }),
          createDrumHitEvent({ timeTick: (PPQ * 13) / 4, piece: 'lowTom', velocity: 102, id: 'house_listening_event_808s_7' }),
          createDrumHitEvent({ timeTick: (PPQ * 3) + sixteenthNoteTicks, piece: 'closedHat', velocity: 68, id: 'house_listening_event_808s_8' }),
          createDrumHitEvent({ timeTick: (PPQ * 3) + sixteenthNoteTicks + thirtySecondNoteTicks, piece: 'closedHat', velocity: 76, id: 'house_listening_event_808s_9' }),
          createDrumHitEvent({ timeTick: (PPQ * 3) + eighthNoteTicks + thirtySecondNoteTicks, piece: 'closedHat', velocity: 84, id: 'house_listening_event_808s_10' }),
          createDrumHitEvent({ timeTick: (PPQ * 15) / 4, piece: 'closedHat', velocity: 92, id: 'house_listening_event_808s_11' }),
          createDrumHitEvent({ timeTick: barTicks - thirtySecondNoteTicks, piece: 'closedHat', velocity: 100, id: 'house_listening_event_808s_12' }),

          // Bar 2: pitched 808 answers and a ghost snare fake the turnaround.
          createDrumHitEvent({ timeTick: bar2, piece: 'kick', velocity: 124, id: 'house_listening_event_808s_13' }),
          createDrumHitEvent({ timeTick: bar2 + eighthNoteTicks, piece: 'lowTom', velocity: 106, id: 'house_listening_event_808s_14' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 5) / 4, piece: 'kick', velocity: 112, id: 'house_listening_event_808s_15' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 7) / 4, piece: 'lowTom', velocity: 118, id: 'house_listening_event_808s_16' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 2), piece: 'snare', velocity: 122, id: 'house_listening_event_808s_17' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 108, id: 'house_listening_event_808s_18' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 11) / 4, piece: 'lowTom', velocity: 114, id: 'house_listening_event_808s_19' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 3), piece: 'kick', velocity: 120, id: 'house_listening_event_808s_20' }),
          createDrumHitEvent({ timeTick: bar2 + (PPQ * 15) / 4, piece: 'snare', velocity: 48, id: 'house_listening_event_808s_21' }),

          // Bar 3: bII lands on the higher 808 before the sub drops beneath it.
          createDrumHitEvent({ timeTick: bar3, piece: 'lowTom', velocity: 124, id: 'house_listening_event_808s_22' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 3) / 4, piece: 'kick', velocity: 116, id: 'house_listening_event_808s_23' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 3) / 2, piece: 'kick', velocity: 108, id: 'house_listening_event_808s_24' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 2), piece: 'snare', velocity: 124, id: 'house_listening_event_808s_25' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 110, id: 'house_listening_event_808s_26' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 11) / 4, piece: 'lowTom', velocity: 118, id: 'house_listening_event_808s_27' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 13) / 4, piece: 'kick', velocity: 122, id: 'house_listening_event_808s_28' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 3) + sixteenthNoteTicks, piece: 'closedHat', velocity: 70, id: 'house_listening_event_808s_29' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 3) + sixteenthNoteTicks + thirtySecondNoteTicks, piece: 'closedHat', velocity: 78, id: 'house_listening_event_808s_30' }),
          createDrumHitEvent({ timeTick: bar3 + (PPQ * 15) / 4, piece: 'closedHat', velocity: 90, id: 'house_listening_event_808s_31' }),
          createDrumHitEvent({ timeTick: bar3 + barTicks - thirtySecondNoteTicks, piece: 'closedHat', velocity: 104, id: 'house_listening_event_808s_32' }),

          // Bar 4: the beat disappears, then claws back through a tuned fill.
          createDrumHitEvent({ timeTick: bar4, piece: 'kick', velocity: 120, id: 'house_listening_event_808s_33' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 2), piece: 'snare', velocity: 126, id: 'house_listening_event_808s_34' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 5) / 2, piece: 'kick', velocity: 112, id: 'house_listening_event_808s_35' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 3), piece: 'lowTom', velocity: 106, id: 'house_listening_event_808s_36' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 3) + sixteenthNoteTicks, piece: 'kick', velocity: 112, id: 'house_listening_event_808s_37' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 3) + eighthNoteTicks, piece: 'lowTom', velocity: 118, id: 'house_listening_event_808s_38' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 3) + eighthNoteTicks + thirtySecondNoteTicks, piece: 'closedHat', velocity: 88, id: 'house_listening_event_808s_39' }),
          createDrumHitEvent({ timeTick: bar4 + (PPQ * 15) / 4, piece: 'kick', velocity: 124, id: 'house_listening_event_808s_40' }),
          createDrumHitEvent({ timeTick: bar4 + barTicks - thirtySecondNoteTicks, piece: 'lowTom', velocity: 127, id: 'house_listening_event_808s_41' }),

          // Bar 5: possession — dense 808 punctuation around the fixed backbeat.
          createDrumHitEvent({ timeTick: bar5, piece: 'lowTom', velocity: 104, id: 'house_listening_event_808s_42' }),
          createDrumHitEvent({ timeTick: bar5, piece: 'kick', velocity: 127, id: 'house_listening_event_808s_43' }),
          createDrumHitEvent({ timeTick: bar5 + sixteenthNoteTicks, piece: 'kick', velocity: 104, id: 'house_listening_event_808s_44' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 3) / 4, piece: 'lowTom', velocity: 116, id: 'house_listening_event_808s_45' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 5) / 4, piece: 'kick', velocity: 110, id: 'house_listening_event_808s_46' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 7) / 4, piece: 'lowTom', velocity: 120, id: 'house_listening_event_808s_47' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 2), piece: 'snare', velocity: 127, id: 'house_listening_event_808s_48' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 114, id: 'house_listening_event_808s_49' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 11) / 4, piece: 'kick', velocity: 122, id: 'house_listening_event_808s_50' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 13) / 4, piece: 'lowTom', velocity: 116, id: 'house_listening_event_808s_51' }),
          createDrumHitEvent({ timeTick: bar5 + (PPQ * 15) / 4, piece: 'kick', velocity: 124, id: 'house_listening_event_808s_52' }),

          // Bar 6: a triplet 808 stutter twists against the straight hats.
          createDrumHitEvent({ timeTick: bar6, piece: 'kick', velocity: 126, id: 'house_listening_event_808s_53' }),
          createDrumHitEvent({ timeTick: bar6 + tripletTicks, piece: 'lowTom', velocity: 104, id: 'house_listening_event_808s_54' }),
          createDrumHitEvent({ timeTick: bar6 + (tripletTicks * 2), piece: 'kick', velocity: 112, id: 'house_listening_event_808s_55' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 3) / 2, piece: 'lowTom', velocity: 118, id: 'house_listening_event_808s_56' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 2), piece: 'snare', velocity: 126, id: 'house_listening_event_808s_57' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 2) + tripletTicks, piece: 'kick', velocity: 108, id: 'house_listening_event_808s_58' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 2) + (tripletTicks * 2), piece: 'lowTom', velocity: 116, id: 'house_listening_event_808s_59' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 3), piece: 'kick', velocity: 122, id: 'house_listening_event_808s_60' }),
          createDrumHitEvent({ timeTick: bar6 + (PPQ * 15) / 4, piece: 'snare', velocity: 52, id: 'house_listening_event_808s_61' }),

          // Bar 7: the borrowed chord returns under a full hat-roll panic.
          createDrumHitEvent({ timeTick: bar7, piece: 'lowTom', velocity: 127, id: 'house_listening_event_808s_62' }),
          createDrumHitEvent({ timeTick: bar7 + eighthNoteTicks, piece: 'kick', velocity: 112, id: 'house_listening_event_808s_63' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 5) / 4, piece: 'kick', velocity: 116, id: 'house_listening_event_808s_64' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 7) / 4, piece: 'lowTom', velocity: 122, id: 'house_listening_event_808s_65' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 2), piece: 'snare', velocity: 127, id: 'house_listening_event_808s_66' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 116, id: 'house_listening_event_808s_67' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 5) / 2, piece: 'closedHat', velocity: 74, id: 'house_listening_event_808s_68' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 5) / 2 + thirtySecondNoteTicks, piece: 'closedHat', velocity: 82, id: 'house_listening_event_808s_69' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 11) / 4, piece: 'kick', velocity: 124, id: 'house_listening_event_808s_70' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 3) + sixteenthNoteTicks, piece: 'closedHat', velocity: 86, id: 'house_listening_event_808s_71' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 3) + sixteenthNoteTicks + thirtySecondNoteTicks, piece: 'closedHat', velocity: 94, id: 'house_listening_event_808s_72' }),
          createDrumHitEvent({ timeTick: bar7 + (PPQ * 15) / 4, piece: 'kick', velocity: 126, id: 'house_listening_event_808s_73' }),

          // Bar 8: snare and tuned-808 rolls sprint into the unresolved E chord.
          createDrumHitEvent({ timeTick: bar8, piece: 'kick', velocity: 127, id: 'house_listening_event_808s_74' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 3) / 4, piece: 'lowTom', velocity: 116, id: 'house_listening_event_808s_75' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 3) / 2, piece: 'kick', velocity: 122, id: 'house_listening_event_808s_76' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 2), piece: 'lowTom', velocity: 106, id: 'house_listening_event_808s_77' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 2), piece: 'snare', velocity: 127, id: 'house_listening_event_808s_78' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 116, id: 'house_listening_event_808s_79' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 5) / 2, piece: 'lowTom', velocity: 120, id: 'house_listening_event_808s_80' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 11) / 4, piece: 'kick', velocity: 124, id: 'house_listening_event_808s_81' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 3), piece: 'snare', velocity: 76, id: 'house_listening_event_808s_82' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 3) + sixteenthNoteTicks, piece: 'lowTom', velocity: 112, id: 'house_listening_event_808s_83' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 3) + eighthNoteTicks, piece: 'snare', velocity: 92, id: 'house_listening_event_808s_84' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 3) + eighthNoteTicks + thirtySecondNoteTicks, piece: 'kick', velocity: 120, id: 'house_listening_event_808s_85' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 15) / 4, piece: 'snare', velocity: 108, id: 'house_listening_event_808s_86' }),
          createDrumHitEvent({ timeTick: bar8 + (PPQ * 15) / 4 + thirtySecondNoteTicks, piece: 'lowTom', velocity: 124, id: 'house_listening_event_808s_87' }),
          createDrumHitEvent({ timeTick: bar8 + barTicks - thirtySecondNoteTicks, piece: 'kick', velocity: 127, id: 'house_listening_event_808s_88' }),

          // Bar 9: the original footsteps return with the kick displaced under the hook.
          createDrumHitEvent({ timeTick: bar9, piece: 'lowTom', velocity: 96, id: 'house_listening_event_808s_89' }),
          createDrumHitEvent({ timeTick: bar9, piece: 'kick', velocity: 127, id: 'house_listening_event_808s_90' }),
          createDrumHitEvent({ timeTick: bar9 + (PPQ * 3) / 4, piece: 'kick', velocity: 110, id: 'house_listening_event_808s_91' }),
          createDrumHitEvent({ timeTick: bar9 + (PPQ * 7) / 4, piece: 'lowTom', velocity: 118, id: 'house_listening_event_808s_92' }),
          createDrumHitEvent({ timeTick: bar9 + (PPQ * 2), piece: 'snare', velocity: 124, id: 'house_listening_event_808s_93' }),
          createDrumHitEvent({ timeTick: bar9 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 114, id: 'house_listening_event_808s_94' }),
          createDrumHitEvent({ timeTick: bar9 + (PPQ * 11) / 4, piece: 'lowTom', velocity: 108, id: 'house_listening_event_808s_95' }),
          createDrumHitEvent({ timeTick: bar9 + (PPQ * 13) / 4, piece: 'kick', velocity: 122, id: 'house_listening_event_808s_96' }),
          createDrumHitEvent({ timeTick: bar9 + (PPQ * 3) + sixteenthNoteTicks, piece: 'closedHat', velocity: 78, id: 'house_listening_event_808s_97' }),
          createDrumHitEvent({ timeTick: bar9 + (PPQ * 3) + sixteenthNoteTicks + thirtySecondNoteTicks, piece: 'closedHat', velocity: 92, id: 'house_listening_event_808s_98' }),
          createDrumHitEvent({ timeTick: bar9 + (PPQ * 15) / 4, piece: 'kick', velocity: 126, id: 'house_listening_event_808s_99' }),

          // Bar 10: the familiar answer gets a heavier tuned-808 counter-rhythm.
          createDrumHitEvent({ timeTick: bar10, piece: 'kick', velocity: 126, id: 'house_listening_event_808s_100' }),
          createDrumHitEvent({ timeTick: bar10 + eighthNoteTicks, piece: 'lowTom', velocity: 110, id: 'house_listening_event_808s_101' }),
          createDrumHitEvent({ timeTick: bar10 + (PPQ * 5) / 4, piece: 'kick', velocity: 116, id: 'house_listening_event_808s_102' }),
          createDrumHitEvent({ timeTick: bar10 + (PPQ * 7) / 4, piece: 'lowTom', velocity: 122, id: 'house_listening_event_808s_103' }),
          createDrumHitEvent({ timeTick: bar10 + (PPQ * 2), piece: 'snare', velocity: 126, id: 'house_listening_event_808s_104' }),
          createDrumHitEvent({ timeTick: bar10 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 112, id: 'house_listening_event_808s_105' }),
          createDrumHitEvent({ timeTick: bar10 + (PPQ * 11) / 4, piece: 'lowTom', velocity: 118, id: 'house_listening_event_808s_106' }),
          createDrumHitEvent({ timeTick: bar10 + (PPQ * 3), piece: 'kick', velocity: 124, id: 'house_listening_event_808s_107' }),
          createDrumHitEvent({ timeTick: bar10 + (PPQ * 7) / 2, piece: 'lowTom', velocity: 114, id: 'house_listening_event_808s_108' }),
          createDrumHitEvent({ timeTick: bar10 + (PPQ * 15) / 4, piece: 'snare', velocity: 58, id: 'house_listening_event_808s_109' }),

          // Bar 11: the bII lands hard, followed by a skittering hat answer.
          createDrumHitEvent({ timeTick: bar11, piece: 'lowTom', velocity: 127, id: 'house_listening_event_808s_110' }),
          createDrumHitEvent({ timeTick: bar11, piece: 'kick', velocity: 120, id: 'house_listening_event_808s_111' }),
          createDrumHitEvent({ timeTick: bar11 + (PPQ * 3) / 4, piece: 'kick', velocity: 114, id: 'house_listening_event_808s_112' }),
          createDrumHitEvent({ timeTick: bar11 + (PPQ * 3) / 2, piece: 'lowTom', velocity: 120, id: 'house_listening_event_808s_113' }),
          createDrumHitEvent({ timeTick: bar11 + (PPQ * 2), piece: 'snare', velocity: 127, id: 'house_listening_event_808s_114' }),
          createDrumHitEvent({ timeTick: bar11 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 116, id: 'house_listening_event_808s_115' }),
          createDrumHitEvent({ timeTick: bar11 + (PPQ * 5) / 2, piece: 'lowTom', velocity: 122, id: 'house_listening_event_808s_116' }),
          createDrumHitEvent({ timeTick: bar11 + (PPQ * 13) / 4, piece: 'kick', velocity: 125, id: 'house_listening_event_808s_117' }),
          createDrumHitEvent({ timeTick: bar11 + (PPQ * 13) / 4 + thirtySecondNoteTicks, piece: 'closedHat', velocity: 82, id: 'house_listening_event_808s_118' }),
          createDrumHitEvent({ timeTick: bar11 + (PPQ * 7) / 2 + thirtySecondNoteTicks, piece: 'closedHat', velocity: 94, id: 'house_listening_event_808s_119' }),
          createDrumHitEvent({ timeTick: bar11 + barTicks - thirtySecondNoteTicks, piece: 'closedHat', velocity: 108, id: 'house_listening_event_808s_120' }),

          // Bar 12: triplet 808s push against the straight hats and crack open the turnaround.
          createDrumHitEvent({ timeTick: bar12, piece: 'kick', velocity: 127, id: 'house_listening_event_808s_121' }),
          createDrumHitEvent({ timeTick: bar12 + tripletTicks, piece: 'lowTom', velocity: 108, id: 'house_listening_event_808s_122' }),
          createDrumHitEvent({ timeTick: bar12 + (tripletTicks * 2), piece: 'kick', velocity: 116, id: 'house_listening_event_808s_123' }),
          createDrumHitEvent({ timeTick: bar12 + (PPQ * 3) / 2, piece: 'lowTom', velocity: 122, id: 'house_listening_event_808s_124' }),
          createDrumHitEvent({ timeTick: bar12 + (PPQ * 2), piece: 'snare', velocity: 127, id: 'house_listening_event_808s_125' }),
          createDrumHitEvent({ timeTick: bar12 + (PPQ * 2) + tripletTicks, piece: 'kick', velocity: 112, id: 'house_listening_event_808s_126' }),
          createDrumHitEvent({ timeTick: bar12 + (PPQ * 2) + (tripletTicks * 2), piece: 'lowTom', velocity: 120, id: 'house_listening_event_808s_127' }),
          createDrumHitEvent({ timeTick: bar12 + (PPQ * 3), piece: 'kick', velocity: 124, id: 'house_listening_event_808s_128' }),
          createDrumHitEvent({ timeTick: bar12 + (PPQ * 3) + sixteenthNoteTicks, piece: 'closedHat', velocity: 82, id: 'house_listening_event_808s_129' }),
          createDrumHitEvent({ timeTick: bar12 + (PPQ * 3) + sixteenthNoteTicks + thirtySecondNoteTicks, piece: 'closedHat', velocity: 98, id: 'house_listening_event_808s_130' }),
          createDrumHitEvent({ timeTick: bar12 + (PPQ * 15) / 4, piece: 'snare', velocity: 64, id: 'house_listening_event_808s_131' }),

          // Bar 13: the turnaround begins low and grounded, still holding the halftime backbeat.
          createDrumHitEvent({ timeTick: bar13, piece: 'kick', velocity: 127, id: 'house_listening_event_808s_132' }),
          createDrumHitEvent({ timeTick: bar13, piece: 'lowTom', velocity: 104, id: 'house_listening_event_808s_133' }),
          createDrumHitEvent({ timeTick: bar13 + (PPQ * 3) / 4, piece: 'kick', velocity: 112, id: 'house_listening_event_808s_134' }),
          createDrumHitEvent({ timeTick: bar13 + (PPQ * 7) / 4, piece: 'lowTom', velocity: 118, id: 'house_listening_event_808s_135' }),
          createDrumHitEvent({ timeTick: bar13 + (PPQ * 2), piece: 'snare', velocity: 126, id: 'house_listening_event_808s_136' }),
          createDrumHitEvent({ timeTick: bar13 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 116, id: 'house_listening_event_808s_137' }),
          createDrumHitEvent({ timeTick: bar13 + (PPQ * 11) / 4, piece: 'lowTom', velocity: 112, id: 'house_listening_event_808s_138' }),
          createDrumHitEvent({ timeTick: bar13 + (PPQ * 13) / 4, piece: 'kick', velocity: 124, id: 'house_listening_event_808s_139' }),
          createDrumHitEvent({ timeTick: bar13 + (PPQ * 7) / 2 + thirtySecondNoteTicks, piece: 'closedHat', velocity: 92, id: 'house_listening_event_808s_140' }),
          createDrumHitEvent({ timeTick: bar13 + barTicks - thirtySecondNoteTicks, piece: 'closedHat', velocity: 106, id: 'house_listening_event_808s_141' }),

          // Bar 14: ghost snares pull the backbeat forward as the exit starts to close.
          createDrumHitEvent({ timeTick: bar14, piece: 'lowTom', velocity: 118, id: 'house_listening_event_808s_142' }),
          createDrumHitEvent({ timeTick: bar14 + eighthNoteTicks, piece: 'kick', velocity: 120, id: 'house_listening_event_808s_143' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 5) / 4, piece: 'snare', velocity: 56, id: 'house_listening_event_808s_144' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 3) / 2, piece: 'kick', velocity: 114, id: 'house_listening_event_808s_145' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 7) / 4, piece: 'lowTom', velocity: 122, id: 'house_listening_event_808s_146' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 2), piece: 'snare', velocity: 127, id: 'house_listening_event_808s_147' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 118, id: 'house_listening_event_808s_148' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 5) / 2, piece: 'snare', velocity: 68, id: 'house_listening_event_808s_149' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 11) / 4, piece: 'lowTom', velocity: 120, id: 'house_listening_event_808s_150' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 3), piece: 'kick', velocity: 126, id: 'house_listening_event_808s_151' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 7) / 2, piece: 'snare', velocity: 86, id: 'house_listening_event_808s_152' }),
          createDrumHitEvent({ timeTick: bar14 + (PPQ * 15) / 4, piece: 'lowTom', velocity: 124, id: 'house_listening_event_808s_153' }),

          // Bar 15: a sparse knock-and-answer groove leaves the borrowed chord exposed.
          createDrumHitEvent({ timeTick: bar15, piece: 'kick', velocity: 126, id: 'house_listening_event_808s_154' }),
          createDrumHitEvent({ timeTick: bar15 + (PPQ * 3) / 2, piece: 'lowTom', velocity: 112, id: 'house_listening_event_808s_155' }),
          createDrumHitEvent({ timeTick: bar15 + (PPQ * 2), piece: 'snare', velocity: 126, id: 'house_listening_event_808s_156' }),
          createDrumHitEvent({ timeTick: bar15 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 116, id: 'house_listening_event_808s_157' }),
          createDrumHitEvent({ timeTick: bar15 + (PPQ * 15) / 4, piece: 'lowTom', velocity: 120, id: 'house_listening_event_808s_158' }),

          // Bar 16: the answer contracts into three final impacts instead of a kit roll.
          createDrumHitEvent({ timeTick: bar16, piece: 'kick', velocity: 127, id: 'house_listening_event_808s_159' }),
          createDrumHitEvent({ timeTick: bar16 + (PPQ * 3) / 4, piece: 'lowTom', velocity: 108, id: 'house_listening_event_808s_160' }),
          createDrumHitEvent({ timeTick: bar16 + (PPQ * 3) / 2, piece: 'kick', velocity: 120, id: 'house_listening_event_808s_161' }),
          createDrumHitEvent({ timeTick: bar16 + (PPQ * 2), piece: 'snare', velocity: 127, id: 'house_listening_event_808s_162' }),
          createDrumHitEvent({ timeTick: bar16 + (PPQ * 2) + sixteenthNoteTicks, piece: 'kick', velocity: 114, id: 'house_listening_event_808s_163' }),
          createDrumHitEvent({ timeTick: bar16 + (PPQ * 11) / 4, piece: 'lowTom', velocity: 116, id: 'house_listening_event_808s_164' }),
          createDrumHitEvent({ timeTick: bar16 + (PPQ * 7) / 2, piece: 'snare', velocity: 72, id: 'house_listening_event_808s_165' }),
          createDrumHitEvent({ timeTick: bar16 + (PPQ * 15) / 4, piece: 'kick', velocity: 127, id: 'house_listening_event_808s_166' }),
        ]),
        id: 'house_listening_pattern_808s',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'halftime trap with tuned 808 answers, panic-roll hats, and a sparse final knock-and-answer cadence',
        },
        name: 'Something Is Running',
      }), drumBlockTicks, [
        '808s I — Footsteps',
        '808s II — Door Opens',
        '808s III — Possession',
        '808s IV — Run',
        '808s V — Walls Answer',
        '808s VI — Floor Gives Way',
        '808s VII — False Exit',
        '808s VIII — Knock From Inside',
      ]),
    ]),
    project: createProject({
      id: 'project_the_house_is_listening',
      metadata: createProjectMetadata({
        description: 'A sixteen-bar haunted-piano beat in A minor, with possessed 808s, an E-centered earworm, a spectral counter-melody, a bII borrowed from A Phrygian, and a four-bar turnaround that ends in a final knock-and-answer cadence.',
        tags: ['haunted', 'piano', '808', 'ghost-voice', 'modal-interchange', 'earworm'],
      }),
      name: 'The House Is Listening',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          key: { mode: 'minor', tonic: 9 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'house_listening_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 110,
          id: 'house_listening_tempo',
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
