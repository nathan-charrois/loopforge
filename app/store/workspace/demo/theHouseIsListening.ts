import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import { createBlock, createDrumHitEvent, createDrumInstrument, createDrumPieceSound, createKeyEvent, createMelodicInstrument, createMeterEvent, createMixChannel, createMixer, createNoteEvent, createPattern, createProject, createProjectMetadata, createSection, createTempoEvent, createTimeline, createTrack, type DrumPiece, type DurationTicks, type Instrument, type MidiNote, type Pattern, PPQ, type Tick, type Velocity } from '~/domain'
import { createEntityStore } from '~/store/type'

export function theHouseIsListening(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 8
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
  const drumsTrack = createTrack({
    color: '#ba3239',
    id: 'house_listening_track_808s',
    instrumentId: 'drums.default',
    name: 'Possessed 808s',
    role: 'drums',
  })

  const tracks = [pianoTrack, melodyTrack, drumsTrack]

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
          color: drumsTrack.color,
          id: 'house_listening_block_808s_1',
          lengthTicks: drumBlockTicks,
          name: '808s — Footsteps',
          patternId: 'house_listening_pattern_808s_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_2',
          lengthTicks: drumBlockTicks,
          name: '808s — Door Opens',
          patternId: 'house_listening_pattern_808s_2',
          playbackMode: 'oneShot',
          startTick: bar3,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_3',
          lengthTicks: drumBlockTicks,
          name: '808s — Possession',
          patternId: 'house_listening_pattern_808s_3',
          playbackMode: 'oneShot',
          startTick: bar5,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'house_listening_block_808s_4',
          lengthTicks: drumBlockTicks,
          name: '808s — Run',
          patternId: 'house_listening_pattern_808s_4',
          playbackMode: 'oneShot',
          startTick: bar7,
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
          pan: -0.30,
          volumeDb: -1,
        }),
        createMixChannel({
          id: melodyTrack.mixChannelId,
          pan: 0.30,
          volumeDb: -3,
        }),
        createMixChannel({
          id: drumsTrack.mixChannelId,
          pan: 0,
          volumeDb: 7,
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
          [0, 45, sustainedPianoTicks, 78],
          [thirtySecondNoteTicks, 52, sustainedPianoTicks, 66],
          [thirtySecondNoteTicks * 2, 59, sustainedPianoTicks, 62],
          [thirtySecondNoteTicks * 3, 60, sustainedPianoTicks, 70],
          [thirtySecondNoteTicks * 4, 64, sustainedPianoTicks, 58],

          // Bar 2: Fmaj7(#11), keeping E and B suspended like distant bells.
          [bar2, 41, sustainedPianoTicks, 74],
          [bar2 + thirtySecondNoteTicks, 48, sustainedPianoTicks, 62],
          [bar2 + (thirtySecondNoteTicks * 2), 52, sustainedPianoTicks, 68],
          [bar2 + (thirtySecondNoteTicks * 3), 57, sustainedPianoTicks, 58],
          [bar2 + (thirtySecondNoteTicks * 4), 59, sustainedPianoTicks, 64],

          // Bar 3: Bbmaj7(#11), the borrowed bII from A Phrygian.
          [bar3, 46, sustainedPianoTicks, 80],
          [bar3 + thirtySecondNoteTicks, 53, sustainedPianoTicks, 64],
          [bar3 + (thirtySecondNoteTicks * 2), 57, sustainedPianoTicks, 70],
          [bar3 + (thirtySecondNoteTicks * 3), 62, sustainedPianoTicks, 60],
          [bar3 + (thirtySecondNoteTicks * 4), 64, sustainedPianoTicks, 68],

          // Bar 4: E7(b9), with F hanging over the dominant until the loop turns.
          [bar4, 40, sustainedPianoTicks, 82],
          [bar4 + thirtySecondNoteTicks, 47, sustainedPianoTicks, 68],
          [bar4 + (thirtySecondNoteTicks * 2), 50, sustainedPianoTicks, 62],
          [bar4 + (thirtySecondNoteTicks * 3), 56, sustainedPianoTicks, 72],
          [bar4 + (thirtySecondNoteTicks * 4), 65, sustainedPianoTicks, 66],

          // Bar 5: Am11 opens the second pass into a wider minor cloud.
          [bar5, 45, sustainedPianoTicks, 84],
          [bar5 + thirtySecondNoteTicks, 52, sustainedPianoTicks, 68],
          [bar5 + (thirtySecondNoteTicks * 2), 55, sustainedPianoTicks, 62],
          [bar5 + (thirtySecondNoteTicks * 3), 59, sustainedPianoTicks, 66],
          [bar5 + (thirtySecondNoteTicks * 4), 60, sustainedPianoTicks, 72],
          [bar5 + (thirtySecondNoteTicks * 5), 62, sustainedPianoTicks, 58],

          // Bar 6: Fmaj9(#11), bright enough to feel deeply wrong.
          [bar6, 41, sustainedPianoTicks, 78],
          [bar6 + thirtySecondNoteTicks, 48, sustainedPianoTicks, 62],
          [bar6 + (thirtySecondNoteTicks * 2), 52, sustainedPianoTicks, 68],
          [bar6 + (thirtySecondNoteTicks * 3), 55, sustainedPianoTicks, 58],
          [bar6 + (thirtySecondNoteTicks * 4), 57, sustainedPianoTicks, 64],
          [bar6 + (thirtySecondNoteTicks * 5), 59, sustainedPianoTicks, 60],

          // Bar 7: Bbmaj7(#11)/A presses the borrowed chord over an A pedal.
          [bar7, 45, sustainedPianoTicks, 82],
          [bar7 + thirtySecondNoteTicks, 53, sustainedPianoTicks, 62],
          [bar7 + (thirtySecondNoteTicks * 2), 57, sustainedPianoTicks, 70],
          [bar7 + (thirtySecondNoteTicks * 3), 58, sustainedPianoTicks, 64],
          [bar7 + (thirtySecondNoteTicks * 4), 62, sustainedPianoTicks, 68],
          [bar7 + (thirtySecondNoteTicks * 5), 64, sustainedPianoTicks, 60],

          // Bar 8: E7(b9) stays unresolved so the first A feels inevitable.
          [bar8, 40, sustainedPianoTicks, 86],
          [bar8 + thirtySecondNoteTicks, 47, sustainedPianoTicks, 70],
          [bar8 + (thirtySecondNoteTicks * 2), 50, sustainedPianoTicks, 64],
          [bar8 + (thirtySecondNoteTicks * 3), 56, sustainedPianoTicks, 74],
          [bar8 + (thirtySecondNoteTicks * 4), 65, sustainedPianoTicks, 68],
          [bar8 + (thirtySecondNoteTicks * 5), 71, sustainedPianoTicks, 58],
        ]),
        id: 'house_listening_pattern_piano',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          borrowedChord: 'Bbmaj7(#11), bII from A Phrygian',
          progression: 'Am(add9) - Fmaj7(#11) - Bbmaj7(#11) - E7(b9)',
        },
        name: 'Piano — Distant Piano',
      }),
      ...splitPattern(createPattern({
        events: createNoteEvents('house_listening_event_melody', [
          // E5 is the anchor: fifth of Am, maj7 of F, #11 of Bb, and root of E7.
          // Bar 1: the hook — E, C-B, a long E, then A as the pickup.
          [eighthNoteTicks, hookNote, eighthNoteTicks, 84],
          [PPQ + eighthNoteTicks, 72, sixteenthNoteTicks, 70],
          [PPQ + eighthNoteTicks + sixteenthNoteTicks, 71, sixteenthNoteTicks, 74],
          [(PPQ * 2) + sixteenthNoteTicks, hookNote, PPQ + sixteenthNoteTicks, 88],
          [(PPQ * 3) + eighthNoteTicks, 69, eighthNoteTicks, 72],

          // Bar 2: F answers upward through A-C-E-B and lands on E again.
          [bar2, 69, eighthNoteTicks, 76],
          [bar2 + PPQ, 72, eighthNoteTicks, 72],
          [bar2 + PPQ + eighthNoteTicks + sixteenthNoteTicks, hookNote, sixteenthNoteTicks, 80],
          [bar2 + (PPQ * 2) + sixteenthNoteTicks, 71, eighthNoteTicks, 74],
          [bar2 + (PPQ * 3), hookNote, PPQ, 86],

          // Bar 3: the same contour turns uncanny over borrowed Bbmaj7(#11).
          [bar3 + eighthNoteTicks, hookNote, eighthNoteTicks, 82],
          [bar3 + PPQ + eighthNoteTicks, 74, sixteenthNoteTicks, 72],
          [bar3 + PPQ + eighthNoteTicks + sixteenthNoteTicks, 70, sixteenthNoteTicks, 76],
          [bar3 + (PPQ * 2) + sixteenthNoteTicks, 69, eighthNoteTicks, 70],
          [bar3 + (PPQ * 3), hookNote, PPQ, 88],

          // Bar 4: G#-B-D-F circles the dominant before E snaps into focus.
          [bar4, 68, eighthNoteTicks, 78],
          [bar4 + PPQ, 71, eighthNoteTicks, 74],
          [bar4 + PPQ + eighthNoteTicks + sixteenthNoteTicks, 74, sixteenthNoteTicks, 80],
          [bar4 + (PPQ * 2) + sixteenthNoteTicks, 77, eighthNoteTicks, 76],
          [bar4 + (PPQ * 3), hookNote, PPQ, 90],

          // Bars 5–8 repeat the melody so it sticks, then tighten the final F-E.
          [bar5 + eighthNoteTicks, hookNote, eighthNoteTicks, 88],
          [bar5 + PPQ + eighthNoteTicks, 72, sixteenthNoteTicks, 74],
          [bar5 + PPQ + eighthNoteTicks + sixteenthNoteTicks, 71, sixteenthNoteTicks, 78],
          [bar5 + (PPQ * 2) + sixteenthNoteTicks, hookNote, PPQ + sixteenthNoteTicks, 92],
          [bar5 + (PPQ * 3) + eighthNoteTicks, 69, eighthNoteTicks, 76],

          [bar6, 69, eighthNoteTicks, 80],
          [bar6 + PPQ, 72, eighthNoteTicks, 76],
          [bar6 + PPQ + eighthNoteTicks + sixteenthNoteTicks, hookNote, sixteenthNoteTicks, 84],
          [bar6 + (PPQ * 2) + sixteenthNoteTicks, 71, eighthNoteTicks, 78],
          [bar6 + (PPQ * 3), hookNote, PPQ, 90],

          [bar7 + eighthNoteTicks, hookNote, eighthNoteTicks, 86],
          [bar7 + PPQ + eighthNoteTicks, 74, sixteenthNoteTicks, 76],
          [bar7 + PPQ + eighthNoteTicks + sixteenthNoteTicks, 70, sixteenthNoteTicks, 80],
          [bar7 + (PPQ * 2) + sixteenthNoteTicks, 69, eighthNoteTicks, 74],
          [bar7 + (PPQ * 3), hookNote, PPQ, 92],

          [bar8, 68, eighthNoteTicks, 82],
          [bar8 + PPQ, 71, eighthNoteTicks, 78],
          [bar8 + PPQ + eighthNoteTicks + sixteenthNoteTicks, 74, sixteenthNoteTicks, 84],
          [bar8 + (PPQ * 2) + sixteenthNoteTicks, 77, sixteenthNoteTicks, 80],
          [bar8 + (PPQ * 2) + eighthNoteTicks, hookNote, PPQ + eighthNoteTicks, 94],
        ]),
        id: 'house_listening_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          harmonicRoles: 'E5: Am fifth, F maj7, Bb #11, E7 root',
          hook: 'E-C-B-E-A motif with chord-tone answers',
        },
        name: 'Melody — Hook Upstairs',
      }), melodyBlockTicks, [
        'Melody — Hook Upstairs I',
        'Melody — Hook Upstairs II',
      ]),
      ...splitPattern(createPattern({
        events: createDrumHitEvents('house_listening_event_808s', [
          // A quiet eighth-note spine keeps the rolls legible.
          ...createClosedHatPulse(totalTicks),

          // Bar 1: establish the halftime snare, then let the 808s answer it.
          [0, 'lowTom', 88],
          [0, 'kick', 127],
          [(PPQ * 3) / 4, 'kick', 104],
          [(PPQ * 7) / 4, 'lowTom', 112],
          [PPQ * 2, 'snare', 120],
          [(PPQ * 5) / 2, 'kick', 116],
          [(PPQ * 13) / 4, 'lowTom', 102],
          [(PPQ * 3) + sixteenthNoteTicks, 'closedHat', 68],
          [(PPQ * 3) + sixteenthNoteTicks + thirtySecondNoteTicks, 'closedHat', 76],
          [(PPQ * 3) + eighthNoteTicks + thirtySecondNoteTicks, 'closedHat', 84],
          [(PPQ * 15) / 4, 'closedHat', 92],
          [barTicks - thirtySecondNoteTicks, 'closedHat', 100],

          // Bar 2: pitched 808 answers and a ghost snare fake the turnaround.
          [bar2, 'kick', 124],
          [bar2 + eighthNoteTicks, 'lowTom', 106],
          [bar2 + (PPQ * 5) / 4, 'kick', 112],
          [bar2 + (PPQ * 7) / 4, 'lowTom', 118],
          [bar2 + (PPQ * 2), 'snare', 122],
          [bar2 + (PPQ * 2) + sixteenthNoteTicks, 'kick', 108],
          [bar2 + (PPQ * 11) / 4, 'lowTom', 114],
          [bar2 + (PPQ * 3), 'kick', 120],
          [bar2 + (PPQ * 15) / 4, 'snare', 48],

          // Bar 3: bII lands on the higher 808 before the sub drops beneath it.
          [bar3, 'lowTom', 124],
          [bar3 + (PPQ * 3) / 4, 'kick', 116],
          [bar3 + (PPQ * 3) / 2, 'kick', 108],
          [bar3 + (PPQ * 2), 'snare', 124],
          [bar3 + (PPQ * 2) + sixteenthNoteTicks, 'kick', 110],
          [bar3 + (PPQ * 11) / 4, 'lowTom', 118],
          [bar3 + (PPQ * 13) / 4, 'kick', 122],
          [bar3 + (PPQ * 3) + sixteenthNoteTicks, 'closedHat', 70],
          [bar3 + (PPQ * 3) + sixteenthNoteTicks + thirtySecondNoteTicks, 'closedHat', 78],
          [bar3 + (PPQ * 15) / 4, 'closedHat', 90],
          [bar3 + barTicks - thirtySecondNoteTicks, 'closedHat', 104],

          // Bar 4: the beat disappears, then claws back through a tuned fill.
          [bar4, 'kick', 120],
          [bar4 + (PPQ * 2), 'snare', 126],
          [bar4 + (PPQ * 5) / 2, 'kick', 112],
          [bar4 + (PPQ * 3), 'lowTom', 106],
          [bar4 + (PPQ * 3) + sixteenthNoteTicks, 'kick', 112],
          [bar4 + (PPQ * 3) + eighthNoteTicks, 'lowTom', 118],
          [bar4 + (PPQ * 3) + eighthNoteTicks + thirtySecondNoteTicks, 'closedHat', 88],
          [bar4 + (PPQ * 15) / 4, 'kick', 124],
          [bar4 + barTicks - thirtySecondNoteTicks, 'lowTom', 127],

          // Bar 5: possession — dense 808 punctuation around the fixed backbeat.
          [bar5, 'lowTom', 104],
          [bar5, 'kick', 127],
          [bar5 + sixteenthNoteTicks, 'kick', 104],
          [bar5 + (PPQ * 3) / 4, 'lowTom', 116],
          [bar5 + (PPQ * 5) / 4, 'kick', 110],
          [bar5 + (PPQ * 7) / 4, 'lowTom', 120],
          [bar5 + (PPQ * 2), 'snare', 127],
          [bar5 + (PPQ * 2) + sixteenthNoteTicks, 'kick', 114],
          [bar5 + (PPQ * 11) / 4, 'kick', 122],
          [bar5 + (PPQ * 13) / 4, 'lowTom', 116],
          [bar5 + (PPQ * 15) / 4, 'kick', 124],

          // Bar 6: a triplet 808 stutter twists against the straight hats.
          [bar6, 'kick', 126],
          [bar6 + tripletTicks, 'lowTom', 104],
          [bar6 + (tripletTicks * 2), 'kick', 112],
          [bar6 + (PPQ * 3) / 2, 'lowTom', 118],
          [bar6 + (PPQ * 2), 'snare', 126],
          [bar6 + (PPQ * 2) + tripletTicks, 'kick', 108],
          [bar6 + (PPQ * 2) + (tripletTicks * 2), 'lowTom', 116],
          [bar6 + (PPQ * 3), 'kick', 122],
          [bar6 + (PPQ * 15) / 4, 'snare', 52],

          // Bar 7: the borrowed chord returns under a full hat-roll panic.
          [bar7, 'lowTom', 127],
          [bar7 + eighthNoteTicks, 'kick', 112],
          [bar7 + (PPQ * 5) / 4, 'kick', 116],
          [bar7 + (PPQ * 7) / 4, 'lowTom', 122],
          [bar7 + (PPQ * 2), 'snare', 127],
          [bar7 + (PPQ * 2) + sixteenthNoteTicks, 'kick', 116],
          [bar7 + (PPQ * 5) / 2, 'closedHat', 74],
          [bar7 + (PPQ * 5) / 2 + thirtySecondNoteTicks, 'closedHat', 82],
          [bar7 + (PPQ * 11) / 4, 'kick', 124],
          [bar7 + (PPQ * 3) + sixteenthNoteTicks, 'closedHat', 86],
          [bar7 + (PPQ * 3) + sixteenthNoteTicks + thirtySecondNoteTicks, 'closedHat', 94],
          [bar7 + (PPQ * 15) / 4, 'kick', 126],

          // Bar 8: snare and tuned-808 rolls sprint into the unresolved E chord.
          [bar8, 'kick', 127],
          [bar8 + (PPQ * 3) / 4, 'lowTom', 116],
          [bar8 + (PPQ * 3) / 2, 'kick', 122],
          [bar8 + (PPQ * 2), 'lowTom', 106],
          [bar8 + (PPQ * 2), 'snare', 127],
          [bar8 + (PPQ * 2) + sixteenthNoteTicks, 'kick', 116],
          [bar8 + (PPQ * 5) / 2, 'lowTom', 120],
          [bar8 + (PPQ * 11) / 4, 'kick', 124],
          [bar8 + (PPQ * 3), 'snare', 76],
          [bar8 + (PPQ * 3) + sixteenthNoteTicks, 'lowTom', 112],
          [bar8 + (PPQ * 3) + eighthNoteTicks, 'snare', 92],
          [bar8 + (PPQ * 3) + eighthNoteTicks + thirtySecondNoteTicks, 'kick', 120],
          [bar8 + (PPQ * 15) / 4, 'snare', 108],
          [bar8 + (PPQ * 15) / 4 + thirtySecondNoteTicks, 'lowTom', 124],
          [bar8 + barTicks - thirtySecondNoteTicks, 'kick', 127],
        ]),
        id: 'house_listening_pattern_808s',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'halftime trap with tuned 808 answers and panic-roll hats',
        },
        name: '808s — Something Is Running',
      }), drumBlockTicks, [
        '808s I — Footsteps',
        '808s II — Door Opens',
        '808s III — Possession',
        '808s IV — Run',
      ]),
    ]),
    project: createProject({
      id: 'project_the_house_is_listening',
      metadata: createProjectMetadata({
        description: 'An eight-bar haunted-piano beat in A minor, with possessed 808s, an E-centered earworm, and bII borrowed from A Phrygian.',
        tags: ['haunted', 'piano', '808', 'modal-interchange', 'earworm'],
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
